import request from 'supertest';
import { app } from '@/app';
import { DatabaseConnection } from '@/config/database';
import { RedisConnection } from '@/config/redis';
import { TransactionStatus } from '@/domain/entities/Transaction';
import jwt from 'jsonwebtoken';

describe('Transaction Integration Tests', () => {
  let authToken: string;
  let testUserId: string;

  beforeAll(async () => {
    process.env['NODE_ENV'] = 'test';
    process.env['DATABASE_URL'] = 'postgresql://postgres:password@localhost:5432/transactions_test_db?schema=public';
    process.env['REDIS_URL'] = 'redis://localhost:6379/1';
    process.env['JWT_SECRET'] = 'test-jwt-secret';
    process.env['CUSTOMERS_SERVICE_URL'] = 'http://localhost:3001';

    testUserId = 'test-user-123';
    authToken = jwt.sign(
      { userId: testUserId, email: 'test@example.com' },
      process.env['JWT_SECRET']!,
      { expiresIn: '1h' }
    );
  });

  afterAll(async () => {
    await DatabaseConnection.disconnect();
    await RedisConnection.disconnect();
  });

  describe('POST /api/transactions', () => {
    const validTransactionData = {
      fromUserId: 'user-123',
      toUserId: 'user-456',
      amount: 100.50,
      description: 'Test transaction'
    };

    it('should create transaction successfully with valid data', async () => {
      const response = await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-correlation-id', 'test-correlation-123')
        .send(validTransactionData)
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          fromUserId: validTransactionData.fromUserId,
          toUserId: validTransactionData.toUserId,
          amount: validTransactionData.amount,
          description: validTransactionData.description,
          status: TransactionStatus.PENDING
        }
      });

      expect(response.body.data.id).toBeDefined();
      expect(response.body.data.externalReference).toBeDefined();
      expect(response.body.data.createdAt).toBeDefined();
      expect(response.headers['x-correlation-id']).toBe('test-correlation-123');
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .post('/api/transactions')
        .send(validTransactionData)
        .expect(401);

      expect(response.body.error).toBe('Access token required');
    });

    it('should return 400 for invalid amount', async () => {
      const invalidData = { ...validTransactionData, amount: -50 };

      const response = await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.error).toContain('amount');
    });

    it('should return 400 for same user transfer', async () => {
      const invalidData = { ...validTransactionData, toUserId: validTransactionData.fromUserId };

      const response = await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.error).toBe('Cannot transfer to the same user');
    });

    it('should return 400 for missing required fields', async () => {
      const invalidData = { amount: 100 };

      const response = await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.error).toContain('required');
    });

    it('should handle rate limiting', async () => {
      const requests = Array.from({ length: 25 }, () =>
        request(app)
          .post('/api/transactions')
          .set('Authorization', `Bearer ${authToken}`)
          .send(validTransactionData)
      );

      const responses = await Promise.all(requests);
      const rateLimitedResponses = responses.filter(res => res.status === 429);
      
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    }, 30000);
  });

  describe('GET /api/transactions/:id', () => {
    let transactionId: string;

    beforeEach(async () => {
      const createResponse = await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          fromUserId: 'user-123',
          toUserId: 'user-456',
          amount: 75.25,
          description: 'Test transaction for GET'
        });

      transactionId = createResponse.body.data.id;
    });

    it('should return transaction by id', async () => {
      const response = await request(app)
        .get(`/api/transactions/${transactionId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          id: transactionId,
          amount: 75.25,
          description: 'Test transaction for GET',
          status: TransactionStatus.PENDING
        }
      });
    });

    it('should return 404 for non-existent transaction', async () => {
      const response = await request(app)
        .get('/api/transactions/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.error).toBe('Transaction not found');
    });

    it('should return 401 without authentication', async () => {
      await request(app)
        .get(`/api/transactions/${transactionId}`)
        .expect(401);
    });

    it('should return 400 for invalid transaction id format', async () => {
      const response = await request(app)
        .get('/api/transactions/invalid-id-format')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.error).toContain('id');
    });
  });

  describe('GET /api/transactions/user/:userId', () => {
    beforeEach(async () => {
      const transactions = [
        {
          fromUserId: testUserId,
          toUserId: 'user-456',
          amount: 50,
          description: 'Transaction 1'
        },
        {
          fromUserId: 'user-789',
          toUserId: testUserId,
          amount: 75,
          description: 'Transaction 2'
        }
      ];

      for (const transaction of transactions) {
        await request(app)
          .post('/api/transactions')
          .set('Authorization', `Bearer ${authToken}`)
          .send(transaction);
      }
    });

    it('should return user transactions with pagination', async () => {
      const response = await request(app)
        .get(`/api/transactions/user/${testUserId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .query({ page: 1, limit: 10 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      
      response.body.data.forEach((transaction: any) => {
        expect(
          transaction.fromUserId === testUserId || transaction.toUserId === testUserId
        ).toBe(true);
      });
    });

    it('should return empty array for user with no transactions', async () => {
      const response = await request(app)
        .get('/api/transactions/user/user-without-transactions')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data).toEqual([]);
    });

    it('should handle pagination parameters', async () => {
      const response = await request(app)
        .get(`/api/transactions/user/${testUserId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .query({ page: 1, limit: 1 })
        .expect(200);

      expect(response.body.data.length).toBeLessThanOrEqual(1);
    });

    it('should return 400 for invalid pagination parameters', async () => {
      const response = await request(app)
        .get(`/api/transactions/user/${testUserId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .query({ page: -1, limit: 0 })
        .expect(400);

      expect(response.body.error).toContain('page');
    });

    it('should return 401 without authentication', async () => {
      await request(app)
        .get(`/api/transactions/user/${testUserId}`)
        .expect(401);
    });
  });

  describe('Middleware Integration', () => {
    it('should include correlation id in all responses', async () => {
      const correlationId = 'integration-test-correlation';

      const response = await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-correlation-id', correlationId)
        .send({
          fromUserId: 'user-123',
          toUserId: 'user-456',
          amount: 100,
          description: 'Correlation test'
        })
        .expect(201);

      expect(response.headers['x-correlation-id']).toBe(correlationId);
    });

    it('should handle request logging', async () => {
      const response = await request(app)
        .get('/health')
        .set('x-correlation-id', 'logging-test')
        .expect(200);

      expect(response.headers['x-correlation-id']).toBe('logging-test');
    });

    it('should handle error responses with proper format', async () => {
      const response = await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ invalid: 'data' })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('path');
    });
  });

  describe('Database Integration', () => {
    it('should persist transaction data correctly', async () => {
      const transactionData = {
        fromUserId: 'persistence-test-from',
        toUserId: 'persistence-test-to',
        amount: 123.45,
        description: 'Persistence test transaction'
      };

      const createResponse = await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${authToken}`)
        .send(transactionData)
        .expect(201);

      const transactionId = createResponse.body.data.id;

      const getResponse = await request(app)
        .get(`/api/transactions/${transactionId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(getResponse.body.data).toMatchObject({
        id: transactionId,
        fromUserId: transactionData.fromUserId,
        toUserId: transactionData.toUserId,
        amount: transactionData.amount,
        description: transactionData.description,
        status: TransactionStatus.PENDING
      });
    });
  });
});