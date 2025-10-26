import { Response, NextFunction } from 'express';
import { errorHandler } from '../../../src/middlewares/errorHandler';
import { RequestWithCorrelationId } from '../../../src/middlewares/correlationId';
import { logger } from '../../../src/config/logger';

// Mock logger
jest.mock('../../../src/config/logger');

describe('Error Handler Middleware', () => {
  let mockRequest: Partial<RequestWithCorrelationId>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {
      url: '/test',
      method: 'GET',
      correlationId: 'test-correlation-id',
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    mockNext = jest.fn();

    jest.clearAllMocks();
  });

  describe('errorHandler', () => {
    it('should handle error with status code', () => {
      const error = new Error('Test error');
      (error as any).status = 400;

      errorHandler(
        error,
        mockRequest as RequestWithCorrelationId,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Test error',
        correlationId: 'test-correlation-id',
        timestamp: expect.any(String),
      });
      expect(logger.error).toHaveBeenCalledWith('Error occurred', {
        error: 'Test error',
        stack: error.stack,
        url: '/test',
        method: 'GET',
        correlationId: 'test-correlation-id',
      });
    });

    it('should handle error with statusCode property', () => {
      const error = new Error('Test error');
      (error as any).statusCode = 422;

      errorHandler(
        error,
        mockRequest as RequestWithCorrelationId,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(422);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Test error',
        correlationId: 'test-correlation-id',
        timestamp: expect.any(String),
      });
    });

    it('should default to 500 status code when no status is provided', () => {
      const error = new Error('Test error');

      errorHandler(
        error,
        mockRequest as RequestWithCorrelationId,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Test error',
        correlationId: 'test-correlation-id',
        timestamp: expect.any(String),
      });
    });

    it('should use default message when error has no message', () => {
      const error = new Error();
      error.message = '';

      errorHandler(
        error,
        mockRequest as RequestWithCorrelationId,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Internal Server Error',
        correlationId: 'test-correlation-id',
        timestamp: expect.any(String),
      });
    });

    it('should include stack trace in development environment', () => {
      const originalEnv = process.env['NODE_ENV'];
      process.env['NODE_ENV'] = 'development';

      const error = new Error('Test error');
      error.stack = 'Error stack trace';

      errorHandler(
        error,
        mockRequest as RequestWithCorrelationId,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Test error',
        correlationId: 'test-correlation-id',
        timestamp: expect.any(String),
        stack: 'Error stack trace',
      });

      process.env['NODE_ENV'] = originalEnv;
    });

    it('should not include stack trace in production environment', () => {
      const originalEnv = process.env['NODE_ENV'];
      process.env['NODE_ENV'] = 'production';

      const error = new Error('Test error');
      error.stack = 'Error stack trace';

      errorHandler(
        error,
        mockRequest as RequestWithCorrelationId,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Test error',
        correlationId: 'test-correlation-id',
        timestamp: expect.any(String),
      });

      process.env['NODE_ENV'] = originalEnv;
    });

    it('should log error details', () => {
      const error = new Error('Test error');
      error.stack = 'Error stack trace';

      errorHandler(
        error,
        mockRequest as RequestWithCorrelationId,
        mockResponse as Response,
        mockNext
      );

      expect(logger.error).toHaveBeenCalledWith('Error occurred', {
        error: 'Test error',
        stack: 'Error stack trace',
        url: '/test',
        method: 'GET',
        correlationId: 'test-correlation-id',
      });
    });

    it('should handle error without stack trace', () => {
      const error = new Error('Test error');
      delete error.stack;

      errorHandler(
        error,
        mockRequest as RequestWithCorrelationId,
        mockResponse as Response,
        mockNext
      );

      expect(logger.error).toHaveBeenCalledWith('Error occurred', {
        error: 'Test error',
        stack: undefined,
        url: '/test',
        method: 'GET',
        correlationId: 'test-correlation-id',
      });
    });

    it('should prioritize status over statusCode', () => {
      const error = new Error('Test error');
      (error as any).status = 400;
      (error as any).statusCode = 422;

      errorHandler(
        error,
        mockRequest as RequestWithCorrelationId,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });

    it('should include timestamp in ISO format', () => {
      const error = new Error('Test error');
      const beforeTime = new Date().toISOString();

      errorHandler(
        error,
        mockRequest as RequestWithCorrelationId,
        mockResponse as Response,
        mockNext
      );

      const afterTime = new Date().toISOString();
      const responseCall = (mockResponse.json as jest.Mock).mock.calls[0][0];
      const timestamp = responseCall.timestamp;

      expect(timestamp).toBeDefined();
      expect(timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      expect(timestamp >= beforeTime).toBe(true);
      expect(timestamp <= afterTime).toBe(true);
    });
  });
});