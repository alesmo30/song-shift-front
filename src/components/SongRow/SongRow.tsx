import type { ReactNode } from 'react';
import type { Song } from '../../types/song';
import styles from './SongRow.module.css';

interface SongRowProps {
  song: Song;
  action?: ReactNode;
  iconTint?: 'brand' | 'spotify';
}

export function SongRow({ song, action, iconTint = 'brand' }: SongRowProps) {
  return (
    <div className={`t-row ${styles.row}`}>
      <div className={`${styles.icon} ${iconTint === 'spotify' ? styles.iconSpotify : styles.iconBrand}`} />
      <div className={styles.info}>
        <p className={styles.title}>{song.title}</p>
        <p className={styles.meta}>
          {song.artist} · {song.duration}
        </p>
      </div>
      {action}
    </div>
  );
}
