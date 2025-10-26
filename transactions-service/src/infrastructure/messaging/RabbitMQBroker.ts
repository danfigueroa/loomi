import amqp, { Channel, Message } from 'amqplib';
import { 
  IMessageBroker, 
  MessageHandler, 
  PublishOptions, 
  ConsumeOptions 
} from '../../domain/interfaces/IMessageBroker';
import { rabbitmqConfig } from '../../config/rabbitmq';
import { logger } from '../../config/logger';
import { AppError } from '../../shared/errors/AppError';

/**
 * Implementação do RabbitMQ seguindo padrões do projeto
 * Infrastructure layer - Clean Architecture
 */
export class RabbitMQBroker implements IMessageBroker {
  private connection: any = null;
  private channel: Channel | null = null;
  private reconnectAttempts = 0;
  private isReconnecting = false;

  constructor() {
    this.setupGracefulShutdown();
  }

  /**
   * Conecta ao RabbitMQ
   */
  async connect(): Promise<void> {
    try {
      logger.info('Connecting to RabbitMQ...', { url: this.getMaskedUrl() });

      this.connection = await amqp.connect(rabbitmqConfig.url, {
        heartbeat: rabbitmqConfig.options.heartbeat,
      });

      this.channel = await this.connection.createChannel();

      // Configurar eventos de conexão
      this.connection.on('error', this.handleConnectionError.bind(this));
      this.connection.on('close', this.handleConnectionClose.bind(this));

      // Criar exchanges e filas
      await this.setupExchangesAndQueues();

      this.reconnectAttempts = 0;
      logger.info('Successfully connected to RabbitMQ');

    } catch (error) {
      logger.error('Failed to connect to RabbitMQ', { error: error instanceof Error ? error.message : 'Unknown error' });
      throw new AppError('Failed to connect to RabbitMQ', 500);
    }
  }

