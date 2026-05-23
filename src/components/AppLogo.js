import React from 'react';
import { APP_NAME, APP_PRODUCT_SUFFIX } from '../config/app';

const AppLogo = ({ className = '', size = 'default' }) => (
  <div className={`auth-logo auth-logo-${size} ${className}`.trim()}>
    <span className="auth-logo-icon" aria-hidden="true">
      <i className="bi bi-bag-check-fill"></i>
    </span>
    <span className="auth-logo-wordmark">
      <span className="auth-logo-name">{APP_NAME}</span>
      {APP_PRODUCT_SUFFIX && (
        <sup className="auth-logo-suffix">{APP_PRODUCT_SUFFIX}</sup>
      )}
    </span>
  </div>
);

export default AppLogo;
