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

interface GraphQLContext {
  req: Request & {
    restaurant?: { id: string; email: string };
    refreshtoken?: string;
    accesstoken?: string;
  };
  res: Response;
}

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
    @Context() context: GraphQLContext
  ): Promise<LoginResponse> {
    return await this.restaurantService.getLoggedInRestaurant(context.req as any);
  }

  @Query(() => LogoutResponse)
  @UseGuards(AuthGuard)
  async logOutRestaurant(@Context() context: { req: any }) {
    return await this.restaurantService.Logout(context.req as any);
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
    @Context() context: GraphQLContext
  ): Promise<LoginResponse> {
    console.log('\x1b[33m🍕 RESTAURANT SERVICE\x1b[0m | 📋 Handling CREATE MENU request');
    return await this.restaurantService.createMenu(createMenuDto, context.req as any as any);
  }

  @Mutation(() => LoginResponse)
  @UseGuards(AuthGuard)
  async updateMenu(
    @Args('updateMenuDto') updateMenuDto: UpdateMenuDto,
    @Context() context: GraphQLContext
  ): Promise<LoginResponse> {
    console.log('\x1b[33m🍕 RESTAURANT SERVICE\x1b[0m | 📝 Handling UPDATE MENU request');
    return await this.restaurantService.updateMenu(updateMenuDto, context.req as any);
  }

  @Mutation(() => LoginResponse)
  @UseGuards(AuthGuard)
  async deleteMenu(
    @Args('deleteMenuDto') deleteMenuDto: DeleteMenuDto,
    @Context() context: GraphQLContext
  ): Promise<LoginResponse> {
    console.log('\x1b[33m🍕 RESTAURANT SERVICE\x1b[0m | 🗑️ Handling DELETE MENU request');
    return await this.restaurantService.deleteMenu(deleteMenuDto, context.req as any);
  }

  // ==================== CATEGORY MANAGEMENT RESOLVERS ====================

  @Mutation(() => LoginResponse)
  @UseGuards(AuthGuard)
  async createCategory(
    @Args('createCategoryDto') createCategoryDto: CreateCategoryDto,
    @Context() context: GraphQLContext
  ): Promise<LoginResponse> {
    console.log('\x1b[33m🍕 RESTAURANT SERVICE\x1b[0m | 🏷️ Handling CREATE CATEGORY request');
    return await this.restaurantService.createCategory(createCategoryDto, context.req as any);
  }

  @Mutation(() => LoginResponse)
  @UseGuards(AuthGuard)
  async updateCategory(
    @Args('updateCategoryDto') updateCategoryDto: UpdateCategoryDto,
    @Context() context: GraphQLContext
  ): Promise<LoginResponse> {
    console.log('\x1b[33m🍕 RESTAURANT SERVICE\x1b[0m | ✏️ Handling UPDATE CATEGORY request');
    return await this.restaurantService.updateCategory(updateCategoryDto, context.req as any);
  }

  @Mutation(() => LoginResponse)
  @UseGuards(AuthGuard)
  async deleteCategory(
    @Args('deleteCategoryDto') deleteCategoryDto: DeleteCategoryDto,
    @Context() context: GraphQLContext
  ): Promise<LoginResponse> {
    console.log('\x1b[33m🍕 RESTAURANT SERVICE\x1b[0m | 🗑️ Handling DELETE CATEGORY request');
    return await this.restaurantService.deleteCategory(deleteCategoryDto, context.req as any);
  }

  // ==================== MENU ITEM MANAGEMENT RESOLVERS ====================

  @Mutation(() => LoginResponse)
  @UseGuards(AuthGuard)
  async createMenuItem(
    @Args('createMenuItemDto') createMenuItemDto: CreateMenuItemDto,
    @Context() context: GraphQLContext
  ): Promise<LoginResponse> {
    console.log('\x1b[33m🍕 RESTAURANT SERVICE\x1b[0m | 🍽️ Handling CREATE MENU ITEM request');
    return await this.restaurantService.createMenuItem(createMenuItemDto, context.req as any);
  }

  @Mutation(() => LoginResponse)
  @UseGuards(AuthGuard)
  async updateMenuItem(
    @Args('updateMenuItemDto') updateMenuItemDto: UpdateMenuItemDto,
    @Context() context: GraphQLContext
  ): Promise<LoginResponse> {
    console.log('\x1b[33m🍕 RESTAURANT SERVICE\x1b[0m | ✏️ Handling UPDATE MENU ITEM request');
    return await this.restaurantService.updateMenuItem(updateMenuItemDto, context.req as any);
  }

  @Mutation(() => LoginResponse)
  @UseGuards(AuthGuard)
  async deleteMenuItem(
    @Args('deleteMenuItemDto') deleteMenuItemDto: DeleteMenuItemDto,
    @Context() context: GraphQLContext
  ): Promise<LoginResponse> {
    console.log('\x1b[33m🍕 RESTAURANT SERVICE\x1b[0m | 🗑️ Handling DELETE MENU ITEM request');
    return await this.restaurantService.deleteMenuItem(deleteMenuItemDto, context.req as any);
  }

  // ==================== OPERATING HOURS MANAGEMENT RESOLVERS ====================

  @Mutation(() => LoginResponse)
  @UseGuards(AuthGuard)
  async createOperatingHours(
    @Args('createOperatingHoursDto') createOperatingHoursDto: CreateOperatingHoursDto,
    @Context() context: GraphQLContext
  ): Promise<LoginResponse> {
    console.log('\x1b[33m🍕 RESTAURANT SERVICE\x1b[0m | 🕒 Handling CREATE OPERATING HOURS request');
    return await this.restaurantService.createOperatingHours(createOperatingHoursDto, context.req as any);
  }

  @Mutation(() => LoginResponse)
  @UseGuards(AuthGuard)
  async updateOperatingHours(
    @Args('updateOperatingHoursDto') updateOperatingHoursDto: UpdateOperatingHoursDto,
    @Context() context: GraphQLContext
  ): Promise<LoginResponse> {
    console.log('\x1b[33m🍕 RESTAURANT SERVICE\x1b[0m | ✏️ Handling UPDATE OPERATING HOURS request');
    return await this.restaurantService.updateOperatingHours(updateOperatingHoursDto, context.req as any);
  }

  @Mutation(() => LoginResponse)
  @UseGuards(AuthGuard)
  async deleteOperatingHours(
    @Args('deleteOperatingHoursDto') deleteOperatingHoursDto: DeleteOperatingHoursDto,
    @Context() context: GraphQLContext
  ): Promise<LoginResponse> {
    console.log('\x1b[33m🍕 RESTAURANT SERVICE\x1b[0m | 🗑️ Handling DELETE OPERATING HOURS request');
    return await this.restaurantService.deleteOperatingHours(deleteOperatingHoursDto, context.req as any);
  }

  // ==================== STAFF MANAGEMENT RESOLVERS ====================

  @Mutation(() => LoginResponse)
  @UseGuards(AuthGuard)
  async addStaffMember(
    @Args('addStaffMemberDto') addStaffMemberDto: AddStaffMemberDto,
    @Context() context: GraphQLContext
  ): Promise<LoginResponse> {
    console.log('\x1b[33m🍕 RESTAURANT SERVICE\x1b[0m | 👥 Handling ADD STAFF MEMBER request');
    return await this.restaurantService.addStaffMember(addStaffMemberDto, context.req as any);
  }

  @Mutation(() => LoginResponse)
  @UseGuards(AuthGuard)
  async removeStaffMember(
    @Args('removeStaffMemberDto') removeStaffMemberDto: RemoveStaffMemberDto,
    @Context() context: GraphQLContext
  ): Promise<LoginResponse> {
    console.log('\x1b[33m🍕 RESTAURANT SERVICE\x1b[0m | 👋 Handling REMOVE STAFF MEMBER request');
    return await this.restaurantService.removeStaffMember(removeStaffMemberDto, context.req as any);
  }
}
