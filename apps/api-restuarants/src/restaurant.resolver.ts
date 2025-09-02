import { Args, Context, Mutation, Resolver, Query } from "@nestjs/graphql";
import { RestaurantService } from "./restaurant.service";
import {
  ActivationResponse,
  FindRestaurantsNearResponse,
  LoginResponse,
  LogoutResponse,
  RegisterResponse,
} from "./types/restaurant.type";
import { 
  ActivationDto, 
  FindRestaurantsNearDto, 
  LoginDto, 
  RegisterDto,
  CreateMenuDto,
  UpdateMenuDto,
  DeleteMenuDto,
  CreateCategoryDto,
  UpdateCategoryDto,
  DeleteCategoryDto,
  CreateMenuItemDto,
  UpdateMenuItemDto,
  DeleteMenuItemDto,
  CreateOperatingHoursDto,
  UpdateOperatingHoursDto,
  DeleteOperatingHoursDto,
  AddStaffMemberDto,
  RemoveStaffMemberDto
} from "./dto/restaurant.dto";
import { Response, Request } from "express";
import { UseGuards } from "@nestjs/common";
import { AuthGuard } from "./guards/auth.guard";

@Resolver("Restaurant")
export class RestaurantResolver {
  constructor(private readonly restaurantService: RestaurantService) {}

  @Mutation(() => RegisterResponse)
  async registerRestaurant(
    @Args("registerDto") registerDto: RegisterDto,
    @Context() context: { res: Response }
  ): Promise<RegisterResponse> {
    const { message, activation_token } = await this.restaurantService.registerRestaurant(
      registerDto,
      context.res
    );
    return { message, activation_token };
  }

  @Mutation(() => ActivationResponse)
  async activateRestaurant(
    @Args("activationDto") activationDto: ActivationDto,
    @Context() context: { res: Response }
  ): Promise<ActivationResponse> {
    return await this.restaurantService.activateRestaurant(
      activationDto,
      context.res
    );
  }

  @Mutation(() => LoginResponse)
  async LoginRestaurant(
    @Args('loginDto') loginDto: LoginDto ): Promise<LoginResponse> {
    return await this.restaurantService.LoginRestaurant(loginDto);
  }

  @Query(() => LoginResponse)
  @UseGuards(AuthGuard)
  async getLoggedInRestaurant(
    @Context() context: { req: any }
  ): Promise<LoginResponse> {
    return await this.restaurantService.getLoggedInRestaurant(context.req);
  }

  @Query(() => LogoutResponse)
  @UseGuards(AuthGuard)
  async logOutRestaurant(@Context() context: { req: any }) {
    return await this.restaurantService.Logout(context.req);
  }

  @Query(() => FindRestaurantsNearResponse)
  async findRestaurantsNear(
    @Args('findRestaurantsNearDto') findRestaurantsNearDto: FindRestaurantsNearDto,
  ): Promise<FindRestaurantsNearResponse> {
    return await this.restaurantService.findRestaurantsNear(findRestaurantsNearDto);
  }

  // ==================== MENU MANAGEMENT RESOLVERS ====================

  @Mutation(() => LoginResponse)
  @UseGuards(AuthGuard)
  async createMenu(
    @Args('createMenuDto') createMenuDto: CreateMenuDto,
    @Context() context: { req: any }
  ): Promise<LoginResponse> {
    console.log('\x1b[33m🍕 RESTAURANT SERVICE\x1b[0m | 📋 Handling CREATE MENU request');
    return await this.restaurantService.createMenu(createMenuDto, context.req);
  }

  @Mutation(() => LoginResponse)
  @UseGuards(AuthGuard)
  async updateMenu(
    @Args('updateMenuDto') updateMenuDto: UpdateMenuDto,
    @Context() context: { req: any }
  ): Promise<LoginResponse> {
    console.log('\x1b[33m🍕 RESTAURANT SERVICE\x1b[0m | 📝 Handling UPDATE MENU request');
    return await this.restaurantService.updateMenu(updateMenuDto, context.req);
  }

  @Mutation(() => LoginResponse)
  @UseGuards(AuthGuard)
  async deleteMenu(
    @Args('deleteMenuDto') deleteMenuDto: DeleteMenuDto,
    @Context() context: { req: any }
  ): Promise<LoginResponse> {
    console.log('\x1b[33m🍕 RESTAURANT SERVICE\x1b[0m | 🗑️ Handling DELETE MENU request');
    return await this.restaurantService.deleteMenu(deleteMenuDto, context.req);
  }

  // ==================== CATEGORY MANAGEMENT RESOLVERS ====================

  @Mutation(() => LoginResponse)
  @UseGuards(AuthGuard)
  async createCategory(
    @Args('createCategoryDto') createCategoryDto: CreateCategoryDto,
    @Context() context: { req: any }
  ): Promise<LoginResponse> {
    console.log('\x1b[33m🍕 RESTAURANT SERVICE\x1b[0m | 🏷️ Handling CREATE CATEGORY request');
    return await this.restaurantService.createCategory(createCategoryDto, context.req);
  }

