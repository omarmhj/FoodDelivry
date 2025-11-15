import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { NotificationsService } from './notifications.service';

@Controller()
export class NotificationsController {
  private readonly logger = new Logger(NotificationsController.name);

  constructor(private readonly notificationsService: NotificationsService) {}

  /**
   * Listen to order.placed event
   */
  @EventPattern('order.placed')
  async handleOrderPlaced(@Payload() data: any) {
    this.logger.log(`📦 Received order.placed event`);
    this.logger.log(`📦 Event data: ${JSON.stringify(data, null, 2)}`);
    try {
      await this.notificationsService.handleOrderPlaced(data);
      this.logger.log(`✅ Successfully processed order.placed event`);
    } catch (error) {
      this.logger.error(`❌ Error handling order.placed event:`, error.message);
      this.logger.error(`❌ Error stack:`, error.stack);
    }
  }

  /**
   * Listen to order.status.updated event
   */
  @EventPattern('order.status.updated')
  async handleOrderStatusUpdated(@Payload() data: any) {
    this.logger.log(`🔄 Received order.status.updated event: ${JSON.stringify(data)}`);
    try {
      await this.notificationsService.handleOrderStatusUpdated(data);
    } catch (error) {
      this.logger.error(`❌ Error handling order.status.updated event:`, error.message);
    }
  }

  /**
   * Listen to order.reviewed event
   */
  @EventPattern('order.reviewed')
  async handleOrderReviewed(@Payload() data: any) {
    this.logger.log(`⭐ Received order.reviewed event: ${JSON.stringify(data)}`);
    try {
      await this.notificationsService.handleOrderReviewed(data);
    } catch (error) {
      this.logger.error(`❌ Error handling order.reviewed event:`, error.message);
    }
  }

  /**
   * Listen to order.cancelled event
   */
  @EventPattern('order.cancelled')
  async handleOrderCancelled(@Payload() data: any) {
    this.logger.log(`❌ Received order.cancelled event: ${JSON.stringify(data)}`);
    try {
      await this.notificationsService.handleOrderStatusUpdated({
        ...data,
        status: 'CANCELLED',
      });
    } catch (error) {
      this.logger.error(`❌ Error handling order.cancelled event:`, error.message);
    }
  }
}

