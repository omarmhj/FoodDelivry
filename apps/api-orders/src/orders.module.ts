import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { JwtService } from '@nestjs/jwt';
import {
  ApolloFederationDriver,
  ApolloFederationDriverConfig,
} from '@nestjs/apollo';
import { PrismaService } from '../prisma/prisma.service';
import { OrdersService } from './orders.service';
import { OrdersResolver } from './orders.resolver';
import { OrdersGateway } from './orders.gateway';
import { AuthGuard } from './guards/auth.guard';
import { SharedModule } from '../../../libs/shared/src/shared.module';
import { RedisService } from '../../../libs/shared/src/redis.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['apps/api-orders/.env.local', 'apps/api-orders/.env'],
    }),
    GraphQLModule.forRoot<ApolloFederationDriverConfig>({
      driver: ApolloFederationDriver,
      autoSchemaFile: {
        federation: 2,
      },
      context: ({ req, res }) => ({ req, res }),
    }),
    SharedModule,
  ],
  controllers: [],
  providers: [
    OrdersService,
    OrdersGateway,
    OrdersResolver,
    PrismaService,
    AuthGuard,
    ConfigService,
    JwtService,
    RedisService,
  ],
  exports: [OrdersService, PrismaService],
})
export class OrdersModule {}









