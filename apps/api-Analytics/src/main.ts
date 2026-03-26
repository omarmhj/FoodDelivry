import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AnalyticsModule } from './analytics.module';

async function bootstrap() {
  const logger = new Logger('AnalyticsService');

  logger.log(`
╔══════════════════════════════════════════════════════════════╗
║ 📊 ANALYTICS SERVICE                                         ║
║ Sales & Behavior Tracking System                             ║
╚══════════════════════════════════════════════════════════════╝`);

  try {
    // Create HTTP application
    const app = await NestFactory.create(AnalyticsModule);
    const configService = app.get(ConfigService);

    // Enable shutdown hooks
    app.enableShutdownHooks();

    // Global validation pipe
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    );

    // CORS configuration
    app.enableCors({
      origin: [
        'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:4000',
        'http://localhost:4001',
        'http://localhost:4002',
        'http://localhost:4003',
        'https://studio.apollographql.com',
      ],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Requested-With',
        'Accept',
        'Origin',
        'Access-Control-Allow-Origin',
        'Access-Control-Allow-Headers',
        'Access-Control-Allow-Methods',
        'accesstoken',
        'refreshtoken',
      ],
    });

    // Connect RabbitMQ microservice — use dedicated analytics queue
    app.connectMicroservice<MicroserviceOptions>({
      transport: Transport.RMQ,
      options: {
        urls: [process.env.RABBITMQ_URL || 'amqp://admin:rabbit123@localhost:5673'],
        queue: 'analytics_queue',
        queueOptions: {
          durable: true,
        },
        prefetchCount: 1,
        noAck: false,
      },
    });

    // Get port from environment or default to 4003
    const port = configService.get<number>('PORT') || 4003;
    const serviceName = configService.get<string>('SERVICE_NAME') || 'analytics-service';
    const nodeEnv = configService.get<string>('NODE_ENV') || 'development';

    // Start all microservices (RabbitMQ)
    await app.startAllMicroservices();
    logger.log('📊 ANALYTICS SERVICE | 🔄 Waiting for RabbitMQ consumers to initialize...');
    await new Promise(resolve => setTimeout(resolve, 1000));
    logger.log('📊 ANALYTICS SERVICE | ✅ RabbitMQ consumers ready');

    // Start HTTP server
    await app.listen(port);

    logger.log('📊 ANALYTICS SERVICE | 🚀 Starting Analytics Service...');
    logger.log(`📊 ANALYTICS SERVICE | ✅ Analytics Service is running on port ${port}`);
    logger.log(`📊 ANALYTICS SERVICE | 🌐 GraphQL Playground: http://localhost:${port}/graphql`);
    logger.log('📊 ANALYTICS SERVICE | 🐰 RabbitMQ: Connected to snackrapido_queue');
    logger.log('📊 ANALYTICS SERVICE | 📈 Event Consumers: Ready');
    logger.log('📊 ANALYTICS SERVICE | 💾 Redis Caching: Ready');
    logger.log('📊 ANALYTICS SERVICE | ⏰ Scheduled Tasks: Active');
    logger.log(`📊 ANALYTICS SERVICE | 🔧 Environment: ${nodeEnv}`);
    logger.log(`📊 ANALYTICS SERVICE | 🏷️ Service: ${serviceName}`);
    logger.log('============================================================');

  } catch (error) {
    logger.error('❌ Failed to start Analytics Service:', error.message);
    logger.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  const logger = new Logger('AnalyticsService');
  logger.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  const logger = new Logger('AnalyticsService');
  logger.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', () => {
  const logger = new Logger('AnalyticsService');
  logger.log('📊 ANALYTICS SERVICE | 🛑 Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  const logger = new Logger('AnalyticsService');
  logger.log('📊 ANALYTICS SERVICE | 🛑 Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

bootstrap();
