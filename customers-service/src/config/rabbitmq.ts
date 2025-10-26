import { logger } from './logger';

/**
 * Configuração do RabbitMQ
 * Seguindo padrões de configuração do projeto
 */
export interface RabbitMQConfig {
  url: string;
  queues: {
    userRegistered: string;
    bankingDataUpdated: string;
    authentication: string;
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
    userRegistered: 'user.registered',
    bankingDataUpdated: 'user.banking-data-updated',
    authentication: 'user.authentication',
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
    throw new Error('RABBITMQ_URL is required');
  }

  logger.info('RabbitMQ configuration validated', {
    url: rabbitmqConfig.url.replace(/\/\/.*@/, '//***:***@'), // Hide credentials in logs
    queues: rabbitmqConfig.queues,
  });
}
