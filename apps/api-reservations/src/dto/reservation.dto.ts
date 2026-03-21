import { InputType, Field, Int, registerEnumType } from '@nestjs/graphql';
import {
  IsNotEmpty,
  IsString,
  IsEmail,
  IsOptional,
  IsNumber,
  IsEnum,
  IsDateString,
  Min,
  Max,
  Matches,
} from 'class-validator';

export enum ReservationStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  SEATED = 'SEATED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  NO_SHOW = 'NO_SHOW',
}

registerEnumType(ReservationStatus, { name: 'ReservationStatus' });

// ==================== TABLE DTOs ====================

@InputType()
export class CreateTableDto {
  @Field()
  @IsNotEmpty({ message: 'Table number is required.' })
  @IsString()
  tableNumber: string;

  @Field(() => Int)
  @IsNumber()
  @Min(1, { message: 'Capacity must be at least 1.' })
  @Max(20, { message: 'Capacity cannot exceed 20.' })
  capacity: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  location?: string;
}

@InputType()
export class UpdateTableDto {
  @Field()
  @IsNotEmpty()
  @IsString()
  id: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  tableNumber?: string;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(20)
  capacity?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  location?: string;

  @Field({ nullable: true })
  @IsOptional()
  isActive?: boolean;
}

@InputType()
export class DeleteTableDto {
  @Field()
  @IsNotEmpty()
  @IsString()
  id: string;
}

// ==================== RESERVATION DTOs ====================

@InputType()
export class CreateReservationDto {
  @Field()
  @IsNotEmpty({ message: 'Customer ID is required.' })
  @IsString()
  customerId: string;

  @Field()
  @IsNotEmpty({ message: 'Customer name is required.' })
  @IsString()
  customerName: string;

  @Field()
  @IsNotEmpty({ message: 'Customer email is required.' })
  @IsEmail()
  customerEmail: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  customerPhone?: string;

  @Field()
  @IsNotEmpty({ message: 'Restaurant ID is required.' })
  @IsString()
  restaurantId: string;

  @Field()
  @IsNotEmpty({ message: 'Restaurant name is required.' })
  @IsString()
  restaurantName: string;

  @Field()
  @IsNotEmpty({ message: 'Date is required.' })
  @IsDateString()
  date: string;

  @Field()
  @IsNotEmpty({ message: 'Start time is required.' })
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'Start time must be HH:MM format.' })
  startTime: string;

  @Field()
  @IsNotEmpty({ message: 'End time is required.' })
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'End time must be HH:MM format.' })
  endTime: string;

  @Field(() => Int)
  @IsNumber()
  @Min(1, { message: 'Party size must be at least 1.' })
  @Max(20, { message: 'Party size cannot exceed 20.' })
  partySize: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  tableId?: string; // Optional — auto-assign if not provided

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  specialRequests?: string;
}

@InputType()
export class UpdateReservationStatusDto {
  @Field()
  @IsNotEmpty()
  @IsString()
  reservationId: string;

  @Field(() => ReservationStatus)
  @IsEnum(ReservationStatus)
  status: ReservationStatus;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  reason?: string;
}

@InputType()
export class CancelReservationDto {
  @Field()
  @IsNotEmpty()
  @IsString()
  reservationId: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  reason?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  cancelledBy?: string;
}

@InputType()
export class GetReservationsFilterDto {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  customerId?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  restaurantId?: string;

  @Field(() => ReservationStatus, { nullable: true })
  @IsOptional()
  @IsEnum(ReservationStatus)
  status?: ReservationStatus;

  @Field({ nullable: true })
  @IsOptional()
  @IsDateString()
  date?: string;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  skip?: number;
}

@InputType()
export class CheckAvailabilityDto {
  @Field()
  @IsNotEmpty()
  @IsString()
  restaurantId: string;

  @Field()
  @IsNotEmpty()
  @IsDateString()
  date: string;

  @Field()
  @IsNotEmpty()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'Start time must be HH:MM format.' })
  startTime: string;

  @Field()
  @IsNotEmpty()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'End time must be HH:MM format.' })
  endTime: string;

  @Field(() => Int)
  @IsNumber()
  @Min(1)
  partySize: number;
}
