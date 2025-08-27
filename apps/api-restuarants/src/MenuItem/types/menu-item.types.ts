// apps/api-restaurants/src/foods/types/menu-item.types.ts
import { ObjectType, Field } from '@nestjs/graphql';

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

@ObjectType()
export class MenuItem {
  @Field()
  id: string;

  @Field()
  name: string;

  @Field()
  description: string;

  @Field()
  price: number;

  @Field({ nullable: true })
  estimatedPrice?: number;

  @Field({ nullable: true })
  categoryId?: string;

  @Field({ nullable: true })
  menuId?: string;

  @Field(() => [Image])
  images: Image[];
}

@ObjectType()
export class Image {
  @Field()
  id: string;

  @Field()
  public_id: string;

  @Field()
  url: string;
}