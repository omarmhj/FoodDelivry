import { Resolver, Query, Args, Int, Context } from '@nestjs/graphql';
import { UseGuards, Logger } from '@nestjs/common';
import { SearchService } from './search.service';
import {
  SearchRestaurantsDto,
  SearchMenuItemsDto,
  NearbyRestaurantsDto,
} from './dto/search.dto';
import {
  RestaurantSearchResponse,
  MenuItemSearchResponse,
  NearbyRestaurantsResponse,
  RecommendationsResponse,
} from './entities/search.entities';
import { AuthGuard } from './guards/auth.guard';

@Resolver('Search')
export class SearchResolver {
  private readonly logger = new Logger(SearchResolver.name);

  constructor(private readonly searchService: SearchService) {}

  // Public: search restaurants by text
  @Query(() => RestaurantSearchResponse)
  async searchRestaurants(
    @Args('input') input: SearchRestaurantsDto,
  ): Promise<RestaurantSearchResponse> {
    try {
      const result = await this.searchService.searchRestaurants(input);
      return { ...result };
    } catch (error) {
      return { results: [], total: 0, cached: false, error: { message: error.message, code: 'SEARCH_RESTAURANTS_FAILED' } };
    }
  }

  // Public: search menu items by text
  @Query(() => MenuItemSearchResponse)
  async searchMenuItems(
    @Args('input') input: SearchMenuItemsDto,
  ): Promise<MenuItemSearchResponse> {
    try {
      const result = await this.searchService.searchMenuItems(input);
      return { ...result };
    } catch (error) {
      return { results: [], total: 0, cached: false, error: { message: error.message, code: 'SEARCH_MENU_ITEMS_FAILED' } };
    }
  }

  // Public: find nearby restaurants (geospatial)
  @Query(() => NearbyRestaurantsResponse)
  async nearbyRestaurants(
    @Args('input') input: NearbyRestaurantsDto,
  ): Promise<NearbyRestaurantsResponse> {
    try {
      const result = await this.searchService.findNearby(input);
      return { ...result };
    } catch (error) {
      return { results: [], total: 0, cached: false, error: { message: error.message, code: 'NEARBY_RESTAURANTS_FAILED' } };
    }
  }

  // Protected: personalized recommendations for the logged-in customer
  @Query(() => RecommendationsResponse)
  @UseGuards(AuthGuard)
  async recommendations(
    @Context() context: Record<string, unknown>,
    @Args('limit', { type: () => Int, nullable: true }) limit?: number,
  ): Promise<RecommendationsResponse> {
    try {
      const req = context.req as any;
      const customerId = req.user?.id;
      if (!customerId) {
        return { reorder: [], discover: [], cached: false, error: { message: 'User authentication required', code: 'AUTH_REQUIRED' } };
      }
      const result = await this.searchService.getRecommendations(customerId, limit ?? 10);
      return { ...result };
    } catch (error) {
      return { reorder: [], discover: [], cached: false, error: { message: error.message, code: 'RECOMMENDATIONS_FAILED' } };
    }
  }
}
