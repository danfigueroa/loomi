import rateLimit from 'express-rate-limit';
import { AppError } from '@/shared/errors/AppError';

export const createRateLimiter = (windowMs?: number, max?: number) => {
  return rateLimit({
    windowMs: windowMs || parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
    max: max || parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
    message: {
      success: false,
      message: 'Too many requests from this IP, please try again later',
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      throw new AppError('Too many requests from this IP, please try again later', 429);
    },
  });
};

export const defaultRateLimiter = createRateLimiter();