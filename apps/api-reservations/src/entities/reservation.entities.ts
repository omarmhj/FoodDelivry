import { ObjectType, Field, Int } from '@nestjs/graphql';
import { ReservationStatus } from '../dto/reservation.dto';

@ObjectType()
export class TableEntity {
  @Field()
  id: string;

  @Field()
  restaurantId: string;

  @Field()
  tableNumber: string;

  @Field(() => Int)
  capacity: number;

  @Field({ nullable: true })
  location?: string;

  @Field()
  isActive: boolean;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}

@ObjectType()
export class Reservation {
  @Field()
  id: string;

  @Field()
  reservationNumber: string;

  @Field()
  customerId: string;

  @Field()
  customerName: string;

  @Field()
  customerEmail: string;

  @Field({ nullable: true })
  customerPhone?: string;

  @Field()
  restaurantId: string;

  @Field()
  restaurantName: string;

  @Field()
  tableId: string;

  @Field(() => TableEntity, { nullable: true })
  table?: TableEntity;

  @Field()
  date: Date;

  @Field()
  startTime: string;

  @Field()
  endTime: string;

  @Field(() => Int)
  partySize: number;

  @Field(() => ReservationStatus)
  status: ReservationStatus;

  @Field({ nullable: true })
  specialRequests?: string;

  @Field({ nullable: true })
  notes?: string;

  @Field({ nullable: true })
  cancelledBy?: string;

  @Field({ nullable: true })
  cancellationReason?: string;

  @Field(() => String, { nullable: true })
  metadata?: any;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}

// Response Types
@ObjectType()
export class ErrorType {
  @Field({ nullable: true })
  message?: string;

  @Field({ nullable: true })
  code?: string;
}

@ObjectType()
export class CreateReservationResponse {
  @Field()
  message: string;

  @Field(() => Reservation, { nullable: true })
  reservation?: Reservation;

  @Field(() => ErrorType, { nullable: true })
  error?: ErrorType;
}

@ObjectType()
export class UpdateReservationStatusResponse {
  @Field()
  message: string;

  @Field(() => Reservation, { nullable: true })
  reservation?: Reservation;

  @Field(() => ErrorType, { nullable: true })
  error?: ErrorType;
}

@ObjectType()
export class CancelReservationResponse {
  @Field()
  message: string;

  @Field(() => Reservation, { nullable: true })
  reservation?: Reservation;

  @Field(() => ErrorType, { nullable: true })
  error?: ErrorType;
}

@ObjectType()
export class GetReservationsResponse {
  @Field(() => [Reservation])
  reservations: Reservation[];

  @Field(() => Int)
  total: number;

  @Field(() => Int)
  limit: number;

  @Field(() => Int)
  skip: number;

  @Field(() => ErrorType, { nullable: true })
  error?: ErrorType;
}

@ObjectType()
export class AvailableSlot {
  @Field()
  startTime: string;

  @Field()
  endTime: string;

  @Field(() => [TableEntity])
  availableTables: TableEntity[];
}

@ObjectType()
export class CheckAvailabilityResponse {
  @Field()
  available: boolean;

  @Field(() => [TableEntity])
  availableTables: TableEntity[];

  @Field(() => ErrorType, { nullable: true })
  error?: ErrorType;
}

@ObjectType()
export class TableResponse {
  @Field()
  message: string;

  @Field(() => TableEntity, { nullable: true })
  table?: TableEntity;

  @Field(() => ErrorType, { nullable: true })
  error?: ErrorType;
}

@ObjectType()
export class TablesResponse {
  @Field(() => [TableEntity])
  tables: TableEntity[];

  @Field(() => ErrorType, { nullable: true })
  error?: ErrorType;
}
