import { Injectable, Inject } from '@nestjs/common';
import { Redis } from 'ioredis';

@Injectable()
export class RedisService {
  constructor(
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
  ) {}

  /**
   * Set a key-value pair with optional expiration
   */
  async set(
    key: string,
    value: string | number | object,
    ttl?: number,
  ): Promise<'OK'> {
    console.log(`🔴 REDIS SERVICE: Setting key "${key}" with TTL ${ttl}`);
    console.log(`🔴 REDIS SERVICE: Value type: ${typeof value}`);
    
    const serializedValue = typeof value === 'object' 
      ? JSON.stringify(value) 
      : String(value);
    
    try {
      let result;
      if (ttl) {
        result = await this.redis.setex(key, ttl, serializedValue);
        console.log(`🔴 REDIS SERVICE: SETEX result:`, result);
      } else {
        result = await this.redis.set(key, serializedValue);
        console.log(`🔴 REDIS SERVICE: SET result:`, result);
      }
      
      // Verify the key was actually set
      const verification = await this.redis.get(key);
      console.log(`🔴 REDIS SERVICE: Verification - key "${key}" exists:`, !!verification);
      
      return result;
    } catch (error) {
      console.error(`🔴 REDIS SERVICE: Error setting key "${key}":`, error.message);
      throw error;
    }
  }

  /**
   * Get a value by key
   */
  async get(key: string): Promise<string | null> {
    return this.redis.get(key);
  }

  /**
   * Get a value and parse it as JSON
   */
  async getJson<T = any>(key: string): Promise<T | null> {
    const value = await this.redis.get(key);
    if (!value) return null;
    
    try {
      return JSON.parse(value);
    } catch (error) {
      return null;
    }
  }

  /**
   * Delete a key
   */
  async del(key: string): Promise<number> {
    return this.redis.del(key);
  }

  /**
   * Check if a key exists
   */
  async exists(key: string): Promise<boolean> {
    const result = await this.redis.exists(key);
    return result === 1;
  }

  /**
   * Set expiration for a key
   */
  async expire(key: string, seconds: number): Promise<boolean> {
    const result = await this.redis.expire(key, seconds);
    return result === 1;
  }

  /**
   * Get time to live for a key
   */
  async ttl(key: string): Promise<number> {
    return this.redis.ttl(key);
  }

  /**
   * Increment a numeric value
   */
  async incr(key: string): Promise<number> {
    return this.redis.incr(key);
  }

  /**
   * Increment a numeric value by a specific amount
   */
  async incrby(key: string, increment: number): Promise<number> {
    return this.redis.incrby(key, increment);
  }

  /**
   * Publish a message to a channel
   */
  async publish(channel: string, message: string | object): Promise<number> {
    const serializedMessage = typeof message === 'object' 
      ? JSON.stringify(message) 
      : message;
    return this.redis.publish(channel, serializedMessage);
  }

  /**
   * Subscribe to a channel
   */
  async subscribe(channel: string, callback: (message: string) => void): Promise<void> {
    const subscriber = this.redis.duplicate();
    await subscriber.subscribe(channel);
    
    subscriber.on('message', (receivedChannel, message) => {
      if (receivedChannel === channel) {
        callback(message);
      }
    });
  }

  /**
   * Health check for Redis connection
   */
  async healthCheck(): Promise<boolean> {
    try {
      const result = await this.redis.ping();
      return result === 'PONG';
    } catch (error) {
      return false;
    }
  }

  /**
   * Get all keys matching a pattern
   */
  async keys(pattern: string): Promise<string[]> {
    return this.redis.keys(pattern);
  }

  /**
   * Flush all data (use with caution)
   */
  async flushAll(): Promise<'OK'> {
    return this.redis.flushall();
  }

}
