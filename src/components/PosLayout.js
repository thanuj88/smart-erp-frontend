import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { APP_NAME, APP_PRODUCT_SUFFIX } from '../config/app';
import UserMenu from './UserMenu';

const formatTimer = (seconds) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [h, m, s].map((v) => String(v).padStart(2, '0')).join(':');
};

const PosLayout = ({ children }) => {
  const navigate = useNavigate();
  const { canViewDashboard, getHomePath } = useAuth();
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const started = Date.now();
    const timer = setInterval(() => {
      setElapsed(Math.floor((Date.now() - started) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="pos-shell">
      <header className="pos-topbar">
        <div className="pos-topbar-left">
          <div
            className="pos-logo"
            onClick={() => navigate(getHomePath())}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && navigate(getHomePath())}
          >
            <span className="pos-logo-icon"><i className="bi bi-bag-check-fill"></i></span>
            <span className="pos-logo-text">
              {APP_NAME} {APP_PRODUCT_SUFFIX && <small>{APP_PRODUCT_SUFFIX}</small>}
            </span>
          </div>
          <span className="pos-timer">
            <i className="bi bi-clock"></i>
            {formatTimer(elapsed)}
          </span>
        </div>

        <div className="pos-topbar-right">
          <button
            type="button"
            className="pos-icon-btn"
            title="Fullscreen"
            onClick={() => document.documentElement.requestFullscreen?.()}
          >
            <i className="bi bi-arrows-fullscreen"></i>
          </button>
          {canViewDashboard && (
            <button type="button" className="pos-btn pos-btn-dashboard" onClick={() => navigate('/')}>
              <i className="bi bi-grid-1x2-fill"></i>
              Dashboard
            </button>
          )}
          <UserMenu />
        </div>
      </header>
      <main className="pos-content">{children}</main>
    </div>
  );
};

PosLayout.propTypes = {
  children: PropTypes.node.isRequired,
};

export default PosLayout;
