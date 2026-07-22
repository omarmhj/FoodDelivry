import { Controller, Logger } from '@nestjs/common';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';
import { NotificationsService } from './notifications.service';

@Controller()
export class NotificationsController {
  private readonly logger = new Logger(NotificationsController.name);

  constructor(private readonly notificationsService: NotificationsService) {
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
  @EventPattern('order.placed')
  async handleOrderPlaced(@Payload() data: any, @Ctx() context: RmqContext) {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();
    const timestamp = new Date().toISOString();
    
    this.logger.log(`📦 [${timestamp}] Received order.placed event`);
    this.logger.log(`📦 Order Number: ${data.orderNumber || 'N/A'}`);
    this.logger.log(`📦 Order ID: ${data.orderId || 'N/A'}`);
    
    try {
      await this.notificationsService.handleOrderPlaced(data);
      this.logger.log(`✅ Processed order.placed event for order: ${data.orderNumber}`);
    } catch (error) {
      this.logger.error(`❌ Error handling order.placed:`, error.message);
    }
    channel.ack(originalMsg);
  }

  /**
   * Listen to order.status.updated event
   */
  @EventPattern('order.status.updated')
  async handleOrderStatusUpdated(@Payload() data: any, @Ctx() context: RmqContext) {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();
    
    this.logger.log(`🔄 Received order.status.updated event: ${data.orderNumber}`);
    
    try {
      await this.notificationsService.handleOrderStatusUpdated(data);
      this.logger.log(`✅ Processed order.status.updated event`);
    } catch (error) {
      this.logger.error(`❌ Error handling order.status.updated:`, error.message);
    }
    channel.ack(originalMsg);
  }

  /**
   * Listen to order.reviewed event
   */
  @EventPattern('order.reviewed')
  async handleOrderReviewed(@Payload() data: any, @Ctx() context: RmqContext) {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();
    
    this.logger.log(`⭐ Received order.reviewed event`);
    
    try {
      await this.notificationsService.handleOrderReviewed(data);
      this.logger.log(`✅ Processed order.reviewed event`);
    } catch (error) {
      this.logger.error(`❌ Error handling order.reviewed:`, error.message);
    }
    channel.ack(originalMsg);
  }

  /**
   * Listen to order.cancelled event
   */
  @EventPattern('order.cancelled')
  async handleOrderCancelled(@Payload() data: any, @Ctx() context: RmqContext) {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();
    const timestamp = new Date().toISOString();
    
    this.logger.log(`❌ [${timestamp}] Received order.cancelled event`);
    this.logger.log(`❌ Order Number: ${data.orderNumber || 'N/A'}`);
    
    try {
      await this.notificationsService.handleOrderStatusUpdated({
        ...data,
        status: 'CANCELLED',
        customerEmail: data.metadata?.customerEmail,
      });
      this.logger.log(`✅ Processed order.cancelled event for order: ${data.orderNumber}`);
    } catch (error) {
      this.logger.error(`❌ Error handling order.cancelled:`, error.message);
    }
    channel.ack(originalMsg);
  }

  // ==================== RESERVATION EVENTS ====================

  @EventPattern('reservation.created')
  async handleReservationCreated(@Payload() data: any, @Ctx() context: RmqContext) {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();
    
    this.logger.log(`📅 Received reservation.created event: ${data.reservationNumber}`);

    try {
      await this.notificationsService.handleReservationCreated(data);
      this.logger.log(`✅ Processed reservation.created event`);
    } catch (error) {
      this.logger.error(`❌ Error handling reservation.created:`, error.message);
    }
    channel.ack(originalMsg);
  }

  @EventPattern('reservation.confirmed')
  async handleReservationConfirmed(@Payload() data: any, @Ctx() context: RmqContext) {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();
    
    this.logger.log(`✅ Received reservation.confirmed event: ${data.reservationNumber}`);

    try {
      await this.notificationsService.handleReservationConfirmed(data);
      this.logger.log(`✅ Processed reservation.confirmed event`);
    } catch (error) {
      this.logger.error(`❌ Error handling reservation.confirmed:`, error.message);
    }
    channel.ack(originalMsg);
  }

  @EventPattern('reservation.cancelled')
  async handleReservationCancelled(@Payload() data: any, @Ctx() context: RmqContext) {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();
    
    this.logger.log(`❌ Received reservation.cancelled event: ${data.reservationNumber}`);

    try {
      await this.notificationsService.handleReservationCancelled(data);
      this.logger.log(`✅ Processed reservation.cancelled event`);
    } catch (error) {
      this.logger.error(`❌ Error handling reservation.cancelled:`, error.message);
    }
    channel.ack(originalMsg);
  }

  @EventPattern('reservation.status.updated')
  async handleReservationStatusUpdated(@Payload() data: any, @Ctx() context: RmqContext) {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();
    
    this.logger.log(`🔄 Received reservation.status.updated event: ${data.reservationNumber} (${data.previousStatus} → ${data.status})`);

    try {
      await this.notificationsService.handleReservationStatusUpdated(data);
      this.logger.log(`✅ Processed reservation.status.updated event`);
    } catch (error) {
      this.logger.error(`❌ Error handling reservation.status.updated:`, error.message);
    }
    channel.ack(originalMsg);
  }

  @EventPattern('reservation.completed')
  async handleReservationCompleted(@Payload() data: any, @Ctx() context: RmqContext) {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();
    
    this.logger.log(`🏁 Received reservation.completed event: ${data.reservationNumber}`);

    try {
      await this.notificationsService.handleReservationStatusUpdated(data);
      this.logger.log(`✅ Processed reservation.completed event`);
    } catch (error) {
      this.logger.error(`❌ Error handling reservation.completed:`, error.message);
    }
    channel.ack(originalMsg);
  }

  @EventPattern('reservation.no_show')
  async handleReservationNoShow(@Payload() data: any, @Ctx() context: RmqContext) {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();
    
    this.logger.log(`👻 Received reservation.no_show event: ${data.reservationNumber}`);

    try {
      await this.notificationsService.handleReservationStatusUpdated(data);
      this.logger.log(`✅ Processed reservation.no_show event`);
    } catch (error) {
      this.logger.error(`❌ Error handling reservation.no_show:`, error.message);
    }
    channel.ack(originalMsg);
  }
}
