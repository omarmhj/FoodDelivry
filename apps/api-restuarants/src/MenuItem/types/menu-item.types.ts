// apps/api-restaurants/src/foods/types/menu-item.types.ts
import { ObjectType, Field } from '@nestjs/graphql';
import { MenuItem, Image } from '../entities/menu-item.entities';

@ObjectType()
export class CreateMenuItemResponse {
  @Field()
  message: string;
}

@ObjectType()
export class DeleteMenuItemResponse {
  @Field()
  message: string;
}

@ObjectType()
export class LoggedInRestaurantMenuItemsResponse {
  @Field(() => [MenuItem])
  menuItems: MenuItem[];
}