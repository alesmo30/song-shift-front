export type SpotifyConnectionStatus =
  | 'idle' // aún no se ha preguntado
  | 'loading' // fetchSpotifyStatus en vuelo
  | 'connected'
  | 'disconnected'
  | 'needs-reconnect'
  | 'error'; // la consulta de estado falló

export interface SpotifyConnection {
  connected: boolean;
  spotifyUserId: string | null;
  displayName: string | null;
  email: string | null;
  country: string | null;
  scopes: string[];
  connectedAt: string | null; // ISO 8601
  needsReconnect: boolean;
}

export type SpotifyCallbackReason =
  | 'access_denied'
  | 'invalid_state'
  | 'state_expired'
  | 'state_reused'
  | 'token_exchange_failed'
  | 'profile_fetch_failed'
  | 'user_not_allowlisted';

export interface SpotifyAuthUrlResponse {
  authorizeUrl: string;
  state: string;
  expiresAt: string; // ISO 8601
}
