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

      (DatabaseConnection.instance as any).$on('query', (e: any) => {
        logger.debug('Database Query', {
          query: e.query,
          params: e.params,
          duration: `${e.duration}ms`,
        });
      });

      (DatabaseConnection.instance as any).$on('error', (e: any) => {
        logger.error('Database Error', { error: e });
      });

      (DatabaseConnection.instance as any).$on('info', (e: any) => {
        logger.info('Database Info', { message: e.message });
      });

      (DatabaseConnection.instance as any).$on('warn', (e: any) => {
        logger.warn('Database Warning', { message: e.message });
      });

      DatabaseConnection.instance.$connect().catch((error) => {
        logger.error('Failed to connect to database', { error: error.message });
      });
    }

    return DatabaseConnection.instance;
  }

  public static async disconnect(): Promise<void> {
    if (DatabaseConnection.instance) {
      await DatabaseConnection.instance.$disconnect();
    }
  }
}

export const prisma = process.env['NODE_ENV'] === 'test' ? null as any : DatabaseConnection.getInstance();
export { DatabaseConnection };