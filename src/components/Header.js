import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLayout } from '../contexts/LayoutContext';
import { useBusinessName } from '../contexts/TenantSettingsContext';
import { usePosSaleGuard } from '../contexts/PosSaleGuardContext';
import { useTranslation } from 'react-i18next';
import ThemeToggle from './ThemeToggle';
import LanguageToggle from './LanguageToggle';
import UserMenu from './UserMenu';

const Header = () => {
  const { t } = useTranslation();
  const { getHomePath } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { sidebarCollapsed, toggleSidebar } = useLayout();
  const businessName = useBusinessName();
  const { requestNavigation } = usePosSaleGuard();
  const isPos = location.pathname === '/sell';

  const goHome = () => {
    const home = getHomePath();
    if (requestNavigation(home)) navigate(home);
  };
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

  const fullscreenLabel = isFullscreen ? t('exitFullScreen') : t('enterFullScreen');

  return (
    <header className="top-navbar">
      <div className="top-navbar-left">
        <button
          type="button"
          className="top-navbar-icon-btn d-lg-none"
          onClick={toggleSidebar}
          aria-label={t('toggleMenu')}
        >
          <i className="bi bi-list"></i>
        </button>
        <div className={`top-navbar-sidebar-zone d-none d-lg-flex${sidebarCollapsed ? ' is-collapsed' : ''}`}>
          <div
            className="top-navbar-brand"
            onClick={goHome}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && goHome()}
          >
            <span className="top-navbar-logo">
              <i className="bi bi-bag-check-fill"></i>
            </span>
            <span className="top-navbar-brand-text" title={businessName}>{businessName}</span>
          </div>
          <button
            type="button"
            className="top-navbar-collapse-btn"
            onClick={toggleSidebar}
            title={sidebarCollapsed ? t('expandMenu') : t('collapseMenu')}
            aria-label={sidebarCollapsed ? t('expandMenu') : t('collapseMenu')}
          >
            <i className="bi bi-list"></i>
          </button>
        </div>
        <div
          className="top-navbar-brand d-lg-none"
          onClick={goHome}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && goHome()}
        >
          <span className="top-navbar-logo">
            <i className="bi bi-bag-check-fill"></i>
          </span>
            <span className="top-navbar-brand-text" title={businessName}>{businessName}</span>
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
        <ThemeToggle />
        <LanguageToggle />

        <UserMenu />
      </div>
    </header>
  );
};

export default Header;
