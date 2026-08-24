export interface Song {
  id: string;
  title: string;
  artist: string;
  duration: string | null; // "3:24"
}

export interface DetectedSong extends Song {
  confidence: number; // 0–100, viene de AI (mock por ahora)
}

export type DestinationStatus = 'queued' | 'adding' | 'added';
