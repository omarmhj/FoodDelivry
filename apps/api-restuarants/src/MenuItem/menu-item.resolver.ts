// apps/api-restaurants/src/foods/menu-item.resolver.ts
import { Args, Context, Mutation, Query, Resolver } from '@nestjs/graphql';
import { MenuItemService } from './menu-item.service';
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from '../guards/auth.guard';
import { CreateMenuItemDto, DeleteMenuItemDto } from './dto/menu-item.dto';
import { CreateMenuItemResponse, DeleteMenuItemResponse, LoggedInRestaurantMenuItemsResponse } from './types/menu-item.types';

@Resolver('MenuItem')
export class MenuItemResolver {
  constructor(private readonly menuItemService: MenuItemService) {}

  @Mutation(() => CreateMenuItemResponse)
  @UseGuards(AuthGuard)
  async createMenuItem(
    @Context() context: { req: any },
    @Args('createMenuItemDto') createMenuItemDto: CreateMenuItemDto,
  ) {
    return await this.menuItemService.createMenuItem(createMenuItemDto, context.req);
  }

  @Query(() => LoggedInRestaurantMenuItemsResponse)
  @UseGuards(AuthGuard)
  async getLoggedInRestaurantMenuItems(@Context() context: { req: any }) {
    return await this.menuItemService.getLoggedInRestaurantMenuItems(context.req);
  }

  @Mutation(() => DeleteMenuItemResponse)
  @UseGuards(AuthGuard)
  async deleteMenuItem(
    @Context() context: { req: any },
    @Args('deleteMenuItemDto') deleteMenuItemDto: DeleteMenuItemDto,
  ) {
    return this.menuItemService.deleteMenuItem(deleteMenuItemDto, context.req);
  }
}