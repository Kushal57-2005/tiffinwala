import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { api } from '../utils/api';

interface DashboardHeaderProps {
  role: 'customer' | 'vendor';
  subpageTitle?: string; // e.g., "Subscriptions" or "Connections"
  passedWalletBalance?: number;
  passedName?: string;
  onAddMoneyClick?: () => void;
  onProfileClick?: () => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  role,
  subpageTitle,
  passedWalletBalance,
  passedName,
  onAddMoneyClick,
  onProfileClick,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const storeLogout = useAuthStore((state) => state.logout);

  // Local States for Fallback/Internal Fetching
  const [internalWalletBalance, setInternalWalletBalance] = useState<number>(0);
  const [internalName, setInternalName] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  // Greeting & Date
  const [greeting, setGreeting] = useState<string>('Welcome');
  const [formattedDate, setFormattedDate] = useState<string>('');

  // Notifications Bell
  const [notificationCount, setNotificationCount] = useState<number>(2);
  const [showNotifications, setShowNotifications] = useState<boolean>(false);

  // Active theme color configurations
  const isCustomer = role === 'customer';
  const themeAccent = isCustomer ? '#5C7A52' : '#E0653A';
  const themeBgAccentClass = isCustomer ? 'bg-[#5C7A52]/10' : 'bg-[#E0653A]/10';
  const themeBorderAccentClass = isCustomer ? 'border-[#5C7A52]/20' : 'border-[#E0653A]/20';
  const themeTextAccentClass = isCustomer ? 'text-[#5C7A52]' : 'text-[#E0653A]';
  const themeHoverBgClass = isCustomer ? 'hover:bg-[#5C7A52]/20' : 'hover:bg-[#E0653A]/20';
  const themeHoverTextClass = isCustomer ? 'hover:text-[#5C7A52]' : 'hover:text-[#E0653A]';
  const themeBtnHoverClass = isCustomer ? 'hover:bg-[#5C7A52]' : 'hover:bg-[#E0653A]';

  // Navigation variables for desktop navbar
  const activeBg = isCustomer ? 'bg-[#5C7A52] text-white shadow-[0_4px_12px_rgba(92,122,82,0.18)]' : 'bg-[#E0653A] text-white shadow-[0_4px_12px_rgba(224,101,58,0.18)]';
  const hoverBg = isCustomer ? 'hover:bg-[#5C7A52]/10 hover:text-[#5C7A52]' : 'hover:bg-[#E0653A]/10 hover:text-[#E0653A]';
  const homePath = isCustomer ? '/customer/home' : '/vendor/home';
  const subPath = isCustomer ? '/customer/subscriptions' : '/vendor/subscriptions';
  const connPath = isCustomer ? '/customer/connections' : '/vendor/connections';
  const ratingsPath = '/vendor/ratings';

  const currentPath = location.pathname;
  const isHomeActive = currentPath.endsWith('/home');
  const isSubActive = currentPath.endsWith('/subscriptions');
  const isConnActive = currentPath.endsWith('/connections');
  const isRatingsActive = currentPath.endsWith('/ratings');

