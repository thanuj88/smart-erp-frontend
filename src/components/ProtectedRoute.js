import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children, requireAdmin = false, requirePermission = null }) => {
  const { user, loading, hasPermission, isAdmin, isSuperAdmin, getHomePath } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const storePaths = ['/', '/sell', '/inventory', '/categories', '/sales-report', '/users', '/settings', '/installment-plans', '/installment-payments'];
  if (isSuperAdmin && storePaths.includes(location.pathname) && !requirePermission) {
    return <Navigate to="/platform" replace />;
  }

  if (requirePermission) {
    const perms = Array.isArray(requirePermission) ? requirePermission : [requirePermission];
    if (!perms.some((p) => hasPermission(p))) {
      return <Navigate to={isSuperAdmin ? '/platform' : getHomePath()} replace />;
    }
  } else if (requireAdmin && !isAdmin) {
    return <Navigate to={getHomePath()} replace />;
  }

  return children;
};

export default ProtectedRoute;
