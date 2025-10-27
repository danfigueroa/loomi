import type { TransactionStatus, TransactionType } from '../domain/entities/Transaction';


export interface CreateTransactionRequest {
  fromUserId: string;
  toUserId: string;
  amount: number;
  description?: string;
  type: TransactionType;
  externalReference?: string;
}

export interface GetTransactionByIdRequest {
  id: string;
}

export interface GetTransactionsByUserRequest {
  userId: string;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
}


export interface TransactionResponse {
  id: string;
  fromUserId: string;
  toUserId: string;
  amount: number;
  description?: string;
  status: TransactionStatus;
  type: TransactionType;
  externalReference?: string;
  createdAt: Date;
  updatedAt: Date;
  processedAt?: Date;
}

export interface CreateTransactionResponse {
  success: boolean;
  data: TransactionResponse;
  message: string;
  correlationId?: string;
}

export interface GetTransactionResponse {
  success: boolean;
  data: TransactionResponse;
  correlationId?: string;
}

export interface GetTransactionsResponse {
  success: boolean;
  data: TransactionResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
  correlationId?: string;
}


export interface TransactionServiceResult {
  transactions: TransactionResponse[];
  total: number;
}


export interface TransactionEventData {
  transactionId: string;
  fromUserId: string;
  toUserId: string;
  amount: number;
  type: TransactionType;
  status: TransactionStatus;
  timestamp: Date;
  correlationId?: string;
}

export interface TransactionProcessedEventData {
  transactionId: string;
  fromUserId: string;
  toUserId: string;
  amount: number;
  type: TransactionType;
  status: TransactionStatus;
  processedAt: Date;
  correlationId?: string;
}
