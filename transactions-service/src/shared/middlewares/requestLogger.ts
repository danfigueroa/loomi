import { Response, NextFunction } from 'express';
import { logger } from '../../config/logger';
import { RequestWithCorrelationId } from '../../middlewares/correlationId';

export const requestLogger = (
  req: RequestWithCorrelationId,
  res: Response,
  next: NextFunction
): void => {
  const start = Date.now();
  
  logger.info('Incoming request', {
    method: req.method,
    url: req.url,
    userAgent: req.get('User-Agent'),
    correlationId: req.correlationId,
  });

  const originalEnd = res.end;
  // Temporarily use any for Express compatibility
  res.end = function(chunk?: unknown, encoding?: unknown): Response {
    const duration = Date.now() - start;
    
    logger.info('Request completed', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      correlationId: req.correlationId,
    });

    return originalEnd.call(this, chunk as any, encoding as any);
  };

  next();
};