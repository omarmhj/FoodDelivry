import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { NotificationsModule } from './notifications.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('NotificationsService');

  console.log(`
╔══════════════════════════════════════════════════════════════╗
║ 📧 NOTIFICATIONS SERVICE                                     ║
║ Multi-Channel Notification System                            ║
╚══════════════════════════════════════════════════════════════╝`);

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    NotificationsModule,
    {
      transport: Transport.RMQ,
      options: {
        urls: [process.env.RABBITMQ_URL || 'amqp://admin:rabbit123@localhost:5672'],
        queue: 'notifications_queue',
        queueOptions: {
          durable: true,
        },
        prefetchCount: 1,
        noAck: false,
      },
    },
  );

  await app.listen();

  logger.log('📧 NOTIFICATIONS SERVICE | 🚀 Starting Notifications Service...');
  logger.log('📧 NOTIFICATIONS SERVICE | ✅ Notifications Service is running');
  logger.log('📧 NOTIFICATIONS SERVICE | 🐰 RabbitMQ: Connected to notifications_queue');
  logger.log('📧 NOTIFICATIONS SERVICE | 📧 Email Notifications: Ready');
  logger.log('📧 NOTIFICATIONS SERVICE | 📱 SMS Notifications: Ready (Mock)');
  logger.log('📧 NOTIFICATIONS SERVICE | 🔔 Push Notifications: Ready (Mock)');
  logger.log('📧 NOTIFICATIONS SERVICE | 🔧 Environment: ' + (process.env.NODE_ENV || 'development'));
  logger.log('📧 NOTIFICATIONS SERVICE | 🏷️ Service: notifications-service');
  logger.log('============================================================');
}

bootstrap();
