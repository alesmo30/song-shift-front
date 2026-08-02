import type { ReactNode } from 'react';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import type { Song } from '../../types/song';
import styles from './SongRow.module.css';

interface SongRowProps {
  song: Song;
  action?: ReactNode;
  iconTint?: 'brand' | 'spotify';
}

/**
 * Wrapper de dominio: traduce un `Song` a la fila visual (título, artista,
 * duración) sobre `ListItem` de MUI.
 */
export function SongRow({ song, action, iconTint = 'brand' }: SongRowProps) {
  return (
    <ListItem className={`t-row ${styles.row}`}>
      <div className={`${styles.icon} ${iconTint === 'spotify' ? styles.iconSpotify : styles.iconBrand}`} />
      <ListItemText
        className={styles.info}
        disableTypography
        primary={<p className={styles.title}>{song.title}</p>}
        secondary={
          <p className={styles.meta}>
            {song.artist} · {song.duration}
          </p>
        }
      />
      {action}
    </ListItem>
  );
}
