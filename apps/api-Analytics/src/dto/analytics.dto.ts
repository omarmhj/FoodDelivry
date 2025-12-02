import { InputType, Field, ObjectType, registerEnumType } from '@nestjs/graphql';
import { IsNotEmpty, IsString, IsOptional, IsEnum, IsDateString } from 'class-validator';

export enum AnalyticsType {
  DAILY_SALES = 'DAILY_SALES',
  POPULAR_ITEMS = 'POPULAR_ITEMS',
  CUSTOMER_TRAFFIC = 'CUSTOMER_TRAFFIC',
  ORDER_VOLUME = 'ORDER_VOLUME',
  REVENUE = 'REVENUE',
  AVERAGE_ORDER_VALUE = 'AVERAGE_ORDER_VALUE',
  PEAK_HOURS = 'PEAK_HOURS',
  CUSTOMER_RETENTION = 'CUSTOMER_RETENTION',
}

registerEnumType(AnalyticsType, {
  name: 'AnalyticsType',
});

@InputType()
export class GetAnalyticsDto {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  restaurantId?: string;

  @Field(() => AnalyticsType)
  @IsNotEmpty()
  @IsEnum(AnalyticsType)
  metricType: AnalyticsType;

  @Field()
  @IsNotEmpty()
  @IsDateString()
  startDate: string;

  @Field()
  @IsNotEmpty()
  @IsDateString()
  endDate: string;
}

@InputType()
export class GetDailyReportDto {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  restaurantId?: string;

  @Field()
  @IsNotEmpty()
  @IsDateString()
  date: string;
}

@InputType()
export class GetPopularItemsDto {
  @Field()
  @IsNotEmpty()
  @IsString()
  restaurantId: string;

  @Field()
  @IsNotEmpty()
  @IsDateString()
  startDate: string;

  @Field()
  @IsNotEmpty()
  @IsDateString()
  endDate: string;

  @Field({ nullable: true, defaultValue: 10 })
  @IsOptional()
  limit?: number;
}

