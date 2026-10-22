import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Layouts
import { AdminLayout } from './layouts/AdminLayout';
import { CustomerLayout } from './layouts/CustomerLayout';

// Auth Pages
import { AdminLoginPage } from './pages/auth/AdminLoginPage';
import { CustomerLoginPage } from './pages/auth/CustomerLoginPage';

// Admin Pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { CustomersPage } from './pages/admin/CustomersPage';
import { CreateCustomerPage } from './pages/admin/CreateCustomerPage';
import { LoansPage } from './pages/admin/LoansPage';
import { CreateLoanPage } from './pages/admin/CreateLoanPage';
import { LoanDetailsPage } from './pages/admin/LoanDetailsPage';
import { AppointmentsPage } from './pages/admin/AppointmentsPage';
import { PaymentsPage } from './pages/admin/PaymentsPage';
import { GoldInventoryPage } from './pages/admin/GoldInventoryPage';
import { NotificationsPage } from './pages/admin/NotificationsPage';
import { ReportsPage } from './pages/admin/ReportsPage';
import { AuditLogsPage } from './pages/admin/AuditLogsPage';
import { SettingsPage } from './pages/admin/SettingsPage';

// Customer Pages
import { CustomerDashboard } from './pages/customer/CustomerDashboard';
import { CustomerLoansPage } from './pages/customer/CustomerLoansPage';
import { CustomerPaymentsPage } from './pages/customer/CustomerPaymentsPage';
import { BookAppointmentPage } from './pages/customer/BookAppointmentPage';
import { CustomerProfilePage } from './pages/customer/CustomerProfilePage';
import { CustomerNotificationsPage } from './pages/customer/CustomerNotificationsPage';

const RootRedirect: React.FC = () => {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (isAdmin) return <Navigate to="/admin/dashboard" replace />;
  return <Navigate to="/dashboard" replace />;
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Root Redirect */}
          <Route path="/" element={<RootRedirect />} />

          {/* Auth Routes */}
          <Route path="/login" element={<CustomerLoginPage />} />
          <Route path="/admin/login" element={<AdminLoginPage />} />

          {/* Admin Protected Routes */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="customers" element={<CustomersPage />} />
            <Route path="customers/create" element={<CreateCustomerPage />} />
            <Route path="loans" element={<LoansPage />} />
            <Route path="loans/create" element={<CreateLoanPage />} />
            <Route path="loans/:id" element={<LoanDetailsPage />} />
            <Route path="appointments" element={<AppointmentsPage />} />
            <Route path="payments" element={<PaymentsPage />} />
            <Route path="inventory" element={<GoldInventoryPage />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="audit-logs" element={<AuditLogsPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>

          {/* Customer Protected Routes */}
          <Route element={<CustomerLayout />}>
            <Route path="/dashboard" element={<CustomerDashboard />} />
            <Route path="/loans" element={<CustomerLoansPage />} />
            <Route path="/payments" element={<CustomerPaymentsPage />} />
            <Route path="/appointments" element={<BookAppointmentPage />} />
            <Route path="/profile" element={<CustomerProfilePage />} />
            <Route path="/notifications" element={<CustomerNotificationsPage />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;

