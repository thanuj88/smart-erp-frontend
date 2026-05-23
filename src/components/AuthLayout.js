import React from 'react';
import { Link } from 'react-router-dom';
import AppLogo from './AppLogo';
import { getCopyrightText } from '../config/app';

const AuthLayout = ({ children, footerExtra }) => (
  <div className="auth-page">
    <div className="auth-page-backdrop" aria-hidden="true">
      <div
        className="auth-page-backdrop-media"
        style={{
          backgroundImage: `url(${process.env.PUBLIC_URL}/images/login-bg.png)`,
        }}
      />
      <div className="auth-page-backdrop-overlay" />
    </div>
    <div className="auth-page-inner">
      <div className="auth-card">
        <div className="auth-card-header">
          <AppLogo />
        </div>
        {children}
      </div>
      {footerExtra}
      <p className="auth-copyright">{getCopyrightText()}</p>
    </div>
  </div>
);

export const AuthFooterLink = ({ children, to }) => (
  <p className="auth-switch-link text-center mb-0">
    {children}{' '}
    <Link to={to} className="auth-link-accent">
      {to === '/register' ? 'Create an account' : 'Sign In'}
    </Link>
  </p>
);

export default AuthLayout;

