import { UserService } from '../UserService';
import { IUserEventPublisher } from '../../../domain/interfaces/IUserEventPublisher';
import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

describe('UserService Integration Tests', () => {
  let userService: UserService;
  let mockEventPublisher: jest.Mocked<IUserEventPublisher>;
  let prisma: PrismaClient;

  beforeAll(async () => {
    // Configurar banco de dados de teste
    prisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.TEST_DATABASE_URL || 'postgresql://test:test@localhost:5432/loomi_test',
        },
      },
    });

    await prisma.$connect();
  });

  beforeEach(async () => {
    // Limpar dados de teste
    await prisma.user.deleteMany();

    mockEventPublisher = {
      publishUserRegistered: jest.fn().mockResolvedValue(undefined),
      publishUserUpdated: jest.fn().mockResolvedValue(undefined),
      publishUserAuthenticated: jest.fn().mockResolvedValue(undefined),
      publishBankingDataUpdated: jest.fn().mockResolvedValue(undefined),
    };

    userService = new UserService(mockEventPublisher);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('register', () => {
    it('should register user and publish event', async () => {
      const registerData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        cpf: '12345678901',
        phone: '11999999999',
      };

      const result = await userService.register(registerData);

      // Verificar se usuário foi criado
      expect(result).toHaveProperty('id');
      expect(result.email).toBe(registerData.email);
      expect(result.name).toBe(registerData.name);

      // Verificar se evento foi publicado
      expect(mockEventPublisher.publishUserRegistered).toHaveBeenCalledWith({
        id: result.id,
        email: result.email,
        name: result.name,
        createdAt: expect.any(Date),
      });

      // Verificar se usuário existe no banco
      const userInDb = await prisma.user.findUnique({
        where: { id: result.id },
      });
      expect(userInDb).toBeTruthy();
      expect(userInDb?.email).toBe(registerData.email);
    });

    it('should not register user with duplicate email', async () => {
      const registerData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        cpf: '12345678901',
        phone: '11999999999',
      };

      // Primeiro registro
      await userService.register(registerData);

      // Segundo registro com mesmo email
      await expect(userService.register(registerData)).rejects.toThrow(
        'Email já está em uso'
      );

      // Verificar que evento foi publicado apenas uma vez
      expect(mockEventPublisher.publishUserRegistered).toHaveBeenCalledTimes(1);
    });
  });

  describe('login', () => {
    it('should login user and publish authentication event', async () => {
      const password = 'password123';
      const hashedPassword = await hash(password, 10);

      // Criar usuário diretamente no banco
      const user = await prisma.user.create({
        data: {
          name: 'Test User',
          email: 'test@example.com',
          password: hashedPassword,
          cpf: '12345678901',
          phone: '11999999999',
        },
      });

      const loginData = {
        email: 'test@example.com',
        password: password,
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
      };

      const result = await userService.login(loginData);

      // Verificar resultado do login
      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('user');
      expect(result.user.id).toBe(user.id);

      // Verificar se evento de autenticação foi publicado
      expect(mockEventPublisher.publishUserAuthenticated).toHaveBeenCalledWith({
        userId: user.id,
        email: user.email,
        loginAt: expect.any(Date),
        ipAddress: loginData.ipAddress,
        userAgent: loginData.userAgent,
      });
    });

    it('should not login with invalid credentials', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'wrongpassword',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
      };

      await expect(userService.login(loginData)).rejects.toThrow(
        'Credenciais inválidas'
      );

      // Verificar que evento não foi publicado
      expect(mockEventPublisher.publishUserAuthenticated).not.toHaveBeenCalled();
    });
  });

  describe('updateUser', () => {
    it('should update user and publish event', async () => {
      // Criar usuário
      const user = await prisma.user.create({
        data: {
          name: 'Test User',
          email: 'test@example.com',
          password: await hash('password123', 10),
          cpf: '12345678901',
          phone: '11999999999',
        },
      });

      const updateData = {
        name: 'Updated User',
        phone: '11888888888',
      };

      const result = await userService.updateUser(user.id, updateData);

      // Verificar se usuário foi atualizado
      expect(result.name).toBe(updateData.name);
      expect(result.phone).toBe(updateData.phone);

      // Verificar se evento foi publicado
      expect(mockEventPublisher.publishUserUpdated).toHaveBeenCalledWith({
        id: user.id,
        email: user.email,
        name: updateData.name,
        updatedAt: expect.any(Date),
      });

      // Verificar se usuário foi atualizado no banco
      const updatedUser = await prisma.user.findUnique({
        where: { id: user.id },
      });
      expect(updatedUser?.name).toBe(updateData.name);
      expect(updatedUser?.phone).toBe(updateData.phone);
    });
  });

  describe('error handling with events', () => {
    it('should handle event publishing errors gracefully', async () => {
      mockEventPublisher.publishUserRegistered.mockRejectedValue(
        new Error('Event publishing failed')
      );

      const registerData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        cpf: '12345678901',
        phone: '11999999999',
      };

      // O registro deve continuar mesmo se a publicação do evento falhar
      const result = await userService.register(registerData);

      expect(result).toHaveProperty('id');
      expect(result.email).toBe(registerData.email);

      // Verificar se usuário foi criado no banco mesmo com erro no evento
      const userInDb = await prisma.user.findUnique({
        where: { id: result.id },
      });
      expect(userInDb).toBeTruthy();
    });
  });
});