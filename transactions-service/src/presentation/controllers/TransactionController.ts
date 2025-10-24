import { Response } from 'express';
import { ITransactionService } from '../../domain/interfaces/ITransactionService';
import { AppError } from '../../shared/errors/AppError';
import { RequestWithCorrelationId } from '../../middlewares/correlationId';
import { 
  createTransactionSchema, 
  getTransactionByIdSchema, 
  getTransactionsByUserSchema,
  paginationSchema 
} from '../../shared/validation/TransactionValidation';

export class TransactionController {
  constructor(private transactionService: ITransactionService) {}

  async createTransaction(req: RequestWithCorrelationId, res: Response): Promise<void> {
    try {
      const { error, value } = createTransactionSchema.validate(req.body);
      
      if (error) {
        throw new AppError(error.details[0]?.message || 'Validation error', 400);
      }

      const transaction = await this.transactionService.createTransaction(value);
      
      res.status(201).json({
        success: true,
        data: transaction,
        message: 'Transaction created successfully',
      });
    } catch (error) {
      throw error;
    }
  }

  async getTransactionById(req: RequestWithCorrelationId, res: Response): Promise<void> {
    try {
      const { error, value } = getTransactionByIdSchema.validate(req.params);
      
      if (error) {
        throw new AppError(error.details[0]?.message || 'Validation error', 400);
      }

      const transaction = await this.transactionService.getTransactionById(value.id);
      
      res.status(200).json({
        success: true,
        data: transaction,
      });
    } catch (error) {
      throw error;
    }
  }

  async getTransactionsByUserId(req: RequestWithCorrelationId, res: Response): Promise<void> {
    try {
      const paramsValidation = getTransactionsByUserSchema.validate(req.params);
      const queryValidation = paginationSchema.validate(req.query);
      
      if (paramsValidation.error) {
        throw new AppError(paramsValidation.error.details[0]?.message || 'Validation error', 400);
      }
      
      if (queryValidation.error) {
        throw new AppError(queryValidation.error.details[0]?.message || 'Validation error', 400);
      }

      const { userId } = paramsValidation.value;
      const { page, limit } = queryValidation.value;

      const result = await this.transactionService.getTransactionsByUserId(
        userId, 
        page, 
        limit
      );
      
      res.status(200).json({
        success: true,
        data: result.transactions,
        pagination: {
          page,
          limit,
          total: result.total,
        },
      });
    } catch (error) {
      throw error;
    }
  }
}