// Mock the database and Redis connections for all tests
jest.mock('../src/config/database', () => ({
  DatabaseConnection: {
    getInstance: jest.fn().mockReturnValue({
      $queryRaw: jest.fn().mockResolvedValue([{ '?column?': 1 }]),
      $connect: jest.fn().mockResolvedValue(undefined),
      $disconnect: jest.fn().mockResolvedValue(undefined),
    }),
    disconnect: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock('../src/config/redis', () => ({
  RedisConnection: {
    getInstance: jest.fn().mockReturnValue({
      ping: jest.fn().mockResolvedValue('PONG'),
      disconnect: jest.fn().mockResolvedValue(undefined),
    }),
    disconnect: jest.fn().mockResolvedValue(undefined),
  },
}));

// Mock RabbitMQ message broker
jest.mock('../src/infrastructure/messaging/RabbitMQBroker', () => ({
  RabbitMQBroker: jest.fn().mockImplementation(() => ({
    connect: jest.fn().mockResolvedValue(undefined),
    disconnect: jest.fn().mockResolvedValue(undefined),
    isConnected: jest.fn().mockReturnValue(true),
    publish: jest.fn().mockResolvedValue(undefined),
  })),
}));

// Mock the logger to avoid console output during tests
jest.mock('../src/config/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

// Set test environment variables
process.env['NODE_ENV'] = 'test';
process.env['DATABASE_URL'] = 'postgresql://test:test@localhost:5432/test_db';
process.env['REDIS_URL'] = 'redis://localhost:6379/1';
process.env['PORT'] = '3001';