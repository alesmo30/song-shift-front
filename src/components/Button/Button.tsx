import type { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
}

export function Button({ variant = 'primary', className, ...rest }: ButtonProps) {
  const variantClass = variant === 'primary' ? 't-btn-primary' : 't-btn-secondary';
  return <button className={`${variantClass} ${className ?? ''}`} {...rest} />;
}
