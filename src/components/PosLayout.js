import React from 'react';
import PropTypes from 'prop-types';
import { useLayout } from '../contexts/LayoutContext';
import Header from './Header';
import Sidebar from './Sidebar';

const PosLayout = ({ children }) => {
  const { sidebarCollapsed, mobileMenuOpen, closeMobileMenu } = useLayout();

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
