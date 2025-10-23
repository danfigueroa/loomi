import { Request, Response, NextFunction } from 'express';
import { correlationId, RequestWithCorrelationId } from '@/middlewares/correlationId';
import { v4 as uuidv4 } from 'uuid';

jest.mock('uuid');

describe('CorrelationId Middleware', () => {
  let mockRequest: Partial<RequestWithCorrelationId>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let mockSetHeader: jest.Mock;

  beforeEach(() => {
    mockSetHeader = jest.fn();
    mockRequest = {
      headers: {}
    };
    mockResponse = {
      setHeader: mockSetHeader
    };
    mockNext = jest.fn();

    jest.clearAllMocks();
  });

  it('should use existing correlation ID from headers', () => {
    const existingCorrelationId = 'existing-correlation-id';
    mockRequest.headers = {
      'x-correlation-id': existingCorrelationId
    };

    correlationId(mockRequest as RequestWithCorrelationId, mockResponse as Response, mockNext);

    expect(mockRequest.correlationId).toBe(existingCorrelationId);
    expect(mockSetHeader).toHaveBeenCalledWith('x-correlation-id', existingCorrelationId);
    expect(mockNext).toHaveBeenCalled();
  });

  it('should generate new correlation ID when not provided', () => {
    const generatedCorrelationId = 'generated-uuid';
    (uuidv4 as jest.Mock).mockReturnValue(generatedCorrelationId);

    correlationId(mockRequest as RequestWithCorrelationId, mockResponse as Response, mockNext);

    expect(uuidv4).toHaveBeenCalled();
    expect(mockRequest.correlationId).toBe(generatedCorrelationId);
    expect(mockSetHeader).toHaveBeenCalledWith('x-correlation-id', generatedCorrelationId);
    expect(mockNext).toHaveBeenCalled();
  });

  it('should handle empty correlation ID header', () => {
    const generatedCorrelationId = 'generated-uuid';
    (uuidv4 as jest.Mock).mockReturnValue(generatedCorrelationId);
    mockRequest.headers = {
      'x-correlation-id': ''
    };

    correlationId(mockRequest as RequestWithCorrelationId, mockResponse as Response, mockNext);

    expect(uuidv4).toHaveBeenCalled();
    expect(mockRequest.correlationId).toBe(generatedCorrelationId);
    expect(mockSetHeader).toHaveBeenCalledWith('x-correlation-id', generatedCorrelationId);
    expect(mockNext).toHaveBeenCalled();
  });

  it('should handle array correlation ID header', () => {
    const firstCorrelationId = 'first-correlation-id';
    mockRequest.headers = {
      'x-correlation-id': [firstCorrelationId, 'second-correlation-id']
    };

    correlationId(mockRequest as RequestWithCorrelationId, mockResponse as Response, mockNext);

    expect(mockRequest.correlationId).toBe(firstCorrelationId);
    expect(mockSetHeader).toHaveBeenCalledWith('x-correlation-id', firstCorrelationId);
    expect(mockNext).toHaveBeenCalled();
  });
});