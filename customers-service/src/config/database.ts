import { PrismaClient } from '@prisma/client';
import { logger } from './logger';

interface PrismaQueryEvent {
  query: string;
  params: string;
  duration: number;
}

interface PrismaErrorEvent {
  message: string;
  target?: string;
}

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

      if (process.env['NODE_ENV'] === 'development') {
        (DatabaseConnection.instance as any).$on('query', (e: PrismaQueryEvent) => {
          logger.debug('Database Query', {
            query: e.query,
            params: e.params,
            duration: `${e.duration}ms`,
          });
        });
      }

      (DatabaseConnection.instance as any).$on('error', (e: PrismaErrorEvent) => {
        logger.error('Database Error', { error: e });
      });

      logger.info('Database connection instance created');
    }

    return DatabaseConnection.instance;
  }

  public static async connect(): Promise<void> {
    const instance = DatabaseConnection.getInstance();
    try {
      await instance.$connect();
      logger.info('Database connection established successfully');
    } catch (error) {
      logger.error('Failed to connect to database', { error });
      throw error;
    }
  }

  public static async disconnect(): Promise<void> {
    if (DatabaseConnection.instance) {
      await DatabaseConnection.instance.$disconnect();
      logger.info('Database connection closed');
    }
  }
}

export const prisma = process.env['NODE_ENV'] === 'test' ? null : DatabaseConnection.getInstance();
export { DatabaseConnection };