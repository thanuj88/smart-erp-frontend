import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import useAuthBodyClass from '../hooks/useAuthBodyClass';
import { APP_CONFIG } from '../config/app';
import { authService } from '../services';

const ForgotPassword = () => {
  useAuthBodyClass('simple');

  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await authService.forgotPassword(email);
      setSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Request failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout variant="simple">
      <h1 className="auth-title">Forgot Password?</h1>
      <p className="auth-subtitle">
        Enter your email and we&apos;ll send you instructions to reset your password for {APP_CONFIG.name}.
      </p>

      {error && (
        <div className="alert alert-danger auth-alert">
          <i className="bi bi-exclamation-circle me-2"></i>
          {error}
        </div>
      )}

      {submitted ? (
        <div className="alert alert-success auth-alert">
          <i className="bi bi-check-circle me-2"></i>
          If an account exists for <strong>{email}</strong>, you will receive a reset link shortly.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="mb-4">
            <label htmlFor="email" className="form-label auth-label">
              Email <span className="text-danger">*</span>
            </label>
            <div className="auth-input-wrap">
              <input
                id="email"
                type="email"
                className="form-control auth-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                autoFocus
              />
              <i className="bi bi-envelope auth-input-icon"></i>
            </div>
          </div>
          <button type="submit" className="btn auth-btn-primary w-100 mb-3" disabled={loading}>
            {loading ? 'Sending...' : 'Send reset link'}
          </button>
        </form>
      )}

      <p className="auth-switch-link text-center mb-0">
        Remember your password?{' '}
        <Link to="/login" className="auth-link-accent">
          Sign In
        </Link>
      </p>
    </AuthLayout>
  );
};

export default ForgotPassword;
