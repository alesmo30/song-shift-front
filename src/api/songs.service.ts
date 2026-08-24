import { apiClient } from './client';
import type { DetectedSong, Song } from '../types/song';

export interface ExtractSongsResponse {
  songs: DetectedSong[];
  processed: number;
  failed: number;
}

export interface SendToPlaylistResponse {
  playlistId: string;
  accepted: number;
  status: string;
}

/**
 * multipart/form-data — hay que anular el `Content-Type: application/json`
 * por defecto de apiClient para que axios calcule el boundary.
 */
export const extractSongs = async (files: File[]): Promise<ExtractSongsResponse> => {
  const formData = new FormData();
  files.forEach((file) => formData.append('screenshots', file));

  const { data } = await apiClient.post<ExtractSongsResponse>('/songs/extract', formData, {
    headers: { 'Content-Type': undefined },
  });
  return data;
};

export const sendToPlaylist = async (songs: Song[]): Promise<SendToPlaylistResponse> => {
  const { data } = await apiClient.post<SendToPlaylistResponse>('/songs/playlist', { songs });
  return data;
};
