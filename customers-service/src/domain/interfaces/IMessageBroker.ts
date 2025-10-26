import { MessagePayload, MessageHandler, PublishOptions, UserEventPayload } from '../../types/messaging.types';

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
  publish(queue: string, message: MessagePayload, options?: PublishOptions): Promise<void>;

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
 * Opções para consumo de mensagens
 */
export interface ConsumeOptions {
  noAck?: boolean;
  exclusive?: boolean;
  priority?: number;
  consumerTag?: string;
}

/**
 * Interface para eventos de usuário
 */
export interface IUserEventPublisher {
  /**
   * Publica evento de usuário registrado
   * @param userId ID do usuário
   * @param data Dados do evento
   * @param correlationId ID de correlação
   */
  publishUserRegistered(userId: string, data: UserEventPayload, correlationId?: string): Promise<void>;

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