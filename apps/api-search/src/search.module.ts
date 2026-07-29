import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { JwtService } from '@nestjs/jwt';
import {
  ApolloFederationDriver,
  ApolloFederationDriverConfig,
} from '@nestjs/apollo';
import { PrismaService } from '../prisma/prisma.service';
import { OrdersPrismaService } from '../prisma/orders-prisma.service';
import { SearchService } from './search.service';
import { SearchResolver } from './search.resolver';
import { AuthGuard } from './guards/auth.guard';
import { RedisModule } from '../../../libs/shared/src/redis.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['apps/api-search/.env.local', 'apps/api-search/.env'],
    }),
    GraphQLModule.forRoot<ApolloFederationDriverConfig>({
      driver: ApolloFederationDriver,
      autoSchemaFile: {
        federation: 2,
      },
      context: ({ req, res }) => ({ req, res }),
    }),
    RedisModule,
  ],
  providers: [
    SearchService,
    SearchResolver,
    PrismaService,
    OrdersPrismaService,
    AuthGuard,
    ConfigService,
    JwtService,
  ],
  exports: [SearchService],
})
export class SearchModule {}
