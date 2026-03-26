import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloFederationDriver, ApolloFederationDriverConfig } from '@nestjs/apollo';
import { ScheduleModule } from '@nestjs/schedule';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { AnalyticsResolver } from './analytics.resolver';
import { AnalyticsScheduler } from './analytics.scheduler';
import { PrismaService } from '../prisma/prisma.service';
import { RedisModule } from '../../../libs/shared/src/redis.module';
import { RedisService } from '../../../libs/shared/src/redis.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['apps/api-Analytics/.env.local', 'apps/api-Analytics/.env'],
    }),
    GraphQLModule.forRoot<ApolloFederationDriverConfig>({
      driver: ApolloFederationDriver,
      autoSchemaFile: {
        federation: 2,
      },
      context: ({ req, res }) => ({ req, res }),
    }),
    ScheduleModule.forRoot(),
    RedisModule,
  ],
  controllers: [AnalyticsController],
  providers: [
    AnalyticsService,
    AnalyticsResolver,
    AnalyticsScheduler,
    PrismaService,
    RedisService,
    ConfigService,
  ],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}

