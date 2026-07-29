import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { JwtService } from '@nestjs/jwt';
import {
  ApolloFederationDriver,
  ApolloFederationDriverConfig,
} from '@nestjs/apollo';
import { PrismaService } from '../prisma/prisma.service';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { ChatResolver } from './chat.resolver';
import { AuthGuard } from './guards/auth.guard';
import { SharedModule } from '../../../libs/shared/src/shared.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['apps/api-chat/.env.local', 'apps/api-chat/.env'],
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
    ChatGateway,
    ChatService,
    ChatResolver,
    PrismaService,
    AuthGuard,
    ConfigService,
    JwtService,
  ],
  exports: [ChatService],
})
export class ChatModule {}
