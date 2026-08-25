import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { SpotifyCallbackReason, SpotifyConnection, SpotifyConnectionStatus } from '../../types/spotify';

export interface SpotifyState {
  status: SpotifyConnectionStatus;
  connection: SpotifyConnection | null;
  error: string | null;
  connecting: boolean; // true mientras se pide authorizeUrl
}

const initialState: SpotifyState = {
  status: 'idle',
  connection: null,
  error: null,
  connecting: false,
};

const deriveStatus = (connection: SpotifyConnection): SpotifyConnectionStatus => {
  if (!connection.connected) return 'disconnected';
  if (connection.needsReconnect) return 'needs-reconnect';
  return 'connected';
};

// El mapeo reason -> mensaje vive aquí, no en los componentes: la página de
// callback y el banner necesitan el mismo texto y duplicarlo garantiza que
// se desincronicen.
const CALLBACK_ERROR_MESSAGES: Record<SpotifyCallbackReason, string> = {
  access_denied: 'You cancelled the Spotify connection.',
  invalid_state: 'The Spotify connection request was invalid. Please try connecting again.',
  state_expired: 'The Spotify connection request expired. Please try connecting again.',
  state_reused: 'This Spotify connection link was already used. Please try connecting again.',
  token_exchange_failed: 'We could not complete the Spotify connection. Please try again.',
  profile_fetch_failed: 'We could not read your Spotify profile. Please try again.',
  user_not_allowlisted: 'This Spotify account is not authorized to use Totify yet.',
};
const GENERIC_CALLBACK_ERROR_MESSAGE = 'We could not connect your Spotify account. Please try again.';

// Expuesto aparte del reducer: SpotifyCallback necesita el texto resuelto
// para pasarlo por router state (el slice no sobrevive al fetch de estado
// que Landing dispara al montar, así que no basta con despachar al slice).
export const getSpotifyCallbackErrorMessage = (reason: SpotifyCallbackReason): string =>
  CALLBACK_ERROR_MESSAGES[reason] ?? GENERIC_CALLBACK_ERROR_MESSAGE;

export const spotifySlice = createSlice({
  name: 'spotify',
  initialState,
  reducers: {
    setSpotifyLoading: (state) => {
      state.status = 'loading';
      state.error = null;
    },
    setSpotifyConnection: (state, action: PayloadAction<SpotifyConnection>) => {
      state.connection = action.payload;
      state.status = deriveStatus(action.payload);
      state.error = null;
    },
    setSpotifyError: (state, action: PayloadAction<string>) => {
      state.status = 'error';
      state.error = action.payload;
    },
    setSpotifyNeedsReconnect: (state) => {
      // Un 409 SPOTIFY_REAUTH_REQUIRED en cualquier llamada: se sabe que hace
      // falta reconectar sin tener que esperar al próximo fetchSpotifyStatus.
      state.status = 'needs-reconnect';
      if (state.connection) {
        state.connection.needsReconnect = true;
      }
    },
    setSpotifyConnecting: (state, action: PayloadAction<boolean>) => {
      state.connecting = action.payload;
    },
    resetSpotify: () => initialState,
  },
});

export const {
  setSpotifyLoading,
  setSpotifyConnection,
  setSpotifyError,
  setSpotifyNeedsReconnect,
  setSpotifyConnecting,
  resetSpotify,
} = spotifySlice.actions;
export default spotifySlice.reducer;