  // Fetch Fallback Info if not passed as props
  useEffect(() => {
    // Greeting based on time of day
    const hrs = new Date().getHours();
    if (hrs < 12) setGreeting('Good morning');
    else if (hrs < 17) setGreeting('Good afternoon');
    else setGreeting('Good evening');

    // Date formatting
    setFormattedDate(
      new Date().toLocaleDateString(undefined, {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
      })
    );

    const fetchFallbackData = async () => {
      // If props are passed, we don't need fallback API calls
      if (passedWalletBalance !== undefined && passedName !== undefined) {
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
  }, [passedWalletBalance, passedName, role]);

  const currentWalletBalance = passedWalletBalance !== undefined ? passedWalletBalance : internalWalletBalance;
  const currentName = passedName !== undefined ? passedName : internalName;

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

  // Mock notifications list
  const notificationsList = isCustomer
    ? [
        {
          id: 1,
          title: 'Order Accepted!',
          content: 'Annapurna Rasoi has accepted your deluxe lunch request.',
          time: 'Just Now',
          highlight: true,
        },
        {
          id: 2,
          title: 'New Vendor Nearby!',
          content: 'Zaika Tiffin Corners is now delivering to your area.',
          time: '2 hours ago',
          highlight: false,
        },
      ]
    : [
        {
          id: 1,
          title: 'New Order Received!',
          content: 'Aditya Patel ordered 2x Premium Lunch Box',
          time: '12:30 PM',
          highlight: true,
        },
        {
          id: 2,
          title: 'Order accepted',
          content: "You accepted Kushal Sharma's order",
          time: '12:18 PM',
          highlight: false,
        },
      ];

  return (
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
        <div className="flex items-center space-x-4 w-full sm:w-auto">
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
          <div className="text-center sm:text-left">
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

      <div className="flex flex-row items-center justify-center sm:justify-end gap-3 mt-4 sm:mt-0 w-full sm:w-auto">
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
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
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
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"
              />
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
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
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
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.907c.961 0 1.36 1.24.588 1.81l-3.97 2.883a1 1 0 00-.364 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.971-2.883a1 1 0 00-1.17 0l-3.971 2.883c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.364-1.118l-3.97-2.883c-.773-.57-.375-1.81.588-1.81h4.907a1 1 0 00.95-.69l1.519-4.674z"
                />
              </svg>
            </button>
          )}
        </div>

        {/* Wallet Balance Pill */}
        {isCustomer && (
          <div className={`${themeBgAccentClass} border ${themeBorderAccentClass} rounded-2xl pl-4 pr-2 py-2 flex items-center gap-3 select-none shadow-sm bg-white/30 shrink-0`}>
            <div className="flex items-center gap-2">
              <svg
                className={`w-4 h-4 ${themeTextAccentClass}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                />
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
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
            </button>
          </div>
        )}

        {/* Vendor Wallet Balance (Vendor has it, but no Add Money button) */}
        {!isCustomer && (
          <div className={`${themeBgAccentClass} border ${themeBorderAccentClass} rounded-2xl px-4 py-2.5 flex items-center gap-2 select-none shadow-sm bg-white/30 shrink-0`}>
            <svg
              className={`w-4 h-4 ${themeTextAccentClass}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
              />
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
        )}

        {/* Notification Bell (Visible on both Mobile and Desktop) */}
        <div className="static sm:relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              if (notificationCount > 0) setNotificationCount(0);
            }}
            className={`w-12 h-12 rounded-2xl bg-white/70 hover:bg-cream/50 border border-charcoal/10 flex items-center justify-center text-charcoal/80 transition-all duration-200 hover:scale-105 active:scale-95 shadow-sm relative shrink-0 cursor-pointer`}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
            {notificationCount > 0 && (
              <span className={`absolute -top-1 -right-1 w-5 h-5 rounded-full ${isCustomer ? 'bg-[#5C7A52]' : 'bg-[#E0653A]'} text-white text-[10px] font-bold flex items-center justify-center animate-pulse-dot border-2 border-[#FBF4EC]`}>
                {notificationCount}
              </span>
            )}
          </button>

          {/* Dropdown panel */}
          {showNotifications && (
            <div className="absolute right-4 left-4 sm:right-0 sm:left-auto mt-3 sm:w-80 bg-white border border-charcoal/10 rounded-[24px] shadow-xl p-4 z-50 animate-scale-up">
              <div className="flex justify-between items-center border-b border-charcoal/5 pb-2 mb-2">
                <h3 className="font-display font-bold text-sm text-charcoal">
                  Notifications
                </h3>
                <button
                  onClick={() => setShowNotifications(false)}
                  className={`text-[10px] ${themeTextAccentClass} hover:underline font-bold uppercase tracking-wider cursor-pointer`}
                >
                  Close
                </button>
              </div>
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {notificationsList.map((notif) => (
                  <div
                    key={notif.id}
                    className={`text-xs p-2.5 rounded-xl hover:bg-cream/40 transition-colors ${
                      notif.highlight
                        ? `${themeBgAccentClass} border ${isCustomer ? 'border-[#5C7A52]/10' : 'border-[#E0653A]/10'}`
                        : ''
                    }`}
                  >
                    <p className="font-bold text-charcoal">{notif.title}</p>
                    <p className="text-charcoal/60 mt-0.5">{notif.content}</p>
                    <span className="text-[9px] text-charcoal/40 font-semibold block mt-1">
                      {notif.time}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Logout Button (Visible on both Mobile and Desktop) */}
        <button
          onClick={handleLogout}
          title="Log Out"
          className="w-12 h-12 rounded-2xl bg-white/70 hover:bg-red-500/10 hover:text-red-600 hover:border-red-500/20 border border-[#2B2118]/10 flex items-center justify-center text-[#2B2118]/80 transition-all duration-200 hover:scale-105 active:scale-95 shadow-sm cursor-pointer shrink-0"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            />
          </svg>
        </button>
      </div>
    </header>
  );
};
