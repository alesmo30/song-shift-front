import { useState } from 'react';
import { Tabs } from '../../components/Tabs/Tabs';
import { SpotifyIcon } from '../../components/icons/SpotifyIcon';
import { NoteIcon } from '../../components/icons/NoteIcon';
import { SearchIcon } from '../../components/icons/SearchIcon';
import { ImageIcon } from '../../components/icons/ImageIcon';
import type { LandingProps } from '../../types/callbacks';
import logoMark from '../../assets/logo-mark.png';
import { SearchPanel } from './SearchPanel';
import { UploadPanel } from './UploadPanel';
import { PlaylistPanel } from './PlaylistPanel';
import styles from './Landing.module.css';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../../store/store';
import { setUser } from '../../store/features/userSlice';
import { useNavigate } from 'react-router-dom';

export function Landing({
  onConnectSpotify,
  onLogout,
  onSearch,
  onValidateWithAI,
  onAddSong,
  onRefreshPlaylist,
}: LandingProps) {
  const [activeTab, setActiveTab] = useState<'search' | 'upload'>('search');
  const { name, email, isSpotifyConnected: userIsSpotifyConnected } = useSelector((state: RootState) => state.user);
  const navigate = useNavigate();

  const dispatch = useDispatch()

  const handleToggleSpotify = () => {
    dispatch(setUser({ name, email, isSpotifyConnected: !userIsSpotifyConnected }))
    if (onConnectSpotify) {
      onConnectSpotify();
    } else {
      console.log('onConnectSpotify not implemented');
    }
  };

  const handleLogout = () => {
    dispatch(setUser({ name: "", email: "", isSpotifyConnected: false }))
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
          <button className="t-btn-secondary" data-testid="logout" onClick={handleLogout}>
            Log out
          </button>
        </div>
      </nav>

      <div className={`${styles.banner} ${userIsSpotifyConnected ? styles.bannerConnected : ''}`}>
        <div className={styles.bannerLeft}>
          <div className={styles.spotifyGlyph}>
            <SpotifyIcon size={18} color="#ffffff" />
          </div>
          <p className={styles.bannerStatus}>{userIsSpotifyConnected ? 'Spotify connected' : 'Spotify not connected'}</p>
        </div>
        <button
          className={userIsSpotifyConnected ? styles.bannerBtnConnected : styles.bannerBtnDisconnected}
          data-testid="spotify-toggle"
          onClick={handleToggleSpotify}
        >
          {userIsSpotifyConnected ? '✓ Connected' : 'Connect Spotify'}
        </button>
      </div>

      <div className={styles.panels}>
        <div className={`t-panel ${styles.panel}`}>
          <div className={styles.panelHeader}>
            <div className={styles.findSongsIcon}>
              <NoteIcon size={12} color="#ffffff" />
            </div>
            <h2 className="t-heading" style={{ fontSize: 'var(--fs-heading)' }}>
              Find Songs
            </h2>
            <span className={styles.panelSubtitle}>from Apple Music</span>
          </div>
          <div className={styles.tabsWrap}>
            <Tabs
              tabs={[
                { id: 'search', label: 'Search', icon: <SearchIcon size={13} /> },
                { id: 'upload', label: 'Upload Photo', icon: <ImageIcon size={13} /> },
              ]}
              activeId={activeTab}
              onChange={(id) => setActiveTab(id as 'search' | 'upload')}
            />
          </div>
          {activeTab === 'search' ? (
            <SearchPanel onSearch={onSearch} onAddSong={onAddSong} />
          ) : (
            <UploadPanel onValidateWithAI={onValidateWithAI} onAddSong={onAddSong} />
          )}
        </div>

        <div className={`t-panel ${styles.panel}`}>
          <PlaylistPanel onRefreshPlaylist={onRefreshPlaylist} />
        </div>
      </div>
    </div>
  );
}
