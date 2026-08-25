import { useEffect, useRef, useState } from 'react';
import IconButton from '@mui/material/IconButton';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import { Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import AddIcon from '@mui/icons-material/Add';
import { StatusPill } from '../../components/StatusPill/StatusPill';
import { SpotifyIcon } from '../../components/icons/SpotifyIcon';
import styles from './Landing.module.css';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { loadPlaylists, createPlaylist, chooseDefaultPlaylist } from '../../store/spotifyPlaylists';
import type { SpotifyConnectionStatus, SpotifyPlaylist } from '../../types/spotify';
import { cleanPlaylist, clearSelected } from '../../store/features/songsSlice';

const CONNECTED_STATUSES: SpotifyConnectionStatus[] = ['connected', 'needs-reconnect'];

interface PlaylistPanelProps {
  onRefreshPlaylist?: () => void;
}

export function PlaylistPanel({ onRefreshPlaylist }: PlaylistPanelProps) {
  const [isSpinning, setIsSpinning] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const dispatch = useAppDispatch();
  const playlist = useAppSelector((state) => state.songs.playlist);
  const {
    status: spotifyStatus,
    playlists: { items: playlists, status: playlistsStatus },
    selectedPlaylistId,
    creating,
  } = useAppSelector((state) => state.spotify);

  const isConnected = CONNECTED_STATUSES.includes(spotifyStatus);

  // Guard contra el doble-invoke de StrictMode en desarrollo, igual que el
  // fetch de estado en Landing.tsx: sin esto, GET /spotify/playlists sale
  // dos veces en cada carga.
  const hasFetchedPlaylists = useRef(false);

  useEffect(() => {
    if (!isConnected) {
      hasFetchedPlaylists.current = false;
      return;
    }
    if (hasFetchedPlaylists.current) {
      return;
    }
    hasFetchedPlaylists.current = true;
    loadPlaylists(dispatch);
  }, [isConnected, dispatch]);

  const selectedPlaylist = playlists.find((p) => p.id === selectedPlaylistId) ?? null;

  const handleRefresh = async () => {
    setIsSpinning(true);
    if (onRefreshPlaylist) {
      onRefreshPlaylist();
    } else {
      console.log('onRefreshPlaylist not implemented');
    }
    await loadPlaylists(dispatch);
    setIsSpinning(false);
  };

  const handleSelect = (value: SpotifyPlaylist | null) => {
    chooseDefaultPlaylist(dispatch, selectedPlaylistId, value?.id ?? null);
    dispatch(cleanPlaylist())
    dispatch(clearSelected())
  };

  const handleOpenCreateDialog = () => setCreateDialogOpen(true);
  const handleCloseCreateDialog = () => {
    setCreateDialogOpen(false);
    setNewPlaylistName('');
  };

  const handleCreate = async () => {
    const ok = await createPlaylist(dispatch, newPlaylistName.trim());
    if (ok) {
      handleCloseCreateDialog();
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
              {selectedPlaylist ? selectedPlaylist.name : 'Spotify Playlist'}
            </h2>
            <p className={styles.playlistCount}>
              {selectedPlaylist
                ? `${selectedPlaylist.trackCount} song${selectedPlaylist.trackCount === 1 ? '' : 's'} in playlist`
                : `${playlist.length} song${playlist.length === 1 ? '' : 's'} added`}
            </p>
          </div>
        </div>
        {isConnected && (
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
        )}
      </div>

      {!isConnected ? (
        <div className={styles.emptyState}>
          <p className={styles.emptyTitle}>No playlist selected</p>
          <p className={styles.emptyHint}>Connect Spotify to choose a destination playlist</p>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', gap: 'var(--space-2)', padding: '0 var(--space-6)', paddingTop: 'calc(var(--space-2) + 4px)' }}>
            <Autocomplete
              data-testid="playlist-select"
              fullWidth
              size="small"
              options={playlists}
              getOptionLabel={(option) => option.name}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              value={selectedPlaylist}
              loading={playlistsStatus === 'loading'}
              onChange={(_, value) => handleSelect(value)}
              renderInput={(params) => <TextField {...params} label="Destination playlist" />}
            />
            <IconButton
              data-testid="create-playlist-open"
              aria-label="Create new playlist"
              onClick={handleOpenCreateDialog}
            >
              <AddIcon sx={{ fontSize: 18 }} />
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
        </>
      )}

      <Dialog open={createDialogOpen} onClose={handleCloseCreateDialog}>
        <DialogTitle>Create new playlist</DialogTitle>
        <DialogContent>
          <DialogContentText>
            The playlist is created private on Spotify. You can edit its visibility or description from Spotify
            afterwards.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            label="Playlist name"
            fullWidth
            variant="standard"
            data-testid="new-playlist-name"
            value={newPlaylistName}
            onChange={(event) => setNewPlaylistName(event.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCreateDialog}>Cancel</Button>
          <Button
            data-testid="create-playlist-confirm"
            disabled={newPlaylistName.trim().length === 0 || creating === 'saving'}
            onClick={handleCreate}
          >
            {creating === 'saving' ? 'Creating…' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
