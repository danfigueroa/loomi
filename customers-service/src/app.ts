import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { logger } from '@/config/logger';
import { errorHandler } from '@/middlewares/errorHandler';
import { requestLogger } from '@/middlewares/requestLogger';
import { correlationId } from '@/middlewares/correlationId';
import { healthController } from '@/controllers/healthController';
import { userRoutes } from '@/routes/userRoutes';

const app = express();

const limiter = rateLimit({
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

app.use(correlationId);
app.use(requestLogger);

app.get('/health', healthController.check);
app.use('/api/users', userRoutes);

app.use(errorHandler);

export { app };