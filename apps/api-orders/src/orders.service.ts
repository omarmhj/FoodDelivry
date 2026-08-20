import { Injectable, BadRequestException, NotFoundException, Logger, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RabbitMQService } from '../../../libs/shared/src/rabbitmq.service';
import { RedisService } from '../../../libs/shared/src/redis.service';
import { MESSAGE_PATTERNS, CACHE_KEYS } from '../../../libs/shared/src/message-patterns';
import {
  CreateOrderDto,
  CreateOrderItemDto,
  UpdateOrderStatusDto,
  RejectOrderDto,
  CancelOrderDto,
  GetOrdersFilterDto,
  CreateOrderReviewDto,
  OrderStatus,
  PaymentStatus,
  DeliveryType,
} from './dto/order.dto';
import {
  OrderCalculation,
  OrderEventData,
  OrderValidationResult,
  MenuItemValidation,
  PricedOrderItem,
} from './types/order.types';
import { OrdersGateway } from './orders.gateway';

/** Sales tax applied to the subtotal. Owned here, never accepted from a client. */
const TAX_RATE = 0.08;

/** Flat fee charged on delivery orders. Owned here, never accepted from a client. */
const DELIVERY_FEE = 5.99;

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly rabbitMQService: RabbitMQService,
    private readonly redisService: RedisService,
    private readonly ordersGateway: OrdersGateway,
  ) {}

  /**
   * Create a new order
   */
  async createOrder(createOrderDto: CreateOrderDto) {
    this.logger.log(`📋 Creating order for customer: ${createOrderDto.customerName}`);

    try {
      // 1. Validate customer exists and is active
      const customerValidation = await this.rabbitMQService.sendAndWait(
        'user.validate',
        { userId: createOrderDto.customerId }
      );

      if (!customerValidation.isValid) {
        throw new BadRequestException(`Invalid customer: ${customerValidation.error}`);
      }

      // 2. Validate restaurant exists and is active
      const restaurantValidation = await this.rabbitMQService.sendAndWait(
        'restaurant.validate',
        { restaurantId: createOrderDto.restaurantId }
      );

      if (!restaurantValidation.isValid) {
        throw new BadRequestException(`Invalid restaurant: ${restaurantValidation.error}`);
      }

      // 3. Validate order shape before involving another service
      const validation = await this.validateOrderItems(createOrderDto.items);
      if (!validation.isValid) {
        throw new BadRequestException(`Order validation failed: ${validation.errors.join(', ')}`);
      }

      // 4. Have the restaurants service validate and price the cart. It is the
      // only authority on money: we send ids and quantities, and it returns the
      // lines to persist. Anything price-shaped in the request is discarded,
      // which is what stops a client from choosing what it pays.
      const menuItemsValidation = await this.rabbitMQService.sendAndWait(
        'menu.validateItems',
        {
          restaurantId: createOrderDto.restaurantId,
          items: createOrderDto.items.map(item => ({
            menuItemId: item.menuItemId,
            quantity: item.quantity,
            selectedOptionIds: item.selectedOptionIds ?? [],
          })),
        }
      );

      if (!menuItemsValidation.isValid) {
        throw new BadRequestException(`Invalid menu items: ${menuItemsValidation.error}`);
      }

      const pricedItems: PricedOrderItem[] = menuItemsValidation.items ?? [];

      // The priced lines come back in request order, one per requested line, which
      // is what lets them be paired up by index below. Bail out rather than
      // guessing if that ever stops holding.
      if (pricedItems.length !== createOrderDto.items.length) {
        throw new BadRequestException('Menu item pricing did not cover every requested item');
      }

      // 5. Derive every monetary field from the priced lines
      const calculation = this.calculateOrderTotals(pricedItems, createOrderDto.deliveryType);
      
      // Generate unique order number
      const orderNumber = await this.generateOrderNumber();

      // Calculate estimated delivery time
      const estimatedDeliveryTime = this.calculateEstimatedDeliveryTime(
        createOrderDto.deliveryType,
        createOrderDto.restaurantId
      );

      // 6. Create order with items
      const order = await this.prisma.order.create({
        data: {
          orderNumber,
          customerId: createOrderDto.customerId,
          customerName: createOrderDto.customerName,
          customerEmail: createOrderDto.customerEmail,
          customerPhone: createOrderDto.customerPhone,
          restaurantId: createOrderDto.restaurantId,
          restaurantName: createOrderDto.restaurantName,
          restaurantAddress: createOrderDto.restaurantAddress,
          status: OrderStatus.PENDING,
          paymentStatus: PaymentStatus.PENDING,
          deliveryType: createOrderDto.deliveryType,
          subtotal: calculation.subtotal,
          tax: calculation.tax,
          deliveryFee: calculation.deliveryFee,
          discount: calculation.discount,
          total: calculation.total,
          deliveryAddress: createOrderDto.deliveryAddress,
          deliveryInstructions: createOrderDto.deliveryInstructions,
          specialInstructions: createOrderDto.specialInstructions,
          metadata: {
            deliveryLatitude: createOrderDto.deliveryLatitude,
            deliveryLongitude: createOrderDto.deliveryLongitude,
            restaurantLatitude: restaurantValidation.restaurant?.latitude,
            restaurantLongitude: restaurantValidation.restaurant?.longitude,
          },
          estimatedDeliveryTime,
          items: {
            create: pricedItems.map((item, index) => ({
              menuItemId: item.menuItemId,
              menuItemName: item.menuItemName,
              menuItemDescription: item.menuItemDescription,
              menuItemImage: item.menuItemImage,
              quantity: item.quantity,
              basePrice: item.basePrice,
              optionsTotal: item.optionsTotal,
              unitPrice: item.unitPrice,
              totalPrice: item.totalPrice,
              selectedOptions: item.selectedOptions,
              // Free text is the one part of a line the client still owns, so it
              // is carried across from the matching requested line.
              specialRequests: createOrderDto.items[index].specialRequests,
            })),
          },
        },
        include: {
          items: true,
        },
      });

      // Create initial status history
      await this.createStatusHistory(order.id, OrderStatus.PENDING, null, 'Order placed by customer');

      // Get status history
      const statusHistory = await this.prisma.orderStatusHistory.findMany({
        where: { orderId: order.id },
        orderBy: { timestamp: 'asc' },
      });

      // Attach status history to order
      const orderWithHistory = this.attachTrackingCoords({
        ...order,
        statusHistory,
      });

      // Cache order data
      await this.cacheOrder(orderWithHistory);

      // Publish order created event
      await this.publishOrderEvent('order.placed', order);

      this.logger.log(`✅ Order created successfully: ${orderNumber}`);

      return {
        message: 'Order placed successfully',
        order: orderWithHistory,
      };
    } catch (error: any) {
      this.logger.error(`❌ Failed to create order:`, error.message || 'Unknown error');
      this.logger.error(`Error details:`, JSON.stringify(error, null, 2));
      this.logger.error(`Error type:`, error.constructor.name);
      if (error.stack) {
        this.logger.error(`Error stack:`, error.stack);
      }
      throw error;
    }
  }

  /**
   * Update order status
   */
  async updateOrderStatus(updateStatusDto: UpdateOrderStatusDto, context?: Record<string, unknown>) {
    this.logger.log(`Updating order ${updateStatusDto.orderId} to status: ${updateStatusDto.status}`);

    try {
      const existingOrder = await this.prisma.order.findUnique({
        where: { id: updateStatusDto.orderId },
        include: { items: true },
      });

      if (!existingOrder) {
        throw new NotFoundException('Order not found');
      }

      // Validate status transition
      this.validateStatusTransition(existingOrder.status, updateStatusDto.status);

      // Validate changedBy ID if provided
      if (updateStatusDto.changedBy && updateStatusDto.changedByRole) {
        await this.validateChangedBy(updateStatusDto.changedBy, updateStatusDto.changedByRole);
      }

      const previousStatus = existingOrder.status;
      const updateData: any = {
        status: updateStatusDto.status,
        updatedAt: new Date(),
      };

      // Set timestamps based on status
      switch (updateStatusDto.status) {
        case OrderStatus.CONFIRMED:
          updateData.cookingStartedAt = new Date();
          break;
        case OrderStatus.REJECTED:
          if (!updateStatusDto.reason) {
            throw new BadRequestException('A reason is required when rejecting an order');
          }
          updateData.rejectedAt = new Date();
          updateData.rejectionReason = updateStatusDto.reason;
          break;
        case OrderStatus.READY:
          updateData.readyAt = new Date();
          break;
        case OrderStatus.OUT_FOR_DELIVERY:
          updateData.pickedUpAt = new Date();
          break;
        case OrderStatus.DELIVERED:
          updateData.deliveredAt = new Date();
          updateData.actualDeliveryTime = new Date();
          break;
      }

      // Update order
      const updatedOrder = await this.prisma.order.update({
        where: { id: updateStatusDto.orderId },
        data: updateData,
        include: { items: true },
      });

      // Create status history entry
      await this.createStatusHistory(
        updatedOrder.id,
        updateStatusDto.status,
        previousStatus,
        updateStatusDto.reason,
        updateStatusDto.changedBy,
        updateStatusDto.changedByRole
      );

      // Get updated status history
      const statusHistory = await this.prisma.orderStatusHistory.findMany({
        where: { orderId: updatedOrder.id },
        orderBy: { timestamp: 'asc' },
      });

      // Attach status history to order
      const orderWithHistory = {
        ...updatedOrder,
        statusHistory,
      };

      // Update cache
      await this.cacheOrder(orderWithHistory);

      // Publish status update event
      await this.publishOrderEvent('order.status.updated', updatedOrder, previousStatus);

      this.logger.log(`✅ Order status updated successfully: ${updatedOrder.orderNumber}`);

      return {
        message: 'Order status updated successfully',
        order: orderWithHistory,
      };
    } catch (error: any) {
      this.logger.error(`❌ Failed to update order status:`, error.message);
      throw error;
    }
  }

  /**
   * Reject an order on behalf of the restaurant.
   *
   * Distinct from cancellation: only the restaurant may reject, only before the
   * food is being prepared, and a reason is always recorded so the customer app
   * can explain the outcome.
   */
  async rejectOrder(rejectOrderDto: RejectOrderDto) {
    this.logger.log(`🚫 Rejecting order: ${rejectOrderDto.orderId}`);

    try {
      const existingOrder = await this.prisma.order.findUnique({
        where: { id: rejectOrderDto.orderId },
        include: { items: true },
      });

      if (!existingOrder) {
        throw new NotFoundException('Order not found');
      }

      // Required, not optional: an absent actor must not skip the ownership check.
      if (rejectOrderDto.rejectedBy !== existingOrder.restaurantId) {
        throw new ForbiddenException('Only the restaurant can reject this order');
      }

      this.validateStatusTransition(existingOrder.status, OrderStatus.REJECTED);

      const previousStatus = existingOrder.status;

      const rejectedOrder = await this.prisma.order.update({
        where: { id: rejectOrderDto.orderId },
        data: {
          status: OrderStatus.REJECTED,
          rejectedAt: new Date(),
          rejectionReason: rejectOrderDto.reason,
          updatedAt: new Date(),
        },
        include: { items: true },
      });

      await this.createStatusHistory(
        rejectedOrder.id,
        OrderStatus.REJECTED,
        previousStatus,
        rejectOrderDto.reason,
        rejectOrderDto.rejectedBy,
        'RESTAURANT',
      );

      const statusHistory = await this.prisma.orderStatusHistory.findMany({
        where: { orderId: rejectedOrder.id },
        orderBy: { timestamp: 'asc' },
      });

      const orderWithHistory = { ...rejectedOrder, statusHistory };

      await this.cacheOrder(orderWithHistory);
      await this.publishOrderEvent('order.rejected', rejectedOrder, previousStatus);

      this.logger.log(`✅ Order rejected: ${rejectedOrder.orderNumber}`);

      return {
        message: 'Order rejected successfully',
        order: orderWithHistory,
      };
    } catch (error: any) {
      this.logger.error(`❌ Failed to reject order:`, error.message);
      throw error;
    }
  }

  /**
   * Cancel order
   */
  async cancelOrder(cancelOrderDto: CancelOrderDto, context?: Record<string, unknown>) {
    this.logger.log(`❌ Cancelling order: ${cancelOrderDto.orderId}`);

    try {
      const existingOrder = await this.prisma.order.findUnique({
        where: { id: cancelOrderDto.orderId },
        include: { items: true },
      });

      if (!existingOrder) {
        throw new NotFoundException('Order not found');
      }

      // Check if order can be cancelled
      if (!this.canCancelOrder(existingOrder.status)) {
        throw new BadRequestException(`Cannot cancel order with status: ${existingOrder.status}`);
      }

      // Verify the canceller is authorized (customer who placed the order or the restaurant)
      let changedByRole = 'CUSTOMER';
      if (cancelOrderDto.cancelledBy) {
        const isCustomer = cancelOrderDto.cancelledBy === existingOrder.customerId;
        const isRestaurant = cancelOrderDto.cancelledBy === existingOrder.restaurantId;
        
        if (!isCustomer && !isRestaurant) {
          throw new ForbiddenException('You are not authorized to cancel this order');
        }
        
        changedByRole = isRestaurant ? 'RESTAURANT' : 'CUSTOMER';
      }

      const previousStatus = existingOrder.status;
      
      // Update order to cancelled
      const cancelledOrder = await this.prisma.order.update({
        where: { id: cancelOrderDto.orderId },
        data: {
          status: OrderStatus.CANCELLED,
          notes: cancelOrderDto.reason,
          updatedAt: new Date(),
        },
        include: { items: true },
      });

      // Create status history
      await this.createStatusHistory(
        cancelledOrder.id,
        OrderStatus.CANCELLED,
        previousStatus,
        cancelOrderDto.reason || 'Order cancelled',
        cancelOrderDto.cancelledBy,
        changedByRole
      );

      // Get updated status history
      const statusHistory = await this.prisma.orderStatusHistory.findMany({
        where: { orderId: cancelledOrder.id },
        orderBy: { timestamp: 'asc' },
      });

      // Attach status history to order
      const orderWithHistory = {
        ...cancelledOrder,
        statusHistory,
      };

      // Update cache
      await this.cacheOrder(orderWithHistory);

      // Publish cancellation event
      await this.publishOrderEvent('order.cancelled', cancelledOrder, previousStatus);

      this.logger.log(`✅ Order cancelled successfully: ${cancelledOrder.orderNumber}`);

      return {
        message: 'Order cancelled successfully',
        order: orderWithHistory,
      };
    } catch (error: any) {
      this.logger.error(`❌ Failed to cancel order:`, error.message);
      throw error;
    }
  }

  /**
   * Get orders with filtering
   */
  async getOrders(filterDto: GetOrdersFilterDto) {
    this.logger.log(`📋 Getting orders with filters:`, filterDto);

    try {
      const where: any = {};
      
      if (filterDto.customerId) where.customerId = filterDto.customerId;
      if (filterDto.restaurantId) where.restaurantId = filterDto.restaurantId;
      if (filterDto.status) where.status = filterDto.status;
      if (filterDto.deliveryType) where.deliveryType = filterDto.deliveryType;

      const limit = filterDto.limit || 20;
      const skip = filterDto.skip || 0;

      const [orders, total] = await Promise.all([
        this.prisma.order.findMany({
          where,
          include: { items: true },
          orderBy: { createdAt: 'desc' },
          take: limit,
          skip,
        }),
        this.prisma.order.count({ where }),
      ]);

      return {
        orders: orders.map((order) => this.attachTrackingCoords(order)),
        total,
        limit,
        skip,
      };
    } catch (error: any) {
      this.logger.error(`❌ Failed to get orders:`, error.message);
      throw error;
    }
  }

  /**
   * Get single order by ID
   */
  async getOrderById(orderId: string) {
    this.logger.log(`📋 Getting order by ID: ${orderId}`);

    try {
      // Try cache first
      const cachedOrder = await this.getCachedOrder(orderId);
      if (cachedOrder) {
        this.logger.log(`🎯 Order found in cache: ${orderId}`);
        // Return cached order (should already include statusHistory)
        return this.attachTrackingCoords(cachedOrder);
      }

      this.logger.log(`💾 Cache miss - fetching from database: ${orderId}`);

      // Get from database
      const order = await this.prisma.order.findUnique({
        where: { id: orderId },
        include: { items: true },
      });

      if (!order) {
        throw new NotFoundException('Order not found');
      }

      // Get status history
      const statusHistory = await this.prisma.orderStatusHistory.findMany({
        where: { orderId: orderId },
        orderBy: { timestamp: 'asc' },
      });

      // Attach status history to order
      const orderWithHistory = {
        ...order,
        statusHistory,
      };

      // Cache the complete order with status history
      const hydrated = this.attachTrackingCoords(orderWithHistory);
      await this.cacheOrder(hydrated);
      this.logger.log(`💾 Order cached: ${orderId}`);

      return hydrated;
    } catch (error: any) {
      this.logger.error(`❌ Failed to get order:`, error.message);
      throw error;
    }
  }

  /**
   * Create order review
   */
  async createOrderReview(
    reviewDto: CreateOrderReviewDto,
    authUser: { id: string; role: string; email?: string },
  ) {
    this.logger.log(`⭐ Creating review for order: ${reviewDto.orderId}`);

    try {
      if (!authUser?.id) {
        throw new ForbiddenException('Authentication required to create a review');
      }

      // Check if order exists and is delivered
      const order = await this.prisma.order.findUnique({
        where: { id: reviewDto.orderId },
      });

      if (!order) {
        throw new NotFoundException('Order not found');
      }

      if (order.status !== OrderStatus.DELIVERED) {
        throw new BadRequestException('Can only review delivered orders');
      }

      const isAdmin = authUser.role === 'Admin';
      const isOrderCustomer = authUser.id === order.customerId;

      if (!isAdmin && !isOrderCustomer) {
        throw new ForbiddenException('You can only review orders placed by you');
      }

      // Check if review already exists
      const existingReview = await this.prisma.orderReview.findUnique({
        where: { orderId: reviewDto.orderId },
      });

      if (existingReview) {
        throw new BadRequestException('Order already reviewed');
      }

      const customerId = order.customerId;
      const restaurantId = order.restaurantId;

      // Create review
      const review = await this.prisma.orderReview.create({
        data: {
          orderId: reviewDto.orderId,
          customerId,
          restaurantId,
          rating: reviewDto.rating,
          comment: reviewDto.comment,
          foodQuality: reviewDto.foodQuality,
          deliverySpeed: reviewDto.deliverySpeed,
          customerService: reviewDto.customerService,
          isPublic: true,
          isVerified: isAdmin, // Admin reviews are automatically verified
        },
      });

      // Publish review created event
      await this.rabbitMQService.emitEvent('order.reviewed', {
        orderId: review.orderId,
        customerId,
        restaurantId,
        rating: review.rating,
        comment: review.comment,
        createdBy: authUser.id,
        createdByRole: authUser.role,
        timestamp: new Date(),
      });

      this.logger.log(`✅ Review created successfully for order: ${reviewDto.orderId}`);

      return {
        message: 'Review created successfully',
        review,
      };
    } catch (error: any) {
      this.logger.error(`❌ Failed to create review:`, error.message);
      throw error;
    }
  }

  // Private helper methods

  /**
   * Structural checks only. Item existence, availability, option rules, and every
   * price are the restaurants service's responsibility — see `menu.validateItems`.
   */
  private async validateOrderItems(items: CreateOrderItemDto[]): Promise<OrderValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!items || items.length === 0) {
      errors.push('Order must contain at least one item');
      return { isValid: false, errors, warnings };
    }

    if (items.length > 50) {
      errors.push('Order cannot contain more than 50 items');
    }

    // The same menu item may legitimately appear on several lines — one pizza with
    // extra cheese and one without are two lines of the same item — so lines are
    // kept distinct and paired positionally rather than deduplicated by id.

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Builds the order totals from the priced lines returned by the restaurants
   * service. Tax and delivery fee are policy owned by this service; none of these
   * figures can be supplied by the caller.
   */
  private calculateOrderTotals(
    pricedItems: PricedOrderItem[],
    deliveryType: DeliveryType,
  ): OrderCalculation {
    const subtotal = this.roundMoney(
      pricedItems.reduce((sum, item) => sum + item.totalPrice, 0),
    );
    const tax = this.roundMoney(subtotal * TAX_RATE);
    const deliveryFee = deliveryType === DeliveryType.DELIVERY ? DELIVERY_FEE : 0;
    const discount = 0;
    const total = this.roundMoney(subtotal + tax + deliveryFee - discount);

    return { subtotal, tax, deliveryFee, discount, total };
  }

  /** Keeps derived money values at two decimals so floating point drift never reaches a total. */
  private roundMoney(value: number): number {
    return Math.round(value * 100) / 100;
  }

  private async generateOrderNumber(): Promise<string> {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `ORD-${timestamp}-${random}`;
  }

  private calculateEstimatedDeliveryTime(deliveryType: DeliveryType, restaurantId: string): Date {
    const now = new Date();
    let minutes = 30; // Default preparation time

    switch (deliveryType) {
      case DeliveryType.PICKUP:
        minutes = 20;
        break;
      case DeliveryType.DELIVERY:
        minutes = 45;
        break;
      case DeliveryType.DINE_IN:
        minutes = 25;
        break;
    }

    return new Date(now.getTime() + minutes * 60000);
  }

  private validateStatusTransition(currentStatus: OrderStatus, newStatus: OrderStatus): void {
    const validTransitions: Record<OrderStatus, OrderStatus[]> = {
      // A restaurant may only decline before it starts cooking; after that the
      // food exists and the order has to be cancelled instead.
      [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.REJECTED, OrderStatus.CANCELLED],
      [OrderStatus.CONFIRMED]: [OrderStatus.PREPARING, OrderStatus.REJECTED, OrderStatus.CANCELLED],
      [OrderStatus.PREPARING]: [OrderStatus.READY, OrderStatus.CANCELLED],
      [OrderStatus.READY]: [OrderStatus.OUT_FOR_DELIVERY, OrderStatus.DELIVERED],
      [OrderStatus.OUT_FOR_DELIVERY]: [OrderStatus.DELIVERED],
      [OrderStatus.DELIVERED]: [], // Final state
      [OrderStatus.CANCELLED]: [], // Final state
      [OrderStatus.REJECTED]: [], // Final state
    };

    if (!validTransitions[currentStatus]?.includes(newStatus)) {
      throw new BadRequestException(`Invalid status transition from ${currentStatus} to ${newStatus}`);
    }
  }

  private canCancelOrder(status: OrderStatus): boolean {
    const cancellableStatuses: OrderStatus[] = [OrderStatus.PENDING, OrderStatus.CONFIRMED, OrderStatus.PREPARING];
    return cancellableStatuses.includes(status);
  }

  private attachTrackingCoords<T extends { metadata?: unknown }>(order: T) {
    const raw = order.metadata;
    const meta =
      raw && typeof raw === 'object' && !Array.isArray(raw)
        ? (raw as Record<string, unknown>)
        : {};
    const asNum = (value: unknown): number | undefined =>
      typeof value === 'number' && Number.isFinite(value) ? value : undefined;
    return {
      ...order,
      deliveryLatitude: asNum(meta.deliveryLatitude),
      deliveryLongitude: asNum(meta.deliveryLongitude),
      restaurantLatitude: asNum(meta.restaurantLatitude),
      restaurantLongitude: asNum(meta.restaurantLongitude),
    };
  }

  private async createStatusHistory(
    orderId: string,
    status: OrderStatus,
    previousStatus: OrderStatus | null,
    reason?: string,
    changedBy?: string,
    changedByRole?: string
  ): Promise<void> {
    await this.prisma.orderStatusHistory.create({
      data: {
        orderId,
        status,
        previousStatus,
        reason,
        changedBy,
        changedByRole,
      },
    });
  }

  private async cacheOrder(order: any): Promise<void> {
    const cacheKey = CACHE_KEYS.ORDER(order.id);
    
    // Dynamic TTL based on order status:
    // - Active orders (PENDING, CONFIRMED, PREPARING, READY, OUT_FOR_DELIVERY): 1 hour
    //   (Cache refreshes on status updates anyway)
    // - Finalized orders (DELIVERED, CANCELLED, REJECTED): 24 hours
    //   (These don't change, so longer cache is safe and beneficial)
    const isFinalized = order.status === OrderStatus.DELIVERED || 
                        order.status === OrderStatus.CANCELLED ||
                        order.status === OrderStatus.REJECTED;
    const ttl = isFinalized ? 86400 : 3600; // 24 hours for finalized, 1 hour for active
    
    await this.redisService.set(cacheKey, order, ttl);
    this.logger.log(`💾 Cached order ${order.id} with TTL: ${ttl}s (${ttl / 3600}h)`);
  }

  private async getCachedOrder(orderId: string): Promise<any> {
    const cacheKey = CACHE_KEYS.ORDER(orderId);
    return this.redisService.getJson(cacheKey);
  }

  private async publishOrderEvent(eventType: string, order: any, previousStatus?: OrderStatus): Promise<void> {
    try {
      this.logger.log(`📤 Publishing event: ${eventType} for order: ${order.orderNumber || order.id}`);
      
      const eventData: OrderEventData = {
        orderId: order.id,
        orderNumber: order.orderNumber,
        customerId: order.customerId,
        restaurantId: order.restaurantId,
        status: order.status,
        previousStatus,
        total: order.total,
        items: order.items.map((item: any) => ({
          menuItemId: item.menuItemId,
          menuItemName: item.menuItemName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
        deliveryType: order.deliveryType,
        deliveryAddress: order.deliveryAddress,
        timestamp: new Date(),
        metadata: {
          customerName: order.customerName,
          customerEmail: order.customerEmail,
          restaurantName: order.restaurantName,
          estimatedDeliveryTime: order.estimatedDeliveryTime,
        },
      };

      this.logger.log(`📤 Event data prepared for ${eventType}:`, JSON.stringify(eventData, null, 2));
      await this.rabbitMQService.emitEvent(eventType, eventData);
      this.ordersGateway.broadcastOrderEvent({
        type: eventType,
        orderId: order.id,
        orderNumber: order.orderNumber,
        restaurantId: order.restaurantId,
        status: order.status,
      });
      this.logger.log(`✅ Event ${eventType} published successfully`);
    } catch (error: any) {
      this.logger.error(`❌ Failed to publish event ${eventType}:`, error.message);
      this.logger.error(`❌ Error stack:`, error.stack);
    }
  }

  /**
   * Validate that changedBy ID exists and matches the role
   */
  private async validateChangedBy(changedById: string, role: string): Promise<void> {
    try {
      if (role === 'RESTAURANT') {
        // Validate restaurant exists
        const restaurantValidation = await this.rabbitMQService.sendAndWait(
          'restaurant.validate',
          { restaurantId: changedById }
        );
        
        if (!restaurantValidation.isValid) {
          throw new BadRequestException(
            `Invalid restaurant ID for changedBy: ${changedById}. ${restaurantValidation.error || 'Restaurant not found'}`
          );
        }
        
        this.logger.log(`✅ Validated restaurant ID: ${changedById} (${restaurantValidation.restaurant?.name || 'Unknown'})`);
      } else if (role === 'CUSTOMER' || role === 'DRIVER' || role === 'ADMIN') {
        // Validate user exists
        const userValidation = await this.rabbitMQService.sendAndWait(
          'user.validate',
          { userId: changedById }
        );
        
        if (!userValidation.isValid) {
          throw new BadRequestException(
            `Invalid user ID for changedBy: ${changedById}. ${userValidation.error || 'User not found'}`
          );
        }
        
        // If role is ADMIN, verify user has Admin role
        if (role === 'ADMIN' && userValidation.user?.role !== 'Admin') {
          throw new BadRequestException(
            `User ${changedById} does not have Admin role`
          );
        }
        
        this.logger.log(`✅ Validated user ID: ${changedById} (${userValidation.user?.name || 'Unknown'}, role: ${userValidation.user?.role || 'Unknown'})`);
      } else if (role === 'SYSTEM') {
        // SYSTEM role doesn't need validation
        this.logger.log(`ℹ️ System change - no validation needed`);
      } else {
        this.logger.warn(`⚠️ Unknown role: ${role} - validation skipped`);
      }
    } catch (error: any) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      // If validation service is unavailable, log warning but don't fail
      this.logger.warn(`⚠️ Could not validate changedBy ID ${changedById} with role ${role}: ${error.message}`);
    }
  }
}


