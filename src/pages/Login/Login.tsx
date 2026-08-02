import { Link, useNavigate } from 'react-router-dom';
import Card from '@mui/material/Card';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import type { LoginFormProps } from '../../types/callbacks';
import logoMark from '../../assets/logo-mark.png';
import styles from './Login.module.css';
import { Formik } from 'formik';
import { extractError } from '../../helpers/error-login-validation';
import { useState } from 'react';
import { useAppDispatch } from '../../store/hooks';
import { setUser } from '../../store/features/userSlice';
import { get } from 'lodash';
import { loginUser } from '../../api/auth.service';


export function Login({ onLogin }: LoginFormProps) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);


  const onHandleSubmit = async ({ email, password }: Record<string, any>) => {
    setIsSubmitting(true);
    try {
      const { user: { name, lastName, email: userEmail }, accessToken } = await loginUser({ email, password });
      dispatch(setUser({ name: `${name} ${lastName}`, email: userEmail, isSpotifyConnected: false, token: accessToken }));
      navigate('/');
    } catch (error) {
      const apiMessage = get(error, 'response.data.message', 'Problems trying to sign in. Please verify your credentials.');
      setErrorMessage(apiMessage);
    } finally {
      setIsSubmitting(false);
    }
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

      <Snackbar
        open={Boolean(errorMessage)}
        autoHideDuration={4000}
        onClose={() => setErrorMessage(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setErrorMessage(null)}
          severity="error"
          variant="filled"
          sx={{ width: '100%' }}
        >
          {errorMessage}
        </Alert>
      </Snackbar>
    </div>
  );
}
