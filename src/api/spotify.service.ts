import { apiClient } from './client';
import type { SpotifyAuthUrlResponse, SpotifyConnection, SpotifyPlaylist } from '../types/spotify';

interface SpotifyPlaylistsResponse {
  items: SpotifyPlaylist[];
  total: number;
  limit: number;
  offset: number;
}

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

/**
 * Lista las playlists de Spotify en las que el usuario puede escribir. El
 * backend ya filtra por owner y trocea la forma cruda de Spotify al
 * SpotifyPlaylistDTO -- aquí no hay más que pasar limit/offset.
 */
export const getSpotifyPlaylists = async (limit = 50, offset = 0): Promise<SpotifyPlaylistsResponse> => {
  const { data } = await apiClient.get<SpotifyPlaylistsResponse>('/spotify/playlists', {
    params: { limit, offset },
  });
  return data;
};

/**
 * Crea una playlist nueva. El backend fuerza public: false; este cliente no
 * expone ese campo porque no es configurable desde la UI.
 */
export const createSpotifyPlaylist = async (name: string): Promise<SpotifyPlaylist> => {
  const { data } = await apiClient.post<SpotifyPlaylist>('/spotify/playlists', { name });
  return data;
};

/**
 * Fija (o borra, con null) la playlist destino persistida en el servidor.
 */
export const setDefaultPlaylist = async (playlistId: string | null): Promise<{ defaultPlaylistId: string | null }> => {
  const { data } = await apiClient.put<{ defaultPlaylistId: string | null }>('/spotify/default-playlist', {
    playlistId,
  });
  return data;
};
