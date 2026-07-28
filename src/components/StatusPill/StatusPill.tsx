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

export function StatusPill({ status }: StatusPillProps) {
  return <span className={`${styles.pill} ${styles[status]}`}>{LABELS[status]}</span>;
}
