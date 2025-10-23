import { PrismaClient } from '@prisma/client';
import { Transaction, TransactionStatus, TransactionType } from '@/domain/entities/Transaction';
import { ITransactionRepository, CreateTransactionData } from '@/domain/interfaces/ITransactionRepository';

export class TransactionRepository implements ITransactionRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: CreateTransactionData): Promise<Transaction> {
    const transaction = await this.prisma.transaction.create({
      data: {
        fromUserId: data.fromUserId,
        toUserId: data.toUserId,
        amount: data.amount,
        description: data.description,
        type: (data.type as TransactionType) || TransactionType.TRANSFER,
        externalReference: data.externalReference,
        status: TransactionStatus.PENDING,
      },
    });

    return this.mapToEntity(transaction);
  }

  async findById(id: string): Promise<Transaction | null> {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id },
    });

    return transaction ? this.mapToEntity(transaction) : null;
  }

  async findByUserId(userId: string, page = 1, limit = 10): Promise<Transaction[]> {
    const skip = (page - 1) * limit;
    
    const transactions = await this.prisma.transaction.findMany({
      where: {
        OR: [
          { fromUserId: userId },
          { toUserId: userId },
        ],
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });

    return transactions.map(this.mapToEntity);
  }

  async updateStatus(id: string, status: string, processedAt?: Date): Promise<Transaction> {
    const transaction = await this.prisma.transaction.update({
      where: { id },
      data: {
        status: status as TransactionStatus,
        processedAt,
      },
    });

    return this.mapToEntity(transaction);
  }

  async findAll(page = 1, limit = 10): Promise<Transaction[]> {
    const skip = (page - 1) * limit;
    
    const transactions = await this.prisma.transaction.findMany({
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });

    return transactions.map(this.mapToEntity);
  }

  private mapToEntity(transaction: any): Transaction {
    return {
      id: transaction.id,
      fromUserId: transaction.fromUserId,
      toUserId: transaction.toUserId,
      amount: parseFloat(transaction.amount.toString()),
      description: transaction.description,
      status: transaction.status as TransactionStatus,
      type: transaction.type as TransactionType,
      externalReference: transaction.externalReference,
      createdAt: transaction.createdAt,
      updatedAt: transaction.updatedAt,
      processedAt: transaction.processedAt,
    };
  }
}