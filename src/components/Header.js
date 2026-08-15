import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { useLayout } from '../contexts/LayoutContext';
import clsx from 'clsx';
import { APP_NAME } from '../config/app';
import UserMenu from './UserMenu';

const Header = () => {
  const { getHomePath } = useAuth();
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { sidebarCollapsed, toggleSidebar } = useLayout();
  const isPos = location.pathname === '/sell';
  const [isFullscreen, setIsFullscreen] = useState(Boolean(document.fullscreenElement));

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
    <header className="top-navbar">
      <div className="top-navbar-left">
        <button
          type="button"
          className="top-navbar-icon-btn d-lg-none"
          onClick={toggleSidebar}
          aria-label="Toggle menu"
        >
          <i className="bi bi-list"></i>
        </button>
        <div className={`top-navbar-sidebar-zone d-none d-lg-flex${sidebarCollapsed ? ' is-collapsed' : ''}`}>
          <div
            className="top-navbar-brand"
            onClick={() => navigate(getHomePath())}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && navigate(getHomePath())}
          >
            <span className="top-navbar-logo">
              <i className="bi bi-bag-check-fill"></i>
            </span>
            <span className="top-navbar-brand-text">{APP_NAME}</span>
          </div>
          <button
            type="button"
            className="top-navbar-collapse-btn"
            onClick={toggleSidebar}
            title={sidebarCollapsed ? 'Expand menu' : 'Collapse menu'}
            aria-label={sidebarCollapsed ? 'Expand menu' : 'Collapse menu'}
          >
            <i className="bi bi-list"></i>
          </button>
        </div>
        <div
          className="top-navbar-brand d-lg-none"
          onClick={() => navigate(getHomePath())}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && navigate(getHomePath())}
        >
          <span className="top-navbar-logo">
            <i className="bi bi-bag-check-fill"></i>
          </span>
          <span className="top-navbar-brand-text">{APP_NAME}</span>
        </div>
      </div>

      <div className="top-navbar-right">
        {isPos && (
          <button
            type="button"
            className="top-navbar-icon-btn"
            title={fullscreenLabel}
            aria-label={fullscreenLabel}
            onClick={toggleFullscreen}
          >
            <i className={`bi ${isFullscreen ? 'bi-fullscreen-exit' : 'bi-arrows-fullscreen'}`}></i>
          </button>
        )}
        <div className="lang-toggle d-none d-sm-flex">
          <button
            type="button"
            className={clsx('lang-toggle-btn', i18n.language === 'en' && 'active')}
            onClick={() => i18n.changeLanguage('en')}
          >
            EN
          </button>
          <button
            type="button"
            className={clsx('lang-toggle-btn', i18n.language === 'si' && 'active')}
            onClick={() => i18n.changeLanguage('si')}
          >
            සිං
          </button>
        </div>

        <UserMenu />
      </div>
    </header>
  );
};

export default Header;
