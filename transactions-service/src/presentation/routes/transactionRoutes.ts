import { Router } from 'express';
import { TransactionController } from '@/presentation/controllers/TransactionController';
import { TransactionService } from '@/application/services/TransactionService';
import { TransactionRepository } from '@/infrastructure/repositories/TransactionRepository';
import { CustomerService } from '@/infrastructure/services/CustomerService';
import { prisma } from '@/config/database';
import { authenticateToken } from '@/shared/middlewares/auth';
import { createRateLimiter } from '@/shared/middlewares/rateLimiter';

const router = Router();

const transactionRepository = new TransactionRepository(prisma);
const customerService = new CustomerService();
const transactionService = new TransactionService(transactionRepository, customerService);
const transactionController = new TransactionController(transactionService);

const transactionRateLimit = createRateLimiter(60000, 10);

router.post(
  '/transactions',
  transactionRateLimit,
  authenticateToken,
  async (req, res, next) => {
    try {
      await transactionController.createTransaction(req, res);
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  '/transactions/:id',
  authenticateToken,
  async (req, res, next) => {
    try {
      await transactionController.getTransactionById(req, res);
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  '/transactions/user/:userId',
  authenticateToken,
  async (req, res, next) => {
    try {
      await transactionController.getTransactionsByUserId(req, res);
    } catch (error) {
      next(error);
    }
  }
);

export { router as transactionRoutes };