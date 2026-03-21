import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { JwtService } from '@nestjs/jwt';
import {
  ApolloFederationDriver,
  ApolloFederationDriverConfig,
} from '@nestjs/apollo';
import { PrismaService } from '../prisma/prisma.service';
import { ReservationsService } from './reservations.service';
import { ReservationsResolver } from './reservations.resolver';
import { AuthGuard } from './guards/auth.guard';
import { SharedModule } from '../../../libs/shared/src/shared.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['apps/api-reservations/.env.local', 'apps/api-reservations/.env'],
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
  providers: [
    ReservationsService,
    ReservationsResolver,
    PrismaService,
    AuthGuard,
    ConfigService,
    JwtService,
  ],
  exports: [ReservationsService, PrismaService],
})
export class ReservationsModule {}
