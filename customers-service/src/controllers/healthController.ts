import { Request, Response } from 'express';
import { DatabaseConnection } from '../config/database';
import { RedisConnection } from '../config/redis';
import { logger } from '../config/logger';

interface HealthStatus {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  service: string;
  version: string;
  uptime: number;
  checks: {
    database: 'healthy' | 'unhealthy';
    redis: 'healthy' | 'unhealthy';
  };
}

class HealthController {
  async check(_req: Request, res: Response): Promise<void> {
    const startTime = Date.now();
    
    try {
      const [databaseStatus, redisStatus] = await Promise.allSettled([
        DatabaseConnection.getInstance().$queryRaw`SELECT 1`,
        RedisConnection.getInstance().ping()
      ]);

      const dbHealthy = databaseStatus.status === 'fulfilled';
      const redisHealthy = redisStatus.status === 'fulfilled';
      const isHealthy = dbHealthy && redisHealthy;

      const healthStatus: HealthStatus = {
        status: isHealthy ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
        service: 'customers-service',
        version: process.env['npm_package_version'] || '1.0.0',
        uptime: process.uptime(),
        checks: {
          database: dbHealthy ? 'healthy' : 'unhealthy',
          redis: redisHealthy ? 'healthy' : 'unhealthy'
        }
      };

      const responseTime = Date.now() - startTime;
      
      logger.info('Health check completed', {
        status: healthStatus.status,
        responseTime,
        checks: healthStatus.checks
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
          redis: 'unhealthy'
        }
      };

      res.status(503).json(healthStatus);
    }
  }
}

export const healthController = new HealthController();