  /**
   * Desconecta do RabbitMQ
   */
  async disconnect(): Promise<void> {
    try {
      if (this.channel) {
        await this.channel.close();
        this.channel = null;
      }

      if (this.connection) {
        await this.connection.close();
        this.connection = null;
      }

      logger.info('Disconnected from RabbitMQ');
    } catch (error) {
      logger.error('Error disconnecting from RabbitMQ', { error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  /**
   * Publica uma mensagem
   */
  async publish(queue: string, message: Record<string, unknown>, options: PublishOptions = {}): Promise<void> {
    if (!this.isConnected()) {
      throw new AppError('RabbitMQ not connected', 500);
    }

    try {
      const messageBuffer = Buffer.from(JSON.stringify(message));
      const publishOptions = {
        persistent: options.persistent ?? true,
        correlationId: options.correlationId,
        replyTo: options.replyTo,
        expiration: options.expiration,
        priority: options.priority,
        timestamp: Date.now(),
      };

      const success = this.channel!.sendToQueue(queue, messageBuffer, publishOptions);

      if (!success) {
        logger.warn('Message not queued, waiting for drain event', { queue });
        await new Promise((resolve) => this.channel!.once('drain', resolve));
      }

      logger.debug('Message published successfully', { 
        queue, 
        correlationId: options.correlationId,
        messageSize: messageBuffer.length 
      });

    } catch (error) {
      logger.error('Failed to publish message', { 
        queue, 
        error: error instanceof Error ? error.message : 'Unknown error',
        correlationId: options.correlationId 
      });
      throw new AppError('Failed to publish message', 500);
    }
  }

  /**
   * Consome mensagens de uma fila
   */
  async consume(queue: string, handler: MessageHandler, options: ConsumeOptions = {}): Promise<void> {
    if (!this.isConnected()) {
      throw new AppError('RabbitMQ not connected', 500);
    }

    try {
      await this.channel!.consume(
        queue,
        async (msg: Message | null) => {
          if (!msg) return;

          const correlationId = msg.properties.correlationId;
          
          try {
            const messageContent = JSON.parse(msg.content.toString());
            
            logger.debug('Processing message', { 
              queue, 
              correlationId,
              messageId: msg.properties.messageId 
            });

            await handler(
              messageContent,
              () => this.channel!.ack(msg), // ack
              (requeue = false) => this.channel!.nack(msg, false, requeue) // nack
            );

          } catch (error) {
            logger.error('Error processing message', { 
              queue, 
              correlationId,
              error: error instanceof Error ? error.message : 'Unknown error'
            });

            // Rejeita a mensagem sem requeue em caso de erro de processamento
            this.channel!.nack(msg, false, false);
          }
        },
        {
          noAck: options.noAck ?? false,
          exclusive: options.exclusive ?? false,
          consumerTag: options.consumerTag,
        }
      );

      logger.info('Started consuming messages', { queue });

    } catch (error) {
      logger.error('Failed to start consuming messages', { queue, error: error instanceof Error ? error.message : 'Unknown error' });
      throw new AppError('Failed to start consuming messages', 500);
    }
  }

  /**
   * Verifica se está conectado
   */
  isConnected(): boolean {
    return this.connection !== null && this.channel !== null && !(this.connection as any).connection?.destroyed;
  }

  /**
   * Configura exchanges e filas
   */
  private async setupExchangesAndQueues(): Promise<void> {
    if (!this.channel) return;

    try {
      // Criar exchanges
      await this.channel.assertExchange(rabbitmqConfig.exchanges.transactions, 'topic', { durable: true });
      await this.channel.assertExchange(rabbitmqConfig.exchanges.users, 'topic', { durable: true });

      // Criar filas
      const queues = Object.values(rabbitmqConfig.queues);
      for (const queue of queues) {
        await this.channel.assertQueue(queue, { 
          durable: true,
          arguments: {
            'x-message-ttl': 86400000, // 24 horas
            'x-max-retries': 3,
          }
        });
      }

      // Bind filas aos exchanges
      await this.channel.bindQueue(rabbitmqConfig.queues.transactionCreated, rabbitmqConfig.exchanges.transactions, 'transaction.created');
      await this.channel.bindQueue(rabbitmqConfig.queues.transactionProcessed, rabbitmqConfig.exchanges.transactions, 'transaction.processed');
      await this.channel.bindQueue(rabbitmqConfig.queues.transactionCancelled, rabbitmqConfig.exchanges.transactions, 'transaction.cancelled');
      await this.channel.bindQueue(rabbitmqConfig.queues.bankingDataUpdated, rabbitmqConfig.exchanges.users, 'user.banking-data-updated');
      await this.channel.bindQueue(rabbitmqConfig.queues.authenticationEvents, rabbitmqConfig.exchanges.users, 'user.authentication-events');

      logger.info('Exchanges and queues setup completed');

    } catch (error) {
      logger.error('Failed to setup exchanges and queues', { error: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    }
  }

  /**
   * Manipula erros de conexão
   */
  private handleConnectionError(error: Error): void {
    logger.error('RabbitMQ connection error', { error: error.message });
    this.attemptReconnect();
  }

  /**
   * Manipula fechamento de conexão
   */
  private handleConnectionClose(): void {
    logger.warn('RabbitMQ connection closed');
    this.connection = null;
    this.channel = null;
    this.attemptReconnect();
  }

  /**
   * Tenta reconectar
   */
  private async attemptReconnect(): Promise<void> {
    if (this.isReconnecting || this.reconnectAttempts >= rabbitmqConfig.options.maxReconnectAttempts) {
      return;
    }

    this.isReconnecting = true;
    this.reconnectAttempts++;

    logger.info('Attempting to reconnect to RabbitMQ', { 
      attempt: this.reconnectAttempts,
      maxAttempts: rabbitmqConfig.options.maxReconnectAttempts 
    });

    try {
      await new Promise(resolve => setTimeout(resolve, rabbitmqConfig.options.reconnectDelay));
      await this.connect();
      this.isReconnecting = false;
    } catch (error) {
      this.isReconnecting = false;
      logger.error('Reconnection attempt failed', { 
        attempt: this.reconnectAttempts,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Configura graceful shutdown
   */
  private setupGracefulShutdown(): void {
    const shutdown = async () => {
      logger.info('Shutting down RabbitMQ connection...');
      await this.disconnect();
      process.exit(0);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  }

  /**
   * Retorna URL mascarada para logs
   */
  private getMaskedUrl(): string {
    return rabbitmqConfig.url.replace(/\/\/.*@/, '//***:***@');
  }
}