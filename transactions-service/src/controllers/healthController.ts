import { Request, Response } from 'express';
import { DatabaseConnection } from '@/config/database';
import { RedisConnection } from '@/config/redis';
import { logger } from '@/config/logger';

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
  };
}

class HealthController {
  async check(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();
    
    try {
      const [databaseStatus, redisStatus, customersServiceStatus] = await Promise.allSettled([
        DatabaseConnection.getInstance().$queryRaw`SELECT 1`,
        RedisConnection.getInstance().ping(),
        this.checkCustomersService()
      ]);

      const dbHealthy = databaseStatus.status === 'fulfilled';
      const redisHealthy = redisStatus.status === 'fulfilled';
      const customersHealthy = customersServiceStatus.status === 'fulfilled';
      const isHealthy = dbHealthy && redisHealthy && customersHealthy;

      const healthStatus: HealthStatus = {
        status: isHealthy ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
        service: 'transactions-service',
        version: process.env.npm_package_version || '1.0.0',
        uptime: process.uptime(),
        checks: {
          database: dbHealthy ? 'healthy' : 'unhealthy',
          redis: redisHealthy ? 'healthy' : 'unhealthy',
          customersService: customersHealthy ? 'healthy' : 'unhealthy'
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
        service: 'transactions-service',
        version: process.env.npm_package_version || '1.0.0',
        uptime: process.uptime(),
        checks: {
          database: 'unhealthy',
          redis: 'unhealthy',
          customersService: 'unhealthy'
        }
      };

      res.status(503).json(healthStatus);
    }
  }

  private async checkCustomersService(): Promise<void> {
    const customersServiceUrl = process.env.CUSTOMERS_SERVICE_URL || 'http://localhost:3001';
    const response = await fetch(`${customersServiceUrl}/health`, {
      method: 'GET',
      timeout: 5000
    });

    if (!response.ok) {
      throw new Error(`Customers service health check failed: ${response.status}`);
    }
  }
}

export const healthController = new HealthController();