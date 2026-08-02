import type { User } from './user';

export interface LoginCredentials {
  email: string;
  password?: string;
}

export interface RegisterData {
  name: string;
  lastName: string;
  email: string;
  password?: string;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}
