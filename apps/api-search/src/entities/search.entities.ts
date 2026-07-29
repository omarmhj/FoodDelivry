import { ObjectType, Field, Int, Float } from '@nestjs/graphql';

@ObjectType()
export class ErrorType {
  @Field({ nullable: true })
  message?: string;

  @Field({ nullable: true })
  code?: string;
}

@ObjectType()
export class RestaurantResult {
  @Field()
  id: string;

  @Field()
  name: string;

  @Field()
  country: string;

  @Field()
  city: string;

  @Field()
  address: string;

  @Field()
  email: string;

  @Field(() => Float, { nullable: true })
  longitude?: number;

  @Field(() => Float, { nullable: true })
  latitude?: number;

  // Only populated by the "nearby" query
  @Field(() => Float, { nullable: true })
  distanceKm?: number;
}

@ObjectType()
export class MenuItemResult {
  @Field()
  id: string;

  @Field()
  name: string;

  @Field()
  description: string;

  @Field(() => Float)
  price: number;

  @Field()
  available: boolean;

  @Field()
  restaurantId: string;

  @Field({ nullable: true })
  restaurantName?: string;
}

@ObjectType()
export class RestaurantSearchResponse {
  @Field(() => [RestaurantResult])
  results: RestaurantResult[];

  @Field(() => Int)
  total: number;

  @Field()
  cached: boolean;

  @Field(() => ErrorType, { nullable: true })
  error?: ErrorType;
}

@ObjectType()
export class MenuItemSearchResponse {
  @Field(() => [MenuItemResult])
  results: MenuItemResult[];

  @Field(() => Int)
  total: number;

  @Field()
  cached: boolean;

  @Field(() => ErrorType, { nullable: true })
  error?: ErrorType;
}

@ObjectType()
export class NearbyRestaurantsResponse {
  @Field(() => [RestaurantResult])
  results: RestaurantResult[];

  @Field(() => Int)
  total: number;

  @Field()
  cached: boolean;

  @Field(() => ErrorType, { nullable: true })
  error?: ErrorType;
}

@ObjectType()
export class RecommendationsResponse {
  // Restaurants the customer has ordered from before, frequency-ranked
  @Field(() => [RestaurantResult])
  reorder: RestaurantResult[];

  // Other restaurants to discover
  @Field(() => [RestaurantResult])
  discover: RestaurantResult[];

  @Field()
  cached: boolean;

  @Field(() => ErrorType, { nullable: true })
  error?: ErrorType;
}
