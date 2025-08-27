import { Field, Float, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional, IsString, IsNumber, IsArray } from 'class-validator';

@InputType()
export class RegisterDto {
  @Field()
  @IsNotEmpty({ message: 'Restaurant name is required.' })
  @IsString({ message: 'Restaurant name must be a string.' })
  name: string;

  @Field()
  @IsNotEmpty({ message: 'Country is required.' })
  @IsString({ message: 'Country must be a string.' })
  country: string;

  @Field()
  @IsNotEmpty({ message: 'City is required.' })
  @IsString({ message: 'City must be a string.' })
  city: string;

  @Field()
  @IsNotEmpty({ message: 'Address is required.' })
  @IsString({ message: 'Address must be a string.' })
  address: string;

  @Field()
  @IsNotEmpty({ message: 'Email is required.' })
  @IsString({ message: 'Email must be a string.' })
  email: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsNumber({}, { message: 'Phone number must be a number.' })
  phone_number?: number;

  @Field()
  @IsNotEmpty({ message: 'Password is required.' })
  @IsString({ message: 'Password must be a string.' })
  password: string;

  @Field({ nullable: true })
  @IsOptional()
  coordinates?: { type: string; coordinates: number[] };

  @Field({ nullable: true })
  @IsOptional()
  @IsString({ message: 'Owner ID must be a string.' })
  ownerId?: string;
}

@InputType()
export class ActivationDto {
  @Field()
  @IsNotEmpty({ message: 'Activation token is required.' })
  @IsString({ message: 'Activation token must be a string.' })
  activationToken: string;

  @Field()
  @IsNotEmpty({ message: 'Activation code is required.' })
  @IsString({ message: 'Activation code must be a string.' })
  activationCode: string;
}

@InputType()
export class LoginDto {
  @Field()
  @IsNotEmpty({ message: 'Email is required.' })
  @IsString({ message: 'Email must be a string.' })
  email: string;

  @Field()
  @IsNotEmpty({ message: 'Password is required.' })
  @IsString({ message: 'Password must be a string.' })
  password: string;
}

@InputType()
export class FindRestaurantsNearDto {
  @Field(() => [Float])
  @IsArray({ message: 'Coordinates must be an array.' })
  @IsNumber({}, { each: true, message: 'Coordinates must be numbers.' })
  coordinates: number[]; // [longitude, latitude]

  @Field(() => Float)
  @IsNumber({}, { message: 'Max distance must be a number.' })
  maxDistance: number; // In meters
}