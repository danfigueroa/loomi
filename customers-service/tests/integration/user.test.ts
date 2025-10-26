import request from 'supertest';
import { app } from '../../src/app';
import { DatabaseConnection } from '../../src/config/database';
import { RedisConnection } from '../../src/config/redis';

describe('User Integration Tests', () => {
  let prisma: any;
  let redis: any;

  beforeAll(async () => {
    prisma = DatabaseConnection.getInstance();
    redis = RedisConnection.getInstance();
  });

  beforeEach(async () => {
    // Clean up database before each test
    await prisma.bankingDetails.deleteMany({});
    await prisma.user.deleteMany({});
    
    // Clean up Redis
    await redis.flushall();
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await redis.quit();
  });

  describe('POST /api/users/register', () => {
    const validUserData = {
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
      cpf: '12345678901',
      address: '123 Main St',
    };

    it('should register a new user successfully', async () => {
      const response = await request(app)
        .post('/api/users/register')
        .send(validUserData)
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          user: {
            name: 'John Doe',
            email: 'john@example.com',
            address: '123 Main St',
            cpf: '12345678901',
            isActive: true,
          },
          message: 'Usuário registrado com sucesso',
        },
      });

      expect(response.body.data.user).not.toHaveProperty('password');
      expect(response.body).toHaveProperty('correlationId');
    });

    it('should return 400 for missing required fields', async () => {
      const response = await request(app)
        .post('/api/users/register')
        .send({
          name: 'John Doe',
          // missing email, password, cpf
        })
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: 'Todos os campos são obrigatórios',
      });
    });

    it('should return 409 for duplicate email', async () => {
      // First registration
      await request(app)
        .post('/api/users/register')
        .send(validUserData)
        .expect(201);

      // Second registration with same email
      const response = await request(app)
        .post('/api/users/register')
        .send({
          ...validUserData,
          name: 'Jane Doe',
        })
        .expect(409);

      expect(response.body).toMatchObject({
        success: false,
        error: 'Email já está em uso',
      });
    });

    it('should return 409 for duplicate CPF', async () => {
      // First registration
      await request(app)
        .post('/api/users/register')
        .send(validUserData)
        .expect(201);

      // Second registration with same CPF
      const response = await request(app)
        .post('/api/users/register')
        .send({
          ...validUserData,
          email: 'jane@example.com',
        })
        .expect(409);

      expect(response.body).toMatchObject({
        success: false,
        error: 'CPF já está em uso',
      });
    });
  });

  describe('POST /api/users/login', () => {
    const userData = {
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
      cpf: '12345678901',
      address: '123 Main St',
    };

    beforeEach(async () => {
      // Register user before each login test
      await request(app)
        .post('/api/users/register')
        .send(userData);
    });

    it('should login successfully with valid credentials', async () => {
      const response = await request(app)
        .post('/api/users/login')
        .send({
          email: userData.email,
          password: userData.password,
        })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          user: {
            name: 'John Doe',
            email: 'john@example.com',
            address: '123 Main St',
            isActive: true,
          },
          message: 'Login realizado com sucesso',
        },
      });

      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data.user).not.toHaveProperty('password');
    });

    it('should return 400 for missing credentials', async () => {
      const response = await request(app)
        .post('/api/users/login')
        .send({
          email: userData.email,
          // missing password
        })
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: 'Email e senha são obrigatórios',
      });
    });

    it('should return 401 for invalid email', async () => {
      const response = await request(app)
        .post('/api/users/login')
        .send({
          email: 'nonexistent@example.com',
          password: userData.password,
        })
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        error: 'Credenciais inválidas',
      });
    });

    it('should return 401 for invalid password', async () => {
      const response = await request(app)
        .post('/api/users/login')
        .send({
          email: userData.email,
          password: 'wrongpassword',
        })
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        error: 'Credenciais inválidas',
      });
    });
  });

  describe('GET /api/users/profile', () => {
    let authToken: string;
    const userData = {
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
      cpf: '12345678901',
      address: '123 Main St',
    };

    beforeEach(async () => {
      // Register and login to get auth token
      await request(app)
        .post('/api/users/register')
        .send(userData);

      const loginResponse = await request(app)
        .post('/api/users/login')
        .send({
          email: userData.email,
          password: userData.password,
        });

      authToken = loginResponse.body.data.token;
    });

    it('should get user profile successfully with valid token', async () => {
      const response = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          user: {
            name: 'John Doe',
            email: 'john@example.com',
            address: '123 Main St',
            isActive: true,
          },
        },
      });

      expect(response.body.data.user).not.toHaveProperty('password');
    });

    it('should return 401 for missing authorization header', async () => {
      const response = await request(app)
        .get('/api/users/profile')
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        error: 'Token de acesso requerido',
      });
    });

    it('should return 403 for invalid token', async () => {
      const response = await request(app)
        .get('/api/users/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(403);

      expect(response.body).toMatchObject({
        success: false,
        error: 'Token inválido',
      });
    });
  });

  describe('PUT /api/users/profile', () => {
    let authToken: string;
    const userData = {
      name: 'John Doe',
      email: 'john.doe@example.com',
      password: 'password123',
      cpf: '12345678901',
      address: '123 Main St',
    };

    beforeEach(async () => {
      const registerResponse = await request(app)
        .post('/api/users/register')
        .send(userData);

      // userId = registerResponse.body.data.user.id;

      const loginResponse = await request(app)
        .post('/api/users/login')
        .send({
          email: userData.email,
          password: userData.password,
        });

      authToken = loginResponse.body.data.token;
    });

    it('should update user profile successfully', async () => {
      const updateData = {
        name: 'John Updated',
        address: '456 New St',
        bankingDetails: {
          bankCode: '001',
          agencyNumber: '1234',
          accountNumber: '567890',
          accountType: 'checking',
        },
      };

      const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          user: {
            name: 'John Updated',
            email: 'john@example.com',
            address: '456 New St',
            bankingDetails: {
              bankCode: '001',
              agencyNumber: '1234',
              accountNumber: '567890',
              accountType: 'checking',
            },
          },
          message: 'Perfil atualizado com sucesso',
        },
      });
    });

    it('should return 401 for missing authorization', async () => {
      const response = await request(app)
        .put('/api/users/profile')
        .send({ name: 'Updated Name' })
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        error: 'Token de acesso requerido',
      });
    });

    it('should return 409 for duplicate email', async () => {
      // Create another user
      await request(app)
        .post('/api/users/register')
        .send({
          name: 'Jane Doe',
          email: 'jane@example.com',
          password: 'password123',
          cpf: '98765432100',
          address: '789 Other St',
        });

      const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          email: 'jane@example.com', // Try to use existing email
        })
        .expect(409);

      expect(response.body).toMatchObject({
        success: false,
        error: 'Email já está em uso por outro usuário',
      });
    });
  });

  describe('GET /api/users/:id', () => {
    let authToken: string;
    let userId: string;
    const userData = {
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
      cpf: '12345678901',
      address: '123 Main St',
    };

    beforeEach(async () => {
      // Register and login to get auth token
      const registerResponse = await request(app)
        .post('/api/users/register')
        .send(userData);

      userId = registerResponse.body.data.user.id;

      const loginResponse = await request(app)
        .post('/api/users/login')
        .send({
          email: userData.email,
          password: userData.password,
        });

      authToken = loginResponse.body.data.token;
    });

    it('should get user by ID successfully', async () => {
      const response = await request(app)
        .get(`/api/users/${userId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          user: {
            id: userId,
            name: 'John Doe',
            email: 'john@example.com',
            address: '123 Main St',
            isActive: true,
          },
        },
      });

      expect(response.body.data.user).not.toHaveProperty('password');
    });

    it('should return 401 for missing authorization', async () => {
      const response = await request(app)
        .get(`/api/users/${userId}`)
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        error: 'Token de acesso requerido',
      });
    });

    it('should return 404 for non-existent user', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';
      
      const response = await request(app)
        .get(`/api/users/${nonExistentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body).toMatchObject({
        success: false,
        error: 'Usuário não encontrado',
      });
    });
  });
});