import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SharedMicroservicesModule } from './microservices.module';
import { RedisModule } from './redis.module';
import { RabbitMQService } from './rabbitmq.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    SharedMicroservicesModule,
    RedisModule,
  ],
  providers: [RabbitMQService],
  exports: [RabbitMQService],
})
export class SharedModule {}
