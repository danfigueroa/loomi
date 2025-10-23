import { TransactionRepository } from '@/infrastructure/repositories/TransactionRepository';
import { PrismaClient } from '@prisma/client';
import { Transaction, TransactionStatus, TransactionType } from '@/domain/entities/Transaction';
import { CreateTransactionData } from '@/domain/interfaces/ITransactionRepository';

const mockPrisma = {
  transaction: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn()
  }
} as unknown as jest.Mocked<PrismaClient>;

describe('TransactionRepository', () => {
  let transactionRepository: TransactionRepository;

  beforeEach(() => {
    transactionRepository = new TransactionRepository(mockPrisma);
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createData: CreateTransactionData = {
      fromUserId: 'user1',
      toUserId: 'user2',
      amount: 100,
      description: 'Test transaction',
      externalReference: 'ext-ref-123'
    };

    const mockPrismaTransaction = {
      id: 'transaction-id',
      fromUserId: 'user1',
      toUserId: 'user2',
      amount: 100,
      description: 'Test transaction',
      type: TransactionType.TRANSFER,
      externalReference: 'ext-ref-123',
      status: TransactionStatus.PENDING,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
      processedAt: null
    };

    it('should create transaction successfully', async () => {
      mockPrisma.transaction.create.mockResolvedValue(mockPrismaTransaction);

      const result = await transactionRepository.create(createData);

      expect(mockPrisma.transaction.create).toHaveBeenCalledWith({
        data: {
          fromUserId: 'user1',
          toUserId: 'user2',
          amount: 100,
          description: 'Test transaction',
          type: TransactionType.TRANSFER,
          externalReference: 'ext-ref-123',
          status: TransactionStatus.PENDING
        }
      });

      expect(result).toEqual({
        id: 'transaction-id',
        fromUserId: 'user1',
        toUserId: 'user2',
        amount: 100,
        description: 'Test transaction',
        type: TransactionType.TRANSFER,
        externalReference: 'ext-ref-123',
        status: TransactionStatus.PENDING,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        processedAt: null
      });
    });

    it('should create transaction with default type when not provided', async () => {
      const dataWithoutType = { ...createData };
      delete dataWithoutType.type;

      mockPrisma.transaction.create.mockResolvedValue(mockPrismaTransaction);

      await transactionRepository.create(dataWithoutType);

      expect(mockPrisma.transaction.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          type: TransactionType.TRANSFER
        })
      });
    });
  });

  describe('findById', () => {
    const mockPrismaTransaction = {
      id: 'transaction-id',
      fromUserId: 'user1',
      toUserId: 'user2',
      amount: 100,
      description: 'Test transaction',
      type: TransactionType.TRANSFER,
      status: TransactionStatus.COMPLETED,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
      processedAt: new Date('2024-01-01')
    };

    it('should return transaction when found', async () => {
      mockPrisma.transaction.findUnique.mockResolvedValue(mockPrismaTransaction);

      const result = await transactionRepository.findById('transaction-id');

      expect(mockPrisma.transaction.findUnique).toHaveBeenCalledWith({
        where: { id: 'transaction-id' }
      });

      expect(result).toEqual({
        id: 'transaction-id',
        fromUserId: 'user1',
        toUserId: 'user2',
        amount: 100,
        description: 'Test transaction',
        type: TransactionType.TRANSFER,
        status: TransactionStatus.COMPLETED,
        externalReference: undefined,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        processedAt: new Date('2024-01-01')
      });
    });

    it('should return null when transaction not found', async () => {
      mockPrisma.transaction.findUnique.mockResolvedValue(null);

      const result = await transactionRepository.findById('non-existent-id');

      expect(result).toBeNull();
    });
  });

  describe('findByUserId', () => {
    const mockTransactions = [
      {
        id: 'tx1',
        fromUserId: 'user1',
        toUserId: 'user2',
        amount: 100,
        createdAt: new Date('2024-01-02')
      },
      {
        id: 'tx2',
        fromUserId: 'user2',
        toUserId: 'user1',
        amount: 50,
        createdAt: new Date('2024-01-01')
      }
    ];

    it('should return transactions for user with default pagination', async () => {
      mockPrisma.transaction.findMany.mockResolvedValue(mockTransactions);

      const result = await transactionRepository.findByUserId('user1');

      expect(mockPrisma.transaction.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { fromUserId: 'user1' },
            { toUserId: 'user1' }
          ]
        },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 10
      });

      expect(result).toHaveLength(2);
    });

    it('should return transactions with custom pagination', async () => {
      mockPrisma.transaction.findMany.mockResolvedValue([mockTransactions[0]]);

      const result = await transactionRepository.findByUserId('user1', 2, 5);

      expect(mockPrisma.transaction.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { fromUserId: 'user1' },
            { toUserId: 'user1' }
          ]
        },
        orderBy: { createdAt: 'desc' },
        skip: 5,
        take: 5
      });
    });

    it('should return empty array when no transactions found', async () => {
      mockPrisma.transaction.findMany.mockResolvedValue([]);

      const result = await transactionRepository.findByUserId('user-without-transactions');

      expect(result).toEqual([]);
    });
  });

  describe('updateStatus', () => {
    const mockUpdatedTransaction = {
      id: 'transaction-id',
      fromUserId: 'user1',
      toUserId: 'user2',
      amount: 100,
      status: TransactionStatus.COMPLETED,
      processedAt: new Date('2024-01-01T10:00:00Z')
    };

    it('should update transaction status successfully', async () => {
      const processedAt = new Date('2024-01-01T10:00:00Z');
      mockPrisma.transaction.update.mockResolvedValue(mockUpdatedTransaction);

      const result = await transactionRepository.updateStatus(
        'transaction-id',
        TransactionStatus.COMPLETED,
        processedAt
      );

      expect(mockPrisma.transaction.update).toHaveBeenCalledWith({
        where: { id: 'transaction-id' },
        data: {
          status: TransactionStatus.COMPLETED,
          processedAt
        }
      });

      expect(result.status).toBe(TransactionStatus.COMPLETED);
      expect(result.processedAt).toEqual(processedAt);
    });

    it('should update status without processedAt', async () => {
      mockPrisma.transaction.update.mockResolvedValue({
        ...mockUpdatedTransaction,
        processedAt: null
      });

      await transactionRepository.updateStatus('transaction-id', TransactionStatus.CANCELLED);

      expect(mockPrisma.transaction.update).toHaveBeenCalledWith({
        where: { id: 'transaction-id' },
        data: {
          status: TransactionStatus.CANCELLED,
          processedAt: undefined
        }
      });
    });
  });

  describe('findAll', () => {
    const mockTransactions = [
      { id: 'tx1', amount: 100, createdAt: new Date('2024-01-02') },
      { id: 'tx2', amount: 200, createdAt: new Date('2024-01-01') }
    ];

    it('should return all transactions with default pagination', async () => {
      mockPrisma.transaction.findMany.mockResolvedValue(mockTransactions);

      const result = await transactionRepository.findAll();

      expect(mockPrisma.transaction.findMany).toHaveBeenCalledWith({
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 10
      });

      expect(result).toHaveLength(2);
    });

    it('should return transactions with custom pagination', async () => {
      mockPrisma.transaction.findMany.mockResolvedValue([mockTransactions[0]]);

      const result = await transactionRepository.findAll(3, 5);

      expect(mockPrisma.transaction.findMany).toHaveBeenCalledWith({
        orderBy: { createdAt: 'desc' },
        skip: 10,
        take: 5
      });
    });
  });

  describe('mapToEntity', () => {
    it('should handle decimal amount conversion', async () => {
      const mockTransaction = {
        id: 'tx1',
        amount: { toString: () => '99.99' },
        fromUserId: 'user1',
        toUserId: 'user2',
        status: TransactionStatus.PENDING,
        type: TransactionType.TRANSFER
      };

      mockPrisma.transaction.create.mockResolvedValue(mockTransaction);

      const result = await transactionRepository.create({
        fromUserId: 'user1',
        toUserId: 'user2',
        amount: 99.99
      });

      expect(result.amount).toBe(99.99);
    });
  });
});