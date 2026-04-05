import React from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { LayoutProvider, useLayout } from '../contexts/LayoutContext';
import clsx from 'clsx';

const LayoutContent = ({ children }) => {
  const { sidebarCollapsed } = useLayout();

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className={clsx(
        'flex-1 flex flex-col overflow-hidden transition-all duration-300',
        sidebarCollapsed ? 'ml-16' : 'ml-64'
      )}>
        <Header />
        <main className="flex-1 overflow-auto p-6 pt-12">
          {children}
        </main>
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

export default Layout;
