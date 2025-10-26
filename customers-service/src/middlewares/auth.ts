import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { logger } from '../config/logger';
import { JwtPayload, AuthenticatedRequest } from '../types/auth.types';

export const authenticateToken = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    res.status(401).json({
      success: false,
      error: 'Token de acesso requerido',
      correlationId: req.correlationId
    });
    return;
  }

  try {
    const jwtSecret = process.env['JWT_SECRET'] || 'default-secret';
    const decoded = jwt.verify(token, jwtSecret) as JwtPayload;
    
    req.user = decoded;
    
    logger.debug('Token authenticated successfully', {
      userId: decoded.userId,
      correlationId: req.correlationId
    });
    
    next();
  } catch (error) {
    logger.warn('Invalid token provided', {
      error: error instanceof Error ? error.message : 'Unknown error',
      correlationId: req.correlationId
    });

    res.status(403).json({
      success: false,
      error: 'Token inválido',
      correlationId: req.correlationId
    });
  }
};

export { AuthenticatedRequest };