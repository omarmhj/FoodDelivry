import { Field, ObjectType } from '@nestjs/graphql';
import { Category, Menu } from '../../entities/restaurant.entities';

@ObjectType()
export class Image {
  @Field()
  id: string;

  @Field()
  public_id: string;

  @Field()
  url: string;
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

  @Field()
  available: boolean;

  @Field({ nullable: true })
  categoryId?: string;

  @Field(() => Category, { nullable: true })
  category?: Category;

  @Field({ nullable: true })
  menuId?: string;

  @Field(() => Menu, { nullable: true })
  menu?: Menu;

  @Field(() => [Image], { nullable: true })
  images?: Image[];

  @Field()
  restaurantId: string;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}