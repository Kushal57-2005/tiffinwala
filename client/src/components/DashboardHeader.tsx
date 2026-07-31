import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { api } from '../utils/api';
import { socket } from '../utils/socket';

interface INotification {
  _id: string;
  title: string;
  message: string;
  type: 'order' | 'payment' | 'subscription' | 'system';
  isRead: boolean;
  createdAt: string;
}

interface DashboardHeaderProps {
  role: 'customer' | 'vendor';
  subpageTitle?: string;
  passedWalletBalance?: number;
  passedName?: string;
  passedPlatformFee?: number;
  onAddMoneyClick?: () => void;
  onProfileClick?: () => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  role,
  subpageTitle,
  passedWalletBalance,
  passedName,
  passedPlatformFee,
  onAddMoneyClick,
  onProfileClick,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const storeLogout = useAuthStore((state) => state.logout);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Local States for Fallback/Internal Fetching
  const [internalWalletBalance, setInternalWalletBalance] = useState<number>(0);
  const [internalPlatformFee, setInternalPlatformFee] = useState<number>(0);
  const [showWalletModal, setShowWalletModal] = useState<boolean>(false);
  const [internalName, setInternalName] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  // Greeting & Date
  const [greeting, setGreeting] = useState<string>('Welcome');
  const [formattedDate, setFormattedDate] = useState<string>('');

  // Real Notifications State
  const [notifications, setNotifications] = useState<INotification[]>([]);
  const [notifLoading, setNotifLoading] = useState<boolean>(false);
  const [showNotifications, setShowNotifications] = useState<boolean>(false);

  // Active theme color configurations
  const isCustomer = role === 'customer';
  const themeAccent = isCustomer ? '#5C7A52' : '#E0653A';
  const themeBgAccentClass = isCustomer ? 'bg-[#5C7A52]/10' : 'bg-[#E0653A]/10';
  const themeBorderAccentClass = isCustomer ? 'border-[#5C7A52]/20' : 'border-[#E0653A]/20';
  const themeTextAccentClass = isCustomer ? 'text-[#5C7A52]' : 'text-[#E0653A]';
  const themeHoverBgClass = isCustomer ? 'hover:bg-[#5C7A52]/20' : 'hover:bg-[#E0653A]/20';
  const themeBtnHoverClass = isCustomer ? 'hover:bg-[#5C7A52]' : 'hover:bg-[#E0653A]';

  // Navigation variables for desktop navbar
  const activeBg = isCustomer ? 'bg-[#5C7A52] text-white shadow-[0_4px_12px_rgba(92,122,82,0.18)]' : 'bg-[#E0653A] text-white shadow-[0_4px_12px_rgba(224,101,58,0.18)]';
  const hoverBg = isCustomer ? 'hover:bg-[#5C7A52]/10 hover:text-[#5C7A52]' : 'hover:bg-[#E0653A]/10 hover:text-[#E0653A]';
  const homePath = isCustomer ? '/customer/home' : '/vendor/home';
  const subPath = isCustomer ? '/customer/subscriptions' : '/vendor/subscriptions';
  const connPath = isCustomer ? '/customer/connections' : '/vendor/connections';
  const chatPath = isCustomer ? '/customer/chat' : '/vendor/chat';
  const ratingsPath = '/vendor/ratings';
  const historyPath = isCustomer ? '/customer/history' : '/vendor/history';

