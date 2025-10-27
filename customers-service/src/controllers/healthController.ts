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
    messageBroker: 'healthy' | 'unhealthy';
  };
}

class HealthController {
  private static instance: HealthController;
  private messageBroker?: IMessageBroker;

  constructor() {
    if (HealthController.instance) {
      return HealthController.instance;
    }
    HealthController.instance = this;
  }

  static getInstance(): HealthController {
    if (!HealthController.instance) {
      HealthController.instance = new HealthController();
    }
    return HealthController.instance;
  }

  setMessageBroker(messageBroker: IMessageBroker): void {
    logger.info('setMessageBroker called with:', { 
      messageBroker: !!messageBroker, 
      type: typeof messageBroker,
      isConnected: messageBroker ? messageBroker.isConnected() : 'N/A'
    });
    this.messageBroker = messageBroker;
    logger.info('messageBroker set, current state:', { 
      hasMessageBroker: !!this.messageBroker,
      type: typeof this.messageBroker
    });
  }

  async check(_req: Request, res: Response): Promise<void> {
    const startTime = Date.now();

    try {
      const [databaseStatus, redisStatus, rabbitmqStatus] = await Promise.allSettled([
        DatabaseConnection.getInstance().$queryRaw`SELECT 1`,
        RedisConnection.getInstance().ping(),
        this.messageBroker?.isConnected() ? Promise.resolve(true) : Promise.reject(new Error('RabbitMQ not initialized')),
      ]);

      const dbHealthy = databaseStatus.status === 'fulfilled';
      const redisHealthy = redisStatus.status === 'fulfilled';
      const rabbitmqHealthy = rabbitmqStatus.status === 'fulfilled';
      const isHealthy = dbHealthy && redisHealthy && rabbitmqHealthy;

      logger.info('Health check completed', {
        database: { status: databaseStatus.status, reason: databaseStatus.status === 'rejected' ? databaseStatus.reason : null },
        redis: { status: redisStatus.status, reason: redisStatus.status === 'rejected' ? redisStatus.reason : null },
        rabbitmq: { status: rabbitmqStatus.status, reason: rabbitmqStatus.status === 'rejected' ? rabbitmqStatus.reason : null },
      });

      const healthStatus: HealthStatus = {
        status: isHealthy ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
        service: 'customers-service',
        version: process.env['npm_package_version'] || '1.0.0',
        uptime: process.uptime(),
        checks: {
          database: dbHealthy ? 'healthy' : 'unhealthy',
          redis: redisHealthy ? 'healthy' : 'unhealthy',
          messageBroker: rabbitmqHealthy ? 'healthy' : 'unhealthy',
        },
      };

      const responseTime = Date.now() - startTime;

      logger.info('Health check completed', {
        status: healthStatus.status,
        responseTime,
        checks: healthStatus.checks,
      });

      res.status(isHealthy ? 200 : 503).json(healthStatus);
    } catch (error) {
      logger.error('Health check failed', { error });

      const healthStatus: HealthStatus = {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        service: 'customers-service',
        version: process.env['npm_package_version'] || '1.0.0',
        uptime: process.uptime(),
        checks: {
          database: 'unhealthy',
          redis: 'unhealthy',
          messageBroker: 'unhealthy',
        },
      };

      res.status(503).json(healthStatus);
    }
  }
}

export const healthController = HealthController.getInstance();
