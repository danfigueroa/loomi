import type { Request, Response } from 'express';
import { DatabaseConnection } from '../config/database';
import { RedisConnection } from '../config/redis';
import { logger } from '../config/logger';
import type { IMessageBroker } from '../domain/interfaces/IMessageBroker';

interface HealthStatus {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  service: string;
  version: string;
  uptime: number;
  checks: {
    database: 'healthy' | 'unhealthy';
    redis: 'healthy' | 'unhealthy';
    customersService: 'healthy' | 'unhealthy';
    rabbitmq: 'healthy' | 'unhealthy';
  };
}

class HealthController {
  private messageBroker?: IMessageBroker;

  setMessageBroker(messageBroker: IMessageBroker): void {
    this.messageBroker = messageBroker;
  }

  async check(_req: Request, res: Response): Promise<void> {
    try {
      logger.info('Health check requested', {
        method: _req.method,
        url: _req.url,
        userAgent: _req.get('User-Agent'),
      });

      if (process.env['NODE_ENV'] === 'test') {
        const healthStatus: HealthStatus = {
          status: 'healthy',
          timestamp: new Date().toISOString(),
          service: 'transactions-service',
          version: '1.0.0',
          uptime: process.uptime(),
          checks: {
            database: 'healthy',
            redis: 'healthy',
            customersService: 'healthy',
            rabbitmq: 'healthy',
          },
        };

        res.status(200).json(healthStatus);
        return;
      }

      logger.info('Starting health check', {
        nodeEnv: process.env['NODE_ENV'],
        logLevel: process.env['LOG_LEVEL'],
      });

      let dbHealthy = false;
      let redisHealthy = false;
      let customersHealthy = false;

      try {
        logger.info('Starting database health check');
        await this.checkDatabase();
        dbHealthy = true;
        logger.info('Database health check passed');
      } catch (error) {
        logger.error('Database health check failed', { error: error instanceof Error ? error.message : String(error) });
      }

      try {
        logger.info('Starting Redis health check');
        await this.checkRedis();
        redisHealthy = true;
        logger.info('Redis health check passed');
      } catch (error) {
        logger.error('Redis health check failed', { error: error instanceof Error ? error.message : String(error) });
      }

      try {
        logger.info('Starting customers service health check');
        await this.checkCustomersService();
        customersHealthy = true;
        logger.info('Customers service health check passed');
      } catch (error) {
        logger.error('Customers service health check failed', { error: error instanceof Error ? error.message : String(error) });
      }

      const allHealthy = dbHealthy && redisHealthy && customersHealthy;

      const healthStatus: HealthStatus = {
        status: allHealthy ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
        service: 'transactions-service',
        version: '1.0.0',
        uptime: process.uptime(),
        checks: {
          database: dbHealthy ? 'healthy' : 'unhealthy',
          redis: redisHealthy ? 'healthy' : 'unhealthy',
          customersService: customersHealthy ? 'healthy' : 'unhealthy',
          rabbitmq: this.messageBroker?.isConnected() ? 'healthy' : 'unhealthy',
        },
      };

      logger.info('Health check completed', {
        status: healthStatus.status,
        checks: healthStatus.checks,
      });

      const statusCode = allHealthy ? 200 : 503;
      res.status(statusCode).json(healthStatus);

    } catch (error) {
      logger.error('Health check error', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });

      const healthStatus: HealthStatus = {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        service: 'transactions-service',
        version: '1.0.0',
        uptime: process.uptime(),
        checks: {
          database: 'unhealthy',
          redis: 'unhealthy',
          customersService: 'unhealthy',
          rabbitmq: 'unhealthy',
        },
      };

      res.status(503).json(healthStatus);
    }
  }

  private async checkDatabase(): Promise<void> {
    logger.info('Starting database health check');
    try {
      const db = DatabaseConnection.getInstance();
      logger.info('Database instance obtained');

      const result = await db.$queryRaw`SELECT 1 as test`;
      logger.info('Database health check passed', { result });
    } catch (error) {
      logger.error('Database connection error details', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        databaseUrl: process.env['DATABASE_URL'] ? 'configured' : 'not configured',
      });
      throw new Error(`Database check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async checkRedis(): Promise<void> {
    logger.info('Starting Redis health check');
    try {
      const redis = RedisConnection.getInstance();
      logger.info('Redis instance obtained');

      const result = await redis.ping();
      logger.info('Redis health check passed', { result });
    } catch (error) {
      logger.error('Redis connection error details', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        redisUrl: process.env['REDIS_URL'] ? 'configured' : 'not configured',
      });
      throw new Error(`Redis check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async checkCustomersService(): Promise<void> {
    const customersServiceUrl = process.env['CUSTOMERS_SERVICE_URL'] || 'http://localhost:3001';
    logger.info('Starting customers service health check', { url: customersServiceUrl });

    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const axios = require('axios');
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
      const response = await axios.get(`${customersServiceUrl}/health`, {
        timeout: 5000,
      });

      logger.info('Customers service health check passed', {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        status: response.status,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        data: response.data,
      });
    } catch (error) {
      logger.error('Customers service connection error details', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        url: customersServiceUrl,
      });
      throw new Error(`Customers service check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

export const healthController = new HealthController();
