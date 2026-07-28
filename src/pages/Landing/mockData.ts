// MOCK — quitar. Datos de ejemplo para poblar el visual; reemplazar por datos reales.
import type { Song, DetectedSong, DestinationSong } from '../../types/song';

export const MOCK_LIBRARY: Song[] = [
  { id: 'm1', title: 'Cruel Summer', artist: 'Taylor Swift', duration: '2:58' },
  { id: 'm2', title: 'Anti-Hero', artist: 'Taylor Swift', duration: '3:20' },
  { id: 'm3', title: 'As It Was', artist: 'Harry Styles', duration: '2:47' },
  { id: 'm4', title: 'Heat Waves', artist: 'Glass Animals', duration: '3:58' },
  { id: 'm5', title: 'Flowers', artist: 'Miley Cyrus', duration: '3:20' },
  { id: 'm6', title: 'Blinding Lights', artist: 'The Weeknd', duration: '3:20' },
  { id: 'm7', title: 'Vampire', artist: 'Olivia Rodrigo', duration: '3:39' },
  { id: 'm8', title: 'Kill Bill', artist: 'SZA', duration: '2:33' },
];

export const MOCK_DETECTED_SONGS: DetectedSong[] = [
  { id: 'd1', title: 'Cruel Summer', artist: 'Taylor Swift', duration: '2:58', confidence: 97 },
  { id: 'd2', title: 'Anti-Hero', artist: 'Taylor Swift', duration: '3:20', confidence: 94 },
  { id: 'd3', title: 'As It Was', artist: 'Harry Styles', duration: '2:47', confidence: 88 },
  { id: 'd4', title: 'Heat Waves', artist: 'Glass Animals', duration: '3:58', confidence: 73 },
];

export const MOCK_DESTINATION_SONGS: DestinationSong[] = [
  { song: { id: 'p1', title: 'Espresso', artist: 'Sabrina Carpenter', duration: '2:55' }, status: 'added' },
  { song: { id: 'p2', title: 'Please Please Please', artist: 'Sabrina Carpenter', duration: '3:12' }, status: 'adding' },
  { song: { id: 'p3', title: 'Good Luck, Babe!', artist: 'Chappell Roan', duration: '3:28' }, status: 'queued' },
];
