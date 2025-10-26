import { Request, Response, NextFunction } from 'express';


interface JwtPayload {
  userId: string;
  email: string;
  iat: number;
  exp: number;
}

// Express middleware types
export interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
}

export interface RequestWithCorrelationId extends Request {
  correlationId?: string;
}

export interface AuthenticatedRequestWithCorrelationId extends AuthenticatedRequest {
  correlationId?: string;
}

export type ExpressMiddleware = (req: Request, res: Response, next: NextFunction) => void | Promise<void>;

export type AuthMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction) => void | Promise<void>;

export type CorrelationMiddleware = (req: RequestWithCorrelationId, res: Response, next: NextFunction) => void | Promise<void>;

// Rate limiter handler type
export interface RateLimiterHandler {
  (req: Request, res: Response): void;
}

// Logger metadata type
export interface LoggerMeta {
  timestamp?: string;
  level?: string;
  message?: string;
  [key: string]: unknown;
}