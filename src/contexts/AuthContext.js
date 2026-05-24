import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService, PERMISSIONS } from '../services';
import { resolveHomePath } from '../utils/authRouting';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      const stored = authService.getCurrentUser();
      const bootstrapToken = localStorage.getItem('token');

      if (stored && bootstrapToken) {
        setUser(stored);
        try {
          const profile = await authService.getProfile();
          if (!cancelled) setUser(profile);
        } catch {
          if (!cancelled && localStorage.getItem('token') === bootstrapToken) {
            authService.logout();
            setUser(null);
          }
        }
      }

      if (!cancelled) setLoading(false);
    };

    bootstrap();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = async (username, password) => {
    const data = await authService.login(username, password);
    setUser(data.user);
    return data;
  };

  const loginPin = async (username, pin, tenantId, branchId) => {
    const data = await authService.loginPin(username, pin, tenantId, branchId);
    setUser(data.user);
    return data;
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  const normalizeRole = (role) =>
    typeof role === 'string' ? role.toUpperCase() : role;

  const hasRole = (roleOrRoles) => {
    if (!user) return false;
    const currentRole = normalizeRole(user.role);
    const roles = (Array.isArray(roleOrRoles) ? roleOrRoles : [roleOrRoles]).map(normalizeRole);
    return roles.includes(currentRole);
  };

  const hasPermission = (permission) => {
    if (!user?.permissions) return false;
    const perms = Array.isArray(permission) ? permission : [permission];
    return perms.some((p) => user.permissions.includes(p));
  };

  const isSuperAdmin = hasRole('SUPER_ADMIN');

  const isAdmin =
    !!user &&
    (hasPermission([
      PERMISSIONS.INVENTORY_MANAGE,
      PERMISSIONS.SETTINGS_MANAGE,
      PERMISSIONS.USERS_MANAGE,
      PERMISSIONS.PLATFORM_MANAGE,
    ]) ||
      isSuperAdmin);

  const isTeller =
    !!user &&
    (hasPermission([PERMISSIONS.SALES_CREATE, PERMISSIONS.PLATFORM_MANAGE]) || isAdmin);

  /** Cashier role without admin capabilities — no store dashboard */
  const isTellerOnly = !!user && hasRole('TELLER') && !isAdmin;

  const canViewDashboard = !isTellerOnly;

  const getHomePath = () => resolveHomePath(user);

  const canManagePlatform =
    !!user && hasPermission([PERMISSIONS.ROLES_MANAGE, PERMISSIONS.PLATFORM_MANAGE]);

  const value = {
    user,
    login,
    loginPin,
    logout,
    loading,
    isAuthenticated: !!user,
    isAdmin,
    isTeller,
    isTellerOnly,
    canViewDashboard,
    getHomePath,
    isSuperAdmin,
    canManagePlatform,
    hasRole,
    hasPermission,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
