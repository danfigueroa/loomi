import { createClient, RedisClientType } from 'redis';
import { logger } from './logger';

class RedisConnection {
  private static instance: RedisClientType;
  private static isConnecting = false;

  public static getInstance(): RedisClientType {
    if (!RedisConnection.instance) {
      const redisUrl = process.env['REDIS_URL'] || 'redis://localhost:6379';
      
      RedisConnection.instance = createClient({
        url: redisUrl,
        socket: {
          connectTimeout: 5000,
          reconnectStrategy: (retries) => {
            if (retries > 3) {
              logger.error('Redis max reconnection attempts reached');
              return false;
            }
            return Math.min(retries * 50, 500);
          }
        }
      });

      RedisConnection.instance.on('error', (err) => {
        logger.error('Redis Client Error', { error: err.message });
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

      logger.info('Redis client instance created');
    }

    return RedisConnection.instance;
  }

  public static async connect(): Promise<void> {
    if (RedisConnection.isConnecting) {
      logger.info('Redis connection already in progress');
      return;
    }

    const instance = RedisConnection.getInstance();
    
    if (instance.isReady) {
      logger.info('Redis already connected');
      return;
    }

    try {
      RedisConnection.isConnecting = true;
      
      const connectPromise = instance.connect();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Redis connection timeout')), 8000)
      );
      
      await Promise.race([connectPromise, timeoutPromise]);
      logger.info('Redis connection established successfully');
    } catch (error) {
      logger.error('Failed to connect to Redis', { error: error instanceof Error ? error.message : String(error) });
      throw error;
    } finally {
      RedisConnection.isConnecting = false;
    }
  }

  public static async disconnect(): Promise<void> {
    if (RedisConnection.instance && RedisConnection.instance.isReady) {
      try {
        await RedisConnection.instance.disconnect();
        logger.info('Redis disconnected successfully');
      } catch (error) {
        logger.error('Error disconnecting Redis', { error: error instanceof Error ? error.message : String(error) });
      }
    }
  }

  public static async ping(): Promise<string> {
    try {
      const instance = RedisConnection.getInstance();
      
      if (!instance.isReady) {
        logger.info('Redis not ready for ping, connecting first...');
        await RedisConnection.connect();
      }
      
      const pingPromise = instance.ping();
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Redis ping timeout')), 3000)
      );
      
      const result = await Promise.race([pingPromise, timeoutPromise]);
      logger.info('Redis ping successful', { result });
      return result;
    } catch (error) {
      logger.error('Redis ping failed', { error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }
}

export { RedisConnection };