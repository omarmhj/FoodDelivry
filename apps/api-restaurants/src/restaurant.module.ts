import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { GraphQLModule } from "@nestjs/graphql";
import {
  ApolloFederationDriver,
  ApolloFederationDriverConfig,
} from "@nestjs/apollo";
import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "../prisma/prisma.service";
import { EmailModule } from "./email/email.module";
import { RestaurantService } from "./restaurant.service";
import { RestaurantResolver } from "./restaurant.resolver";
import { RestaurantController } from "./restaurant.controller";
import { MenuItemService } from "./MenuItem/menu-item.service";
import { CloudinaryService } from "./cloudinary/cloudinary.service";
import { CloudinaryModule } from "./cloudinary/cloudinary.module";
import { SharedModule } from "../../../libs/shared/src/shared.module";
import { RedisModule } from "../../../libs/shared/src/redis.module";
import { RedisService } from "../../../libs/shared/src/redis.service";
import { AuthGuard } from "./guards/auth.guard";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['apps/api-restaurants/.env.local', 'apps/api-restaurants/.env'],
    }),
    GraphQLModule.forRoot<ApolloFederationDriverConfig>({
      driver: ApolloFederationDriver,
      autoSchemaFile: {
        federation: 2,
      },
    }),
    EmailModule,
    CloudinaryModule,
    SharedModule,
    RedisModule
  ],
  controllers: [RestaurantController],
  providers: [
    RestaurantService,
    ConfigService,
    JwtService,
    PrismaService,
    RestaurantResolver,
    MenuItemService,
    CloudinaryService,
    RedisService,
    AuthGuard,
  ],
})
export class restaurantModule {}
