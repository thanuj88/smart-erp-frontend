import React from 'react';
import { Link } from 'react-router-dom';
import AppLogo from './AppLogo';
import { getCopyrightText } from '../config/app';

const authVariantClass = (variant, prefix) => (variant ? ` ${prefix}--${variant}` : '');

const loginBgUrl = `${process.env.PUBLIC_URL}/images/login-bg.png`;

const AuthLayout = ({ children, footerExtra, variant }) => {
  if (variant === 'login') {
    return (
      <div className="auth-page auth-page--login">
        <div className="auth-login-backdrop" aria-hidden="true">
          <div
            className="auth-login-backdrop-media"
            style={{ backgroundImage: `url(${loginBgUrl})` }}
          />
          <div className="auth-login-backdrop-overlay" />
        </div>
        <div className="auth-login-shell">
          <div className="auth-login-showcase-copy">
            <p className="auth-login-showcase-kicker">Bright Mart POS</p>
            <h2>Fast checkout. Clear inventory. Better daily sales.</h2>
            <p>
              Manage products, billing, and reports in one place with a smooth retail
              workflow.
            </p>
          </div>
          <div className="auth-login-column">
            <div className="auth-login-panel-inner">
              <div className="auth-card auth-card--login">
                <div className="auth-card-header">
                  <AppLogo />
                </div>
                {children}
              </div>
              {footerExtra}
            </div>
            <p className="auth-copyright">{getCopyrightText()}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`auth-page${authVariantClass(variant, 'auth-page')}`}>
      <div className="auth-page-backdrop" aria-hidden="true">
        <div
          className="auth-page-backdrop-media"
          style={{ backgroundImage: `url(${loginBgUrl})` }}
        />
        <div className="auth-page-backdrop-overlay" />
      </div>
      <div className={`auth-page-inner${authVariantClass(variant, 'auth-page-inner')}`}>
        <div className={`auth-card${authVariantClass(variant, 'auth-card')}`}>
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
};

export const AuthFooterLink = ({ children, to }) => (
  <p className="auth-switch-link text-center mb-0">
    {children}{' '}
    <Link to={to} className="auth-link-accent">
      {to === '/register' ? 'Create an account' : 'Sign In'}
    </Link>
  </p>
);

export default AuthLayout;

