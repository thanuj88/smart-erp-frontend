import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { useLayout } from '../contexts/LayoutContext';
import clsx from 'clsx';

const Header = () => {
  const { user, logout } = useAuth();
  const { t, i18n } = useTranslation();
  const { sidebarCollapsed } = useLayout();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setDropdownOpen(false);
  };

  const handleLanguageChange = (event, language) => {
    i18n.changeLanguage(language);
    setDropdownOpen(false);
  };

  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };

  return (
    <header
      className="fixed top-0 right-0 bg-white border-b border-gray-200 px-6 py-1 flex items-center justify-between shadow-sm z-20"
      style={{ left: sidebarCollapsed ? '4rem' : '16rem' }}
    >
      <div className="flex-1">
        <h2 className="text-lg font-semibold text-gray-900" id="page-title">
          {/* Page title will be set by individual pages */}
        </h2>
      </div>

      <div className="flex items-center space-x-3">
        {/* User Dropdown */}
        {user && (
          <div className="relative">
            <button
              onClick={toggleDropdown}
              className="flex items-center gap-2 px-2 py-1 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            >
              <div className="w-7 h-7 bg-primary-600 rounded-full flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                <p className="text-[10px] text-gray-500">{user.role}</p>
              </div>
              <svg
                className={clsx(
                  "w-4 h-4 text-gray-400 transition-transform duration-200",
                  dropdownOpen ? "rotate-180" : ""
                )}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Dropdown Menu */}
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                {/* Language Switcher */}
                <div className="p-4 border-b border-gray-100">
                  <div className="flex items-center gap-2 mb-3">
                    <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                    </svg>
                    <span className="text-sm font-medium text-gray-600">{t('language')}</span>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleLanguageChange(null, 'en')}
                      className={clsx(
                        'flex-1 px-3 py-2 text-sm font-medium rounded-lg border transition-all duration-200',
                        i18n.language === 'en'
                          ? 'bg-primary-600 text-white border-primary-600'
                          : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                      )}
                    >
                      EN
                    </button>
                    <button
                      onClick={() => handleLanguageChange(null, 'si')}
                      className={clsx(
                        'flex-1 px-3 py-2 text-sm font-medium rounded-lg border transition-all duration-200',
                        i18n.language === 'si'
                          ? 'bg-primary-600 text-white border-primary-600'
                          : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                      )}
                    >
                      සිං
                    </button>
                  </div>
                </div>

                {/* Logout Button */}
                <div className="p-2">
                  <button
                    onClick={handleLogout}
                    className="flex items-center w-full px-3 py-2 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-all duration-200"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span>{t('logout')}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
