import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OrdersModule } from './orders.module';
import { PrismaService } from '../prisma/prisma.service';

async function bootstrap() {
  const logger = new Logger('OrdersService');
  
  logger.log(`
╔══════════════════════════════════════════════════════════════╗
║ 📦 ORDERS SERVICE                                           ║
║ Order Management & Tracking System                          ║
╚══════════════════════════════════════════════════════════════╝`);

  try {
    const app = await NestFactory.create(OrdersModule);
    const configService = app.get(ConfigService);

    // Enable shutdown hooks for graceful shutdown
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
    const corsOrigins = process.env.CORS_ORIGINS
      ? process.env.CORS_ORIGINS.split(',').map((s) => s.trim())
      : [
          'http://localhost:3000',
          'http://localhost:3001',
          'http://localhost:4000',
          'http://localhost:4001',
          'http://localhost:4002',
          'http://localhost:5173',
          'http://127.0.0.1:5173',
          'http://localhost:5174',
          'http://127.0.0.1:5174',
          'http://localhost:4173',
          'https://studio.apollographql.com',
        ];

    app.enableCors({
      origin: corsOrigins,
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
        'access-token',
        'refresh-token',
      ],
      exposedHeaders: ['accesstoken', 'refreshtoken', 'access-token', 'refresh-token'],
    });

    const port = configService.get<number>('PORT') || 4002;
    const serviceName = configService.get<string>('SERVICE_NAME') || 'orders-service';
    const nodeEnv = configService.get<string>('NODE_ENV') || 'development';

    await app.listen(port);

    logger.log('📦 ORDERS SERVICE | 🚀 Starting Orders Service...');
    logger.log(`📦 ORDERS SERVICE | ✅ Orders Service is running on port ${port}`);
    logger.log(`📦 ORDERS SERVICE | 🌐 GraphQL Playground: http://localhost:${port}/graphql`);
    logger.log(`📦 ORDERS SERVICE | 🛍️ Order Management: Ready`);
    logger.log(`📦 ORDERS SERVICE | 📊 Status Tracking: Ready`);
    logger.log(`📦 ORDERS SERVICE | 💳 Payment Integration: Ready`);
    logger.log(`📦 ORDERS SERVICE | 📱 Real-time Updates: Ready`);
    logger.log(`📦 ORDERS SERVICE | 🔧 Environment: ${nodeEnv}`);
    logger.log(`📦 ORDERS SERVICE | 🏷️ Service: ${serviceName}`);
    logger.log('============================================================');

  } catch (error) {
    logger.error('❌ Failed to start Orders Service:', error.message);
    logger.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  const logger = new Logger('OrdersService');
  logger.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  const logger = new Logger('OrdersService');
  logger.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', () => {
  const logger = new Logger('OrdersService');
  logger.log('📦 ORDERS SERVICE | 🛑 Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  const logger = new Logger('OrdersService');
  logger.log('📦 ORDERS SERVICE | 🛑 Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

bootstrap();