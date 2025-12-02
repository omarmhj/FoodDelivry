import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../../../libs/shared/src/redis.service';
import {
  CreateNotificationDto,
  SendEmailNotificationDto,
  SendSmsNotificationDto,
  SendPushNotificationDto,
  NotificationType,
  NotificationChannel,
} from './dto/notification.dto';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
    private readonly mailerService: MailerService,
  ) {}

  /**
   * Create a notification in the database
   */
  async createNotification(dto: CreateNotificationDto) {
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
    } catch (error) {
      this.logger.error(`❌ Failed to create notification:`, error.message);
      throw error;
    }
  }

  /**
   * Send email notification with rate limiting
   */
  async sendEmailNotification(dto: SendEmailNotificationDto) {
    try {
      // Rate limiting: max 10 emails per hour per user
      if (dto.userId) {
        const rateLimitKey = `email_rate_limit:${dto.userId}`;
        const currentCount = await this.redisService.get(rateLimitKey);

        if (currentCount && parseInt(currentCount) >= 10) {
          this.logger.warn(`⚠️ Rate limit exceeded for user: ${dto.userId}`);
          throw new BadRequestException('Email rate limit exceeded. Please try again later.');
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
        type: dto.type || NotificationType.SYSTEM_ALERT,
        channel: NotificationChannel.EMAIL,
        status: 'SENT',
        recipientEmail: dto.to,
        subject: dto.subject,
        content: dto.content,
      });

      this.logger.log(`📧 Email sent to: ${dto.to}`);
      return { success: true, message: 'Email sent successfully' };
    } catch (error) {
      this.logger.error(`❌ Failed to send email:`, error.message);

      // Log failed notification
      if (dto.userId) {
        await this.logNotification({
          userId: dto.userId,
          type: dto.type || NotificationType.SYSTEM_ALERT,
          channel: NotificationChannel.EMAIL,
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
  async sendSmsNotification(dto: SendSmsNotificationDto) {
    try {
      // Rate limiting: max 5 SMS per hour per user
      if (dto.userId) {
        const rateLimitKey = `sms_rate_limit:${dto.userId}`;
        const currentCount = await this.redisService.get(rateLimitKey);

        if (currentCount && parseInt(currentCount) >= 5) {
          this.logger.warn(`⚠️ SMS rate limit exceeded for user: ${dto.userId}`);
          throw new BadRequestException('SMS rate limit exceeded. Please try again later.');
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
        type: dto.type || NotificationType.SYSTEM_ALERT,
        channel: NotificationChannel.SMS,
        status: 'SENT',
        recipientPhone: dto.to,
        content: dto.message,
      });

      return { success: true, message: 'SMS sent successfully (mock)' };
    } catch (error) {
      this.logger.error(`❌ Failed to send SMS:`, error.message);

      // Log failed notification
      if (dto.userId) {
        await this.logNotification({
          userId: dto.userId,
          type: dto.type || NotificationType.SYSTEM_ALERT,
          channel: NotificationChannel.SMS,
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
  async sendPushNotification(dto: SendPushNotificationDto) {
    try {
      // Rate limiting: max 20 push notifications per hour per user
      const rateLimitKey = `push_rate_limit:${dto.userId}`;
      const currentCount = await this.redisService.get(rateLimitKey);

      if (currentCount && parseInt(currentCount) >= 20) {
        this.logger.warn(`⚠️ Push notification rate limit exceeded for user: ${dto.userId}`);
        throw new BadRequestException('Push notification rate limit exceeded. Please try again later.');
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
        channel: NotificationChannel.PUSH,
        status: 'SENT',
        subject: dto.title,
        content: dto.message,
      });

      return { success: true, message: 'Push notification sent successfully (mock)' };
    } catch (error) {
      this.logger.error(`❌ Failed to send push notification:`, error.message);

      // Log failed notification
      await this.logNotification({
        userId: dto.userId,
        type: dto.type,
        channel: NotificationChannel.PUSH,
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
  async handleOrderPlaced(data: any) {
    this.logger.log(`📦 Order placed event received: ${data.orderNumber}`);

    try {
      // Create notification in database
      await this.createNotification({
        userId: data.customerId,
        type: NotificationType.ORDER_UPDATE,
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
            type: NotificationType.ORDER_UPDATE,
          });
        } catch (emailError) {
          this.logger.warn(`⚠️ Email notification failed but continuing: ${emailError.message}`);
        }
      }

      // Send push notification (non-blocking)
      try {
        await this.sendPushNotification({
          userId: data.customerId,
          type: NotificationType.ORDER_UPDATE,
          title: 'Order Placed',
          message: `Your order #${data.orderNumber} has been placed successfully!`,
          data: {
            orderId: data.orderId,
            orderNumber: data.orderNumber,
          },
        });
      } catch (pushError) {
        this.logger.warn(`⚠️ Push notification failed but continuing: ${pushError.message}`);
      }

      this.logger.log(`✅ Order placed notifications processed for order: ${data.orderNumber}`);
    } catch (error) {
      this.logger.error(`❌ Failed to handle order placed event:`, error.message);
      throw error;
    }
  }

  /**
   * Handle order status updated event
   */
  async handleOrderStatusUpdated(data: any) {
    this.logger.log(`🔄 Order status updated event received: ${data.orderNumber} -> ${data.status}`);

    try {
      // Create notification in database
      await this.createNotification({
        userId: data.customerId,
        type: NotificationType.ORDER_UPDATE,
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
            type: NotificationType.ORDER_UPDATE,
          });
        } catch (emailError) {
          this.logger.warn(`⚠️ Email notification failed but continuing: ${emailError.message}`);
        }
      }

      // Send push notification (non-blocking)
      try {
        await this.sendPushNotification({
          userId: data.customerId,
          type: NotificationType.ORDER_UPDATE,
          title: 'Order Update',
          message: `Your order #${data.orderNumber} is ${this.getStatusLabel(data.status).toLowerCase()}!`,
          data: {
            orderId: data.orderId,
            orderNumber: data.orderNumber,
            status: data.status,
          },
        });
      } catch (pushError) {
        this.logger.warn(`⚠️ Push notification failed but continuing: ${pushError.message}`);
      }

      this.logger.log(`✅ Order status update notifications processed for order: ${data.orderNumber}`);
    } catch (error) {
      this.logger.error(`❌ Failed to handle order status updated event:`, error.message);
      throw error;
    }
  }

  /**
   * Handle order reviewed event
   */
  async handleOrderReviewed(data: any) {
    this.logger.log(`⭐ Order reviewed event received: ${data.orderId}`);

    try {
      // Notify restaurant about the review
      if (data.restaurantId) {
        await this.createNotification({
          userId: data.restaurantId,
          type: NotificationType.ORDER_UPDATE,
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
    } catch (error) {
      this.logger.error(`❌ Failed to handle order reviewed event:`, error.message);
    }
  }

  /**
   * Log notification to database
   */
  private async logNotification(data: {
    userId: string;
    type: NotificationType;
    channel: NotificationChannel;
    status: string;
    recipientEmail?: string;
    recipientPhone?: string;
    subject?: string;
    content: string;
    errorMessage?: string;
  }) {
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
    } catch (error) {
      this.logger.error(`❌ Failed to log notification:`, error.message);
    }
  }

  /**
   * Generate order confirmation email HTML
   */
  private generateOrderConfirmationEmail(data: any): string {
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
  private generateOrderStatusEmail(data: any): string {
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
  private getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
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
  private isImportantStatus(status: string): boolean {
    return ['CONFIRMED', 'READY', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'].includes(status);
  }

  /**
   * Get notifications for a user
   */
  async getNotifications(userId: string, isRead?: boolean) {
    try {
      const where: any = { userId };
      if (isRead !== undefined) {
        where.isRead = isRead;
      }

      const notifications = await this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 50,
      });

      return notifications;
    } catch (error) {
      this.logger.error(`❌ Failed to get notifications:`, error.message);
      throw error;
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string) {
    try {
      const notification = await this.prisma.notification.update({
        where: { id: notificationId },
        data: { isRead: true },
      });

      this.logger.log(`✅ Notification marked as read: ${notificationId}`);
      return notification;
    } catch (error) {
      this.logger.error(`❌ Failed to mark notification as read:`, error.message);
      throw error;
    }
  }
}

