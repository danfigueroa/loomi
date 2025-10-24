import { Response } from 'express';
import { TransactionController } from '../../../../src/presentation/controllers/TransactionController';
import { ITransactionService } from '../../../../src/domain/interfaces/ITransactionService';
import { AppError } from '../../../../src/shared/errors/AppError';
import { RequestWithCorrelationId } from '../../../../src/middlewares/correlationId';
import { TransactionStatus, TransactionType } from '../../../../src/domain/entities/Transaction';

jest.mock('../../../../src/shared/validation/TransactionValidation', () => ({
  createTransactionSchema: {
    validate: jest.fn()
  },
  getTransactionByIdSchema: {
    validate: jest.fn()
  },
  getTransactionsByUserSchema: {
    validate: jest.fn()
  },
  paginationSchema: {
    validate: jest.fn()
  }
}));

describe('TransactionController', () => {
  let transactionController: TransactionController;
  let mockTransactionService: jest.Mocked<ITransactionService>;
  let mockRequest: Partial<RequestWithCorrelationId>;
  let mockResponse: Partial<Response>;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;

  beforeEach(() => {
    mockTransactionService = {
      createTransaction: jest.fn(),
      getTransactionById: jest.fn(),
      getTransactionsByUserId: jest.fn(),
      processTransaction: jest.fn(),
      cancelTransaction: jest.fn()
    };

    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnValue({ json: mockJson });
    
    mockRequest = {
      correlationId: 'test-correlation-id',
      body: {},
      params: {},
      query: {}
    };
    
    mockResponse = {
      status: mockStatus,
      json: mockJson
    };

    transactionController = new TransactionController(mockTransactionService);
    jest.clearAllMocks();
  });

  describe('createTransaction', () => {
    const { createTransactionSchema } = require('../../../../src/shared/validation/TransactionValidation');

    it('should create transaction successfully', async () => {
      const transactionData = {
        fromUserId: 'user1',
        toUserId: 'user2',
        amount: 100,
        description: 'Test transaction'
      };

      const createdTransaction = {
        id: 'transaction-id',
        ...transactionData,
        status: TransactionStatus.COMPLETED,
        type: TransactionType.TRANSFER,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      createTransactionSchema.validate.mockReturnValue({ value: transactionData });
      mockTransactionService.createTransaction.mockResolvedValue(createdTransaction);

      mockRequest.body = transactionData;

      await transactionController.createTransaction(
        mockRequest as RequestWithCorrelationId,
        mockResponse as Response
      );

      expect(createTransactionSchema.validate).toHaveBeenCalledWith(transactionData);
      expect(mockTransactionService.createTransaction).toHaveBeenCalledWith(
        transactionData
      );
      expect(mockStatus).toHaveBeenCalledWith(201);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: createdTransaction,
        message: 'Transaction created successfully'
      });
    });

    it('should throw validation error for invalid data', async () => {
      const validationError = {
        details: [{ message: 'Amount is required' }]
      };

      createTransactionSchema.validate.mockReturnValue({ error: validationError });

      await expect(
        transactionController.createTransaction(
          mockRequest as RequestWithCorrelationId,
          mockResponse as Response
        )
      ).rejects.toThrow(new AppError('Amount is required', 400));
    });

    it('should propagate service errors', async () => {
      const transactionData = { amount: 100 };
      const serviceError = new AppError('Insufficient funds', 400);

      createTransactionSchema.validate.mockReturnValue({ value: transactionData });
      mockTransactionService.createTransaction.mockRejectedValue(serviceError);

      mockRequest.body = transactionData;

      await expect(
        transactionController.createTransaction(
          mockRequest as RequestWithCorrelationId,
          mockResponse as Response
        )
      ).rejects.toThrow(serviceError);
    });
  });

  describe('getTransactionById', () => {
    const { getTransactionByIdSchema } = require('../../../../src/shared/validation/TransactionValidation');

    it('should get transaction by id successfully', async () => {
      const transactionId = 'transaction-id';
      const transaction = {
        id: transactionId,
        fromUserId: 'user1',
        toUserId: 'user2',
        amount: 100,
        status: TransactionStatus.COMPLETED,
        type: TransactionType.TRANSFER,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      getTransactionByIdSchema.validate.mockReturnValue({ value: { id: transactionId } });
      mockTransactionService.getTransactionById.mockResolvedValue(transaction);

      mockRequest.params = { id: transactionId };

      await transactionController.getTransactionById(
        mockRequest as RequestWithCorrelationId,
        mockResponse as Response
      );

      expect(getTransactionByIdSchema.validate).toHaveBeenCalledWith({ id: transactionId });
      expect(mockTransactionService.getTransactionById).toHaveBeenCalledWith(transactionId);
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: transaction
      });
    });

    it('should throw validation error for invalid id', async () => {
      const validationError = {
        details: [{ message: 'Invalid transaction ID' }]
      };

      getTransactionByIdSchema.validate.mockReturnValue({ error: validationError });

      await expect(
        transactionController.getTransactionById(
          mockRequest as RequestWithCorrelationId,
          mockResponse as Response
        )
      ).rejects.toThrow(new AppError('Invalid transaction ID', 400));
    });
  });

  describe('getTransactionsByUserId', () => {
    const { getTransactionsByUserSchema, paginationSchema } = require('../../../../src/shared/validation/TransactionValidation');

    it('should get transactions by user id successfully', async () => {
      const userId = 'user-id';
      const page = 1;
      const limit = 10;
      const transactions = [
        { 
          id: 'tx1', 
          fromUserId: 'user1',
          toUserId: 'user2',
          amount: 100,
          status: TransactionStatus.PENDING,
           type: TransactionType.TRANSFER,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        { 
          id: 'tx2', 
          fromUserId: 'user1',
          toUserId: 'user3',
          amount: 200,
          status: TransactionStatus.COMPLETED,
           type: TransactionType.TRANSFER,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      getTransactionsByUserSchema.validate.mockReturnValue({ value: { userId } });
      paginationSchema.validate.mockReturnValue({ value: { page, limit } });
      mockTransactionService.getTransactionsByUserId.mockResolvedValue({ transactions, total: 2 });

      mockRequest.params = { userId };
      mockRequest.query = { page: '1', limit: '10' };

      await transactionController.getTransactionsByUserId(
        mockRequest as RequestWithCorrelationId,
        mockResponse as Response
      );

      expect(getTransactionsByUserSchema.validate).toHaveBeenCalledWith({ userId });
      expect(paginationSchema.validate).toHaveBeenCalledWith({ page: '1', limit: '10' });
      expect(mockTransactionService.getTransactionsByUserId).toHaveBeenCalledWith(
        userId,
        page,
        limit
      );
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: transactions,
        pagination: {
          page,
          limit,
          total: 2
        }
      });
    });

    it('should throw validation error for invalid params', async () => {
      const validationError = {
        details: [{ message: 'Invalid user ID' }]
      };

      getTransactionsByUserSchema.validate.mockReturnValue({ error: validationError });
      paginationSchema.validate.mockReturnValue({ value: { page: 1, limit: 10 } });

      await expect(
        transactionController.getTransactionsByUserId(
          mockRequest as RequestWithCorrelationId,
          mockResponse as Response
        )
      ).rejects.toThrow(new AppError('Invalid user ID', 400));
    });

    it('should throw validation error for invalid query params', async () => {
      const validationError = {
        details: [{ message: 'Invalid pagination parameters' }]
      };

      getTransactionsByUserSchema.validate.mockReturnValue({ value: { userId: 'user-id' } });
      paginationSchema.validate.mockReturnValue({ error: validationError });

      await expect(
        transactionController.getTransactionsByUserId(
          mockRequest as RequestWithCorrelationId,
          mockResponse as Response
        )
      ).rejects.toThrow(new AppError('Invalid pagination parameters', 400));
    });
  });
});