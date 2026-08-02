import { Link, useNavigate } from 'react-router-dom';
import { Card } from '../../components/Card/Card';
import { Input } from '../../components/Input/Input';
import { Button } from '../../components/Button/Button';
import type { LoginFormProps } from '../../types/callbacks';
import logoMark from '../../assets/logo-mark.png';
import styles from './Login.module.css';
import { ErrorMessage, Formik } from 'formik';
import { ErrorSpan } from '../../components/ErrorSpan/ErrorSpan';
import { extractError } from '../../helpers/error-login-validation';
import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { setUser } from '../../store/features/userSlice';


export function Login({ onLogin }: LoginFormProps) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const simulatingOnLogin = async (email: string, password: string) => {
    setIsSubmitting(true);
    const promise = await Promise.resolve(() => {
      return setTimeout(() => {
        setIsSubmitting(false);
        dispatch(setUser({ name: email.split('@')[0], email, isSpotifyConnected: true }));
        navigate('/');
      }, 5000);
    });

    if (onLogin) {
      onLogin(email, password);
    } else {
      console.log('onLogin not implemented', { email, password });
    }

    await promise();
  };

  const onHandleSubmit = async ({ email, password }: Record<string, any>) => {
    await simulatingOnLogin(email, password);
  };

  return (
    <div className={styles.page}>
      <Card>
        <div className={styles.logoRow}>
          <img src={logoMark} alt="Totify" className={styles.logoMark} />
          <span className="t-wordmark" style={{ fontSize: 'var(--fs-display-lg)', letterSpacing: 'var(--tracking-display)' }}>
            totify
          </span>
        </div>
        <p className={styles.subtitle}>Bridge your Apple Music library to Spotify — effortlessly.</p>
        <Formik initialValues={{ email: '', password: '' }} onSubmit={onHandleSubmit} validate={values => {
          return extractError(values.email, values.password);
        }}>
          {({ values, handleChange, handleSubmit }) => (
            <form onSubmit={handleSubmit}>
              <div className={styles.fields}>
                <Input
                  label="Email"
                  name='email'
                  type="text"
                  value={values.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                />
                <ErrorMessage name="email" component={ErrorSpan} />
                <Input
                  label="Password"
                  type="password"
                  name='password'
                  value={values.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                />
                <ErrorMessage name="password" component={ErrorSpan} />
                {/* agregar estado del proceso de evaluacion de usuario en db */}
                <Button disabled={isSubmitting} loading={isSubmitting} type="submit" className={styles.submit}>
                  {isSubmitting ? 'Signing In...' : 'Sign In'}
                </Button>
              </div>
            </form>

          )}
        </Formik>

        <p className={styles.footer}>
          Don't have an account? <Link to="/signup">Sign up free</Link>
        </p>
      </Card>
    </div>
  );
}
