import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { transactionRoutes } from '@/presentation/routes/transactionRoutes';
import { errorHandler } from '@/shared/middlewares/errorHandler';
import { defaultRateLimiter } from '@/shared/middlewares/rateLimiter';
import { logger } from '@/config/logger';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use(morgan('combined', {
  stream: {
    write: (message: string) => {
      logger.info(message.trim());
    },
  },
}));

app.use(defaultRateLimiter);

const apiPrefix = process.env.API_PREFIX || '/api';
app.use(apiPrefix, transactionRoutes);

app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Transactions service is healthy',
    timestamp: new Date().toISOString(),
  });
});

app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

app.use(errorHandler);

export { app };