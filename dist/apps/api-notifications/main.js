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

module.exports = require("@nestjs/microservices");

/***/ }),
/* 3 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.NotificationsModule = void 0;
const tslib_1 = __webpack_require__(4);
const common_1 = __webpack_require__(5);
const config_1 = __webpack_require__(6);
const mailer_1 = __webpack_require__(7);
const notifications_controller_1 = __webpack_require__(8);
const notifications_service_1 = __webpack_require__(9);
const prisma_service_1 = __webpack_require__(10);
const redis_module_1 = __webpack_require__(16);
const redis_service_1 = __webpack_require__(12);
let NotificationsModule = class NotificationsModule {
};
exports.NotificationsModule = NotificationsModule;
exports.NotificationsModule = NotificationsModule = tslib_1.__decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                envFilePath: ['apps/api-notifications/.env.local', 'apps/api-notifications/.env'],
            }),
            mailer_1.MailerModule.forRootAsync({
                useFactory: async (config) => ({
                    transport: {
                        host: config.get('SMTP_HOST'),
                        secure: true,
                        auth: {
                            user: config.get('SMTP_MAIL'),
                            pass: config.get('SMTP_PASSWORD'),
                        },
                    },
                    defaults: {
                        from: config.get('SMTP_FROM') || 'SnackRapido <noreply@snackrapido.com>',
                    },
                }),
                inject: [config_1.ConfigService],
            }),
            redis_module_1.RedisModule,
        ],
        controllers: [notifications_controller_1.NotificationsController],
        providers: [notifications_service_1.NotificationsService, prisma_service_1.PrismaService, redis_service_1.RedisService],
    })
], NotificationsModule);


/***/ }),
/* 4 */
/***/ ((module) => {

module.exports = require("tslib");

/***/ }),
/* 5 */
/***/ ((module) => {

module.exports = require("@nestjs/common");

/***/ }),
/* 6 */
/***/ ((module) => {

module.exports = require("@nestjs/config");

/***/ }),
/* 7 */
/***/ ((module) => {

module.exports = require("@nestjs-modules/mailer");

/***/ }),
/* 8 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var NotificationsController_1;
var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.NotificationsController = void 0;
const tslib_1 = __webpack_require__(4);
const common_1 = __webpack_require__(5);
const microservices_1 = __webpack_require__(2);
const notifications_service_1 = __webpack_require__(9);
let NotificationsController = NotificationsController_1 = class NotificationsController {
    constructor(notificationsService) {
        this.notificationsService = notificationsService;
        this.logger = new common_1.Logger(NotificationsController_1.name);
        this.logger.log('📧 NotificationsController initialized');
        this.logger.log('📧 Listening for events:');
        this.logger.log('   - order.placed');
        this.logger.log('   - order.status.updated');
        this.logger.log('   - order.reviewed');
        this.logger.log('   - order.cancelled');
        this.logger.log('   - reservation.created');
        this.logger.log('   - reservation.confirmed');
        this.logger.log('   - reservation.cancelled');
    }
    /**
     * Listen to order.placed event
     */
    async handleOrderPlaced(data) {
        const timestamp = new Date().toISOString();
        this.logger.log(`📦 [${timestamp}] Received order.placed event`);
        this.logger.log(`📦 Order Number: ${data.orderNumber || 'N/A'}`);
        this.logger.log(`📦 Order ID: ${data.orderId || 'N/A'}`);
        this.notificationsService.handleOrderPlaced(data)
            .catch(error => this.logger.error(`❌ Error handling order.placed:`, error.message));
        this.logger.log(`✅ Accepted order.placed event for order: ${data.orderNumber}`);
    }
    /**
     * Listen to order.status.updated event
     */
    async handleOrderStatusUpdated(data) {
        this.logger.log(`🔄 Received order.status.updated event: ${data.orderNumber}`);
        this.notificationsService.handleOrderStatusUpdated(data)
            .catch(error => this.logger.error(`❌ Error handling order.status.updated:`, error.message));
        this.logger.log(`✅ Accepted order.status.updated event`);
    }
    /**
     * Listen to order.reviewed event
     */
    async handleOrderReviewed(data) {
        this.logger.log(`⭐ Received order.reviewed event`);
        this.notificationsService.handleOrderReviewed(data)
            .catch(error => this.logger.error(`❌ Error handling order.reviewed:`, error.message));
        this.logger.log(`✅ Accepted order.reviewed event`);
    }
    /**
       * Listen to order.cancelled event
       */
    async handleOrderCancelled(data) {
        const timestamp = new Date().toISOString();
        this.logger.log(`❌ [${timestamp}] Received order.cancelled event`);
        this.logger.log(`❌ Order Number: ${data.orderNumber || 'N/A'}`);
        this.notificationsService.handleOrderStatusUpdated({
            ...data,
            status: 'CANCELLED',
            customerEmail: data.metadata?.customerEmail,
        }).catch(error => this.logger.error(`❌ Error handling order.cancelled:`, error.message));
        this.logger.log(`✅ Accepted order.cancelled event for order: ${data.orderNumber}`);
    }
    // ==================== RESERVATION EVENTS ====================
    async handleReservationCreated(data) {
        this.logger.log(`📅 Received reservation.created event: ${data.reservationNumber}`);
        await this.notificationsService.handleReservationCreated(data)
            .catch(error => this.logger.error(`❌ Error handling reservation.created:`, error.message));
    }
    async handleReservationConfirmed(data) {
        this.logger.log(`✅ Received reservation.confirmed event: ${data.reservationNumber}`);
        await this.notificationsService.handleReservationConfirmed(data)
            .catch(error => this.logger.error(`❌ Error handling reservation.confirmed:`, error.message));
    }
    async handleReservationCancelled(data) {
        this.logger.log(`❌ Received reservation.cancelled event: ${data.reservationNumber}`);
        await this.notificationsService.handleReservationCancelled(data)
            .catch(error => this.logger.error(`❌ Error handling reservation.cancelled:`, error.message));
    }
};
exports.NotificationsController = NotificationsController;
tslib_1.__decorate([
    (0, microservices_1.EventPattern)('order.placed'),
    tslib_1.__param(0, (0, microservices_1.Payload)()),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object]),
    tslib_1.__metadata("design:returntype", Promise)
], NotificationsController.prototype, "handleOrderPlaced", null);
tslib_1.__decorate([
    (0, microservices_1.EventPattern)('order.status.updated'),
    tslib_1.__param(0, (0, microservices_1.Payload)()),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object]),
    tslib_1.__metadata("design:returntype", Promise)
], NotificationsController.prototype, "handleOrderStatusUpdated", null);
tslib_1.__decorate([
    (0, microservices_1.EventPattern)('order.reviewed'),
    tslib_1.__param(0, (0, microservices_1.Payload)()),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object]),
    tslib_1.__metadata("design:returntype", Promise)
], NotificationsController.prototype, "handleOrderReviewed", null);
tslib_1.__decorate([
    (0, microservices_1.EventPattern)('order.cancelled'),
    tslib_1.__param(0, (0, microservices_1.Payload)()),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object]),
    tslib_1.__metadata("design:returntype", Promise)
], NotificationsController.prototype, "handleOrderCancelled", null);
tslib_1.__decorate([
    (0, microservices_1.EventPattern)('reservation.created'),
    tslib_1.__param(0, (0, microservices_1.Payload)()),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object]),
    tslib_1.__metadata("design:returntype", Promise)
], NotificationsController.prototype, "handleReservationCreated", null);
tslib_1.__decorate([
    (0, microservices_1.EventPattern)('reservation.confirmed'),
    tslib_1.__param(0, (0, microservices_1.Payload)()),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object]),
    tslib_1.__metadata("design:returntype", Promise)
], NotificationsController.prototype, "handleReservationConfirmed", null);
tslib_1.__decorate([
    (0, microservices_1.EventPattern)('reservation.cancelled'),
    tslib_1.__param(0, (0, microservices_1.Payload)()),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object]),
    tslib_1.__metadata("design:returntype", Promise)
], NotificationsController.prototype, "handleReservationCancelled", null);
exports.NotificationsController = NotificationsController = NotificationsController_1 = tslib_1.__decorate([
    (0, common_1.Controller)(),
    tslib_1.__metadata("design:paramtypes", [typeof (_a = typeof notifications_service_1.NotificationsService !== "undefined" && notifications_service_1.NotificationsService) === "function" ? _a : Object])
], NotificationsController);


