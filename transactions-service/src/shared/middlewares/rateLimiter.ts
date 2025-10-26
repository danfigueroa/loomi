import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import { AppError } from '../errors/AppError';

export const createRateLimiter = (windowMs?: number, max?: number) => {
  return rateLimit({
    windowMs: windowMs || parseInt(process.env['RATE_LIMIT_WINDOW_MS'] || '900000'),
    max: max || parseInt(process.env['RATE_LIMIT_MAX_REQUESTS'] || '100'),
    message: {
      success: false,
      message: 'Too many requests from this IP, please try again later',
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req: Request, _res: Response) => {
      throw new AppError('Too many requests from this IP, please try again later', 429);
    },
  });
};

export const defaultRateLimiter = createRateLimiter();