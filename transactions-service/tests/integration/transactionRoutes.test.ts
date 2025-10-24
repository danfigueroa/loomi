import request from 'supertest';
import jwt from 'jsonwebtoken';
import { app } from '../../src/app';

// Mock database connection for integration tests
jest.mock('../../src/config/database', () => {
  const mockTransactions: any[] = [];
  
  return {
    DatabaseConnection: {
      getInstance: jest.fn().mockReturnValue({
        $queryRaw: jest.fn().mockResolvedValue([{ '?column?': 1 }]),
        $connect: jest.fn().mockResolvedValue(undefined),
        $disconnect: jest.fn().mockResolvedValue(undefined),
        transaction: {
          deleteMany: jest.fn().mockImplementation(() => {
            mockTransactions.length = 0;
            return Promise.resolve({ count: 0 });
          }),
          create: jest.fn().mockImplementation(({ data }) => {
            const transaction = {
              id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              ...data,
              createdAt: new Date(),
              updatedAt: new Date(),
              processedAt: null
            };
            mockTransactions.push(transaction);
            return Promise.resolve(transaction);
          }),
          findMany: jest.fn().mockImplementation((params) => {
            let filtered = mockTransactions;
            
            if (params?.where?.OR) {
              filtered = mockTransactions.filter(tx => 
                params.where.OR.some((condition: any) => 
                  (condition.fromUserId && tx.fromUserId === condition.fromUserId) ||
                  (condition.toUserId && tx.toUserId === condition.toUserId)
                )
              );
            }
            
            const skip = params?.skip || 0;
            const take = params?.take || 10;
            
            return Promise.resolve(filtered.slice(skip, skip + take));
          }),
          count: jest.fn().mockImplementation((params) => {
            let filtered = mockTransactions;
            
            if (params?.where?.OR) {
              filtered = mockTransactions.filter(tx => 
                params.where.OR.some((condition: any) => 
                  (condition.fromUserId && tx.fromUserId === condition.fromUserId) ||
                  (condition.toUserId && tx.toUserId === condition.toUserId)
                )
              );
            }
            
            return Promise.resolve(filtered.length);
          }),
          findUnique: jest.fn().mockImplementation(({ where }) => {
            const transaction = mockTransactions.find(tx => tx.id === where.id);
            return Promise.resolve(transaction || null);
          })
        }
      }),
      disconnect: jest.fn().mockResolvedValue(undefined)
    },
    prisma: {
      transaction: {
        deleteMany: jest.fn().mockImplementation(() => {
          mockTransactions.length = 0;
          return Promise.resolve({ count: 0 });
        }),
        create: jest.fn().mockImplementation(({ data }) => {
          const transaction = {
            id: '550e8400-e29b-41d4-a716-446655440000',
            ...data,
            createdAt: new Date(),
            updatedAt: new Date(),
            processedAt: null
          };
          mockTransactions.push(transaction);
          return Promise.resolve(transaction);
        }),
        findMany: jest.fn().mockImplementation((params) => {
          let filtered = mockTransactions;
          
          if (params?.where?.OR) {
            filtered = mockTransactions.filter(tx => 
              params.where.OR.some((condition: any) => 
                (condition.fromUserId && tx.fromUserId === condition.fromUserId) ||
                (condition.toUserId && tx.toUserId === condition.toUserId)
              )
            );
          }
          
          const skip = params?.skip || 0;
          const take = params?.take || 10;
          
          return Promise.resolve(filtered.slice(skip, skip + take));
        }),
        count: jest.fn().mockImplementation((params) => {
          let filtered = mockTransactions;
          
          if (params?.where?.OR) {
            filtered = mockTransactions.filter(tx => 
              params.where.OR.some((condition: any) => 
                (condition.fromUserId && tx.fromUserId === condition.fromUserId) ||
                (condition.toUserId && tx.toUserId === condition.toUserId)
              )
            );
          }
          
          return Promise.resolve(filtered.length);
        }),
        findUnique: jest.fn().mockImplementation(({ where }) => {
          // Validate UUID format
          const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
          if (!uuidRegex.test(where.id)) {
            return Promise.resolve(null);
          }
          
          // Return a mock transaction for the hardcoded ID
          if (where.id === '550e8400-e29b-41d4-a716-446655440000') {
            return Promise.resolve({
              id: '550e8400-e29b-41d4-a716-446655440000',
              fromUserId: '123e4567-e89b-12d3-a456-426614174000',
              toUserId: '123e4567-e89b-12d3-a456-426614174001',
              amount: 100.50,
              description: 'Test transaction',
              status: 'PENDING',
              type: 'TRANSFER',
              createdAt: new Date(),
              updatedAt: new Date(),
              processedAt: null
            });
          }
          
          const transaction = mockTransactions.find(tx => tx.id === where.id);
          return Promise.resolve(transaction || null);
        })
      }
    }
  };
});

