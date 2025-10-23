import request from 'supertest';
import { app } from '@/app';
import { DatabaseConnection } from '@/config/database';
import { RedisConnection } from '@/config/redis';

describe('Health Integration Tests', () => {
  beforeAll(async () => {
    process.env['NODE_ENV'] = 'test';
    process.env['DATABASE_URL'] = 'postgresql://postgres:password@localhost:5432/customers_test_db?schema=public';
    process.env['REDIS_URL'] = 'redis://localhost:6379/1';
  });

  afterAll(async () => {
    await DatabaseConnection.disconnect();
    await RedisConnection.disconnect();
  });

  describe('GET /health', () => {
    it('should return healthy status when all services are available', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toMatchObject({
        status: 'healthy',
        service: 'customers-service',
        checks: {
          database: 'healthy',
          redis: 'healthy'
        }
      });

      expect(response.body.timestamp).toBeDefined();
      expect(response.body.version).toBeDefined();
      expect(response.body.uptime).toBeGreaterThan(0);
      expect(response.headers['x-correlation-id']).toBeDefined();
    });

    it('should include correlation id in response headers', async () => {
      const correlationId = 'test-correlation-123';
      
      const response = await request(app)
        .get('/health')
        .set('x-correlation-id', correlationId)
        .expect(200);

      expect(response.headers['x-correlation-id']).toBe(correlationId);
    });

    it('should generate correlation id when not provided', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.headers['x-correlation-id']).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });

    it('should handle array correlation id', async () => {
      const response = await request(app)
        .get('/health')
        .set('x-correlation-id', ['id1', 'id2'])
        .expect(200);

      expect(response.headers['x-correlation-id']).toBe('id1');
    });

    it('should handle empty correlation id', async () => {
      const response = await request(app)
        .get('/health')
        .set('x-correlation-id', '')
        .expect(200);

      expect(response.headers['x-correlation-id']).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });
  });

  describe('Rate Limiting', () => {
    it('should apply rate limiting after many requests', async () => {
      const requests = Array.from({ length: 105 }, (_, i) => 
        request(app).get('/health')
      );

      const responses = await Promise.all(requests);
      
      const rateLimitedResponses = responses.filter(res => res.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    }, 30000);
  });

  describe('Security Headers', () => {
    it('should include security headers', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBe('DENY');
      expect(response.headers['x-xss-protection']).toBe('0');
    });
  });

  describe('CORS', () => {
    it('should handle CORS preflight requests', async () => {
      const response = await request(app)
        .options('/health')
        .set('Origin', 'http://localhost:3000')
        .set('Access-Control-Request-Method', 'GET')
        .expect(204);

      expect(response.headers['access-control-allow-origin']).toBe('*');
    });
  });
});