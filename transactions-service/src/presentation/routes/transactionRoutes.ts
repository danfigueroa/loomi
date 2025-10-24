import { Router } from 'express';
import { TransactionController } from '../controllers/TransactionController';
import { TransactionService } from '../../application/services/TransactionService';
import { TransactionRepository } from '../../infrastructure/repositories/TransactionRepository';
import { CustomerService } from '../../infrastructure/services/CustomerService';
import { prisma } from '../../config/database';
import { authenticateToken } from '../../shared/middlewares/auth';
import { createRateLimiter } from '../../shared/middlewares/rateLimiter';

const router = Router();

const transactionRepository = new TransactionRepository(prisma);
const customerService = new CustomerService();
const transactionService = new TransactionService(transactionRepository, customerService);
const transactionController = new TransactionController(transactionService);

// Disable rate limiting in test environment
const transactionRateLimit = process.env['NODE_ENV'] === 'test' 
  ? createRateLimiter(60000, 10000) // Very high limit for tests
  : createRateLimiter(60000, 10);

router.post(
  '/',
  transactionRateLimit,
  authenticateToken,
  async (req: any, res: any, next: any) => {
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
  async (req: any, res: any, next: any) => {
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
  async (req: any, res: any, next: any) => {
    try {
      await transactionController.getTransactionsByUserId(req, res);
    } catch (error) {
      next(error);
    }
  }
);

export { router as transactionRoutes };