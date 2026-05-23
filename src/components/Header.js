import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { useLayout } from '../contexts/LayoutContext';
import clsx from 'clsx';
import { APP_NAME } from '../config/app';
import UserMenu from './UserMenu';

const Header = () => {
  const { isAdmin, isSuperAdmin, getHomePath } = useAuth();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { toggleSidebar } = useLayout();

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
        <div className="top-navbar-search d-none d-md-flex">
          <i className="bi bi-search"></i>
          <input type="search" placeholder={t('search') || 'Search'} aria-label="Search" />
          <kbd className="d-none d-xl-inline">⌘ K</kbd>
        </div>
      </div>

      <div className="top-navbar-right">
        {!isSuperAdmin && isAdmin && (
          <button type="button" className="btn btn-dreams-primary btn-sm" onClick={() => navigate('/inventory')}>
            <i className="bi bi-plus-lg me-1"></i>
            {t('addNew') || 'Add New'}
          </button>
        )}
        {!isSuperAdmin && (
          <button type="button" className="btn btn-dreams-navy btn-sm" onClick={() => navigate('/sell')}>
            <i className="bi bi-display me-1"></i>
            {t('POS Register') || 'POS'}
          </button>
        )}

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

        <UserMenu />
      </div>
    </header>
  );
};

export default Header;
