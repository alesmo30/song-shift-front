import type { ButtonHTMLAttributes } from 'react';
import styles from './Button.module.css';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
  loading?: boolean;
}

export function Button({ variant = 'primary', className, loading = false, disabled, children, ...rest }: ButtonProps) {
  const variantClass = variant === 'primary' ? 't-btn-primary' : 't-btn-secondary';
  return (
    <button
      className={`${variantClass} ${className ?? ''}`}
      disabled={disabled || loading}
      aria-busy={loading}
      {...rest}
    >
      <span className={styles.content}>
        {loading && <span className={styles.spinner} aria-hidden="true" />}
        {children}
      </span>
    </button>
  );
}
