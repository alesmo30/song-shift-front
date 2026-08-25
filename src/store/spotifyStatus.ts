import type { AppDispatch } from './store';
import { getSpotifyStatus } from '../api/spotify.service';
import { setSpotifyLoading, setSpotifyConnection, setSpotifyError } from './features/spotifySlice';
import { setSpotifyConnected } from './features/userSlice';

export const SPOTIFY_STATUS_ERROR_MESSAGE = 'No pudimos comprobar tu conexión con Spotify.';

/**
 * Consulta GET /spotify/status y sincroniza spotifySlice y userSlice con la
 * respuesta. Se usa tanto al montar Landing como al volver del callback de
 * OAuth, así que vive aparte en lugar de duplicarse en los dos componentes.
 */
export const loadSpotifyStatus = async (dispatch: AppDispatch): Promise<void> => {
  dispatch(setSpotifyLoading());
  try {
    const connection = await getSpotifyStatus();
    dispatch(setSpotifyConnection(connection));
    dispatch(setSpotifyConnected(connection.connected));
  } catch {
    dispatch(setSpotifyError(SPOTIFY_STATUS_ERROR_MESSAGE));
  }
};
