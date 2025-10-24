/**
 * Interface para definir contratos de mensageria
 * Seguindo padrões de Clean Architecture
 */
export interface IMessageBroker {
  /**
   * Conecta ao broker de mensagens
   */
  connect(): Promise<void>;

  /**
   * Desconecta do broker de mensagens
   */
  disconnect(): Promise<void>;

  /**
   * Publica uma mensagem em uma fila específica
   * @param queue Nome da fila
   * @param message Mensagem a ser publicada
   * @param options Opções adicionais para publicação
   */
  publish(queue: string, message: any, options?: PublishOptions): Promise<void>;

  /**
   * Consome mensagens de uma fila específica
   * @param queue Nome da fila
   * @param handler Função para processar as mensagens
   * @param options Opções adicionais para consumo
   */
  consume(queue: string, handler: MessageHandler, options?: ConsumeOptions): Promise<void>;

  /**
   * Verifica se a conexão está ativa
   */
  isConnected(): boolean;
}

/**
 * Interface para definir o handler de mensagens
 */
export interface MessageHandler {
  (message: any, ack: () => void, nack: (requeue?: boolean) => void): Promise<void>;
}

/**
 * Opções para publicação de mensagens
 */
export interface PublishOptions {
  persistent?: boolean;
  priority?: number;
  expiration?: string;
  correlationId?: string;
  replyTo?: string;
}

/**
 * Opções para consumo de mensagens
 */
export interface ConsumeOptions {
  noAck?: boolean;
  exclusive?: boolean;
  priority?: number;
  consumerTag?: string;
}

/**
 * Interface para eventos de transação
 */
export interface ITransactionEventPublisher {
  /**
   * Publica evento de transação criada
   * @param transactionId ID da transação
   * @param data Dados da transação
   */
  publishTransactionCreated(transactionId: string, data: TransactionCreatedEvent): Promise<void>;

  /**
   * Publica evento de transação processada
   * @param transactionId ID da transação
   * @param data Dados da transação processada
   */
  publishTransactionProcessed(transactionId: string, data: TransactionProcessedEvent): Promise<void>;

  /**
   * Publica evento de transação cancelada
   * @param transactionId ID da transação
   * @param data Dados da transação cancelada
   */
  publishTransactionCancelled(transactionId: string, data: TransactionCancelledEvent): Promise<void>;
}

/**
 * Interface para eventos de usuário
 */
export interface IUserEventPublisher {
  /**
   * Publica evento de dados bancários atualizados
   * @param userId ID do usuário
   * @param data Dados atualizados
   */
  publishBankingDataUpdated(userId: string, data: BankingDataUpdatedEvent): Promise<void>;

  /**
   * Publica evento de autenticação
   * @param userId ID do usuário
   * @param data Dados de autenticação
   */
  publishAuthenticationEvent(userId: string, data: AuthenticationEvent): Promise<void>;
}

/**
 * Eventos de transação
 */
export interface TransactionCreatedEvent {
  transactionId: string;
  fromUserId: string;
  toUserId: string;
  amount: number;
  description?: string;
  type: string;
  createdAt: Date;
  correlationId?: string;
}

export interface TransactionProcessedEvent {
  transactionId: string;
  status: string;
  processedAt: Date;
  correlationId?: string;
}

export interface TransactionCancelledEvent {
  transactionId: string;
  reason: string;
  cancelledAt: Date;
  correlationId?: string;
}

/**
 * Eventos de usuário
 */
export interface BankingDataUpdatedEvent {
  userId: string;
  updatedFields: string[];
  updatedAt: Date;
  correlationId?: string;
}

export interface AuthenticationEvent {
  userId: string;
  action: 'login' | 'logout' | 'token_refresh';
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
  correlationId?: string;
}