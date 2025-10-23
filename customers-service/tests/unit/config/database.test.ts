import { DatabaseConnection } from '@/config/database';
import { PrismaClient } from '@prisma/client';
import { logger } from '@/config/logger';

jest.mock('@prisma/client');
jest.mock('@/config/logger');

describe('DatabaseConnection', () => {
  let mockPrismaClient: jest.Mocked<PrismaClient>;

  beforeEach(() => {
    mockPrismaClient = {
      $connect: jest.fn(),
      $disconnect: jest.fn(),
      $on: jest.fn(),
    } as any;

    (PrismaClient as jest.Mock).mockImplementation(() => mockPrismaClient);
    jest.clearAllMocks();
  });

  afterEach(() => {
    (DatabaseConnection as any).instance = null;
  });

  describe('getInstance', () => {
    it('should create a new instance when none exists', () => {
      const instance = DatabaseConnection.getInstance();

      expect(PrismaClient).toHaveBeenCalledWith({
        log: [
          { emit: 'event', level: 'query' },
          { emit: 'event', level: 'error' },
          { emit: 'event', level: 'info' },
          { emit: 'event', level: 'warn' }
        ]
      });
      expect(instance).toBe(mockPrismaClient);
      expect(logger.info).toHaveBeenCalledWith('Database connection established');
    });

    it('should return existing instance when already created', () => {
      const firstInstance = DatabaseConnection.getInstance();
      const secondInstance = DatabaseConnection.getInstance();

      expect(firstInstance).toBe(secondInstance);
      expect(PrismaClient).toHaveBeenCalledTimes(1);
    });

    it('should set up query logging in development environment', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      DatabaseConnection.getInstance();

      expect(mockPrismaClient.$on).toHaveBeenCalledWith('query', expect.any(Function));
      expect(mockPrismaClient.$on).toHaveBeenCalledWith('error', expect.any(Function));

      process.env.NODE_ENV = originalEnv;
    });

    it('should not set up query logging in production environment', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      DatabaseConnection.getInstance();

      expect(mockPrismaClient.$on).toHaveBeenCalledWith('error', expect.any(Function));
      expect(mockPrismaClient.$on).toHaveBeenCalledTimes(2);

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('disconnect', () => {
    it('should disconnect when instance exists', async () => {
      DatabaseConnection.getInstance();
      
      await DatabaseConnection.disconnect();

      expect(mockPrismaClient.$disconnect).toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalledWith('Database connection closed');
    });

    it('should not throw error when no instance exists', async () => {
      await expect(DatabaseConnection.disconnect()).resolves.not.toThrow();
      expect(mockPrismaClient.$disconnect).not.toHaveBeenCalled();
    });
  });

  describe('event handlers', () => {
    it('should log queries in development environment', () => {
      const originalEnv = process.env['NODE_ENV'];
      process.env['NODE_ENV'] = 'development';

      DatabaseConnection.getInstance();

      const queryHandler = (mockPrismaClient.$on as jest.Mock).mock.calls
        .find(call => call[0] === 'query')[1];

      const mockQueryEvent = {
        query: 'SELECT * FROM users',
        params: ['param1'],
        duration: 150
      };

      queryHandler(mockQueryEvent);

      expect(logger.debug).toHaveBeenCalledWith('Database Query', {
        query: 'SELECT * FROM users',
        params: ['param1'],
        duration: '150ms'
      });

      process.env['NODE_ENV'] = originalEnv;
    });

    it('should not log queries in production environment', () => {
      const originalEnv = process.env['NODE_ENV'];
      process.env['NODE_ENV'] = 'production';

      DatabaseConnection.getInstance();

      expect(mockPrismaClient.$on).toHaveBeenCalledWith('error', expect.any(Function));
      expect(mockPrismaClient.$on).toHaveBeenCalledTimes(2);

      process.env['NODE_ENV'] = originalEnv;
    });

    it('should log database errors', () => {
      DatabaseConnection.getInstance();

      const errorHandler = (mockPrismaClient.$on as jest.Mock).mock.calls
        .find(call => call[0] === 'error')[1];

      const mockError = new Error('Database error');
      errorHandler(mockError);

      expect(logger.error).toHaveBeenCalledWith('Database Error', { error: mockError });
    });
  });
});