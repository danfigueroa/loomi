import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

const CUSTOMERS_SERVICE_URL = process.env.CUSTOMERS_SERVICE_URL || 'http://localhost:3001';
const TRANSACTIONS_SERVICE_URL = process.env.TRANSACTIONS_SERVICE_URL || 'http://localhost:3002';

describe('Services Communication Integration Tests', () => {
  let authToken: string;
  let testUserId: string;
  let correlationId: string;

  beforeAll(async () => {
    correlationId = uuidv4();
    
    const testUser = {
      name: 'Test User',
      email: `test-${Date.now()}@example.com`,
      password: 'password123',
      cpf: '12345678901'
    };

    const registerResponse = await axios.post(
      `${CUSTOMERS_SERVICE_URL}/api/users/register`,
      testUser,
      {
        headers: {
          'x-correlation-id': correlationId,
          'Content-Type': 'application/json'
        }
      }
    );

    expect(registerResponse.status).toBe(201);
    testUserId = registerResponse.data.data.user.id;

    const loginResponse = await axios.post(
      `${CUSTOMERS_SERVICE_URL}/api/users/login`,
      {
        email: testUser.email,
        password: testUser.password
      },
      {
        headers: {
          'x-correlation-id': correlationId,
          'Content-Type': 'application/json'
        }
      }
    );

    expect(loginResponse.status).toBe(200);
    authToken = loginResponse.data.data.token;
  });

  describe('Health Checks', () => {
    test('customers-service health check should return healthy status', async () => {
      const response = await axios.get(`${CUSTOMERS_SERVICE_URL}/health`, {
        headers: { 'x-correlation-id': correlationId }
      });

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('status', 'healthy');
      expect(response.data).toHaveProperty('service', 'customers-service');
      expect(response.data).toHaveProperty('uptime');
      expect(response.data).toHaveProperty('checks');
      expect(response.data.checks).toHaveProperty('database');
      expect(response.data.checks).toHaveProperty('redis');
    });

    test('transactions-service health check should return healthy status', async () => {
      const response = await axios.get(`${TRANSACTIONS_SERVICE_URL}/health`, {
        headers: { 'x-correlation-id': correlationId }
      });

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('status', 'healthy');
      expect(response.data).toHaveProperty('service', 'transactions-service');
      expect(response.data).toHaveProperty('uptime');
      expect(response.data).toHaveProperty('checks');
      expect(response.data.checks).toHaveProperty('database');
      expect(response.data.checks).toHaveProperty('redis');
      expect(response.data.checks).toHaveProperty('customers-service');
    });
  });

  describe('Service Communication', () => {
    test('transactions-service should validate user via customers-service', async () => {
      const secondUser = {
        name: 'Second Test User',
        email: `test2-${Date.now()}@example.com`,
        password: 'password123',
        cpf: '98765432100'
      };

      const registerResponse = await axios.post(
        `${CUSTOMERS_SERVICE_URL}/api/users/register`,
        secondUser,
        {
          headers: {
            'x-correlation-id': correlationId,
            'Content-Type': 'application/json'
          }
        }
      );

      const secondUserId = registerResponse.data.data.user.id;

      const transactionData = {
        fromUserId: testUserId,
        toUserId: secondUserId,
        amount: 100.50,
        description: 'Test transaction'
      };

      const response = await axios.post(
        `${TRANSACTIONS_SERVICE_URL}/api/transactions`,
        transactionData,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'x-correlation-id': correlationId,
            'Content-Type': 'application/json'
          }
        }
      );

      expect(response.status).toBe(201);
      expect(response.data).toHaveProperty('success', true);
      expect(response.data.data).toHaveProperty('id');
      expect(response.data.data).toHaveProperty('fromUserId', testUserId);
      expect(response.data.data).toHaveProperty('toUserId', secondUserId);
      expect(response.data.data).toHaveProperty('amount', 100.50);
    });

    test('transactions-service should reject transaction with invalid user', async () => {
      const invalidUserId = uuidv4();
      
      const transactionData = {
        fromUserId: testUserId,
        toUserId: invalidUserId,
        amount: 50.00,
        description: 'Test transaction with invalid user'
      };

      try {
        await axios.post(
          `${TRANSACTIONS_SERVICE_URL}/api/transactions`,
          transactionData,
          {
            headers: {
              'Authorization': `Bearer ${authToken}`,
              'x-correlation-id': correlationId,
              'Content-Type': 'application/json'
            }
          }
        );
        
        fail('Should have thrown an error for invalid user');
      } catch (error: any) {
        expect(error.response.status).toBe(404);
        expect(error.response.data).toHaveProperty('success', false);
        expect(error.response.data.message).toContain('User not found');
      }
    });

    test('correlation ID should be propagated between services', async () => {
      const customCorrelationId = `test-${uuidv4()}`;
      
      const response = await axios.get(
        `${TRANSACTIONS_SERVICE_URL}/api/transactions/user/${testUserId}`,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'x-correlation-id': customCorrelationId
          }
        }
      );

      expect(response.status).toBe(200);
      expect(response.headers).toHaveProperty('x-correlation-id', customCorrelationId);
    });
  });

  describe('Circuit Breaker and Resilience', () => {
    test('transactions-service should handle customers-service unavailability gracefully', async () => {
      const originalUrl = process.env.CUSTOMERS_SERVICE_URL;
      process.env.CUSTOMERS_SERVICE_URL = 'http://localhost:9999';

      const transactionData = {
        fromUserId: testUserId,
        toUserId: uuidv4(),
        amount: 25.00,
        description: 'Test transaction with service down'
      };

      try {
        await axios.post(
          `${TRANSACTIONS_SERVICE_URL}/api/transactions`,
          transactionData,
          {
            headers: {
              'Authorization': `Bearer ${authToken}`,
              'x-correlation-id': correlationId,
              'Content-Type': 'application/json'
            },
            timeout: 10000
          }
        );
        
        fail('Should have thrown an error for service unavailability');
      } catch (error: any) {
        expect(error.response.status).toBe(503);
        expect(error.response.data).toHaveProperty('success', false);
        expect(error.response.data.message).toContain('Service unavailable');
      } finally {
        process.env.CUSTOMERS_SERVICE_URL = originalUrl;
      }
    });
  });

  afterAll(async () => {
    if (testUserId && authToken) {
      try {
        await axios.delete(
          `${CUSTOMERS_SERVICE_URL}/api/users/${testUserId}`,
          {
            headers: {
              'Authorization': `Bearer ${authToken}`,
              'x-correlation-id': correlationId
            }
          }
        );
      } catch (error) {
        console.warn('Failed to cleanup test user:', error);
      }
    }
  });
});