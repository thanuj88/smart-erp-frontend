import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import { APP_CONFIG } from '../config/app';
import { authService } from '../services';

const Register = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    businessName: '',
    username: '',
    password: '',
    confirmPassword: '',
  });
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (!form.businessName.trim()) {
      setError('Business name is required.');
      return;
    }
    setLoading(true);
    try {
      const result = await authService.register({
        fullName: form.fullName,
        email: form.email,
        businessName: form.businessName,
        username: form.username || undefined,
        password: form.password,
      });
      setSuccess(result.message);
      setTimeout(() => navigate('/login', { state: { registered: true } }), 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = () => {
    setError('Google sign-up is not configured in this demo.');
  };

  return (
    <AuthLayout>
      <h1 className="auth-title">Create Account</h1>
      <p className="auth-subtitle">
        Join {APP_CONFIG.name} to manage inventory, sales, and your store in one place.
      </p>

      {success && (
        <div className="alert alert-success auth-alert" role="alert">
          <i className="bi bi-check-circle me-2"></i>
          {success}
        </div>
      )}

      {error && (
        <div className="alert alert-danger auth-alert" role="alert">
          <i className="bi bi-exclamation-circle me-2"></i>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="auth-form">
        <div className="mb-3">
          <label htmlFor="businessName" className="form-label auth-label">
            Business / store name <span className="text-danger">*</span>
          </label>
          <input
            id="businessName"
            name="businessName"
            type="text"
            className="form-control auth-input"
            value={form.businessName}
            onChange={handleChange}
            required
          />
        </div>
        <div className="mb-3">
          <label htmlFor="fullName" className="form-label auth-label">
            Full name <span className="text-danger">*</span>
          </label>
          <input
            id="fullName"
            name="fullName"
            type="text"
            className="form-control auth-input"
            value={form.fullName}
            onChange={handleChange}
            required
          />
        </div>
        <div className="mb-3">
          <label htmlFor="email" className="form-label auth-label">
            Email <span className="text-danger">*</span>
          </label>
          <div className="auth-input-wrap">
            <input
              id="email"
              name="email"
              type="email"
              className="form-control auth-input"
              value={form.email}
              onChange={handleChange}
              required
            />
            <i className="bi bi-envelope auth-input-icon"></i>
          </div>
        </div>
        <div className="mb-3">
          <label htmlFor="username" className="form-label auth-label">
            Username <span className="text-danger">*</span>
          </label>
          <input
            id="username"
            name="username"
            type="text"
            className="form-control auth-input"
            value={form.username}
            onChange={handleChange}
            required
          />
        </div>
        <div className="mb-3">
          <label htmlFor="password" className="form-label auth-label">
            Password <span className="text-danger">*</span>
          </label>
          <div className="auth-input-wrap">
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              className="form-control auth-input"
              value={form.password}
              onChange={handleChange}
              minLength={6}
              required
            />
            <button
              type="button"
              className="auth-input-icon-btn"
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1}
            >
              <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
            </button>
          </div>
        </div>
        <div className="mb-4">
          <label htmlFor="confirmPassword" className="form-label auth-label">
            Confirm password <span className="text-danger">*</span>
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            className="form-control auth-input"
            value={form.confirmPassword}
            onChange={handleChange}
            required
          />
        </div>
        <button type="submit" className="btn auth-btn-primary w-100" disabled={loading}>
          {loading ? 'Creating account...' : 'Create account'}
        </button>
      </form>

      <p className="auth-switch-link text-center mb-4">
        Already have an account?{' '}
        <Link to="/login" className="auth-link-accent">
          Sign In
        </Link>
      </p>

      <div className="auth-divider">
        <span>OR</span>
      </div>

      <button type="button" className="btn auth-btn-google w-100" onClick={handleGoogleSignUp}>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="22" height="22" aria-hidden="true">
          <path fill="#fbbc05" d="M43.6 20.5H42V20H24v8h11.3c-1.3 3.5-4.9 6-9.3 6-5.5 0-10-4.5-10-10s4.5-10 10-10c2.6 0 5 1 6.8 2.6l5.7-5.7C34.4 7.5 29.5 5 24 5 12.8 5 4 13.8 4 25s8.8 20 20 20 20-8.8 20-20c0-1.3-.1-2.5-.4-3.5z" />
          <path fill="#518ef8" d="M6.3 14.7l6.6 4.8C14.8 16 19 13 24 13c2.6 0 5 1 6.8 2.6l5.7-5.7C34.4 7.5 29.5 5 24 5 16.4 5 9.5 9.6 6.3 14.7z" />
          <path fill="#28b446" d="M24 43c5.4 0 10-2.2 13.3-5.8l-6.2-5.1c-2 1.4-4.5 2.2-7.1 2.2-4.4 0-8.1-2.8-9.4-6.7l-6.7 5.2C9.6 38.7 16.3 43 24 43z" />
          <path fill="#f14336" d="M43.6 20.5H42V20H24v8h11.3c-1.1 2.8-3.2 5.1-6 6.5v5.2C35 36.7 39 31.6 43.6 20.5z" />
        </svg>
        Sign up with Google
      </button>
    </AuthLayout>
  );
};

export default Register;
