import React from 'react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLayout } from '../contexts/LayoutContext';
import { useTranslation } from 'react-i18next';
import { PERMISSIONS } from '../services';

const Sidebar = () => {
  const { hasPermission, isSuperAdmin, canManagePlatform, isTeller, canViewDashboard, isAdmin } = useAuth();
  const location = useLocation();
  const { t } = useTranslation();
  const { sidebarCollapsed, mobileMenuOpen, closeMobileMenu } = useLayout();

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
  const showCategories = hasPermission(PERMISSIONS.INVENTORY_MANAGE);
  const showReports = hasPermission(PERMISSIONS.REPORTS_VIEW);
  const showUsers =
    hasPermission(PERMISSIONS.USERS_MANAGE) || hasPermission(PERMISSIONS.USERS_VIEW);
  const showSettings = hasPermission(PERMISSIONS.SETTINGS_MANAGE);
  const showPos = hasPermission(PERMISSIONS.SALES_CREATE) || isTeller;

  const SidebarSection = ({ title, children }) => {
    const items = React.Children.toArray(children).filter(Boolean);
    if (items.length === 0) return null;
    return (
      <>
        <div className="sidebar-section-label">{title}</div>
        {items}
      </>
    );
  };

  if (isSuperAdmin) {
    return (
      <aside className={`sidebar${sidebarCollapsed ? ' collapsed' : ''}${mobileMenuOpen ? ' mobile-open' : ''}`}>
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
      <nav className="sidebar-nav">
        <SidebarSection title={t('sidebarPrimary') || 'Primary'}>
          {canViewDashboard && <NavItem to="/" icon="bi-grid" label={t('dashboard')} />}
          {showPos && <NavItem to="/sell" icon="bi-display" label={t('POS Register') || 'POS Register'} />}
        </SidebarSection>

        <SidebarSection title={t('sidebarCatalog') || 'Catalog'}>
          {showInventory && (
            <NavItem to="/inventory" icon="bi-box-seam" label={t('items') || 'Items'} />
          )}
          {showCategories && (
            <NavItem to="/categories" icon="bi-tags" label={t('categories')} />
          )}
          {showCategories && (
            <NavItem to="/promotions" icon="bi-megaphone" label={t('promotions')} />
          )}
        </SidebarSection>

        <SidebarSection title={t('sidebarReporting') || 'Reporting'}>
          {showReports && (
            <NavItem to="/sales-report" icon="bi-graph-up" label={t('salesReport')} />
          )}
        </SidebarSection>

        <SidebarSection title={t('sidebarInstallments') || 'Installments'}>
          <NavItem to="/installment-payments" icon="bi-credit-card" label={t('installmentPayments')} />
          {isAdmin && (
            <NavItem to="/installment-plans" icon="bi-percent" label={t('interestRateSettings')} />
          )}
        </SidebarSection>

        <SidebarSection title={t('sidebarAdministration') || 'Administration'}>
          {showUsers && <NavItem to="/users" icon="bi-people" label={t('users')} />}
          {showSettings && <NavItem to="/settings" icon="bi-gear" label={t('settings')} />}
        </SidebarSection>
      </nav>
    </aside>
  );
};

export default Sidebar;
