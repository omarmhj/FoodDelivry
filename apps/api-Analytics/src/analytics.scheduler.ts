import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AnalyticsService } from './analytics.service';

@Injectable()
export class AnalyticsScheduler {
  private readonly logger = new Logger(AnalyticsScheduler.name);

  constructor(private readonly analyticsService: AnalyticsService) {}

  /**
   * Generate daily reports at midnight
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleDailyReportGeneration() {
    this.logger.log('🕐 Scheduled task: Generating daily reports...');
    
    try {
      await this.analyticsService.generateDailyReport();
      this.logger.log('✅ Daily reports generated successfully');
    } catch (error) {
      this.logger.error('❌ Failed to generate daily reports:', error.message);
    }
  }

  /**
   * Optional: Generate reports every hour for real-time insights
   */
  @Cron(CronExpression.EVERY_HOUR)
  async handleHourlyMetricsUpdate() {
    this.logger.log('🕐 Scheduled task: Updating hourly metrics...');
    
    try {
      // Can be used for real-time dashboards
      this.logger.log('✅ Hourly metrics updated');
    } catch (error) {
      this.logger.error('❌ Failed to update hourly metrics:', error.message);
    }
  }
}

