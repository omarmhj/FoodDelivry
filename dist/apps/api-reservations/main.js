/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ([
/* 0 */,
/* 1 */
/***/ ((module) => {

module.exports = require("@nestjs/core");

/***/ }),
/* 2 */
/***/ ((module) => {

module.exports = require("@nestjs/common");

/***/ }),
/* 3 */
/***/ ((module) => {

module.exports = require("@nestjs/config");

/***/ }),
/* 4 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ReservationsModule = void 0;
const tslib_1 = __webpack_require__(5);
const common_1 = __webpack_require__(2);
const config_1 = __webpack_require__(3);
const graphql_1 = __webpack_require__(6);
const jwt_1 = __webpack_require__(7);
const apollo_1 = __webpack_require__(8);
const prisma_service_1 = __webpack_require__(9);
const reservations_service_1 = __webpack_require__(11);
const reservations_resolver_1 = __webpack_require__(20);
const auth_guard_1 = __webpack_require__(22);
const shared_module_1 = __webpack_require__(23);
let ReservationsModule = class ReservationsModule {
};
exports.ReservationsModule = ReservationsModule;
exports.ReservationsModule = ReservationsModule = tslib_1.__decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                envFilePath: ['apps/api-reservations/.env.local', 'apps/api-reservations/.env'],
            }),
            graphql_1.GraphQLModule.forRoot({
                driver: apollo_1.ApolloFederationDriver,
                autoSchemaFile: {
                    federation: 2,
                },
                context: ({ req, res }) => ({ req, res }),
            }),
            shared_module_1.SharedModule,
        ],
        providers: [
            reservations_service_1.ReservationsService,
            reservations_resolver_1.ReservationsResolver,
            prisma_service_1.PrismaService,
            auth_guard_1.AuthGuard,
            config_1.ConfigService,
            jwt_1.JwtService,
        ],
        exports: [reservations_service_1.ReservationsService, prisma_service_1.PrismaService],
    })
], ReservationsModule);


/***/ }),
/* 5 */
/***/ ((module) => {

module.exports = require("tslib");

/***/ }),
/* 6 */
/***/ ((module) => {

module.exports = require("@nestjs/graphql");

/***/ }),
/* 7 */
/***/ ((module) => {

module.exports = require("@nestjs/jwt");

/***/ }),
/* 8 */
/***/ ((module) => {

module.exports = require("@nestjs/apollo");

/***/ }),
/* 9 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var PrismaService_1;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.PrismaService = void 0;
const tslib_1 = __webpack_require__(5);
const common_1 = __webpack_require__(2);
const reservations_client_1 = __webpack_require__(10);
let PrismaService = PrismaService_1 = class PrismaService extends reservations_client_1.PrismaClient {
    constructor() {
        super({
            datasources: {
                db: {
                    url: process.env.DATABASE_URL,
                },
            },
        });
        this.logger = new common_1.Logger(PrismaService_1.name);
    }
    async onModuleInit() {
        try {
            await this.$connect();
            this.logger.log('✅ Database connected successfully (Reservations)');
        }
        catch (error) {
            this.logger.error('❌ Failed to connect to database (Reservations):', error);
            throw error;
        }
    }
    async onModuleDestroy() {
        await this.$disconnect();
        this.logger.log('🔌 Reservations database disconnected');
    }
};
exports.PrismaService = PrismaService;
exports.PrismaService = PrismaService = PrismaService_1 = tslib_1.__decorate([
    (0, common_1.Injectable)(),
    tslib_1.__metadata("design:paramtypes", [])
], PrismaService);


/***/ }),
/* 10 */
/***/ ((module) => {

module.exports = require(".prisma/reservations-client");

/***/ }),
/* 11 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var ReservationsService_1;
var _a, _b, _c;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ReservationsService = void 0;
const tslib_1 = __webpack_require__(5);
const common_1 = __webpack_require__(2);
const prisma_service_1 = __webpack_require__(9);
const rabbitmq_service_1 = __webpack_require__(12);
const redis_service_1 = __webpack_require__(15);
const message_patterns_1 = __webpack_require__(17);
const reservation_dto_1 = __webpack_require__(18);
let ReservationsService = ReservationsService_1 = class ReservationsService {
    constructor(prisma, rabbitMQService, redisService) {
        this.prisma = prisma;
        this.rabbitMQService = rabbitMQService;
        this.redisService = redisService;
        this.logger = new common_1.Logger(ReservationsService_1.name);
    }
    // ==================== TABLE MANAGEMENT ====================
    async createTable(dto, restaurantId) {
        this.logger.log(`🪑 Creating table ${dto.tableNumber} for restaurant: ${restaurantId}`);
        const existing = await this.prisma.table.findUnique({
            where: {
                restaurantId_tableNumber: { restaurantId, tableNumber: dto.tableNumber },
            },
        });
        if (existing) {
            throw new common_1.BadRequestException(`Table ${dto.tableNumber} already exists`);
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
    async updateTable(dto, restaurantId) {
        const table = await this.prisma.table.findFirst({
            where: { id: dto.id, restaurantId },
        });
        if (!table) {
            throw new common_1.NotFoundException('Table not found or not owned by restaurant');
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
    async deleteTable(dto, restaurantId) {
        const table = await this.prisma.table.findFirst({
            where: { id: dto.id, restaurantId },
        });
        if (!table) {
            throw new common_1.NotFoundException('Table not found or not owned by restaurant');
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
            throw new common_1.BadRequestException(`Cannot delete table with ${futureReservations} upcoming reservation(s). Cancel them first.`);
        }
        await this.prisma.table.delete({ where: { id: dto.id } });
        return { message: 'Table deleted successfully' };
    }
    async getRestaurantTables(restaurantId) {
        const tables = await this.prisma.table.findMany({
            where: { restaurantId },
            orderBy: { tableNumber: 'asc' },
        });
        return { tables };
    }
    // ==================== RESERVATION MANAGEMENT ====================
    async createReservation(dto) {
        this.logger.log(`📅 Creating reservation for ${dto.customerName} at ${dto.restaurantName}`);
        // Validate restaurant exists
        const restaurantValidation = await this.rabbitMQService.sendAndWait('restaurant.validate', { restaurantId: dto.restaurantId });
        if (!restaurantValidation.isValid) {
            throw new common_1.BadRequestException(`Invalid restaurant: ${restaurantValidation.error}`);
        }
        // Validate customer exists
        const customerValidation = await this.rabbitMQService.sendAndWait('user.validate', { userId: dto.customerId });
        if (!customerValidation.isValid) {
            throw new common_1.BadRequestException(`Invalid customer: ${customerValidation.error}`);
        }
        // Validate time range
        if (dto.startTime >= dto.endTime) {
            throw new common_1.BadRequestException('End time must be after start time');
        }
        const reservationDate = new Date(dto.date);
        reservationDate.setHours(0, 0, 0, 0);
        // Don't allow past dates
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (reservationDate < today) {
            throw new common_1.BadRequestException('Cannot create reservation for a past date');
        }
        // Find or auto-assign a table
        let tableId = dto.tableId;
        if (!tableId) {
            const available = await this.findAvailableTables(dto.restaurantId, reservationDate, dto.startTime, dto.endTime, dto.partySize);
            if (available.length === 0) {
                throw new common_1.BadRequestException('No tables available for the requested time and party size');
            }
            // Pick the smallest table that fits
            tableId = available[0].id;
        }
        else {
            // Validate the requested table
            const table = await this.prisma.table.findFirst({
                where: { id: tableId, restaurantId: dto.restaurantId, isActive: true },
            });
            if (!table) {
                throw new common_1.BadRequestException('Table not found or inactive');
            }
            if (table.capacity < dto.partySize) {
                throw new common_1.BadRequestException(`Table capacity (${table.capacity}) is less than party size (${dto.partySize})`);
            }
            // Check for conflicts
            const conflict = await this.hasTimeConflict(tableId, reservationDate, dto.startTime, dto.endTime);
            if (conflict) {
                throw new common_1.BadRequestException('Table is already reserved for the requested time slot');
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
                status: reservation_dto_1.ReservationStatus.PENDING,
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
    async updateReservationStatus(dto) {
        this.logger.log(`🔄 Updating reservation ${dto.reservationId} to ${dto.status}`);
        const reservation = await this.prisma.reservation.findUnique({
            where: { id: dto.reservationId },
            include: { table: true },
        });
        if (!reservation) {
            throw new common_1.NotFoundException('Reservation not found');
        }
        this.validateStatusTransition(reservation.status, dto.status);
        const updated = await this.prisma.reservation.update({
            where: { id: dto.reservationId },
            data: { status: dto.status, notes: dto.reason },
            include: { table: true },
        });
        await this.cacheReservation(updated);
        await this.invalidateAvailabilityCache(updated.restaurantId, updated.date.toISOString().split('T')[0]);
        const eventName = dto.status === reservation_dto_1.ReservationStatus.CONFIRMED
            ? 'reservation.confirmed'
            : dto.status === reservation_dto_1.ReservationStatus.COMPLETED
                ? 'reservation.completed'
                : dto.status === reservation_dto_1.ReservationStatus.NO_SHOW
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
    async cancelReservation(dto) {
        this.logger.log(`❌ Cancelling reservation: ${dto.reservationId}`);
        const reservation = await this.prisma.reservation.findUnique({
            where: { id: dto.reservationId },
            include: { table: true },
        });
        if (!reservation) {
            throw new common_1.NotFoundException('Reservation not found');
        }
        const cancellable = [reservation_dto_1.ReservationStatus.PENDING, reservation_dto_1.ReservationStatus.CONFIRMED];
        if (!cancellable.includes(reservation.status)) {
            throw new common_1.BadRequestException(`Cannot cancel reservation with status: ${reservation.status}`);
        }
        const updated = await this.prisma.reservation.update({
            where: { id: dto.reservationId },
            data: {
                status: reservation_dto_1.ReservationStatus.CANCELLED,
                cancelledBy: dto.cancelledBy,
                cancellationReason: dto.reason,
            },
            include: { table: true },
        });
        await this.cacheReservation(updated);
        await this.invalidateAvailabilityCache(updated.restaurantId, updated.date.toISOString().split('T')[0]);
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
    async getReservationById(reservationId) {
        // Try cache first
        const cached = await this.redisService.getJson(message_patterns_1.CACHE_KEYS.RESERVATION(reservationId));
        if (cached)
            return cached;
        const reservation = await this.prisma.reservation.findUnique({
            where: { id: reservationId },
            include: { table: true },
        });
        if (!reservation) {
            throw new common_1.NotFoundException('Reservation not found');
        }
        await this.cacheReservation(reservation);
        return reservation;
    }
    async getReservations(filter) {
        const where = {};
        if (filter.customerId)
            where.customerId = filter.customerId;
        if (filter.restaurantId)
            where.restaurantId = filter.restaurantId;
        if (filter.status)
            where.status = filter.status;
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
    async checkAvailability(dto) {
        const cacheKey = message_patterns_1.CACHE_KEYS.TABLE_AVAILABILITY(dto.restaurantId, dto.date);
        const cached = await this.redisService.getJson(cacheKey);
        // Simple cache — only if exact same params
        const tables = await this.findAvailableTables(dto.restaurantId, new Date(dto.date), dto.startTime, dto.endTime, dto.partySize);
        return {
            available: tables.length > 0,
            availableTables: tables,
        };
    }
    // ==================== PRIVATE HELPERS ====================
    async findAvailableTables(restaurantId, date, startTime, endTime, partySize) {
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
    async hasTimeConflict(tableId, date, startTime, endTime) {
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
    timesOverlap(start1, end1, start2, end2) {
        // Convert "HH:MM" to minutes for comparison
        const toMin = (t) => {
            const [h, m] = t.split(':').map(Number);
            return h * 60 + m;
        };
        const s1 = toMin(start1), e1 = toMin(end1);
        const s2 = toMin(start2), e2 = toMin(end2);
        return s1 < e2 && s2 < e1;
    }
    validateStatusTransition(current, next) {
        const valid = {
            [reservation_dto_1.ReservationStatus.PENDING]: [reservation_dto_1.ReservationStatus.CONFIRMED, reservation_dto_1.ReservationStatus.CANCELLED],
            [reservation_dto_1.ReservationStatus.CONFIRMED]: [reservation_dto_1.ReservationStatus.SEATED, reservation_dto_1.ReservationStatus.CANCELLED, reservation_dto_1.ReservationStatus.NO_SHOW],
            [reservation_dto_1.ReservationStatus.SEATED]: [reservation_dto_1.ReservationStatus.COMPLETED],
            [reservation_dto_1.ReservationStatus.COMPLETED]: [],
            [reservation_dto_1.ReservationStatus.CANCELLED]: [],
            [reservation_dto_1.ReservationStatus.NO_SHOW]: [],
        };
        if (!valid[current]?.includes(next)) {
            throw new common_1.BadRequestException(`Invalid status transition from ${current} to ${next}`);
        }
    }
    async generateReservationNumber() {
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        return `RES-${timestamp}-${random}`;
    }
    async cacheReservation(reservation) {
        const isFinalized = ['COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(reservation.status);
        const ttl = isFinalized ? 86400 : 3600;
        await this.redisService.set(message_patterns_1.CACHE_KEYS.RESERVATION(reservation.id), reservation, ttl);
    }
    async invalidateAvailabilityCache(restaurantId, date) {
        try {
            const key = message_patterns_1.CACHE_KEYS.TABLE_AVAILABILITY(restaurantId, date);
            await this.redisService.del(key);
            const resKey = message_patterns_1.CACHE_KEYS.RESTAURANT_RESERVATIONS(restaurantId, date);
            await this.redisService.del(resKey);
        }
        catch (error) {
            this.logger.error(`Failed to invalidate availability cache: ${error.message}`);
        }
    }
};
exports.ReservationsService = ReservationsService;
exports.ReservationsService = ReservationsService = ReservationsService_1 = tslib_1.__decorate([
    (0, common_1.Injectable)(),
    tslib_1.__metadata("design:paramtypes", [typeof (_a = typeof prisma_service_1.PrismaService !== "undefined" && prisma_service_1.PrismaService) === "function" ? _a : Object, typeof (_b = typeof rabbitmq_service_1.RabbitMQService !== "undefined" && rabbitmq_service_1.RabbitMQService) === "function" ? _b : Object, typeof (_c = typeof redis_service_1.RedisService !== "undefined" && redis_service_1.RedisService) === "function" ? _c : Object])
], ReservationsService);


/***/ }),
/* 12 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a, _b, _c;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.RabbitMQService = void 0;
const tslib_1 = __webpack_require__(5);
const common_1 = __webpack_require__(2);
const microservices_1 = __webpack_require__(13);
const rxjs_1 = __webpack_require__(14);
let RabbitMQService = class RabbitMQService {
    constructor(client, notificationsClient, analyticsClient) {
        this.client = client;
        this.notificationsClient = notificationsClient;
        this.analyticsClient = analyticsClient;
    }
    /**
     * Send a message to RabbitMQ queue
     */
    sendMessage(pattern, data) {
        return this.client.send(pattern, data).pipe((0, rxjs_1.timeout)(30000));
    }
    /**
     * Emit an event to both notifications and analytics queues
     */
    emitEvent(pattern, data) {
        try {
            // Emit to notifications queue
            if (this.notificationsClient) {
                this.notificationsClient.emit(pattern, data);
            }
            // Emit to analytics queue
            if (this.analyticsClient) {
                this.analyticsClient.emit(pattern, data);
            }
        }
        catch (error) {
            console.error(`❌ RabbitMQ: Failed to emit event "${pattern}":`, error.message);
        }
    }
    /**
     * Send a message and wait for response with retry logic
     */
    async sendAndWait(pattern, data, maxRetries = 3) {
        let lastError;
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const result = await this.sendMessage(pattern, data).toPromise();
                return result;
            }
            catch (error) {
                lastError = error;
                // Check if it's a "no matching handler" error (consumer not ready yet)
                const errorMessage = error?.message || error?.toString() || '';
                const isHandlerNotFound = errorMessage.includes('no matching message handler') ||
                    errorMessage.includes('no matching handler');
                // Only retry if it's a handler not found error and we have retries left
                if (isHandlerNotFound && attempt < maxRetries) {
                    const delay = Math.min(500 * Math.pow(2, attempt - 1), 2000); // Exponential backoff, max 2s
                    await new Promise(resolve => setTimeout(resolve, delay));
                    continue;
                }
                // If it's not a handler error or we're out of retries, throw
                throw error;
            }
        }
        // If we exhausted retries, throw the last error
        throw lastError;
    }
    /**
     * Health check for RabbitMQ connection
     */
    async healthCheck() {
        try {
            await this.sendMessage('health_check', {}).toPromise();
            return true;
        }
        catch (error) {
            return false;
        }
    }
};
exports.RabbitMQService = RabbitMQService;
exports.RabbitMQService = RabbitMQService = tslib_1.__decorate([
    (0, common_1.Injectable)(),
    tslib_1.__param(0, (0, common_1.Inject)('RABBITMQ_SERVICE')),
    tslib_1.__param(1, (0, common_1.Inject)('NOTIFICATIONS_SERVICE')),
    tslib_1.__param(2, (0, common_1.Inject)('ANALYTICS_SERVICE')),
    tslib_1.__metadata("design:paramtypes", [typeof (_a = typeof microservices_1.ClientProxy !== "undefined" && microservices_1.ClientProxy) === "function" ? _a : Object, typeof (_b = typeof microservices_1.ClientProxy !== "undefined" && microservices_1.ClientProxy) === "function" ? _b : Object, typeof (_c = typeof microservices_1.ClientProxy !== "undefined" && microservices_1.ClientProxy) === "function" ? _c : Object])
], RabbitMQService);


