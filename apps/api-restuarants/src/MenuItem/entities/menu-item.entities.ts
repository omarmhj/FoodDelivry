import { Field, ObjectType } from '@nestjs/graphql';

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

  @Field({ nullable: true })
  menuId?: string;

  @Field(() => [Image], { nullable: true })
  images?: Image[];

  @Field()
  restaurantId: string;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}