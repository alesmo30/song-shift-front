import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../../components/Card/Card';
import { Input } from '../../components/Input/Input';
import { Button } from '../../components/Button/Button';
import type { SignupFormProps } from '../../types/callbacks';
import logoMark from '../../assets/logo-mark.png';
import styles from './Signup.module.css';

function validate(name: string, lastName: string, email: string, password: string): string | null {
  if (!name || !lastName || !email || !password) return 'Please fill in all fields.';
  if (!email.includes('@')) return 'Please enter a valid email.';
  return null;
}

export function Signup({ onSignup, error }: SignupFormProps) {
  const [name, setName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const validationError = validate(name, lastName, email, password);
    setFormError(validationError);
    if (validationError) return;
    if (onSignup) {
      onSignup({ name, lastName, email, password });
    } else {
      console.log('onSignup not implemented', { name, lastName, email, password });
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
          <p className={styles.subtitle}>Create your account to get started.</p>

          <div className={styles.fields}>
            <div className={styles.nameRow}>
              <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane" />
              <Input label="Last name" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Doe" />
            </div>
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
              Create Account
            </Button>
          </div>
        </form>

        <p className={styles.footer}>
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </Card>
    </div>
  );
}
