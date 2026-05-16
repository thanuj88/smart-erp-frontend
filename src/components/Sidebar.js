import React from 'react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLayout } from '../contexts/LayoutContext';
import { useTranslation } from 'react-i18next';

const Sidebar = () => {
  const { isAdmin } = useAuth();
  const location = useLocation();
  const { t } = useTranslation();
  const { sidebarCollapsed, mobileMenuOpen, toggleSidebar, closeMobileMenu } = useLayout();

  const isActive = (path) => location.pathname === path;

  const NavItem = ({ to, icon, label }) => (
    <RouterLink
      to={to}
      className={`nav-link ${isActive(to) ? 'active' : ''}`}
      title={label}
      aria-label={label}
      onClick={closeMobileMenu}
    >
      <i className={`bi ${icon}`}></i>
      <span>{label}</span>
    </RouterLink>
  );

  return (
    <aside className={`sidebar${sidebarCollapsed ? ' collapsed' : ''}${mobileMenuOpen ? ' mobile-open' : ''}`}>
      <div className="sidebar-top">
        <button
          type="button"
          className="sidebar-collapse-btn"
          onClick={toggleSidebar}
          title={sidebarCollapsed ? 'Expand menu' : 'Collapse menu'}
          aria-label={sidebarCollapsed ? 'Expand menu' : 'Collapse menu'}
        >
          <i className={`bi ${sidebarCollapsed ? 'bi-chevron-right' : 'bi-chevron-left'}`}></i>
        </button>
      </div>

      <nav className="sidebar-nav">
        <div className="sidebar-section-label">{t('main') || 'Main'}</div>
        <NavItem to="/" icon="bi-grid" label={t('dashboard')} />
        <NavItem to="/sell" icon="bi-display" label={t('POS Register') || 'POS'} />

        {isAdmin && (
          <>
            <div className="sidebar-section-label">{t('inventory') || 'Inventory'}</div>
            <NavItem to="/inventory" icon="bi-box-seam" label={t('items') || t('inventory')} />
            <NavItem to="/categories" icon="bi-tags" label={t('categories')} />
            <NavItem to="/sales-report" icon="bi-graph-up" label={t('salesReport')} />
            <NavItem to="/users" icon="bi-people" label={t('users')} />
            <NavItem to="/settings" icon="bi-gear" label={t('settings')} />
          </>
        )}

        <div className="sidebar-section-label">{t('installments') || 'Installments'}</div>
        <NavItem to="/installment-plans" icon="bi-calendar-event" label={t('installmentPlans')} />
        <NavItem to="/installment-payments" icon="bi-credit-card" label={t('installmentPayments')} />
      </nav>
    </aside>
  );
};

export default Sidebar;
