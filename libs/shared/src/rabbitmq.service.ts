import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Observable, timeout } from 'rxjs';

@Injectable()
export class RabbitMQService {
  constructor(
    @Inject('RABBITMQ_SERVICE') private readonly client: ClientProxy,
  ) {}

  /**
   * Send a message to RabbitMQ queue
   */
  sendMessage<T = any>(pattern: string, data: T): Observable<any> {
    return this.client.send(pattern, data).pipe(timeout(5000));
  }

  /**
   * Emit an event to RabbitMQ
   */
  emitEvent<T = any>(pattern: string, data: T): void {
    this.client.emit(pattern, data);
  }

  /**
   * Send a message and wait for response
   */
  async sendAndWait<T = any, R = any>(
    pattern: string,
    data: T,
  ): Promise<R> {
    return this.sendMessage(pattern, data).toPromise() as Promise<R>;
  }

  /**
   * Health check for RabbitMQ connection
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.sendMessage('health_check', {}).toPromise();
      return true;
    } catch (error) {
      return false;
    }
  }
}
