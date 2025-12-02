import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { AnalyticsService } from './analytics.service';

@Controller()
export class AnalyticsController {
  private readonly logger = new Logger(AnalyticsController.name);

  constructor(private readonly analyticsService: AnalyticsService) {
    this.logger.log('📊 AnalyticsController initialized');
    this.logger.log('📊 Listening for events: order.placed, order.status.updated, order.cancelled');
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
    this.logger.log(`📦 Restaurant ID: ${data.restaurantId || 'N/A'}`);
    this.logger.log(`📦 Total: $${data.total || 0}`);
    
    try {
      await this.analyticsService.handleOrderPlaced(data);
      this.logger.log(`✅ Successfully processed order.placed event for: ${data.orderNumber}`);
    } catch (error) {
      this.logger.error(`❌ Error handling order.placed event:`, error.message);
      this.logger.error(`❌ Error stack:`, error.stack);
    }
  }

  /**
   * Listen to order.status.updated event (optional for additional analytics)
   */
  @EventPattern('order.status.updated')
  async handleOrderStatusUpdated(@Payload() data: any) {
    const timestamp = new Date().toISOString();
    this.logger.log(`🔄 [${timestamp}] Received order.status.updated event`);
    this.logger.log(`🔄 Order Number: ${data.orderNumber || 'N/A'}`);
    this.logger.log(`🔄 Status: ${data.previousStatus} -> ${data.status}`);
    
    try {
      // Can be used for tracking order lifecycle metrics
      this.logger.log(`✅ Logged order status update for analytics`);
    } catch (error) {
      this.logger.error(`❌ Error handling order.status.updated event:`, error.message);
    }
  }

  /**
   * Listen to order.cancelled event
   */
  @EventPattern('order.cancelled')
  async handleOrderCancelled(@Payload() data: any) {
    const timestamp = new Date().toISOString();
    this.logger.log(`❌ [${timestamp}] Received order.cancelled event`);
    this.logger.log(`❌ Order Number: ${data.orderNumber || 'N/A'}`);
    
    try {
      // Can be used for cancellation rate analytics
      this.logger.log(`✅ Logged order cancellation for analytics`);
    } catch (error) {
      this.logger.error(`❌ Error handling order.cancelled event:`, error.message);
    }
  }
}

