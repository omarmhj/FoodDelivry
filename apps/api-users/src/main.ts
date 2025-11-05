import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { UsersModule } from './user.module';

async function bootstrap() {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║ 👥 USERS SERVICE                                           ║
║ User Authentication & Management System                      ║
╚══════════════════════════════════════════════════════════════╝`);

  const app = await NestFactory.create<NestExpressApplication>(UsersModule);

  // Connect to RabbitMQ as a microservice consumer
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [process.env.RABBITMQ_URL || 'amqp://admin:rabbit123@localhost:5672'],
      queue: 'snackrapido_queue',
      queueOptions: {
        durable: true,
      },
    },
  });

  app.useStaticAssets(join(__dirname, '..', 'public'));
  app.setBaseViewsDir(join(__dirname, '..', 'email-templates'));
  app.setViewEngine('ejs');

  app.enableCors({
    origin: '*',
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
