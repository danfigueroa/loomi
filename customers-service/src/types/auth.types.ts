import type { RequestWithCorrelationId } from '../middlewares/correlationId';

export interface JwtPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

export interface AuthenticatedRequest extends RequestWithCorrelationId {
  user: JwtPayload;
}

export interface AuthResponse {
  success: boolean;
  data?: {
    token: string;
    user: {
      id: string;
      name: string;
      email: string;
      isActive: boolean;
    };
  };
  error?: string;
  correlationId: string;
}