/***/ }),
/* 13 */
/***/ ((module) => {

module.exports = require("@nestjs/microservices");

/***/ }),
/* 14 */
/***/ ((module) => {

module.exports = require("rxjs");

/***/ }),
/* 15 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.RedisService = void 0;
const tslib_1 = __webpack_require__(5);
const common_1 = __webpack_require__(2);
const ioredis_1 = __webpack_require__(16);
let RedisService = class RedisService {
    constructor(redis) {
        this.redis = redis;
    }
    /**
     * Set a key-value pair with optional expiration
     */
    async set(key, value, ttl) {
        console.log(`🔴 REDIS SERVICE: Setting key "${key}" with TTL ${ttl}`);
        console.log(`🔴 REDIS SERVICE: Value type: ${typeof value}`);
        const serializedValue = typeof value === 'object'
            ? JSON.stringify(value)
            : String(value);
        try {
            let result;
            if (ttl) {
                result = await this.redis.setex(key, ttl, serializedValue);
                console.log(`🔴 REDIS SERVICE: SETEX result:`, result);
            }
            else {
                result = await this.redis.set(key, serializedValue);
                console.log(`🔴 REDIS SERVICE: SET result:`, result);
            }
            // Verify the key was actually set
            const verification = await this.redis.get(key);
            console.log(`🔴 REDIS SERVICE: Verification - key "${key}" exists:`, !!verification);
            return result;
        }
        catch (error) {
            console.error(`🔴 REDIS SERVICE: Error setting key "${key}":`, error.message);
            throw error;
        }
    }
    /**
     * Get a value by key
     */
    async get(key) {
        return this.redis.get(key);
    }
    /**
     * Get a value and parse it as JSON
     */
    async getJson(key) {
        const value = await this.redis.get(key);
        if (!value)
            return null;
        try {
            return JSON.parse(value);
        }
        catch (error) {
            return null;
        }
    }
    /**
     * Delete a key
     */
    async del(key) {
        return this.redis.del(key);
    }
    /**
     * Check if a key exists
     */
    async exists(key) {
        const result = await this.redis.exists(key);
        return result === 1;
    }
    /**
     * Set expiration for a key
     */
    async expire(key, seconds) {
        const result = await this.redis.expire(key, seconds);
        return result === 1;
    }
    /**
     * Get time to live for a key
     */
    async ttl(key) {
        return this.redis.ttl(key);
    }
    /**
     * Increment a numeric value
     */
    async incr(key) {
        return this.redis.incr(key);
    }
    /**
     * Increment a numeric value by a specific amount
     */
    async incrby(key, increment) {
        return this.redis.incrby(key, increment);
    }
    /**
     * Publish a message to a channel
     */
    async publish(channel, message) {
        const serializedMessage = typeof message === 'object'
            ? JSON.stringify(message)
            : message;
        return this.redis.publish(channel, serializedMessage);
    }
    /**
     * Subscribe to a channel
     */
    async subscribe(channel, callback) {
        const subscriber = this.redis.duplicate();
        await subscriber.subscribe(channel);
        subscriber.on('message', (receivedChannel, message) => {
            if (receivedChannel === channel) {
                callback(message);
            }
        });
    }
    /**
     * Health check for Redis connection
     */
    async healthCheck() {
        try {
            const result = await this.redis.ping();
            return result === 'PONG';
        }
        catch (error) {
            return false;
        }
    }
    /**
     * Get all keys matching a pattern
     */
    async keys(pattern) {
        return this.redis.keys(pattern);
    }
    /**
     * Flush all data (use with caution)
     */
    async flushAll() {
        return this.redis.flushall();
    }
};
exports.RedisService = RedisService;
exports.RedisService = RedisService = tslib_1.__decorate([
    (0, common_1.Injectable)(),
    tslib_1.__param(0, (0, common_1.Inject)('REDIS_CLIENT')),
    tslib_1.__metadata("design:paramtypes", [typeof (_a = typeof ioredis_1.Redis !== "undefined" && ioredis_1.Redis) === "function" ? _a : Object])
], RedisService);


