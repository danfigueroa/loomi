import { Request, Response } from 'express';
import { healthController } from '../../../src/controllers/healthController';
import { DatabaseConnection } from '../../../src/config/database';
import { RedisConnection } from '../../../src/config/redis';
import { logger } from '../../../src/config/logger';
// import { RabbitMQBroker } from '../../../src/infrastructure/messaging/RabbitMQBroker';

jest.mock('../../../src/config/database');
jest.mock('../../../src/config/redis');
jest.mock('../../../src/config/logger');
jest.mock('../../../src/infrastructure/messaging/RabbitMQBroker');

describe('HealthController', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;

  beforeEach(() => {
    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnValue({ json: mockJson });
    mockRequest = {};
    mockResponse = {
      status: mockStatus,
      json: mockJson
    };

    jest.clearAllMocks();
  });

  describe('check', () => {
    it('should return healthy status when all services are available', async () => {
      const mockDatabase = {
        $queryRaw: jest.fn().mockResolvedValue([{ '?column?': 1 }])
      };
      const mockRedis = {
        ping: jest.fn().mockResolvedValue('PONG')
      };
      const mockMessageBroker = {
        isConnected: jest.fn().mockReturnValue(true)
      };

      (DatabaseConnection.getInstance as jest.Mock).mockReturnValue(mockDatabase);
      (RedisConnection.getInstance as jest.Mock).mockReturnValue(mockRedis);
      
      // Mock the healthController's messageBroker property
      (healthController as any).messageBroker = mockMessageBroker;

      await healthController.check(mockRequest as any, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'healthy',
          service: 'customers-service',
          checks: {
            database: 'healthy',
            redis: 'healthy',
            messageBroker: 'healthy'
          }
        })
      );
    });

    it('should return unhealthy status when database is unavailable', async () => {
      const mockDatabase = {
        $queryRaw: jest.fn().mockRejectedValue(new Error('Database connection failed'))
      };
      const mockRedis = {
        ping: jest.fn().mockResolvedValue('PONG')
      };
      const mockMessageBroker = {
        isConnected: jest.fn().mockReturnValue(true)
      };

      (DatabaseConnection.getInstance as jest.Mock).mockReturnValue(mockDatabase);
      (RedisConnection.getInstance as jest.Mock).mockReturnValue(mockRedis);
      (healthController as any).messageBroker = mockMessageBroker;

      await healthController.check(mockRequest as any, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(503);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'unhealthy',
          checks: {
            database: 'unhealthy',
            redis: 'healthy',
            messageBroker: 'healthy'
          }
        })
      );
    });

    it('should return unhealthy status when redis is unavailable', async () => {
      const mockDatabase = {
        $queryRaw: jest.fn().mockResolvedValue([{ '?column?': 1 }])
      };
      const mockRedis = {
        ping: jest.fn().mockRejectedValue(new Error('Redis connection failed'))
      };
      const mockMessageBroker = {
        isConnected: jest.fn().mockReturnValue(true)
      };

      (DatabaseConnection.getInstance as jest.Mock).mockReturnValue(mockDatabase);
      (RedisConnection.getInstance as jest.Mock).mockReturnValue(mockRedis);
      (healthController as any).messageBroker = mockMessageBroker;

      await healthController.check(mockRequest as any, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(503);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'unhealthy',
          checks: {
            database: 'healthy',
            redis: 'unhealthy',
            messageBroker: 'healthy'
          }
        })
      );
    });

    it('should return unhealthy status when both services are unavailable', async () => {
      const mockDatabase = {
        $queryRaw: jest.fn().mockRejectedValue(new Error('Database connection failed'))
      };
      const mockRedis = {
        ping: jest.fn().mockRejectedValue(new Error('Redis connection failed'))
      };
      const mockMessageBroker = {
        isConnected: jest.fn().mockReturnValue(false)
      };

      (DatabaseConnection.getInstance as jest.Mock).mockReturnValue(mockDatabase);
      (RedisConnection.getInstance as jest.Mock).mockReturnValue(mockRedis);
      (healthController as any).messageBroker = mockMessageBroker;

      await healthController.check(mockRequest as any, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(503);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'unhealthy',
          checks: {
            database: 'unhealthy',
            redis: 'unhealthy',
            messageBroker: 'unhealthy'
          }
        })
      );
    });

    it('should handle unexpected errors gracefully', async () => {
      (DatabaseConnection.getInstance as jest.Mock).mockImplementation(() => {
        throw new Error('Unexpected error');
      });
      const mockMessageBroker = {
        isConnected: jest.fn().mockReturnValue(false)
      };
      (healthController as any).messageBroker = mockMessageBroker;

      await healthController.check(mockRequest as any, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(503);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'unhealthy',
          checks: {
            database: 'unhealthy',
            redis: 'unhealthy',
            messageBroker: 'unhealthy'
          }
        })
      );
    });

    it('should log health check completion', async () => {
      const mockDatabase = {
        $queryRaw: jest.fn().mockResolvedValue([{ '?column?': 1 }])
      };
      const mockRedis = {
        ping: jest.fn().mockResolvedValue('PONG')
      };
      const mockMessageBroker = {
        isConnected: jest.fn().mockReturnValue(true)
      };

      (DatabaseConnection.getInstance as jest.Mock).mockReturnValue(mockDatabase);
      (RedisConnection.getInstance as jest.Mock).mockReturnValue(mockRedis);
      (healthController as any).messageBroker = mockMessageBroker;

      await healthController.check(mockRequest as any, mockResponse as Response);

      expect(logger.info).toHaveBeenCalledWith(
        'Health check completed',
        expect.objectContaining({
          status: 'healthy',
          responseTime: expect.any(Number),
          checks: {
            database: 'healthy',
            redis: 'healthy',
            messageBroker: 'healthy'
          }
        })
      );
    });

    it('should log errors when health check fails', async () => {
      (DatabaseConnection.getInstance as jest.Mock).mockImplementation(() => {
        throw new Error('Unexpected error');
      });
      const mockMessageBroker = {
        isConnected: jest.fn().mockReturnValue(false)
      };
      (healthController as any).messageBroker = mockMessageBroker;

      await healthController.check(mockRequest as any, mockResponse as Response);

      expect(logger.error).toHaveBeenCalledWith(
        'Health check failed',
        { error: expect.any(Error) }
      );
    });
  });
});