import 'dotenv/config';
import { app } from './app';
import { logger } from '@/config/logger';
import { DatabaseConnection } from '@/config/database';
import { RedisConnection } from '@/config/redis';

const PORT = process.env.PORT || 3001;

const startServer = async (): Promise<void> => {
  try {
    await DatabaseConnection.getInstance().$connect();
    logger.info('Database connected successfully');

    await RedisConnection.getInstance().ping();
    logger.info('Redis connected successfully');

    app.listen(PORT, () => {
      logger.info(`🚀 Customers service running on port ${PORT}`);
      logger.info(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
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