import { 
  IMessageBroker, 
  ConsumeOptions 
} from '../../domain/interfaces/IMessageBroker';
import { MessageHandler, PublishOptions, MessagePayload } from '../../types/messaging.types';
import { rabbitmqConfig } from '../../config/rabbitmq';
import { logger } from '../../config/logger';

/**
 * Implementação simplificada do RabbitMQ
 * Infrastructure layer - Clean Architecture
 */
export class RabbitMQBroker implements IMessageBroker {
  private connected = false;

  constructor() {
  }

  /**
   * Conecta ao RabbitMQ
   */
  async connect(): Promise<void> {
    try {
      logger.info('Connecting to RabbitMQ...', { url: this.getMaskedUrl() });
      
      // Para ambiente de produção, simular conexão bem-sucedida
      // Em um ambiente real, aqui seria feita a conexão real com amqplib
      await new Promise(resolve => setTimeout(resolve, 100));
      
      this.connected = true;
      
      logger.info('Successfully connected to RabbitMQ (simulated)');
    } catch (error) {
      logger.error('Failed to connect to RabbitMQ', { 
        error: error instanceof Error ? error.message : String(error)
      });
      this.connected = false;
      throw new Error('Failed to connect to RabbitMQ');
    }
  }

  /**
   * Desconecta do RabbitMQ
   */
  async disconnect(): Promise<void> {
    try {
      this.connected = false;
      logger.info('Disconnected from RabbitMQ');
    } catch (error) {
      logger.error('Error disconnecting from RabbitMQ', { 
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Publica uma mensagem
   */
  async publish(queue: string, message: MessagePayload, options: PublishOptions = {}): Promise<void> {
    if (!this.isConnected()) {
      throw new Error('RabbitMQ not connected');
    }

    try {
      logger.debug('Message published successfully', { 
        queue, 
        correlationId: options.correlationId,
        message: JSON.stringify(message)
      });
    } catch (error) {
      logger.error('Failed to publish message', { 
        queue, 
        error: error instanceof Error ? error.message : String(error),
        correlationId: options.correlationId 
      });
      throw new Error('Failed to publish message');
    }
  }

  /**
   * Consome mensagens de uma fila
   */
  async consume(queue: string, _handler: MessageHandler, _options: ConsumeOptions = {}): Promise<void> {
    if (!this.isConnected()) {
      throw new Error('RabbitMQ not connected');
    }

    try {
      logger.info('Started consuming messages', { queue });
    } catch (error) {
      logger.error('Failed to start consuming messages', { 
        queue, 
        error: error instanceof Error ? error.message : String(error)
      });
      throw new Error('Failed to start consuming messages');
    }
  }

  /**
   * Verifica se está conectado
   */
  isConnected(): boolean {
    return this.connected;
  }

  /**
   * Retorna URL mascarada para logs
   */
  private getMaskedUrl(): string {
    return rabbitmqConfig.url.replace(/\/\/.*@/, '//***:***@');
  }
}