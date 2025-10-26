import { 
  IUserEventPublisher,
  BankingDataUpdatedEvent,
  AuthenticationEvent
} from '../../domain/interfaces/IMessageBroker';
import { IMessageBroker } from '../../domain/interfaces/IMessageBroker';
import { UserEventPayload, MessagePayload } from '../../types/messaging.types';
import { rabbitmqConfig } from '../../config/rabbitmq';
import { logger } from '../../config/logger';

/**
 * Publisher de eventos de usuário
 * Seguindo padrões de Clean Architecture
 */
export class UserEventPublisher implements IUserEventPublisher {
  constructor(private readonly messageBroker: IMessageBroker) {}

  /**
   * Publica evento de usuário registrado
   */
  async publishUserRegistered(userId: string, data: UserEventPayload, correlationId?: string): Promise<void> {
    try {
      await this.messageBroker.publish(
        rabbitmqConfig.queues.userRegistered,
        data,
        correlationId ? {
          correlationId,
          persistent: true,
        } : {
          persistent: true,
        }
      );

      logger.info('User registered event published successfully', {
        userId,
        correlationId,
      });
    } catch (error) {
      logger.error('Failed to publish user registered event', {
        userId,
        correlationId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Publica evento de dados bancários atualizados
   */
  async publishBankingDataUpdated(userId: string, data: BankingDataUpdatedEvent): Promise<void> {
    try {
      const eventPayload: MessagePayload = {
        eventType: 'BankingDataUpdated',
        userId,
        timestamp: new Date().toISOString(),
        updatedFields: data.updatedFields,
        updatedAt: data.updatedAt.toISOString(),
        correlationId: data.correlationId || '',
      };

      await this.messageBroker.publish(
        rabbitmqConfig.queues.bankingDataUpdated,
        eventPayload,
        data.correlationId ? {
          correlationId: data.correlationId,
          persistent: true,
        } : {
          persistent: true,
        }
      );

      logger.info('Banking data updated event published successfully', {
        userId,
        correlationId: data.correlationId,
      });
    } catch (error) {
      logger.error('Failed to publish banking data updated event', {
        userId,
        correlationId: data.correlationId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Publica evento de autenticação
   */
  async publishAuthenticationEvent(userId: string, data: AuthenticationEvent): Promise<void> {
    try {
      const eventPayload: MessagePayload = {
        eventType: 'Authentication',
        userId,
        timestamp: new Date().toISOString(),
        action: data.action,
        ipAddress: data.ipAddress || '',
        userAgent: data.userAgent || '',
        correlationId: data.correlationId || '',
      };

      await this.messageBroker.publish(
        rabbitmqConfig.queues.authentication,
        eventPayload,
        data.correlationId ? {
          correlationId: data.correlationId,
          persistent: true,
        } : {
          persistent: true,
        }
      );

      logger.info('Authentication event published successfully', {
        userId,
        action: data.action,
        correlationId: data.correlationId,
      });
    } catch (error) {
      logger.error('Failed to publish authentication event', {
        userId,
        action: data.action,
        correlationId: data.correlationId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }
}