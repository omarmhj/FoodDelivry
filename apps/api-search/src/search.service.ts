import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OrdersPrismaService } from '../prisma/orders-prisma.service';
import { RedisService } from '../../../libs/shared/src/redis.service';
import {
  SearchRestaurantsDto,
  SearchMenuItemsDto,
  NearbyRestaurantsDto,
} from './dto/search.dto';

// Cache TTLs (seconds)
const SEARCH_TTL = 300; // 5 minutes
const NEARBY_TTL = 120; // 2 minutes
const RECOMMEND_TTL = 600; // 10 minutes

@Injectable()
export class SearchService implements OnModuleInit {
  private readonly logger = new Logger(SearchService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly ordersPrisma: OrdersPrismaService,
    private readonly redis: RedisService,
  ) {}

  /**
   * Ensure the geospatial index exists so $geoNear works. MongoDB requires a
   * 2dsphere index on the coordinates field for proximity queries.
   */
  async onModuleInit() {
    try {
      await this.prisma.$runCommandRaw({
        createIndexes: 'Restaurant',
        indexes: [
          {
            key: { coordinates: '2dsphere' },
            name: 'coordinates_2dsphere',
          },
        ],
      });
      this.logger.log('✅ Ensured 2dsphere index on Restaurant.coordinates');
    } catch (error: any) {
      this.logger.warn(`⚠️ Could not create 2dsphere index: ${error.message}`);
    }
  }

  // ==================== RESTAURANT SEARCH ====================

  async searchRestaurants(dto: SearchRestaurantsDto) {
    const limit = dto.limit ?? 20;
    const skip = dto.skip ?? 0;
    const cacheKey = `search:restaurants:${dto.query.toLowerCase()}:${dto.city?.toLowerCase() || 'any'}:${limit}:${skip}`;

    const cached = await this.safeGetJson(cacheKey);
    if (cached) {
      return { ...cached, cached: true };
    }

    const where: any = {
      OR: [
        { name: { contains: dto.query, mode: 'insensitive' } },
        { city: { contains: dto.query, mode: 'insensitive' } },
        { address: { contains: dto.query, mode: 'insensitive' } },
        { country: { contains: dto.query, mode: 'insensitive' } },
      ],
    };
    if (dto.city) {
      where.city = { contains: dto.city, mode: 'insensitive' };
    }

    const [restaurants, total] = await Promise.all([
      this.prisma.restaurant.findMany({ where, take: limit, skip }),
      this.prisma.restaurant.count({ where }),
    ]);

    const payload = {
      results: restaurants.map((r) => this.mapRestaurant(r)),
      total,
    };

    await this.safeSet(cacheKey, payload, SEARCH_TTL);
    return { ...payload, cached: false };
  }

  // ==================== MENU ITEM SEARCH ====================

  async searchMenuItems(dto: SearchMenuItemsDto) {
    const limit = dto.limit ?? 20;
    const skip = dto.skip ?? 0;
    const cacheKey = `search:menuitems:${dto.query.toLowerCase()}:${dto.maxPrice ?? 'any'}:${limit}:${skip}`;

    const cached = await this.safeGetJson(cacheKey);
    if (cached) {
      return { ...cached, cached: true };
    }

    const where: any = {
      OR: [
        { name: { contains: dto.query, mode: 'insensitive' } },
        { description: { contains: dto.query, mode: 'insensitive' } },
      ],
      available: true,
    };
    if (dto.maxPrice != null) {
      where.price = { lte: dto.maxPrice };
    }

    const [items, total] = await Promise.all([
      this.prisma.menuItem.findMany({ where, take: limit, skip }),
      this.prisma.menuItem.count({ where }),
    ]);

    // Attach restaurant names (one lookup for all unique restaurant ids)
    const restaurantIds = [...new Set(items.map((i) => i.restaurantId))];
    const restaurants = await this.prisma.restaurant.findMany({
      where: { id: { in: restaurantIds } },
    });
    const nameById = new Map(restaurants.map((r) => [r.id, r.name]));

    const payload = {
      results: items.map((i) => ({
        id: i.id,
        name: i.name,
        description: i.description,
        price: i.price,
        available: i.available,
        restaurantId: i.restaurantId,
        restaurantName: nameById.get(i.restaurantId) || undefined,
      })),
      total,
    };

    await this.safeSet(cacheKey, payload, SEARCH_TTL);
    return { ...payload, cached: false };
  }

