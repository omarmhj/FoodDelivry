import { ObjectType, Field, Float, Int } from '@nestjs/graphql';
import { OrderStatus, PaymentStatus, DeliveryType } from '../dto/order.dto';
@ObjectType()
export class OrderItem {
  @Field()
  id: string;

  @Field()
  orderId: string;

  @Field()
  menuItemId: string;

  @Field()
  menuItemName: string;

  @Field({ nullable: true })
  menuItemDescription?: string;

  @Field({ nullable: true })
  menuItemImage?: string;

  @Field(() => Int)
  quantity: number;

  @Field(() => Float)
  unitPrice: number;

  @Field(() => Float)
  totalPrice: number;

  @Field({ nullable: true })
  specialRequests?: string;

  @Field(() => String, { nullable: true })
  customizations?: any;

  @Field(() => String, { nullable: true })
  metadata?: any;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}

@ObjectType()
export class Order {
  @Field()
  id: string;

  @Field()
  orderNumber: string;

  // Customer Information
  @Field()
  customerId: string;

  @Field()
  customerName: string;

  @Field()
  customerEmail: string;

  @Field({ nullable: true })
  customerPhone?: string;

  // Restaurant Information
  @Field()
  restaurantId: string;

  @Field()
  restaurantName: string;

  @Field()
  restaurantAddress: string;

  // Order Details
  @Field(() => [OrderItem])
  items: OrderItem[];

  @Field(() => [OrderStatusHistory], { nullable: true })
  statusHistory?: OrderStatusHistory[];

  @Field(() => OrderStatus)
  status: OrderStatus;

  @Field(() => PaymentStatus)
  paymentStatus: PaymentStatus;

  @Field(() => DeliveryType)
  deliveryType: DeliveryType;

  // Pricing
  @Field(() => Float)
  subtotal: number;

  @Field(() => Float)
  tax: number;

  @Field(() => Float)
  deliveryFee: number;

  @Field(() => Float)
  discount: number;

  @Field(() => Float)
  total: number;

  // Delivery Information
  @Field({ nullable: true })
  deliveryAddress?: string;

  @Field({ nullable: true })
  deliveryInstructions?: string;

  @Field({ nullable: true })
  estimatedDeliveryTime?: Date;

  @Field({ nullable: true })
  actualDeliveryTime?: Date;

  // Special Instructions
  @Field({ nullable: true })
  specialInstructions?: string;

  @Field({ nullable: true })
  notes?: string;

  // Tracking
  @Field(() => Int, { nullable: true })
  preparationTime?: number;

  @Field({ nullable: true })
  cookingStartedAt?: Date;

  @Field({ nullable: true })
  readyAt?: Date;

  @Field({ nullable: true })
  pickedUpAt?: Date;

  @Field({ nullable: true })
  deliveredAt?: Date;

  // Metadata
  @Field(() => String, { nullable: true })
  metadata?: any;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}

@ObjectType()
export class OrderStatusHistory {
  @Field()
  id: string;

  @Field()
  orderId: string;

  @Field(() => OrderStatus)
  status: OrderStatus;

  @Field(() => OrderStatus, { nullable: true })
  previousStatus?: OrderStatus;

  @Field({ nullable: true })
  reason?: string;

  @Field({ nullable: true })
  notes?: string;

  @Field({ nullable: true })
  changedBy?: string;

  @Field({ nullable: true })
  changedByRole?: string;

  @Field()
  timestamp: Date;

  @Field(() => String, { nullable: true })
  metadata?: any;
}

@ObjectType()
export class OrderReview {
  @Field()
  id: string;

  @Field()
  orderId: string;

  @Field()
  customerId: string;

  @Field()
  restaurantId: string;

  @Field(() => Int)
  rating: number;

  @Field({ nullable: true })
  comment?: string;

  @Field(() => Int, { nullable: true })
  foodQuality?: number;

  @Field(() => Int, { nullable: true })
  deliverySpeed?: number;

  @Field(() => Int, { nullable: true })
  customerService?: number;

  @Field()
  isPublic: boolean;

  @Field()
  isVerified: boolean;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}

// Response Types
@ObjectType()
export class ErrorType {
  @Field({ nullable: true })
  message?: string;

  @Field({ nullable: true })
  code?: string;
}

@ObjectType()
export class CreateOrderResponse {
  @Field()
  message: string;

  @Field(() => Order, { nullable: true })
  order?: Order;

  @Field(() => ErrorType, { nullable: true })
  error?: ErrorType;
}

@ObjectType()
export class UpdateOrderStatusResponse {
  @Field()
  message: string;

  @Field(() => Order, { nullable: true })
  order?: Order;

  @Field(() => ErrorType, { nullable: true })
  error?: ErrorType;
}

@ObjectType()
export class CancelOrderResponse {
  @Field()
  message: string;

  @Field(() => Order, { nullable: true })
  order?: Order;

  @Field(() => ErrorType, { nullable: true })
  error?: ErrorType;
}

@ObjectType()
export class GetOrdersResponse {
  @Field(() => [Order])
  orders: Order[];

  @Field(() => Int)
  total: number;

  @Field(() => Int)
  limit: number;

  @Field(() => Int)
  skip: number;

  @Field(() => ErrorType, { nullable: true })
  error?: ErrorType;
}

@ObjectType()
export class CreateOrderReviewResponse {
  @Field()
  message: string;

  @Field(() => OrderReview, { nullable: true })
  review?: OrderReview;

  @Field(() => ErrorType, { nullable: true })
  error?: ErrorType;
}


