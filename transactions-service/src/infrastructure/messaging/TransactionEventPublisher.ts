import { 
  ITransactionEventPublisher,
  TransactionCreatedEvent,
  TransactionProcessedEvent,
  TransactionCancelledEvent
} from '../../domain/interfaces/IMessageBroker';
import { IMessageBroker } from '../../domain/interfaces/IMessageBroker';
import { rabbitmqConfig } from '../../config/rabbitmq';
import { logger } from '../../config/logger';
import { AppError } from '../../shared/errors/AppError';

/**
 * Publisher de eventos de transação
 * Seguindo padrões de Clean Architecture
 */
export class TransactionEventPublisher implements ITransactionEventPublisher {
  constructor(private readonly messageBroker: IMessageBroker) {}

  /**
   * Publica evento de transação criada
   */
  async publishTransactionCreated(transactionId: string, data: TransactionCreatedEvent): Promise<void> {
    try {
      await this.messageBroker.publish(
        rabbitmqConfig.queues.transactionCreated,
        {
          eventType: 'TransactionCreated',
          transactionId,
          timestamp: new Date().toISOString(),
          data,
        },
        data.correlationId ? {
          correlationId: data.correlationId,
          persistent: true,
        } : {
          persistent: true,
        }
      );

      logger.info('Transaction created event published', { 
        transactionId, 
        correlationId: data.correlationId 
      });

    } catch (error) {
      logger.error('Failed to publish transaction created event', { 
        transactionId, 
        error: error instanceof Error ? error.message : 'Unknown error',
        correlationId: data.correlationId 
      });
      throw new AppError('Failed to publish transaction created event', 500);
    }
  }

  /**
   * Publica evento de transação processada
   */
  async publishTransactionProcessed(transactionId: string, data: TransactionProcessedEvent): Promise<void> {
    try {
      await this.messageBroker.publish(
        rabbitmqConfig.queues.transactionProcessed,
        {
          eventType: 'TransactionProcessed',
          transactionId,
          timestamp: new Date().toISOString(),
          data,
        },
        data.correlationId ? {
          correlationId: data.correlationId,
          persistent: true,
        } : {
          persistent: true,
        }
      );

      logger.info('Transaction processed event published', { 
        transactionId, 
        correlationId: data.correlationId 
      });

    } catch (error) {
      logger.error('Failed to publish transaction processed event', { 
        transactionId, 
        error: error instanceof Error ? error.message : 'Unknown error',
        correlationId: data.correlationId 
      });
      throw new AppError('Failed to publish transaction processed event', 500);
    }
  }

  /**
   * Publica evento de transação cancelada
   */
  async publishTransactionCancelled(transactionId: string, data: TransactionCancelledEvent): Promise<void> {
    try {
      await this.messageBroker.publish(
        rabbitmqConfig.queues.transactionCancelled,
        {
          eventType: 'TransactionCancelled',
          transactionId,
          timestamp: new Date().toISOString(),
          data,
        },
        data.correlationId ? {
          correlationId: data.correlationId,
          persistent: true,
        } : {
          persistent: true,
        }
      );

      logger.info('Transaction cancelled event published', { 
        transactionId, 
        correlationId: data.correlationId 
      });

    } catch (error) {
      logger.error('Failed to publish transaction cancelled event', { 
        transactionId, 
        error: error instanceof Error ? error.message : 'Unknown error',
        correlationId: data.correlationId 
      });
      throw new AppError('Failed to publish transaction cancelled event', 500);
    }
  }
}