/***/ }),
/* 9 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var NotificationsService_1;
var _a, _b, _c;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.NotificationsService = void 0;
const tslib_1 = __webpack_require__(4);
const common_1 = __webpack_require__(5);
const prisma_service_1 = __webpack_require__(10);
const redis_service_1 = __webpack_require__(12);
const notification_dto_1 = __webpack_require__(14);
const mailer_1 = __webpack_require__(7);
let NotificationsService = NotificationsService_1 = class NotificationsService {
    constructor(prisma, redisService, mailerService) {
        this.prisma = prisma;
        this.redisService = redisService;
        this.mailerService = mailerService;
        this.logger = new common_1.Logger(NotificationsService_1.name);
    }
    /**
     * Create a notification in the database
     */
    async createNotification(dto) {
        try {
            const notification = await this.prisma.notification.create({
                data: {
                    userId: dto.userId,
                    type: dto.type,
                    title: dto.title,
                    message: dto.message,
                    metadata: dto.metadata || {},
                },
            });
            this.logger.log(`✅ Notification created: ${notification.id} for user: ${dto.userId}`);
            return notification;
        }
        catch (error) {
            this.logger.error(`❌ Failed to create notification:`, error.message);
            throw error;
        }
    }
    /**
     * Send email notification with rate limiting
     */
    async sendEmailNotification(dto) {
        try {
            // Rate limiting: max 10 emails per hour per user
            if (dto.userId) {
                const rateLimitKey = `email_rate_limit:${dto.userId}`;
                const currentCount = await this.redisService.get(rateLimitKey);
                if (currentCount && parseInt(currentCount) >= 10) {
                    this.logger.warn(`⚠️ Rate limit exceeded for user: ${dto.userId}`);
                    throw new common_1.BadRequestException('Email rate limit exceeded. Please try again later.');
                }
                // Increment rate limit counter
                const newCount = currentCount ? parseInt(currentCount) + 1 : 1;
                await this.redisService.set(rateLimitKey, newCount.toString(), 3600); // 1 hour TTL
            }
            // Send email
            await this.mailerService.sendMail({
                to: dto.to,
                subject: dto.subject,
                html: dto.content,
            });
            // Log the notification
            await this.logNotification({
                userId: dto.userId || 'unknown',
                type: dto.type || notification_dto_1.NotificationType.SYSTEM_ALERT,
                channel: notification_dto_1.NotificationChannel.EMAIL,
                status: 'SENT',
                recipientEmail: dto.to,
                subject: dto.subject,
                content: dto.content,
            });
            this.logger.log(`📧 Email sent to: ${dto.to}`);
            return { success: true, message: 'Email sent successfully' };
        }
        catch (error) {
            this.logger.error(`❌ Failed to send email:`, error.message);
            // Log failed notification
            if (dto.userId) {
                await this.logNotification({
                    userId: dto.userId,
                    type: dto.type || notification_dto_1.NotificationType.SYSTEM_ALERT,
                    channel: notification_dto_1.NotificationChannel.EMAIL,
                    status: 'FAILED',
                    recipientEmail: dto.to,
                    subject: dto.subject,
                    content: dto.content,
                    errorMessage: error.message,
                });
            }
            throw error;
        }
    }
    /**
     * Send SMS notification (mock implementation)
     */
    async sendSmsNotification(dto) {
        try {
            // Rate limiting: max 5 SMS per hour per user
            if (dto.userId) {
                const rateLimitKey = `sms_rate_limit:${dto.userId}`;
                const currentCount = await this.redisService.get(rateLimitKey);
                if (currentCount && parseInt(currentCount) >= 5) {
                    this.logger.warn(`⚠️ SMS rate limit exceeded for user: ${dto.userId}`);
                    throw new common_1.BadRequestException('SMS rate limit exceeded. Please try again later.');
                }
                // Increment rate limit counter
                const newCount = currentCount ? parseInt(currentCount) + 1 : 1;
                await this.redisService.set(rateLimitKey, newCount.toString(), 3600); // 1 hour TTL
            }
            // Mock SMS sending (log to console)
            this.logger.log(`📱 SMS MOCK | To: ${dto.to} | Message: ${dto.message}`);
            // Log the notification
            await this.logNotification({
                userId: dto.userId || 'unknown',
                type: dto.type || notification_dto_1.NotificationType.SYSTEM_ALERT,
                channel: notification_dto_1.NotificationChannel.SMS,
                status: 'SENT',
                recipientPhone: dto.to,
                content: dto.message,
            });
            return { success: true, message: 'SMS sent successfully (mock)' };
        }
        catch (error) {
            this.logger.error(`❌ Failed to send SMS:`, error.message);
            // Log failed notification
            if (dto.userId) {
                await this.logNotification({
                    userId: dto.userId,
                    type: dto.type || notification_dto_1.NotificationType.SYSTEM_ALERT,
                    channel: notification_dto_1.NotificationChannel.SMS,
                    status: 'FAILED',
                    recipientPhone: dto.to,
                    content: dto.message,
                    errorMessage: error.message,
                });
            }
            throw error;
        }
    }
    /**
     * Send push notification (mock implementation)
     */
    async sendPushNotification(dto) {
        try {
            // Rate limiting: max 20 push notifications per hour per user
            const rateLimitKey = `push_rate_limit:${dto.userId}`;
            const currentCount = await this.redisService.get(rateLimitKey);
            if (currentCount && parseInt(currentCount) >= 20) {
                this.logger.warn(`⚠️ Push notification rate limit exceeded for user: ${dto.userId}`);
                throw new common_1.BadRequestException('Push notification rate limit exceeded. Please try again later.');
            }
            // Increment rate limit counter
            const newCount = currentCount ? parseInt(currentCount) + 1 : 1;
            await this.redisService.set(rateLimitKey, newCount.toString(), 3600); // 1 hour TTL
            // Mock push notification (log to console)
            this.logger.log(`🔔 PUSH MOCK | User: ${dto.userId} | Title: ${dto.title} | Message: ${dto.message}`);
            if (dto.data) {
                this.logger.log(`🔔 PUSH MOCK | Data: ${JSON.stringify(dto.data)}`);
            }
            // Log the notification
            await this.logNotification({
                userId: dto.userId,
                type: dto.type,
                channel: notification_dto_1.NotificationChannel.PUSH,
                status: 'SENT',
                subject: dto.title,
                content: dto.message,
            });
            return { success: true, message: 'Push notification sent successfully (mock)' };
        }
        catch (error) {
            this.logger.error(`❌ Failed to send push notification:`, error.message);
            // Log failed notification
            await this.logNotification({
                userId: dto.userId,
                type: dto.type,
                channel: notification_dto_1.NotificationChannel.PUSH,
                status: 'FAILED',
                subject: dto.title,
                content: dto.message,
                errorMessage: error.message,
            });
            throw error;
        }
    }
    /**
     * Handle order placed event
     */
    async handleOrderPlaced(data) {
        this.logger.log(`📦 Order placed event received: ${data.orderNumber}`);
        try {
            // Create notification in database
            await this.createNotification({
                userId: data.customerId,
                type: notification_dto_1.NotificationType.ORDER_UPDATE,
                title: 'Order Placed Successfully',
                message: `Your order #${data.orderNumber} has been placed successfully. Total: $${data.total}`,
                metadata: {
                    orderId: data.orderId,
                    orderNumber: data.orderNumber,
                    restaurantName: data.metadata?.restaurantName,
                    total: data.total,
                },
            });
            // Send email notification (non-blocking)
            if (data.metadata?.customerEmail) {
                try {
                    await this.sendEmailNotification({
                        to: data.metadata.customerEmail,
                        subject: `Order Confirmation - ${data.orderNumber}`,
                        content: this.generateOrderConfirmationEmail(data),
                        userId: data.customerId,
                        type: notification_dto_1.NotificationType.ORDER_UPDATE,
                    });
                }
                catch (emailError) {
                    this.logger.warn(`⚠️ Email notification failed but continuing: ${emailError.message}`);
                }
            }
            // Send push notification (non-blocking)
            try {
                await this.sendPushNotification({
                    userId: data.customerId,
                    type: notification_dto_1.NotificationType.ORDER_UPDATE,
                    title: 'Order Placed',
                    message: `Your order #${data.orderNumber} has been placed successfully!`,
                    data: {
                        orderId: data.orderId,
                        orderNumber: data.orderNumber,
                    },
                });
            }
            catch (pushError) {
                this.logger.warn(`⚠️ Push notification failed but continuing: ${pushError.message}`);
            }
            this.logger.log(`✅ Order placed notifications processed for order: ${data.orderNumber}`);
        }
        catch (error) {
            this.logger.error(`❌ Failed to handle order placed event:`, error.message);
            throw error;
        }
    }
    /**
     * Handle order status updated event
     */
    async handleOrderStatusUpdated(data) {
        this.logger.log(`🔄 Order status updated event received: ${data.orderNumber} -> ${data.status}`);
        try {
            // Create notification in database
            await this.createNotification({
                userId: data.customerId,
                type: notification_dto_1.NotificationType.ORDER_UPDATE,
                title: `Order ${this.getStatusLabel(data.status)}`,
                message: `Your order #${data.orderNumber} is now ${this.getStatusLabel(data.status).toLowerCase()}.`,
                metadata: {
                    orderId: data.orderId,
                    orderNumber: data.orderNumber,
                    status: data.status,
                    previousStatus: data.previousStatus,
                },
            });
            // Send email notification for important status changes (non-blocking)
            if (data.customerEmail && this.isImportantStatus(data.status)) {
                try {
                    await this.sendEmailNotification({
                        to: data.customerEmail,
                        subject: `Order Update - ${data.orderNumber}`,
                        content: this.generateOrderStatusEmail(data),
                        userId: data.customerId,
                        type: notification_dto_1.NotificationType.ORDER_UPDATE,
                    });
                }
                catch (emailError) {
                    this.logger.warn(`⚠️ Email notification failed but continuing: ${emailError.message}`);
                }
            }
            // Send push notification (non-blocking)
            try {
                await this.sendPushNotification({
                    userId: data.customerId,
                    type: notification_dto_1.NotificationType.ORDER_UPDATE,
                    title: 'Order Update',
                    message: `Your order #${data.orderNumber} is ${this.getStatusLabel(data.status).toLowerCase()}!`,
                    data: {
                        orderId: data.orderId,
                        orderNumber: data.orderNumber,
                        status: data.status,
                    },
                });
            }
            catch (pushError) {
                this.logger.warn(`⚠️ Push notification failed but continuing: ${pushError.message}`);
            }
            this.logger.log(`✅ Order status update notifications processed for order: ${data.orderNumber}`);
        }
        catch (error) {
            this.logger.error(`❌ Failed to handle order status updated event:`, error.message);
            throw error;
        }
    }
    /**
     * Handle order reviewed event
     */
    async handleOrderReviewed(data) {
        this.logger.log(`⭐ Order reviewed event received: ${data.orderId}`);
        try {
            // Notify restaurant about the review
            if (data.restaurantId) {
                await this.createNotification({
                    userId: data.restaurantId,
                    type: notification_dto_1.NotificationType.ORDER_UPDATE,
                    title: 'New Review Received',
                    message: `A customer left a ${data.rating}-star review for their order.`,
                    metadata: {
                        orderId: data.orderId,
                        rating: data.rating,
                        comment: data.comment,
                    },
                });
            }
            this.logger.log(`✅ Order review notifications sent for order: ${data.orderId}`);
        }
        catch (error) {
            this.logger.error(`❌ Failed to handle order reviewed event:`, error.message);
        }
    }
    /**
     * Log notification to database
     */
    async logNotification(data) {
        try {
            await this.prisma.notificationLog.create({
                data: {
                    userId: data.userId,
                    type: data.type,
                    channel: data.channel,
                    status: data.status,
                    recipientEmail: data.recipientEmail,
                    recipientPhone: data.recipientPhone,
                    subject: data.subject,
                    content: data.content,
                    errorMessage: data.errorMessage,
                    sentAt: data.status === 'SENT' ? new Date() : null,
                },
            });
        }
        catch (error) {
            this.logger.error(`❌ Failed to log notification:`, error.message);
        }
    }
    /**
     * Generate order confirmation email HTML
     */
    generateOrderConfirmationEmail(data) {
        return `
      <h2>Order Confirmation</h2>
      <p>Dear ${data.metadata?.customerName || 'Customer'},</p>
      <p>Thank you for your order! Your order has been placed successfully.</p>
      
      <h3>Order Details:</h3>
      <ul>
        <li><strong>Order Number:</strong> ${data.orderNumber}</li>
        <li><strong>Restaurant:</strong> ${data.metadata?.restaurantName || 'N/A'}</li>
        <li><strong>Total:</strong> $${data.total}</li>
        <li><strong>Delivery Type:</strong> ${data.deliveryType}</li>
        ${data.deliveryAddress ? `<li><strong>Delivery Address:</strong> ${data.deliveryAddress}</li>` : ''}
        ${data.metadata?.estimatedDeliveryTime ? `<li><strong>Estimated Delivery:</strong> ${new Date(data.metadata.estimatedDeliveryTime).toLocaleString()}</li>` : ''}
      </ul>
      
      <p>We'll notify you when your order status changes.</p>
      
      <p>Best regards,<br/>SnackRapido Team</p>
    `;
    }
    /**
     * Generate order status email HTML
     */
    generateOrderStatusEmail(data) {
        return `
      <h2>Order Status Update</h2>
      <p>Dear Customer,</p>
      <p>Your order <strong>#${data.orderNumber}</strong> status has been updated.</p>
      
      <h3>Current Status: ${this.getStatusLabel(data.status)}</h3>
      
      <p>Thank you for choosing SnackRapido!</p>
      
      <p>Best regards,<br/>SnackRapido Team</p>
    `;
    }
    /**
     * Get human-readable status label
     */
    getStatusLabel(status) {
        const labels = {
            PENDING: 'Pending',
            CONFIRMED: 'Confirmed',
            PREPARING: 'Being Prepared',
            READY: 'Ready for Pickup/Delivery',
            OUT_FOR_DELIVERY: 'Out for Delivery',
            DELIVERED: 'Delivered',
            CANCELLED: 'Cancelled',
        };
        return labels[status] || status;
    }
    /**
     * Check if status change requires email notification
     */
    isImportantStatus(status) {
        return ['CONFIRMED', 'READY', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'].includes(status);
    }
    /**
     * Get notifications for a user
     */
    async getNotifications(userId, isRead) {
        try {
            const where = { userId };
            if (isRead !== undefined) {
                where.isRead = isRead;
            }
            const notifications = await this.prisma.notification.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                take: 50,
            });
            return notifications;
        }
        catch (error) {
            this.logger.error(`❌ Failed to get notifications:`, error.message);
            throw error;
        }
    }
    // ==================== RESERVATION EVENT HANDLERS ====================
    /**
     * Handle reservation.created event
     */
    async handleReservationCreated(data) {
        this.logger.log(`📅 Reservation created event: ${data.reservationNumber}`);
        try {
            await this.createNotification({
                userId: data.customerId,
                type: notification_dto_1.NotificationType.RESERVATION_CONFIRMATION,
                title: 'Reservation Request Received',
                message: `Your reservation #${data.reservationNumber} at ${data.restaurantName} for ${data.partySize} on ${new Date(data.date).toLocaleDateString()} at ${data.startTime} has been received.`,
                metadata: {
                    reservationId: data.reservationId,
                    reservationNumber: data.reservationNumber,
                    restaurantName: data.restaurantName,
                    date: data.date,
                    startTime: data.startTime,
                    partySize: data.partySize,
                    tableNumber: data.tableNumber,
                },
            });
            if (data.customerEmail) {
                try {
                    await this.sendEmailNotification({
                        to: data.customerEmail,
                        subject: `Reservation Received - ${data.reservationNumber}`,
                        content: `
              <h2>Reservation Request Received</h2>
              <p>Dear ${data.customerName || 'Customer'},</p>
              <p>Your reservation has been received and is pending confirmation.</p>
              <ul>
                <li><strong>Reservation:</strong> ${data.reservationNumber}</li>
                <li><strong>Restaurant:</strong> ${data.restaurantName}</li>
                <li><strong>Date:</strong> ${new Date(data.date).toLocaleDateString()}</li>
                <li><strong>Time:</strong> ${data.startTime} - ${data.endTime}</li>
                <li><strong>Party Size:</strong> ${data.partySize}</li>
                ${data.tableNumber ? `<li><strong>Table:</strong> ${data.tableNumber}</li>` : ''}
              </ul>
              <p>We'll notify you once your reservation is confirmed.</p>
              <p>Best regards,<br/>SnackRapido Team</p>
            `,
                        userId: data.customerId,
                        type: notification_dto_1.NotificationType.RESERVATION_CONFIRMATION,
                    });
                }
                catch (emailError) {
                    this.logger.warn(`⚠️ Reservation email failed: ${emailError.message}`);
                }
            }
        }
        catch (error) {
            this.logger.error(`❌ Failed to handle reservation.created:`, error.message);
            throw error;
        }
    }
    /**
     * Handle reservation.confirmed event
     */
    async handleReservationConfirmed(data) {
        this.logger.log(`✅ Reservation confirmed: ${data.reservationNumber}`);
        try {
            await this.createNotification({
                userId: data.customerId,
                type: notification_dto_1.NotificationType.RESERVATION_CONFIRMATION,
                title: 'Reservation Confirmed',
                message: `Your reservation #${data.reservationNumber} at ${data.restaurantName} has been confirmed!`,
                metadata: {
                    reservationId: data.reservationId,
                    reservationNumber: data.reservationNumber,
                    status: 'CONFIRMED',
                },
            });
            if (data.customerEmail) {
                try {
                    await this.sendEmailNotification({
                        to: data.customerEmail,
                        subject: `Reservation Confirmed - ${data.reservationNumber}`,
                        content: `
              <h2>Reservation Confirmed ✅</h2>
              <p>Great news! Your reservation <strong>#${data.reservationNumber}</strong> at <strong>${data.restaurantName}</strong> has been confirmed.</p>
              <p>We look forward to seeing you!</p>
              <p>Best regards,<br/>SnackRapido Team</p>
            `,
                        userId: data.customerId,
                        type: notification_dto_1.NotificationType.RESERVATION_CONFIRMATION,
                    });
                }
                catch (emailError) {
                    this.logger.warn(`⚠️ Confirmation email failed: ${emailError.message}`);
                }
            }
        }
        catch (error) {
            this.logger.error(`❌ Failed to handle reservation.confirmed:`, error.message);
            throw error;
        }
    }
    /**
     * Handle reservation.cancelled event
     */
    async handleReservationCancelled(data) {
        this.logger.log(`❌ Reservation cancelled: ${data.reservationNumber}`);
        try {
            await this.createNotification({
                userId: data.customerId,
                type: notification_dto_1.NotificationType.RESERVATION_CONFIRMATION,
                title: 'Reservation Cancelled',
                message: `Your reservation #${data.reservationNumber} at ${data.restaurantName} has been cancelled.${data.reason ? ` Reason: ${data.reason}` : ''}`,
                metadata: {
                    reservationId: data.reservationId,
                    reservationNumber: data.reservationNumber,
                    status: 'CANCELLED',
                    reason: data.reason,
                },
            });
            if (data.customerEmail) {
                try {
                    await this.sendEmailNotification({
                        to: data.customerEmail,
                        subject: `Reservation Cancelled - ${data.reservationNumber}`,
                        content: `
              <h2>Reservation Cancelled</h2>
              <p>Your reservation <strong>#${data.reservationNumber}</strong> at <strong>${data.restaurantName}</strong> has been cancelled.</p>
              ${data.reason ? `<p><strong>Reason:</strong> ${data.reason}</p>` : ''}
              <p>You can make a new reservation anytime.</p>
              <p>Best regards,<br/>SnackRapido Team</p>
            `,
                        userId: data.customerId,
                        type: notification_dto_1.NotificationType.RESERVATION_CONFIRMATION,
                    });
                }
                catch (emailError) {
                    this.logger.warn(`⚠️ Cancellation email failed: ${emailError.message}`);
                }
            }
        }
        catch (error) {
            this.logger.error(`❌ Failed to handle reservation.cancelled:`, error.message);
            throw error;
        }
    }
    /**
     * Mark notification as read
     */
    async markAsRead(notificationId) {
        try {
            const notification = await this.prisma.notification.update({
                where: { id: notificationId },
                data: { isRead: true },
            });
            this.logger.log(`✅ Notification marked as read: ${notificationId}`);
            return notification;
        }
        catch (error) {
            this.logger.error(`❌ Failed to mark notification as read:`, error.message);
            throw error;
        }
    }
};
exports.NotificationsService = NotificationsService;
exports.NotificationsService = NotificationsService = NotificationsService_1 = tslib_1.__decorate([
    (0, common_1.Injectable)(),
    tslib_1.__metadata("design:paramtypes", [typeof (_a = typeof prisma_service_1.PrismaService !== "undefined" && prisma_service_1.PrismaService) === "function" ? _a : Object, typeof (_b = typeof redis_service_1.RedisService !== "undefined" && redis_service_1.RedisService) === "function" ? _b : Object, typeof (_c = typeof mailer_1.MailerService !== "undefined" && mailer_1.MailerService) === "function" ? _c : Object])
], NotificationsService);


