import { Link, useNavigate } from 'react-router-dom';
import Card from '@mui/material/Card';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import type { SignupFormProps } from '../../types/callbacks';
import logoMark from '../../assets/logo-mark.png';
import styles from './Signup.module.css';
import { Formik } from 'formik';
import { extractError } from '../../helpers/error-signup-validation';
import { useState } from 'react';

export function Signup({ onSignup, error }: SignupFormProps) {
  let navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);


  const simulatingOnSignup = async () => {
    setIsSubmitting(true);
    const promise = await Promise.resolve(() => {
      return setTimeout(() => {
        setIsSubmitting(false);
        navigate('/');
      }, 5000);
    });

    await promise();
  };

  const onHandleSubmit = async ({ name, lastName, email, password }: Record<string, any>) => {
    console.log({ name, lastName, email, password });
    if (onSignup) {
      onSignup({ name, lastName, email, password });
    }
    await simulatingOnSignup();
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
        <p className={styles.subtitle}>Create your account to get started.</p>
        <Formik initialValues={{ name: '', lastName: '', email: '', password: '' }} onSubmit={onHandleSubmit} validate={values => {
          return extractError(values.name, values.lastName, values.email, values.password);
        }}>
          {({ values, errors, touched, handleChange, handleBlur, handleSubmit }) => (
            <form onSubmit={handleSubmit}>
              <div className={styles.fields}>
                <div className={styles.nameRow}>
                  <TextField
                    label="Name"
                    name='name'
                    type="text"
                    value={values.name}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="Jane"
                    error={Boolean(touched.name && errors.name)}
                    helperText={touched.name && errors.name ? errors.name : undefined}
                  />
                  <TextField
                    label="Last name"
                    name='lastName'
                    type="text"
                    value={values.lastName}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="Doe"
                    error={Boolean(touched.lastName && errors.lastName)}
                    helperText={touched.lastName && errors.lastName ? errors.lastName : undefined}
                  />
                </div>
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
                {error && <p className="t-error-text">{error}</p>}
                <Button
                  variant="contained"
                  type="submit"
                  className={styles.submit}
                  disabled={isSubmitting}
                  loading={isSubmitting}
                  loadingPosition="start"
                  loadingIndicator={<CircularProgress size={14} color="inherit" thickness={5} />}
                >
                  {isSubmitting ? 'Creating Account...' : 'Create Account'}
                </Button>
              </div>
            </form>
          )}
        </Formik>

        <p className={styles.footer}>
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </Card>
    </div>
  );
}
