import { InputType, Field, ObjectType, registerEnumType, Float, Int } from '@nestjs/graphql';
import { IsNotEmpty, IsString, IsEmail, IsOptional, IsArray, IsEnum, IsNumber, Min, Max, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { OrderStatus, PaymentStatus, DeliveryType } from '@prisma/orders-client';

// Register Prisma enums with GraphQL
registerEnumType(OrderStatus, { name: 'OrderStatus' });
registerEnumType(PaymentStatus, { name: 'PaymentStatus' });
registerEnumType(DeliveryType, { name: 'DeliveryType' });

// Re-export Prisma enums for convenience
export { OrderStatus, PaymentStatus, DeliveryType };

/**
 * One requested line of an order.
 *
 * This input deliberately carries no money and no item copy. The name,
 * description, image, and every price are resolved by api-restaurants from its
 * own catalogue during `menu.validateItems`, so a client cannot dictate what an
 * item is called or what it costs.
 *
 * `unitPrice`, `menuItemName`, `menuItemDescription`, and `menuItemImage` are
 * still accepted for compatibility with clients written against the previous
 * schema, but they are ignored — see `OrdersService.createOrder`.
 */
@InputType()
export class CreateOrderItemDto {
  @Field()
  @IsNotEmpty({ message: 'Menu item ID is required.' })
  @IsString({ message: 'Menu item ID must be a string.' })
  menuItemId: string;

  @Field(() => Int)
  @IsNumber({}, { message: 'Quantity must be a number.' })
  @Min(1, { message: 'Quantity must be at least 1.' })
  @Max(99, { message: 'Quantity cannot exceed 99.' })
  quantity: number;

  /** Ids of the chosen `ItemOption`s; validated and priced by api-restaurants. */
  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray({ message: 'Selected option IDs must be an array.' })
  @IsString({ each: true, message: 'Each selected option ID must be a string.' })
  selectedOptionIds?: string[];

  @Field({ nullable: true })
  @IsOptional()
  @IsString({ message: 'Special requests must be a string.' })
  specialRequests?: string;

  // ---- Accepted for backwards compatibility, ignored by the server ----

  @Field({ nullable: true })
  @IsOptional()
  @IsString({ message: 'Menu item name must be a string.' })
  menuItemName?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString({ message: 'Menu item description must be a string.' })
  menuItemDescription?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString({ message: 'Menu item image must be a string.' })
  menuItemImage?: string;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber({}, { message: 'Unit price must be a number.' })
  unitPrice?: number;
}

// Create Order Input DTO
@InputType()
export class CreateOrderDto {
  @Field()
  @IsNotEmpty({ message: 'Customer ID is required.' })
  @IsString({ message: 'Customer ID must be a string.' })
  customerId: string;

  @Field()
  @IsNotEmpty({ message: 'Customer name is required.' })
  @IsString({ message: 'Customer name must be a string.' })
  customerName: string;

  @Field()
  @IsNotEmpty({ message: 'Customer email is required.' })
  @IsEmail({}, { message: 'Customer email must be valid.' })
  customerEmail: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString({ message: 'Customer phone must be a string.' })
  customerPhone?: string;

  @Field()
  @IsNotEmpty({ message: 'Restaurant ID is required.' })
  @IsString({ message: 'Restaurant ID must be a string.' })
  restaurantId: string;

  @Field()
  @IsNotEmpty({ message: 'Restaurant name is required.' })
  @IsString({ message: 'Restaurant name must be a string.' })
  restaurantName: string;

  @Field()
  @IsNotEmpty({ message: 'Restaurant address is required.' })
  @IsString({ message: 'Restaurant address must be a string.' })
  restaurantAddress: string;

  @Field(() => [CreateOrderItemDto])
  @IsArray({ message: 'Items must be an array.' })
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];

  @Field(() => DeliveryType)
  @IsEnum(DeliveryType, { message: 'Invalid delivery type.' })
  deliveryType: DeliveryType;

  @Field({ nullable: true })
  @IsOptional()
  @IsString({ message: 'Delivery address must be a string.' })
  deliveryAddress?: string;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber({}, { message: 'Delivery latitude must be a number.' })
  deliveryLatitude?: number;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber({}, { message: 'Delivery longitude must be a number.' })
  deliveryLongitude?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString({ message: 'Delivery instructions must be a string.' })
  deliveryInstructions?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString({ message: 'Special instructions must be a string.' })
  specialInstructions?: string;
}

