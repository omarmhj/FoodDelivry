import { ObjectType, Field, Directive, Float } from '@nestjs/graphql';
import { MenuItem } from '../MenuItem/entities/menu-item.entities';

export { MenuItem };

@ObjectType()
export class GeoPoint {
  @Field()
  type: string;

  @Field(() => [Float])
  coordinates: number[];
}

@ObjectType()
export class Avatar {
  @Field()
  id: string;

  @Field()
  public_id: string;

  @Field()
  url: string;

  @Field()
  restaurantId: string; // Updated from sellerId
}

@ObjectType()
export class Category {
  @Field()
  id: string;

  @Field()
  name: string;

  @Field({ nullable: true })
  description?: string;

  @Field({ nullable: true })
  restaurantId?: string;

  @Field({ nullable: true })
  createdAt?: Date;

  @Field({ nullable: true })
  updatedAt?: Date;
}

@ObjectType()
export class Menu {
  @Field()
  id: string;

  @Field()
  name: string;

 
  @Field()
  restaurantId: string;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}



@ObjectType()
export class OperatingHours {
  @Field()
  id: string;

  @Field()
  restaurantId: string;

  @Field()
  dayOfWeek: string;

  @Field()
  openTime: string;

  @Field()
  closeTime: string;

  @Field()
  isClosed: boolean;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}

@ObjectType()
@Directive('@key(fields: "id")')
export class Restaurant {
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

  @Field({ nullable: true })
  phone_number?: number;

  @Field({ nullable: true })
  coordinates?: GeoPoint;

  @Field({ nullable: true })
  ownerId?: string;

  @Field(() => [Menu])
  menus: Menu[];

  @Field(() => [Category])
  categories: Category[];

  @Field(() => [MenuItem])
  menuItems: MenuItem[];

  @Field(() => [OperatingHours])
  operatingHours: OperatingHours[];

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}