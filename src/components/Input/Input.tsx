import type { InputHTMLAttributes } from 'react';
import styles from './Input.module.css';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export function Input({ label, className, ...rest }: InputProps) {
  return (
    <label className={styles.field}>
      <span className="t-label">{label}</span>
      <input className={`t-input ${className ?? ''}`} {...rest} />
    </label>
  );
}
