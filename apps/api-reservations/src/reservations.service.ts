import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RabbitMQService } from '../../../libs/shared/src/rabbitmq.service';
import { RedisService } from '../../../libs/shared/src/redis.service';
import { CACHE_KEYS } from '../../../libs/shared/src/message-patterns';
import {
  CreateReservationDto,
  UpdateReservationStatusDto,
  CancelReservationDto,
  GetReservationsFilterDto,
  CheckAvailabilityDto,
  CreateTableDto,
  UpdateTableDto,
  DeleteTableDto,
  ReservationStatus,
} from './dto/reservation.dto';

@Injectable()
export class ReservationsService {
  private readonly logger = new Logger(ReservationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly rabbitMQService: RabbitMQService,
    private readonly redisService: RedisService,
  ) {}

  // ==================== TABLE MANAGEMENT ====================

  async createTable(dto: CreateTableDto, restaurantId: string) {
    this.logger.log(`🪑 Creating table ${dto.tableNumber} for restaurant: ${restaurantId}`);

    const existing = await this.prisma.table.findUnique({
      where: {
        restaurantId_tableNumber: { restaurantId, tableNumber: dto.tableNumber },
      },
    });

    if (existing) {
      throw new BadRequestException(`Table ${dto.tableNumber} already exists`);
    }

    const table = await this.prisma.table.create({
      data: {
        restaurantId,
        tableNumber: dto.tableNumber,
        capacity: dto.capacity,
        location: dto.location,
      },
    });

    return { message: 'Table created successfully', table };
  }

