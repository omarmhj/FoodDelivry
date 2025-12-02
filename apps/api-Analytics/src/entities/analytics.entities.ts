import { ObjectType, Field, ID, Float, Int } from '@nestjs/graphql';
import { AnalyticsType } from '../dto/analytics.dto';

@ObjectType()
export class Analytics {
  @Field(() => ID)
  id: string;

  @Field({ nullable: true })
  restaurantId?: string;

  @Field(() => AnalyticsType)
  metricType: AnalyticsType;

  @Field(() => Float)
  value: number;

  @Field()
  date: Date;

  @Field(() => String, { nullable: true })
  metadata?: any;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}

@ObjectType()
export class DailyReport {
  @Field(() => ID)
  id: string;

  @Field({ nullable: true })
  restaurantId?: string;

  @Field()
  date: Date;

  @Field(() => Int)
  totalOrders: number;

  @Field(() => Float)
  totalRevenue: number;

  @Field(() => Float)
  averageOrderValue: number;

  @Field(() => String, { nullable: true })
  popularItems?: any;

  @Field(() => Int)
  customerCount: number;

  @Field(() => String, { nullable: true })
  metadata?: any;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}

@ObjectType()
export class PopularItem {
  @Field(() => ID)
  id: string;

  @Field()
  restaurantId: string;

  @Field()
  menuItemId: string;

  @Field()
  menuItemName: string;

  @Field(() => Int)
  orderCount: number;

  @Field(() => Float)
  totalRevenue: number;

  @Field()
  date: Date;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}

@ObjectType()
export class RevenueMetric {
  @Field(() => ID)
  id: string;

  @Field({ nullable: true })
  restaurantId?: string;

  @Field()
  orderId: string;

  @Field()
  orderNumber: string;

  @Field(() => Float)
  amount: number;

  @Field()
  date: Date;

  @Field(() => Int)
  hour: number;

  @Field(() => Int)
  dayOfWeek: number;

  @Field(() => String, { nullable: true })
  metadata?: any;

  @Field()
  createdAt: Date;
}

