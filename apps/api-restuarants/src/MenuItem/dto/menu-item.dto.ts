import { Field, InputType } from '@nestjs/graphql';
import { ArrayNotEmpty, IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';

@InputType()
export class CreateMenuItemDto {
  @Field()
  @IsNotEmpty({ message: 'Menu item name is required.' })
  @IsString({ message: 'Menu item name must be a string.' })
  name: string;

  @Field()
  @IsNotEmpty({ message: 'Menu item description is required.' })
  @IsString({ message: 'Menu item description must be a string.' })
  description: string;

  @Field()
  @IsNotEmpty({ message: 'Menu item price is required.' })
  price: number;

  @Field({ nullable: true })
  @IsOptional()
  estimatedPrice?: number;

  @Field()
  @IsNotEmpty({ message: 'Menu item category is required.' })
  @IsString({ message: 'Menu item category must be a string.' })
  categoryId: string;

  @Field({ nullable: true })
  @IsOptional()
  menuId?: string;

  @Field(() => [String])
  @IsArray({ message: 'Menu item images must be an array.' })
  @ArrayNotEmpty({ message: 'Menu item images array must not be empty.' })
  images: string[];
}

@InputType()
export class DeleteMenuItemDto {
  @Field()
  @IsNotEmpty({ message: 'Menu item ID is required.' })
  @IsString({ message: 'Menu item ID must be a string.' })
  id: string;
}