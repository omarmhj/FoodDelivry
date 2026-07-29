import { Controller, Logger } from '@nestjs/common';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';
import { AnalyticsService } from './analytics.service';

@Controller()
export class AnalyticsController {
  private readonly logger = new Logger(AnalyticsController.name);

  constructor(private readonly analyticsService: AnalyticsService) {
    this.logger.log('📊 AnalyticsController initialized');
    this.logger.log('📊 Listening for events: order.placed, order.status.updated, order.cancelled, order.reviewed');
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
    this.logger.log(`📦 Restaurant ID: ${data.restaurantId || 'N/A'}`);
    this.logger.log(`📦 Total: ${data.total || 0}`);
    
    try {
      await this.analyticsService.handleOrderPlaced(data);
      this.logger.log(`✅ Successfully processed order.placed event for: ${data.orderNumber}`);
      channel.ack(originalMsg);
    } catch (error) {
      this.logger.error(`❌ Error handling order.placed event:`, error.message);
      this.logger.error(`❌ Error stack:`, error.stack);
      // Acknowledge anyway to prevent queue blocking
      channel.ack(originalMsg);
    }
  }

  /**
   * Listen to order.status.updated event
   */
  @EventPattern('order.status.updated')
  async handleOrderStatusUpdated(@Payload() data: any, @Ctx() context: RmqContext) {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();
    const timestamp = new Date().toISOString();
    
    this.logger.log(`🔄 [${timestamp}] Received order.status.updated event`);
    this.logger.log(`🔄 Order Number: ${data.orderNumber || 'N/A'}`);
    this.logger.log(`🔄 Status: ${data.previousStatus} -> ${data.status}`);
    
    try {
      await this.analyticsService.handleOrderStatusUpdated(data);
      this.logger.log(`✅ Successfully processed order.status.updated event for: ${data.orderNumber}`);
      channel.ack(originalMsg);
    } catch (error) {
      this.logger.error(`❌ Error handling order.status.updated event:`, error.message);
      this.logger.error(`❌ Error stack:`, error.stack);
      channel.ack(originalMsg);
    }
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
      await this.analyticsService.handleOrderCancelled(data);
      this.logger.log(`✅ Successfully processed order.cancelled event for: ${data.orderNumber}`);
      channel.ack(originalMsg);
    } catch (error) {
      this.logger.error(`❌ Error handling order.cancelled event:`, error.message);
      this.logger.error(`❌ Error stack:`, error.stack);
      channel.ack(originalMsg);
    }
  }

  /**
   * Listen to order.reviewed event
   */
  @EventPattern('order.reviewed')
  async handleOrderReviewed(@Payload() data: any, @Ctx() context: RmqContext) {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();
    const timestamp = new Date().toISOString();
    
    this.logger.log(`⭐ [${timestamp}] Received order.reviewed event`);
    this.logger.log(`⭐ Order ID: ${data.orderId || 'N/A'}`);
    this.logger.log(`⭐ Rating: ${data.rating || 'N/A'}`);
    
    try {
      await this.analyticsService.handleOrderReviewed(data);
      this.logger.log(`✅ Successfully processed order.reviewed event for order: ${data.orderId}`);
      channel.ack(originalMsg);
    } catch (error) {
      this.logger.error(`❌ Error handling order.reviewed event:`, error.message);
      this.logger.error(`❌ Error stack:`, error.stack);
      channel.ack(originalMsg);
    }
  }

  // ==================== RESERVATION EVENTS ====================

  @EventPattern('reservation.created')
  async handleReservationCreated(@Payload() data: any, @Ctx() context: RmqContext) {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();
    this.logger.log(`📅 [${new Date().toISOString()}] Received reservation.created event: ${data.reservationNumber}`);
    try {
      this.logger.log(`✅ Acknowledged reservation.created for: ${data.reservationNumber}`);
      channel.ack(originalMsg);
    } catch (error) {
      this.logger.error(`❌ Error handling reservation.created:`, error.message);
      channel.ack(originalMsg);
    }
  }

  @EventPattern('reservation.confirmed')
  async handleReservationConfirmed(@Payload() data: any, @Ctx() context: RmqContext) {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();
    this.logger.log(`✅ [${new Date().toISOString()}] Received reservation.confirmed event: ${data.reservationNumber}`);
    channel.ack(originalMsg);
  }

  @EventPattern('reservation.status.updated')
  async handleReservationStatusUpdated(@Payload() data: any, @Ctx() context: RmqContext) {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();
    this.logger.log(`🔄 [${new Date().toISOString()}] Received reservation.status.updated: ${data.reservationNumber} (${data.previousStatus} → ${data.status})`);
    channel.ack(originalMsg);
  }

  @EventPattern('reservation.completed')
  async handleReservationCompleted(@Payload() data: any, @Ctx() context: RmqContext) {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();
    this.logger.log(`🏁 [${new Date().toISOString()}] Received reservation.completed: ${data.reservationNumber}`);
    channel.ack(originalMsg);
  }

  @EventPattern('reservation.cancelled')
  async handleReservationCancelled(@Payload() data: any, @Ctx() context: RmqContext) {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();
    this.logger.log(`❌ [${new Date().toISOString()}] Received reservation.cancelled: ${data.reservationNumber}`);
    channel.ack(originalMsg);
  }

  @EventPattern('reservation.no_show')
  async handleReservationNoShow(@Payload() data: any, @Ctx() context: RmqContext) {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();
    this.logger.log(`👻 [${new Date().toISOString()}] Received reservation.no_show: ${data.reservationNumber}`);
    channel.ack(originalMsg);
  }

  // ==================== CHAT EVENTS ====================

  @EventPattern('message.sent')
  async handleMessageSent(@Payload() data: any, @Ctx() context: RmqContext) {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();
    this.logger.log(`💬 [${new Date().toISOString()}] Received message.sent: conversation ${data.conversationId}`);
    channel.ack(originalMsg);
  }
}
