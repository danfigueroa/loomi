import { DatabaseConnection } from '@/config/database';
import { RedisConnection } from '@/config/redis';

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  process.env.DATABASE_URL = 'postgresql://postgres:password@localhost:5432/transactions_test_db?schema=public';
  process.env.REDIS_URL = 'redis://localhost:6379/1';
  process.env.JWT_SECRET = 'test-jwt-secret';
  process.env.CUSTOMERS_SERVICE_URL = 'http://localhost:3001';
});

afterAll(async () => {
  await DatabaseConnection.disconnect();
  await RedisConnection.disconnect();
});