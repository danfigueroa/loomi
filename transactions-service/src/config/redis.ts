import Redis from 'ioredis';
import { logger } from './logger';

class RedisConnection {
  private static instance: Redis;

  public static getInstance(): Redis {
    if (!RedisConnection.instance) {
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
      
      RedisConnection.instance = new Redis(redisUrl, {
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3,
        lazyConnect: true,
      });

      RedisConnection.instance.on('connect', () => {
        logger.info('Redis connected successfully');
      });

      RedisConnection.instance.on('error', (error) => {
        logger.error('Redis connection error', { error: error.message });
      });

      RedisConnection.instance.on('close', () => {
        logger.warn('Redis connection closed');
      });
    }

    return RedisConnection.instance;
  }

  public static async disconnect(): Promise<void> {
    if (RedisConnection.instance) {
      await RedisConnection.instance.quit();
    }
  }
}

export const redis = RedisConnection.getInstance();
export { RedisConnection };