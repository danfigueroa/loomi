import 'dotenv/config';
import { app } from './app';
import { logger } from './config/logger';
import { DatabaseConnection } from './config/database';
import { RedisConnection } from './config/redis';
import { RabbitMQBroker } from './infrastructure/messaging/RabbitMQBroker';
import { UserEventPublisher } from './infrastructure/messaging/UserEventPublisher';
import { UserService } from './application/services/UserService';
import { UserController } from './controllers/userController';
import { createUserRoutes } from './routes/userRoutes';

const PORT = process.env['PORT'] || 3001;

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
    const userEventPublisher = new UserEventPublisher(messageBroker);
    const userService = new UserService(userEventPublisher);
    const userController = new UserController(userEventPublisher);

    // Configurar health check com RabbitMQ
    const { healthController } = await import('./controllers/healthController');
    healthController.setMessageBroker(messageBroker);

    // Configurar rotas com dependências injetadas
    const userRoutes = createUserRoutes(userController);
    app.use('/api/users', userRoutes);

    app.listen(PORT, () => {
      logger.info(`🚀 Customers service running on port ${PORT}`);
      logger.info(`📊 Environment: ${process.env['NODE_ENV'] || 'development'}`);
      logger.info(`🔗 Health check: http://localhost:${PORT}/health`);
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