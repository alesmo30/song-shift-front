import { useEffect, useState } from 'react';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Button from '@mui/material/Button';
import SearchIcon from '@mui/icons-material/Search';
import ImageIcon from '@mui/icons-material/Image';
import PlaylistAddCheckIcon from '@mui/icons-material/PlaylistAddCheck';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import { SpotifyIcon } from '../../components/icons/SpotifyIcon';
import type { LandingProps } from '../../types/callbacks';
import logoMark from '../../assets/logo-mark.png';
import { SearchPanel } from './SearchPanel';
import { UploadPanel } from './UploadPanel';
import { SelectedPanel } from './SelectedPanel';
import { PlaylistPanel } from './PlaylistPanel';
import styles from './Landing.module.css';
import { persistor } from '../../store/store';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { clearUser, setSpotifyConnected } from '../../store/features/userSlice';
import { setSpotifyConnecting, resetSpotify, setSpotifyError, setSpotifyNeedsReconnect } from '../../store/features/spotifySlice';
import { loadSpotifyStatus } from '../../store/spotifyStatus';
import { isSpotifyReauthRequired } from '../../store/spotifyErrorHandling';
import { getSpotifyAuthUrl, disconnectSpotify } from '../../api/spotify.service';
import { useNavigate, useLocation } from 'react-router-dom';
import { Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Snackbar, Alert } from '@mui/material';

const SPOTIFY_CONNECT_ERROR_MESSAGE = 'No pudimos iniciar la conexión con Spotify. Inténtalo de nuevo.';
const SPOTIFY_DISCONNECT_ERROR_MESSAGE = 'No pudimos desconectar tu cuenta de Spotify. Inténtalo de nuevo.';