// Mock Redis connection
jest.mock('../../src/config/redis', () => ({
  RedisConnection: {
    getInstance: jest.fn().mockReturnValue({
      ping: jest.fn().mockResolvedValue('PONG'),
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue('OK'),
      del: jest.fn().mockResolvedValue(1),
      disconnect: jest.fn().mockResolvedValue(undefined)
    }),
    disconnect: jest.fn().mockResolvedValue(undefined)
  },
  redis: {
    ping: jest.fn().mockResolvedValue('PONG'),
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue('OK'),
    del: jest.fn().mockResolvedValue(1),
    disconnect: jest.fn().mockResolvedValue(undefined)
  }
}));

// Mock the customers service for integration tests
jest.mock('../../src/infrastructure/services/CustomerService', () => ({
  CustomerService: jest.fn().mockImplementation(() => ({
    validateUser: jest.fn().mockImplementation((userId) => Promise.resolve({
      id: userId,
      name: 'Test User',
      email: 'test@example.com',
      address: 'Test Address'
    })),
    getUserById: jest.fn().mockImplementation((userId) => Promise.resolve({
      id: userId,
      name: 'Test User',
      email: 'test@example.com',
      address: 'Test Address'
    }))
  }))
}));

// Mock axios for external service calls
jest.mock('axios', () => ({
  default: {
    get: jest.fn().mockResolvedValue({
      data: {
        id: 'test-user-id',
        name: 'Test User',
        email: 'test@example.com',
        isActive: true
      }
    }),
    post: jest.fn().mockResolvedValue({ data: { success: true } }),
    put: jest.fn().mockResolvedValue({ data: { success: true } }),
    delete: jest.fn().mockResolvedValue({ data: { success: true } }),
  },
}));

const { DatabaseConnection } = require('../../src/config/database');
const prisma = DatabaseConnection.getInstance();

const generateToken = (userId: string, email: string): string => {
  return jwt.sign(
    { userId, email },
    process.env['JWT_SECRET'] || 'test-secret',
    { expiresIn: '1h' }
  );
};

