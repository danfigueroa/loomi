import { Response, NextFunction } from 'express';
import { requestLogger } from '../../../src/middlewares/requestLogger';
import { RequestWithCorrelationId } from '../../../src/middlewares/correlationId';
import { logger } from '../../../src/config/logger';

// Mock logger
jest.mock('../../../src/config/logger');

describe('Request Logger Middleware', () => {
  let mockRequest: Partial<RequestWithCorrelationId>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let originalEnd: any;

  beforeEach(() => {
    mockRequest = {
      method: 'GET',
      url: '/test',
      correlationId: 'test-correlation-id',
      get: jest.fn().mockReturnValue('Mozilla/5.0'),
    };

    originalEnd = jest.fn();
    mockResponse = {
      statusCode: 200,
      end: originalEnd,
    };

    mockNext = jest.fn();

    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('requestLogger', () => {
    it('should log incoming request', () => {
      requestLogger(
        mockRequest as RequestWithCorrelationId,
        mockResponse as Response,
        mockNext
      );

      expect(logger.info).toHaveBeenCalledWith('Incoming request', {
        method: 'GET',
        url: '/test',
        userAgent: 'Mozilla/5.0',
        correlationId: 'test-correlation-id',
      });
      expect(mockNext).toHaveBeenCalled();
    });

    it('should log request completion when response ends', () => {
      requestLogger(
        mockRequest as RequestWithCorrelationId,
        mockResponse as Response,
        mockNext
      );

      // Simulate time passing
      jest.advanceTimersByTime(100);

      // Call the overridden end method
      (mockResponse as any).end();

      expect(logger.info).toHaveBeenCalledTimes(2);
      expect(logger.info).toHaveBeenNthCalledWith(2, 'Request completed', {
        method: 'GET',
        url: '/test',
        statusCode: 200,
        duration: '100ms',
        correlationId: 'test-correlation-id',
      });
      expect(originalEnd).toHaveBeenCalled();
    });

    it('should handle different status codes', () => {
      mockResponse.statusCode = 404;

      requestLogger(
        mockRequest as RequestWithCorrelationId,
        mockResponse as Response,
        mockNext
      );

      jest.advanceTimersByTime(50);
      (mockResponse as any).end();

      expect(logger.info).toHaveBeenNthCalledWith(2, 'Request completed', {
        method: 'GET',
        url: '/test',
        statusCode: 404,
        duration: '50ms',
        correlationId: 'test-correlation-id',
      });
    });

    it('should handle different HTTP methods', () => {
      mockRequest.method = 'POST';
      mockRequest.url = '/api/users';

      requestLogger(
        mockRequest as RequestWithCorrelationId,
        mockResponse as Response,
        mockNext
      );

      expect(logger.info).toHaveBeenCalledWith('Incoming request', {
        method: 'POST',
        url: '/api/users',
        userAgent: 'Mozilla/5.0',
        correlationId: 'test-correlation-id',
      });

      jest.advanceTimersByTime(200);
      (mockResponse as any).end();

      expect(logger.info).toHaveBeenNthCalledWith(2, 'Request completed', {
        method: 'POST',
        url: '/api/users',
        statusCode: 200,
        duration: '200ms',
        correlationId: 'test-correlation-id',
      });
    });

    it('should handle missing user agent', () => {
      (mockRequest.get as jest.Mock).mockReturnValue(undefined);

      requestLogger(
        mockRequest as RequestWithCorrelationId,
        mockResponse as Response,
        mockNext
      );

      expect(logger.info).toHaveBeenCalledWith('Incoming request', {
        method: 'GET',
        url: '/test',
        userAgent: undefined,
        correlationId: 'test-correlation-id',
      });
    });

    it('should preserve original end method functionality', () => {
      const chunk = 'response data';
      const encoding = 'utf8';

      requestLogger(
        mockRequest as RequestWithCorrelationId,
        mockResponse as Response,
        mockNext
      );

      (mockResponse as any).end(chunk, encoding);

      expect(originalEnd).toHaveBeenCalledWith(chunk, encoding);
    });

    it('should return response from original end method', () => {
      const mockReturnValue = mockResponse;
      originalEnd.mockReturnValue(mockReturnValue);

      requestLogger(
        mockRequest as RequestWithCorrelationId,
        mockResponse as Response,
        mockNext
      );

      const result = (mockResponse as any).end();

      expect(result).toBe(mockReturnValue);
    });

    it('should calculate duration correctly for long requests', () => {
      requestLogger(
        mockRequest as RequestWithCorrelationId,
        mockResponse as Response,
        mockNext
      );

      jest.advanceTimersByTime(1500);
      (mockResponse as any).end();

      expect(logger.info).toHaveBeenNthCalledWith(2, 'Request completed', {
        method: 'GET',
        url: '/test',
        statusCode: 200,
        duration: '1500ms',
        correlationId: 'test-correlation-id',
      });
    });

    it('should handle zero duration requests', () => {
      requestLogger(
        mockRequest as RequestWithCorrelationId,
        mockResponse as Response,
        mockNext
      );

      // Don't advance time
      (mockResponse as any).end();

      expect(logger.info).toHaveBeenNthCalledWith(2, 'Request completed', {
        method: 'GET',
        url: '/test',
        statusCode: 200,
        duration: '0ms',
        correlationId: 'test-correlation-id',
      });
    });

    it('should handle different correlation IDs', () => {
      mockRequest.correlationId = 'different-correlation-id';

      requestLogger(
        mockRequest as RequestWithCorrelationId,
        mockResponse as Response,
        mockNext
      );

      expect(logger.info).toHaveBeenCalledWith('Incoming request', {
        method: 'GET',
        url: '/test',
        userAgent: 'Mozilla/5.0',
        correlationId: 'different-correlation-id',
      });

      (mockResponse as any).end();

      expect(logger.info).toHaveBeenNthCalledWith(2, 'Request completed', {
        method: 'GET',
        url: '/test',
        statusCode: 200,
        duration: '0ms',
        correlationId: 'different-correlation-id',
      });
    });
  });
});