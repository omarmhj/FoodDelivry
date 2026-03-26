import { Field, ObjectType } from '@nestjs/graphql';
import { Restaurant } from '../entities/restaurant.entities';

export { Restaurant }

@ObjectType()
export class ErrorType {
  @Field()
  message: string;

  @Field({ nullable: true })
  code?: string;
}

@ObjectType()
export class RegisterResponse {
  @Field()
  message: string;

  @Field({ nullable: true })
  activation_token?: string;

  @Field(() => ErrorType, { nullable: true })
  error?: ErrorType;
}

@ObjectType()
export class ActivationResponse {
  @Field(() => Restaurant)
  restaurant: Restaurant;

  @Field(() => ErrorType, { nullable: true })
  error?: ErrorType;
}

@ObjectType()
export class LoginResponse {
  @Field(() => Restaurant, { nullable: true })
  restaurant?: Restaurant;

  @Field({ nullable: true })
  accessToken?: string;

  @Field({ nullable: true })
  refreshToken?: string;

  @Field(() => ErrorType, { nullable: true })
  error?: ErrorType;
}

@ObjectType()
export class LogoutResponse {
  @Field()
  message: string;
}

@ObjectType()
export class FindRestaurantsNearResponse {
  @Field(() => [Restaurant])
  restaurants: Restaurant[];

  @Field(() => ErrorType, { nullable: true })
  error?: ErrorType;
}

// ==================== MENU MANAGEMENT RESPONSES ====================

@ObjectType()
export class CreateMenuResponse {
  @Field()
  message: string;

  @Field(() => Restaurant)
  restaurant: Restaurant;

  @Field(() => ErrorType, { nullable: true })
  error?: ErrorType;
}

@ObjectType()
export class UpdateMenuResponse {
  @Field()
  message: string;

  @Field(() => Restaurant)
  restaurant: Restaurant;

  @Field(() => ErrorType, { nullable: true })
  error?: ErrorType;
}

@ObjectType()
export class DeleteMenuResponse {
  @Field()
  message: string;

  @Field(() => Restaurant)
  restaurant: Restaurant;

  @Field(() => ErrorType, { nullable: true })
  error?: ErrorType;
}

// ==================== CATEGORY MANAGEMENT RESPONSES ====================

@ObjectType()
export class CreateCategoryResponse {
  @Field()
  message: string;

  @Field(() => Restaurant)
  restaurant: Restaurant;

  @Field(() => ErrorType, { nullable: true })
  error?: ErrorType;
}

@ObjectType()
export class UpdateCategoryResponse {
  @Field()
  message: string;

  @Field(() => Restaurant)
  restaurant: Restaurant;

  @Field(() => ErrorType, { nullable: true })
  error?: ErrorType;
}

@ObjectType()
export class DeleteCategoryResponse {
  @Field()
  message: string;

  @Field(() => Restaurant)
  restaurant: Restaurant;

  @Field(() => ErrorType, { nullable: true })
  error?: ErrorType;
}

// ==================== MENU ITEM MANAGEMENT RESPONSES ====================

@ObjectType()
export class CreateMenuItemResponse {
  @Field()
  message: string;

  @Field(() => Restaurant)
  restaurant: Restaurant;

  @Field(() => ErrorType, { nullable: true })
  error?: ErrorType;
}

@ObjectType()
export class UpdateMenuItemResponse {
  @Field()
  message: string;

  @Field(() => Restaurant)
  restaurant: Restaurant;

  @Field(() => ErrorType, { nullable: true })
  error?: ErrorType;
}

@ObjectType()
export class DeleteMenuItemResponse {
  @Field()
  message: string;

  @Field(() => Restaurant)
  restaurant: Restaurant;

  @Field(() => ErrorType, { nullable: true })
  error?: ErrorType;
}

// ==================== OPERATING HOURS MANAGEMENT RESPONSES ====================

@ObjectType()
export class CreateOperatingHoursResponse {
  @Field()
  message: string;

  @Field(() => Restaurant)
  restaurant: Restaurant;

  @Field(() => ErrorType, { nullable: true })
  error?: ErrorType;
}

@ObjectType()
export class UpdateOperatingHoursResponse {
  @Field()
  message: string;

  @Field(() => Restaurant)
  restaurant: Restaurant;

  @Field(() => ErrorType, { nullable: true })
  error?: ErrorType;
}

@ObjectType()
export class DeleteOperatingHoursResponse {
  @Field()
  message: string;

  @Field(() => Restaurant)
  restaurant: Restaurant;

  @Field(() => ErrorType, { nullable: true })
  error?: ErrorType;
}

// ==================== STAFF MANAGEMENT RESPONSES ====================

@ObjectType()
export class AddStaffMemberResponse {
  @Field()
  message: string;

  @Field(() => Restaurant)
  restaurant: Restaurant;

  @Field(() => ErrorType, { nullable: true })
  error?: ErrorType;
}

@ObjectType()
export class RemoveStaffMemberResponse {
  @Field()
  message: string;

  @Field(() => Restaurant)
  restaurant: Restaurant;

  @Field(() => ErrorType, { nullable: true })
  error?: ErrorType;
} 