import { Transaction } from '../entities/Transaction';

export interface CreateTransactionRequest {
  fromUserId: string;
  toUserId: string;
  amount: number;
  description?: string;
  type?: string;
}

export interface ITransactionService {
  createTransaction(data: CreateTransactionRequest): Promise<Transaction>;
  getTransactionById(id: string): Promise<Transaction>;
  getTransactionsByUserId(userId: string, page?: number, limit?: number): Promise<{ transactions: Transaction[], total: number }>;
  processTransaction(id: string): Promise<Transaction>;
  cancelTransaction(id: string): Promise<Transaction>;
}