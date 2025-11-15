import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MailerModule } from '@nestjs-modules/mailer';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { RedisModule } from '../../../libs/shared/src/redis.module';
import { RedisService } from '../../../libs/shared/src/redis.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['apps/api-notifications/.env.local', 'apps/api-notifications/.env'],
    }),
    MailerModule.forRootAsync({
      useFactory: async (config: ConfigService) => ({
        transport: {
          host: config.get('SMTP_HOST'),
          secure: true,
          auth: {
            user: config.get('SMTP_MAIL'),
            pass: config.get('SMTP_PASSWORD'),
          },
        },
        defaults: {
          from: config.get('SMTP_FROM') || 'SnackRapido <noreply@snackrapido.com>',
        },
      }),
      inject: [ConfigService],
    }),
    RedisModule,
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService, PrismaService, RedisService],
})
export class NotificationsModule {}

