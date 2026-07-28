import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../../components/Card/Card';
import { Input } from '../../components/Input/Input';
import { Button } from '../../components/Button/Button';
import type { LoginFormProps } from '../../types/callbacks';
import logoMark from '../../assets/logo-mark.png';
import styles from './Login.module.css';

function validate(email: string, password: string): string | null {
  if (!email || !password) return 'Please fill in both fields.';
  if (!email.includes('@')) return 'Please enter a valid email.';
  return null;
}

export function Login({ onLogin, error }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const validationError = validate(email, password);
    setFormError(validationError);
    if (validationError) return;
    if (onLogin) {
      onLogin(email, password);
    } else {
      console.log('onLogin not implemented', { email, password });
    }
  };

  const shownError = formError ?? error;

  return (
    <div className={styles.page}>
      <Card>
        <form onSubmit={handleSubmit}>
          <div className={styles.logoRow}>
            <img src={logoMark} alt="Totify" className={styles.logoMark} />
            <span className="t-wordmark" style={{ fontSize: 'var(--fs-display-lg)', letterSpacing: 'var(--tracking-display)' }}>
              totify
            </span>
          </div>
          <p className={styles.subtitle}>Bridge your Apple Music library to Spotify — effortlessly.</p>

          <div className={styles.fields}>
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />

            {shownError && <p className="t-error-text">{shownError}</p>}

            <Button type="submit" className={styles.submit}>
              Sign In
            </Button>
          </div>
        </form>

        <p className={styles.footer}>
          Don't have an account? <Link to="/signup">Sign up free</Link>
        </p>
      </Card>
    </div>
  );
}
