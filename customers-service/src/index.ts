import 'dotenv/config';
import { app } from './app';
import { logger } from './config/logger';
import { DatabaseConnection } from './config/database';
import { RedisConnection } from './config/redis';
import { RabbitMQBroker } from './infrastructure/messaging/RabbitMQBroker';
import { UserEventPublisher } from './infrastructure/messaging/UserEventPublisher';

import { UserController } from './controllers/userController';
import { healthController } from './controllers/healthController';
import { createUserRoutes } from './routes/userRoutes';

const PORT = process.env['PORT'] || 3001;

async function startServer() {
  try {
    logger.info('🚀 Iniciando customers-service...');
    logger.info('Environment variables:', {
      NODE_ENV: process.env['NODE_ENV'],
      PORT: process.env['PORT'],
      DATABASE_URL: process.env['DATABASE_URL'] ? 'SET' : 'NOT SET',
      REDIS_URL: process.env['REDIS_URL'] ? 'SET' : 'NOT SET',
      RABBITMQ_URL: process.env['RABBITMQ_URL'] ? 'SET' : 'NOT SET'
    });

    // Connect to database
    try {
      logger.info('📊 Conectando ao banco de dados...');
      await DatabaseConnection.connect();
      logger.info('✅ Database conectado com sucesso');
    } catch (error) {
      logger.error('❌ Falha ao conectar ao banco de dados:', error);
      throw error;
    }

    // Connect to Redis
    try {
      logger.info('🔴 Conectando ao Redis...');
      await RedisConnection.connect();
      logger.info('✅ Redis conectado com sucesso');
    } catch (error) {
      logger.error('❌ Falha ao conectar ao Redis:', error);
      throw error;
    }

    // Connect to RabbitMQ
    const messageBroker = new RabbitMQBroker();
    try {
      logger.info('🐰 Conectando ao RabbitMQ...');
      await messageBroker.connect();
      logger.info('✅ RabbitMQ conectado com sucesso');
    } catch (error) {
      logger.error('❌ Falha ao conectar ao RabbitMQ:', error);
      throw error;
    }

    // Initialize routes
    logger.info('🛣️ Inicializando rotas...');
    const userEventPublisher = new UserEventPublisher(messageBroker);
    const userController = new UserController(userEventPublisher);
    logger.info('Setting messageBroker in healthController...');
    healthController.setMessageBroker(messageBroker);
    logger.info('MessageBroker set successfully in healthController');
    
    // Add health route
    app.get('/health', healthController.check.bind(healthController));
    
    const userRoutes = createUserRoutes(userController);
    app.use('/api/users', userRoutes);
    logger.info('✅ Rotas inicializadas com sucesso');

    const server = app.listen(PORT, () => {
      logger.info(`🎉 Servidor rodando na porta ${PORT}`);
      logger.info('🏥 Health check disponível em /health');
    });

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      logger.info('SIGTERM received, shutting down gracefully');
      server.close(() => {
        DatabaseConnection.disconnect();
        RedisConnection.disconnect();
        messageBroker.disconnect();
        process.exit(0);
      });
    });

    process.on('SIGINT', async () => {
      logger.info('SIGINT received, shutting down gracefully');
      server.close(() => {
        DatabaseConnection.disconnect();
        RedisConnection.disconnect();
        messageBroker.disconnect();
        process.exit(0);
      });
    });

  } catch (error) {
    logger.error('💥 Falha crítica ao iniciar o servidor:', error);
    process.exit(1);
  }
}

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