  async updateTable(dto: UpdateTableDto, restaurantId: string) {
    const table = await this.prisma.table.findFirst({
      where: { id: dto.id, restaurantId },
    });

    if (!table) {
      throw new NotFoundException('Table not found or not owned by restaurant');
    }

    const updated = await this.prisma.table.update({
      where: { id: dto.id },
      data: {
        ...(dto.tableNumber !== undefined && { tableNumber: dto.tableNumber }),
        ...(dto.capacity !== undefined && { capacity: dto.capacity }),
        ...(dto.location !== undefined && { location: dto.location }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });

    return { message: 'Table updated successfully', table: updated };
  }

  async deleteTable(dto: DeleteTableDto, restaurantId: string) {
    const table = await this.prisma.table.findFirst({
      where: { id: dto.id, restaurantId },
    });

    if (!table) {
      throw new NotFoundException('Table not found or not owned by restaurant');
    }

    // Check for future reservations
    const futureReservations = await this.prisma.reservation.count({
      where: {
        tableId: dto.id,
        date: { gte: new Date() },
        status: { in: ['PENDING', 'CONFIRMED'] },
      },
    });

    if (futureReservations > 0) {
      throw new BadRequestException(
        `Cannot delete table with ${futureReservations} upcoming reservation(s). Cancel them first.`,
      );
    }

    await this.prisma.table.delete({ where: { id: dto.id } });
    return { message: 'Table deleted successfully' };
  }

  async getRestaurantTables(restaurantId: string) {
    const tables = await this.prisma.table.findMany({
      where: { restaurantId },
      orderBy: { tableNumber: 'asc' },
    });
    return { tables };
  }

  // ==================== RESERVATION MANAGEMENT ====================

  async createReservation(dto: CreateReservationDto) {
    this.logger.log(`📅 Creating reservation for ${dto.customerName} at ${dto.restaurantName}`);

    // Validate restaurant exists
    const restaurantValidation = await this.rabbitMQService.sendAndWait(
      'restaurant.validate',
      { restaurantId: dto.restaurantId },
    );
    if (!restaurantValidation.isValid) {
      throw new BadRequestException(`Invalid restaurant: ${restaurantValidation.error}`);
    }

    // Validate customer exists
    const customerValidation = await this.rabbitMQService.sendAndWait(
      'user.validate',
      { userId: dto.customerId },
    );
    if (!customerValidation.isValid) {
      throw new BadRequestException(`Invalid customer: ${customerValidation.error}`);
    }

    // Validate time range
    if (dto.startTime >= dto.endTime) {
      throw new BadRequestException('End time must be after start time');
    }

    const reservationDate = new Date(dto.date);
    reservationDate.setHours(0, 0, 0, 0);

    // Don't allow past dates
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (reservationDate < today) {
      throw new BadRequestException('Cannot create reservation for a past date');
    }

    // Find or auto-assign a table
    let tableId = dto.tableId;
    if (!tableId) {
      const available = await this.findAvailableTables(
        dto.restaurantId,
        reservationDate,
        dto.startTime,
        dto.endTime,
        dto.partySize,
      );

      if (available.length === 0) {
        throw new BadRequestException('No tables available for the requested time and party size');
      }

      // Pick the smallest table that fits
      tableId = available[0].id;
    } else {
      // Validate the requested table
      const table = await this.prisma.table.findFirst({
        where: { id: tableId, restaurantId: dto.restaurantId, isActive: true },
      });

      if (!table) {
        throw new BadRequestException('Table not found or inactive');
      }

      if (table.capacity < dto.partySize) {
        throw new BadRequestException(
          `Table capacity (${table.capacity}) is less than party size (${dto.partySize})`,
        );
      }

      // Check for conflicts
      const conflict = await this.hasTimeConflict(tableId, reservationDate, dto.startTime, dto.endTime);
      if (conflict) {
        throw new BadRequestException('Table is already reserved for the requested time slot');
      }
    }

    const reservationNumber = await this.generateReservationNumber();

    const reservation = await this.prisma.reservation.create({
      data: {
        reservationNumber,
        customerId: dto.customerId,
        customerName: dto.customerName,
        customerEmail: dto.customerEmail,
        customerPhone: dto.customerPhone,
        restaurantId: dto.restaurantId,
        restaurantName: dto.restaurantName,
        tableId,
        date: reservationDate,
        startTime: dto.startTime,
        endTime: dto.endTime,
        partySize: dto.partySize,
        status: ReservationStatus.PENDING,
        specialRequests: dto.specialRequests,
      },
      include: { table: true },
    });

    // Cache reservation
    await this.cacheReservation(reservation);

    // Invalidate availability cache for this restaurant+date
    await this.invalidateAvailabilityCache(dto.restaurantId, dto.date);

    // Emit event
    this.rabbitMQService.emitEvent('reservation.created', {
      reservationId: reservation.id,
      reservationNumber: reservation.reservationNumber,
      customerId: reservation.customerId,
      customerName: reservation.customerName,
      customerEmail: reservation.customerEmail,
      restaurantId: reservation.restaurantId,
      restaurantName: reservation.restaurantName,
      date: reservation.date,
      startTime: reservation.startTime,
      endTime: reservation.endTime,
      partySize: reservation.partySize,
      tableNumber: reservation.table?.tableNumber,
      timestamp: new Date(),
    });

    this.logger.log(`✅ Reservation created: ${reservationNumber}`);
    return { message: 'Reservation created successfully', reservation };
  }

  async updateReservationStatus(dto: UpdateReservationStatusDto) {
    this.logger.log(`🔄 Updating reservation ${dto.reservationId} to ${dto.status}`);

    const reservation = await this.prisma.reservation.findUnique({
      where: { id: dto.reservationId },
      include: { table: true },
    });

    if (!reservation) {
      throw new NotFoundException('Reservation not found');
    }

    this.validateStatusTransition(reservation.status as ReservationStatus, dto.status);

    const updated = await this.prisma.reservation.update({
      where: { id: dto.reservationId },
      data: { status: dto.status, notes: dto.reason },
      include: { table: true },
    });

    await this.cacheReservation(updated);
    await this.invalidateAvailabilityCache(
      updated.restaurantId,
      updated.date.toISOString().split('T')[0],
    );

    const eventName =
      dto.status === ReservationStatus.CONFIRMED
        ? 'reservation.confirmed'
        : dto.status === ReservationStatus.COMPLETED
          ? 'reservation.completed'
          : dto.status === ReservationStatus.NO_SHOW
            ? 'reservation.no_show'
            : 'reservation.status.updated';

    this.rabbitMQService.emitEvent(eventName, {
      reservationId: updated.id,
      reservationNumber: updated.reservationNumber,
      customerId: updated.customerId,
      customerEmail: updated.customerEmail,
      restaurantId: updated.restaurantId,
      restaurantName: updated.restaurantName,
      status: updated.status,
      previousStatus: reservation.status,
      timestamp: new Date(),
    });

    return { message: 'Reservation status updated', reservation: updated };
  }

  async cancelReservation(dto: CancelReservationDto) {
    this.logger.log(`❌ Cancelling reservation: ${dto.reservationId}`);

    const reservation = await this.prisma.reservation.findUnique({
      where: { id: dto.reservationId },
      include: { table: true },
    });

    if (!reservation) {
      throw new NotFoundException('Reservation not found');
    }

    const cancellable: ReservationStatus[] = [ReservationStatus.PENDING, ReservationStatus.CONFIRMED];
    if (!cancellable.includes(reservation.status as ReservationStatus)) {
      throw new BadRequestException(`Cannot cancel reservation with status: ${reservation.status}`);
    }

    const updated = await this.prisma.reservation.update({
      where: { id: dto.reservationId },
      data: {
        status: ReservationStatus.CANCELLED,
        cancelledBy: dto.cancelledBy,
        cancellationReason: dto.reason,
      },
      include: { table: true },
    });

    await this.cacheReservation(updated);
    await this.invalidateAvailabilityCache(
      updated.restaurantId,
      updated.date.toISOString().split('T')[0],
    );

    this.rabbitMQService.emitEvent('reservation.cancelled', {
      reservationId: updated.id,
      reservationNumber: updated.reservationNumber,
      customerId: updated.customerId,
      customerEmail: updated.customerEmail,
      restaurantId: updated.restaurantId,
      restaurantName: updated.restaurantName,
      reason: dto.reason,
      timestamp: new Date(),
    });

    return { message: 'Reservation cancelled successfully', reservation: updated };
  }

  async getReservationById(reservationId: string) {
    // Try cache first
    const cached = await this.redisService.getJson(CACHE_KEYS.RESERVATION(reservationId));
    if (cached) return cached;

    const reservation = await this.prisma.reservation.findUnique({
      where: { id: reservationId },
      include: { table: true },
    });

    if (!reservation) {
      throw new NotFoundException('Reservation not found');
    }

    await this.cacheReservation(reservation);
    return reservation;
  }

  async getReservations(filter: GetReservationsFilterDto) {
    const where: any = {};
    if (filter.customerId) where.customerId = filter.customerId;
    if (filter.restaurantId) where.restaurantId = filter.restaurantId;
    if (filter.status) where.status = filter.status;
    if (filter.date) {
      const d = new Date(filter.date);
      d.setHours(0, 0, 0, 0);
      const next = new Date(d);
      next.setDate(next.getDate() + 1);
      where.date = { gte: d, lt: next };
    }

    const limit = filter.limit || 20;
    const skip = filter.skip || 0;

    const [reservations, total] = await Promise.all([
      this.prisma.reservation.findMany({
        where,
        include: { table: true },
        orderBy: { date: 'asc' },
        take: limit,
        skip,
      }),
      this.prisma.reservation.count({ where }),
    ]);

    return { reservations, total, limit, skip };
  }

  async checkAvailability(dto: CheckAvailabilityDto) {
    const cacheKey = CACHE_KEYS.TABLE_AVAILABILITY(dto.restaurantId, dto.date);
    const cached = await this.redisService.getJson<any>(cacheKey);

    // Simple cache — only if exact same params
    const tables = await this.findAvailableTables(
      dto.restaurantId,
      new Date(dto.date),
      dto.startTime,
      dto.endTime,
      dto.partySize,
    );

    return {
      available: tables.length > 0,
      availableTables: tables,
    };
  }

  // ==================== PRIVATE HELPERS ====================

  private async findAvailableTables(
    restaurantId: string,
    date: Date,
    startTime: string,
    endTime: string,
    partySize: number,
  ) {
    // Get all active tables with enough capacity
    const tables = await this.prisma.table.findMany({
      where: {
        restaurantId,
        isActive: true,
        capacity: { gte: partySize },
      },
      orderBy: { capacity: 'asc' }, // Prefer smallest fitting table
    });

    const dateKey = new Date(date);
    dateKey.setHours(0, 0, 0, 0);
    const nextDay = new Date(dateKey);
    nextDay.setDate(nextDay.getDate() + 1);

    // Get all reservations for this restaurant on this date that aren't cancelled/completed/no-show
    const existingReservations = await this.prisma.reservation.findMany({
      where: {
        restaurantId,
        date: { gte: dateKey, lt: nextDay },
        status: { in: ['PENDING', 'CONFIRMED', 'SEATED'] },
      },
    });

    // Filter tables that have no time conflicts
    return tables.filter((table) => {
      const tableReservations = existingReservations.filter((r) => r.tableId === table.id);
      return !tableReservations.some((r) => this.timesOverlap(startTime, endTime, r.startTime, r.endTime));
    });
  }

  private async hasTimeConflict(
    tableId: string,
    date: Date,
    startTime: string,
    endTime: string,
  ): Promise<boolean> {
    const dateKey = new Date(date);
    dateKey.setHours(0, 0, 0, 0);
    const nextDay = new Date(dateKey);
    nextDay.setDate(nextDay.getDate() + 1);

    const existing = await this.prisma.reservation.findMany({
      where: {
        tableId,
        date: { gte: dateKey, lt: nextDay },
        status: { in: ['PENDING', 'CONFIRMED', 'SEATED'] },
      },
    });

    return existing.some((r) => this.timesOverlap(startTime, endTime, r.startTime, r.endTime));
  }

  private timesOverlap(start1: string, end1: string, start2: string, end2: string): boolean {
    // Convert "HH:MM" to minutes for comparison
    const toMin = (t: string) => {
      const [h, m] = t.split(':').map(Number);
      return h * 60 + m;
    };
    const s1 = toMin(start1), e1 = toMin(end1);
    const s2 = toMin(start2), e2 = toMin(end2);
    return s1 < e2 && s2 < e1;
  }

  private validateStatusTransition(current: ReservationStatus, next: ReservationStatus) {
    const valid: Record<ReservationStatus, ReservationStatus[]> = {
      [ReservationStatus.PENDING]: [ReservationStatus.CONFIRMED, ReservationStatus.CANCELLED],
      [ReservationStatus.CONFIRMED]: [ReservationStatus.SEATED, ReservationStatus.CANCELLED, ReservationStatus.NO_SHOW],
      [ReservationStatus.SEATED]: [ReservationStatus.COMPLETED],
      [ReservationStatus.COMPLETED]: [],
      [ReservationStatus.CANCELLED]: [],
      [ReservationStatus.NO_SHOW]: [],
    };

    if (!valid[current]?.includes(next)) {
      throw new BadRequestException(`Invalid status transition from ${current} to ${next}`);
    }
  }

  private async generateReservationNumber(): Promise<string> {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `RES-${timestamp}-${random}`;
  }

  private async cacheReservation(reservation: any): Promise<void> {
    const isFinalized = ['COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(reservation.status);
    const ttl = isFinalized ? 86400 : 3600;
    await this.redisService.set(CACHE_KEYS.RESERVATION(reservation.id), reservation, ttl);
  }

  private async invalidateAvailabilityCache(restaurantId: string, date: string): Promise<void> {
    try {
      const key = CACHE_KEYS.TABLE_AVAILABILITY(restaurantId, date);
      await this.redisService.del(key);
      const resKey = CACHE_KEYS.RESTAURANT_RESERVATIONS(restaurantId, date);
      await this.redisService.del(resKey);
    } catch (error) {
      this.logger.error(`Failed to invalidate availability cache: ${error.message}`);
    }
  }
}
