import { 
  IUserEventPublisher,
  BankingDataUpdatedEvent,
  AuthenticationEvent
} from '../../domain/interfaces/IMessageBroker';
import { IMessageBroker } from '../../domain/interfaces/IMessageBroker';
import { rabbitmqConfig } from '../../config/rabbitmq';
import { logger } from '../../config/logger';

/**
 * Publisher de eventos de usuário
 * Seguindo padrões de Clean Architecture
 */
export class UserEventPublisher implements IUserEventPublisher {
  constructor(private readonly messageBroker: IMessageBroker) {}

  /**
   * Publica evento de dados bancários atualizados
   */
  async publishBankingDataUpdated(userId: string, data: BankingDataUpdatedEvent): Promise<void> {
    try {
      await this.messageBroker.publish(
        rabbitmqConfig.queues.bankingDataUpdated,
        {
          eventType: 'BankingDataUpdated',
          userId,
          timestamp: new Date().toISOString(),
          data,
        },
        {
          correlationId: data.correlationId,
          persistent: true,
        }
      );

      logger.info('Banking data updated event published', { 
        userId, 
        correlationId: data.correlationId 
      });

    } catch (error) {
      logger.error('Failed to publish banking data updated event', { 
        userId, 
        error: error.message,
        correlationId: data.correlationId 
      });
      throw new Error('Failed to publish banking data updated event');
    }
  }

  /**
   * Publica evento de autenticação
   */
  async publishAuthenticationEvent(userId: string, data: AuthenticationEvent): Promise<void> {
    try {
      await this.messageBroker.publish(
        rabbitmqConfig.queues.authenticationEvents,
        {
          eventType: 'AuthenticationEvent',
          userId,
          timestamp: new Date().toISOString(),
          data,
        },
        {
          correlationId: data.correlationId,
          persistent: true,
        }
      );

      logger.info('Authentication event published', { 
        userId, 
        action: data.action,
        correlationId: data.correlationId 
      });

    } catch (error) {
      logger.error('Failed to publish authentication event', { 
        userId, 
        error: error.message,
        correlationId: data.correlationId 
      });
      throw new Error('Failed to publish authentication event');
    }
  }
}