import { Link, useNavigate } from 'react-router-dom';
import Card from '@mui/material/Card';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import type { LoginFormProps } from '../../types/callbacks';
import logoMark from '../../assets/logo-mark.png';
import styles from './Login.module.css';
import { Formik } from 'formik';
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
      <Card className={styles.card}>
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
          {({ values, errors, touched, handleChange, handleBlur, handleSubmit }) => (
            <form onSubmit={handleSubmit}>
              <div className={styles.fields}>
                <TextField
                  label="Email"
                  name='email'
                  type="text"
                  value={values.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="you@example.com"
                  error={Boolean(touched.email && errors.email)}
                  helperText={touched.email && errors.email ? errors.email : undefined}
                />
                <TextField
                  label="Password"
                  type="password"
                  name='password'
                  value={values.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="••••••••"
                  error={Boolean(touched.password && errors.password)}
                  helperText={touched.password && errors.password ? errors.password : undefined}
                />
                {/* agregar estado del proceso de evaluacion de usuario en db */}
                <Button
                  variant="contained"
                  type="submit"
                  className={styles.submit}
                  disabled={isSubmitting}
                  loading={isSubmitting}
                  loadingPosition="start"
                  loadingIndicator={<CircularProgress size={14} color="inherit" thickness={5} />}
                >
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
