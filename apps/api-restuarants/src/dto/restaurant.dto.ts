import { Field, Float, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional, IsString, IsNumber, IsArray } from 'class-validator';

@InputType()
export class GeoPointInput {
  @Field()
  type: string;

  @Field(() => [Float])
  coordinates: number[];
}

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

  @Field(() => GeoPointInput, { nullable: true })
  @IsOptional()
  coordinates?: GeoPointInput;

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

// ==================== MENU MANAGEMENT DTOs ====================

@InputType()
export class CreateMenuDto {
  @Field()
  @IsNotEmpty({ message: 'Menu name is required.' })
  @IsString({ message: 'Menu name must be a string.' })
  name: string;
}

@InputType()
export class UpdateMenuDto {
  @Field()
  @IsNotEmpty({ message: 'Menu ID is required.' })
  @IsString({ message: 'Menu ID must be a string.' })
  id: string;

  @Field()
  @IsNotEmpty({ message: 'Menu name is required.' })
  @IsString({ message: 'Menu name must be a string.' })
  name: string;
}

@InputType()
export class DeleteMenuDto {
  @Field()
  @IsNotEmpty({ message: 'Menu ID is required.' })
  @IsString({ message: 'Menu ID must be a string.' })
  id: string;
}

// ==================== CATEGORY MANAGEMENT DTOs ====================

@InputType()
export class CreateCategoryDto {
  @Field()
  @IsNotEmpty({ message: 'Category name is required.' })
  @IsString({ message: 'Category name must be a string.' })
  name: string;
}

@InputType()
export class UpdateCategoryDto {
  @Field()
  @IsNotEmpty({ message: 'Category ID is required.' })
  @IsString({ message: 'Category ID must be a string.' })
  id: string;

  @Field()
  @IsNotEmpty({ message: 'Category name is required.' })
  @IsString({ message: 'Category name must be a string.' })
  name: string;
}

@InputType()
export class DeleteCategoryDto {
  @Field()
  @IsNotEmpty({ message: 'Category ID is required.' })
  @IsString({ message: 'Category ID must be a string.' })
  id: string;
}

// ==================== MENU ITEM MANAGEMENT DTOs ====================

@InputType()
export class CreateMenuItemDto {
  @Field()
  @IsNotEmpty({ message: 'Menu item name is required.' })
  @IsString({ message: 'Menu item name must be a string.' })
  name: string;

  @Field()
  @IsNotEmpty({ message: 'Description is required.' })
  @IsString({ message: 'Description must be a string.' })
  description: string;

  @Field(() => Float)
  @IsNumber({}, { message: 'Price must be a number.' })
  price: number;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber({}, { message: 'Estimated price must be a number.' })
  estimatedPrice?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString({ message: 'Category ID must be a string.' })
  categoryId?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString({ message: 'Menu ID must be a string.' })
  menuId?: string;

  @Field({ nullable: true })
  @IsOptional()
  available?: boolean;
}

@InputType()
export class UpdateMenuItemDto {
  @Field()
  @IsNotEmpty({ message: 'Menu item ID is required.' })
  @IsString({ message: 'Menu item ID must be a string.' })
  id: string;

  @Field()
  @IsNotEmpty({ message: 'Menu item name is required.' })
  @IsString({ message: 'Menu item name must be a string.' })
  name: string;

  @Field()
  @IsNotEmpty({ message: 'Description is required.' })
  @IsString({ message: 'Description must be a string.' })
  description: string;

  @Field(() => Float)
  @IsNumber({}, { message: 'Price must be a number.' })
  price: number;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber({}, { message: 'Estimated price must be a number.' })
  estimatedPrice?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString({ message: 'Category ID must be a string.' })
  categoryId?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString({ message: 'Menu ID must be a string.' })
  menuId?: string;

  @Field({ nullable: true })
  @IsOptional()
  available?: boolean;
}

@InputType()
export class DeleteMenuItemDto {
  @Field()
  @IsNotEmpty({ message: 'Menu item ID is required.' })
  @IsString({ message: 'Menu item ID must be a string.' })
  id: string;
}

// ==================== OPERATING HOURS MANAGEMENT DTOs ====================

@InputType()
export class CreateOperatingHoursDto {
  @Field()
  @IsNotEmpty({ message: 'Day of week is required.' })
  @IsString({ message: 'Day of week must be a string.' })
  dayOfWeek: string;

  @Field()
  @IsNotEmpty({ message: 'Open time is required.' })
  @IsString({ message: 'Open time must be a string.' })
  openTime: string;

  @Field()
  @IsNotEmpty({ message: 'Close time is required.' })
  @IsString({ message: 'Close time must be a string.' })
  closeTime: string;

  @Field({ nullable: true })
  @IsOptional()
  isClosed?: boolean;
}

@InputType()
export class UpdateOperatingHoursDto {
  @Field()
  @IsNotEmpty({ message: 'Operating hours ID is required.' })
  @IsString({ message: 'Operating hours ID must be a string.' })
  id: string;

  @Field()
  @IsNotEmpty({ message: 'Day of week is required.' })
  @IsString({ message: 'Day of week must be a string.' })
  dayOfWeek: string;

  @Field()
  @IsNotEmpty({ message: 'Open time is required.' })
  @IsString({ message: 'Open time must be a string.' })
  openTime: string;

  @Field()
  @IsNotEmpty({ message: 'Close time is required.' })
  @IsString({ message: 'Close time must be a string.' })
  closeTime: string;

  @Field({ nullable: true })
  @IsOptional()
  isClosed?: boolean;
}

@InputType()
export class DeleteOperatingHoursDto {
  @Field()
  @IsNotEmpty({ message: 'Operating hours ID is required.' })
  @IsString({ message: 'Operating hours ID must be a string.' })
  id: string;
}

// ==================== STAFF MANAGEMENT DTOs ====================

@InputType()
export class AddStaffMemberDto {
  @Field()
  @IsNotEmpty({ message: 'User ID is required.' })
  @IsString({ message: 'User ID must be a string.' })
  userId: string;

  @Field()
  @IsNotEmpty({ message: 'Role is required.' })
  @IsString({ message: 'Role must be a string.' })
  role: string;
}

@InputType()
export class RemoveStaffMemberDto {
  @Field()
  @IsNotEmpty({ message: 'User ID is required.' })
  @IsString({ message: 'User ID must be a string.' })
  userId: string;
}