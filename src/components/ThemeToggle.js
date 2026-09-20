import React from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';

const ThemeToggle = ({ className = 'top-navbar-icon-btn' }) => {
  const { t } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const label = theme === 'dark' ? t('switchToLight') : t('switchToDark');

  return (
    <button
      type="button"
      className={className}
      title={label}
      aria-label={label}
      onClick={toggleTheme}
    >
      <i className={`bi ${theme === 'dark' ? 'bi-sun' : 'bi-moon'}`}></i>
    </button>
  );
};

export default ThemeToggle;
