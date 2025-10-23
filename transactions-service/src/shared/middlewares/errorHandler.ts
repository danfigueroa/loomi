import { Request, Response, NextFunction } from 'express';
import { AppError } from '@/shared/errors/AppError';
import { logger } from '@/config/logger';

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (error instanceof AppError) {
    logger.warn('Application Error', {
      message: error.message,
      statusCode: error.statusCode,
      path: req.path,
      method: req.method,
      ip: req.ip,
    });

    res.status(error.statusCode).json({
      success: false,
      message: error.message,
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
    });
    return;
  }

  logger.error('Unexpected Error', {
    message: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
    ip: req.ip,
  });

  res.status(500).json({
    success: false,
    message: 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { 
      originalMessage: error.message,
      stack: error.stack 
    }),
  });
};