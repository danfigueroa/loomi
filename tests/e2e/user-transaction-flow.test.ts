import axios from 'axios';
import jwt from 'jsonwebtoken';

const NGINX_BASE_URL = 'http://localhost:8080';
const CUSTOMERS_SERVICE_URL = 'http://localhost:3001';
const TRANSACTIONS_SERVICE_URL = 'http://localhost:3002';
const JWT_SECRET = 'test-jwt-secret-key-for-e2e-tests';

interface User {
  id: string;
  email: string;
  name: string;
}

interface Transaction {
  id: string;
  userId: string;
  amount: number;
  description: string;
  status: string;
  createdAt: string;
}

describe('E2E: User Transaction Flow', () => {
  let authToken: string;
  let testUser: User;

  beforeAll(async () => {
    await waitForServices();
    
    testUser = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      email: 'test@example.com',
      name: 'Test User'
    };

    authToken = jwt.sign(
      { 
        userId: testUser.id, 
        email: testUser.email 
      },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
  });

  describe('Health Checks', () => {
    it('should have all services healthy', async () => {
      const customersHealth = await axios.get(`${CUSTOMERS_SERVICE_URL}/health`);
      expect(customersHealth.status).toBe(200);
      expect(customersHealth.data.status).toBe('healthy');

      const transactionsHealth = await axios.get(`${TRANSACTIONS_SERVICE_URL}/health`);
      expect(transactionsHealth.status).toBe(200);
      expect(transactionsHealth.data.status).toBe('healthy');
    });

    it('should access services through nginx proxy', async () => {
      const customersResponse = await axios.get(`${NGINX_BASE_URL}/api/customers/health`);
      expect(customersResponse.status).toBe(200);

      const transactionsResponse = await axios.get(`${NGINX_BASE_URL}/api/transactions/health`);
      expect(transactionsResponse.status).toBe(200);
    });
  });

  describe('User Management', () => {
    it('should get user information', async () => {
      const response = await axios.get(
        `${CUSTOMERS_SERVICE_URL}/api/users/${testUser.id}`,
        {
          headers: { Authorization: `Bearer ${authToken}` }
        }
      );

      expect(response.status).toBe(200);
      expect(response.data.user.id).toBe(testUser.id);
      expect(response.data.user.email).toBe(testUser.email);
    });

    it('should update user profile', async () => {
      const updateData = { name: 'Updated Test User' };
      
      const response = await axios.patch(
        `${CUSTOMERS_SERVICE_URL}/api/users/${testUser.id}`,
        updateData,
        {
          headers: { 
            Authorization: `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      expect(response.status).toBe(200);
      expect(response.data.user.name).toBe(updateData.name);
    });
  });

  describe('Transaction Management', () => {
    let createdTransaction: Transaction;

    it('should create a new transaction', async () => {
      const transactionData = {
        amount: 100.50,
        description: 'E2E Test Transaction'
      };

      const response = await axios.post(
        `${TRANSACTIONS_SERVICE_URL}/api/transactions`,
        transactionData,
        {
          headers: { 
            Authorization: `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      expect(response.status).toBe(201);
      expect(response.data.transaction.amount).toBe(transactionData.amount);
      expect(response.data.transaction.description).toBe(transactionData.description);
      expect(response.data.transaction.userId).toBe(testUser.id);
      expect(response.data.transaction.status).toBe('completed');

      createdTransaction = response.data.transaction;
    });

    it('should get transaction by id', async () => {
      const response = await axios.get(
        `${TRANSACTIONS_SERVICE_URL}/api/transactions/${createdTransaction.id}`,
        {
          headers: { Authorization: `Bearer ${authToken}` }
        }
      );

      expect(response.status).toBe(200);
      expect(response.data.transaction.id).toBe(createdTransaction.id);
      expect(response.data.transaction.amount).toBe(createdTransaction.amount);
    });

    it('should get user transactions', async () => {
      const response = await axios.get(
        `${TRANSACTIONS_SERVICE_URL}/api/transactions/user/${testUser.id}`,
        {
          headers: { Authorization: `Bearer ${authToken}` }
        }
      );

      expect(response.status).toBe(200);
      expect(Array.isArray(response.data.transactions)).toBe(true);
      expect(response.data.transactions.length).toBeGreaterThan(0);
      
      const transaction = response.data.transactions.find(
        (t: Transaction) => t.id === createdTransaction.id
      );
      expect(transaction).toBeDefined();
    });
  });

  describe('Service Communication', () => {
    it('should validate user exists when creating transaction', async () => {
      const invalidToken = jwt.sign(
        { 
          userId: 'invalid-user-id', 
          email: 'invalid@example.com' 
        },
        JWT_SECRET,
        { expiresIn: '1h' }
      );

      const transactionData = {
        amount: 50.00,
        description: 'Should fail - invalid user'
      };

      try {
        await axios.post(
          `${TRANSACTIONS_SERVICE_URL}/api/transactions`,
          transactionData,
          {
            headers: { 
              Authorization: `Bearer ${invalidToken}`,
              'Content-Type': 'application/json'
            }
          }
        );
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.response.status).toBe(404);
        expect(error.response.data.error).toContain('User not found');
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle unauthorized requests', async () => {
      try {
        await axios.get(`${CUSTOMERS_SERVICE_URL}/api/users/${testUser.id}`);
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.response.status).toBe(401);
      }
    });

    it('should handle invalid transaction data', async () => {
      const invalidData = {
        amount: -100,
        description: ''
      };

      try {
        await axios.post(
          `${TRANSACTIONS_SERVICE_URL}/api/transactions`,
          invalidData,
          {
            headers: { 
              Authorization: `Bearer ${authToken}`,
              'Content-Type': 'application/json'
            }
          }
        );
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.response.status).toBe(400);
      }
    });
  });

  describe('Load Balancing and Proxy', () => {
    it('should route requests through nginx proxy', async () => {
      const responses = await Promise.all([
        axios.get(`${NGINX_BASE_URL}/api/customers/health`),
        axios.get(`${NGINX_BASE_URL}/api/transactions/health`),
        axios.get(`${NGINX_BASE_URL}/api/customers/health`),
        axios.get(`${NGINX_BASE_URL}/api/transactions/health`)
      ]);

      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.headers['x-correlation-id']).toBeDefined();
      });
    });

    it('should handle concurrent requests', async () => {
      const concurrentRequests = Array.from({ length: 10 }, (_, i) => 
        axios.get(
          `${TRANSACTIONS_SERVICE_URL}/api/transactions/user/${testUser.id}`,
          {
            headers: { Authorization: `Bearer ${authToken}` }
          }
        )
      );

      const responses = await Promise.all(concurrentRequests);
      
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(Array.isArray(response.data.transactions)).toBe(true);
      });
    });
  });
});

async function waitForServices(): Promise<void> {
  const maxRetries = 30;
  const retryDelay = 2000;

  for (let i = 0; i < maxRetries; i++) {
    try {
      await Promise.all([
        axios.get(`${CUSTOMERS_SERVICE_URL}/health`),
        axios.get(`${TRANSACTIONS_SERVICE_URL}/health`)
      ]);
      console.log('All services are ready');
      return;
    } catch (error) {
      console.log(`Waiting for services... (${i + 1}/${maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }
  
  throw new Error('Services did not become ready in time');
}