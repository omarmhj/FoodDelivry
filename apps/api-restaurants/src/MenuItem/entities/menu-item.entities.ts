import { Field, Float, Int, ObjectType } from '@nestjs/graphql';
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
export class ItemOption {
  @Field()
  id: string;

  @Field()
  optionGroupId: string;

  @Field()
  name: string;

  @Field(() => Float)
  priceDelta: number;

  @Field()
  available: boolean;

  @Field(() => Int)
  displayOrder: number;
}

@ObjectType()
export class OptionGroup {
  @Field()
  id: string;

  @Field()
  menuItemId: string;

  @Field()
  name: string;

  @Field()
  required: boolean;

  @Field(() => Int)
  minSelect: number;

  @Field(() => Int)
  maxSelect: number;

  @Field(() => Int)
  displayOrder: number;

  @Field(() => [ItemOption])
  options: ItemOption[];
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

  @Field(() => Int, { nullable: true })
  calories?: number;

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

  @Field(() => [OptionGroup], { nullable: true })
  optionGroups?: OptionGroup[];

  @Field()
  restaurantId: string;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}