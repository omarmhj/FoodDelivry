import { Resolver, Mutation, Query, Args, Context, Int } from '@nestjs/graphql';
import { UseGuards, Logger, ForbiddenException } from '@nestjs/common';
import { OrdersService } from './orders.service';
import {
  CreateOrderDto,
  UpdateOrderStatusDto,
  RejectOrderDto,
  CancelOrderDto,
  GetOrdersFilterDto,
  CreateOrderReviewDto,
  OrderStatus,
} from './dto/order.dto';
import {
  Order,
  CreateOrderResponse,
  UpdateOrderStatusResponse,
  CancelOrderResponse,
  GetOrdersResponse,
  CreateOrderReviewResponse,
} from './entities/order.entities';
import { AuthGuard } from './guards/auth.guard';
import type { 
  Order as PrismaOrder, 
  OrderItem as PrismaOrderItem,
  OrderReview as PrismaOrderReview
} from '@prisma/orders-client';

@Resolver('Order')
export class OrdersResolver {
  private readonly logger = new Logger(OrdersResolver.name);

  constructor(private readonly ordersService: OrdersService) {}

  @Mutation(() => CreateOrderResponse)
  @UseGuards(AuthGuard)
  async createOrder(
    @Args('createOrderDto') createOrderDto: CreateOrderDto,
    @Context() context: Record<string, unknown>,
  ): Promise<CreateOrderResponse> {
    try {
      this.logger.log(`📋 Creating order for customer: ${createOrderDto.customerName}`);
      
      const result = await this.ordersService.createOrder(createOrderDto);
      
      return {
        message: result.message,
        order: result.order as unknown as Order,
        error: null,
      };
    } catch (error) {
      const errorMessage = error?.message || error?.error?.message || 'Unknown error occurred';
      const errorCode = error?.code || error?.error?.code || 'CREATE_ORDER_FAILED';
      
      this.logger.error(`❌ Failed to create order:`, errorMessage);
      this.logger.error(`Error details:`, error);
      
      return {
        message: 'Failed to create order',
        order: null,
        error: {
          message: errorMessage,
          code: errorCode,
        },
      };
    }
  }

  @Mutation(() => UpdateOrderStatusResponse)
  @UseGuards(AuthGuard)
  async updateOrderStatus(
    @Args('updateStatusDto') updateStatusDto: UpdateOrderStatusDto,
    @Context() context: Record<string, unknown>,
  ): Promise<UpdateOrderStatusResponse> {
    try {
      this.logger.log(`🔄 Updating order status: ${updateStatusDto.orderId} -> ${updateStatusDto.status}`);
      
      // Extract authenticated user/restaurant from context
      const req = context.req as any;
      if (req?.user && !updateStatusDto.changedBy) {
        // Auto-populate changedBy from authenticated user
        updateStatusDto.changedBy = req.user.id;
        if (!updateStatusDto.changedByRole) {
          // Map user roles to order change roles
          if (req.user.role === 'Admin') {
            updateStatusDto.changedByRole = 'ADMIN';
          } else {
            updateStatusDto.changedByRole = 'CUSTOMER'; // Default for User role
          }
        }
      } else if (req?.restaurant && !updateStatusDto.changedBy) {
        // Auto-populate changedBy from authenticated restaurant
        updateStatusDto.changedBy = req.restaurant.id;
        if (!updateStatusDto.changedByRole) {
          updateStatusDto.changedByRole = 'RESTAURANT';
        }
      }
      
      const result = await this.ordersService.updateOrderStatus(updateStatusDto, context);
      
      return {
        message: result.message,
        order: result.order as unknown as Order,
      };
    } catch (error) {
      this.logger.error(`❌ Failed to update order status:`, error.message);
      return {
        message: 'Failed to update order status',
        error: {
          message: error.message,
          code: error.code || 'UPDATE_ORDER_STATUS_FAILED',
        },
      };
    }
  }

  @Mutation(() => UpdateOrderStatusResponse)
  @UseGuards(AuthGuard)
  async rejectOrder(
    @Args('rejectOrderDto') rejectOrderDto: RejectOrderDto,
    @Context() context: Record<string, unknown>,
  ): Promise<UpdateOrderStatusResponse> {
    try {
      this.logger.log(`🚫 Rejecting order: ${rejectOrderDto.orderId}`);

      // The guard puts the authenticated principal's id on the request whether it
      // is a customer or a restaurant, so the actor is always taken from the token
      // and never from the body. The service then checks that id really owns the
      // order's restaurant, which is what makes this restaurant-only.
      const req = context.req as any;
      const actorId = req?.restaurant?.id ?? req?.user?.id;
      if (!actorId) {
        throw new ForbiddenException('Only a restaurant can reject an order');
      }
      rejectOrderDto.rejectedBy = actorId;

      const result = await this.ordersService.rejectOrder(rejectOrderDto);

      return {
        message: result.message,
        order: result.order as unknown as Order,
      };
    } catch (error) {
      this.logger.error(`❌ Failed to reject order:`, error.message);
      return {
        message: 'Failed to reject order',
        error: {
          message: error.message,
          code: error.code || 'REJECT_ORDER_FAILED',
        },
      };
    }
  }

