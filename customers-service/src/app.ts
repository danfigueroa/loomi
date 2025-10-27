import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';

import { errorHandler } from './middlewares/errorHandler';
import { requestLogger } from './middlewares/requestLogger';
import { correlationId } from './middlewares/correlationId';
import { swaggerSpec } from './config/swagger';

const app = express();

const limiter = process.env['NODE_ENV'] === 'test' 
  ? rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 10000,
      message: 'Too many requests from this IP',
      standardHeaders: true,
      legacyHeaders: false,
    })
  : rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 100,
      message: 'Too many requests from this IP',
      standardHeaders: true,
      legacyHeaders: false,
    });

app.use(helmet());
app.use(cors());
app.use(limiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use(correlationId as any);
app.use(requestLogger as any);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use(errorHandler as any);

export { app };