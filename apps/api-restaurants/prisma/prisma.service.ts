import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '.prisma/restaurants-client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    await this.$connect();
    await this.ensureGeospatialIndex();
  }

  /**
   * `findRestaurantsNear` runs a `$geoNear` pipeline, which MongoDB only allows
   * against a 2dsphere index. Prisma cannot express that index type in the
   * schema, so `prisma db push` will happily drop it — this service owns the
   * Restaurant collection, so it recreates the index itself on every boot rather
   * than depending on another service having started first.
   */
  private async ensureGeospatialIndex() {
    try {
      await this.$runCommandRaw({
        createIndexes: 'Restaurant',
        indexes: [{ key: { coordinates: '2dsphere' }, name: 'coordinates_2dsphere' }],
      });
      this.logger.log('✅ Ensured 2dsphere index on Restaurant.coordinates');
    } catch (error: any) {
      this.logger.warn(`⚠️ Could not ensure 2dsphere index: ${error.message}`);
    }
  }
}
