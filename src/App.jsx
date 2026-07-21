import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ProtectedRoute from '@/components/ProtectedRoute';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import Layout from '@/components/Layout';
import Dashboard from '@/pages/Dashboard';
import Products from '@/pages/Products';
import Customers from '@/pages/Customers';
import Quotes from '@/pages/Quotes';
import SalesOrders from '@/pages/SalesOrders';
import Invoices from '@/pages/Invoices';
import CreditNotes from '@/pages/CreditNotes';
import DocumentView from '@/pages/DocumentView';
import DocumentEditPage from '@/pages/DocumentEditPage';
import SettingsPage from '@/pages/SettingsPage';
import AdminRoute from '@/components/AdminRoute';
import UserManagement from '@/pages/UserManagement';
import Reports from '@/pages/Reports';
import TermsOfUse from '@/pages/TermsOfUse';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      
      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/products" element={<Products />} />
          <Route path="/customers" element={<Customers />} />
          
          <Route path="/quotes" element={<Quotes />} />
          <Route path="/quotes/new" element={<DocumentEditPage docType="quote" basePath="/quotes" />} />
          <Route path="/quotes/:id" element={<DocumentView />} />
          <Route path="/quotes/:id/edit" element={<DocumentEditPage docType="quote" basePath="/quotes" />} />
          
          <Route path="/sales-orders" element={<SalesOrders />} />
          <Route path="/sales-orders/new" element={<DocumentEditPage docType="sales_order" basePath="/sales-orders" />} />
          <Route path="/sales-orders/convert/:sourceId" element={<DocumentEditPage docType="sales_order" basePath="/sales-orders" />} />
          <Route path="/sales-orders/:id" element={<DocumentView />} />
          <Route path="/sales-orders/:id/edit" element={<DocumentEditPage docType="sales_order" basePath="/sales-orders" />} />
          
          <Route path="/invoices" element={<Invoices />} />
          <Route path="/invoices/new" element={<DocumentEditPage docType="invoice" basePath="/invoices" />} />
          <Route path="/invoices/convert/:sourceId" element={<DocumentEditPage docType="invoice" basePath="/invoices" />} />
          <Route path="/invoices/:id" element={<DocumentView />} />
          <Route path="/invoices/:id/edit" element={<DocumentEditPage docType="invoice" basePath="/invoices" />} />
          
          <Route path="/credit-notes" element={<CreditNotes />} />
          <Route path="/credit-notes/new" element={<DocumentEditPage docType="credit_note" basePath="/credit-notes" />} />
          <Route path="/credit-notes/:id" element={<DocumentView />} />
          <Route path="/credit-notes/:id/edit" element={<DocumentEditPage docType="credit_note" basePath="/credit-notes" />} />
          
          <Route path="/reports" element={<Reports />} />
          <Route path="/terms" element={<TermsOfUse />} />
          <Route path="/settings" element={<AdminRoute><SettingsPage /></AdminRoute>} />
          <Route path="/users" element={<AdminRoute><UserManagement /></AdminRoute>} />
        </Route>
      </Route>
      
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App