  @Mutation(() => CancelOrderResponse)
  @UseGuards(AuthGuard)
  async cancelOrder(
    @Args('cancelOrderDto') cancelOrderDto: CancelOrderDto,
    @Context() context: Record<string, unknown>,
  ): Promise<CancelOrderResponse> {
    try {
      this.logger.log(`❌ Cancelling order: ${cancelOrderDto.orderId}`);
      
      // Extract authenticated user/restaurant from context
      const req = context.req as any;
      if (req?.user && !cancelOrderDto.cancelledBy) {
        // Auto-populate cancelledBy from authenticated user
        cancelOrderDto.cancelledBy = req.user.id;
      } else if (req?.restaurant && !cancelOrderDto.cancelledBy) {
        // Auto-populate cancelledBy from authenticated restaurant
        cancelOrderDto.cancelledBy = req.restaurant.id;
      }
      
      const result = await this.ordersService.cancelOrder(cancelOrderDto, context);
      
      return {
        message: result.message,
        order: result.order as unknown as Order,
      };
    } catch (error) {
      this.logger.error(`❌ Failed to cancel order:`, error.message);
      return {
        message: 'Failed to cancel order',
        error: {
          message: error.message,
          code: error.code || 'CANCEL_ORDER_FAILED',
        },
      };
    }
  }

  @Query(() => GetOrdersResponse)
  @UseGuards(AuthGuard)
  async getOrders(
    @Args('filterDto', { nullable: true }) filterDto?: GetOrdersFilterDto,
    @Context() context?: Record<string, unknown>,
  ): Promise<GetOrdersResponse> {
    try {
      this.logger.log(`📋 Getting orders with filters:`, filterDto);
      
      const result = await this.ordersService.getOrders(filterDto || {});
      
      return {
        orders: result.orders as unknown as Order[],
        total: result.total,
        limit: result.limit,
        skip: result.skip,
      };
    } catch (error) {
      this.logger.error(`❌ Failed to get orders:`, error.message);
      return {
        orders: [],
        total: 0,
        limit: 0,
        skip: 0,
        error: {
          message: error.message,
          code: error.code || 'GET_ORDERS_FAILED',
        },
      };
    }
  }

  @Query(() => Order)
  @UseGuards(AuthGuard)
  async getOrderById(
    @Args('orderId') orderId: string,
    @Context() context: Record<string, unknown>,
  ): Promise<Order> {
    try {
      this.logger.log(`📋 Getting order by ID: ${orderId}`);
      
      const order = await this.ordersService.getOrderById(orderId);
      return order as unknown as Order;
    } catch (error) {
      this.logger.error(`❌ Failed to get order:`, error.message);
      throw error;
    }
  }

  @Query(() => Order)
  @UseGuards(AuthGuard)
  async getOrderByNumber(
    @Args('orderNumber') orderNumber: string,
    @Context() context: Record<string, unknown>,
  ): Promise<Order> {
    try {
      this.logger.log(`📋 Getting order by number: ${orderNumber}`);
      
      // This would need to be implemented in the service
      // return await this.ordersService.getOrderByNumber(orderNumber);
      throw new Error('Not implemented yet');
    } catch (error) {
      this.logger.error(`❌ Failed to get order by number:`, error.message);
      throw error;
    }
  }

  @Query(() => GetOrdersResponse)
  @UseGuards(AuthGuard)
  async getCustomerOrders(
    @Args('customerId') customerId: string,
    @Args('limit', { nullable: true, type: () => Int }) limit?: number,
    @Args('skip', { nullable: true, type: () => Int }) skip?: number,
    @Context() context?: Record<string, unknown>,
  ): Promise<GetOrdersResponse> {
    try {
      this.logger.log(`📋 Getting orders for customer: ${customerId}`);
      
      const filterDto: GetOrdersFilterDto = {
        customerId,
        limit: limit || 20,
        skip: skip || 0,
      };
      
      const result = await this.ordersService.getOrders(filterDto);
      
      return {
        orders: result.orders as unknown as Order[],
        total: result.total,
        limit: result.limit,
        skip: result.skip,
      };
    } catch (error) {
      this.logger.error(`❌ Failed to get customer orders:`, error.message);
      return {
        orders: [],
        total: 0,
        limit: 0,
        skip: 0,
        error: {
          message: error.message,
          code: error.code || 'GET_CUSTOMER_ORDERS_FAILED',
        },
      };
    }
  }

