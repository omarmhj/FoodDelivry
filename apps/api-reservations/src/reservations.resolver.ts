import { Resolver, Mutation, Query, Args, Context } from '@nestjs/graphql';
import { UseGuards, Logger } from '@nestjs/common';
import { ReservationsService } from './reservations.service';
import {
  CreateReservationDto,
  UpdateReservationStatusDto,
  CancelReservationDto,
  GetReservationsFilterDto,
  CheckAvailabilityDto,
  CreateTableDto,
  UpdateTableDto,
  DeleteTableDto,
} from './dto/reservation.dto';
import {
  Reservation,
  TableEntity,
  CreateReservationResponse,
  UpdateReservationStatusResponse,
  CancelReservationResponse,
  GetReservationsResponse,
  CheckAvailabilityResponse,
  TableResponse,
  TablesResponse,
} from './entities/reservation.entities';
import { AuthGuard } from './guards/auth.guard';

@Resolver('Reservation')
export class ReservationsResolver {
  private readonly logger = new Logger(ReservationsResolver.name);

  constructor(private readonly reservationsService: ReservationsService) {}

  // ==================== TABLE MUTATIONS ====================

  @Mutation(() => TableResponse)
  @UseGuards(AuthGuard)
  async createTable(
    @Args('createTableDto') dto: CreateTableDto,
    @Context() context: Record<string, unknown>,
  ): Promise<TableResponse> {
    try {
      const req = context.req as any;
      const restaurantId = req.restaurant?.id;
      if (!restaurantId) {
        return { message: 'Restaurant authentication required', error: { message: 'Not authenticated as restaurant', code: 'AUTH_REQUIRED' } };
      }
      return await this.reservationsService.createTable(dto, restaurantId);
    } catch (error) {
      return { message: 'Failed to create table', error: { message: error.message, code: 'CREATE_TABLE_FAILED' } };
    }
  }

  @Mutation(() => TableResponse)
  @UseGuards(AuthGuard)
  async updateTable(
    @Args('updateTableDto') dto: UpdateTableDto,
    @Context() context: Record<string, unknown>,
  ): Promise<TableResponse> {
    try {
      const req = context.req as any;
      const restaurantId = req.restaurant?.id;
      if (!restaurantId) {
        return { message: 'Restaurant authentication required', error: { message: 'Not authenticated as restaurant', code: 'AUTH_REQUIRED' } };
      }
      return await this.reservationsService.updateTable(dto, restaurantId);
    } catch (error) {
      return { message: 'Failed to update table', error: { message: error.message, code: 'UPDATE_TABLE_FAILED' } };
    }
  }

  @Mutation(() => TableResponse)
  @UseGuards(AuthGuard)
  async deleteTable(
    @Args('deleteTableDto') dto: DeleteTableDto,
    @Context() context: Record<string, unknown>,
  ): Promise<TableResponse> {
    try {
      const req = context.req as any;
      const restaurantId = req.restaurant?.id;
      if (!restaurantId) {
        return { message: 'Restaurant authentication required', error: { message: 'Not authenticated as restaurant', code: 'AUTH_REQUIRED' } };
      }
      const result = await this.reservationsService.deleteTable(dto, restaurantId);
      return { message: result.message };
    } catch (error) {
      return { message: 'Failed to delete table', error: { message: error.message, code: 'DELETE_TABLE_FAILED' } };
    }
  }

  @Query(() => TablesResponse)
  @UseGuards(AuthGuard)
  async getRestaurantTables(
    @Args('restaurantId') restaurantId: string,
  ): Promise<TablesResponse> {
    try {
      return await this.reservationsService.getRestaurantTables(restaurantId);
    } catch (error) {
      return { tables: [], error: { message: error.message, code: 'GET_TABLES_FAILED' } };
    }
  }

  // ==================== RESERVATION MUTATIONS ====================

  @Mutation(() => CreateReservationResponse)
  @UseGuards(AuthGuard)
  async createReservation(
    @Args('createReservationDto') dto: CreateReservationDto,
  ): Promise<CreateReservationResponse> {
    try {
      const result = await this.reservationsService.createReservation(dto);
      return {
        message: result.message,
        reservation: result.reservation as unknown as Reservation,
      };
    } catch (error) {
      return { message: 'Failed to create reservation', error: { message: error.message, code: 'CREATE_RESERVATION_FAILED' } };
    }
  }

