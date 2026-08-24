import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { DetectedSong, Song } from '../../types/song';

export interface SongsState {
  detected: DetectedSong[];
  selected: Song[];
  playlist: Song[];
  status: 'idle' | 'extracting' | 'sending';
  error: string | null;
}

const initialState: SongsState = {
  detected: [],
  selected: [],
  playlist: [],
  status: 'idle',
  error: null,
};

export const songsSlice = createSlice({
  name: 'songs',
  initialState,
  reducers: {
    setDetected: (state, action: PayloadAction<DetectedSong[]>) => {
      state.detected = action.payload;
    },
    clearDetected: (state) => {
      state.detected = [];
    },
    toggleSelected: (state, action: PayloadAction<Song>) => {
      const song = action.payload;
      const index = state.selected.findIndex((s) => s.id === song.id);
      if (index === -1) {
        state.selected.push(song);
      } else {
        state.selected.splice(index, 1);
      }
    },
    removeSelected: (state, action: PayloadAction<string>) => {
      state.selected = state.selected.filter((s) => s.id !== action.payload);
    },
    selectAllDetected: (state) => {
      const existingIds = new Set(state.selected.map((s) => s.id));
      state.detected.forEach((song) => {
        if (!existingIds.has(song.id)) {
          state.selected.push(song);
          existingIds.add(song.id);
        }
      });
    },
    clearSelected: (state) => {
      state.selected = [];
    },
    commitSelected: (state) => {
      state.playlist.push(...state.selected);
      state.selected = [];
    },
    setStatus: (state, action: PayloadAction<SongsState['status']>) => {
      state.status = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const {
  setDetected,
  clearDetected,
  toggleSelected,
  removeSelected,
  selectAllDetected,
  clearSelected,
  commitSelected,
  setStatus,
  setError,
} = songsSlice.actions;
export default songsSlice.reducer;
