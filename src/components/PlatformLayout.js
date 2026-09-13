import React from 'react';
import PropTypes from 'prop-types';
import { Link, useLocation } from 'react-router-dom';
import Header from './Header';
import { useLayout } from '../contexts/LayoutContext';

const NAV = [
  { to: '/platform', icon: 'bi-speedometer2', label: 'Dashboard', exact: true },
  { to: '/platform/tenants', icon: 'bi-building', label: 'Tenants' },
  { to: '/platform/roles', icon: 'bi-shield-lock', label: 'Roles' },
  { to: '/platform/capabilities', icon: 'bi-key', label: 'Capabilities' },
  { to: '/platform/users', icon: 'bi-people', label: 'Users' },
  { to: '/platform/plans', icon: 'bi-card-list', label: 'Plans' },
  { to: '/platform/reports', icon: 'bi-bar-chart', label: 'Reports' },
];

const PlatformLayout = ({ children }) => {
  const location = useLocation();
  const { sidebarCollapsed, mobileMenuOpen, closeMobileMenu } = useLayout();

  const isActive = (to, exact) =>
    exact ? location.pathname === to : location.pathname.startsWith(to);

  return (
    <div className="app-shell platform-shell">
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
        <aside
          className={`sidebar platform-sidebar${sidebarCollapsed ? ' collapsed' : ''}${
            mobileMenuOpen ? ' mobile-open' : ''
          }`}
        >
          <div className="sidebar-section-label">PosBright Platform</div>
          <nav className="sidebar-nav">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={`nav-link ${isActive(item.to, item.exact) ? 'active' : ''}`}
                title={item.label}
                aria-label={item.label}
                onClick={closeMobileMenu}
              >
                <i className={`bi ${item.icon}`} />
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>
        </aside>
        <div className={`content-wrapper${sidebarCollapsed ? ' sidebar-collapsed' : ''}`}>
          <main className="content">{children}</main>
        </div>
      </div>
    </div>
  );
};

PlatformLayout.propTypes = {
  children: PropTypes.node.isRequired,
};

export default PlatformLayout;