describe('Transaction Routes', () => {
  const testUserId = '123e4567-e89b-12d3-a456-426614174000';
  const testUserEmail = 'test@example.com';
  const token = generateToken(testUserId, testUserEmail);

  beforeEach(async () => {
    // Clean up test data
    try {
      await prisma.transaction.deleteMany();
    } catch (error) {
      console.warn('Failed to clean up test data:', error);
    }
  });

  describe('POST /api/transactions', () => {
    const validTransactionData = {
      fromUserId: '123e4567-e89b-12d3-a456-426614174000',
      toUserId: '123e4567-e89b-12d3-a456-426614174001',
      amount: 100.50,
      description: 'Test transaction',
    };

    it('should create transaction with valid data', async () => {
      const response = await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${token}`)
        .send(validTransactionData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        fromUserId: validTransactionData.fromUserId,
        toUserId: validTransactionData.toUserId,
        amount: validTransactionData.amount,
        description: validTransactionData.description,
        status: 'PENDING',
        type: 'TRANSFER',
      });
      expect(response.body.data.id).toBeDefined();
      expect(response.body.data.externalReference).toBeDefined();
    });

    it('should return 401 without token', async () => {
      const response = await request(app)
        .post('/api/transactions')
        .send(validTransactionData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Access token required');
    });

    it('should return 400 for invalid data', async () => {
      const invalidData = { ...validTransactionData, amount: -10 };

      const response = await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${token}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('positive');
    });

    it('should return 400 for missing required fields', async () => {
      const incompleteData = { amount: 100 };

      const response = await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${token}`)
        .send(incompleteData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should return 400 for same user transfer', async () => {
      const sameUserData = {
        ...validTransactionData,
        toUserId: validTransactionData.fromUserId,
      };

      const response = await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${token}`)
        .send(sameUserData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Cannot transfer to the same user');
    });
  });

  describe('GET /api/transactions/:id', () => {
    let transactionId: string;

    beforeEach(async () => {
      // Use the hardcoded ID that the mock returns
      transactionId = '550e8400-e29b-41d4-a716-446655440000';
    });

    it('should return transaction by id', async () => {
      const response = await request(app)
        .get(`/api/transactions/${transactionId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(transactionId);
      expect(response.body.data.fromUserId).toBe(testUserId);
    });

    it('should return 401 without token', async () => {
      const response = await request(app)
        .get(`/api/transactions/${transactionId}`)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Access token required');
    });

    it('should return 404 for non-existent transaction', async () => {
      const nonExistentId = '123e4567-e89b-12d3-a456-426614174999';

      const response = await request(app)
        .get(`/api/transactions/${nonExistentId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Transaction not found');
    });

    it('should return 400 for invalid UUID', async () => {
      const response = await request(app)
        .get('/api/transactions/invalid-uuid')
        .set('Authorization', `Bearer ${token}`)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/transactions/user/:userId', () => {
    beforeEach(async () => {
      await Promise.all([
        prisma.transaction.create({
          data: {
            fromUserId: testUserId,
            toUserId: '123e4567-e89b-12d3-a456-426614174001',
            amount: 100.50,
            description: 'Transaction 1',
            status: 'COMPLETED',
            type: 'TRANSFER',
          }
        }),
        prisma.transaction.create({
          data: {
            fromUserId: '123e4567-e89b-12d3-a456-426614174001',
            toUserId: testUserId,
            amount: 50.25,
            description: 'Transaction 2',
            status: 'PENDING',
            type: 'TRANSFER',
          }
        })
      ]);
    });

    it('should return user transactions', async () => {
      const response = await request(app)
        .get(`/api/transactions/user/${testUserId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.pagination).toMatchObject({
        page: 1,
        limit: 10,
        total: 2,
      });
    });

    it('should return 401 without token', async () => {
      const response = await request(app)
        .get(`/api/transactions/user/${testUserId}`)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Access token required');
    });

    it('should return 400 for invalid UUID', async () => {
      const response = await request(app)
        .get('/api/transactions/user/invalid-uuid')
        .set('Authorization', `Bearer ${token}`)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get(`/api/transactions/user/${testUserId}?page=1&limit=1`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.pagination).toMatchObject({
        page: 1,
        limit: 1,
        total: 2,
      });
    });
  });

  describe('Rate Limiting', () => {
    it('should apply rate limiting to transaction creation', async () => {
      const validTransactionData = {
        fromUserId: '123e4567-e89b-12d3-a456-426614174000',
        toUserId: '123e4567-e89b-12d3-a456-426614174001',
        amount: 100.50,
      };

      const requests = Array(12).fill(null).map(() =>
        request(app)
          .post('/api/transactions')
          .set('Authorization', `Bearer ${token}`)
          .send(validTransactionData)
      );

      const responses = await Promise.all(requests);
      const rateLimitedResponses = responses.filter(res => res.status === 429);
      
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });
});