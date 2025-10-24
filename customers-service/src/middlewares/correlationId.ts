import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

export interface RequestWithCorrelationId extends Request {
  correlationId: string;
}

export const correlationId = (req: RequestWithCorrelationId, res: Response, next: NextFunction): void => {
  let correlationIdValue = req.headers['x-correlation-id'];
  
  // Handle array case (take first element)
  if (Array.isArray(correlationIdValue)) {
    correlationIdValue = correlationIdValue[0];
  }
  
  // Use existing correlation ID or generate new one
  const finalCorrelationId = correlationIdValue || uuidv4();
  
  req.correlationId = finalCorrelationId;
  res.setHeader('x-correlation-id', finalCorrelationId);
  
  next();
};