  const currentPath = location.pathname;
  const isHomeActive = currentPath.endsWith('/home');
  const isSubActive = currentPath.endsWith('/subscriptions');
  const isConnActive = currentPath.endsWith('/connections');
  const isChatActive = currentPath.includes('/chat');
  const isRatingsActive = currentPath.endsWith('/ratings');
  const isDashActive = currentPath.endsWith('/dashboard');
  const isHistoryActive = currentPath.endsWith('/history');

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // ─── Fetch Notifications ───────────────────────────────────────────────────
  const fetchNotifications = useCallback(async () => {
    try {
      setNotifLoading(true);
      const res = await api.get('/notifications');
      if (res.data?.success && Array.isArray(res.data?.data)) {
        setNotifications(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setNotifLoading(false);
    }
  }, []);

  // ─── Mark single as read ──────────────────────────────────────────────────
  const markAsRead = useCallback(async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
    );
    try {
      await api.put(`/notifications/${id}/read`);
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  }, []);

  // ─── Mark all as read ─────────────────────────────────────────────────────
  const markAllAsRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    try {
      await api.put('/notifications/read-all');
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
    }
  }, []);

  // ─── Delete single notification ───────────────────────────────────────────
  const deleteNotification = useCallback(async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotifications((prev) => prev.filter((n) => n._id !== id));
    try {
      await api.delete(`/notifications/${id}`);
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  }, []);

  // ─── Clear all read notifications ────────────────────────────────────────
  const clearAllRead = useCallback(async () => {
    setNotifications((prev) => prev.filter((n) => !n.isRead));
    try {
      await api.delete('/notifications/clear-read');
    } catch (err) {
      console.error('Failed to clear read notifications:', err);
    }
  }, []);

  // Fetch Fallback Info if not passed as props
  useEffect(() => {
    const hrs = new Date().getHours();
    if (hrs < 12) setGreeting('Good morning');
    else if (hrs < 17) setGreeting('Good afternoon');
    else setGreeting('Good evening');

    setFormattedDate(
      new Date().toLocaleDateString(undefined, {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
      })
    );

    const fetchFallbackData = async () => {
      const needsPlatformFee = !isCustomer && passedPlatformFee === undefined;
      if (passedWalletBalance !== undefined && passedName !== undefined && !needsPlatformFee) {
        return;
      }
      try {
        setLoading(true);
        const endpoint = isCustomer ? '/customer/profile' : '/vendor/profile';
        const res = await api.get(endpoint);
        if (res.data?.success && res.data?.data) {
          const profile = res.data.data;
          if (isCustomer) {
            const fullName = profile.userId
              ? `${profile.userId.firstName} ${profile.userId.lastName}`
              : 'Customer';
            setInternalName(fullName);
          } else {
            setInternalName(profile.businessName || 'Annapurna Rasoi');
            setInternalPlatformFee(profile.platformBalance || 0);
          }
          setInternalWalletBalance(profile.walletBalance || 0);
        }
      } catch (err) {
        console.error('Error loading header fallback profile:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchFallbackData();
    fetchNotifications();
  }, [passedWalletBalance, passedName, passedPlatformFee, role, fetchNotifications]);

  // Poll for notifications every 60s while panel is closed
  useEffect(() => {
    const interval = setInterval(() => {
      if (!showNotifications) {
        fetchNotifications();
      }
    }, 60000);
    return () => clearInterval(interval);
  }, [showNotifications, fetchNotifications]);

  // Listen for real-time notifications via Socket.io
  useEffect(() => {
    const handleNewNotification = (newNotif: INotification) => {
      console.log('[Socket] Received new notification in real-time:', newNotif);
      setNotifications((prev) => {
        if (prev.some((n) => n._id === newNotif._id)) return prev;
        return [newNotif, ...prev];
      });
    };

    socket.on('newNotification', handleNewNotification);

    return () => {
      socket.off('newNotification', handleNewNotification);
    };
  }, []);

  // Refresh on open
  useEffect(() => {
    if (showNotifications) {
      fetchNotifications();
    }
  }, [showNotifications, fetchNotifications]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    if (showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showNotifications]);

  const currentWalletBalance = passedWalletBalance !== undefined ? passedWalletBalance : internalWalletBalance;
  const currentName = passedName !== undefined ? passedName : internalName;
  const currentPlatformFee = passedPlatformFee !== undefined ? passedPlatformFee : internalPlatformFee;

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.error('Logout API error:', err);
    }
    storeLogout();
    navigate('/login');
  };

  const handleAvatarClick = () => {
    if (onProfileClick) {
      onProfileClick();
    } else {
      const homePath = isCustomer ? '/customer/home' : '/vendor/home';
      navigate(homePath, { state: { openProfile: true } });
    }
  };

  const handleAddMoney = () => {
    if (onAddMoneyClick) {
      onAddMoneyClick();
    } else {
      const homePath = isCustomer ? '/customer/home' : '/vendor/home';
      navigate(homePath, { state: { openAddMoney: true } });
    }
  };

  const formatNotifTime = (isoString: string) => {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const getNotifTypeIcon = (type: INotification['type']) => {
    switch (type) {
      case 'order':
        return (
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        );
      case 'subscription':
        return (
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
          </svg>
        );
      case 'payment':
        return (
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1" />
          </svg>
        );
      default:
        return (
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  return (
    <>
      <header className="relative z-30 bg-white/40 border border-white/30 backdrop-blur-xl rounded-[32px] p-5 md:p-6 shadow-[0_24px_70px_-15px_rgba(43,33,24,0.12)] mb-8 flex flex-col sm:flex-row items-center justify-between gap-4 select-none">
      {loading && passedWalletBalance === undefined && passedName === undefined ? (
        <div className="flex items-center space-x-4 animate-pulse w-full sm:w-auto">
          <div className="w-14 h-14 rounded-2xl bg-charcoal/10 shrink-0" />
          <div className="text-left space-y-2">
            <div className="h-2.5 w-16 bg-charcoal/10 rounded" />
            <div className="h-6 w-36 bg-charcoal/10 rounded-lg" />
            <div className="h-3 w-24 bg-charcoal/10 rounded" />
          </div>
        </div>
      ) : (
        <div className="flex items-center space-x-4 w-full sm:w-auto min-w-0">
          {/* Interactive Avatar / Initials badge */}
          <button
            onClick={handleAvatarClick}
            title={isCustomer ? 'Edit Profile & Friends' : 'Edit Profile Settings'}
            className={`w-14 h-14 rounded-2xl ${themeBgAccentClass} ${themeHoverBgClass} border ${themeBorderAccentClass} flex items-center justify-center shrink-0 shadow-sm transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer focus:outline-none`}
          >
            <span className={`text-2xl font-display font-extrabold ${themeTextAccentClass} select-none`}>
              {currentName ? getInitials(currentName) : (isCustomer ? 'C' : 'V')}
            </span>
          </button>
          <div className="text-center sm:text-left min-w-0">
            <p className="text-[10px] text-[#2B2118]/50 font-bold uppercase tracking-wider font-body">
              {subpageTitle ? `Dashboard • ${subpageTitle}` : greeting}
            </p>
            <h1 className="font-display text-2xl md:text-3xl font-extrabold text-[#2B2118] leading-tight">
              {currentName || (isCustomer ? 'Customer' : 'Vendor')}
            </h1>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 text-xs text-[#2B2118]/60 mt-1 font-body">
              <span>{formattedDate}</span>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-row items-center justify-center sm:justify-end gap-3 mt-4 sm:mt-0 w-full sm:w-auto shrink-0">
        {/* Desktop Navigation Menu (hidden on mobile, visible on larger screens) */}
        <div className="hidden md:flex items-center gap-3 mr-2">
          {/* Home Button */}
          <button
            onClick={() => navigate(homePath)}
            className={`w-12 h-12 rounded-2xl border border-charcoal/10 flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 shadow-sm cursor-pointer ${
              isHomeActive ? activeBg : 'bg-white/70 text-charcoal/80 ' + hoverBg
            }`}
            title="Home Dashboard"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </button>

          {/* Dashboard Button */}
          <button
            onClick={() => navigate(isCustomer ? '/customer/dashboard' : '/vendor/dashboard')}
            className={`w-12 h-12 rounded-2xl border border-charcoal/10 flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 shadow-sm cursor-pointer ${
              isDashActive ? activeBg : 'bg-white/70 text-charcoal/80 ' + hoverBg
            }`}
            title={isCustomer ? 'My Activity Dashboard' : 'Business Analytics Dashboard'}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </button>

          {/* Subscriptions Button */}
          <button
            onClick={() => navigate(subPath)}
            className={`w-12 h-12 rounded-2xl border border-charcoal/10 flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 shadow-sm cursor-pointer ${
              isSubActive ? activeBg : 'bg-white/70 text-charcoal/80 ' + hoverBg
            }`}
            title="Subscription Management"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
            </svg>
          </button>

          {/* Connections Button */}
          <button
            onClick={() => navigate(connPath)}
            className={`w-12 h-12 rounded-2xl border border-charcoal/10 flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 shadow-sm cursor-pointer ${
              isConnActive ? activeBg : 'bg-white/70 text-charcoal/80 ' + hoverBg
            }`}
            title="My Connections"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </button>

          {/* Messages Button */}
          <button
            onClick={() => navigate(chatPath)}
            className={`w-12 h-12 rounded-2xl border border-charcoal/10 flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 shadow-sm cursor-pointer ${
              isChatActive ? activeBg : 'bg-white/70 text-charcoal/80 ' + hoverBg
            }`}
            title="Messages"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </button>

          {/* History Button */}
          <button
            onClick={() => navigate(historyPath)}
            className={`w-12 h-12 rounded-2xl border border-charcoal/10 flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 shadow-sm cursor-pointer ${
              isHistoryActive ? activeBg : 'bg-white/70 text-charcoal/80 ' + hoverBg
            }`}
            title="Order History"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>

          {/* Ratings Button - Vendor Only */}
          {!isCustomer && (
            <button
              onClick={() => navigate(ratingsPath)}
              className={`w-12 h-12 rounded-2xl border border-charcoal/10 flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 shadow-sm cursor-pointer ${
                isRatingsActive ? activeBg : 'bg-white/70 text-charcoal/80 ' + hoverBg
              }`}
              title="Customer Ratings & Reviews"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.907c.961 0 1.36 1.24.588 1.81l-3.97 2.883a1 1 0 00-.364 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.971-2.883a1 1 0 00-1.17 0l-3.971 2.883c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.364-1.118l-3.97-2.883c-.773-.57-.375-1.81.588-1.81h4.907a1 1 0 00.95-.69l1.519-4.674z" />
              </svg>
            </button>
          )}
        </div>

        {/* Wallet Balance Pill - Customer */}
        {isCustomer && (
          <div className={`${themeBgAccentClass} border ${themeBorderAccentClass} rounded-2xl pl-4 pr-2 py-2 flex items-center gap-3 select-none shadow-sm bg-white/30 shrink-0`}>
            <div className="flex items-center gap-2">
              <svg className={`w-4 h-4 ${themeTextAccentClass}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <div className="text-left font-body">
                <p className="text-[9px] uppercase tracking-wider font-bold text-[#2B2118]/40 leading-none">
                  Wallet Balance
                </p>
                <p className={`text-sm font-extrabold ${themeTextAccentClass} leading-none mt-1`}>
                  ₹{currentWalletBalance.toFixed(2)}
                </p>
              </div>
            </div>
            <div className={`w-px h-6 ${isCustomer ? 'bg-[#5C7A52]/20' : 'bg-[#E0653A]/20'}`}></div>
            <button
              onClick={handleAddMoney}
              className={`w-8 h-8 rounded-xl bg-white hover:text-white border ${themeBorderAccentClass} ${themeTextAccentClass} ${themeBtnHoverClass} flex items-center justify-center transition-all shadow-sm cursor-pointer`}
              title="Add Money to Wallet"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </button>
          </div>
        )}

        {/* Vendor Wallet Balance */}
        {!isCustomer && (
          <button
            onClick={() => setShowWalletModal(true)}
            className={`${themeBgAccentClass} border ${themeBorderAccentClass} rounded-2xl px-4 py-2.5 flex items-center gap-2 select-none shadow-sm bg-white/30 shrink-0 cursor-pointer hover:scale-105 active:scale-95 transition-all duration-200 focus:outline-none`}
            title="View Wallet & Platform Fee Details"
          >
            <svg className={`w-4 h-4 ${themeTextAccentClass}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <div className="text-left font-body">
              <p className="text-[9px] uppercase tracking-wider font-bold text-[#2B2118]/40 leading-none">
                Total Balance
              </p>
              <p className={`text-sm font-extrabold ${themeTextAccentClass} leading-none mt-1`}>
                ₹{(currentWalletBalance + currentPlatformFee).toFixed(2)}
              </p>
            </div>
          </button>
        )}

        {/* Notification Bell */}
        <div className="static sm:relative" ref={dropdownRef}>
          <button
            id="notification-bell-btn"
            onClick={() => setShowNotifications((prev) => !prev)}
            className="w-12 h-12 rounded-2xl bg-white/70 hover:bg-cream/50 border border-charcoal/10 flex items-center justify-center text-charcoal/80 transition-all duration-200 hover:scale-105 active:scale-95 shadow-sm relative shrink-0 cursor-pointer"
            title="Notifications"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {unreadCount > 0 && (
              <span
                className={`absolute -top-1 -right-1 min-w-[20px] h-5 px-1 rounded-full ${isCustomer ? 'bg-[#5C7A52]' : 'bg-[#E0653A]'} text-white text-[10px] font-bold flex items-center justify-center border-2 border-[#FBF4EC]`}
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Notification Dropdown */}
          {showNotifications && (
            <div
              className="absolute right-4 left-4 sm:right-0 sm:left-auto mt-3 sm:w-96 bg-white/95 border border-charcoal/10 rounded-[24px] shadow-2xl z-50 overflow-hidden"
              style={{ animation: 'notifSlide 0.2s cubic-bezier(0.16,1,0.3,1) forwards' }}
            >
              <style>{`
                @keyframes notifSlide {
                  0% { opacity: 0; transform: translateY(-8px) scale(0.97); }
                  100% { opacity: 1; transform: translateY(0) scale(1); }
                }
              `}</style>

              {/* Header */}
              <div className="flex justify-between items-center px-5 pt-4 pb-3 border-b border-charcoal/8">
                <div className="flex items-center gap-2">
                  <h3 className="font-display font-bold text-sm text-charcoal">
                    Notifications
                  </h3>
                  {unreadCount > 0 && (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${isCustomer ? 'bg-[#5C7A52]/10 text-[#5C7A52]' : 'bg-[#E0653A]/10 text-[#E0653A]'}`}>
                      {unreadCount} new
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className={`text-[10px] ${themeTextAccentClass} hover:underline font-bold uppercase tracking-wider cursor-pointer`}
                    >
                      Mark all read
                    </button>
                  )}
                  {notifications.some((n) => n.isRead) && (
                    <button
                      onClick={clearAllRead}
                      className="text-[10px] text-charcoal/40 hover:text-red-500 font-bold uppercase tracking-wider cursor-pointer"
                    >
                      Clear read
                    </button>
                  )}
                </div>
              </div>

              {/* Notifications List */}
              <div className="max-h-[360px] overflow-y-auto overscroll-contain">
                {notifLoading ? (
                  <div className="space-y-2 p-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="animate-pulse flex gap-3 p-2">
                        <div className="w-8 h-8 rounded-xl bg-charcoal/10 shrink-0" />
                        <div className="flex-1 space-y-1.5">
                          <div className="h-3 w-32 bg-charcoal/10 rounded" />
                          <div className="h-2.5 w-full bg-charcoal/8 rounded" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="py-12 px-6 text-center flex flex-col items-center gap-3">
                    <div className={`w-14 h-14 rounded-2xl ${themeBgAccentClass} border ${themeBorderAccentClass} flex items-center justify-center`}>
                      <svg className={`w-7 h-7 ${themeTextAccentClass}`} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                      </svg>
                    </div>
                    <p className="font-display font-bold text-charcoal text-sm">All caught up!</p>
                    <p className="text-xs text-charcoal/50 font-body leading-relaxed">
                      No notifications yet. Order updates and alerts will appear here.
                    </p>
                  </div>
                ) : (
                  <div className="p-3 space-y-1.5">
                    {notifications.map((notif) => (
                      <div
                        key={notif._id}
                        onClick={() => markAsRead(notif._id)}
                        className={`group relative flex gap-3 p-3 rounded-2xl transition-all duration-200 cursor-pointer ${
                          !notif.isRead
                            ? `${themeBgAccentClass} border ${themeBorderAccentClass}`
                            : 'hover:bg-charcoal/5 border border-transparent'
                        }`}
                      >
                        {/* Type icon */}
                        <div className={`w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center mt-0.5 ${
                          !notif.isRead
                            ? `${isCustomer ? 'bg-[#5C7A52]' : 'bg-[#E0653A]'} text-white`
                            : 'bg-charcoal/10 text-charcoal/50'
                        }`}>
                          {getNotifTypeIcon(notif.type)}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-1">
                            <p className={`text-xs font-bold leading-tight ${!notif.isRead ? 'text-charcoal' : 'text-charcoal/70'}`}>
                              {notif.title}
                            </p>
                            <span className="text-[9px] text-charcoal/40 font-semibold shrink-0 mt-0.5">
                              {formatNotifTime(notif.createdAt)}
                            </span>
                          </div>
                          <p className={`text-[11px] mt-0.5 leading-relaxed ${!notif.isRead ? 'text-charcoal/70' : 'text-charcoal/50'}`}>
                            {notif.message}
                          </p>
                        </div>

                        {/* Dismiss button */}
                        <button
                          onClick={(e) => deleteNotification(notif._id, e)}
                          className="absolute top-2.5 right-2.5 opacity-0 group-hover:opacity-100 w-5 h-5 rounded-lg bg-charcoal/10 hover:bg-red-100 hover:text-red-500 text-charcoal/40 flex items-center justify-center transition-all duration-150 cursor-pointer"
                          title="Dismiss"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>

                        {/* Unread dot */}
                        {!notif.isRead && (
                          <div className={`absolute top-3.5 right-3 w-1.5 h-1.5 rounded-full ${isCustomer ? 'bg-[#5C7A52]' : 'bg-[#E0653A]'} group-hover:opacity-0 transition-opacity`} />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-5 py-3 border-t border-charcoal/8 flex justify-center">
                <button
                  onClick={() => setShowNotifications(false)}
                  className="text-[10px] text-charcoal/40 hover:text-charcoal font-bold uppercase tracking-wider cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Logout Button */}
        <button
          id="logout-btn"
          onClick={handleLogout}
          title="Log Out"
          className="w-12 h-12 rounded-2xl bg-white/70 hover:bg-red-500/10 hover:text-red-600 hover:border-red-500/20 border border-[#2B2118]/10 flex items-center justify-center text-[#2B2118]/80 transition-all duration-200 hover:scale-105 active:scale-95 shadow-sm cursor-pointer shrink-0"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>
      </div>
    </header>

      {/* Vendor Wallet Details Modal */}
      {showWalletModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-lg transition-opacity duration-300 animate-fade-in"
          onClick={() => setShowWalletModal(false)}
        >
          <div
            className="bg-white/95 border border-white/30 shadow-[0_24px_70px_rgba(43,33,24,0.3)] rounded-[32px] w-full max-w-md max-h-[90vh] overflow-hidden transform transition-all duration-300 scale-100 flex flex-col animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-br from-[#1F1710] to-[#2E2218] p-6 text-cream relative select-none shrink-0">
              <div className="relative z-10 flex justify-between items-center">
                <div className="text-left">
                  <h3 className="font-display text-xl md:text-2xl font-bold text-white">
                    Wallet Details
                  </h3>
                  <p className="text-xs text-white/60 mt-1">
                    Your current balance and platform fee metrics.
                  </p>
                </div>
                <button
                  onClick={() => setShowWalletModal(false)}
                  className="text-white/70 hover:text-white transition-colors cursor-pointer"
                  title="Close"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4 bg-[#FBF4EC]/50 font-body text-[#2B2118] overflow-y-auto">
              {/* Total Balance Highlight */}
              <div className="bg-white border border-[#E0653A]/20 rounded-2xl p-4 shadow-sm text-center relative overflow-hidden">
                <div className="absolute -right-3 -top-3 w-12 h-12 rounded-full bg-[#E0653A]/5" />
                <span className="text-[10px] uppercase font-bold tracking-widest text-[#2B2118]/40 block">
                  Total Balance
                </span>
                <span className="text-2xl md:text-3xl font-display font-extrabold text-[#E0653A] mt-1 block">
                  ₹{(currentWalletBalance + currentPlatformFee).toFixed(2)}
                </span>
              </div>

              {/* Wallet & Fee Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white border border-[#2B2118]/10 rounded-2xl p-4 shadow-sm text-center">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-[#2B2118]/40 block">
                    Wallet Balance
                  </span>
                  <span className="text-lg md:text-xl font-display font-extrabold text-[#2B2118]/80 mt-1 block">
                    ₹{currentWalletBalance.toFixed(2)}
                  </span>
                </div>
                <div className="bg-white border border-[#2B2118]/10 rounded-2xl p-4 shadow-sm text-center">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-[#2B2118]/40 block">
                    Platform Fee
                  </span>
                  <span className="text-lg md:text-xl font-display font-extrabold text-[#2B2118]/70 mt-1 block">
                    ₹{currentPlatformFee.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Policy Statement Box */}
              <div className="bg-[#E0653A]/10 border border-[#E0653A]/20 rounded-2xl p-4 flex gap-3 items-start">
                <svg className="w-5 h-5 text-[#E0653A] shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="text-xs md:text-sm font-semibold text-[#2B2118]/80 leading-relaxed text-left">
                  10% of your each order goes into the platform fee which deducted monthly from 10% percent of your revenue is ours
                </div>
              </div>

              {/* Close Action */}
              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setShowWalletModal(false)}
                  className="w-full py-3 rounded-xl bg-[#E0653A] hover:bg-[#c2512a] text-white font-display font-bold text-xs uppercase tracking-wider shadow-[0_4px_12px_rgba(224,101,58,0.2)] transition-all duration-200 hover:scale-102 active:scale-98 cursor-pointer text-center"
                >
                  Got it
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
