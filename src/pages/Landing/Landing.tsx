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

export function Landing({
  spotifyConnected = false,
  onConnectSpotify,
  onLogout,
  onSearch,
  onValidateWithAI,
  onAddSong,
  onRefreshPlaylist,
}: LandingProps) {
  const [activeTab, setActiveTab] = useState<'search' | 'upload'>('search');
  const [connected, setConnected] = useState(spotifyConnected);

  const handleToggleSpotify = () => {
    setConnected((prev) => !prev);
    if (onConnectSpotify) {
      onConnectSpotify();
    } else {
      console.log('onConnectSpotify not implemented');
    }
  };

  const handleLogout = () => {
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
        <button className="t-btn-secondary" onClick={handleLogout}>
          Log out
        </button>
      </nav>

      <div className={`${styles.banner} ${connected ? styles.bannerConnected : ''}`}>
        <div className={styles.bannerLeft}>
          <div className={styles.spotifyGlyph}>
            <SpotifyIcon size={18} color="#ffffff" />
          </div>
          <p className={styles.bannerStatus}>{connected ? 'Spotify connected' : 'Spotify not connected'}</p>
        </div>
        <button
          className={connected ? styles.bannerBtnConnected : styles.bannerBtnDisconnected}
          onClick={handleToggleSpotify}
        >
          {connected ? '✓ Connected' : 'Connect Spotify'}
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
