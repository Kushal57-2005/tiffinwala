import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import { useAuthStore } from './store/authStore';
import { ProtectedRoute } from './components/ProtectedRoute';
import { socket, connectSocket, disconnectSocket } from './utils/socket';

import Login from './pages/auth/login';
import Register from './pages/auth/register';
import ForgetPassword from './pages/auth/forget-password';
import ResetPassword from './pages/auth/reset-password';

import VendorHome from './pages/vendor/VendorHome';
import VendorConnections from './pages/vendor/VendorConnections';
import VendorSubscriptions from './pages/vendor/VendorSubscriptions';
import { VendorRatings } from './pages/vendor/VendorRatings';
import { VendorDashboard } from './pages/vendor/VendorDashboard';
import VendorChatPage from './pages/vendor/ChatPage';
import VendorChatWindow from './pages/vendor/ChatWindow';
import VendorHistory from './pages/vendor/VendorHistory';

import CustomerHome from './pages/customer/CustomerHome';
import CustomerConnections from './pages/customer/CustomerConnections';
import CustomerSubscriptions from './pages/customer/CustomerSubscriptions';
import { CustomerDashboard } from './pages/customer/CustomerDashboard';
import CustomerChatPage from './pages/customer/ChatPage';
import CustomerChatWindow from './pages/customer/ChatWindow';
import CustomerHistory from './pages/customer/CustomerHistory';

function App() {
  const fetchUser = useAuthStore((s) => s.fetchUser);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);

  // Run once on mount to restore the session from the server cookie / token.
  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  // Connect and register/unregister Socket connection based on authentication state
  useEffect(() => {
    if (isAuthenticated && user?._id) {
      connectSocket();
      socket.emit('register', user._id);
      console.log(`[Socket] Connected and registered user: ${user._id}`);
    } else if (!isAuthenticated) {
      disconnectSocket();
    }
    return () => {
      disconnectSocket();
    };
  }, [isAuthenticated, user]);

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
          <Route path="/vendor/chat" element={<VendorChatPage />} />
          <Route path="/vendor/chat/:customerId" element={<VendorChatWindow />} />
          <Route path="/vendor/history" element={<VendorHistory />} />
        </Route>

        {/* ── Customer-only routes ──────────────────────────── */}
        <Route element={<ProtectedRoute allowedRole="customer" />}>
          <Route path="/customer/home" element={<CustomerHome />} />
          <Route path="/customer/connections" element={<CustomerConnections />} />
          <Route path="/customer/subscriptions" element={<CustomerSubscriptions />} />
          <Route path="/customer/dashboard" element={<CustomerDashboard />} />
          <Route path="/customer/chat" element={<CustomerChatPage />} />
          <Route path="/customer/chat/:vendorId" element={<CustomerChatWindow />} />
          <Route path="/customer/history" element={<CustomerHistory />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
