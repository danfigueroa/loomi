// Mock the database and Redis connections for all tests
jest.mock('@/config/database', () => ({
  DatabaseConnection: {
    getInstance: jest.fn().mockReturnValue({
      $queryRaw: jest.fn().mockResolvedValue([{ '?column?': 1 }]),
      $connect: jest.fn().mockResolvedValue(undefined),
      $disconnect: jest.fn().mockResolvedValue(undefined),
      transaction: {
        findMany: jest.fn().mockResolvedValue([]),
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({ id: 'test-id' }),
        update: jest.fn().mockResolvedValue({ id: 'test-id' }),
        delete: jest.fn().mockResolvedValue({ id: 'test-id' }),
      },
    }),
    disconnect: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock('@/config/redis', () => ({
  RedisConnection: {
    getInstance: jest.fn().mockReturnValue({
      ping: jest.fn().mockResolvedValue('PONG'),
      disconnect: jest.fn().mockResolvedValue(undefined),
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue('OK'),
      del: jest.fn().mockResolvedValue(1),
    }),
    disconnect: jest.fn().mockResolvedValue(undefined),
  },
}));

// Mock the logger to avoid console output during tests
jest.mock('@/config/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

// Mock HTTP client for external service calls
jest.mock('axios', () => ({
  default: {
    get: jest.fn().mockResolvedValue({ data: { status: 'healthy' } }),
    post: jest.fn().mockResolvedValue({ data: { success: true } }),
    put: jest.fn().mockResolvedValue({ data: { success: true } }),
    delete: jest.fn().mockResolvedValue({ data: { success: true } }),
  },
}));

// Set test environment variables
process.env['NODE_ENV'] = 'test';
process.env['DATABASE_URL'] = 'postgresql://test:test@localhost:5432/test_db';
process.env['REDIS_URL'] = 'redis://localhost:6379/1';
process.env['JWT_SECRET'] = 'test-jwt-secret';
process.env['CUSTOMERS_SERVICE_URL'] = 'http://localhost:3001';
process.env['PORT'] = '3002';