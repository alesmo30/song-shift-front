import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { SpotifyConnection, SpotifyConnectionStatus } from '../../types/spotify';

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
