import { Router, Response, NextFunction } from 'express';
import { TransactionController } from '../controllers/TransactionController';
import { TransactionService } from '../../application/services/TransactionService';
import { TransactionRepository } from '../../infrastructure/repositories/TransactionRepository';
import { CustomerService } from '../../infrastructure/services/CustomerService';
import { RabbitMQBroker } from '../../infrastructure/messaging/RabbitMQBroker';
import { TransactionEventPublisher } from '../../infrastructure/messaging/TransactionEventPublisher';
import { prisma } from '../../config/database';
import { authenticateToken } from '../../shared/middlewares/auth';
import { createRateLimiter } from '../../shared/middlewares/rateLimiter';
import { AppError } from '../../shared/errors/AppError';
import { RequestWithCorrelationId } from '../../middlewares/correlationId';

const router = Router();

// Verificar se prisma não é null
if (!prisma) {
  throw new AppError('Database connection not available', 500);
}

const transactionRepository = new TransactionRepository(prisma);
const customerService = new CustomerService();
const messageBroker = new RabbitMQBroker();
const transactionEventPublisher = new TransactionEventPublisher(messageBroker);
const transactionService = new TransactionService(transactionRepository, customerService, transactionEventPublisher);
const transactionController = new TransactionController(transactionService);

const transactionRateLimit = process.env['NODE_ENV'] === 'test' 
  ? createRateLimiter(60000, 5)
  : createRateLimiter(60000, 10);

router.post(
  '/',
  transactionRateLimit,
  authenticateToken,
  async (req: RequestWithCorrelationId, res: Response, next: NextFunction) => {
    try {
      await transactionController.createTransaction(req, res);
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  '/:id',
  authenticateToken,
  async (req: RequestWithCorrelationId, res: Response, next: NextFunction) => {
    try {
      await transactionController.getTransactionById(req, res);
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  '/user/:userId',
  authenticateToken,
  async (req: RequestWithCorrelationId, res: Response, next: NextFunction) => {
    try {
      await transactionController.getTransactionsByUserId(req, res);
    } catch (error) {
      next(error);
    }
  }
);

export { router as transactionRoutes };