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
  sendMessage<T = any>(pattern: string | object, data: T): Observable<any> {
    return this.client.send(pattern, data).pipe(timeout(30000)); // Increased to 30 seconds
  }

  /**
   * Emit an event to RabbitMQ
   */
  emitEvent<T = any>(pattern: string, data: T): void {
    this.client.emit(pattern, data);
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
