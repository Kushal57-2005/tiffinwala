import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import { useAuthStore } from './store/authStore';
import { ProtectedRoute } from './components/ProtectedRoute';

import Login from './pages/auth/login';
import Register from './pages/auth/register';
import ForgetPassword from './pages/auth/forget-password';
import ResetPassword from './pages/auth/reset-password';

import VendorHome from './pages/vendor/VendorHome';
import VendorConnections from './pages/vendor/VendorConnections';
import VendorSubscriptions from './pages/vendor/VendorSubscriptions';
import { VendorRatings } from './pages/vendor/VendorRatings';
import { VendorDashboard } from './pages/vendor/VendorDashboard';

import CustomerHome from './pages/customer/CustomerHome';
import CustomerConnections from './pages/customer/CustomerConnections';
import CustomerSubscriptions from './pages/customer/CustomerSubscriptions';
import { CustomerDashboard } from './pages/customer/CustomerDashboard';

function App() {
  const fetchUser = useAuthStore((s) => s.fetchUser);

  // Run once on mount to restore the session from the server cookie / token.
  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  return (
    <BrowserRouter>
      <Routes>
        {/* ── Public routes ─────────────────────────────────── */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forget-password" element={<ForgetPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* ── Vendor-only routes ────────────────────────────── */}
        <Route element={<ProtectedRoute allowedRole="vendor" />}>
          <Route path="/vendor/home" element={<VendorHome />} />
          <Route path="/vendor/connections" element={<VendorConnections />} />
          <Route path="/vendor/subscriptions" element={<VendorSubscriptions />} />
          <Route path="/vendor/ratings" element={<VendorRatings />} />
          <Route path="/vendor/dashboard" element={<VendorDashboard />} />
        </Route>

        {/* ── Customer-only routes ──────────────────────────── */}
        <Route element={<ProtectedRoute allowedRole="customer" />}>
          <Route path="/customer/home" element={<CustomerHome />} />
          <Route path="/customer/connections" element={<CustomerConnections />} />
          <Route path="/customer/subscriptions" element={<CustomerSubscriptions />} />
          <Route path="/customer/dashboard" element={<CustomerDashboard />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
