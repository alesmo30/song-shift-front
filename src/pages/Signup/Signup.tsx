import { Link, useNavigate } from 'react-router-dom';
import { Card } from '../../components/Card/Card';
import { Input } from '../../components/Input/Input';
import { Button } from '../../components/Button/Button';
import type { SignupFormProps } from '../../types/callbacks';
import logoMark from '../../assets/logo-mark.png';
import styles from './Signup.module.css';
import { ErrorMessage, Formik } from 'formik';
import { ErrorSpan } from '../../components/ErrorSpan/ErrorSpan';
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
      <Card>
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
          {({ values, handleChange, handleSubmit }) => (
            <form onSubmit={handleSubmit}>
              <div className={styles.fields}>
                <div className={styles.nameRow}>
                  <div>
                    <Input
                      label="Name"
                      name='name'
                      type="text"
                      value={values.name}
                      onChange={handleChange}
                      placeholder="Jane"
                    />
                    <ErrorMessage name="name" component={ErrorSpan} />
                  </div>
                  <div>
                    <Input
                      label="Last name"
                      name='lastName'
                      type="text"
                      value={values.lastName}
                      onChange={handleChange}
                      placeholder="Doe"
                    />
                    <ErrorMessage name="lastName" component={ErrorSpan} />
                  </div>
                </div>
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
                {error && <p className="t-error-text">{error}</p>}
                <Button disabled={isSubmitting} loading={isSubmitting} type="submit" className={styles.submit}>
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
