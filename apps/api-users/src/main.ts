import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ValidationPipe } from '@nestjs/common';
import { join } from 'path';
import { UsersModule } from './user.module';

async function bootstrap() {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║ 👥 USERS SERVICE                                           ║
║ User Authentication & Management System                      ║
╚══════════════════════════════════════════════════════════════╝`);

  const app = await NestFactory.create<NestExpressApplication>(UsersModule);

  // Global validation pipe — enforces class-validator decorators on all DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,       // Strip properties not in DTO
      forbidNonWhitelisted: true, // Throw if unknown properties sent
      transform: true,       // Auto-transform payloads to DTO instances
    }),
  );

  // Connect to RabbitMQ as a microservice consumer
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [process.env.RABBITMQ_URL || 'amqp://admin:rabbit123@localhost:5673'],
      queue: 'snackrapido_queue',
      queueOptions: {
        durable: true,
      },
      socketOptions: {
        heartbeatIntervalInSeconds: 60,
        reconnectTimeInSeconds: 5,
      },
    },
  });

  app.useStaticAssets(join(__dirname, '..', 'public'));
  app.setBaseViewsDir(join(__dirname, '..', 'email-templates'));
  app.setViewEngine('ejs');

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

  // Start all microservices and wait for connection
  await app.startAllMicroservices();
  
  // Wait a bit for RabbitMQ consumers to be fully registered
  console.log('👥 USERS SERVICE | 🔄 Waiting for RabbitMQ consumers to initialize...');
  await new Promise(resolve => setTimeout(resolve, 1000));
  console.log('👥 USERS SERVICE | ✅ RabbitMQ consumers ready');
  
  await app.listen(3000);
  
  console.log('👥 USERS SERVICE | 🚀 Starting Users Service...');
  console.log('👥 USERS SERVICE | ✅ Users Service is running on port 3000');
  console.log('👥 USERS SERVICE | 🌐 GraphQL Playground: http://localhost:3000/graphql');
  console.log('👥 USERS SERVICE | 🐰 RabbitMQ: Connected');
  console.log('👥 USERS SERVICE | 🔐 Authentication: Ready');
  console.log('👥 USERS SERVICE | 📝 Registration: Ready');
  console.log('👥 USERS SERVICE | 📧 Email Service: Ready');
  console.log('👥 USERS SERVICE | 🔑 Password Reset: Ready');
  console.log('👥 USERS SERVICE | 🔧 Environment: ' + (process.env.NODE_ENV || 'development'));
  console.log('👥 USERS SERVICE | 🏷️ Service: users-service');
  console.log('============================================================');
}

bootstrap();