// Update Order Status DTO
@InputType()
export class UpdateOrderStatusDto {
  @Field()
  @IsNotEmpty({ message: 'Order ID is required.' })
  @IsString({ message: 'Order ID must be a string.' })
  orderId: string;

  @Field(() => OrderStatus)
  @IsEnum(OrderStatus, { message: 'Invalid order status.' })
  status: OrderStatus;

  @Field({ nullable: true })
  @IsOptional()
  @IsString({ message: 'Reason must be a string.' })
  reason?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString({ message: 'Notes must be a string.' })
  notes?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString({ message: 'Changed by must be a string.' })
  changedBy?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString({ message: 'Changed by role must be a string.' })
  changedByRole?: string;
}

/**
 * Restaurant-side refusal of an order. Separate from `CancelOrderDto` because a
 * reason is mandatory here: the customer is told why their order was declined.
 */
@InputType()
export class RejectOrderDto {
  @Field()
  @IsNotEmpty({ message: 'Order ID is required.' })
  @IsString({ message: 'Order ID must be a string.' })
  orderId: string;

  @Field()
  @IsNotEmpty({ message: 'A rejection reason is required.' })
  @IsString({ message: 'Rejection reason must be a string.' })
  reason: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString({ message: 'Rejected by must be a string.' })
  rejectedBy?: string;
}

// Cancel Order DTO
@InputType()
export class CancelOrderDto {
  @Field()
  @IsNotEmpty({ message: 'Order ID is required.' })
  @IsString({ message: 'Order ID must be a string.' })
  orderId: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString({ message: 'Cancellation reason must be a string.' })
  reason?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString({ message: 'Cancelled by must be a string.' })
  cancelledBy?: string;
}

// Get Orders Filter DTO
@InputType()
export class GetOrdersFilterDto {
  @Field({ nullable: true })
  @IsOptional()
  @IsString({ message: 'Customer ID must be a string.' })
  customerId?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString({ message: 'Restaurant ID must be a string.' })
  restaurantId?: string;

  @Field(() => OrderStatus, { nullable: true })
  @IsOptional()
  @IsEnum(OrderStatus, { message: 'Invalid order status.' })
  status?: OrderStatus;

  @Field(() => DeliveryType, { nullable: true })
  @IsOptional()
  @IsEnum(DeliveryType, { message: 'Invalid delivery type.' })
  deliveryType?: DeliveryType;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsNumber({}, { message: 'Limit must be a number.' })
  @Min(1, { message: 'Limit must be at least 1.' })
  @Max(100, { message: 'Limit cannot exceed 100.' })
  limit?: number;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsNumber({}, { message: 'Skip must be a number.' })
  @Min(0, { message: 'Skip must be non-negative.' })
  skip?: number;
}

// Order Review DTO
@InputType()
export class CreateOrderReviewDto {
  @Field()
  @IsNotEmpty({ message: 'Order ID is required.' })
  @IsString({ message: 'Order ID must be a string.' })
  orderId: string;

  @Field(() => Int)
  @IsNumber({}, { message: 'Rating must be a number.' })
  @Min(1, { message: 'Rating must be at least 1.' })
  @Max(5, { message: 'Rating cannot exceed 5.' })
  rating: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString({ message: 'Comment must be a string.' })
  comment?: string;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsNumber({}, { message: 'Food quality rating must be a number.' })
  @Min(1, { message: 'Food quality rating must be at least 1.' })
  @Max(5, { message: 'Food quality rating cannot exceed 5.' })
  foodQuality?: number;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsNumber({}, { message: 'Delivery speed rating must be a number.' })
  @Min(1, { message: 'Delivery speed rating must be at least 1.' })
  @Max(5, { message: 'Delivery speed rating cannot exceed 5.' })
  deliverySpeed?: number;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsNumber({}, { message: 'Customer service rating must be a number.' })
  @Min(1, { message: 'Customer service rating must be at least 1.' })
  @Max(5, { message: 'Customer service rating cannot exceed 5.' })
  customerService?: number;
}