/***/ }),
/* 16 */
/***/ ((module) => {

module.exports = require("ioredis");

/***/ }),
/* 17 */
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.CACHE_KEYS = exports.REDIS_MESSAGE_PATTERNS = exports.REDIS_CHANNELS = exports.MESSAGE_PATTERNS = void 0;
// RabbitMQ Message Patterns
exports.MESSAGE_PATTERNS = {
    // User Service Patterns
    USER_CREATED: 'user.created',
    USER_UPDATED: 'user.updated',
    USER_DELETED: 'user.deleted',
    USER_LOGIN: 'user.login',
    USER_LOGOUT: 'user.logout',
    // Restaurant Service Patterns
    RESTAURANT_CREATED: 'restaurant.created',
    RESTAURANT_UPDATED: 'restaurant.updated',
    RESTAURANT_DELETED: 'restaurant.deleted',
    RESTAURANT_LOGIN: 'restaurant.login',
    RESTAURANT_LOGOUT: 'restaurant.logout',
    // Menu Patterns
    MENU_CREATED: 'menu.created',
    MENU_UPDATED: 'menu.updated',
    MENU_DELETED: 'menu.deleted',
    // Menu Item Patterns
    MENU_ITEM_CREATED: 'menu_item.created',
    MENU_ITEM_UPDATED: 'menu_item.updated',
    MENU_ITEM_DELETED: 'menu_item.deleted',
    // Category Patterns
    CATEGORY_CREATED: 'category.created',
    CATEGORY_UPDATED: 'category.updated',
    CATEGORY_DELETED: 'category.deleted',
    // Order Patterns
    ORDER_CREATED: 'order.created',
    ORDER_PLACED: 'order.placed',
    ORDER_CONFIRMED: 'order.confirmed',
    ORDER_PREPARING: 'order.preparing',
    ORDER_READY: 'order.ready',
    ORDER_OUT_FOR_DELIVERY: 'order.out_for_delivery',
    ORDER_DELIVERED: 'order.delivered',
    ORDER_CANCELLED: 'order.cancelled',
    ORDER_STATUS_UPDATED: 'order.status_updated',
    ORDER_REVIEWED: 'order.reviewed',
    ORDER_PAYMENT_PROCESSED: 'order.payment_processed',
    // Notification Patterns
    SEND_EMAIL: 'notification.send_email',
    SEND_SMS: 'notification.send_sms',
    SEND_PUSH: 'notification.send_push',
    // Reservation Patterns
    RESERVATION_CREATED: 'reservation.created',
    RESERVATION_CONFIRMED: 'reservation.confirmed',
    RESERVATION_CANCELLED: 'reservation.cancelled',
    RESERVATION_COMPLETED: 'reservation.completed',
    RESERVATION_NO_SHOW: 'reservation.no_show',
    // Cache Patterns
    CACHE_INVALIDATE: 'cache.invalidate',
    CACHE_CLEAR: 'cache.clear',
    // Health Check
    HEALTH_CHECK: 'health.check',
};
// Redis Channel Patterns (with wildcard support)
exports.REDIS_CHANNELS = {
    USER_EVENTS: 'user.*',
    RESTAURANT_EVENTS: 'restaurant.*',
    MENU_EVENTS: 'menu.*',
    ORDER_EVENTS: 'order.*',
    NOTIFICATION_EVENTS: 'notification.*',
    CACHE_EVENTS: 'cache.*',
    HEALTH_EVENTS: 'health.*',
};
// Redis Message Patterns (for direct messaging)
exports.REDIS_MESSAGE_PATTERNS = {
    // User Service Patterns
    USER_CREATE: 'user.create',
    USER_UPDATE: 'user.update',
    USER_DELETE: 'user.delete',
    USER_LOGIN: 'user.login',
    USER_LOGOUT: 'user.logout',
    // Restaurant Service Patterns
    RESTAURANT_CREATE: 'restaurant.create',
    RESTAURANT_UPDATE: 'restaurant.update',
    RESTAURANT_DELETE: 'restaurant.delete',
    RESTAURANT_LOGIN: 'restaurant.login',
    RESTAURANT_LOGOUT: 'restaurant.logout',
    // Menu Patterns
    MENU_CREATE: 'menu.create',
    MENU_UPDATE: 'menu.update',
    MENU_DELETE: 'menu.delete',
    // Menu Item Patterns
    MENU_ITEM_CREATE: 'menu_item.create',
    MENU_ITEM_UPDATE: 'menu_item.update',
    MENU_ITEM_DELETE: 'menu_item.delete',
    // Order Patterns
    ORDER_CREATE: 'order.create',
    ORDER_UPDATE: 'order.update',
    ORDER_CANCEL: 'order.cancel',
    ORDER_COMPLETE: 'order.complete',
    // Health Check
    HEALTH_CHECK: 'health.check',
};
// Cache Keys
exports.CACHE_KEYS = {
    USER: (id) => `user:${id}`,
    RESTAURANT: (id) => `restaurant:${id}`,
    MENU: (id) => `menu:${id}`,
    MENU_ITEM: (id) => `menu_item:${id}`,
    CATEGORY: (id) => `category:${id}`,
    ORDER: (id) => `order:${id}`,
    ORDER_STATUS: (id) => `order_status:${id}`,
    CUSTOMER_ORDERS: (customerId) => `customer_orders:${customerId}`,
    RESTAURANT_ORDERS: (restaurantId) => `restaurant_orders:${restaurantId}`,
    RESERVATION: (id) => `reservation:${id}`,
    RESTAURANT_RESERVATIONS: (restaurantId, date) => `restaurant_reservations:${restaurantId}:${date}`,
    TABLE_AVAILABILITY: (restaurantId, date) => `table_availability:${restaurantId}:${date}`,
    RESTAURANTS_NEARBY: (lat, lng, radius) => `restaurants:nearby:${lat}:${lng}:${radius}`,
    USER_SESSION: (userId) => `session:user:${userId}`,
    RESTAURANT_SESSION: (restaurantId) => `session:restaurant:${restaurantId}`,
};


