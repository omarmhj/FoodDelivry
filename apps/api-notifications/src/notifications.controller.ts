import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
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
  async handleOrderPlaced(@Payload() data: any) {
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
@EventPattern('order.status.updated')
  async handleOrderStatusUpdated(@Payload() data: any) {
    this.logger.log(`🔄 Received order.status.updated event: ${data.orderNumber}`);
    
    this.notificationsService.handleOrderStatusUpdated(data)
      .catch(error => this.logger.error(`❌ Error handling order.status.updated:`, error.message));
    
    this.logger.log(`✅ Accepted order.status.updated event`);
  }

  /**
   * Listen to order.reviewed event
   */
@EventPattern('order.reviewed')
  async handleOrderReviewed(@Payload() data: any) {
    this.logger.log(`⭐ Received order.reviewed event`);
    
    this.notificationsService.handleOrderReviewed(data)
      .catch(error => this.logger.error(`❌ Error handling order.reviewed:`, error.message));
    
    this.logger.log(`✅ Accepted order.reviewed event`);
  }

/**
   * Listen to order.cancelled event
   */
@EventPattern('order.cancelled')
  async handleOrderCancelled(@Payload() data: any) {
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

  @EventPattern('reservation.created')
  async handleReservationCreated(@Payload() data: any) {
    this.logger.log(`📅 Received reservation.created event: ${data.reservationNumber}`);

    await this.notificationsService.handleReservationCreated(data)
      .catch(error => this.logger.error(`❌ Error handling reservation.created:`, error.message));
  }

  @EventPattern('reservation.confirmed')
  async handleReservationConfirmed(@Payload() data: any) {
    this.logger.log(`✅ Received reservation.confirmed event: ${data.reservationNumber}`);

    await this.notificationsService.handleReservationConfirmed(data)
      .catch(error => this.logger.error(`❌ Error handling reservation.confirmed:`, error.message));
  }

  @EventPattern('reservation.cancelled')
  async handleReservationCancelled(@Payload() data: any) {
    this.logger.log(`❌ Received reservation.cancelled event: ${data.reservationNumber}`);

    await this.notificationsService.handleReservationCancelled(data)
      .catch(error => this.logger.error(`❌ Error handling reservation.cancelled:`, error.message));
  }
}

