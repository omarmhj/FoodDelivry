import { Args, Context, Mutation, Resolver, Query } from "@nestjs/graphql";
import { RestaurantService } from "./restaurant.service";
import {
  ActivationResponse,
  FindRestaurantsNearResponse,
  LoginResponse,
  LogoutResponse,
  RegisterResponse,
} from "./types/restaurant.type";
import { ActivationDto, FindRestaurantsNearDto, LoginDto, RegisterDto } from "./dto/restaurant.dto";
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
}
