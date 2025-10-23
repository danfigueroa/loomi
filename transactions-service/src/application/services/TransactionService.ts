import { Transaction, TransactionStatus } from '@/domain/entities/Transaction';
import { ITransactionService, CreateTransactionRequest } from '@/domain/interfaces/ITransactionService';
import { ITransactionRepository } from '@/domain/interfaces/ITransactionRepository';
import { ICustomerService } from '@/domain/interfaces/ICustomerService';
import { AppError } from '@/shared/errors/AppError';
import { v4 as uuidv4 } from 'uuid';

export class TransactionService implements ITransactionService {
  constructor(
    private transactionRepository: ITransactionRepository,
    private customerService: ICustomerService
  ) {}

  async createTransaction(data: CreateTransactionRequest): Promise<Transaction> {
    if (data.amount <= 0) {
      throw new AppError('Amount must be greater than zero', 400);
    }

    if (data.fromUserId === data.toUserId) {
      throw new AppError('Cannot transfer to the same user', 400);
    }

    await this.customerService.validateUser(data.fromUserId);
    await this.customerService.validateUser(data.toUserId);

    const transactionData = {
      ...data,
      externalReference: uuidv4(),
    };

    return await this.transactionRepository.create(transactionData);
  }

  async getTransactionById(id: string): Promise<Transaction> {
    const transaction = await this.transactionRepository.findById(id);
    
    if (!transaction) {
      throw new AppError('Transaction not found', 404);
    }

    return transaction;
  }

  async getTransactionsByUserId(userId: string, page = 1, limit = 10): Promise<Transaction[]> {
    await this.customerService.validateUser(userId);
    
    return await this.transactionRepository.findByUserId(userId, page, limit);
  }

  async processTransaction(id: string): Promise<Transaction> {
    const transaction = await this.getTransactionById(id);

    if (transaction.status !== TransactionStatus.PENDING) {
      throw new AppError('Transaction cannot be processed', 400);
    }

    return await this.transactionRepository.updateStatus(
      id,
      TransactionStatus.PROCESSING,
      new Date()
    );
  }

  async cancelTransaction(id: string): Promise<Transaction> {
    const transaction = await this.getTransactionById(id);

    if (transaction.status === TransactionStatus.COMPLETED) {
      throw new AppError('Cannot cancel completed transaction', 400);
    }

    if (transaction.status === TransactionStatus.CANCELLED) {
      throw new AppError('Transaction already cancelled', 400);
    }

    return await this.transactionRepository.updateStatus(
      id,
      TransactionStatus.CANCELLED
    );
  }
}