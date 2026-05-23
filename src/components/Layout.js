import React from 'react';
import PropTypes from 'prop-types';
import Sidebar from './Sidebar';
import Header from './Header';
import { LayoutProvider, useLayout } from '../contexts/LayoutContext';

const LayoutContent = ({ children }) => {
  const { sidebarCollapsed, mobileMenuOpen, closeMobileMenu } = useLayout();

  return (
    <div className="app-shell">
      <Header />
      <div className="app-body">
        {mobileMenuOpen && (
          <button type="button" className="sidebar-backdrop" onClick={closeMobileMenu} aria-label="Close menu" />
        )}
        <Sidebar />
        <div className={`content-wrapper${sidebarCollapsed ? ' sidebar-collapsed' : ''}`}>
          <main className="content">{children}</main>
        </div>
      </div>
    </div>
  );
};

const Layout = ({ children }) => {
  return (
    <LayoutProvider>
      <LayoutContent>{children}</LayoutContent>
    </LayoutProvider>
  );
};

Layout.propTypes = {
  children: PropTypes.node.isRequired,
};

export default Layout;
