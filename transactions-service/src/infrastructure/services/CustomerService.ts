import axios from 'axios';
import { ICustomerService, Customer } from '@/domain/interfaces/ICustomerService';
import { AppError } from '@/shared/errors/AppError';

export class CustomerService implements ICustomerService {
  private baseURL: string;

  constructor() {
    this.baseURL = process.env.CUSTOMERS_SERVICE_URL || 'http://localhost:3001';
  }

  async validateUser(userId: string): Promise<Customer> {
    try {
      const response = await axios.get(`${this.baseURL}/api/users/${userId}`, {
        timeout: 5000,
      });

      if (!response.data || !response.data.id) {
        throw new AppError('User not found', 404);
      }

      return {
        id: response.data.id,
        name: response.data.name,
        email: response.data.email,
        address: response.data.address,
      };
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new AppError('User not found', 404);
      }
      
      if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
        throw new AppError('Customer service unavailable', 503);
      }

      throw new AppError('Failed to validate user', 500);
    }
  }

  async getUserById(userId: string): Promise<Customer | null> {
    try {
      return await this.validateUser(userId);
    } catch (error: any) {
      if (error.statusCode === 404) {
        return null;
      }
      throw error;
    }
  }
}