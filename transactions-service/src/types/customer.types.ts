// Customer service types
export interface CustomerData {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  address?: string;
  cpf?: string;
  profilePicture?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CustomerValidationResponse {
  isValid: boolean;
  customer?: CustomerData;
  error?: string;
}

export interface CustomerServiceResponse {
  success: boolean;
  data?: CustomerData;
  message?: string;
  error?: string;
}

// HTTP Client types
export interface HttpClientResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
}

export interface HttpClientError {
  message: string;
  status?: number;
  response?: {
    data?: any;
    status: number;
    statusText: string;
  };
}