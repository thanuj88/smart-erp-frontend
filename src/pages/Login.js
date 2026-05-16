import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isLargeScreen, setIsLargeScreen] = useState(window.innerWidth >= 1024);
  const { login } = useAuth();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  useEffect(() => {
    const handleResize = () => {
      setIsLargeScreen(window.innerWidth >= 1024);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(username, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLanguageChange = (event, newLanguage) => {
    if (newLanguage !== null) {
      i18n.changeLanguage(newLanguage);
    }
  };

  const handleGoogleSignIn = () => {
    alert('Google sign-in is not configured in this demo.');
  };

  const handleForgotPassword = () => {
    alert('Forgot password flow is not configured yet.');
  };

  const handleRegister = () => {
    alert('Register option is available when account signup is enabled.');
  };

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        background: 'var(--bg-page)',
      }}
    >
      <div
        style={{
          display: isLargeScreen ? 'flex' : 'none',
          width: '45%',
          background: 'var(--accent-deep)',
          padding: '3rem',
          flexDirection: 'column',
          justifyContent: 'center',
          color: 'white',
        }}
      >
        <div style={{ maxWidth: '28rem' }}>
          <p
            style={{
              textTransform: 'uppercase',
              letterSpacing: '0.2em',
              fontWeight: 700,
              opacity: 0.8,
              marginBottom: '1rem',
            }}
          >
            Welcome back!
          </p>
          <h1 style={{ fontSize: '2.75rem', lineHeight: 1.05, fontWeight: 800, marginBottom: '1rem' }}>
            Sign in to your account.
          </h1>
          <p style={{ fontSize: '1.05rem', lineHeight: 1.8, opacity: 0.9 }}>
            Access your inventory dashboard to manage sales, customers, and stock with a clean, modern interface.
          </p>
        </div>
      </div>

      <div
        style={{
          width: isLargeScreen ? '55%' : '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: '34rem',
            background: 'var(--bg-surface)',
            borderRadius: '1.5rem',
            boxShadow: 'none',
            padding: '2.5rem',
            position: 'relative',
          }}
        >
          <div style={{ position: 'absolute', top: '1.5rem', right: '1.5rem' }}>
            <div className="flex border border-gray-300 rounded-lg overflow-hidden">
              <button
                onClick={() => handleLanguageChange(null, 'en')}
                className={clsx(
                  'px-4 py-2 text-sm font-medium transition-all duration-200',
                  i18n.language === 'en'
                    ? 'bg-primary-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                )}
              >
                EN
              </button>
              <button
                onClick={() => handleLanguageChange(null, 'si')}
                className={clsx(
                  'px-4 py-2 text-sm font-medium transition-all duration-200',
                  i18n.language === 'si'
                    ? 'bg-primary-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                )}
              >
                සිං
              </button>
            </div>
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <div style={{ marginBottom: '0.75rem' }}>
              <h2 style={{ fontSize: '2rem', margin: 0, fontWeight: 800, color: '#0f172a' }}>
                Sign In
              </h2>
            </div>
            <p style={{ color: '#475569', fontSize: '0.95rem', lineHeight: 1.75 }}>
              Sign in using your existing account or continue with Google for a faster login.
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={handleGoogleSignIn}
            className="btn btn-outline"
            style={{
              width: '100%',
              justifyContent: 'center',
              gap: '0.75rem',
              padding: '0.95rem 1rem',
              borderRadius: '1rem',
              borderColor: '#d1d5db',
              color: '#111827',
              marginBottom: '1.25rem',
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="20" height="20">
              <path fill="#fbbc05" d="M43.6 20.5H42V20H24v8h11.3c-1.3 3.5-4.9 6-9.3 6-5.5 0-10-4.5-10-10s4.5-10 10-10c2.6 0 5 1 6.8 2.6l5.7-5.7C34.4 7.5 29.5 5 24 5 12.8 5 4 13.8 4 25s8.8 20 20 20 20-8.8 20-20c0-1.3-.1-2.5-.4-3.5z" />
              <path fill="#518ef8" d="M6.3 14.7l6.6 4.8C14.8 16 19 13 24 13c2.6 0 5 1 6.8 2.6l5.7-5.7C34.4 7.5 29.5 5 24 5 16.4 5 9.5 9.6 6.3 14.7z" />
              <path fill="#28b446" d="M24 43c5.4 0 10-2.2 13.3-5.8l-6.2-5.1c-2 1.4-4.5 2.2-7.1 2.2-4.4 0-8.1-2.8-9.4-6.7l-6.7 5.2C9.6 38.7 16.3 43 24 43z" />
              <path fill="#f14336" d="M43.6 20.5H42V20H24v8h11.3c-1.1 2.8-3.2 5.1-6 6.5v5.2C35 36.7 39 31.6 43.6 20.5z" />
            </svg>
            Sign in with Google
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }} />
            <span style={{ fontSize: '0.8rem', color: '#6b7280', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
              or continue with
            </span>
            <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }} />
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700" style={{ marginBottom: '0.5rem' }}>
                {t('username')}
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="form-control"
                placeholder={t('enterUsername')}
                required
                autoFocus
                autoComplete="username"
                disabled={loading}
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  {t('password')}
                </label>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-sm font-medium"
                  style={{ color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                >
                  {t('forgotPassword')}
                </button>
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="form-control"
                  style={{ paddingRight: '3rem' }}
                  placeholder={t('enterPassword')}
                  required
                  autoComplete="current-password"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  disabled={loading}
                  style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  {showPassword ? (
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem', color: '#475569' }}>
                <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} style={{ width: '1rem', height: '1rem', accentColor: '#2563eb' }} />Remember me
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ width: '100%', padding: '0.95rem 1rem', borderRadius: '1rem', fontSize: '0.95rem', fontWeight: 700 }}
            >
              {loading ? t('signingIn') : t('signIn')}
            </button>
          </form>

          <div style={{ marginTop: '1.75rem', textAlign: 'center' }}>
            <p style={{ color: '#64748b', fontSize: '0.95rem' }}>
              Don't have an account? <button type="button" onClick={handleRegister} className="font-semibold" style={{ color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                Register
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
