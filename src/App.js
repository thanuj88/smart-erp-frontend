import React from 'react';

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import { AuthProvider, useAuth } from './contexts/AuthContext';

import ProtectedRoute from './components/ProtectedRoute';

import Layout from './components/Layout';

import PlatformLayout from './components/PlatformLayout';

import PosLayout from './components/PosLayout';

import Login from './pages/Login';

import ForgotPassword from './pages/ForgotPassword';

import Register from './pages/Register';

import ResetPassword from './pages/ResetPassword';

import VerifyEmail from './pages/VerifyEmail';

import { getPageTitle } from './config/app';

import Dashboard from './pages/Dashboard';

import Inventory from './pages/Inventory';

import Categories from './pages/Categories';

import SellItems from './pages/SellItems';

import SalesReport from './pages/SalesReport';

import Users from './pages/Users';

import InstallmentPlans from './pages/InstallmentPlans';

import InstallmentPayments from './pages/InstallmentPayments';

import Settings from './pages/Settings';

import PlatformRoles from './pages/PlatformRoles';

import PlatformDashboard from './pages/platform/PlatformDashboard';

import PlatformTenants from './pages/platform/PlatformTenants';

import PlatformCapabilities from './pages/platform/PlatformCapabilities';

import PlatformUsers from './pages/platform/PlatformUsers';

import PlatformPlans from './pages/platform/PlatformPlans';

import PlatformReports from './pages/platform/PlatformReports';

import { PERMISSIONS } from './services';

import './index.css';



function HomeRedirect() {
  const { isSuperAdmin, isTellerOnly, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }
  if (isSuperAdmin) return <Navigate to="/platform" replace />;
  if (isTellerOnly) return <Navigate to="/sell" replace />;

  return (
    <Layout>
      <Dashboard />
    </Layout>
  );
}



function AppRoutes() {

  const { isAuthenticated } = useAuth();

  const platformGuard = [PERMISSIONS.PLATFORM_MANAGE, PERMISSIONS.TENANTS_VIEW, PERMISSIONS.ROLES_MANAGE];



  return (

    <Routes>

      <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <Login />} />

      <Route path="/forgot-password" element={isAuthenticated ? <Navigate to="/" replace /> : <ForgotPassword />} />

      <Route path="/register" element={isAuthenticated ? <Navigate to="/" replace /> : <Register />} />

      <Route path="/reset-password" element={isAuthenticated ? <Navigate to="/" replace /> : <ResetPassword />} />

      <Route path="/verify-email" element={isAuthenticated ? <Navigate to="/" replace /> : <VerifyEmail />} />



      <Route

        path="/"

        element={

          <ProtectedRoute>

            <HomeRedirect />

          </ProtectedRoute>

        }

      />



      <Route path="/platform" element={<ProtectedRoute requirePermission={platformGuard}><PlatformLayout><PlatformDashboard /></PlatformLayout></ProtectedRoute>} />

      <Route path="/platform/tenants" element={<ProtectedRoute requirePermission={platformGuard}><PlatformLayout><PlatformTenants /></PlatformLayout></ProtectedRoute>} />

      <Route path="/platform/roles" element={<ProtectedRoute requirePermission={platformGuard}><PlatformLayout><PlatformRoles /></PlatformLayout></ProtectedRoute>} />

      <Route path="/platform/capabilities" element={<ProtectedRoute requirePermission={platformGuard}><PlatformLayout><PlatformCapabilities /></PlatformLayout></ProtectedRoute>} />

      <Route path="/platform/users" element={<ProtectedRoute requirePermission={platformGuard}><PlatformLayout><PlatformUsers /></PlatformLayout></ProtectedRoute>} />

      <Route path="/platform/plans" element={<ProtectedRoute requirePermission={platformGuard}><PlatformLayout><PlatformPlans /></PlatformLayout></ProtectedRoute>} />

      <Route path="/platform/reports" element={<ProtectedRoute requirePermission={platformGuard}><PlatformLayout><PlatformReports /></PlatformLayout></ProtectedRoute>} />



      <Route path="/inventory" element={<ProtectedRoute requirePermission={[PERMISSIONS.INVENTORY_MANAGE, PERMISSIONS.INVENTORY_VIEW]}><Layout><Inventory /></Layout></ProtectedRoute>} />

      <Route path="/settings" element={<ProtectedRoute requirePermission={PERMISSIONS.SETTINGS_MANAGE}><Layout><Settings /></Layout></ProtectedRoute>} />

      <Route path="/categories" element={<ProtectedRoute requirePermission={PERMISSIONS.INVENTORY_MANAGE}><Layout><Categories /></Layout></ProtectedRoute>} />

      <Route path="/sell" element={<ProtectedRoute requirePermission={PERMISSIONS.SALES_CREATE}><PosLayout><SellItems /></PosLayout></ProtectedRoute>} />

      <Route path="/sales-report" element={<ProtectedRoute requirePermission={PERMISSIONS.REPORTS_VIEW}><Layout><SalesReport /></Layout></ProtectedRoute>} />

      <Route path="/users" element={<ProtectedRoute requirePermission={[PERMISSIONS.USERS_MANAGE, PERMISSIONS.USERS_VIEW]}><Layout><Users /></Layout></ProtectedRoute>} />

      <Route path="/installment-plans" element={<ProtectedRoute><Layout><InstallmentPlans /></Layout></ProtectedRoute>} />

      <Route path="/installment-payments" element={<ProtectedRoute><Layout><InstallmentPayments /></Layout></ProtectedRoute>} />



      <Route path="*" element={<Navigate to="/" replace />} />

    </Routes>

  );

}



function App() {

  React.useEffect(() => {

    document.title = getPageTitle();

  }, []);



  return (

    <Router>

      <AuthProvider>

        <AppRoutes />

      </AuthProvider>

    </Router>

  );

}



export default App;

