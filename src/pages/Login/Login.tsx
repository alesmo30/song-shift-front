import { Link } from 'react-router-dom';
import { Card } from '../../components/Card/Card';
import { Input } from '../../components/Input/Input';
import { Button } from '../../components/Button/Button';
import type { LoginFormProps } from '../../types/callbacks';
import logoMark from '../../assets/logo-mark.png';
import styles from './Login.module.css';
import { ErrorMessage, Formik } from 'formik';
import { isEmpty, isNil } from 'lodash';
import { ErrorSpan } from '../../components/ErrorSpan/ErrorSpan';


export function Login({ onLogin, error }: LoginFormProps) {

  const onHandleSubmit = ({ email, password }: Record<string, any>) => {

    if (onLogin) {
      onLogin(email, password);
    } else {
      console.log('onLogin not implemented', { email, password });
    }
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
          const errors: any = {};
          const { email, password } = values;
          if (isNil(email) || isEmpty(email)) {
            errors.email = 'Email is required';
          } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            errors.email = 'Invalid email address';
          }
          if (isNil(password) || isEmpty(password)) {
            errors.password = 'Password is required';
          }
          return errors;
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
                <Button type="submit" className={styles.submit}>
                  Sign In
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
