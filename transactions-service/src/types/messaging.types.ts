export interface PublishOptions {
  persistent?: boolean;
  correlationId?: string;
  replyTo?: string;
  expiration?: string;
  messageId?: string;
  timestamp?: number;
  type?: string;
  userId?: string;
  appId?: string;
  clusterId?: string;
  deliveryMode?: number;
  priority?: number;
  headers?: Record<string, any>;
}

export interface ConsumeOptions {
  noAck?: boolean;
  exclusive?: boolean;
  priority?: number;
  arguments?: Record<string, any>;
}

export type MessagePayload =
  | string
  | number
  | boolean
  | object
  | null
  | undefined
  | string[]
  | Record<string, any>;

export interface MessageHandler {
  (message: MessagePayload, ack: () => void, nack: (requeue?: boolean) => void): Promise<void>;
}

// Event payload types
export interface TransactionEventPayload extends Record<string, any> {
  transactionId: string;
  fromUserId: string;
  toUserId: string;
  amount: number;
  type: string;
  status: string;
  timestamp: string;
  correlationId?: string;
}

export interface TransactionProcessedEventPayload extends Record<string, any> {
  transactionId: string;
  fromUserId: string;
  toUserId: string;
  amount: number;
  type: string;
  status: string;
  processedAt: string;
  correlationId?: string;
}
