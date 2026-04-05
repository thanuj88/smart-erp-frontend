import React, { useState } from 'react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { useLayout } from '../contexts/LayoutContext';
import clsx from 'clsx';

const Sidebar = () => {
  const { isAdmin } = useAuth();
  const location = useLocation();
  const { t } = useTranslation();
  const { sidebarCollapsed, toggleSidebar } = useLayout();
  const [inventoryExpanded, setInventoryExpanded] = useState(true);

  const isActive = (path) => location.pathname === path;

  const handleToggleSidebar = () => {
    toggleSidebar();
    if (!sidebarCollapsed) {
      setInventoryExpanded(false);
    }
  };

  return (
    <div
      className={clsx(
        'fixed left-0 top-0 h-full bg-white border-r border-gray-200 flex flex-col sidebar-transition overflow-hidden z-50',
        sidebarCollapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-2 min-h-11 border-b border-gray-200">
        {!sidebarCollapsed && (
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-primary-600 rounded-lg flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
            </div>
            <h6 className="text-lg font-semibold text-gray-900">
              {t('shopInventory')}
            </h6>
          </div>
        )}
        <button
          onClick={handleToggleSidebar}
          className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
          title={sidebarCollapsed ? t('Expand Menu') : t('Collapse Menu')}
        >
          {sidebarCollapsed ? (
            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          ) : (
            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          )}
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 pt-4 space-y-1">
        {/* Dashboard */}
        <RouterLink
          to="/"
          title={sidebarCollapsed ? t('dashboard') : undefined}
          className={clsx(
            'flex items-center px-4 py-3 text-sm font-medium rounded-xl mx-2 transition-all duration-200',
            isActive('/')
              ? 'bg-primary-50 border-l-4 border-primary-600 text-primary-700'
              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
          )}
        >
          <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v2H8V5z" />
          </svg>
          {!sidebarCollapsed && <span>{t('dashboard')}</span>}
        </RouterLink>

        {/* Sell Items */}
        <RouterLink
          to="/sell"
          title={sidebarCollapsed ? t('sellItems') : undefined}
          className={clsx(
            'flex items-center px-4 py-3 text-sm font-medium rounded-xl mx-2 transition-all duration-200',
            isActive('/sell')
              ? 'bg-primary-50 border-l-4 border-primary-600 text-primary-700'
              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
          )}
        >
          <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
          {!sidebarCollapsed && <span>{t('sellItems')}</span>}
        </RouterLink>

        {isAdmin && (
          <>
            {/* Inventory Section */}
            <div className="mx-2">
              <button
                onClick={() => setInventoryExpanded(!inventoryExpanded)}
                title={sidebarCollapsed ? t('inventory') : undefined}
                className={clsx(
                  'flex items-center w-full px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200',
                  'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                )}
              >
                <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                {!sidebarCollapsed && (
                  <>
                    <span className="flex-1 text-left">{t('inventory')}</span>
                    {inventoryExpanded ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    )}
                  </>
                )}
              </button>

              {inventoryExpanded && (
                <div className="ml-8 mt-1 space-y-1">
                  <RouterLink
                    to="/inventory"
                    title={!sidebarCollapsed ? undefined : t('items')}
                    className={clsx(
                      'flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200',
                      isActive('/inventory')
                        ? 'bg-primary-50 text-primary-700'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    )}
                  >
                    {!sidebarCollapsed && (
                      <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    )}
                    <span>{!sidebarCollapsed ? t('items') : '📦'}</span>
                  </RouterLink>
                  <RouterLink
                    to="/categories"
                    title={!sidebarCollapsed ? undefined : t('categories')}
                    className={clsx(
                      'flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200',
                      isActive('/categories')
                        ? 'bg-primary-50 text-primary-700'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    )}
                  >
                    {!sidebarCollapsed && (
                      <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                    )}
                    <span>{!sidebarCollapsed ? t('categories') : '🏷️'}</span>
                  </RouterLink>
                </div>
              )}
            </div>

            {/* Reports */}
            <RouterLink
              to="/sales-report"
              title={sidebarCollapsed ? t('salesReport') : undefined}
              className={clsx(
                'flex items-center px-4 py-3 text-sm font-medium rounded-xl mx-2 transition-all duration-200',
                isActive('/sales-report')
                  ? 'bg-primary-50 border-l-4 border-primary-600 text-primary-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              )}
            >
              <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              {!sidebarCollapsed && <span>{t('salesReport')}</span>}
            </RouterLink>

            {/* Users */}
            <RouterLink
              to="/users"
              title={sidebarCollapsed ? t('users') : undefined}
              className={clsx(
                'flex items-center px-4 py-3 text-sm font-medium rounded-xl mx-2 transition-all duration-200',
                isActive('/users')
                  ? 'bg-primary-50 border-l-4 border-primary-600 text-primary-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              )}
            >
              <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
              {!sidebarCollapsed && <span>{t('users')}</span>}
            </RouterLink>
          </>
        )}

        {/* Installment Plans */}
        <RouterLink
          to="/installment-plans"
          title={sidebarCollapsed ? t('installmentPlans') : undefined}
          className={clsx(
            'flex items-center px-4 py-3 text-sm font-medium rounded-xl mx-2 transition-all duration-200',
            isActive('/installment-plans')
              ? 'bg-primary-50 border-l-4 border-primary-600 text-primary-700'
              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
          )}
        >
          <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
          </svg>
          {!sidebarCollapsed && <span>{t('installmentPlans')}</span>}
        </RouterLink>

        {/* Installment Payments */}
        <RouterLink
          to="/installment-payments"
          title={sidebarCollapsed ? t('installmentPayments') : undefined}
          className={clsx(
            'flex items-center px-4 py-3 text-sm font-medium rounded-xl mx-2 transition-all duration-200',
            isActive('/installment-payments')
              ? 'bg-primary-50 border-l-4 border-primary-600 text-primary-700'
              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
          )}
        >
          <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          {!sidebarCollapsed && <span>{t('installmentPayments')}</span>}
        </RouterLink>
      </nav>

      {/* Footer - User elements moved to Header */}
    </div>
  );
};

export default Sidebar;
