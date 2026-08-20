import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChatModule } from './chat.module';

async function bootstrap() {
  const logger = new Logger('ChatService');

  logger.log(`
╔══════════════════════════════════════════════════════════════╗
║ 💬 CHAT SERVICE                                             ║
║ Real-time Messaging (WebSocket + Redis pub/sub)              ║
╚══════════════════════════════════════════════════════════════╝`);

  try {
    const app = await NestFactory.create(ChatModule);
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
          'http://localhost:5173', // customer app (Vite)
          'http://localhost:5174', // restaurant dashboard (Vite)
          'http://localhost:5175', // delivery app (Vite)
          'http://127.0.0.1:5173',
          'http://localhost:4173', // vite preview
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

    const port = configService.get<number>('PORT') || 4006;
    const nodeEnv = configService.get<string>('NODE_ENV') || 'development';

    await app.listen(port);

    logger.log(`💬 CHAT SERVICE | ✅ Running on port ${port}`);
    logger.log(`💬 CHAT SERVICE | 🌐 GraphQL: http://localhost:${port}/graphql`);
    logger.log(`💬 CHAT SERVICE | 🔌 WebSocket: ws://localhost:${port}`);
    logger.log(`💬 CHAT SERVICE | 📡 Redis pub/sub broadcasting: Ready`);
    logger.log(`💬 CHAT SERVICE | 🐰 RabbitMQ message.sent events: Ready`);
    logger.log(`💬 CHAT SERVICE | 🔧 Environment: ${nodeEnv}`);
    logger.log('============================================================');
  } catch (error) {
    logger.error('❌ Failed to start Chat Service:', error.message);
    process.exit(1);
  }
}

process.on('uncaughtException', (error) => {
  new Logger('ChatService').error('❌ Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  new Logger('ChatService').error('❌ Unhandled Rejection:', reason);
  process.exit(1);
});

bootstrap();
