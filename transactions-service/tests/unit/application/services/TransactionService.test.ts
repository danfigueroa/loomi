import { TransactionService } from '../../../../src/application/services/TransactionService';
import { ITransactionRepository } from '../../../../src/domain/interfaces/ITransactionRepository';
import { ICustomerService } from '../../../../src/domain/interfaces/ICustomerService';
import { ITransactionEventPublisher } from '../../../../src/domain/interfaces/IMessageBroker';
import { Transaction, TransactionStatus, TransactionType } from '../../../../src/domain/entities/Transaction';
import { AppError } from '../../../../src/shared/errors/AppError';
import { v4 as uuidv4 } from 'uuid';

jest.mock('uuid');

describe('TransactionService', () => {
  let transactionService: TransactionService;
  let mockTransactionRepository: jest.Mocked<ITransactionRepository>;
  let mockCustomerService: jest.Mocked<ICustomerService>;
  let mockTransactionEventPublisher: jest.Mocked<ITransactionEventPublisher>;

  beforeEach(() => {
    mockTransactionRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByUserId: jest.fn(),
      countByUserId: jest.fn(),
      updateStatus: jest.fn(),
      findAll: jest.fn()
    };

    mockCustomerService = {
      validateUser: jest.fn(),
      getUserById: jest.fn()
    };

    mockTransactionEventPublisher = {
      publishTransactionCreated: jest.fn(),
      publishTransactionProcessed: jest.fn(),
      publishTransactionCancelled: jest.fn()
    };

    transactionService = new TransactionService(
      mockTransactionRepository,
      mockCustomerService,
      mockTransactionEventPublisher
    );

    jest.clearAllMocks();
  });

  describe('createTransaction', () => {
    const validTransactionData = {
      fromUserId: 'user1',
      toUserId: 'user2',
      amount: 100,
      description: 'Test transaction'
    };

    it('should create transaction successfully', async () => {
      const mockUuid = 'mock-uuid';
      const expectedTransaction = {
        id: 'transaction-id',
        ...validTransactionData,
        externalReference: mockUuid,
        status: TransactionStatus.PENDING,
        type: TransactionType.TRANSFER,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const mockCustomer = { id: 'user1', name: 'Test User', email: 'test@example.com' };
      
      (uuidv4 as jest.Mock).mockReturnValue(mockUuid);
      mockCustomerService.validateUser.mockResolvedValue(mockCustomer);
      mockTransactionRepository.create.mockResolvedValue(expectedTransaction);

      const result = await transactionService.createTransaction(validTransactionData);

      expect(mockCustomerService.validateUser).toHaveBeenCalledWith('user1');
      expect(mockCustomerService.validateUser).toHaveBeenCalledWith('user2');
      expect(mockTransactionRepository.create).toHaveBeenCalledWith({
        ...validTransactionData,
        externalReference: mockUuid
      });
      expect(result).toEqual(expectedTransaction);
    });

    it('should throw error for zero amount', async () => {
      const invalidData = { ...validTransactionData, amount: 0 };

      await expect(
        transactionService.createTransaction(invalidData)
      ).rejects.toThrow(new AppError('Amount must be greater than zero', 400));

      expect(mockCustomerService.validateUser).not.toHaveBeenCalled();
      expect(mockTransactionRepository.create).not.toHaveBeenCalled();
    });

    it('should throw error for negative amount', async () => {
      const invalidData = { ...validTransactionData, amount: -100 };

      await expect(
        transactionService.createTransaction(invalidData)
      ).rejects.toThrow(new AppError('Amount must be greater than zero', 400));
    });

    it('should throw error for same user transfer', async () => {
      const invalidData = { ...validTransactionData, toUserId: 'user1' };

      await expect(
        transactionService.createTransaction(invalidData)
      ).rejects.toThrow(new AppError('Cannot transfer to the same user', 400));
    });

    it('should throw error when fromUser validation fails', async () => {
      const validationError = new AppError('User not found', 404);
      mockCustomerService.validateUser.mockRejectedValueOnce(validationError);

      await expect(
        transactionService.createTransaction(validTransactionData)
      ).rejects.toThrow(validationError);

      expect(mockTransactionRepository.create).not.toHaveBeenCalled();
    });

    it('should throw error when toUser validation fails', async () => {
      const mockCustomer = { id: 'user1', name: 'Test User', email: 'test@example.com' };
      const validationError = new AppError('User not found', 404);
      mockCustomerService.validateUser
        .mockResolvedValueOnce(mockCustomer)
        .mockRejectedValueOnce(validationError);

      await expect(
        transactionService.createTransaction(validTransactionData)
      ).rejects.toThrow(validationError);

      expect(mockTransactionRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('getTransactionById', () => {
    it('should return transaction when found', async () => {
      const mockTransaction = {
        id: 'transaction-id',
        amount: 100,
        status: TransactionStatus.COMPLETED
      } as Transaction;

      mockTransactionRepository.findById.mockResolvedValue(mockTransaction);

      const result = await transactionService.getTransactionById('transaction-id');

      expect(mockTransactionRepository.findById).toHaveBeenCalledWith('transaction-id');
      expect(result).toEqual(mockTransaction);
    });

    it('should throw error when transaction not found', async () => {
      mockTransactionRepository.findById.mockResolvedValue(null);

      await expect(
        transactionService.getTransactionById('non-existent-id')
      ).rejects.toThrow(new AppError('Transaction not found', 404));
    });
  });

  describe('getTransactionsByUserId', () => {
    it('should return transactions for valid user', async () => {
      const mockTransactions = [
        { id: 'tx1', amount: 100 },
        { id: 'tx2', amount: 200 }
      ] as Transaction[];

      const mockCustomer = { id: 'user-id', name: 'Test User', email: 'test@example.com' };
      
      mockCustomerService.validateUser.mockResolvedValue(mockCustomer);
      mockTransactionRepository.findByUserId.mockResolvedValue(mockTransactions);
      mockTransactionRepository.countByUserId.mockResolvedValue(2);

      const result = await transactionService.getTransactionsByUserId(
        'user-id',
        1,
        10
      );

      expect(mockCustomerService.validateUser).toHaveBeenCalledWith('user-id');
      expect(mockTransactionRepository.findByUserId).toHaveBeenCalledWith('user-id', 1, 10);
      expect(mockTransactionRepository.countByUserId).toHaveBeenCalledWith('user-id');
      expect(result).toEqual({ transactions: mockTransactions, total: 2 });
    });

    it('should use default pagination values', async () => {
      const mockCustomer = { id: 'user-id', name: 'Test User', email: 'test@example.com' };
      
      mockCustomerService.validateUser.mockResolvedValue(mockCustomer);
      mockTransactionRepository.findByUserId.mockResolvedValue([]);
      mockTransactionRepository.countByUserId.mockResolvedValue(0);

      await transactionService.getTransactionsByUserId('user-id');

      expect(mockTransactionRepository.findByUserId).toHaveBeenCalledWith('user-id', 1, 10);
      expect(mockTransactionRepository.countByUserId).toHaveBeenCalledWith('user-id');
    });

    it('should throw error when user validation fails', async () => {
      const validationError = new AppError('User not found', 404);
      mockCustomerService.validateUser.mockRejectedValue(validationError);

      await expect(
        transactionService.getTransactionsByUserId('invalid-user-id')
      ).rejects.toThrow(validationError);

      expect(mockTransactionRepository.findByUserId).not.toHaveBeenCalled();
    });
  });

  describe('processTransaction', () => {
    it('should process pending transaction successfully', async () => {
      const mockTransaction = {
        id: 'transaction-id',
        status: TransactionStatus.PENDING
      } as Transaction;

      const processedTransaction = {
        ...mockTransaction,
        status: TransactionStatus.PROCESSING
      } as Transaction;

      mockTransactionRepository.findById.mockResolvedValue(mockTransaction);
      mockTransactionRepository.updateStatus.mockResolvedValue(processedTransaction);

      const result = await transactionService.processTransaction('transaction-id');

      expect(mockTransactionRepository.updateStatus).toHaveBeenCalledWith(
        'transaction-id',
        TransactionStatus.PROCESSING,
        expect.any(Date)
      );
      expect(result).toEqual(processedTransaction);
    });

    it('should throw error for non-pending transaction', async () => {
      const mockTransaction = {
        id: 'transaction-id',
        status: TransactionStatus.COMPLETED
      } as Transaction;

      mockTransactionRepository.findById.mockResolvedValue(mockTransaction);

      await expect(
        transactionService.processTransaction('transaction-id')
      ).rejects.toThrow(new AppError('Transaction cannot be processed', 400));

      expect(mockTransactionRepository.updateStatus).not.toHaveBeenCalled();
    });
  });

  describe('cancelTransaction', () => {
    it('should cancel pending transaction successfully', async () => {
      const mockTransaction = {
        id: 'transaction-id',
        status: TransactionStatus.PENDING
      } as Transaction;

      const cancelledTransaction = {
        ...mockTransaction,
        status: TransactionStatus.CANCELLED
      } as Transaction;

      mockTransactionRepository.findById.mockResolvedValue(mockTransaction);
      mockTransactionRepository.updateStatus.mockResolvedValue(cancelledTransaction);

      const result = await transactionService.cancelTransaction('transaction-id');

      expect(mockTransactionRepository.updateStatus).toHaveBeenCalledWith(
        'transaction-id',
        TransactionStatus.CANCELLED
      );
      expect(result).toEqual(cancelledTransaction);
    });

    it('should throw error for completed transaction', async () => {
      const mockTransaction = {
        id: 'transaction-id',
        status: TransactionStatus.COMPLETED
      } as Transaction;

      mockTransactionRepository.findById.mockResolvedValue(mockTransaction);

      await expect(
        transactionService.cancelTransaction('transaction-id')
      ).rejects.toThrow(new AppError('Transaction cannot be cancelled', 400));
    });

    it('should throw error for already cancelled transaction', async () => {
      const mockTransaction = {
        id: 'transaction-id',
        status: TransactionStatus.CANCELLED
      } as Transaction;

      mockTransactionRepository.findById.mockResolvedValue(mockTransaction);

      await expect(
        transactionService.cancelTransaction('transaction-id')
      ).rejects.toThrow(new AppError('Transaction cannot be cancelled', 400));
    });
  });
});