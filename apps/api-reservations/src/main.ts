import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ReservationsModule } from './reservations.module';

async function bootstrap() {
  const logger = new Logger('ReservationsService');

  logger.log(`
╔══════════════════════════════════════════════════════════════╗
║ 📅 RESERVATIONS SERVICE                                     ║
║ Table Booking & Availability System                          ║
╚══════════════════════════════════════════════════════════════╝`);

  try {
    const app = await NestFactory.create(ReservationsModule);
    const configService = app.get(ConfigService);

    app.enableShutdownHooks();

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

    const corsOrigins = process.env.CORS_ORIGINS
      ? process.env.CORS_ORIGINS.split(',').map((s) => s.trim())
      : [
          'http://localhost:3000',
          'http://localhost:3001',
          'http://localhost:4000',
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
        'accesstoken',
        'refreshtoken',
        'access-token',
        'refresh-token',
      ],
    });

    const port = configService.get<number>('PORT') || 4004;
    const nodeEnv = configService.get<string>('NODE_ENV') || 'development';

    await app.listen(port);

    logger.log(`📅 RESERVATIONS SERVICE | ✅ Running on port ${port}`);
    logger.log(`📅 RESERVATIONS SERVICE | 🌐 GraphQL: http://localhost:${port}/graphql`);
    logger.log(`📅 RESERVATIONS SERVICE | 🔧 Environment: ${nodeEnv}`);
    logger.log('============================================================');
  } catch (error) {
    logger.error('❌ Failed to start Reservations Service:', error.message);
    process.exit(1);
  }
}

process.on('uncaughtException', (error) => {
  new Logger('ReservationsService').error('❌ Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  new Logger('ReservationsService').error('❌ Unhandled Rejection:', reason);
  process.exit(1);
});

bootstrap();
