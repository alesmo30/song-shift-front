import type { Song } from './song';
import type { User } from './user';

export interface LoginFormProps {
  onLogin?: (email: string, password: string) => void;
  error?: string;
}

export interface SignupFormProps {
  onSignup?: (data: { name: string; lastName: string; email: string; password: string }) => void;
  error?: string;
}

export interface LandingProps {
  user?: User | null;
  spotifyConnected?: boolean;
  onConnectSpotify?: () => void;
  onLogout?: () => void;
  onSearch?: (query: string) => void;
  onValidateWithAI?: (image: File | string) => void;
  onAddSong?: (song: Song) => void;
  onRefreshPlaylist?: () => void;
}
