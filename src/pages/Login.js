import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import AuthLayout, { AuthFooterLink } from '../components/AuthLayout';
import { APP_CONFIG } from '../config/app';
import useAuthBodyClass from '../hooks/useAuthBodyClass';
import { resolveHomePath } from '../utils/authRouting';

const Login = () => {
  useAuthBodyClass('login');

  const [mode, setMode] = useState('password');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [pin, setPin] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, loginPin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const registered = location.state?.registered;
  const verified = location.state?.verified;

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
      navigate(getHomePath());
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePinSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await loginPin(username, pin);
      navigate(resolveHomePath(data.user), { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || 'PIN login failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    setError('Google sign-in is not configured yet.');
  };

  return (
    <AuthLayout variant="login">
      <div className="auth-lang-toggle">
        <button
          type="button"
          className={`auth-lang-btn ${i18n.language === 'en' ? 'active' : ''}`}
          onClick={() => i18n.changeLanguage('en')}
        >
          EN
        </button>
        <button
          type="button"
          className={`auth-lang-btn ${i18n.language === 'si' ? 'active' : ''}`}
          onClick={() => i18n.changeLanguage('si')}
        >
          සිං
        </button>
      </div>

      <div className="auth-login-body">
      <div className="auth-login-main">
      <h1 className="auth-title">Sign In</h1>
      <p className="auth-subtitle">{APP_CONFIG.loginPanelDescription(APP_CONFIG.name)}</p>

      <div className="auth-mode-tabs auth-login-tabs">
        <button
          type="button"
          className={`auth-mode-tab ${mode === 'password' ? 'active' : ''}`}
          onClick={() => setMode('password')}
        >
          Email / Password
        </button>
        <button
          type="button"
          className={`auth-mode-tab ${mode === 'pin' ? 'active' : ''}`}
          onClick={() => setMode('pin')}
        >
          Teller PIN
        </button>
      </div>

      {registered && (
        <div className="alert alert-success auth-alert" role="alert">
          <i className="bi bi-check-circle me-2"></i>
          Account created. Sign in after verifying your email.
        </div>
      )}

      {verified && (
        <div className="alert alert-success auth-alert" role="alert">
          <i className="bi bi-check-circle me-2"></i>
          Email verified. You can sign in now.
        </div>
      )}

      {error && (
        <div className="alert alert-danger auth-alert" role="alert">
          <i className="bi bi-exclamation-circle me-2"></i>
          {error}
        </div>
      )}

      {mode === 'password' ? (
        <form onSubmit={handlePasswordSubmit} className="auth-form">
          <div className="mb-3">
            <label htmlFor="username" className="form-label auth-label">
              Username or email <span className="text-danger">*</span>
            </label>
            <div className="auth-input-wrap">
              <input
                id="username"
                type="text"
                className="form-control auth-input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={t('enterUsername')}
                required
                autoFocus
                autoComplete="username"
                disabled={loading}
              />
              <i className="bi bi-envelope auth-input-icon"></i>
            </div>
          </div>

          <div className="mb-3">
            <label htmlFor="password" className="form-label auth-label">
              {t('password')} <span className="text-danger">*</span>
            </label>
            <div className="auth-input-wrap">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                className="form-control auth-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('enterPassword')}
                required
                autoComplete="current-password"
                disabled={loading}
              />
              <button
                type="button"
                className="auth-input-icon-btn"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
              </button>
            </div>
          </div>

          <div className="d-flex align-items-center justify-content-between auth-login-options">
            <label className="auth-remember">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              Remember me
            </label>
            <Link to="/forgot-password" className="auth-link-accent small">
              {t('forgotPassword')}
            </Link>
          </div>

          <button type="submit" className="btn auth-btn-primary w-100" disabled={loading}>
            {loading ? t('signingIn') : t('signIn')}
          </button>
        </form>
      ) : (
        <form onSubmit={handlePinSubmit} className="auth-form">
          <div className="mb-3">
            <label htmlFor="pinUsername" className="form-label auth-label">
              Teller username <span className="text-danger">*</span>
            </label>
            <input
              id="pinUsername"
              type="text"
              className="form-control auth-input auth-input-pin"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoFocus
              disabled={loading}
            />
          </div>
          <div className="mb-3">
            <label htmlFor="pin" className="form-label auth-label">
              PIN <span className="text-danger">*</span>
            </label>
            <input
              id="pin"
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={8}
              className="form-control auth-input auth-input-pin text-center fs-4"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
              required
              disabled={loading}
            />
          </div>
          <button type="submit" className="btn auth-btn-primary w-100" disabled={loading}>
            {loading ? 'Signing in...' : 'Quick sign in'}
          </button>
        </form>
      )}

      </div>

      <div className="auth-login-footer">
        <AuthFooterLink to="/register">New on our platform?</AuthFooterLink>

        <div className="auth-divider">
          <span>OR</span>
        </div>

        <button type="button" className="btn auth-btn-google w-100" onClick={handleGoogleSignIn}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="22" height="22" aria-hidden="true">
            <path fill="#fbbc05" d="M43.6 20.5H42V20H24v8h11.3c-1.3 3.5-4.9 6-9.3 6-5.5 0-10-4.5-10-10s4.5-10 10-10c2.6 0 5 1 6.8 2.6l5.7-5.7C34.4 7.5 29.5 5 24 5 12.8 5 4 13.8 4 25s8.8 20 20 20 20-8.8 20-20c0-1.3-.1-2.5-.4-3.5z" />
            <path fill="#518ef8" d="M6.3 14.7l6.6 4.8C14.8 16 19 13 24 13c2.6 0 5 1 6.8 2.6l5.7-5.7C34.4 7.5 29.5 5 24 5 16.4 5 9.5 9.6 6.3 14.7z" />
            <path fill="#28b446" d="M24 43c5.4 0 10-2.2 13.3-5.8l-6.2-5.1c-2 1.4-4.5 2.2-7.1 2.2-4.4 0-8.1-2.8-9.4-6.7l-6.7 5.2C9.6 38.7 16.3 43 24 43z" />
            <path fill="#f14336" d="M43.6 20.5H42V20H24v8h11.3c-1.1 2.8-3.2 5.1-6 6.5v5.2C35 36.7 39 31.6 43.6 20.5z" />
          </svg>
          Sign in with Google
        </button>
      </div>
      </div>
    </AuthLayout>
  );
};

export default Login;
