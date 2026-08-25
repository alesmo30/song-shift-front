import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import { SongRow } from '../../components/SongRow/SongRow';
import styles from './Landing.module.css';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { removeSelected, clearSelected, commitSelected, setStatus, setError as setSongsError } from '../../store/features/songsSlice';
import { sendToPlaylist } from '../../api/songs.service';

interface SelectedPanelProps {
  visible: boolean;
  onAddToPlaylist?: () => void;
}

export function SelectedPanel({ visible, onAddToPlaylist }: SelectedPanelProps) {
  const dispatch = useAppDispatch();
  const { selected, status, error } = useAppSelector((state) => state.songs);
  const selectedPlaylistId = useAppSelector((state) => state.spotify.selectedPlaylistId);
  const isSending = status === 'sending';
  const hasDestination = Boolean(selectedPlaylistId);

  const handleRemove = (id: string) => {
    dispatch(removeSelected(id));
  };

  const handleClearAll = () => {
    dispatch(clearSelected());
  };

  const handleAddToPlaylist = async () => {
    if (selected.length === 0) return;

    if (onAddToPlaylist) {
      onAddToPlaylist();
    } else {
      console.log('onAddToPlaylist not implemented');
    }

    dispatch(setStatus('sending'));
    dispatch(setSongsError(null));

    try {
      await sendToPlaylist(selected);
      dispatch(commitSelected());
    } catch {
      dispatch(setSongsError('Could not add songs to the playlist. Please try again.'));
    } finally {
      dispatch(setStatus('idle'));
    }
  };

  return (
    <div className={styles.tabContent} style={{ display: visible ? undefined : 'none' }}>
      {selected.length === 0 ? (
        <div className={styles.emptyState}>
          <p className={styles.emptyTitle}>No songs selected</p>
          <p className={styles.emptyHint}>Add songs from Search or Upload Photo to review them here</p>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
            <span className={styles.resultsCount}>
              {selected.length} song{selected.length === 1 ? '' : 's'} selected
            </span>
            <Button variant="text" data-testid="clear-selected" onClick={handleClearAll}>
              Clear all
            </Button>
          </div>

          <div className={styles.resultsList}>
            {selected.map((song) => (
              <SongRow
                key={song.id}
                song={song}
                action={
                  <IconButton
                    data-testid="remove-selected"
                    aria-label="Remove song"
                    onClick={() => handleRemove(song.id)}
                  >
                    <CloseIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                }
              />
            ))}
          </div>

          {error && (
            <p className="t-error-text" data-testid="playlist-api-error">
              {error}
            </p>
          )}

          <Button
            variant="text"
            className={styles.validateBtn}
            data-testid="add-to-playlist"
            disabled={selected.length === 0 || isSending || !hasDestination}
            title={hasDestination ? undefined : 'Choose a destination playlist first'}
            onClick={handleAddToPlaylist}
          >
            {isSending ? 'Adding…' : 'Add to playlist'}
          </Button>
        </>
      )}
    </div>
  );
}
