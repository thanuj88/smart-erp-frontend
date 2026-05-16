import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services';

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
    const currentUser = authService.getCurrentUser();
    setUser(currentUser);
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    const data = await authService.login(username, password);
    setUser(data.user);
    return data;
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  // Authorization methods
  const hasFeature = (featureCode) => {
    if (!user || !user.features) return false;
    return user.features.includes(featureCode);
  };

  const hasRole = (roleOrRoles) => {
    if (!user) return false;
    const roles = Array.isArray(roleOrRoles) ? roleOrRoles : [roleOrRoles];
    return roles.includes(user.role);
  };

  const canAccess = (featureCode, requiredRole) => {
    return hasFeature(featureCode) && hasRole(requiredRole);
  };

  const value = {
    user,
    login,
    logout,
    loading,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'ADMIN',
    isTeller: user?.role === 'TELLER',
    isSuperAdmin: user?.role === 'SUPER_ADMIN',
    hasFeature,
    hasRole,
    canAccess
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
