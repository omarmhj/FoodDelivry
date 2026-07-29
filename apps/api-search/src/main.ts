import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SearchModule } from './search.module';

async function bootstrap() {
  const logger = new Logger('SearchService');

  logger.log(`
╔══════════════════════════════════════════════════════════════╗
║ 🔍 SEARCH & RECOMMENDATIONS SERVICE                         ║
║ Full-text + Geospatial Search & Personalized Recommendations ║
╚══════════════════════════════════════════════════════════════╝`);

  try {
    const app = await NestFactory.create(SearchModule);
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

    app.enableCors({
      origin: [
        'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:4000',
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
        'accesstoken',
        'refreshtoken',
      ],
    });

    const port = configService.get<number>('PORT') || 4005;
    const nodeEnv = configService.get<string>('NODE_ENV') || 'development';

    await app.listen(port);

    logger.log(`🔍 SEARCH SERVICE | ✅ Running on port ${port}`);
    logger.log(`🔍 SEARCH SERVICE | 🌐 GraphQL: http://localhost:${port}/graphql`);
    logger.log(`🔍 SEARCH SERVICE | 🔎 Full-text search: Ready`);
    logger.log(`🔍 SEARCH SERVICE | 📍 Geospatial search: Ready`);
    logger.log(`🔍 SEARCH SERVICE | 🎯 Recommendations: Ready`);
    logger.log(`🔍 SEARCH SERVICE | 🔧 Environment: ${nodeEnv}`);
    logger.log('============================================================');
  } catch (error) {
    logger.error('❌ Failed to start Search Service:', error.message);
    process.exit(1);
  }
}

process.on('uncaughtException', (error) => {
  new Logger('SearchService').error('❌ Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  new Logger('SearchService').error('❌ Unhandled Rejection:', reason);
  process.exit(1);
});

bootstrap();
