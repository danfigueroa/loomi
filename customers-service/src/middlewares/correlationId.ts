import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

export interface RequestWithCorrelationId extends Request {
  correlationId: string;
}

export const correlationId = (req: RequestWithCorrelationId, res: Response, next: NextFunction): void => {
  let correlationIdValue = req.headers['x-correlation-id'];
  
  if (Array.isArray(correlationIdValue)) {
    correlationIdValue = correlationIdValue[0];
  }
  
  const finalCorrelationId = correlationIdValue || uuidv4();
  
  req.correlationId = finalCorrelationId;
  res.setHeader('x-correlation-id', finalCorrelationId);
  
  next();
};