  @Query(() => GetOrdersResponse)
  @UseGuards(AuthGuard)
  async getRestaurantOrders(
    @Args('restaurantId') restaurantId: string,
    @Args('limit', { nullable: true, type: () => Int }) limit?: number,
    @Args('skip', { nullable: true, type: () => Int }) skip?: number,
    @Context() context?: Record<string, unknown>,
  ): Promise<GetOrdersResponse> {
    try {
      this.logger.log(`📋 Getting orders for restaurant: ${restaurantId}`);
      
      const filterDto: GetOrdersFilterDto = {
        restaurantId,
        limit: limit || 20,
        skip: skip || 0,
      };
      
      const result = await this.ordersService.getOrders(filterDto);
      
      return {
        orders: result.orders as unknown as Order[],
        total: result.total,
        limit: result.limit,
        skip: result.skip,
      };
    } catch (error) {
      this.logger.error(`❌ Failed to get restaurant orders:`, error.message);
      return {
        orders: [],
        total: 0,
        limit: 0,
        skip: 0,
        error: {
          message: error.message,
          code: error.code || 'GET_RESTAURANT_ORDERS_FAILED',
        },
      };
    }
  }

  @Mutation(() => CreateOrderReviewResponse)
  @UseGuards(AuthGuard)
  async createOrderReview(
    @Args('reviewDto') reviewDto: CreateOrderReviewDto,
    @Context() context: Record<string, unknown>,
  ): Promise<CreateOrderReviewResponse> {
    try {
      this.logger.log(`⭐ Creating review for order: ${reviewDto.orderId}`);
      
      const req = context.req as any;
      const authUser = req?.user;

      if (!authUser) {
        throw new ForbiddenException('Authentication required to create a review');
      }

      const result = await this.ordersService.createOrderReview(reviewDto, authUser);
      
      return {
        message: result.message,
        review: result.review as unknown as PrismaOrderReview,
      };
    } catch (error) {
      this.logger.error(`❌ Failed to create order review:`, error.message);
      return {
        message: 'Failed to create order review',
        error: {
          message: error.message,
          code: error.code || 'CREATE_REVIEW_FAILED',
        },
      };
    }
  }

  // Additional utility queries

  @Query(() => [Order])
  @UseGuards(AuthGuard)
  async getActiveOrders(
    @Args('restaurantId', { nullable: true }) restaurantId?: string,
    @Context() context?: Record<string, unknown>,
  ): Promise<Order[]> {
    try {
      this.logger.log(`🔥 Getting active orders${restaurantId ? ` for restaurant: ${restaurantId}` : ''}`);
      
      const filterDto: GetOrdersFilterDto = {
        restaurantId,
        // Get orders that are not delivered or cancelled
        limit: 50,
      };
      
      const result = await this.ordersService.getOrders(filterDto);
      
      // Filter for active orders only
      const activeOrders = result.orders.filter((order: PrismaOrder & { items: PrismaOrderItem[] }) => 
        order.status !== OrderStatus.DELIVERED && order.status !== OrderStatus.CANCELLED
      );
      
      return activeOrders as unknown as Order[];
    } catch (error) {
      this.logger.error(`❌ Failed to get active orders:`, error.message);
      throw error;
    }
  }

  @Query(() => [Order])
  @UseGuards(AuthGuard)
  async getOrdersReadyForPickup(
    @Args('restaurantId') restaurantId: string,
    @Context() context: Record<string, unknown>,
  ): Promise<Order[]> {
    try {
      this.logger.log(`🍽️ Getting orders ready for pickup for restaurant: ${restaurantId}`);
      
      const filterDto: GetOrdersFilterDto = {
        restaurantId,
        limit: 20,
      };
      
      const result = await this.ordersService.getOrders(filterDto);
      
      // Filter for ready orders only
      const readyOrders = result.orders.filter((order: PrismaOrder & { items: PrismaOrderItem[] }) => 
        order.status === OrderStatus.READY
      );
      
      return readyOrders as unknown as Order[];
    } catch (error) {
      this.logger.error(`❌ Failed to get ready orders:`, error.message);
      throw error;
    }
  }
}