  @Mutation(() => UpdateReservationStatusResponse)
  @UseGuards(AuthGuard)
  async updateReservationStatus(
    @Args('updateStatusDto') dto: UpdateReservationStatusDto,
  ): Promise<UpdateReservationStatusResponse> {
    try {
      const result = await this.reservationsService.updateReservationStatus(dto);
      return {
        message: result.message,
        reservation: result.reservation as unknown as Reservation,
      };
    } catch (error) {
      return { message: 'Failed to update reservation status', error: { message: error.message, code: 'UPDATE_STATUS_FAILED' } };
    }
  }

  @Mutation(() => CancelReservationResponse)
  @UseGuards(AuthGuard)
  async cancelReservation(
    @Args('cancelReservationDto') dto: CancelReservationDto,
    @Context() context: Record<string, unknown>,
  ): Promise<CancelReservationResponse> {
    try {
      const req = context.req as any;
      if (!dto.cancelledBy) {
        dto.cancelledBy = req.user?.id || req.restaurant?.id;
      }
      const result = await this.reservationsService.cancelReservation(dto);
      return {
        message: result.message,
        reservation: result.reservation as unknown as Reservation,
      };
    } catch (error) {
      return { message: 'Failed to cancel reservation', error: { message: error.message, code: 'CANCEL_RESERVATION_FAILED' } };
    }
  }

  // ==================== RESERVATION QUERIES ====================

  @Query(() => Reservation)
  @UseGuards(AuthGuard)
  async getReservationById(
    @Args('reservationId') reservationId: string,
  ): Promise<Reservation> {
    return (await this.reservationsService.getReservationById(reservationId)) as unknown as Reservation;
  }

  @Query(() => GetReservationsResponse)
  @UseGuards(AuthGuard)
  async getReservations(
    @Args('filterDto', { nullable: true }) filterDto?: GetReservationsFilterDto,
  ): Promise<GetReservationsResponse> {
    try {
      const result = await this.reservationsService.getReservations(filterDto || {});
      return {
        reservations: result.reservations as unknown as Reservation[],
        total: result.total,
        limit: result.limit,
        skip: result.skip,
      };
    } catch (error) {
      return { reservations: [], total: 0, limit: 0, skip: 0, error: { message: error.message } };
    }
  }

  @Query(() => GetReservationsResponse)
  @UseGuards(AuthGuard)
  async getCustomerReservations(
    @Args('customerId') customerId: string,
    @Args('limit', { nullable: true }) limit?: number,
    @Args('skip', { nullable: true }) skip?: number,
  ): Promise<GetReservationsResponse> {
    try {
      const result = await this.reservationsService.getReservations({
        customerId,
        limit: limit || 20,
        skip: skip || 0,
      });
      return {
        reservations: result.reservations as unknown as Reservation[],
        total: result.total,
        limit: result.limit,
        skip: result.skip,
      };
    } catch (error) {
      return { reservations: [], total: 0, limit: 0, skip: 0, error: { message: error.message } };
    }
  }

  @Query(() => GetReservationsResponse)
  @UseGuards(AuthGuard)
  async getRestaurantReservations(
    @Args('restaurantId') restaurantId: string,
    @Args('date', { nullable: true }) date?: string,
    @Args('limit', { nullable: true }) limit?: number,
    @Args('skip', { nullable: true }) skip?: number,
  ): Promise<GetReservationsResponse> {
    try {
      const result = await this.reservationsService.getReservations({
        restaurantId,
        date,
        limit: limit || 20,
        skip: skip || 0,
      });
      return {
        reservations: result.reservations as unknown as Reservation[],
        total: result.total,
        limit: result.limit,
        skip: result.skip,
      };
    } catch (error) {
      return { reservations: [], total: 0, limit: 0, skip: 0, error: { message: error.message } };
    }
  }

  @Query(() => CheckAvailabilityResponse)
  async checkAvailability(
    @Args('checkAvailabilityDto') dto: CheckAvailabilityDto,
  ): Promise<CheckAvailabilityResponse> {
    try {
      const result = await this.reservationsService.checkAvailability(dto);
      return {
        available: result.available,
        availableTables: result.availableTables as unknown as TableEntity[],
      };
    } catch (error) {
      return { available: false, availableTables: [], error: { message: error.message } };
    }
  }
}
