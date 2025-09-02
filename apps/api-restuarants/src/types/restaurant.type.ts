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