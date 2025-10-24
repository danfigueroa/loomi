import { Transaction } from '../entities/Transaction';

export interface CreateTransactionData {
  fromUserId: string;
  toUserId: string;
  amount: number;
  description?: string;
  type?: string;
  externalReference?: string;
}

export interface ITransactionRepository {
  create(data: CreateTransactionData): Promise<Transaction>;
  findById(id: string): Promise<Transaction | null>;
  findByUserId(userId: string, page?: number, limit?: number): Promise<Transaction[]>;
  countByUserId(userId: string): Promise<number>;
  updateStatus(id: string, status: string, processedAt?: Date): Promise<Transaction>;
  findAll(page?: number, limit?: number): Promise<Transaction[]>;
}