export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  cpf?: string;
  address?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface UpdateProfileRequest {
  name?: string;
  email?: string;
  address?: string;
  profilePicture?: string;
}

export interface UpdateUserRequest {
  name?: string;
  email?: string;
  address?: string;
  bankingDetails?: {
    bankCode?: string;
    agencyNumber?: string;
    accountNumber?: string;
    accountType?: string;
  };
}

export interface UpdateProfilePictureRequest {
  profilePicture: string;
}

export interface UserResponse {
  id: string;
  name: string;
  email: string;
  cpf?: string;
  address?: string;
  profilePicture?: string;
  isActive: boolean;
  bankingDetails?: {
    bankCode?: string;
    agencyNumber?: string;
    accountNumber?: string;
    accountType?: string;
  };
  createdAt: Date;
  updatedAt: Date;
  loginAt?: Date;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  correlationId: string;
}
