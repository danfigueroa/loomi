import type { Response, NextFunction } from 'express';
import { logger } from '../config/logger';
import type { RequestWithCorrelationId } from './correlationId';

interface ErrorWithStatus extends Error {
  status?: number;
  statusCode?: number;
}

export const errorHandler = (
  error: ErrorWithStatus,
  req: RequestWithCorrelationId,
  res: Response,
  _next: NextFunction,
): void => {
  const status = error.status || error.statusCode || 500;
  const message = error.message || 'Internal Server Error';

  logger.error('Error occurred', {
    error: message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    correlationId: req.correlationId,
  });

  res.status(status).json({
    error: message,
    correlationId: req.correlationId,
    timestamp: new Date().toISOString(),
    ...(process.env['NODE_ENV'] === 'development' && { stack: error.stack }),
  });
};
