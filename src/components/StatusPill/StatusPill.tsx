import Chip from '@mui/material/Chip';
import type { DestinationStatus } from '../../types/song';
import styles from './StatusPill.module.css';

const LABELS: Record<DestinationStatus, string> = {
  queued: 'Queued',
  adding: 'Adding…',
  added: 'Added ✓',
};

interface StatusPillProps {
  status: DestinationStatus;
}

/**
 * Wrapper de dominio: mapea `DestinationStatus` a label y color sobre `Chip`.
 */
export function StatusPill({ status }: StatusPillProps) {
  return <Chip className={`${styles.pill} ${styles[status]}`} label={LABELS[status]} />;
}
