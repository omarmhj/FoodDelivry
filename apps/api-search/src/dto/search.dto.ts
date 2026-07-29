import { InputType, Field, Int, Float } from '@nestjs/graphql';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
  Min,
  Max,
} from 'class-validator';

@InputType()
export class SearchRestaurantsDto {
  @Field()
  @IsNotEmpty({ message: 'Search query is required.' })
  @IsString()
  query: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  city?: string;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(50)
  limit?: number;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  skip?: number;
}

@InputType()
export class SearchMenuItemsDto {
  @Field()
  @IsNotEmpty({ message: 'Search query is required.' })
  @IsString()
  query: string;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  maxPrice?: number;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(50)
  limit?: number;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  skip?: number;
}

@InputType()
export class NearbyRestaurantsDto {
  @Field(() => Float)
  @IsNumber()
  longitude: number;

  @Field(() => Float)
  @IsNumber()
  latitude: number;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0.1)
  @Max(100)
  maxDistanceKm?: number;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(50)
  limit?: number;
}
