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
import { MenuItemService } from "./MenuItem/menu-item.service";
import { CloudinaryService } from "./cloudinary/cloudinary.service";
import { CloudinaryModule } from "./cloudinary/cloudinary.module";
import { SharedModule } from "../../../libs/shared/src/shared.module";
import { RedisModule } from "../../../libs/shared/src/redis.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
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
  controllers: [],
  providers: [
    RestaurantService,
    ConfigService,
    JwtService,
    PrismaService,
    RestaurantResolver,
    MenuItemService,
    CloudinaryService,
  ],
})
export class restaurantModule {}
