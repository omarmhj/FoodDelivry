import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '.prisma/orders-client';

/**
 * Read-only client for the Orders database. Used by the recommendation engine
 * to derive suggestions from a customer's order history. The search service
 * never writes to this database — api-orders owns it.
 */
@Injectable()
export class OrdersPrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(OrdersPrismaService.name);

  constructor() {
    super({
      datasources: {
        db: {
          url: process.env.ORDERS_DATABASE_URL,
        },
      },
    });
  }

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('✅ Connected to Orders database (recommendations read model)');
    } catch (error) {
      this.logger.error('❌ Failed to connect to Orders database (Search):', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('🔌 Orders read model disconnected');
  }
}
