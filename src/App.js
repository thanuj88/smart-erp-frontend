import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Categories from './pages/Categories';
import SellItems from './pages/SellItems';
import SalesReport from './pages/SalesReport';
import Users from './pages/Users';
import InstallmentPlans from './pages/InstallmentPlans';
import InstallmentPayments from './pages/InstallmentPayments';
import './index.css';

function AppRoutes() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/" replace /> : <Login />}
      />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout>
              <Dashboard />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/inventory"
        element={
          <ProtectedRoute requireAdmin={true}>
            <Layout>
              <Inventory />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/categories"
        element={
          <ProtectedRoute requireAdmin={true}>
            <Layout>
              <Categories />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/sell"
        element={
          <ProtectedRoute>
            <Layout>
              <SellItems />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/sales-report"
        element={
          <ProtectedRoute requireAdmin={true}>
            <Layout>
              <SalesReport />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/users"
        element={
          <ProtectedRoute requireAdmin={true}>
            <Layout>
              <Users />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/installment-plans"
        element={
          <ProtectedRoute>
            <Layout>
              <InstallmentPlans />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/installment-payments"
        element={
          <ProtectedRoute>
            <Layout>
              <InstallmentPayments />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}

export default App;
