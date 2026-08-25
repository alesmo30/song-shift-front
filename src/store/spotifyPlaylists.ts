import type { AppDispatch } from './store';
import { getSpotifyPlaylists, createSpotifyPlaylist, setDefaultPlaylist } from '../api/spotify.service';
import {
  setPlaylistsLoading,
  setPlaylists,
  setPlaylistsError,
  addPlaylist,
  setSelectedPlaylistId,
  setCreating,
  setSpotifyNeedsReconnect,
} from './features/spotifySlice';
import { isSpotifyReauthRequired } from './spotifyErrorHandling';

export const SPOTIFY_PLAYLISTS_ERROR_MESSAGE = 'No pudimos cargar tus playlists de Spotify.';
export const SPOTIFY_CREATE_PLAYLIST_ERROR_MESSAGE = 'No pudimos crear la playlist. Inténtalo de nuevo.';
export const SPOTIFY_SET_DEFAULT_PLAYLIST_ERROR_MESSAGE = 'No pudimos guardar la playlist destino. Inténtalo de nuevo.';

/**
 * Consulta GET /spotify/playlists y reemplaza playlists.items. Se usa al
 * montar PlaylistPanel y al pulsar refresh-playlist -- ambos casos son
 * "traeme la lista real de nuevo", así que comparten esta función en vez de
 * duplicar el try/catch en el componente.
 */
export const loadPlaylists = async (dispatch: AppDispatch): Promise<void> => {
  dispatch(setPlaylistsLoading());
  try {
    const { items } = await getSpotifyPlaylists();
    dispatch(setPlaylists(items));
  } catch (error) {
    if (isSpotifyReauthRequired(error)) {
      dispatch(setSpotifyNeedsReconnect());
    } else {
      dispatch(setPlaylistsError(SPOTIFY_PLAYLISTS_ERROR_MESSAGE));
    }
  }
};

/**
 * Crea una playlist y la deja elegida como destino. Nadie crea una playlist
 * destino para no usarla (spec 06, Decisiones), así que el flujo completo
 * -- crear, añadir a la lista, elegir, persistir -- vive en un solo sitio.
 */
export const createPlaylist = async (dispatch: AppDispatch, name: string): Promise<boolean> => {
  dispatch(setCreating('saving'));
  try {
    const playlist = await createSpotifyPlaylist(name);
    dispatch(addPlaylist(playlist));
    dispatch(setCreating('idle'));
    await chooseDefaultPlaylist(dispatch, null, playlist.id);
    return true;
  } catch (error) {
    if (isSpotifyReauthRequired(error)) {
      dispatch(setSpotifyNeedsReconnect());
    } else {
      dispatch(setCreating('error'));
    }
    return false;
  }
};

/**
 * Elige la playlist destino: escribe primero en el slice (respuesta
 * inmediata en el selector) y manda el PUT después. Si falla, revierte al
 * `previousId` que pasa el caller -- el flujo de creación no tiene un
 * anterior que restaurar, así que pasa `null` explícitamente.
 */
export const chooseDefaultPlaylist = async (
  dispatch: AppDispatch,
  previousId: string | null,
  playlistId: string | null,
): Promise<void> => {
  dispatch(setSelectedPlaylistId(playlistId));
  try {
    await setDefaultPlaylist(playlistId);
  } catch (error) {
    dispatch(setSelectedPlaylistId(previousId));
    if (isSpotifyReauthRequired(error)) {
      dispatch(setSpotifyNeedsReconnect());
    } else {
      dispatch(setPlaylistsError(SPOTIFY_SET_DEFAULT_PLAYLIST_ERROR_MESSAGE));
    }
  }
};
