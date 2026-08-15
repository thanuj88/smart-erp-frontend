import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLayout } from '../contexts/LayoutContext';
import Header from './Header';
import Sidebar from './Sidebar';

const formatTimer = (seconds) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [h, m, s].map((v) => String(v).padStart(2, '0')).join(':');
};

const PosLayout = ({ children }) => {
  const navigate = useNavigate();
  const { canViewDashboard, getHomePath } = useAuth();
  const { sidebarCollapsed, mobileMenuOpen, closeMobileMenu } = useLayout();
  const [elapsed, setElapsed] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const started = Date.now();
    const timer = setInterval(() => {
      setElapsed(Math.floor((Date.now() - started) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen?.();
      return;
    }
    document.documentElement.requestFullscreen?.();
  };

  const fullscreenLabel = isFullscreen ? 'Exit full screen' : 'Enter full screen';

  return (
    <div className="app-shell pos-app-shell">
      <Header />
      <div className="app-body">
        {mobileMenuOpen && (
          <button
            type="button"
            className="sidebar-backdrop"
            onClick={closeMobileMenu}
            aria-label="Close menu"
          />
        )}
        <Sidebar />
        <div className={`content-wrapper pos-content-wrapper${sidebarCollapsed ? ' sidebar-collapsed' : ''}`}>
          <div className="pos-shell">
            <header className="pos-topbar">
              <div className="pos-topbar-left">
                <span className="pos-timer">
                  <i className="bi bi-clock"></i>
                  {formatTimer(elapsed)}
                </span>
              </div>
              <div className="pos-topbar-right">
                <button
                  type="button"
                  className="pos-icon-btn"
                  title={fullscreenLabel}
                  aria-label={fullscreenLabel}
                  onClick={toggleFullscreen}
                >
                  <i className={`bi ${isFullscreen ? 'bi-fullscreen-exit' : 'bi-arrows-fullscreen'}`}></i>
                </button>
                {canViewDashboard && (
                  <button type="button" className="pos-btn pos-btn-dashboard" onClick={() => navigate(getHomePath())}>
                    <i className="bi bi-grid-1x2-fill"></i>
                    Dashboard
                  </button>
                )}
              </div>
            </header>
            <main className="pos-content">{children}</main>
          </div>
        </div>
      </div>
    </div>
  );
};

PosLayout.propTypes = {
  children: PropTypes.node.isRequired,
};

export default PosLayout;