  @Mutation(() => LoginResponse)
  @UseGuards(AuthGuard)
  async updateCategory(
    @Args('updateCategoryDto') updateCategoryDto: UpdateCategoryDto,
    @Context() context: { req: any }
  ): Promise<LoginResponse> {
    console.log('\x1b[33m🍕 RESTAURANT SERVICE\x1b[0m | ✏️ Handling UPDATE CATEGORY request');
    return await this.restaurantService.updateCategory(updateCategoryDto, context.req);
  }

  @Mutation(() => LoginResponse)
  @UseGuards(AuthGuard)
  async deleteCategory(
    @Args('deleteCategoryDto') deleteCategoryDto: DeleteCategoryDto,
    @Context() context: { req: any }
  ): Promise<LoginResponse> {
    console.log('\x1b[33m🍕 RESTAURANT SERVICE\x1b[0m | 🗑️ Handling DELETE CATEGORY request');
    return await this.restaurantService.deleteCategory(deleteCategoryDto, context.req);
  }

  // ==================== MENU ITEM MANAGEMENT RESOLVERS ====================

  @Mutation(() => LoginResponse)
  @UseGuards(AuthGuard)
  async createMenuItem(
    @Args('createMenuItemDto') createMenuItemDto: CreateMenuItemDto,
    @Context() context: { req: any }
  ): Promise<LoginResponse> {
    console.log('\x1b[33m🍕 RESTAURANT SERVICE\x1b[0m | 🍽️ Handling CREATE MENU ITEM request');
    return await this.restaurantService.createMenuItem(createMenuItemDto, context.req);
  }

  @Mutation(() => LoginResponse)
  @UseGuards(AuthGuard)
  async updateMenuItem(
    @Args('updateMenuItemDto') updateMenuItemDto: UpdateMenuItemDto,
    @Context() context: { req: any }
  ): Promise<LoginResponse> {
    console.log('\x1b[33m🍕 RESTAURANT SERVICE\x1b[0m | ✏️ Handling UPDATE MENU ITEM request');
    return await this.restaurantService.updateMenuItem(updateMenuItemDto, context.req);
  }

  @Mutation(() => LoginResponse)
  @UseGuards(AuthGuard)
  async deleteMenuItem(
    @Args('deleteMenuItemDto') deleteMenuItemDto: DeleteMenuItemDto,
    @Context() context: { req: any }
  ): Promise<LoginResponse> {
    console.log('\x1b[33m🍕 RESTAURANT SERVICE\x1b[0m | 🗑️ Handling DELETE MENU ITEM request');
    return await this.restaurantService.deleteMenuItem(deleteMenuItemDto, context.req);
  }

  // ==================== OPERATING HOURS MANAGEMENT RESOLVERS ====================

  @Mutation(() => LoginResponse)
  @UseGuards(AuthGuard)
  async createOperatingHours(
    @Args('createOperatingHoursDto') createOperatingHoursDto: CreateOperatingHoursDto,
    @Context() context: { req: any }
  ): Promise<LoginResponse> {
    console.log('\x1b[33m🍕 RESTAURANT SERVICE\x1b[0m | 🕒 Handling CREATE OPERATING HOURS request');
    return await this.restaurantService.createOperatingHours(createOperatingHoursDto, context.req);
  }

  @Mutation(() => LoginResponse)
  @UseGuards(AuthGuard)
  async updateOperatingHours(
    @Args('updateOperatingHoursDto') updateOperatingHoursDto: UpdateOperatingHoursDto,
    @Context() context: { req: any }
  ): Promise<LoginResponse> {
    console.log('\x1b[33m🍕 RESTAURANT SERVICE\x1b[0m | ✏️ Handling UPDATE OPERATING HOURS request');
    return await this.restaurantService.updateOperatingHours(updateOperatingHoursDto, context.req);
  }

  @Mutation(() => LoginResponse)
  @UseGuards(AuthGuard)
  async deleteOperatingHours(
    @Args('deleteOperatingHoursDto') deleteOperatingHoursDto: DeleteOperatingHoursDto,
    @Context() context: { req: any }
  ): Promise<LoginResponse> {
    console.log('\x1b[33m🍕 RESTAURANT SERVICE\x1b[0m | 🗑️ Handling DELETE OPERATING HOURS request');
    return await this.restaurantService.deleteOperatingHours(deleteOperatingHoursDto, context.req);
  }

  // ==================== STAFF MANAGEMENT RESOLVERS ====================

  @Mutation(() => LoginResponse)
  @UseGuards(AuthGuard)
  async addStaffMember(
    @Args('addStaffMemberDto') addStaffMemberDto: AddStaffMemberDto,
    @Context() context: { req: any }
  ): Promise<LoginResponse> {
    console.log('\x1b[33m🍕 RESTAURANT SERVICE\x1b[0m | 👥 Handling ADD STAFF MEMBER request');
    return await this.restaurantService.addStaffMember(addStaffMemberDto, context.req);
  }

  @Mutation(() => LoginResponse)
  @UseGuards(AuthGuard)
  async removeStaffMember(
    @Args('removeStaffMemberDto') removeStaffMemberDto: RemoveStaffMemberDto,
    @Context() context: { req: any }
  ): Promise<LoginResponse> {
    console.log('\x1b[33m🍕 RESTAURANT SERVICE\x1b[0m | 👋 Handling REMOVE STAFF MEMBER request');
    return await this.restaurantService.removeStaffMember(removeStaffMemberDto, context.req);
  }
}
