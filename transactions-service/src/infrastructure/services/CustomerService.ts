import { ICustomerService, Customer } from '@/domain/interfaces/ICustomerService';
import { AppError } from '@/shared/errors/AppError';
import { CustomersServiceClient } from '@/infrastructure/http/CustomersServiceClient';
import { logger } from '@/config/logger';

export class CustomerService implements ICustomerService {
  private customersClient: CustomersServiceClient;

  constructor() {
    this.customersClient = new CustomersServiceClient();
  }

  async validateUser(userId: string, correlationId?: string): Promise<Customer> {
    try {
      logger.info('Validating user via customers service', { userId, correlationId });
      
      const user = await this.customersClient.getUserById(userId, correlationId);

      if (!user) {
        throw new AppError('User not found', 404);
      }

      if (!user.isActive) {
        throw new AppError('User is inactive', 400);
      }

      logger.info('User validation successful', { userId, correlationId });

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        address: '',
      };
    } catch (error: any) {
      logger.error('User validation failed', { 
        userId, 
        correlationId, 
        error: error.message 
      });

      if (error instanceof AppError) {
        throw error;
      }

      if (error.message.includes('Circuit breaker is OPEN')) {
        throw new AppError('Customer service temporarily unavailable', 503);
      }

      if (error.message.includes('timeout')) {
        throw new AppError('Customer service timeout', 503);
      }

      throw new AppError('Failed to validate user', 500);
    }
  }

  async getUserById(userId: string, correlationId?: string): Promise<Customer | null> {
    try {
      return await this.validateUser(userId, correlationId);
    } catch (error: any) {
      if (error.statusCode === 404) {
        return null;
      }
      throw error;
    }
  }
}