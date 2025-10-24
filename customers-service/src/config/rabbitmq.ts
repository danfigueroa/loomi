import { logger } from './logger';

/**
 * Configuração do RabbitMQ
 * Seguindo padrões de configuração do projeto
 */
export interface RabbitMQConfig {
  url: string;
  queues: {
    bankingDataUpdated: string;
    authenticationEvents: string;
  };
  exchanges: {
    users: string;
  };
  options: {
    reconnectDelay: number;
    maxReconnectAttempts: number;
    heartbeat: number;
  };
}

/**
 * Configuração padrão do RabbitMQ
 */
export const rabbitmqConfig: RabbitMQConfig = {
  url: process.env['RABBITMQ_URL'] || 'amqp://rabbitmq:rabbitmq123@localhost:5672',
  queues: {
    bankingDataUpdated: 'user.banking-data-updated',
    authenticationEvents: 'user.authentication-events',
  },
  exchanges: {
    users: 'users.exchange',
  },
  options: {
    reconnectDelay: 5000,
    maxReconnectAttempts: 10,
    heartbeat: 60,
  },
};

/**
 * Valida a configuração do RabbitMQ
 */
export function validateRabbitMQConfig(): void {
  if (!rabbitmqConfig.url) {
    logger.error('RABBITMQ_URL environment variable is required');
    throw new Error('RABBITMQ_URL environment variable is required');
  }

  logger.info('RabbitMQ configuration validated successfully', {
    url: rabbitmqConfig.url.replace(/\/\/.*@/, '//***:***@'), // Oculta credenciais no log
    queues: rabbitmqConfig.queues,
    exchanges: rabbitmqConfig.exchanges,
  });
}