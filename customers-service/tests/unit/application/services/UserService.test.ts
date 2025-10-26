import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserService } from '../../../../src/application/services/UserService';
import { IUserEventPublisher } from '../../../../src/domain/interfaces/IMessageBroker';
import { RegisterRequest, LoginRequest, UpdateUserRequest } from '../../../../src/types/user.types';

// Mock dependencies
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');

describe('UserService', () => {
  let userService: UserService;
  let mockUserEventPublisher: jest.Mocked<IUserEventPublisher>;
  let mockPrisma: any;
  let mockRedis: any;

  beforeEach(() => {
    // Mock Prisma
    mockPrisma = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      bankingDetails: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };

    // Mock Redis
    mockRedis = {
      setEx: jest.fn(),
      get: jest.fn(),
      del: jest.fn(),
    };

    // Mock UserEventPublisher
    mockUserEventPublisher = {
      publishUserRegistered: jest.fn(),
      publishAuthenticationEvent: jest.fn(),
      publishBankingDataUpdated: jest.fn(),
    };

    // Mock DatabaseConnection and RedisConnection
    jest.doMock('../../../../src/config/database', () => ({
      DatabaseConnection: {
        getInstance: () => mockPrisma,
      },
    }));

    jest.doMock('../../../../src/config/redis', () => ({
      RedisConnection: {
        getInstance: () => mockRedis,
      },
    }));

    userService = new UserService(mockUserEventPublisher);
    
    // Override the private properties for testing
    (userService as any).prisma = mockPrisma;
    (userService as any).redis = mockRedis;

    jest.clearAllMocks();
  });

  describe('register', () => {
    const validRegisterData: RegisterRequest = {
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
      cpf: '12345678901',
      address: '123 Main St',
    };

    it('should register user successfully', async () => {
      const hashedPassword = 'hashedPassword123';
      const mockUser = {
        id: 'user-id',
        name: 'John Doe',
        email: 'john@example.com',
        address: '123 Main St',
        isActive: true,
        profilePicture: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.user.findUnique.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
      mockPrisma.user.create.mockResolvedValue(mockUser);
      mockUserEventPublisher.publishUserRegistered.mockResolvedValue(undefined);

      const result = await userService.register(validRegisterData, 'correlation-id');

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'john@example.com' },
      });
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: {
          name: 'John Doe',
          email: 'john@example.com',
          password: hashedPassword,
          cpf: '12345678901',
          address: '123 Main St',
          isActive: true,
        },
        select: expect.any(Object),
      });
      expect(mockUserEventPublisher.publishUserRegistered).toHaveBeenCalled();
      expect(result).toEqual(mockUser);
    });

    it('should throw error if required fields are missing', async () => {
      const invalidData = { ...validRegisterData, name: '' };

      await expect(
        userService.register(invalidData, 'correlation-id')
      ).rejects.toThrow('Nome, email e senha são obrigatórios');

      expect(mockPrisma.user.findUnique).not.toHaveBeenCalled();
      expect(mockPrisma.user.create).not.toHaveBeenCalled();
    });

    it('should throw error if email already exists', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'existing-user' });

      await expect(
        userService.register(validRegisterData, 'correlation-id')
      ).rejects.toThrow('Email já está em uso');

      expect(mockPrisma.user.create).not.toHaveBeenCalled();
    });

    it('should handle database errors gracefully', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');
      mockPrisma.user.create.mockRejectedValue(new Error('Database error'));

      await expect(
        userService.register(validRegisterData, 'correlation-id')
      ).rejects.toThrow('Erro interno do servidor');
    });
  });

  describe('login', () => {
    const validLoginData: LoginRequest = {
      email: 'john@example.com',
      password: 'password123',
    };

    const mockUser = {
      id: 'user-id',
      name: 'John Doe',
      email: 'john@example.com',
      password: 'hashedPassword',
      address: '123 Main St',
      profilePicture: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      bankingDetails: {
        id: 'banking-id',
        bankCode: '001',
        agencyNumber: '1234',
        accountNumber: '567890',
        accountType: 'checking',
      },
    };

    it('should login user successfully', async () => {
      const token = 'jwt-token';

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (jwt.sign as jest.Mock).mockReturnValue(token);
      mockRedis.setEx.mockResolvedValue('OK');
      mockUserEventPublisher.publishAuthenticationEvent.mockResolvedValue(undefined);

      const result = await userService.login(validLoginData, 'correlation-id');

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'john@example.com' },
        select: expect.any(Object),
      });
      expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashedPassword');
      expect(jwt.sign).toHaveBeenCalledWith(
        { userId: 'user-id', email: 'john@example.com' },
        expect.any(String),
        { expiresIn: '24h' }
      );
      expect(mockRedis.setEx).toHaveBeenCalledWith('user:user-id:token', 86400, token);
      expect(mockUserEventPublisher.publishAuthenticationEvent).toHaveBeenCalled();
      expect(result.token).toBe(token);
      expect(result.user).not.toHaveProperty('password');
    });

    it('should throw error if required fields are missing', async () => {
      const invalidData = { ...validLoginData, email: '' };

      await expect(
        userService.login(invalidData, 'correlation-id')
      ).rejects.toThrow('Email e senha são obrigatórios');

      expect(mockPrisma.user.findUnique).not.toHaveBeenCalled();
    });

    it('should throw error if user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        userService.login(validLoginData, 'correlation-id')
      ).rejects.toThrow('Credenciais inválidas');

      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    it('should throw error if password is invalid', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        userService.login(validLoginData, 'correlation-id')
      ).rejects.toThrow('Credenciais inválidas');

      expect(jwt.sign).not.toHaveBeenCalled();
    });
  });

  describe('updateUser', () => {
    const userId = 'user-id';
    const updateData: UpdateUserRequest = {
      name: 'Jane Doe',
      email: 'jane@example.com',
      address: '456 Oak St',
      bankingDetails: {
        bankCode: '002',
        agencyNumber: '5678',
        accountNumber: '123456',
        accountType: 'savings',
      },
    };

    const existingUser = {
      id: userId,
      name: 'John Doe',
      email: 'john@example.com',
      address: '123 Main St',
    };

    it('should update user successfully', async () => {
      const updatedUser = {
        id: userId,
        name: 'Jane Doe',
        email: 'jane@example.com',
        address: '456 Oak St',
        isActive: true,
        profilePicture: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        bankingDetails: {
          id: 'banking-id',
          bankCode: '002',
          agencyNumber: '5678',
          accountNumber: '123456',
          accountType: 'savings',
        },
      };

      mockPrisma.user.findUnique
        .mockResolvedValueOnce(existingUser) // First call for validation
        .mockResolvedValueOnce(null) // Email check
        .mockResolvedValueOnce(updatedUser); // Final user fetch
      mockPrisma.user.update.mockResolvedValue(updatedUser);
      mockPrisma.bankingDetails.findUnique.mockResolvedValue(null);
      mockPrisma.bankingDetails.create.mockResolvedValue(updateData.bankingDetails);
      mockUserEventPublisher.publishBankingDataUpdated.mockResolvedValue(undefined);

      const result = await userService.updateUser(userId, updateData, 'correlation-id');

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: {
          name: 'Jane Doe',
          email: 'jane@example.com',
          address: '456 Oak St',
        },
        select: expect.any(Object),
      });
      expect(mockPrisma.bankingDetails.create).toHaveBeenCalled();
      expect(mockUserEventPublisher.publishBankingDataUpdated).toHaveBeenCalled();
      expect(result).toEqual(updatedUser);
    });

    it('should throw error if user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        userService.updateUser(userId, updateData, 'correlation-id')
      ).rejects.toThrow('Usuário não encontrado');

      expect(mockPrisma.user.update).not.toHaveBeenCalled();
    });

    it('should throw error if email already exists', async () => {
      mockPrisma.user.findUnique
        .mockResolvedValueOnce(existingUser)
        .mockResolvedValueOnce({ id: 'other-user' }); // Email exists

      await expect(
        userService.updateUser(userId, updateData, 'correlation-id')
      ).rejects.toThrow('Email já está em uso por outro usuário');

      expect(mockPrisma.user.update).not.toHaveBeenCalled();
    });

    it('should update existing banking details', async () => {
      const existingBankingDetails = {
        id: 'banking-id',
        userId,
        bankCode: '001',
        agencyNumber: '1234',
        accountNumber: '567890',
        accountType: 'checking',
      };

      mockPrisma.user.findUnique
        .mockResolvedValueOnce(existingUser)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ ...existingUser, bankingDetails: existingBankingDetails });
      mockPrisma.user.update.mockResolvedValue(existingUser);
      mockPrisma.bankingDetails.findUnique.mockResolvedValue(existingBankingDetails);
      mockPrisma.bankingDetails.update.mockResolvedValue(updateData.bankingDetails);
      mockUserEventPublisher.publishBankingDataUpdated.mockResolvedValue(undefined);

      await userService.updateUser(userId, updateData, 'correlation-id');

      expect(mockPrisma.bankingDetails.update).toHaveBeenCalledWith({
        where: { userId },
        data: {
          bankCode: '002',
          agencyNumber: '5678',
          accountNumber: '123456',
          accountType: 'savings',
        },
      });
      expect(mockPrisma.bankingDetails.create).not.toHaveBeenCalled();
    });
  });

  describe('getUserById', () => {
    const userId = 'user-id';
    const mockUser = {
      id: userId,
      name: 'John Doe',
      email: 'john@example.com',
      address: '123 Main St',
      isActive: true,
      profilePicture: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      bankingDetails: {
        id: 'banking-id',
        bankCode: '001',
        agencyNumber: '1234',
        accountNumber: '567890',
        accountType: 'checking',
      },
    };

    it('should get user by id successfully', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await userService.getUserById(userId);

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
        select: expect.any(Object),
      });
      expect(result).toEqual(mockUser);
    });

    it('should throw error if user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(userService.getUserById(userId)).rejects.toThrow('Usuário não encontrado');
    });
  });
});