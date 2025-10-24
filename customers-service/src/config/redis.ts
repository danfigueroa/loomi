import { createClient, RedisClientType } from 'redis';
import { logger } from './logger';

class RedisConnection {
  private static instance: RedisClientType;

  public static getInstance(): RedisClientType {
    if (!RedisConnection.instance) {
      const redisUrl = process.env['REDIS_URL'] || 'redis://localhost:6379';
      
      RedisConnection.instance = createClient({
        url: redisUrl,
      });

      RedisConnection.instance.on('error', (err) => {
        logger.error('Redis Client Error', { error: err });
      });

      RedisConnection.instance.on('connect', () => {
        logger.info('Redis connection established');
      });

      RedisConnection.instance.on('ready', () => {
        logger.info('Redis client ready');
      });

      RedisConnection.instance.on('end', () => {
        logger.info('Redis connection closed');
      });

      // Connect to Redis
      RedisConnection.instance.connect().catch((err) => {
        logger.error('Failed to connect to Redis', { error: err });
      });
    }

    return RedisConnection.instance;
  }

  public static async disconnect(): Promise<void> {
    if (RedisConnection.instance) {
      await RedisConnection.instance.quit();
      logger.info('Redis connection closed');
    }
  }
}

export { RedisConnection };