/***/ }),
/* 18 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.CheckAvailabilityDto = exports.GetReservationsFilterDto = exports.CancelReservationDto = exports.UpdateReservationStatusDto = exports.CreateReservationDto = exports.DeleteTableDto = exports.UpdateTableDto = exports.CreateTableDto = exports.ReservationStatus = void 0;
const tslib_1 = __webpack_require__(5);
const graphql_1 = __webpack_require__(6);
const class_validator_1 = __webpack_require__(19);
var ReservationStatus;
(function (ReservationStatus) {
    ReservationStatus["PENDING"] = "PENDING";
    ReservationStatus["CONFIRMED"] = "CONFIRMED";
    ReservationStatus["SEATED"] = "SEATED";
    ReservationStatus["COMPLETED"] = "COMPLETED";
    ReservationStatus["CANCELLED"] = "CANCELLED";
    ReservationStatus["NO_SHOW"] = "NO_SHOW";
})(ReservationStatus || (exports.ReservationStatus = ReservationStatus = {}));
(0, graphql_1.registerEnumType)(ReservationStatus, { name: 'ReservationStatus' });
// ==================== TABLE DTOs ====================
let CreateTableDto = class CreateTableDto {
};
exports.CreateTableDto = CreateTableDto;
tslib_1.__decorate([
    (0, graphql_1.Field)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Table number is required.' }),
    (0, class_validator_1.IsString)(),
    tslib_1.__metadata("design:type", String)
], CreateTableDto.prototype, "tableNumber", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)(() => graphql_1.Int),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1, { message: 'Capacity must be at least 1.' }),
    (0, class_validator_1.Max)(20, { message: 'Capacity cannot exceed 20.' }),
    tslib_1.__metadata("design:type", Number)
], CreateTableDto.prototype, "capacity", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)({ nullable: true }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    tslib_1.__metadata("design:type", String)
], CreateTableDto.prototype, "location", void 0);
exports.CreateTableDto = CreateTableDto = tslib_1.__decorate([
    (0, graphql_1.InputType)()
], CreateTableDto);
let UpdateTableDto = class UpdateTableDto {
};
exports.UpdateTableDto = UpdateTableDto;
tslib_1.__decorate([
    (0, graphql_1.Field)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    tslib_1.__metadata("design:type", String)
], UpdateTableDto.prototype, "id", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)({ nullable: true }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    tslib_1.__metadata("design:type", String)
], UpdateTableDto.prototype, "tableNumber", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)(() => graphql_1.Int, { nullable: true }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(20),
    tslib_1.__metadata("design:type", Number)
], UpdateTableDto.prototype, "capacity", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)({ nullable: true }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    tslib_1.__metadata("design:type", String)
], UpdateTableDto.prototype, "location", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)({ nullable: true }),
    (0, class_validator_1.IsOptional)(),
    tslib_1.__metadata("design:type", Boolean)
], UpdateTableDto.prototype, "isActive", void 0);
exports.UpdateTableDto = UpdateTableDto = tslib_1.__decorate([
    (0, graphql_1.InputType)()
], UpdateTableDto);
let DeleteTableDto = class DeleteTableDto {
};
exports.DeleteTableDto = DeleteTableDto;
tslib_1.__decorate([
    (0, graphql_1.Field)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    tslib_1.__metadata("design:type", String)
], DeleteTableDto.prototype, "id", void 0);
exports.DeleteTableDto = DeleteTableDto = tslib_1.__decorate([
    (0, graphql_1.InputType)()
], DeleteTableDto);
// ==================== RESERVATION DTOs ====================
let CreateReservationDto = class CreateReservationDto {
};
exports.CreateReservationDto = CreateReservationDto;
tslib_1.__decorate([
    (0, graphql_1.Field)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Customer ID is required.' }),
    (0, class_validator_1.IsString)(),
    tslib_1.__metadata("design:type", String)
], CreateReservationDto.prototype, "customerId", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Customer name is required.' }),
    (0, class_validator_1.IsString)(),
    tslib_1.__metadata("design:type", String)
], CreateReservationDto.prototype, "customerName", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Customer email is required.' }),
    (0, class_validator_1.IsEmail)(),
    tslib_1.__metadata("design:type", String)
], CreateReservationDto.prototype, "customerEmail", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)({ nullable: true }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    tslib_1.__metadata("design:type", String)
], CreateReservationDto.prototype, "customerPhone", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Restaurant ID is required.' }),
    (0, class_validator_1.IsString)(),
    tslib_1.__metadata("design:type", String)
], CreateReservationDto.prototype, "restaurantId", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Restaurant name is required.' }),
    (0, class_validator_1.IsString)(),
    tslib_1.__metadata("design:type", String)
], CreateReservationDto.prototype, "restaurantName", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Date is required.' }),
    (0, class_validator_1.IsDateString)(),
    tslib_1.__metadata("design:type", String)
], CreateReservationDto.prototype, "date", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Start time is required.' }),
    (0, class_validator_1.Matches)(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'Start time must be HH:MM format.' }),
    tslib_1.__metadata("design:type", String)
], CreateReservationDto.prototype, "startTime", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'End time is required.' }),
    (0, class_validator_1.Matches)(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'End time must be HH:MM format.' }),
    tslib_1.__metadata("design:type", String)
], CreateReservationDto.prototype, "endTime", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)(() => graphql_1.Int),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1, { message: 'Party size must be at least 1.' }),
    (0, class_validator_1.Max)(20, { message: 'Party size cannot exceed 20.' }),
    tslib_1.__metadata("design:type", Number)
], CreateReservationDto.prototype, "partySize", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)({ nullable: true }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    tslib_1.__metadata("design:type", String)
], CreateReservationDto.prototype, "tableId", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)({ nullable: true }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    tslib_1.__metadata("design:type", String)
], CreateReservationDto.prototype, "specialRequests", void 0);
exports.CreateReservationDto = CreateReservationDto = tslib_1.__decorate([
    (0, graphql_1.InputType)()
], CreateReservationDto);
let UpdateReservationStatusDto = class UpdateReservationStatusDto {
};
exports.UpdateReservationStatusDto = UpdateReservationStatusDto;
tslib_1.__decorate([
    (0, graphql_1.Field)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    tslib_1.__metadata("design:type", String)
], UpdateReservationStatusDto.prototype, "reservationId", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)(() => ReservationStatus),
    (0, class_validator_1.IsEnum)(ReservationStatus),
    tslib_1.__metadata("design:type", String)
], UpdateReservationStatusDto.prototype, "status", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)({ nullable: true }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    tslib_1.__metadata("design:type", String)
], UpdateReservationStatusDto.prototype, "reason", void 0);
exports.UpdateReservationStatusDto = UpdateReservationStatusDto = tslib_1.__decorate([
    (0, graphql_1.InputType)()
], UpdateReservationStatusDto);
let CancelReservationDto = class CancelReservationDto {
};
exports.CancelReservationDto = CancelReservationDto;
tslib_1.__decorate([
    (0, graphql_1.Field)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    tslib_1.__metadata("design:type", String)
], CancelReservationDto.prototype, "reservationId", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)({ nullable: true }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    tslib_1.__metadata("design:type", String)
], CancelReservationDto.prototype, "reason", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)({ nullable: true }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    tslib_1.__metadata("design:type", String)
], CancelReservationDto.prototype, "cancelledBy", void 0);
exports.CancelReservationDto = CancelReservationDto = tslib_1.__decorate([
    (0, graphql_1.InputType)()
], CancelReservationDto);
let GetReservationsFilterDto = class GetReservationsFilterDto {
};
exports.GetReservationsFilterDto = GetReservationsFilterDto;
tslib_1.__decorate([
    (0, graphql_1.Field)({ nullable: true }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    tslib_1.__metadata("design:type", String)
], GetReservationsFilterDto.prototype, "customerId", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)({ nullable: true }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    tslib_1.__metadata("design:type", String)
], GetReservationsFilterDto.prototype, "restaurantId", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)(() => ReservationStatus, { nullable: true }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(ReservationStatus),
    tslib_1.__metadata("design:type", String)
], GetReservationsFilterDto.prototype, "status", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)({ nullable: true }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    tslib_1.__metadata("design:type", String)
], GetReservationsFilterDto.prototype, "date", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)(() => graphql_1.Int, { nullable: true }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(100),
    tslib_1.__metadata("design:type", Number)
], GetReservationsFilterDto.prototype, "limit", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)(() => graphql_1.Int, { nullable: true }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    tslib_1.__metadata("design:type", Number)
], GetReservationsFilterDto.prototype, "skip", void 0);
exports.GetReservationsFilterDto = GetReservationsFilterDto = tslib_1.__decorate([
    (0, graphql_1.InputType)()
], GetReservationsFilterDto);
let CheckAvailabilityDto = class CheckAvailabilityDto {
};
exports.CheckAvailabilityDto = CheckAvailabilityDto;
tslib_1.__decorate([
    (0, graphql_1.Field)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    tslib_1.__metadata("design:type", String)
], CheckAvailabilityDto.prototype, "restaurantId", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsDateString)(),
    tslib_1.__metadata("design:type", String)
], CheckAvailabilityDto.prototype, "date", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.Matches)(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'Start time must be HH:MM format.' }),
    tslib_1.__metadata("design:type", String)
], CheckAvailabilityDto.prototype, "startTime", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.Matches)(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'End time must be HH:MM format.' }),
    tslib_1.__metadata("design:type", String)
], CheckAvailabilityDto.prototype, "endTime", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)(() => graphql_1.Int),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    tslib_1.__metadata("design:type", Number)
], CheckAvailabilityDto.prototype, "partySize", void 0);
exports.CheckAvailabilityDto = CheckAvailabilityDto = tslib_1.__decorate([
    (0, graphql_1.InputType)()
], CheckAvailabilityDto);


/***/ }),
/* 19 */
/***/ ((module) => {

module.exports = require("class-validator");

/***/ }),
/* 20 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var ReservationsResolver_1;
var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ReservationsResolver = void 0;
const tslib_1 = __webpack_require__(5);
const graphql_1 = __webpack_require__(6);
const common_1 = __webpack_require__(2);
const reservations_service_1 = __webpack_require__(11);
const reservation_dto_1 = __webpack_require__(18);
const reservation_entities_1 = __webpack_require__(21);
const auth_guard_1 = __webpack_require__(22);
let ReservationsResolver = ReservationsResolver_1 = class ReservationsResolver {
    constructor(reservationsService) {
        this.reservationsService = reservationsService;
        this.logger = new common_1.Logger(ReservationsResolver_1.name);
    }
    // ==================== TABLE MUTATIONS ====================
    async createTable(dto, context) {
        try {
            const req = context.req;
            const restaurantId = req.restaurant?.id;
            if (!restaurantId) {
                return { message: 'Restaurant authentication required', error: { message: 'Not authenticated as restaurant', code: 'AUTH_REQUIRED' } };
            }
            return await this.reservationsService.createTable(dto, restaurantId);
        }
        catch (error) {
            return { message: 'Failed to create table', error: { message: error.message, code: 'CREATE_TABLE_FAILED' } };
        }
    }
    async updateTable(dto, context) {
        try {
            const req = context.req;
            const restaurantId = req.restaurant?.id;
            if (!restaurantId) {
                return { message: 'Restaurant authentication required', error: { message: 'Not authenticated as restaurant', code: 'AUTH_REQUIRED' } };
            }
            return await this.reservationsService.updateTable(dto, restaurantId);
        }
        catch (error) {
            return { message: 'Failed to update table', error: { message: error.message, code: 'UPDATE_TABLE_FAILED' } };
        }
    }
    async deleteTable(dto, context) {
        try {
            const req = context.req;
            const restaurantId = req.restaurant?.id;
            if (!restaurantId) {
                return { message: 'Restaurant authentication required', error: { message: 'Not authenticated as restaurant', code: 'AUTH_REQUIRED' } };
            }
            const result = await this.reservationsService.deleteTable(dto, restaurantId);
            return { message: result.message };
        }
        catch (error) {
            return { message: 'Failed to delete table', error: { message: error.message, code: 'DELETE_TABLE_FAILED' } };
        }
    }
    async getRestaurantTables(restaurantId) {
        try {
            return await this.reservationsService.getRestaurantTables(restaurantId);
        }
        catch (error) {
            return { tables: [], error: { message: error.message, code: 'GET_TABLES_FAILED' } };
        }
    }
    // ==================== RESERVATION MUTATIONS ====================
    async createReservation(dto) {
        try {
            const result = await this.reservationsService.createReservation(dto);
            return {
                message: result.message,
                reservation: result.reservation,
            };
        }
        catch (error) {
            return { message: 'Failed to create reservation', error: { message: error.message, code: 'CREATE_RESERVATION_FAILED' } };
        }
    }
    async updateReservationStatus(dto) {
        try {
            const result = await this.reservationsService.updateReservationStatus(dto);
            return {
                message: result.message,
                reservation: result.reservation,
            };
        }
        catch (error) {
            return { message: 'Failed to update reservation status', error: { message: error.message, code: 'UPDATE_STATUS_FAILED' } };
        }
    }
    async cancelReservation(dto, context) {
        try {
            const req = context.req;
            if (!dto.cancelledBy) {
                dto.cancelledBy = req.user?.id || req.restaurant?.id;
            }
            const result = await this.reservationsService.cancelReservation(dto);
            return {
                message: result.message,
                reservation: result.reservation,
            };
        }
        catch (error) {
            return { message: 'Failed to cancel reservation', error: { message: error.message, code: 'CANCEL_RESERVATION_FAILED' } };
        }
    }
    // ==================== RESERVATION QUERIES ====================
    async getReservationById(reservationId) {
        return (await this.reservationsService.getReservationById(reservationId));
    }
    async getReservations(filterDto) {
        try {
            const result = await this.reservationsService.getReservations(filterDto || {});
            return {
                reservations: result.reservations,
                total: result.total,
                limit: result.limit,
                skip: result.skip,
            };
        }
        catch (error) {
            return { reservations: [], total: 0, limit: 0, skip: 0, error: { message: error.message } };
        }
    }
    async getCustomerReservations(customerId, limit, skip) {
        try {
            const result = await this.reservationsService.getReservations({
                customerId,
                limit: limit || 20,
                skip: skip || 0,
            });
            return {
                reservations: result.reservations,
                total: result.total,
                limit: result.limit,
                skip: result.skip,
            };
        }
        catch (error) {
            return { reservations: [], total: 0, limit: 0, skip: 0, error: { message: error.message } };
        }
    }
    async getRestaurantReservations(restaurantId, date, limit, skip) {
        try {
            const result = await this.reservationsService.getReservations({
                restaurantId,
                date,
                limit: limit || 20,
                skip: skip || 0,
            });
            return {
                reservations: result.reservations,
                total: result.total,
                limit: result.limit,
                skip: result.skip,
            };
        }
        catch (error) {
            return { reservations: [], total: 0, limit: 0, skip: 0, error: { message: error.message } };
        }
    }
    async checkAvailability(dto) {
        try {
            const result = await this.reservationsService.checkAvailability(dto);
            return {
                available: result.available,
                availableTables: result.availableTables,
            };
        }
        catch (error) {
            return { available: false, availableTables: [], error: { message: error.message } };
        }
    }
};
exports.ReservationsResolver = ReservationsResolver;
tslib_1.__decorate([
    (0, graphql_1.Mutation)(() => reservation_entities_1.TableResponse),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    tslib_1.__param(0, (0, graphql_1.Args)('createTableDto')),
    tslib_1.__param(1, (0, graphql_1.Context)()),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [typeof (_b = typeof reservation_dto_1.CreateTableDto !== "undefined" && reservation_dto_1.CreateTableDto) === "function" ? _b : Object, typeof (_c = typeof Record !== "undefined" && Record) === "function" ? _c : Object]),
    tslib_1.__metadata("design:returntype", typeof (_d = typeof Promise !== "undefined" && Promise) === "function" ? _d : Object)
], ReservationsResolver.prototype, "createTable", null);
tslib_1.__decorate([
    (0, graphql_1.Mutation)(() => reservation_entities_1.TableResponse),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    tslib_1.__param(0, (0, graphql_1.Args)('updateTableDto')),
    tslib_1.__param(1, (0, graphql_1.Context)()),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [typeof (_e = typeof reservation_dto_1.UpdateTableDto !== "undefined" && reservation_dto_1.UpdateTableDto) === "function" ? _e : Object, typeof (_f = typeof Record !== "undefined" && Record) === "function" ? _f : Object]),
    tslib_1.__metadata("design:returntype", typeof (_g = typeof Promise !== "undefined" && Promise) === "function" ? _g : Object)
], ReservationsResolver.prototype, "updateTable", null);
tslib_1.__decorate([
    (0, graphql_1.Mutation)(() => reservation_entities_1.TableResponse),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    tslib_1.__param(0, (0, graphql_1.Args)('deleteTableDto')),
    tslib_1.__param(1, (0, graphql_1.Context)()),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [typeof (_h = typeof reservation_dto_1.DeleteTableDto !== "undefined" && reservation_dto_1.DeleteTableDto) === "function" ? _h : Object, typeof (_j = typeof Record !== "undefined" && Record) === "function" ? _j : Object]),
    tslib_1.__metadata("design:returntype", typeof (_k = typeof Promise !== "undefined" && Promise) === "function" ? _k : Object)
], ReservationsResolver.prototype, "deleteTable", null);
tslib_1.__decorate([
    (0, graphql_1.Query)(() => reservation_entities_1.TablesResponse),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    tslib_1.__param(0, (0, graphql_1.Args)('restaurantId')),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [String]),
    tslib_1.__metadata("design:returntype", typeof (_l = typeof Promise !== "undefined" && Promise) === "function" ? _l : Object)
], ReservationsResolver.prototype, "getRestaurantTables", null);
tslib_1.__decorate([
    (0, graphql_1.Mutation)(() => reservation_entities_1.CreateReservationResponse),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    tslib_1.__param(0, (0, graphql_1.Args)('createReservationDto')),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [typeof (_m = typeof reservation_dto_1.CreateReservationDto !== "undefined" && reservation_dto_1.CreateReservationDto) === "function" ? _m : Object]),
    tslib_1.__metadata("design:returntype", typeof (_o = typeof Promise !== "undefined" && Promise) === "function" ? _o : Object)
], ReservationsResolver.prototype, "createReservation", null);
tslib_1.__decorate([
    (0, graphql_1.Mutation)(() => reservation_entities_1.UpdateReservationStatusResponse),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    tslib_1.__param(0, (0, graphql_1.Args)('updateStatusDto')),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [typeof (_p = typeof reservation_dto_1.UpdateReservationStatusDto !== "undefined" && reservation_dto_1.UpdateReservationStatusDto) === "function" ? _p : Object]),
    tslib_1.__metadata("design:returntype", typeof (_q = typeof Promise !== "undefined" && Promise) === "function" ? _q : Object)
], ReservationsResolver.prototype, "updateReservationStatus", null);
tslib_1.__decorate([
    (0, graphql_1.Mutation)(() => reservation_entities_1.CancelReservationResponse),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    tslib_1.__param(0, (0, graphql_1.Args)('cancelReservationDto')),
    tslib_1.__param(1, (0, graphql_1.Context)()),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [typeof (_r = typeof reservation_dto_1.CancelReservationDto !== "undefined" && reservation_dto_1.CancelReservationDto) === "function" ? _r : Object, typeof (_s = typeof Record !== "undefined" && Record) === "function" ? _s : Object]),
    tslib_1.__metadata("design:returntype", typeof (_t = typeof Promise !== "undefined" && Promise) === "function" ? _t : Object)
], ReservationsResolver.prototype, "cancelReservation", null);
tslib_1.__decorate([
    (0, graphql_1.Query)(() => reservation_entities_1.Reservation),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    tslib_1.__param(0, (0, graphql_1.Args)('reservationId')),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [String]),
    tslib_1.__metadata("design:returntype", typeof (_u = typeof Promise !== "undefined" && Promise) === "function" ? _u : Object)
], ReservationsResolver.prototype, "getReservationById", null);
tslib_1.__decorate([
    (0, graphql_1.Query)(() => reservation_entities_1.GetReservationsResponse),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    tslib_1.__param(0, (0, graphql_1.Args)('filterDto', { nullable: true })),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [typeof (_v = typeof reservation_dto_1.GetReservationsFilterDto !== "undefined" && reservation_dto_1.GetReservationsFilterDto) === "function" ? _v : Object]),
    tslib_1.__metadata("design:returntype", typeof (_w = typeof Promise !== "undefined" && Promise) === "function" ? _w : Object)
], ReservationsResolver.prototype, "getReservations", null);
tslib_1.__decorate([
    (0, graphql_1.Query)(() => reservation_entities_1.GetReservationsResponse),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    tslib_1.__param(0, (0, graphql_1.Args)('customerId')),
    tslib_1.__param(1, (0, graphql_1.Args)('limit', { nullable: true })),
    tslib_1.__param(2, (0, graphql_1.Args)('skip', { nullable: true })),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [String, Number, Number]),
    tslib_1.__metadata("design:returntype", typeof (_x = typeof Promise !== "undefined" && Promise) === "function" ? _x : Object)
], ReservationsResolver.prototype, "getCustomerReservations", null);
tslib_1.__decorate([
    (0, graphql_1.Query)(() => reservation_entities_1.GetReservationsResponse),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    tslib_1.__param(0, (0, graphql_1.Args)('restaurantId')),
    tslib_1.__param(1, (0, graphql_1.Args)('date', { nullable: true })),
    tslib_1.__param(2, (0, graphql_1.Args)('limit', { nullable: true })),
    tslib_1.__param(3, (0, graphql_1.Args)('skip', { nullable: true })),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [String, String, Number, Number]),
    tslib_1.__metadata("design:returntype", typeof (_y = typeof Promise !== "undefined" && Promise) === "function" ? _y : Object)
], ReservationsResolver.prototype, "getRestaurantReservations", null);
tslib_1.__decorate([
    (0, graphql_1.Query)(() => reservation_entities_1.CheckAvailabilityResponse),
    tslib_1.__param(0, (0, graphql_1.Args)('checkAvailabilityDto')),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [typeof (_z = typeof reservation_dto_1.CheckAvailabilityDto !== "undefined" && reservation_dto_1.CheckAvailabilityDto) === "function" ? _z : Object]),
    tslib_1.__metadata("design:returntype", typeof (_0 = typeof Promise !== "undefined" && Promise) === "function" ? _0 : Object)
], ReservationsResolver.prototype, "checkAvailability", null);
exports.ReservationsResolver = ReservationsResolver = ReservationsResolver_1 = tslib_1.__decorate([
    (0, graphql_1.Resolver)('Reservation'),
    tslib_1.__metadata("design:paramtypes", [typeof (_a = typeof reservations_service_1.ReservationsService !== "undefined" && reservations_service_1.ReservationsService) === "function" ? _a : Object])
], ReservationsResolver);


/***/ }),
/* 21 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a, _b, _c, _d, _e, _f;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.TablesResponse = exports.TableResponse = exports.CheckAvailabilityResponse = exports.AvailableSlot = exports.GetReservationsResponse = exports.CancelReservationResponse = exports.UpdateReservationStatusResponse = exports.CreateReservationResponse = exports.ErrorType = exports.Reservation = exports.TableEntity = void 0;
const tslib_1 = __webpack_require__(5);
const graphql_1 = __webpack_require__(6);
const reservation_dto_1 = __webpack_require__(18);
let TableEntity = class TableEntity {
};
exports.TableEntity = TableEntity;
tslib_1.__decorate([
    (0, graphql_1.Field)(),
    tslib_1.__metadata("design:type", String)
], TableEntity.prototype, "id", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)(),
    tslib_1.__metadata("design:type", String)
], TableEntity.prototype, "restaurantId", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)(),
    tslib_1.__metadata("design:type", String)
], TableEntity.prototype, "tableNumber", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)(() => graphql_1.Int),
    tslib_1.__metadata("design:type", Number)
], TableEntity.prototype, "capacity", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)({ nullable: true }),
    tslib_1.__metadata("design:type", String)
], TableEntity.prototype, "location", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)(),
    tslib_1.__metadata("design:type", Boolean)
], TableEntity.prototype, "isActive", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)(),
    tslib_1.__metadata("design:type", typeof (_a = typeof Date !== "undefined" && Date) === "function" ? _a : Object)
], TableEntity.prototype, "createdAt", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)(),
    tslib_1.__metadata("design:type", typeof (_b = typeof Date !== "undefined" && Date) === "function" ? _b : Object)
], TableEntity.prototype, "updatedAt", void 0);
exports.TableEntity = TableEntity = tslib_1.__decorate([
    (0, graphql_1.ObjectType)()
], TableEntity);
let Reservation = class Reservation {
};
exports.Reservation = Reservation;
tslib_1.__decorate([
    (0, graphql_1.Field)(),
    tslib_1.__metadata("design:type", String)
], Reservation.prototype, "id", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)(),
    tslib_1.__metadata("design:type", String)
], Reservation.prototype, "reservationNumber", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)(),
    tslib_1.__metadata("design:type", String)
], Reservation.prototype, "customerId", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)(),
    tslib_1.__metadata("design:type", String)
], Reservation.prototype, "customerName", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)(),
    tslib_1.__metadata("design:type", String)
], Reservation.prototype, "customerEmail", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)({ nullable: true }),
    tslib_1.__metadata("design:type", String)
], Reservation.prototype, "customerPhone", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)(),
    tslib_1.__metadata("design:type", String)
], Reservation.prototype, "restaurantId", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)(),
    tslib_1.__metadata("design:type", String)
], Reservation.prototype, "restaurantName", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)(),
    tslib_1.__metadata("design:type", String)
], Reservation.prototype, "tableId", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)(() => TableEntity, { nullable: true }),
    tslib_1.__metadata("design:type", TableEntity)
], Reservation.prototype, "table", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)(),
    tslib_1.__metadata("design:type", typeof (_c = typeof Date !== "undefined" && Date) === "function" ? _c : Object)
], Reservation.prototype, "date", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)(),
    tslib_1.__metadata("design:type", String)
], Reservation.prototype, "startTime", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)(),
    tslib_1.__metadata("design:type", String)
], Reservation.prototype, "endTime", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)(() => graphql_1.Int),
    tslib_1.__metadata("design:type", Number)
], Reservation.prototype, "partySize", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)(() => reservation_dto_1.ReservationStatus),
    tslib_1.__metadata("design:type", typeof (_d = typeof reservation_dto_1.ReservationStatus !== "undefined" && reservation_dto_1.ReservationStatus) === "function" ? _d : Object)
], Reservation.prototype, "status", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)({ nullable: true }),
    tslib_1.__metadata("design:type", String)
], Reservation.prototype, "specialRequests", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)({ nullable: true }),
    tslib_1.__metadata("design:type", String)
], Reservation.prototype, "notes", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)({ nullable: true }),
    tslib_1.__metadata("design:type", String)
], Reservation.prototype, "cancelledBy", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)({ nullable: true }),
    tslib_1.__metadata("design:type", String)
], Reservation.prototype, "cancellationReason", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)(() => String, { nullable: true }),
    tslib_1.__metadata("design:type", Object)
], Reservation.prototype, "metadata", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)(),
    tslib_1.__metadata("design:type", typeof (_e = typeof Date !== "undefined" && Date) === "function" ? _e : Object)
], Reservation.prototype, "createdAt", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)(),
    tslib_1.__metadata("design:type", typeof (_f = typeof Date !== "undefined" && Date) === "function" ? _f : Object)
], Reservation.prototype, "updatedAt", void 0);
exports.Reservation = Reservation = tslib_1.__decorate([
    (0, graphql_1.ObjectType)()
], Reservation);
// Response Types
let ErrorType = class ErrorType {
};
exports.ErrorType = ErrorType;
tslib_1.__decorate([
    (0, graphql_1.Field)({ nullable: true }),
    tslib_1.__metadata("design:type", String)
], ErrorType.prototype, "message", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)({ nullable: true }),
    tslib_1.__metadata("design:type", String)
], ErrorType.prototype, "code", void 0);
exports.ErrorType = ErrorType = tslib_1.__decorate([
    (0, graphql_1.ObjectType)()
], ErrorType);
let CreateReservationResponse = class CreateReservationResponse {
};
exports.CreateReservationResponse = CreateReservationResponse;
tslib_1.__decorate([
    (0, graphql_1.Field)(),
    tslib_1.__metadata("design:type", String)
], CreateReservationResponse.prototype, "message", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)(() => Reservation, { nullable: true }),
    tslib_1.__metadata("design:type", Reservation)
], CreateReservationResponse.prototype, "reservation", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)(() => ErrorType, { nullable: true }),
    tslib_1.__metadata("design:type", ErrorType)
], CreateReservationResponse.prototype, "error", void 0);
exports.CreateReservationResponse = CreateReservationResponse = tslib_1.__decorate([
    (0, graphql_1.ObjectType)()
], CreateReservationResponse);
let UpdateReservationStatusResponse = class UpdateReservationStatusResponse {
};
exports.UpdateReservationStatusResponse = UpdateReservationStatusResponse;
tslib_1.__decorate([
    (0, graphql_1.Field)(),
    tslib_1.__metadata("design:type", String)
], UpdateReservationStatusResponse.prototype, "message", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)(() => Reservation, { nullable: true }),
    tslib_1.__metadata("design:type", Reservation)
], UpdateReservationStatusResponse.prototype, "reservation", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)(() => ErrorType, { nullable: true }),
    tslib_1.__metadata("design:type", ErrorType)
], UpdateReservationStatusResponse.prototype, "error", void 0);
exports.UpdateReservationStatusResponse = UpdateReservationStatusResponse = tslib_1.__decorate([
    (0, graphql_1.ObjectType)()
], UpdateReservationStatusResponse);
let CancelReservationResponse = class CancelReservationResponse {
};
exports.CancelReservationResponse = CancelReservationResponse;
tslib_1.__decorate([
    (0, graphql_1.Field)(),
    tslib_1.__metadata("design:type", String)
], CancelReservationResponse.prototype, "message", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)(() => Reservation, { nullable: true }),
    tslib_1.__metadata("design:type", Reservation)
], CancelReservationResponse.prototype, "reservation", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)(() => ErrorType, { nullable: true }),
    tslib_1.__metadata("design:type", ErrorType)
], CancelReservationResponse.prototype, "error", void 0);
exports.CancelReservationResponse = CancelReservationResponse = tslib_1.__decorate([
    (0, graphql_1.ObjectType)()
], CancelReservationResponse);
let GetReservationsResponse = class GetReservationsResponse {
};
exports.GetReservationsResponse = GetReservationsResponse;
tslib_1.__decorate([
    (0, graphql_1.Field)(() => [Reservation]),
    tslib_1.__metadata("design:type", Array)
], GetReservationsResponse.prototype, "reservations", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)(() => graphql_1.Int),
    tslib_1.__metadata("design:type", Number)
], GetReservationsResponse.prototype, "total", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)(() => graphql_1.Int),
    tslib_1.__metadata("design:type", Number)
], GetReservationsResponse.prototype, "limit", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)(() => graphql_1.Int),
    tslib_1.__metadata("design:type", Number)
], GetReservationsResponse.prototype, "skip", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)(() => ErrorType, { nullable: true }),
    tslib_1.__metadata("design:type", ErrorType)
], GetReservationsResponse.prototype, "error", void 0);
exports.GetReservationsResponse = GetReservationsResponse = tslib_1.__decorate([
    (0, graphql_1.ObjectType)()
], GetReservationsResponse);
let AvailableSlot = class AvailableSlot {
};
exports.AvailableSlot = AvailableSlot;
tslib_1.__decorate([
    (0, graphql_1.Field)(),
    tslib_1.__metadata("design:type", String)
], AvailableSlot.prototype, "startTime", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)(),
    tslib_1.__metadata("design:type", String)
], AvailableSlot.prototype, "endTime", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)(() => [TableEntity]),
    tslib_1.__metadata("design:type", Array)
], AvailableSlot.prototype, "availableTables", void 0);
exports.AvailableSlot = AvailableSlot = tslib_1.__decorate([
    (0, graphql_1.ObjectType)()
], AvailableSlot);
let CheckAvailabilityResponse = class CheckAvailabilityResponse {
};
exports.CheckAvailabilityResponse = CheckAvailabilityResponse;
tslib_1.__decorate([
    (0, graphql_1.Field)(),
    tslib_1.__metadata("design:type", Boolean)
], CheckAvailabilityResponse.prototype, "available", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)(() => [TableEntity]),
    tslib_1.__metadata("design:type", Array)
], CheckAvailabilityResponse.prototype, "availableTables", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)(() => ErrorType, { nullable: true }),
    tslib_1.__metadata("design:type", ErrorType)
], CheckAvailabilityResponse.prototype, "error", void 0);
exports.CheckAvailabilityResponse = CheckAvailabilityResponse = tslib_1.__decorate([
    (0, graphql_1.ObjectType)()
], CheckAvailabilityResponse);
let TableResponse = class TableResponse {
};
exports.TableResponse = TableResponse;
tslib_1.__decorate([
    (0, graphql_1.Field)(),
    tslib_1.__metadata("design:type", String)
], TableResponse.prototype, "message", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)(() => TableEntity, { nullable: true }),
    tslib_1.__metadata("design:type", TableEntity)
], TableResponse.prototype, "table", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)(() => ErrorType, { nullable: true }),
    tslib_1.__metadata("design:type", ErrorType)
], TableResponse.prototype, "error", void 0);
exports.TableResponse = TableResponse = tslib_1.__decorate([
    (0, graphql_1.ObjectType)()
], TableResponse);
let TablesResponse = class TablesResponse {
};
exports.TablesResponse = TablesResponse;
tslib_1.__decorate([
    (0, graphql_1.Field)(() => [TableEntity]),
    tslib_1.__metadata("design:type", Array)
], TablesResponse.prototype, "tables", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)(() => ErrorType, { nullable: true }),
    tslib_1.__metadata("design:type", ErrorType)
], TablesResponse.prototype, "error", void 0);
exports.TablesResponse = TablesResponse = tslib_1.__decorate([
    (0, graphql_1.ObjectType)()
], TablesResponse);


/***/ }),
/* 22 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var AuthGuard_1;
var _a, _b;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AuthGuard = void 0;
const tslib_1 = __webpack_require__(5);
const common_1 = __webpack_require__(2);
const graphql_1 = __webpack_require__(6);
const jwt_1 = __webpack_require__(7);
const config_1 = __webpack_require__(3);
let AuthGuard = AuthGuard_1 = class AuthGuard {
    constructor(jwtService, configService) {
        this.jwtService = jwtService;
        this.configService = configService;
        this.logger = new common_1.Logger(AuthGuard_1.name);
    }
    canActivate(context) {
        try {
            const ctx = graphql_1.GqlExecutionContext.create(context);
            const request = ctx.getContext().req;
            if (!request) {
                throw new common_1.UnauthorizedException('Please login to access this resource!');
            }
            const authHeader = request.headers?.['authorization'];
            const accessTokenHeader = request.headers?.['accesstoken'];
            let token;
            if (authHeader && authHeader.startsWith('Bearer ')) {
                token = authHeader.substring(7);
            }
            else if (accessTokenHeader) {
                token = typeof accessTokenHeader === 'string'
                    ? accessTokenHeader.replace('Bearer ', '')
                    : undefined;
            }
            if (!token) {
                throw new common_1.UnauthorizedException('Please login to access this resource!');
            }
            try {
                const decoded = this.jwtService.verify(token, {
                    secret: this.configService.get('JWT_SECRET_KEY'),
                });
                if (!decoded || !decoded.id) {
                    throw new common_1.UnauthorizedException('Invalid authentication token!');
                }
                // Attach user or restaurant info
                if (decoded.role) {
                    request.user = { id: decoded.id, email: decoded.email, role: decoded.role };
                }
                else {
                    request.restaurant = { id: decoded.id, email: decoded.email };
                }
                request.accesstoken = token;
                return true;
            }
            catch (jwtError) {
                if (jwtError.name === 'TokenExpiredError') {
                    throw new common_1.UnauthorizedException('Authentication token has expired!');
                }
                throw new common_1.UnauthorizedException('Invalid authentication token!');
            }
        }
        catch (error) {
            if (error instanceof common_1.UnauthorizedException)
                throw error;
            throw new common_1.UnauthorizedException('Authentication failed!');
        }
    }
};
exports.AuthGuard = AuthGuard;
exports.AuthGuard = AuthGuard = AuthGuard_1 = tslib_1.__decorate([
    (0, common_1.Injectable)(),
    tslib_1.__metadata("design:paramtypes", [typeof (_a = typeof jwt_1.JwtService !== "undefined" && jwt_1.JwtService) === "function" ? _a : Object, typeof (_b = typeof config_1.ConfigService !== "undefined" && config_1.ConfigService) === "function" ? _b : Object])
], AuthGuard);


/***/ }),
/* 23 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.SharedModule = void 0;
const tslib_1 = __webpack_require__(5);
const common_1 = __webpack_require__(2);
const config_1 = __webpack_require__(3);
const microservices_module_1 = __webpack_require__(24);
const redis_module_1 = __webpack_require__(25);
const rabbitmq_service_1 = __webpack_require__(12);
let SharedModule = class SharedModule {
};
exports.SharedModule = SharedModule;
exports.SharedModule = SharedModule = tslib_1.__decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                envFilePath: ['.env.local', '.env'],
            }),
            microservices_module_1.SharedMicroservicesModule,
            redis_module_1.RedisModule,
        ],
        providers: [rabbitmq_service_1.RabbitMQService],
        exports: [rabbitmq_service_1.RabbitMQService],
    })
], SharedModule);


/***/ }),
/* 24 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.SharedMicroservicesModule = void 0;
const tslib_1 = __webpack_require__(5);
const common_1 = __webpack_require__(2);
const microservices_1 = __webpack_require__(13);
const config_1 = __webpack_require__(3);
let SharedMicroservicesModule = class SharedMicroservicesModule {
};
exports.SharedMicroservicesModule = SharedMicroservicesModule;
exports.SharedMicroservicesModule = SharedMicroservicesModule = tslib_1.__decorate([
    (0, common_1.Module)({
        imports: [
            // RabbitMQ Configuration
            microservices_1.ClientsModule.registerAsync([
                {
                    name: 'RABBITMQ_SERVICE',
                    imports: [config_1.ConfigModule],
                    useFactory: (configService) => ({
                        transport: microservices_1.Transport.RMQ,
                        options: {
                            urls: [configService.get('RABBITMQ_URL') || 'amqp://admin:rabbit123@localhost:5673'],
                            queue: 'snackrapido_queue',
                            queueOptions: {
                                durable: true,
                            },
                            socketOptions: {
                                heartbeatIntervalInSeconds: 60,
                                reconnectTimeInSeconds: 5,
                            },
                        },
                    }),
                    inject: [config_1.ConfigService],
                },
                {
                    name: 'NOTIFICATIONS_SERVICE',
                    imports: [config_1.ConfigModule],
                    useFactory: (configService) => ({
                        transport: microservices_1.Transport.RMQ,
                        options: {
                            urls: [configService.get('RABBITMQ_URL') || 'amqp://admin:rabbit123@localhost:5673'],
                            queue: 'notifications_queue',
                            queueOptions: {
                                durable: true,
                            },
                        },
                    }),
                    inject: [config_1.ConfigService],
                },
                {
                    name: 'ANALYTICS_SERVICE',
                    imports: [config_1.ConfigModule],
                    useFactory: (configService) => ({
                        transport: microservices_1.Transport.RMQ,
                        options: {
                            urls: [configService.get('RABBITMQ_URL') || 'amqp://admin:rabbit123@localhost:5673'],
                            queue: 'analytics_queue',
                            queueOptions: {
                                durable: true,
                            },
                        },
                    }),
                    inject: [config_1.ConfigService],
                },
            ]),
        ],
        exports: [microservices_1.ClientsModule],
    })
], SharedMicroservicesModule);


/***/ }),
/* 25 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.RedisModule = void 0;
const tslib_1 = __webpack_require__(5);
const common_1 = __webpack_require__(2);
const config_1 = __webpack_require__(3);
const ioredis_1 = __webpack_require__(16);
const redis_service_1 = __webpack_require__(15);
let RedisModule = class RedisModule {
};
exports.RedisModule = RedisModule;
exports.RedisModule = RedisModule = tslib_1.__decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({
        imports: [config_1.ConfigModule],
        providers: [
            {
                provide: 'REDIS_CLIENT',
                useFactory: (configService) => {
                    return new ioredis_1.Redis({
                        host: configService.get('REDIS_HOST', 'localhost'),
                        port: configService.get('REDIS_PORT', 6380),
                        password: configService.get('REDIS_PASSWORD'),
                        lazyConnect: true,
                    });
                },
                inject: [config_1.ConfigService],
            },
            redis_service_1.RedisService,
        ],
        exports: [redis_service_1.RedisService, 'REDIS_CLIENT'],
    })
], RedisModule);


/***/ })
/******/ 	]);
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry needs to be wrapped in an IIFE because it needs to be isolated against other modules in the chunk.
(() => {
var exports = __webpack_exports__;

Object.defineProperty(exports, "__esModule", ({ value: true }));
const core_1 = __webpack_require__(1);
const common_1 = __webpack_require__(2);
const config_1 = __webpack_require__(3);
const reservations_module_1 = __webpack_require__(4);
async function bootstrap() {
    const logger = new common_1.Logger('ReservationsService');
    logger.log(`
╔══════════════════════════════════════════════════════════════╗
║ 📅 RESERVATIONS SERVICE                                     ║
║ Table Booking & Availability System                          ║
╚══════════════════════════════════════════════════════════════╝`);
    try {
        const app = await core_1.NestFactory.create(reservations_module_1.ReservationsModule);
        const configService = app.get(config_1.ConfigService);
        app.enableShutdownHooks();
        app.useGlobalPipes(new common_1.ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
            transformOptions: {
                enableImplicitConversion: true,
            },
        }));
        app.enableCors({
            origin: [
                'http://localhost:3000',
                'http://localhost:3001',
                'http://localhost:4000',
                'https://studio.apollographql.com',
            ],
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
            allowedHeaders: [
                'Content-Type',
                'Authorization',
                'X-Requested-With',
                'Accept',
                'Origin',
                'accesstoken',
                'refreshtoken',
            ],
        });
        const port = configService.get('PORT') || 4004;
        const nodeEnv = configService.get('NODE_ENV') || 'development';
        await app.listen(port);
        logger.log(`📅 RESERVATIONS SERVICE | ✅ Running on port ${port}`);
        logger.log(`📅 RESERVATIONS SERVICE | 🌐 GraphQL: http://localhost:${port}/graphql`);
        logger.log(`📅 RESERVATIONS SERVICE | 🔧 Environment: ${nodeEnv}`);
        logger.log('============================================================');
    }
    catch (error) {
        logger.error('❌ Failed to start Reservations Service:', error.message);
        process.exit(1);
    }
}
process.on('uncaughtException', (error) => {
    new common_1.Logger('ReservationsService').error('❌ Uncaught Exception:', error);
    process.exit(1);
});
process.on('unhandledRejection', (reason) => {
    new common_1.Logger('ReservationsService').error('❌ Unhandled Rejection:', reason);
    process.exit(1);
});
bootstrap();

})();

var __webpack_export_target__ = exports;
for(var __webpack_i__ in __webpack_exports__) __webpack_export_target__[__webpack_i__] = __webpack_exports__[__webpack_i__];
if(__webpack_exports__.__esModule) Object.defineProperty(__webpack_export_target__, "__esModule", { value: true });
/******/ })()
;