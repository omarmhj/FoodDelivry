import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../../../libs/shared/src/redis.service';
import { AnalyticsType } from './dto/analytics.dto';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
  ) {}

  /**
   * Handle order.placed event
   */
  async handleOrderPlaced(data: any) {
    this.logger.log(`📊 Processing order.placed event: ${data.orderNumber}`);

    try {
      const orderDate = new Date(data.timestamp || Date.now());
      const hour = orderDate.getHours();
      const dayOfWeek = orderDate.getDay();

      // Create revenue metric
      await this.prisma.revenueMetric.create({
        data: {
          restaurantId: data.restaurantId,
          orderId: data.orderId,
          orderNumber: data.orderNumber,
          amount: data.total,
          date: orderDate,
          hour,
          dayOfWeek,
          metadata: {
            customerId: data.customerId,
            items: data.items,
          },
        },
      });

      // Update popular items
      if (data.items && Array.isArray(data.items)) {
        for (const item of data.items) {
          await this.updatePopularItem(
            data.restaurantId,
            item.menuItemId,
            item.menuItemName,
            item.quantity,
            item.unitPrice * item.quantity,
            orderDate,
          );
        }
      }

      // Update daily analytics
      await this.updateDailyAnalytics(data.restaurantId, orderDate, data.total);

      // Track order volume metric
      await this.trackMetric(data.restaurantId, AnalyticsType.ORDER_VOLUME, 1, orderDate);

      // Invalidate cached analytics
      await this.invalidateAnalyticsCache(data.restaurantId);

      this.logger.log(`✅ Analytics updated for order: ${data.orderNumber}`);
    } catch (error) {
      this.logger.error(`❌ Failed to process order analytics:`, error.message);
      throw error;
    }
  }

  /**
   * Handle order.status.updated event
   */
  async handleOrderStatusUpdated(data: any) {
    this.logger.log(`📊 Processing order.status.updated event: ${data.orderNumber}`);

    try {
      const eventDate = new Date(data.timestamp || Date.now());

      // Track status transition metrics
      await this.trackMetric(
        data.restaurantId,
        AnalyticsType.ORDER_VOLUME,
        0, // No new order, just status change
        eventDate,
        {
          orderId: data.orderId,
          orderNumber: data.orderNumber,
          previousStatus: data.previousStatus,
          newStatus: data.status,
          transitionType: `${data.previousStatus}_TO_${data.status}`,
        },
      );

      // Track delivery completion
      if (data.status === 'DELIVERED') {
        this.logger.log(`📊 Order delivered: ${data.orderNumber}`);
        await this.trackMetric(
          data.restaurantId,
          AnalyticsType.CUSTOMER_TRAFFIC,
          1,
          eventDate,
          { type: 'completed_delivery', orderId: data.orderId },
        );
      }

      // Track peak hours when order is confirmed (actual kitchen activity)
      if (data.status === 'CONFIRMED' || data.status === 'PREPARING') {
        const hour = eventDate.getHours();
        await this.trackMetric(
          data.restaurantId,
          AnalyticsType.PEAK_HOURS,
          1,
          eventDate,
          { hour, status: data.status },
        );
      }

      this.logger.log(`✅ Status update analytics recorded for: ${data.orderNumber}`);
    } catch (error) {
      this.logger.error(`❌ Failed to process status update analytics:`, error.message);
      throw error;
    }
  }

  /**
   * Handle order.cancelled event
   */
  async handleOrderCancelled(data: any) {
    this.logger.log(`📊 Processing order.cancelled event: ${data.orderNumber}`);

    try {
      const eventDate = new Date(data.timestamp || Date.now());

      // Track cancellation metric
      await this.trackMetric(
        data.restaurantId,
        AnalyticsType.ORDER_VOLUME,
        -1, // Negative to indicate cancellation
        eventDate,
        {
          orderId: data.orderId,
          orderNumber: data.orderNumber,
          previousStatus: data.previousStatus,
          cancellationType: 'customer_cancelled',
        },
      );

      // Update daily report to reflect cancellation
      await this.updateDailyAnalyticsForCancellation(data.restaurantId, eventDate, data.total || 0);

      // Invalidate cache
      await this.invalidateAnalyticsCache(data.restaurantId);

      this.logger.log(`✅ Cancellation analytics recorded for: ${data.orderNumber}`);
    } catch (error) {
      this.logger.error(`❌ Failed to process cancellation analytics:`, error.message);
      throw error;
    }
  }

  /**
   * Handle order.reviewed event
   */
  async handleOrderReviewed(data: any) {
    this.logger.log(`📊 Processing order.reviewed event for order: ${data.orderId}`);

    try {
      const eventDate = new Date(data.timestamp || Date.now());

      // Track review metric
      await this.trackMetric(
        data.restaurantId,
        AnalyticsType.CUSTOMER_RETENTION,
        data.rating || 0,
        eventDate,
        {
          orderId: data.orderId,
          reviewId: data.reviewId,
          rating: data.rating,
          comment: data.comment,
          foodQuality: data.foodQuality,
          deliverySpeed: data.deliverySpeed,
          customerService: data.customerService,
        },
      );

      // Invalidate cache
      if (data.restaurantId) {
        await this.invalidateAnalyticsCache(data.restaurantId);
      }

      this.logger.log(`✅ Review analytics recorded for order: ${data.orderId}`);
    } catch (error) {
      this.logger.error(`❌ Failed to process review analytics:`, error.message);
      throw error;
    }
  }

  /**
   * Track a metric in the Analytics collection
   */
  private async trackMetric(
    restaurantId: string,
    metricType: AnalyticsType,
    value: number,
    date: Date,
    metadata?: Record<string, any>,
  ) {
    try {
      await this.prisma.analytics.create({
        data: {
          restaurantId,
          metricType,
          value,
          date,
          metadata,
        },
      });
    } catch (error) {
      this.logger.error(`❌ Failed to track metric ${metricType}:`, error.message);
    }
  }

  /**
   * Update daily analytics for cancellation
   */
  private async updateDailyAnalyticsForCancellation(
    restaurantId: string,
    date: Date,
    cancelledAmount: number,
  ) {
    const dateKey = new Date(date);
    dateKey.setHours(0, 0, 0, 0);

    try {
      const existingReport = await this.prisma.dailyReport.findUnique({
        where: {
          restaurantId_date: {
            restaurantId: restaurantId || 'global',
            date: dateKey,
          },
        },
      });

      if (existingReport && existingReport.totalOrders > 0) {
        const newTotalOrders = Math.max(0, existingReport.totalOrders - 1);
        const newTotalRevenue = Math.max(0, existingReport.totalRevenue - cancelledAmount);
        const newAvgOrderValue = newTotalOrders > 0 ? newTotalRevenue / newTotalOrders : 0;

        await this.prisma.dailyReport.update({
          where: { id: existingReport.id },
          data: {
            totalOrders: newTotalOrders,
            totalRevenue: newTotalRevenue,
            averageOrderValue: newAvgOrderValue,
          },
        });
      }
    } catch (error) {
      this.logger.error(`❌ Failed to update daily analytics for cancellation:`, error.message);
    }
  }

  /**
   * Update popular items
   */
  private async updatePopularItem(
    restaurantId: string,
    menuItemId: string,
    menuItemName: string,
    quantity: number,
    revenue: number,
    date: Date,
  ) {
    const dateKey = new Date(date);
    dateKey.setHours(0, 0, 0, 0);

    try {
      const existingItem = await this.prisma.popularItem.findUnique({
        where: {
          restaurantId_menuItemId_date: {
            restaurantId,
            menuItemId,
            date: dateKey,
          },
        },
      });

      if (existingItem) {
        await this.prisma.popularItem.update({
          where: { id: existingItem.id },
          data: {
            orderCount: existingItem.orderCount + quantity,
            totalRevenue: existingItem.totalRevenue + revenue,
          },
        });
      } else {
        await this.prisma.popularItem.create({
          data: {
            restaurantId,
            menuItemId,
            menuItemName,
            orderCount: quantity,
            totalRevenue: revenue,
            date: dateKey,
          },
        });
      }
    } catch (error) {
      this.logger.error(`❌ Failed to update popular item:`, error.message);
    }
  }

  /**
   * Update daily analytics
   */
  private async updateDailyAnalytics(
    restaurantId: string,
    date: Date,
    orderTotal: number,
  ) {
    const dateKey = new Date(date);
    dateKey.setHours(0, 0, 0, 0);

    try {
      const existingReport = await this.prisma.dailyReport.findUnique({
        where: {
          restaurantId_date: {
            restaurantId: restaurantId || 'global',
            date: dateKey,
          },
        },
      });

      if (existingReport) {
        const newTotalOrders = existingReport.totalOrders + 1;
        const newTotalRevenue = existingReport.totalRevenue + orderTotal;

        await this.prisma.dailyReport.update({
          where: { id: existingReport.id },
          data: {
            totalOrders: newTotalOrders,
            totalRevenue: newTotalRevenue,
            averageOrderValue: newTotalRevenue / newTotalOrders,
          },
        });
      } else {
        await this.prisma.dailyReport.create({
          data: {
            restaurantId: restaurantId || 'global',
            date: dateKey,
            totalOrders: 1,
            totalRevenue: orderTotal,
            averageOrderValue: orderTotal,
            customerCount: 1,
          },
        });
      }
    } catch (error) {
      this.logger.error(`❌ Failed to update daily analytics:`, error.message);
    }
  }

  /**
   * Get analytics data with caching
   */
  async getAnalytics(
    restaurantId: string | undefined,
    metricType: AnalyticsType,
    startDate: Date,
    endDate: Date,
  ) {
    const cacheKey = `analytics:${restaurantId || 'global'}:${metricType}:${startDate.toISOString()}:${endDate.toISOString()}`;

    try {
      // Check cache
      const cached = await this.redisService.get(cacheKey);
      if (cached) {
        this.logger.log(`🎯 Cache hit for analytics: ${cacheKey}`);
        return JSON.parse(cached);
      }

      // Fetch from database
      const analytics = await this.prisma.analytics.findMany({
        where: {
          restaurantId: restaurantId || undefined,
          metricType: metricType as any,
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
        orderBy: {
          date: 'asc',
        },
      });

      // Cache results for 5 minutes
      await this.redisService.set(cacheKey, JSON.stringify(analytics), 300);

      return analytics;
    } catch (error) {
      this.logger.error(`❌ Failed to get analytics:`, error.message);
      throw error;
    }
  }

  /**
   * Get daily report
   */
  async getDailyReport(restaurantId: string | undefined, date: Date) {
    const cacheKey = `daily-report:${restaurantId || 'global'}:${date.toISOString()}`;

    try {
      // Check cache
      const cached = await this.redisService.get(cacheKey);
      if (cached) {
        this.logger.log(`🎯 Cache hit for daily report: ${cacheKey}`);
        return JSON.parse(cached);
      }

      // Fetch from database
      const report = await this.prisma.dailyReport.findUnique({
        where: {
          restaurantId_date: {
            restaurantId: restaurantId || 'global',
            date: new Date(date.setHours(0, 0, 0, 0)),
          },
        },
      });

      if (report) {
        // Cache for 1 hour
        await this.redisService.set(cacheKey, JSON.stringify(report), 3600);
      }

      return report;
    } catch (error) {
      this.logger.error(`❌ Failed to get daily report:`, error.message);
      throw error;
    }
  }

  /**
   * Get popular items
   */
  async getPopularItems(
    restaurantId: string,
    startDate: Date,
    endDate: Date,
    limit: number = 10,
  ) {
    const cacheKey = `popular-items:${restaurantId}:${startDate.toISOString()}:${endDate.toISOString()}:${limit}`;

    try {
      // Check cache
      const cached = await this.redisService.get(cacheKey);
      if (cached) {
        this.logger.log(`🎯 Cache hit for popular items: ${cacheKey}`);
        return JSON.parse(cached);
      }

      // Fetch from database
      const items = await this.prisma.popularItem.findMany({
        where: {
          restaurantId,
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
        orderBy: {
          orderCount: 'desc',
        },
        take: limit,
      });

      // Cache for 10 minutes
      await this.redisService.set(cacheKey, JSON.stringify(items), 600);

      return items;
    } catch (error) {
      this.logger.error(`❌ Failed to get popular items:`, error.message);
      throw error;
    }
  }

  /**
   * Generate daily report (scheduled task)
   */
  async generateDailyReport() {
    this.logger.log('📊 Generating daily reports...');

    try {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);

      // Get all unique restaurants from revenue metrics
      const restaurants = await this.prisma.revenueMetric.findMany({
        where: {
          date: {
            gte: yesterday,
            lt: new Date(yesterday.getTime() + 24 * 60 * 60 * 1000),
          },
        },
        select: {
          restaurantId: true,
        },
        distinct: ['restaurantId'],
      });

      for (const restaurant of restaurants) {
        if (restaurant.restaurantId) {
          await this.updateDailyReport(restaurant.restaurantId, yesterday);
        }
      }

      // Generate global report
      await this.updateDailyReport(null, yesterday);

      this.logger.log(`✅ Daily reports generated for ${restaurants.length} restaurants`);
    } catch (error) {
      this.logger.error(`❌ Failed to generate daily reports:`, error.message);
    }
  }

  /**
   * Update daily report
   */
  private async updateDailyReport(restaurantId: string | null, date: Date) {
    try {
      const startOfDay = new Date(date.setHours(0, 0, 0, 0));
      const endOfDay = new Date(date.setHours(23, 59, 59, 999));

      // Get metrics for the day
      const metrics = await this.prisma.revenueMetric.findMany({
        where: {
          restaurantId: restaurantId || undefined,
          date: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
      });

      if (metrics.length === 0) {
        return;
      }

      const totalRevenue = metrics.reduce((sum, m) => sum + m.amount, 0);
      const totalOrders = metrics.length;
      const averageOrderValue = totalRevenue / totalOrders;

      // Get popular items
      const popularItems = await this.prisma.popularItem.findMany({
        where: {
          restaurantId: restaurantId || undefined,
          date: startOfDay,
        },
        orderBy: {
          orderCount: 'desc',
        },
        take: 5,
      });

      // Upsert daily report
      await this.prisma.dailyReport.upsert({
        where: {
          restaurantId_date: {
            restaurantId: restaurantId || 'global',
            date: startOfDay,
          },
        },
        update: {
          totalOrders,
          totalRevenue,
          averageOrderValue,
          popularItems: popularItems,
        },
        create: {
          restaurantId: restaurantId || 'global',
          date: startOfDay,
          totalOrders,
          totalRevenue,
          averageOrderValue,
          popularItems: popularItems,
          customerCount: totalOrders, // Simplified
        },
      });
    } catch (error) {
      this.logger.error(`❌ Failed to update daily report:`, error.message);
    }
  }

  /**
   * Invalidate analytics cache
   */
  private async invalidateAnalyticsCache(restaurantId: string) {
    try {
      const patterns = [
        `analytics:${restaurantId}:*`,
        `daily-report:${restaurantId}:*`,
        `popular-items:${restaurantId}:*`,
        `analytics:global:*`,
        `daily-report:global:*`,
      ];

      for (const pattern of patterns) {
        const keys = await this.redisService.keys(pattern);
        for (const key of keys) {
          await this.redisService.del(key);
        }
      }

      this.logger.log(`🗑️ Invalidated analytics cache for restaurant: ${restaurantId}`);
    } catch (error) {
      this.logger.error(`❌ Failed to invalidate cache:`, error.message);
    }
  }
}

