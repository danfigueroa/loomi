import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { authenticateToken } from '../../../src/middlewares/auth';
import { AuthenticatedRequest } from '../../../src/types/auth.types';
import { logger } from '../../../src/config/logger';

// Mock dependencies
jest.mock('jsonwebtoken');
jest.mock('../../../src/config/logger');

const mockJwt = jwt as jest.Mocked<typeof jwt>;
const mockLogger = logger as jest.Mocked<typeof logger>;

describe('Auth Middleware', () => {
  let mockRequest: Partial<AuthenticatedRequest>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {
      headers: {},
      correlationId: 'test-correlation-id'
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    mockNext = jest.fn();

    jest.clearAllMocks();
  });

  describe('authenticateToken', () => {
    it('should authenticate valid token successfully', () => {
      const mockToken = 'valid-token';
      const mockDecodedToken = {
        userId: 'user-123',
        email: 'test@example.com',
        iat: 1234567890,
        exp: 1234567890
      };

      mockRequest.headers = {
        authorization: `Bearer ${mockToken}`
      };

      mockJwt.verify.mockReturnValue(mockDecodedToken as any);

      authenticateToken(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockJwt.verify).toHaveBeenCalledWith(mockToken, 'default-secret');
      expect(mockRequest.user).toEqual(mockDecodedToken);
      expect(mockLogger.debug).toHaveBeenCalledWith('Token authenticated successfully', {
        userId: mockDecodedToken.userId,
        correlationId: 'test-correlation-id'
      });
      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should authenticate valid token with custom JWT_SECRET', () => {
      const originalEnv = process.env['JWT_SECRET'];
      process.env['JWT_SECRET'] = 'custom-secret';

      const mockToken = 'valid-token';
      const mockDecodedToken = {
        userId: 'user-123',
        email: 'test@example.com',
        iat: 1234567890,
        exp: 1234567890
      };

      mockRequest.headers = {
        authorization: `Bearer ${mockToken}`
      };

      mockJwt.verify.mockReturnValue(mockDecodedToken as any);

      authenticateToken(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockJwt.verify).toHaveBeenCalledWith(mockToken, 'custom-secret');
      expect(mockRequest.user).toEqual(mockDecodedToken);
      expect(mockNext).toHaveBeenCalled();

      // Restore original environment
      if (originalEnv) {
        process.env['JWT_SECRET'] = originalEnv;
      } else {
        delete process.env['JWT_SECRET'];
      }
    });

    it('should return 401 when no authorization header is provided', () => {
      mockRequest.headers = {};

      authenticateToken(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Token de acesso requerido',
        correlationId: 'test-correlation-id'
      });
      expect(mockNext).not.toHaveBeenCalled();
      expect(mockJwt.verify).not.toHaveBeenCalled();
    });

    it('should return 401 when authorization header is malformed', () => {
      mockRequest.headers = {
        authorization: 'InvalidFormat'
      };

      authenticateToken(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Token de acesso requerido',
        correlationId: 'test-correlation-id'
      });
      expect(mockNext).not.toHaveBeenCalled();
      expect(mockJwt.verify).not.toHaveBeenCalled();
    });

    it('should return 401 when Bearer token is empty', () => {
      mockRequest.headers = {
        authorization: 'Bearer '
      };

      authenticateToken(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Token de acesso requerido',
        correlationId: 'test-correlation-id'
      });
      expect(mockNext).not.toHaveBeenCalled();
      expect(mockJwt.verify).not.toHaveBeenCalled();
    });

    it('should return 403 when token is invalid', () => {
      const mockToken = 'invalid-token';
      const mockError = new Error('Invalid token');

      mockRequest.headers = {
        authorization: `Bearer ${mockToken}`
      };

      mockJwt.verify.mockImplementation(() => {
        throw mockError;
      });

      authenticateToken(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockJwt.verify).toHaveBeenCalledWith(mockToken, 'default-secret');
      expect(mockLogger.warn).toHaveBeenCalledWith('Invalid token provided', {
        error: 'Invalid token',
        correlationId: 'test-correlation-id'
      });
      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Token inválido',
        correlationId: 'test-correlation-id'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 403 when token is expired', () => {
      const mockToken = 'expired-token';
      const mockError = new Error('Token expired');

      mockRequest.headers = {
        authorization: `Bearer ${mockToken}`
      };

      mockJwt.verify.mockImplementation(() => {
        throw mockError;
      });

      authenticateToken(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockJwt.verify).toHaveBeenCalledWith(mockToken, 'default-secret');
      expect(mockLogger.warn).toHaveBeenCalledWith('Invalid token provided', {
        error: 'Token expired',
        correlationId: 'test-correlation-id'
      });
      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Token inválido',
        correlationId: 'test-correlation-id'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle unknown error types', () => {
      const mockToken = 'invalid-token';

      mockRequest.headers = {
        authorization: `Bearer ${mockToken}`
      };

      mockJwt.verify.mockImplementation(() => {
        throw 'Unknown error';
      });

      authenticateToken(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockLogger.warn).toHaveBeenCalledWith('Invalid token provided', {
        error: 'Unknown error',
        correlationId: 'test-correlation-id'
      });
      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Token inválido',
        correlationId: 'test-correlation-id'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle request without correlationId', () => {
      const mockToken = 'valid-token';
      const mockDecodedToken = {
        userId: 'user-123',
        email: 'test@example.com',
        iat: 1234567890,
        exp: 1234567890
      };

      mockRequest.headers = {
        authorization: `Bearer ${mockToken}`
      };
      mockRequest.correlationId = undefined as any;

      mockJwt.verify.mockReturnValue(mockDecodedToken as any);

      authenticateToken(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockJwt.verify).toHaveBeenCalledWith(mockToken, 'default-secret');
      expect(mockRequest.user).toEqual(mockDecodedToken);
      expect(mockLogger.debug).toHaveBeenCalledWith('Token authenticated successfully', {
        userId: mockDecodedToken.userId,
        correlationId: undefined
      });
      expect(mockNext).toHaveBeenCalled();
    });
  });
});