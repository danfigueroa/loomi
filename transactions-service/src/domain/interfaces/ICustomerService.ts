export interface Customer {
  id: string;
  name: string;
  email: string;
  address?: string;
}

export interface ICustomerService {
  validateUser(userId: string): Promise<Customer>;
  getUserById(userId: string): Promise<Customer | null>;
}