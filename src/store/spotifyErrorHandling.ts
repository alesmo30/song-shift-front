import axios from 'axios';

/**
 * true cuando el backend respondió 409 SPOTIFY_REAUTH_REQUIRED -- un fallo
 * de auth del lado de Spotify, no de Totify. El backend usa 409 (no 401)
 * justamente para que el interceptor de src/api/client.ts no lo confunda
 * con una sesión de Totify caducada y dispare /renew-tokens. No se puede
 * centralizar en ese interceptor (no se toca client.ts en este spec), así
 * que cada punto de llamada a la API de Spotify comprueba esto en su catch.
 */
export const isSpotifyReauthRequired = (error: unknown): boolean => {
  if (!axios.isAxiosError(error)) return false;
  return error.response?.status === 409 && error.response?.data?.code === 'SPOTIFY_REAUTH_REQUIRED';
};
