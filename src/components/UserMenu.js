import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';

const UserMenu = ({ className = '' }) => {
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  if (!user) return null;

  const displayName = user.fullName || user.username || 'User';
  const initial = displayName[0]?.toUpperCase() || 'U';

  const handleLogout = async () => {
    setDropdownOpen(false);
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className={clsx('user-menu', className)}>
      <button
        type="button"
        className="user-menu-trigger"
        onClick={() => setDropdownOpen(!dropdownOpen)}
        aria-expanded={dropdownOpen}
      >
        <span className="user-avatar">{initial}</span>
        <span className="user-menu-name d-none d-md-inline">{displayName}</span>
        <i className={clsx('bi bi-chevron-down user-menu-caret', dropdownOpen && 'open')} />
      </button>
      {dropdownOpen && (
        <>
          <button
            type="button"
            className="user-menu-backdrop"
            onClick={() => setDropdownOpen(false)}
            aria-label="Close menu"
          />
          <div className="user-dropdown">
            <div className="user-dropdown-header">
              <span className="user-avatar lg">{initial}</span>
              <div>
                <div className="user-dropdown-name">{displayName}</div>
                <div className="user-dropdown-role">{user.role}</div>
              </div>
            </div>
            <button type="button" className="logout-btn" onClick={handleLogout}>
              <i className="bi bi-box-arrow-right" />
              {t('logout') || 'Logout'}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default UserMenu;