  // ==================== GEOSPATIAL: NEARBY RESTAURANTS ====================

  async findNearby(dto: NearbyRestaurantsDto) {
    const limit = dto.limit ?? 20;
    const maxDistanceKm = dto.maxDistanceKm ?? 10;
    const maxDistanceMeters = maxDistanceKm * 1000;
    const cacheKey = `search:nearby:${dto.longitude.toFixed(4)}:${dto.latitude.toFixed(4)}:${maxDistanceKm}:${limit}`;

    const cached = await this.safeGetJson(cacheKey);
    if (cached) {
      return { ...cached, cached: true };
    }

    const raw: any = await this.prisma.restaurant.aggregateRaw({
      pipeline: [
        {
          $geoNear: {
            near: { type: 'Point', coordinates: [dto.longitude, dto.latitude] },
            distanceField: 'distance',
            maxDistance: maxDistanceMeters,
            spherical: true,
          },
        },
        { $limit: limit },
      ],
    });

    const docs: any[] = Array.isArray(raw) ? raw : [];
    const results = docs.map((doc) => {
      const coords = doc.coordinates?.coordinates || [];
      return {
        id: this.extractId(doc._id),
        name: doc.name,
        country: doc.country,
        city: doc.city,
        address: doc.address,
        email: doc.email,
        longitude: coords[0],
        latitude: coords[1],
        distanceKm: doc.distance != null ? Number((doc.distance / 1000).toFixed(2)) : undefined,
      };
    });

    const payload = { results, total: results.length };
    await this.safeSet(cacheKey, payload, NEARBY_TTL);
    return { ...payload, cached: false };
  }

  // ==================== RECOMMENDATIONS ====================

  async getRecommendations(customerId: string, limit = 10) {
    const cacheKey = `search:recommendations:${customerId}:${limit}`;
    const cached = await this.safeGetJson(cacheKey);
    if (cached) {
      return { ...cached, cached: true };
    }

    // Derive the customer's most-ordered restaurants from order history
    const orders = await this.ordersPrisma.order.findMany({
      where: { customerId },
      select: { restaurantId: true },
    });

    // Rank restaurant ids by how often the customer ordered from them
    const frequency = new Map<string, number>();
    for (const o of orders) {
      frequency.set(o.restaurantId, (frequency.get(o.restaurantId) || 0) + 1);
    }
    const rankedIds = [...frequency.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([id]) => id);

    // Fetch the actual restaurant docs and preserve the frequency ranking
    const reorderRestaurants = await this.prisma.restaurant.findMany({
      where: { id: { in: rankedIds } },
    });
    const reorderById = new Map(reorderRestaurants.map((r) => [r.id, r]));
    const reorder = rankedIds
      .map((id) => reorderById.get(id))
      .filter(Boolean)
      .slice(0, limit)
      .map((r) => this.mapRestaurant(r));

    // Discover: restaurants the customer hasn't ordered from yet
    const discoverRestaurants = await this.prisma.restaurant.findMany({
      where: rankedIds.length ? { id: { notIn: rankedIds } } : {},
      take: limit,
    });
    const discover = discoverRestaurants.map((r) => this.mapRestaurant(r));

    const payload = { reorder, discover };
    await this.safeSet(cacheKey, payload, RECOMMEND_TTL);
    return { ...payload, cached: false };
  }

  // ==================== HELPERS ====================

  private mapRestaurant(r: any) {
    const coords = r.coordinates?.coordinates || [];
    return {
      id: r.id,
      name: r.name,
      country: r.country,
      city: r.city,
      address: r.address,
      email: r.email,
      longitude: coords[0],
      latitude: coords[1],
    };
  }

  /** aggregateRaw returns _id as { $oid: "..." } (extended JSON) */
  private extractId(id: any): string {
    if (!id) return '';
    if (typeof id === 'string') return id;
    if (id.$oid) return id.$oid;
    return String(id);
  }

  private async safeGetJson(key: string): Promise<any | null> {
    try {
      return await this.redis.getJson(key);
    } catch (error: any) {
      this.logger.warn(`⚠️ Redis get failed for ${key}: ${error.message}`);
      return null;
    }
  }

  private async safeSet(key: string, value: any, ttl: number): Promise<void> {
    try {
      await this.redis.set(key, value, ttl);
    } catch (error: any) {
      this.logger.warn(`⚠️ Redis set failed for ${key}: ${error.message}`);
    }
  }
}
