import { apiClient } from './client';
import type { SpotifyAuthUrlResponse, SpotifyConnection } from '../types/spotify';

/**
 * Pide la URL de autorización de Spotify. El JWT viaja como cabecera
 * Authorization vía el interceptor de apiClient; una navegación top-level
 * del navegador no podría llevarla, por eso el flujo es pedir la URL aquí
 * y luego hacer `window.location.assign(authorizeUrl)`.
 */
export const getSpotifyAuthUrl = async (redirectPath?: string): Promise<SpotifyAuthUrlResponse> => {
  const { data } = await apiClient.post<SpotifyAuthUrlResponse>('/spotify/auth-url', { redirectPath });
  return data;
};

/**
 * Lee el estado de conexión con Spotify. No dispara ninguna llamada a
 * Spotify del lado del backend; solo lee la fila persistida.
 */
export const getSpotifyStatus = async (): Promise<SpotifyConnection> => {
  const { data } = await apiClient.get<SpotifyConnection>('/spotify/status');
  return data;
};

/**
 * Desconecta la cuenta de Spotify. Solo borra la fila en el backend:
 * Spotify no ofrece endpoint de revocación, así que el permiso sigue
 * vivo del lado de Spotify hasta que el usuario lo retire a mano.
 */
export const disconnectSpotify = async (): Promise<void> => {
  await apiClient.delete('/spotify/connection');
};
