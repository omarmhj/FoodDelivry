import { NestFactory } from "@nestjs/core";
import { NestExpressApplication } from "@nestjs/platform-express";
import { MicroserviceOptions, Transport } from "@nestjs/microservices";
import { join } from "path";
import { restaurantModule } from "./restaurant.module";
import * as express from "express";

async function bootstrap() {
  console.log(`\n╔══════════════════════════════════════════════════════════════╗
║ 🍕 RESTAURANTS SERVICE                                     ║
║ Restaurant & Menu Management System                          ║
╚══════════════════════════════════════════════════════════════╝`);

  const app =
    await NestFactory.create<NestExpressApplication>(restaurantModule);

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

  app.use(express.json({ limit: "50mb" }));
  app.useStaticAssets(join(__dirname, "..", "public"));
  app.setBaseViewsDir(
    join(__dirname, "..", "apps/api-restaurants/email-templates")
  );
  app.setViewEngine("ejs");

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
    exposedHeaders: ['accesstoken', 'refreshtoken', 'access-token', 'refresh-token'],
  });

  // Start all microservices and wait for connection
  await app.startAllMicroservices();
  
  // Wait a bit for RabbitMQ consumers to be fully registered
  console.log('🍕 RESTAURANTS SERVICE | 🔄 Waiting for RabbitMQ consumers to initialize...');
  await new Promise(resolve => setTimeout(resolve, 1000));
  console.log('🍕 RESTAURANTS SERVICE | ✅ RabbitMQ consumers ready');

  await app.listen(4001);
  
  console.log('🍕 RESTAURANTS SERVICE | 🚀 Starting Restaurants Service...');
  console.log('🍕 RESTAURANTS SERVICE | ✅ Restaurants Service is running on port 4001');
  console.log('🍕 RESTAURANTS SERVICE | 🌐 GraphQL Playground: http://localhost:4001/graphql');
  console.log('🍕 RESTAURANTS SERVICE | 🐰 RabbitMQ: Connected');
  console.log('🍕 RESTAURANTS SERVICE | 📋 RabbitMQ Handlers:');
  console.log('   - restaurant.validate');
  console.log('   - menu.validateItems');
  console.log('🍕 RESTAURANTS SERVICE | 🏪 Restaurant Management: Ready');
  console.log('🍕 RESTAURANTS SERVICE | 🍔 Menu Management: Ready');
  console.log('🍕 RESTAURANTS SERVICE | 📸 Image Upload: Ready');
  console.log('🍕 RESTAURANTS SERVICE | ⭐ Reviews & Ratings: Ready');
  console.log('🍕 RESTAURANTS SERVICE | 🔧 Environment: ' + (process.env.NODE_ENV || 'development'));
  console.log('🍕 RESTAURANTS SERVICE | 🏷️ Service: restaurants-service');
  console.log('============================================================');
}
bootstrap();
