import { useAuth } from '../contexts/AuthContext';

/**
 * Custom hook for authorization utilities
 * Provides helper functions for checking features and roles
 */
export const useAuthorization = () => {
  const { hasFeature, hasRole, canAccess } = useAuth();

  return {
    hasFeature,
    hasRole,
    canAccess,
    // Convenience methods for common features
    canViewDashboard: () => hasFeature('DASHBOARD_ADMIN') || hasFeature('DASHBOARD_TELLER'),
    canAccessPOS: () => hasFeature('POS_CASH'),
    canManageInventory: () => hasFeature('INVENTORY'),
    canViewSalesReport: () => hasFeature('SALES_REPORT'),
    canManageUsers: () => hasFeature('USERS'),
    canManageInstallments: () => hasFeature('INSTALLMENT_PLANS'),
    canProcessInstallmentPayments: () => hasFeature('INSTALLMENT_PAYMENTS'),
  };
};

export default useAuthorization;
