import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { useLayout } from '../contexts/LayoutContext';
import clsx from 'clsx';

const Header = () => {
  const { user, logout, isAdmin } = useAuth();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { toggleSidebar } = useLayout();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setDropdownOpen(false);
    navigate('/login');
  };

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
        <div
          className="top-navbar-brand"
          onClick={() => navigate('/')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && navigate('/')}
        >
          <span className="top-navbar-logo">
            <i className="bi bi-bag-check-fill"></i>
          </span>
          <span className="top-navbar-brand-text">Bright Mart</span>
        </div>
        <div className="top-navbar-search d-none d-md-flex">
          <i className="bi bi-search"></i>
          <input type="search" placeholder={t('search') || 'Search'} aria-label="Search" />
          <kbd className="d-none d-xl-inline">⌘ K</kbd>
        </div>
      </div>

      <div className="top-navbar-right">
        {isAdmin && (
          <button type="button" className="btn btn-dreams-primary btn-sm" onClick={() => navigate('/inventory')}>
            <i className="bi bi-plus-lg me-1"></i>
            {t('addNew') || 'Add New'}
          </button>
        )}
        <button type="button" className="btn btn-dreams-navy btn-sm" onClick={() => navigate('/sell')}>
          <i className="bi bi-display me-1"></i>
          {t('POS Register') || 'POS'}
        </button>

        <div className="top-navbar-divider d-none d-sm-block" />

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

        {user && (
          <div className="user-menu">
            <button
              type="button"
              className="user-menu-trigger"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              aria-expanded={dropdownOpen}
            >
              <span className="user-avatar">{user.name?.[0]?.toUpperCase() || 'A'}</span>
              <span className="user-menu-name d-none d-md-inline">{user.name}</span>
              <i className={clsx('bi bi-chevron-down user-menu-caret', dropdownOpen && 'open')}></i>
            </button>
            {dropdownOpen && (
              <>
                <button type="button" className="user-menu-backdrop" onClick={() => setDropdownOpen(false)} aria-label="Close menu" />
                <div className="user-dropdown">
                  <div className="user-dropdown-header">
                    <span className="user-avatar lg">{user.name?.[0]?.toUpperCase() || 'A'}</span>
                    <div>
                      <div className="user-dropdown-name">{user.name}</div>
                      <div className="user-dropdown-role">{user.role}</div>
                    </div>
                  </div>
                  <button type="button" className="logout-btn" onClick={handleLogout}>
                    <i className="bi bi-box-arrow-right"></i>
                    {t('logout') || 'Logout'}
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
