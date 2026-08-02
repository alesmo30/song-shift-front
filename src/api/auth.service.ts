import { apiClient } from './client';
import type { LoginCredentials, AuthResponse, RegisterData } from '../types/auth.types';

/**
 * Inicia sesión usando credenciales.
 * Nota: El backend configurará automáticamente el refresh token como una cookie HttpOnly.
 */
export const loginUser = async (credentials: LoginCredentials): Promise<AuthResponse> => {
  const { data } = await apiClient.post<AuthResponse>('/login', credentials);
  return data;
};

/**
 * Registra un nuevo usuario en la plataforma y realiza el login automáticamente.
 */
export const registerUser = async (userData: RegisterData): Promise<AuthResponse> => {
  await apiClient.post('/users', userData);
  return loginUser({ email: userData.email, password: userData.password });
};

/**
 * Renueva los tokens explícitamente (aunque el interceptor de Axios ya lo hace automático al recibir 401).
 * Usa credentials automáticos por estar configurado en apiClient.
 */
export const renewTokensManually = async (): Promise<{ accessToken: string }> => {
  const { data } = await apiClient.post<{ accessToken: string }>('/renew-tokens');
  return data;
};
