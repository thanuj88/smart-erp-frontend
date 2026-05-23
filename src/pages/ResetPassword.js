import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import useAuthBodyClass from '../hooks/useAuthBodyClass';
import { authService } from '../services';

const ResetPassword = () => {
  useAuthBodyClass('simple');

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const token = searchParams.get('token');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!token) {
      setError('Reset token is missing.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setLoading(true);
    try {
      await authService.resetPassword(token, password);
      navigate('/login', { state: { registered: true } });
    } catch (err) {
      setError(err.response?.data?.error || 'Password reset failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout variant="simple">
      <h1 className="auth-title">Reset Password</h1>
      <p className="auth-subtitle">Enter your new password below.</p>

      {error && (
        <div className="alert alert-danger auth-alert">
          <i className="bi bi-exclamation-circle me-2"></i>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="auth-form">
        <div className="mb-3">
          <label htmlFor="password" className="form-label auth-label">
            New password <span className="text-danger">*</span>
          </label>
          <input
            id="password"
            type="password"
            className="form-control auth-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={8}
            required
          />
        </div>
        <div className="mb-4">
          <label htmlFor="confirmPassword" className="form-label auth-label">
            Confirm password <span className="text-danger">*</span>
          </label>
          <input
            id="confirmPassword"
            type="password"
            className="form-control auth-input"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="btn auth-btn-primary w-100" disabled={loading}>
          {loading ? 'Updating...' : 'Update password'}
        </button>
      </form>

      <p className="auth-switch-link text-center mb-0 mt-4">
        <Link to="/login" className="auth-link-accent">
          Back to Sign In
        </Link>
      </p>
    </AuthLayout>
  );
};

export default ResetPassword;
