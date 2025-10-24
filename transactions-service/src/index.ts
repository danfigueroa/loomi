import 'dotenv/config';
import { app } from './app';
import { logger } from './config/logger';
import { DatabaseConnection } from './config/database';
import { RedisConnection } from './config/redis';
import { RabbitMQBroker } from './infrastructure/messaging/RabbitMQBroker';
import { TransactionEventPublisher } from './infrastructure/messaging/TransactionEventPublisher';
import { TransactionService } from './application/services/TransactionService';
import { CustomerService } from './infrastructure/services/CustomerService';
import { TransactionRepository } from './infrastructure/repositories/TransactionRepository';

const port = process.env['PORT'] || 3002;

const startServer = async (): Promise<void> => {
  try {
    await DatabaseConnection.getInstance().$connect();
    logger.info('Database connected successfully');

    await RedisConnection.getInstance().ping();
    logger.info('Redis connected successfully');

    // Inicializar RabbitMQ
    const messageBroker = new RabbitMQBroker();
    await messageBroker.connect();
    logger.info('RabbitMQ connected successfully');

    // Injeção de dependências
    const transactionEventPublisher = new TransactionEventPublisher(messageBroker);
    const transactionRepository = new TransactionRepository(DatabaseConnection.getInstance());
    const customerService = new CustomerService();
    const transactionService = new TransactionService(
      transactionRepository,
      customerService,
      transactionEventPublisher
    );

    // Configurar health check com RabbitMQ
    const { healthController } = await import('./controllers/healthController');
    healthController.setMessageBroker(messageBroker);

    // Disponibilizar o service globalmente para os controllers
    (global as any).transactionService = transactionService;

    app.listen(port, () => {
      logger.info(`🚀 Transactions service running on port ${port}`);
      logger.info(`📊 Environment: ${process.env['NODE_ENV'] || 'development'}`);
      logger.info(`🔗 Health check: http://localhost:${port}/health`);
    });
  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
};

const gracefulShutdown = async (signal: string): Promise<void> => {
  logger.info(`Received ${signal}, shutting down gracefully`);
  
  try {
    await DatabaseConnection.disconnect();
    await RedisConnection.disconnect();
    logger.info('Connections closed successfully');
    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown', { error });
    process.exit(1);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

startServer();