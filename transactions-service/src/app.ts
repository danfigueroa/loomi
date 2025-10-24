import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import { errorHandler } from './shared/middlewares/errorHandler';
import { requestLogger } from './shared/middlewares/requestLogger';
import { correlationId } from './middlewares/correlationId';
import { healthController } from './controllers/healthController';
import { transactionRoutes } from './presentation/routes/transactionRoutes';
import { swaggerSpec } from './config/swagger';
import { logger } from './config/logger';

const app = express();

const limiter = process.env['NODE_ENV'] === 'test' 
  ? rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 100000,
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

app.get('/health', async (req, res) => {
  try {
    await healthController.check(req, res);
  } catch (error) {
    logger.error('Health endpoint error:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    
    if (!res.headersSent) {
      res.status(503).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        service: 'transactions-service',
        version: '1.0.0',
        uptime: process.uptime(),
        checks: {
          database: 'unhealthy',
          redis: 'unhealthy',
          customersService: 'unhealthy'
        }
      });
    }
  }
});
app.use('/api/transactions', transactionRoutes);

app.use(errorHandler);

export { app };