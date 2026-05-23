import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import useAuthBodyClass from '../hooks/useAuthBodyClass';
import { authService } from '../services';

const VerifyEmail = () => {
  useAuthBodyClass('simple');

  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setStatus('error');
      setMessage('Verification token is missing.');
      return;
    }

    authService
      .verifyEmail(token)
      .then((data) => {
        setStatus('success');
        setMessage(data.message || 'Email verified successfully.');
      })
      .catch((err) => {
        setStatus('error');
        setMessage(err.response?.data?.error || 'Verification failed.');
      });
  }, [searchParams]);

  return (
    <AuthLayout variant="simple">
      <h1 className="auth-title">Email Verification</h1>
      {status === 'loading' && <p className="auth-subtitle">Verifying your email...</p>}
      {status === 'success' && (
        <div className="alert alert-success auth-alert">
          <i className="bi bi-check-circle me-2"></i>
          {message}
        </div>
      )}
      {status === 'error' && (
        <div className="alert alert-danger auth-alert">
          <i className="bi bi-exclamation-circle me-2"></i>
          {message}
        </div>
      )}
      <p className="auth-switch-link text-center mb-0 mt-4">
        <Link to="/login" className="auth-link-accent">
          Go to Sign In
        </Link>
      </p>
    </AuthLayout>
  );
};

export default VerifyEmail;
