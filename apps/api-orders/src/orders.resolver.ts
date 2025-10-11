import { Resolver, Mutation, Query, Args, Context } from '@nestjs/graphql';
import { UseGuards, Logger } from '@nestjs/common';
import { OrdersService } from './orders.service';
import {
  CreateOrderDto,
  UpdateOrderStatusDto,
  CancelOrderDto,
  GetOrdersFilterDto,
  CreateOrderReviewDto,
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

@Resolver('Order')
export class OrdersResolver {
  private readonly logger = new Logger(OrdersResolver.name);

  constructor(private readonly ordersService: OrdersService) {}

  @Mutation(() => CreateOrderResponse)
  @UseGuards(AuthGuard)
  async createOrder(
    @Args('createOrderDto') createOrderDto: CreateOrderDto,
    @Context() context: any,
  ): Promise<CreateOrderResponse> {
    try {
      this.logger.log(`📋 Creating order for customer: ${createOrderDto.customerName}`);
      
      const result = await this.ordersService.createOrder(createOrderDto);
      
      return {
        message: result.message,
        order: result.order,
      };
    } catch (error) {
      this.logger.error(`❌ Failed to create order:`, error.message);
      return {
        message: 'Failed to create order',
        error: {
          message: error.message,
          code: error.code || 'CREATE_ORDER_FAILED',
        },
      };
    }
  }

  @Mutation(() => UpdateOrderStatusResponse)
  @UseGuards(AuthGuard)
  async updateOrderStatus(
    @Args('updateStatusDto') updateStatusDto: UpdateOrderStatusDto,
    @Context() context: any,
  ): Promise<UpdateOrderStatusResponse> {
    try {
      this.logger.log(`🔄 Updating order status: ${updateStatusDto.orderId} -> ${updateStatusDto.status}`);
      
      const result = await this.ordersService.updateOrderStatus(updateStatusDto);
      
      return {
        message: result.message,
        order: result.order,
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

  @Mutation(() => CancelOrderResponse)
  @UseGuards(AuthGuard)
  async cancelOrder(
    @Args('cancelOrderDto') cancelOrderDto: CancelOrderDto,
    @Context() context: any,
  ): Promise<CancelOrderResponse> {
    try {
      this.logger.log(`❌ Cancelling order: ${cancelOrderDto.orderId}`);
      
      const result = await this.ordersService.cancelOrder(cancelOrderDto);
      
      return {
        message: result.message,
        order: result.order,
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
    @Context() context?: any,
  ): Promise<GetOrdersResponse> {
    try {
      this.logger.log(`📋 Getting orders with filters:`, filterDto);
      
      const result = await this.ordersService.getOrders(filterDto || {});
      
      return {
        orders: result.orders,
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
    @Context() context: any,
  ): Promise<Order> {
    try {
      this.logger.log(`📋 Getting order by ID: ${orderId}`);
      
      return await this.ordersService.getOrderById(orderId);
    } catch (error) {
      this.logger.error(`❌ Failed to get order:`, error.message);
      throw error;
    }
  }

  @Query(() => Order)
  @UseGuards(AuthGuard)
  async getOrderByNumber(
    @Args('orderNumber') orderNumber: string,
    @Context() context: any,
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
    @Args('limit', { nullable: true }) limit?: number,
    @Args('skip', { nullable: true }) skip?: number,
    @Context() context?: any,
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
        orders: result.orders,
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
    @Args('limit', { nullable: true }) limit?: number,
    @Args('skip', { nullable: true }) skip?: number,
    @Context() context?: any,
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
        orders: result.orders,
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
    @Context() context: any,
  ): Promise<CreateOrderReviewResponse> {
    try {
      this.logger.log(`⭐ Creating review for order: ${reviewDto.orderId}`);
      
      const result = await this.ordersService.createOrderReview(reviewDto);
      
      return {
        message: result.message,
        review: result.review,
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
    @Context() context?: any,
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
      return result.orders.filter(order => 
        !['DELIVERED', 'CANCELLED'].includes(order.status)
      );
    } catch (error) {
      this.logger.error(`❌ Failed to get active orders:`, error.message);
      throw error;
    }
  }

  @Query(() => [Order])
  @UseGuards(AuthGuard)
  async getOrdersReadyForPickup(
    @Args('restaurantId') restaurantId: string,
    @Context() context: any,
  ): Promise<Order[]> {
    try {
      this.logger.log(`🍽️ Getting orders ready for pickup for restaurant: ${restaurantId}`);
      
      const filterDto: GetOrdersFilterDto = {
        restaurantId,
        limit: 20,
      };
      
      const result = await this.ordersService.getOrders(filterDto);
      
      // Filter for ready orders only
      return result.orders.filter(order => order.status === 'READY');
    } catch (error) {
      this.logger.error(`❌ Failed to get ready orders:`, error.message);
      throw error;
    }
  }
}


