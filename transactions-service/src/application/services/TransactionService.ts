import { Transaction, TransactionStatus } from '../../domain/entities/Transaction';
import { ITransactionService, CreateTransactionRequest } from '../../domain/interfaces/ITransactionService';
import { ITransactionRepository } from '../../domain/interfaces/ITransactionRepository';
import { ICustomerService } from '../../domain/interfaces/ICustomerService';
import { ITransactionEventPublisher } from '../../domain/interfaces/IMessageBroker';
import { AppError } from '../../shared/errors/AppError';
import { v4 as uuidv4 } from 'uuid';

export class TransactionService implements ITransactionService {
  constructor(
    private transactionRepository: ITransactionRepository,
    private customerService: ICustomerService,
    private transactionEventPublisher: ITransactionEventPublisher
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

    const transaction = await this.transactionRepository.create(transactionData);

    // Publicar evento de transação criada
    try {
      const eventData: any = {
        transactionId: transaction.id,
        fromUserId: transaction.fromUserId,
        toUserId: transaction.toUserId,
        amount: transaction.amount,
        type: transaction.type,
        createdAt: transaction.createdAt,
      };

      if (transaction.description) {
        eventData.description = transaction.description;
      }

      if (transaction.externalReference) {
        eventData.correlationId = transaction.externalReference;
      }

      await this.transactionEventPublisher.publishTransactionCreated(transaction.id, eventData);
    } catch (error) {
      // Log do erro mas não falha a transação
      console.error('Failed to publish transaction created event:', error);
    }

    return transaction;
  }

  async getTransactionById(id: string): Promise<Transaction> {
    const transaction = await this.transactionRepository.findById(id);
    
    if (!transaction) {
      throw new AppError('Transaction not found', 404);
    }

    return transaction;
  }

  async getTransactionsByUserId(userId: string, page = 1, limit = 10): Promise<{ transactions: Transaction[], total: number }> {
    await this.customerService.validateUser(userId);
    
    const [transactions, total] = await Promise.all([
      this.transactionRepository.findByUserId(userId, page, limit),
      this.transactionRepository.countByUserId(userId)
    ]);

    return { transactions, total };
  }

  async processTransaction(id: string): Promise<Transaction> {
    const transaction = await this.getTransactionById(id);

    if (transaction.status !== TransactionStatus.PENDING) {
      throw new AppError('Transaction cannot be processed', 400);
    }

    const updatedTransaction = await this.transactionRepository.updateStatus(
      id,
      TransactionStatus.PROCESSING,
      new Date()
    );

    // Publicar evento de transação processada
    try {
      const processedEventData: any = {
        transactionId: transaction.id,
        status: TransactionStatus.PROCESSING,
        processedAt: new Date(),
      };

      if (transaction.externalReference) {
        processedEventData.correlationId = transaction.externalReference;
      }

      await this.transactionEventPublisher.publishTransactionProcessed(transaction.id, processedEventData);
    } catch (error) {
      console.error('Failed to publish transaction processed event:', error);
    }

    return updatedTransaction;
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