import React from 'react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLayout } from '../contexts/LayoutContext';
import { useTranslation } from 'react-i18next';
import { PERMISSIONS } from '../services';

const Sidebar = () => {
  const { hasPermission, isSuperAdmin, canManagePlatform, isTeller, canViewDashboard } = useAuth();
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

  const showInventory =
    hasPermission(PERMISSIONS.INVENTORY_MANAGE) ||
    hasPermission(PERMISSIONS.INVENTORY_VIEW);
  const showReports = hasPermission(PERMISSIONS.REPORTS_VIEW);
  const showUsers =
    hasPermission(PERMISSIONS.USERS_MANAGE) || hasPermission(PERMISSIONS.USERS_VIEW);
  const showSettings = hasPermission(PERMISSIONS.SETTINGS_MANAGE);
  const showPos =
    hasPermission(PERMISSIONS.SALES_CREATE) || isTeller;

  if (isSuperAdmin) {
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
          <div className="sidebar-section-label">Platform</div>
          {canManagePlatform && (
            <NavItem to="/platform/roles" icon="bi-shield-lock" label="Roles & Capabilities" />
          )}
        </nav>
      </aside>
    );
  }

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
        {canViewDashboard && <NavItem to="/" icon="bi-grid" label={t('dashboard')} />}
        {showPos && <NavItem to="/sell" icon="bi-display" label={t('POS Register') || 'POS'} />}

        {(showInventory || showReports || showUsers || showSettings) && (
          <>
            <div className="sidebar-section-label">{t('inventory') || 'Inventory'}</div>
            {showInventory && (
              <>
                <NavItem to="/inventory" icon="bi-box-seam" label={t('items') || t('inventory')} />
                {hasPermission(PERMISSIONS.INVENTORY_MANAGE) && (
                  <NavItem to="/categories" icon="bi-tags" label={t('categories')} />
                )}
              </>
            )}
            {showReports && (
              <NavItem to="/sales-report" icon="bi-graph-up" label={t('salesReport')} />
            )}
            {showUsers && <NavItem to="/users" icon="bi-people" label={t('users')} />}
            {showSettings && <NavItem to="/settings" icon="bi-gear" label={t('settings')} />}
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
