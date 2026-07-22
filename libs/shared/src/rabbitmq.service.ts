import { Injectable, Inject, OnModuleInit, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Observable, timeout, lastValueFrom } from 'rxjs';

@Injectable()
export class RabbitMQService implements OnModuleInit {
  private readonly logger = new Logger(RabbitMQService.name);

  constructor(
    @Inject('RABBITMQ_SERVICE')
    private readonly client: ClientProxy,
    @Inject('NOTIFICATIONS_SERVICE')
    private readonly notificationsClient: ClientProxy,
    @Inject('ANALYTICS_SERVICE')
    private readonly analyticsClient: ClientProxy,
  ) {}

  async onModuleInit() {
    // Eagerly connect all client proxies so emit() works immediately
    await this.client.connect();
    await this.notificationsClient.connect();
    await this.analyticsClient.connect();
    this.logger.log('🐰 RabbitMQ clients connected (main, notifications, analytics)');
  }

  /**
   * Send a message to RabbitMQ queue
   */
  sendMessage<T = any>(pattern: string | object, data: T): Observable<any> {
    return this.client.send(pattern, data).pipe(timeout(30000));
  }

  /**
   * Emit an event to both notifications and analytics queues
   */
  emitEvent<T = any>(pattern: string, data: T): void {
    try {
      // Emit to notifications queue — subscribe to trigger the publish
      if (this.notificationsClient) {
        lastValueFrom(this.notificationsClient.emit(pattern, data)).catch((err) =>
          this.logger.error(`❌ Failed to emit "${pattern}" to notifications: ${err.message}`),
        );
      }
      // Emit to analytics queue — subscribe to trigger the publish
      if (this.analyticsClient) {
        lastValueFrom(this.analyticsClient.emit(pattern, data)).catch((err) =>
          this.logger.error(`❌ Failed to emit "${pattern}" to analytics: ${err.message}`),
        );
      }
      this.logger.log(`📤 Emitted "${pattern}" to notifications_queue + analytics_queue`);
    } catch (error) {
      console.error(`❌ RabbitMQ: Failed to emit event "${pattern}":`, error.message);
    }
  }

  /**
   * Send a message and wait for response with retry logic
   */
  async sendAndWait<T = any, R = any>(
    pattern: string,
    data: T,
    maxRetries: number = 3,
  ): Promise<R> {
    let lastError: any;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await this.sendMessage(pattern, data).toPromise() as Promise<R>;
        return result;
      } catch (error: any) {
        lastError = error;
        
        // Check if it's a "no matching handler" error (consumer not ready yet)
        const errorMessage = error?.message || error?.toString() || '';
        const isHandlerNotFound = errorMessage.includes('no matching message handler') || 
                                  errorMessage.includes('no matching handler');
        
        // Only retry if it's a handler not found error and we have retries left
        if (isHandlerNotFound && attempt < maxRetries) {
          const delay = Math.min(500 * Math.pow(2, attempt - 1), 2000); // Exponential backoff, max 2s
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        
        // If it's not a handler error or we're out of retries, throw
        throw error;
      }
    }
    
    // If we exhausted retries, throw the last error
    throw lastError;
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
