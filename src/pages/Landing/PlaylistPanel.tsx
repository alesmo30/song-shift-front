import { useState } from 'react';
import IconButton from '@mui/material/IconButton';
import RefreshIcon from '@mui/icons-material/Refresh';
import { StatusPill } from '../../components/StatusPill/StatusPill';
import { SpotifyIcon } from '../../components/icons/SpotifyIcon';
import styles from './Landing.module.css';
import { useAppSelector } from '../../store/hooks';

interface PlaylistPanelProps {
  onRefreshPlaylist?: () => void;
}

export function PlaylistPanel({ onRefreshPlaylist }: PlaylistPanelProps) {
  const [isSpinning, setIsSpinning] = useState(false);
  const playlist = useAppSelector((state) => state.songs.playlist);

  const handleRefresh = () => {
    setIsSpinning(true);
    setTimeout(() => setIsSpinning(false), 1200);
    if (onRefreshPlaylist) {
      onRefreshPlaylist();
    } else {
      console.log('onRefreshPlaylist not implemented');
    }
  };

  return (
    <div className={styles.playlistPanel}>
      <div className={styles.playlistHeader}>
        <div className={styles.playlistHeaderLeft}>
          <div className={styles.playlistIconSquare}>
            <SpotifyIcon size={13} color="#ffffff" />
          </div>
          <div>
            <h2 className="t-heading" style={{ fontSize: 'var(--fs-heading)' }}>
              Spotify Playlist
            </h2>
            <p className={styles.playlistCount}>
              {playlist.length} song{playlist.length === 1 ? '' : 's'} added
            </p>
          </div>
        </div>
        <IconButton
          className={styles.refreshBtn}
          data-testid="refresh-playlist"
          aria-label="Refresh playlist"
          onClick={handleRefresh}
        >
          <span className={isSpinning ? styles.spinning : ''}>
            <RefreshIcon sx={{ fontSize: 15, color: 'var(--color-text-muted-1)', display: 'block' }} />
          </span>
        </IconButton>
      </div>

      <div className={styles.playlistList}>
        {playlist.length === 0 && (
          <div className={styles.emptyState}>
            <p className={styles.emptyTitle}>No songs yet</p>
            <p className={styles.emptyHint}>Add songs from the left panel to see them here</p>
          </div>
        )}
        {playlist.map((song) => (
          <div key={song.id} className={`t-row ${styles.destRow}`}>
            <div className={styles.destIcon}>
              <SpotifyIcon size={14} color="#1DB954" />
            </div>
            <div className={styles.info}>
              <p className={styles.title}>{song.title}</p>
              <p className={styles.meta}>
                {song.artist}
                {song.duration ? ` · ${song.duration}` : ''}
              </p>
            </div>
            <StatusPill status="added" />
          </div>
        ))}
      </div>
    </div>
  );
}
