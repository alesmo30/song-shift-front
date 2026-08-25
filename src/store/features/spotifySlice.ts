import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { SpotifyCallbackReason, SpotifyConnection, SpotifyConnectionStatus, SpotifyPlaylist } from '../../types/spotify';

export type SpotifyPlaylistsStatus = 'idle' | 'loading' | 'ready' | 'error';
export type SpotifyCreatingStatus = 'idle' | 'saving' | 'error';

export interface SpotifyState {
  status: SpotifyConnectionStatus;
  connection: SpotifyConnection | null;
  error: string | null;
  connecting: boolean; // true mientras se pide authorizeUrl

  playlists: {
    items: SpotifyPlaylist[];
    status: SpotifyPlaylistsStatus;
    error: string | null;
  };
  selectedPlaylistId: string | null;
  creating: SpotifyCreatingStatus;
}

const initialState: SpotifyState = {
  status: 'idle',
  connection: null,
  error: null,
  connecting: false,

  playlists: {
    items: [],
    status: 'idle',
    error: null,
  },
  selectedPlaylistId: null,
  creating: 'idle',
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
      // El servidor manda: el destino elegido se toma de la respuesta de
      // GET /spotify/status, igual que isSpotifyConnected en userSlice.
      state.selectedPlaylistId = action.payload.defaultPlaylistId;
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
    setPlaylistsLoading: (state) => {
      state.playlists.status = 'loading';
      state.playlists.error = null;
    },
    setPlaylists: (state, action: PayloadAction<SpotifyPlaylist[]>) => {
      state.playlists.items = action.payload;
      state.playlists.status = 'ready';
      state.playlists.error = null;
    },
    setPlaylistsError: (state, action: PayloadAction<string>) => {
      state.playlists.status = 'error';
      state.playlists.error = action.payload;
    },
    addPlaylist: (state, action: PayloadAction<SpotifyPlaylist>) => {
      state.playlists.items.push(action.payload);
    },
    setSelectedPlaylistId: (state, action: PayloadAction<string | null>) => {
      state.selectedPlaylistId = action.payload;
    },
    setCreating: (state, action: PayloadAction<SpotifyCreatingStatus>) => {
      state.creating = action.payload;
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
  setPlaylistsLoading,
  setPlaylists,
  setPlaylistsError,
  addPlaylist,
  setSelectedPlaylistId,
  setCreating,
  resetSpotify,
} = spotifySlice.actions;
export default spotifySlice.reducer;
