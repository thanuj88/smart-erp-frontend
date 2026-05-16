import React, { createContext, useContext, useState } from 'react';

const LayoutContext = createContext();

export const useLayout = () => {
  const context = useContext(LayoutContext);
  if (!context) {
    throw new Error('useLayout must be used within a LayoutProvider');
  }
  return context;
};

export const LayoutProvider = ({ children }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleSidebar = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 992) {
      setMobileMenuOpen((open) => !open);
      return;
    }
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <LayoutContext.Provider value={{ sidebarCollapsed, mobileMenuOpen, toggleSidebar, closeMobileMenu }}>
      {children}
    </LayoutContext.Provider>
  );
};