export function Landing({
  onConnectSpotify,
  onLogout,
  onSearch,
  onValidateWithAI,
  onAddSong,
  onAddToPlaylist,
  onRefreshPlaylist,
}: LandingProps) {
  const [activeTab, setActiveTab] = useState<'search' | 'upload' | 'selected'>('search');
  const { name } = useAppSelector((state) => state.user);
  const { status: spotifyStatus, connection: spotifyConnection, error: spotifyError, connecting: spotifyConnecting } = useAppSelector((state) => state.spotify);
  const selectedCount = useAppSelector((state) => state.songs.selected.length);
  const [open, setOpen] = useState(false);
  const [disconnectDialogOpen, setDisconnectDialogOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch()

  const callbackMessage = (location.state as { spotifyCallbackMessage?: string } | null)?.spotifyCallbackMessage ?? null;
  const [callbackSnackbarMessage, setCallbackSnackbarMessage] = useState<string | null>(callbackMessage);

  useEffect(() => {
    loadSpotifyStatus(dispatch);
  }, [dispatch]);

  useEffect(() => {
    // Se muestra una sola vez: limpia el state de router para que un
    // reload o un back no vuelvan a disparar el Snackbar.
    if (callbackMessage) {
      navigate(location.pathname, { replace: true, state: null });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleConnect = async () => {
    dispatch(setSpotifyConnecting(true));
    try {
      const { authorizeUrl } = await getSpotifyAuthUrl();
      if (onConnectSpotify) {
        onConnectSpotify();
      } else {
        console.log('onConnectSpotify not implemented');
      }
      window.location.assign(authorizeUrl);
    } catch (error) {
      dispatch(setSpotifyConnecting(false));
      if (isSpotifyReauthRequired(error)) {
        dispatch(setSpotifyNeedsReconnect());
      } else {
        dispatch(setSpotifyError(SPOTIFY_CONNECT_ERROR_MESSAGE));
      }
    }
  };

  const handleDisconnectClick = () => {
    setDisconnectDialogOpen(true);
  };

  const handleDisconnectCancel = () => {
    setDisconnectDialogOpen(false);
  };

  const handleDisconnectConfirm = async () => {
    setDisconnectDialogOpen(false);
    try {
      await disconnectSpotify();
      dispatch(setSpotifyConnected(false));
      await loadSpotifyStatus(dispatch);
    } catch (error) {
      if (isSpotifyReauthRequired(error)) {
        dispatch(setSpotifyNeedsReconnect());
      } else {
        dispatch(setSpotifyError(SPOTIFY_DISCONNECT_ERROR_MESSAGE));
      }
    }
  };

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleLogout = () => {
    dispatch(clearUser());
    dispatch(resetSpotify());
    persistor.purge();
    navigate('/login');
    if (onLogout) {
      onLogout();
    } else {
      console.log('onLogout not implemented');
    }
  };

  return (
    <div className={styles.page}>
      <nav className={styles.navbar}>
        <div className={styles.logoRow}>
          <img src={logoMark} alt="Totify" className={styles.navLogoMark} />
          <span className="t-wordmark" style={{ fontSize: 'var(--fs-display-md)', letterSpacing: 'var(--tracking-display-sm)' }}>
            totify
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', flexDirection: 'row', gap: 'var(--space-6)' }}>
          <span>
            {name}
          </span>
          <Button variant="outlined" data-testid="logout" onClick={handleClickOpen}>
            Log out
          </Button>
          <Dialog
            open={open}
            onClose={handleClose}
            aria-labelledby="alert-dialog-title"
            aria-describedby="alert-dialog-description"
            role="alertdialog"
          >
            <DialogTitle id="alert-dialog-title">
              {"Are you sure you want to logout?"}
            </DialogTitle>
            <DialogContent>
              <DialogContentText id="alert-dialog-description">
                By logging out, you will be redirected to the login page.
              </DialogContentText>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleLogout}>Yes</Button>
              <Button onClick={handleClose} autoFocus>
                No
              </Button>
            </DialogActions>
          </Dialog>
        </div>
      </nav>

      <div
        className={`${styles.banner} ${
          spotifyStatus === 'connected'
            ? styles.bannerConnected
            : spotifyStatus === 'needs-reconnect'
              ? styles.bannerNeedsReconnect
              : ''
        }`}
      >
        <div className={styles.bannerLeft}>
          <div className={styles.spotifyGlyph}>
            <SpotifyIcon size={18} color="#ffffff" />
          </div>
          <p className={styles.bannerStatus} data-testid="spotify-status-text">
            {spotifyStatus === 'idle' || spotifyStatus === 'loading'
              ? 'Checking Spotify connection…'
              : spotifyStatus === 'connected'
                ? spotifyConnection?.displayName
                  ? `Spotify connected as ${spotifyConnection.displayName}`
                  : 'Spotify connected'
                : spotifyStatus === 'needs-reconnect'
                  ? 'Spotify needs reconnection'
                  : spotifyStatus === 'error'
                    ? spotifyError ?? 'Spotify not connected'
                    : 'Spotify not connected'}
          </p>
        </div>
        {spotifyStatus === 'idle' || spotifyStatus === 'loading' ? (
          <Button variant="text" className={styles.bannerBtnDisconnected} data-testid="spotify-toggle" disabled>
            Checking…
          </Button>
        ) : spotifyStatus === 'connected' ? (
          <Button
            variant="text"
            className={styles.bannerBtnConnected}
            data-testid="spotify-toggle"
            onClick={handleDisconnectClick}
          >
            Disconnect
          </Button>
        ) : spotifyStatus === 'needs-reconnect' ? (
          <Button
            variant="text"
            className={styles.bannerBtnDisconnected}
            data-testid="spotify-toggle"
            disabled={spotifyConnecting}
            onClick={handleConnect}
          >
            {spotifyConnecting ? 'Reconnecting…' : 'Reconnect'}
          </Button>
        ) : spotifyStatus === 'error' ? (
          <Button
            variant="text"
            className={styles.bannerBtnDisconnected}
            data-testid="spotify-toggle"
            onClick={() => loadSpotifyStatus(dispatch)}
          >
            Retry
          </Button>
        ) : (
          <Button
            variant="text"
            className={styles.bannerBtnDisconnected}
            data-testid="spotify-toggle"
            disabled={spotifyConnecting}
            onClick={handleConnect}
          >
            {spotifyConnecting ? 'Connecting…' : 'Connect Spotify'}
          </Button>
        )}
      </div>

      <Dialog
        open={disconnectDialogOpen}
        onClose={handleDisconnectCancel}
        aria-labelledby="disconnect-dialog-title"
        aria-describedby="disconnect-dialog-description"
      >
        <DialogTitle id="disconnect-dialog-title">Disconnect Spotify?</DialogTitle>
        <DialogContent>
          <DialogContentText id="disconnect-dialog-description">
            Disconnecting removes Totify's access on our side. Spotify will still show Totify under your
            connected apps until you remove it yourself at spotify.com/account/apps.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button data-testid="disconnect-confirm" onClick={handleDisconnectConfirm}>
            Disconnect
          </Button>
          <Button onClick={handleDisconnectCancel} autoFocus>
            Cancel
          </Button>
        </DialogActions>
      </Dialog>

      <div className={styles.panels}>
        <div className={`t-panel ${styles.panel}`}>
          <div className={styles.panelHeader}>
            <div className={styles.findSongsIcon}>
              <MusicNoteIcon sx={{ fontSize: 12, color: '#ffffff', display: 'block' }} />
            </div>
            <h2 className="t-heading" style={{ fontSize: 'var(--fs-heading)' }}>
              Find Songs
            </h2>
            <span className={styles.panelSubtitle}>from Apple Music</span>
          </div>
          <div className={styles.tabsWrap}>
            <Tabs
              value={activeTab}
              onChange={(_, id) => setActiveTab(id as 'search' | 'upload' | 'selected')}
              aria-label="Fuente de canciones"
            >
              <Tab
                value="search"
                label="Search"
                data-testid="tab-search"
                icon={<SearchIcon sx={{ fontSize: 13 }} />}
                iconPosition="start"
              />
              <Tab
                value="upload"
                label="Upload Photo"
                data-testid="tab-upload"
                icon={<ImageIcon sx={{ fontSize: 13 }} />}
                iconPosition="start"
              />
              <Tab
                value="selected"
                label={`Selected (${selectedCount})`}
                data-testid="tab-selected"
                icon={<PlaylistAddCheckIcon sx={{ fontSize: 13 }} />}
                iconPosition="start"
              />
            </Tabs>
          </div>
          <SearchPanel visible={activeTab === 'search'} onSearch={onSearch} onAddSong={onAddSong} />
          <UploadPanel visible={activeTab === 'upload'} onValidateWithAI={onValidateWithAI} onAddSong={onAddSong} />
          <SelectedPanel visible={activeTab === 'selected'} onAddToPlaylist={onAddToPlaylist} />
        </div>

        <div className={`t-panel ${styles.panel}`}>
          <PlaylistPanel onRefreshPlaylist={onRefreshPlaylist} />
        </div>
      </div>

      <Snackbar
        open={Boolean(callbackSnackbarMessage)}
        autoHideDuration={6000}
        onClose={() => setCallbackSnackbarMessage(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setCallbackSnackbarMessage(null)}
          severity="error"
          variant="filled"
          data-testid="spotify-callback-error"
          sx={{ width: '100%' }}
        >
          {callbackSnackbarMessage}
        </Alert>
      </Snackbar>
    </div>
  );
}
