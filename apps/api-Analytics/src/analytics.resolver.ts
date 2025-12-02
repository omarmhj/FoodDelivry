import { Resolver, Query, Args } from '@nestjs/graphql';
import { Logger } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { Analytics, DailyReport, PopularItem } from './entities/analytics.entities';
import { GetAnalyticsDto, GetDailyReportDto, GetPopularItemsDto, AnalyticsType } from './dto/analytics.dto';

@Resolver(() => Analytics)
export class AnalyticsResolver {
  private readonly logger = new Logger(AnalyticsResolver.name);

  constructor(private readonly analyticsService: AnalyticsService) {}

  @Query(() => [Analytics], { name: 'getAnalytics' })
  async getAnalytics(
    @Args('restaurantId', { type: () => String, nullable: true }) restaurantId: string | undefined,
    @Args('metricType', { type: () => AnalyticsType }) metricType: AnalyticsType,
    @Args('startDate', { type: () => String }) startDate: string,
    @Args('endDate', { type: () => String }) endDate: string,
  ): Promise<Analytics[]> {
    this.logger.log(`📊 Getting analytics: ${metricType} for restaurant: ${restaurantId || 'all'}`);
    
    try {
      return await this.analyticsService.getAnalytics(
        restaurantId,
        metricType,
        new Date(startDate),
        new Date(endDate),
      );
    } catch (error) {
      this.logger.error(`❌ Failed to get analytics:`, error.message);
      throw error;
    }
  }

  @Query(() => DailyReport, { name: 'getDailyReport', nullable: true })
  async getDailyReport(
    @Args('restaurantId', { type: () => String, nullable: true }) restaurantId: string | undefined,
    @Args('date', { type: () => String }) date: string,
  ): Promise<DailyReport | null> {
    this.logger.log(`📊 Getting daily report for: ${restaurantId || 'all'} on ${date}`);
    
    try {
      return await this.analyticsService.getDailyReport(restaurantId, new Date(date));
    } catch (error) {
      this.logger.error(`❌ Failed to get daily report:`, error.message);
      throw error;
    }
  }

  @Query(() => [PopularItem], { name: 'getPopularItems' })
  async getPopularItems(
    @Args('restaurantId', { type: () => String }) restaurantId: string,
    @Args('startDate', { type: () => String }) startDate: string,
    @Args('endDate', { type: () => String }) endDate: string,
    @Args('limit', { type: () => Number, nullable: true, defaultValue: 10 }) limit: number,
  ): Promise<PopularItem[]> {
    this.logger.log(`📊 Getting popular items for restaurant: ${restaurantId}`);
    
    try {
      return await this.analyticsService.getPopularItems(
        restaurantId,
        new Date(startDate),
        new Date(endDate),
        limit,
      );
    } catch (error) {
      this.logger.error(`❌ Failed to get popular items:`, error.message);
      throw error;
    }
  }
}

