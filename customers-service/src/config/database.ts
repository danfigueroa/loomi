import { PrismaClient } from '@prisma/client';
import { logger } from './logger';

class DatabaseConnection {
  private static instance: PrismaClient;

  public static getInstance(): PrismaClient {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new PrismaClient({
        log: [
          {
            emit: 'event',
            level: 'query',
          },
          {
            emit: 'event',
            level: 'error',
          },
          {
            emit: 'event',
            level: 'info',
          },
          {
            emit: 'event',
            level: 'warn',
          },
        ],
      });

      // Log database queries in development
      if (process.env['NODE_ENV'] === 'development') {
        (DatabaseConnection.instance as any).$on('query', (e: any) => {
          logger.debug('Database Query', {
            query: e.query,
            params: e.params,
            duration: `${e.duration}ms`,
          });
        });
      }

      // Log database errors
      (DatabaseConnection.instance as any).$on('error', (e: any) => {
        logger.error('Database Error', { error: e });
      });

      logger.info('Database connection established');
    }

    return DatabaseConnection.instance;
  }

  public static async disconnect(): Promise<void> {
    if (DatabaseConnection.instance) {
      await DatabaseConnection.instance.$disconnect();
      logger.info('Database connection closed');
    }
  }
}

// Export prisma instance only when not in test environment
export const prisma = process.env['NODE_ENV'] === 'test' ? null : DatabaseConnection.getInstance();
export { DatabaseConnection };