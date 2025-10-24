import { TransactionService } from '../../src/application/services/TransactionService';
import { ITransactionRepository } from '../../src/domain/interfaces/ITransactionRepository';
import { ICustomerService } from '../../src/domain/interfaces/ICustomerService';
import { Transaction, TransactionStatus, TransactionType } from '../../src/domain/entities/Transaction';
import { AppError } from '../../src/shared/errors/AppError';

const mockTransactionRepository: jest.Mocked<ITransactionRepository> = {
  create: jest.fn(),
  findById: jest.fn(),
  findByUserId: jest.fn(),
  updateStatus: jest.fn(),
  findAll: jest.fn(),
};

const mockCustomerService: jest.Mocked<ICustomerService> = {
  validateUser: jest.fn(),
  getUserById: jest.fn(),
};

describe('TransactionService', () => {
  let transactionService: TransactionService;

  beforeEach(() => {
    transactionService = new TransactionService(mockTransactionRepository, mockCustomerService);
    jest.clearAllMocks();
  });

  describe('createTransaction', () => {
    const validTransactionData = {
      fromUserId: '123e4567-e89b-12d3-a456-426614174000',
      toUserId: '123e4567-e89b-12d3-a456-426614174001',
      amount: 100.50,
      description: 'Test transaction',
    };

    const mockTransaction: Transaction = {
      id: '123e4567-e89b-12d3-a456-426614174002',
      ...validTransactionData,
      status: TransactionStatus.PENDING,
      type: TransactionType.TRANSFER,
      externalReference: 'ext-ref-123',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should create a transaction successfully', async () => {
      mockCustomerService.validateUser.mockResolvedValue({
        id: validTransactionData.fromUserId,
        name: 'John Doe',
        email: 'john@example.com',
      });
      mockCustomerService.validateUser.mockResolvedValue({
        id: validTransactionData.toUserId,
        name: 'Jane Doe',
        email: 'jane@example.com',
      });
      mockTransactionRepository.create.mockResolvedValue(mockTransaction);

      const result = await transactionService.createTransaction(validTransactionData);

      expect(result).toEqual(mockTransaction);
      expect(mockCustomerService.validateUser).toHaveBeenCalledTimes(2);
      expect(mockTransactionRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          ...validTransactionData,
          externalReference: expect.any(String),
        })
      );
    });

    it('should throw error for invalid amount', async () => {
      const invalidData = { ...validTransactionData, amount: -10 };

      await expect(transactionService.createTransaction(invalidData))
        .rejects.toThrow(new AppError('Amount must be greater than zero', 400));
    });

    it('should throw error for same user transfer', async () => {
      const invalidData = { 
        ...validTransactionData, 
        toUserId: validTransactionData.fromUserId 
      };

      await expect(transactionService.createTransaction(invalidData))
        .rejects.toThrow(new AppError('Cannot transfer to the same user', 400));
    });

    it('should throw error when from user is invalid', async () => {
      mockCustomerService.validateUser.mockRejectedValue(
        new AppError('User not found', 404)
      );

      await expect(transactionService.createTransaction(validTransactionData))
        .rejects.toThrow(new AppError('User not found', 404));
    });
  });

  describe('getTransactionById', () => {
    const transactionId = '123e4567-e89b-12d3-a456-426614174002';
    const mockTransaction: Transaction = {
      id: transactionId,
      fromUserId: '123e4567-e89b-12d3-a456-426614174000',
      toUserId: '123e4567-e89b-12d3-a456-426614174001',
      amount: 100.50,
      status: TransactionStatus.PENDING,
      type: TransactionType.TRANSFER,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should return transaction when found', async () => {
      mockTransactionRepository.findById.mockResolvedValue(mockTransaction);

      const result = await transactionService.getTransactionById(transactionId);

      expect(result).toEqual(mockTransaction);
      expect(mockTransactionRepository.findById).toHaveBeenCalledWith(transactionId);
    });

    it('should throw error when transaction not found', async () => {
      mockTransactionRepository.findById.mockResolvedValue(null);

      await expect(transactionService.getTransactionById(transactionId))
        .rejects.toThrow(new AppError('Transaction not found', 404));
    });
  });

  describe('getTransactionsByUserId', () => {
    const userId = '123e4567-e89b-12d3-a456-426614174000';
    const mockTransactions: Transaction[] = [
      {
        id: '123e4567-e89b-12d3-a456-426614174002',
        fromUserId: userId,
        toUserId: '123e4567-e89b-12d3-a456-426614174001',
        amount: 100.50,
        status: TransactionStatus.COMPLETED,
        type: TransactionType.TRANSFER,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    it('should return user transactions', async () => {
      mockCustomerService.validateUser.mockResolvedValue({
        id: userId,
        name: 'John Doe',
        email: 'john@example.com',
      });
      mockTransactionRepository.findByUserId.mockResolvedValue(mockTransactions);

      const result = await transactionService.getTransactionsByUserId(userId);

      expect(result).toEqual(mockTransactions);
      expect(mockCustomerService.validateUser).toHaveBeenCalledWith(userId);
      expect(mockTransactionRepository.findByUserId).toHaveBeenCalledWith(userId, 1, 10);
    });

    it('should throw error when user is invalid', async () => {
      mockCustomerService.validateUser.mockRejectedValue(
        new AppError('User not found', 404)
      );

      await expect(transactionService.getTransactionsByUserId(userId))
        .rejects.toThrow(new AppError('User not found', 404));
    });
  });

  describe('processTransaction', () => {
    const transactionId = '123e4567-e89b-12d3-a456-426614174002';
    const mockTransaction: Transaction = {
      id: transactionId,
      fromUserId: '123e4567-e89b-12d3-a456-426614174000',
      toUserId: '123e4567-e89b-12d3-a456-426614174001',
      amount: 100.50,
      status: TransactionStatus.PENDING,
      type: TransactionType.TRANSFER,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should process pending transaction', async () => {
      const processedTransaction = { ...mockTransaction, status: TransactionStatus.PROCESSING };
      
      mockTransactionRepository.findById.mockResolvedValue(mockTransaction);
      mockTransactionRepository.updateStatus.mockResolvedValue(processedTransaction);

      const result = await transactionService.processTransaction(transactionId);

      expect(result.status).toBe(TransactionStatus.PROCESSING);
      expect(mockTransactionRepository.updateStatus).toHaveBeenCalledWith(
        transactionId,
        TransactionStatus.PROCESSING,
        expect.any(Date)
      );
    });

    it('should throw error for non-pending transaction', async () => {
      const completedTransaction = { ...mockTransaction, status: TransactionStatus.COMPLETED };
      mockTransactionRepository.findById.mockResolvedValue(completedTransaction);

      await expect(transactionService.processTransaction(transactionId))
        .rejects.toThrow(new AppError('Transaction cannot be processed', 400));
    });
  });

  describe('cancelTransaction', () => {
    const transactionId = '123e4567-e89b-12d3-a456-426614174002';
    const mockTransaction: Transaction = {
      id: transactionId,
      fromUserId: '123e4567-e89b-12d3-a456-426614174000',
      toUserId: '123e4567-e89b-12d3-a456-426614174001',
      amount: 100.50,
      status: TransactionStatus.PENDING,
      type: TransactionType.TRANSFER,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should cancel pending transaction', async () => {
      const cancelledTransaction = { ...mockTransaction, status: TransactionStatus.CANCELLED };
      
      mockTransactionRepository.findById.mockResolvedValue(mockTransaction);
      mockTransactionRepository.updateStatus.mockResolvedValue(cancelledTransaction);

      const result = await transactionService.cancelTransaction(transactionId);

      expect(result.status).toBe(TransactionStatus.CANCELLED);
      expect(mockTransactionRepository.updateStatus).toHaveBeenCalledWith(
        transactionId,
        TransactionStatus.CANCELLED
      );
    });

    it('should throw error for completed transaction', async () => {
      const completedTransaction = { ...mockTransaction, status: TransactionStatus.COMPLETED };
      mockTransactionRepository.findById.mockResolvedValue(completedTransaction);

      await expect(transactionService.cancelTransaction(transactionId))
        .rejects.toThrow(new AppError('Cannot cancel completed transaction', 400));
    });

    it('should throw error for already cancelled transaction', async () => {
      const cancelledTransaction = { ...mockTransaction, status: TransactionStatus.CANCELLED };
      mockTransactionRepository.findById.mockResolvedValue(cancelledTransaction);

      await expect(transactionService.cancelTransaction(transactionId))
        .rejects.toThrow(new AppError('Transaction already cancelled', 400));
    });
  });
});