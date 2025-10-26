import { Response } from 'express';
import { UserController } from '../../../src/controllers/userController';
import { UserEventPublisher } from '../../../src/infrastructure/messaging/UserEventPublisher';

describe('UserController - Simple Tests', () => {
  let userController: UserController;
  let mockResponse: Partial<Response>;
  let mockUserEventPublisher: jest.Mocked<UserEventPublisher>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    mockUserEventPublisher = {
      publishUserRegistered: jest.fn().mockResolvedValue(undefined),
      publishBankingDataUpdated: jest.fn().mockResolvedValue(undefined),
      publishAuthenticationEvent: jest.fn().mockResolvedValue(undefined),
    } as any;

    userController = new UserController(mockUserEventPublisher);
  });

  describe('register', () => {
    it('should handle validation errors for missing name', async () => {
      const invalidRegisterData = {
        email: 'john@example.com',
        password: 'password123'
        // missing name
      };

      const mockRequest = {
        body: invalidRegisterData,
        correlationId: 'test-correlation-id'
      };

      await userController.register(mockRequest as any, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Nome, email e senha são obrigatórios',
        correlationId: 'test-correlation-id'
      });
    });

    it('should handle validation errors for missing email', async () => {
      const invalidRegisterData = {
        name: 'John Doe',
        password: 'password123'
        // missing email
      };

      const mockRequest = {
        body: invalidRegisterData,
        correlationId: 'test-correlation-id'
      };

      await userController.register(mockRequest as any, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Nome, email e senha são obrigatórios',
        correlationId: 'test-correlation-id'
      });
    });

    it('should handle validation errors for missing password', async () => {
      const invalidRegisterData = {
        name: 'John Doe',
        email: 'john@example.com'
        // missing password
      };

      const mockRequest = {
        body: invalidRegisterData,
        correlationId: 'test-correlation-id'
      };

      await userController.register(mockRequest as any, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Nome, email e senha são obrigatórios',
        correlationId: 'test-correlation-id'
      });
    });
  });
});