/***/ }),
/* 10 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var PrismaService_1;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.PrismaService = void 0;
const tslib_1 = __webpack_require__(4);
const common_1 = __webpack_require__(5);
const notifications_client_1 = __webpack_require__(11);
let PrismaService = PrismaService_1 = class PrismaService extends notifications_client_1.PrismaClient {
    constructor() {
        super({
            log: [
                { emit: 'stdout', level: 'query' },
                { emit: 'stdout', level: 'info' },
                { emit: 'stdout', level: 'warn' },
                { emit: 'stdout', level: 'error' },
            ],
        });
        this.logger = new common_1.Logger(PrismaService_1.name);
    }
    async onModuleInit() {
        try {
            await this.$connect();
            this.logger.log('✅ Database connected successfully (Notifications)');
        }
        catch (error) {
            this.logger.error('❌ Failed to connect to database:', error);
            throw error;
        }
    }
    async onModuleDestroy() {
        await this.$disconnect();
        this.logger.log('🔌 Database disconnected (Notifications)');
    }
};
exports.PrismaService = PrismaService;
exports.PrismaService = PrismaService = PrismaService_1 = tslib_1.__decorate([
    (0, common_1.Injectable)(),
    tslib_1.__metadata("design:paramtypes", [])
], PrismaService);


/***/ }),
/* 11 */
/***/ ((module) => {

module.exports = require(".prisma/notifications-client");

/***/ }),
/* 12 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.RedisService = void 0;
const tslib_1 = __webpack_require__(4);
const common_1 = __webpack_require__(5);
const ioredis_1 = __webpack_require__(13);
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
/* 13 */
/***/ ((module) => {

module.exports = require("ioredis");

/***/ }),
/* 14 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a, _b;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.GetNotificationsDto = exports.MarkAsReadDto = exports.SendPushNotificationDto = exports.SendSmsNotificationDto = exports.SendEmailNotificationDto = exports.CreateNotificationDto = exports.NotificationChannel = exports.NotificationType = void 0;
const tslib_1 = __webpack_require__(4);
const class_validator_1 = __webpack_require__(15);
var NotificationType;
(function (NotificationType) {
    NotificationType["ORDER_UPDATE"] = "ORDER_UPDATE";
    NotificationType["RESERVATION_CONFIRMATION"] = "RESERVATION_CONFIRMATION";
    NotificationType["PROMOTION"] = "PROMOTION";
    NotificationType["SYSTEM_ALERT"] = "SYSTEM_ALERT";
    NotificationType["CHAT_MESSAGE"] = "CHAT_MESSAGE";
})(NotificationType || (exports.NotificationType = NotificationType = {}));
var NotificationChannel;
(function (NotificationChannel) {
    NotificationChannel["EMAIL"] = "EMAIL";
    NotificationChannel["SMS"] = "SMS";
    NotificationChannel["PUSH"] = "PUSH";
})(NotificationChannel || (exports.NotificationChannel = NotificationChannel = {}));
class CreateNotificationDto {
}
exports.CreateNotificationDto = CreateNotificationDto;
tslib_1.__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    tslib_1.__metadata("design:type", String)
], CreateNotificationDto.prototype, "userId", void 0);
tslib_1.__decorate([
    (0, class_validator_1.IsEnum)(NotificationType),
    (0, class_validator_1.IsNotEmpty)(),
    tslib_1.__metadata("design:type", String)
], CreateNotificationDto.prototype, "type", void 0);
tslib_1.__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    tslib_1.__metadata("design:type", String)
], CreateNotificationDto.prototype, "title", void 0);
tslib_1.__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    tslib_1.__metadata("design:type", String)
], CreateNotificationDto.prototype, "message", void 0);
tslib_1.__decorate([
    (0, class_validator_1.IsObject)(),
    (0, class_validator_1.IsOptional)(),
    tslib_1.__metadata("design:type", typeof (_a = typeof Record !== "undefined" && Record) === "function" ? _a : Object)
], CreateNotificationDto.prototype, "metadata", void 0);
class SendEmailNotificationDto {
}
exports.SendEmailNotificationDto = SendEmailNotificationDto;
tslib_1.__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    tslib_1.__metadata("design:type", String)
], SendEmailNotificationDto.prototype, "to", void 0);
tslib_1.__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    tslib_1.__metadata("design:type", String)
], SendEmailNotificationDto.prototype, "subject", void 0);
tslib_1.__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    tslib_1.__metadata("design:type", String)
], SendEmailNotificationDto.prototype, "content", void 0);
tslib_1.__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    tslib_1.__metadata("design:type", String)
], SendEmailNotificationDto.prototype, "userId", void 0);
tslib_1.__decorate([
    (0, class_validator_1.IsEnum)(NotificationType),
    (0, class_validator_1.IsOptional)(),
    tslib_1.__metadata("design:type", String)
], SendEmailNotificationDto.prototype, "type", void 0);
class SendSmsNotificationDto {
}
exports.SendSmsNotificationDto = SendSmsNotificationDto;
tslib_1.__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    tslib_1.__metadata("design:type", String)
], SendSmsNotificationDto.prototype, "to", void 0);
tslib_1.__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    tslib_1.__metadata("design:type", String)
], SendSmsNotificationDto.prototype, "message", void 0);
tslib_1.__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    tslib_1.__metadata("design:type", String)
], SendSmsNotificationDto.prototype, "userId", void 0);
tslib_1.__decorate([
    (0, class_validator_1.IsEnum)(NotificationType),
    (0, class_validator_1.IsOptional)(),
    tslib_1.__metadata("design:type", String)
], SendSmsNotificationDto.prototype, "type", void 0);
class SendPushNotificationDto {
}
exports.SendPushNotificationDto = SendPushNotificationDto;
tslib_1.__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    tslib_1.__metadata("design:type", String)
], SendPushNotificationDto.prototype, "userId", void 0);
tslib_1.__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    tslib_1.__metadata("design:type", String)
], SendPushNotificationDto.prototype, "title", void 0);
tslib_1.__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    tslib_1.__metadata("design:type", String)
], SendPushNotificationDto.prototype, "message", void 0);
tslib_1.__decorate([
    (0, class_validator_1.IsEnum)(NotificationType),
    (0, class_validator_1.IsNotEmpty)(),
    tslib_1.__metadata("design:type", String)
], SendPushNotificationDto.prototype, "type", void 0);
tslib_1.__decorate([
    (0, class_validator_1.IsObject)(),
    (0, class_validator_1.IsOptional)(),
    tslib_1.__metadata("design:type", typeof (_b = typeof Record !== "undefined" && Record) === "function" ? _b : Object)
], SendPushNotificationDto.prototype, "data", void 0);
class MarkAsReadDto {
}
exports.MarkAsReadDto = MarkAsReadDto;
tslib_1.__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    tslib_1.__metadata("design:type", String)
], MarkAsReadDto.prototype, "notificationId", void 0);
class GetNotificationsDto {
}
exports.GetNotificationsDto = GetNotificationsDto;
tslib_1.__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    tslib_1.__metadata("design:type", String)
], GetNotificationsDto.prototype, "userId", void 0);
tslib_1.__decorate([
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    tslib_1.__metadata("design:type", Boolean)
], GetNotificationsDto.prototype, "isRead", void 0);
tslib_1.__decorate([
    (0, class_validator_1.IsEnum)(NotificationType),
    (0, class_validator_1.IsOptional)(),
    tslib_1.__metadata("design:type", String)
], GetNotificationsDto.prototype, "type", void 0);


/***/ }),
/* 15 */
/***/ ((module) => {

module.exports = require("class-validator");

/***/ }),
/* 16 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.RedisModule = void 0;
const tslib_1 = __webpack_require__(4);
const common_1 = __webpack_require__(5);
const config_1 = __webpack_require__(6);
const ioredis_1 = __webpack_require__(13);
const redis_service_1 = __webpack_require__(12);
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
const microservices_1 = __webpack_require__(2);
const notifications_module_1 = __webpack_require__(3);
const common_1 = __webpack_require__(5);
async function bootstrap() {
    const logger = new common_1.Logger('NotificationsService');
    console.log(`
╔══════════════════════════════════════════════════════════════╗
║ 📧 NOTIFICATIONS SERVICE                                     ║
║ Multi-Channel Notification System                            ║
╚══════════════════════════════════════════════════════════════╝`);
    const app = await core_1.NestFactory.createMicroservice(notifications_module_1.NotificationsModule, {
        transport: microservices_1.Transport.RMQ,
        options: {
            urls: [process.env.RABBITMQ_URL || 'amqp://admin:rabbit123@localhost:5672'],
            queue: 'notifications_queue',
            queueOptions: {
                durable: true,
            },
            prefetchCount: 100,
            noAck: false,
        },
    });
    await app.listen();
    logger.log('📧 NOTIFICATIONS SERVICE | 🚀 Starting Notifications Service...');
    logger.log('📧 NOTIFICATIONS SERVICE | ✅ Notifications Service is running');
    logger.log('📧 NOTIFICATIONS SERVICE | 🐰 RabbitMQ: Connected to notifications_queue');
    logger.log('📧 NOTIFICATIONS SERVICE | 📧 Email Notifications: Ready');
    logger.log('📧 NOTIFICATIONS SERVICE | 📱 SMS Notifications: Ready (Mock)');
    logger.log('📧 NOTIFICATIONS SERVICE | 🔔 Push Notifications: Ready (Mock)');
    logger.log('📧 NOTIFICATIONS SERVICE | 🔧 Environment: ' + (process.env.NODE_ENV || 'development'));
    logger.log('📧 NOTIFICATIONS SERVICE | 🏷️ Service: notifications-service');
    logger.log('============================================================');
}
bootstrap();

})();

var __webpack_export_target__ = exports;
for(var __webpack_i__ in __webpack_exports__) __webpack_export_target__[__webpack_i__] = __webpack_exports__[__webpack_i__];
if(__webpack_exports__.__esModule) Object.defineProperty(__webpack_export_target__, "__esModule", { value: true });
/******/ })()
;