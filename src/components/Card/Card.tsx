import type { ReactNode } from 'react';
import styles from './Card.module.css';

interface CardProps {
  children: ReactNode;
  className?: string;
}

export function Card({ children, className }: CardProps) {
  return (
    <div className={`t-card ${styles.card} ${className ?? ''}`}>
      {children}
    </div>
  );
}
