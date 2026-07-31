import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../utils/api';
import { useAuthStore } from '../../store/authStore';
import tiffinBg from '../../assets/slate_spices_bg.png';
import { MobileNavbar } from '../../components/MobileNavbar';

interface CustomerHistoryItem {
  date: string; // ISO date string
  vendorName: string;
  totalSpent: number;
  orders: {
    session: 'lunch' | 'dinner';
    status: 'pending' | 'accepted' | 'rejected' | 'delivered' | 'received';
    totalAmount: number;
    profile: string;
    items: {
      type: 'tier' | 'addon';
      name: string;
      quantity: number;
      price: number;
    }[];
  }[];
}

const CustomerHistory: React.FC = () => {
  const navigate = useNavigate();
  const authUser = useAuthStore((state) => state.user);

  // States
  const [history, setHistory] = useState<CustomerHistoryItem[]>([]);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [dateFilter, setDateFilter] = useState<'all' | 'today' | '7days' | '30days' | 'custom'>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Parallax background mouse tracking
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const handleMouseMove = (e: React.MouseEvent) => {
    const { clientX, clientY } = e;
    const x = (clientX - window.innerWidth / 2) / 45;
    const y = (clientY - window.innerHeight / 2) / 45;
    setMousePos({ x, y });
  };

  // Fetch history & profile
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [historyRes, profileRes] = await Promise.all([
          api.get('/customer/history'),
          api.get('/customer/profile'),
        ]);

        if (historyRes.data?.success && Array.isArray(historyRes.data?.data)) {
          setHistory(historyRes.data.data);
        }
        if (profileRes.data?.success && profileRes.data?.data) {
          setWalletBalance(profileRes.data.data.walletBalance || 0);
        }
      } catch (err: any) {
        console.error('Error fetching customer history:', err);
        setError(err.response?.data?.message || 'Failed to load order history.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter history client-side based on date filter
  const filteredHistory = useMemo(() => {
    if (dateFilter === 'all') return history;

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    return history.filter((item) => {
      try {
        const itemDate = new Date(item.date);
        
        if (dateFilter === 'today') {
          return itemDate >= startOfToday;
        }
        
        if (dateFilter === '7days') {
          const sevenDaysAgo = new Date(startOfToday.getTime() - 7 * 24 * 60 * 60 * 1000);
          return itemDate >= sevenDaysAgo;
        }
        
        if (dateFilter === '30days') {
          const thirtyDaysAgo = new Date(startOfToday.getTime() - 30 * 24 * 60 * 60 * 1000);
          return itemDate >= thirtyDaysAgo;
        }
        
        if (dateFilter === 'custom') {
          let matches = true;
          if (startDate) {
            const start = new Date(startDate);
            start.setHours(0, 0, 0, 0);
            matches = matches && itemDate >= start;
          }
          if (endDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            matches = matches && itemDate <= end;
          }
          return matches;
        }
      } catch (e) {
        console.error('Date parsing error in filter:', e);
      }
      return true;
    });
  }, [history, dateFilter, startDate, endDate]);

  // Compute stats client-side
  const stats = useMemo(() => {
    let totalOrders = 0;
    let totalSpent = 0;
    const vendors = new Set<string>();

    filteredHistory.forEach((item) => {
      totalOrders += item.orders?.length || 0;
      totalSpent += item.totalSpent || 0;
      if (item.vendorName) {
        vendors.add(item.vendorName);
      }
    });

    return {
      totalOrders,
      totalSpent,
      uniqueVendors: vendors.size,
    };
  }, [filteredHistory]);

  // Initials generator
  const getInitials = () => {
    if (authUser) {
      return `${authUser.firstName?.[0] || ''}${authUser.lastName?.[0] || ''}`.toUpperCase() || 'C';
    }
    return 'C';
  };

  // Date formatter
  const formatDateString = (dateIsoStr: string) => {
    try {
      const d = new Date(dateIsoStr);
      return d.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateIsoStr;
    }
  };

  // Status Badge configurations
  const getStatusBadge = (status: CustomerHistoryItem['orders'][number]['status']) => {
    const configs = {
      pending: 'bg-amber-50 border-amber-200 text-amber-700',
      accepted: 'bg-blue-50 border-blue-200 text-blue-700',
      rejected: 'bg-red-50 border-red-200 text-red-700',
      delivered: 'bg-emerald-50 border-emerald-200 text-emerald-700',
      received: 'bg-violet-50 border-violet-200 text-violet-700',
    };
    const label = status.charAt(0).toUpperCase() + status.slice(1);
    return (
      <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full border ${configs[status] || ''}`}>
        {label}
      </span>
    );
  };

  // Session Badge configurations
  const getSessionBadge = (session: 'lunch' | 'dinner') => {
    const isLunch = session === 'lunch';
    return (
      <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full border ${
        isLunch 
          ? 'bg-orange-50 border-orange-200 text-orange-700' 
          : 'bg-indigo-50 border-indigo-200 text-indigo-700'
      }`}>
        {isLunch ? '🌤 Lunch' : '🌙 Dinner'}
      </span>
    );
  };

  return (
    <div
      onMouseMove={handleMouseMove}
      className="min-h-screen bg-[#FBF4EC] font-body text-[#2B2118] pb-24 relative overflow-hidden select-text transition-all duration-300"
    >
      <style>{`
        @keyframes scale-up {
          0% { transform: scale(0.95); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes float-slow {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-15px) rotate(5deg); }
        }
        @keyframes float-medium {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-22px) rotate(-8deg); }
        }
        @keyframes float-fast {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(12deg); }
        }
        @keyframes float-reverse {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(18px) rotate(-6deg); }
        }
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.08; transform: scale(1); }
          50% { opacity: 0.18; transform: scale(1.15); }
        }
        .animate-scale-up { animation: scale-up 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .floating-leaf { animation: float-slow 7s ease-in-out infinite; }
        .floating-anise { animation: float-medium 9s ease-in-out infinite; }
        .floating-cardamom { animation: float-slow 6s ease-in-out infinite; }
        .floating-clove { animation: float-medium 10s ease-in-out infinite; }
        .floating-chili { animation: float-reverse 9s ease-in-out infinite; }
        .floating-leaf-2 { animation: float-fast 6s ease-in-out infinite; }
        .pulse-glow-green { animation: pulse-glow 12s ease-in-out infinite; }
      `}</style>

      {/* Background Texture Overlay */}
      <img
        src={tiffinBg}
        alt=""
        className="absolute inset-0 w-full h-full object-cover opacity-[0.025] mix-blend-multiply pointer-events-none select-none z-0"
      />

      {/* Background Ambient Glows */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full blur-[130px] bg-[#5C7A52]/10 pulse-glow-green transition-all duration-1000" />
        <div className="absolute top-1/2 right-0 w-[500px] h-[500px] rounded-full blur-[150px] bg-[#7E9C73]/10 pulse-glow-green transition-all duration-1000" />
      </div>

      {/* Floating Parallax Spices & Leaf Accents */}
      <div
        style={{
          transform: `translate3d(${mousePos.x * 0.8}px, ${mousePos.y * 0.8}px, 0)`,
          transition: 'transform 0.15s ease-out',
        }}
        className="absolute top-[12%] left-[6%] floating-leaf opacity-[0.85] pointer-events-none z-10 hidden md:block"
      >
        <svg width="45" height="45" viewBox="0 0 24 24" fill="none">
          <path
            d="M2 22C2 22 7 21 12 16C17 11 20 6 22 2C22 2 17 2 12 6C7 10 3 15 2 22Z"
            fill="#5C7A52"
            opacity="0.9"
          />
          <path
            d="M2 22C6 18 12 14 22 2"
            stroke="#FBF4EC"
            strokeWidth="0.8"
            strokeLinecap="round"
          />
        </svg>
      </div>

      <div
        style={{
          transform: `translate3d(${mousePos.x * -0.6}px, ${mousePos.y * -0.6}px, 0)`,
          transition: 'transform 0.15s ease-out',
        }}
        className="absolute bottom-[25%] right-[6%] floating-anise opacity-70 pointer-events-none z-10 hidden md:block"
      >
        <svg width="60" height="60" viewBox="0 0 24 24" fill="none">
          <path d="M12 2L14 9H10L12 2Z" fill="#8C5B3E" />
          <path d="M12 22L10 15H14L12 22Z" fill="#8C5B3E" />
          <path d="M2 12L9 10V14L2 12Z" fill="#8C5B3E" />
          <path d="M22 12L15 14V10L22 12Z" fill="#8C5B3E" />
          <circle cx="12" cy="12" r="3" fill="#7E9C73" />
        </svg>
      </div>

      <div
        style={{
          transform: `translate3d(${mousePos.x * 0.4}px, ${mousePos.y * 0.4}px, 0)`,
          transition: 'transform 0.15s ease-out',
        }}
        className="absolute top-[42%] left-[4%] floating-cardamom opacity-80 pointer-events-none z-10 hidden md:block"
      >
        <svg width="35" height="35" viewBox="0 0 24 24" fill="none">
          <path d="M12 2C8 6 6 12 12 22C18 12 16 6 12 2Z" fill="#7E9C73" opacity="0.8" />
          <path d="M12 2C10 6 9 12 12 22" stroke="#5C7A52" strokeWidth="0.8" />
        </svg>
      </div>

      <div className="max-w-4xl mx-auto px-4 pt-6 md:pt-10 relative z-10">
        
        {/* ==========================================
            1. TOP BAR
           ========================================== */}
        <div className="bg-white/40 border border-white/30 backdrop-blur-xl rounded-[32px] p-5 md:p-6 shadow-[0_24px_70px_-15px_rgba(43,33,24,0.12)] mb-6 flex flex-col sm:flex-row items-center justify-between gap-4 select-none">
          <div className="flex items-center gap-4 w-full sm:w-auto min-w-0">
            <button
              onClick={() => navigate('/customer/home')}
              className="w-12 h-12 rounded-2xl bg-white/70 border border-charcoal/10 flex items-center justify-center hover:bg-cream/40 transition-all cursor-pointer active:scale-95 shrink-0"
              title="Back to Home"
            >
              <svg className="w-5 h-5 text-charcoal/80" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="text-left min-w-0">
              <p className="text-[10px] text-[#2B2118]/50 font-bold uppercase tracking-wider font-body">
                HISTORY
              </p>
              <h1 className="font-display text-2xl md:text-3xl font-extrabold text-[#2B2118] leading-tight">
                My Order History
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center sm:justify-end gap-3 w-full sm:w-auto shrink-0">
            {/* Desktop Navigation Menu (hidden on mobile, visible on larger screens) */}
            <div className="hidden md:flex items-center gap-3 mr-2">
              {/* Home Button */}
              <button
                onClick={() => navigate('/customer/home')}
                className="w-12 h-12 rounded-2xl border border-charcoal/10 flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 shadow-sm cursor-pointer bg-white/70 text-charcoal/80 hover:bg-[#5C7A52]/10 hover:text-[#5C7A52]"
                title="Home Dashboard"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </button>

              {/* Dashboard Button */}
              <button
                onClick={() => navigate('/customer/dashboard')}
                className="w-12 h-12 rounded-2xl border border-charcoal/10 flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 shadow-sm cursor-pointer bg-white/70 text-charcoal/80 hover:bg-[#5C7A52]/10 hover:text-[#5C7A52]"
                title="My Activity Dashboard"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </button>

              {/* Subscriptions Button */}
              <button
                onClick={() => navigate('/customer/subscriptions')}
                className="w-12 h-12 rounded-2xl border border-charcoal/10 flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 shadow-sm cursor-pointer bg-white/70 text-charcoal/80 hover:bg-[#5C7A52]/10 hover:text-[#5C7A52]"
                title="Subscription Management"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                </svg>
              </button>

              {/* Connections Button */}
              <button
                onClick={() => navigate('/customer/connections')}
                className="w-12 h-12 rounded-2xl border border-charcoal/10 flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 shadow-sm cursor-pointer bg-white/70 text-charcoal/80 hover:bg-[#5C7A52]/10 hover:text-[#5C7A52]"
                title="My Connections"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </button>

              {/* Messages Button */}
              <button
                onClick={() => navigate('/customer/chat')}
                className="w-12 h-12 rounded-2xl border border-charcoal/10 flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 shadow-sm cursor-pointer bg-white/70 text-charcoal/80 hover:bg-[#5C7A52]/10 hover:text-[#5C7A52]"
                title="Messages"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </button>

              {/* History Button */}
              <button
                onClick={() => navigate('/customer/history')}
                className="w-12 h-12 rounded-2xl border border-charcoal/10 flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 shadow-sm cursor-pointer bg-[#5C7A52] text-white"
                title="Order History"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
            </div>

            {/* Wallet Balance Pill */}
            <div className="bg-[#5C7A52]/10 border border-[#5C7A52]/20 rounded-2xl px-4 py-2 flex items-center gap-2 select-none shadow-sm bg-white/30 shrink-0">
              <svg className="w-4 h-4 text-[#5C7A52]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <div className="text-left font-body">
                <p className="text-[9px] uppercase tracking-wider font-bold text-[#2B2118]/40 leading-none">
                  Wallet Balance
                </p>
                <p className="text-sm font-extrabold text-[#5C7A52] leading-none mt-1">
                  ₹{walletBalance.toFixed(2)}
                </p>
              </div>
            </div>

            {/* Initials Avatar */}
            <div className="w-12 h-12 rounded-2xl bg-[#5C7A52]/10 border border-[#5C7A52]/20 flex items-center justify-center text-[#5C7A52] font-display font-extrabold shrink-0 shadow-sm">
              {getInitials()}
            </div>
          </div>
        </div>

        {/* Mobile Sub-Navbar */}
        <MobileNavbar role="customer" activeTab="history" />

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-800 rounded-2xl flex items-start gap-3 shadow-sm animate-scale-up">
            <svg className="w-5 h-5 text-red-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div className="text-sm font-semibold flex-1">{error}</div>
          </div>
        )}

        {/* ==========================================
            1.5 DATE RANGE FILTER BAR
           ========================================== */}
        {!loading && history.length > 0 && (
          <div className="bg-white/30 border border-white/20 backdrop-blur-md rounded-[28px] p-4 mb-6 shadow-sm flex flex-col gap-4 select-none animate-scale-up">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#2B2118]/50 mr-2 font-body">
                Filter by Date:
              </span>
              {[
                { id: 'all', label: 'All Time' },
                { id: 'today', label: 'Today' },
                { id: '7days', label: 'Last 7 Days' },
                { id: '30days', label: 'Last 30 Days' },
                { id: 'custom', label: 'Custom Range' },
              ].map((preset) => {
                const isActive = dateFilter === preset.id;
                return (
                  <button
                    key={preset.id}
                    onClick={() => setDateFilter(preset.id as any)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#5C7A52] text-white shadow-[0_4px_12px_rgba(92,122,82,0.18)] border border-[#5C7A52]'
                        : 'bg-white/40 text-[#2B2118]/60 border border-[#2B2118]/10 hover:bg-white/60'
                    }`}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>

            {dateFilter === 'custom' && (
              <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-[#2B2118]/10 animate-scale-up">
                <div className="flex items-center gap-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#2B2118]/50 font-body">
                    From:
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="bg-white/60 border border-white/40 rounded-xl px-3 py-1.5 text-xs text-[#2B2118] focus:outline-none focus:ring-2 focus:ring-[#5C7A52]/20 focus:border-[#5C7A52]"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#2B2118]/50 font-body">
                    To:
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="bg-white/60 border border-white/40 rounded-xl px-3 py-1.5 text-xs text-[#2B2118] focus:outline-none focus:ring-2 focus:ring-[#5C7A52]/20 focus:border-[#5C7A52]"
                  />
                </div>
                {(startDate || endDate) && (
                  <button
                    onClick={() => {
                      setStartDate('');
                      setEndDate('');
                    }}
                    className="text-[10px] text-red-600 hover:underline uppercase font-bold tracking-wider cursor-pointer sm:ml-auto"
                  >
                    Clear Dates
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* ==========================================
            2. SUMMARY STATS BAR
           ========================================== */}
        {!loading && history.length > 0 && (
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-white/40 border border-white/25 backdrop-blur-md rounded-[24px] p-4 text-center shadow-sm">
              <p className="font-display text-2xl font-extrabold text-[#5C7A52]">
                {stats.totalOrders}
              </p>
              <p className="text-[9px] text-[#2B2118]/50 font-bold uppercase tracking-widest font-body mt-1">
                Total Orders
              </p>
            </div>
            <div className="bg-white/40 border border-white/25 backdrop-blur-md rounded-[24px] p-4 text-center shadow-sm">
              <p className="font-display text-2xl font-extrabold text-[#5C7A52]">
                ₹{stats.totalSpent}
              </p>
              <p className="text-[9px] text-[#2B2118]/50 font-bold uppercase tracking-widest font-body mt-1">
                Total Spent
              </p>
            </div>
            <div className="bg-white/40 border border-white/25 backdrop-blur-md rounded-[24px] p-4 text-center shadow-sm">
              <p className="font-display text-2xl font-extrabold text-[#5C7A52]">
                {stats.uniqueVendors}
              </p>
              <p className="text-[9px] text-[#2B2118]/50 font-bold uppercase tracking-widest font-body mt-1">
                Active Kitchens
              </p>
            </div>
          </div>
        )}

        {/* ==========================================
            3. MAIN HISTORY LIST / SKELETONS / EMPTY STATE
           ========================================== */}
        {loading ? (
          <div className="space-y-6">
            {/* Skeleton Stats */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              {[1, 2, 3].map((n) => (
                <div key={n} className="bg-white/20 border border-white/10 rounded-[20px] p-4 h-20 animate-pulse" />
              ))}
            </div>
            {/* Skeleton Cards */}
            {[1, 2, 3].map((n) => (
              <div key={n} className="bg-white/30 border border-white/15 rounded-[24px] p-5 h-44 animate-pulse space-y-4">
                <div className="flex justify-between">
                  <div className="h-6 w-48 bg-charcoal/10 rounded" />
                  <div className="h-6 w-16 bg-charcoal/10 rounded" />
                </div>
                <div className="h-px bg-charcoal/5" />
                <div className="space-y-2">
                  <div className="h-4.5 w-36 bg-charcoal/10 rounded" />
                  <div className="h-3 w-56 bg-charcoal/10 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : history.length === 0 ? (
          /* Empty State */
          <div className="bg-white/30 backdrop-blur-md border border-[#2B2118]/10 border-dashed rounded-[32px] p-12 text-center flex flex-col items-center justify-center min-h-[360px] shadow-sm max-w-lg mx-auto animate-scale-up mt-8">
            <div className="w-20 h-24 mb-6 text-[#5C7A52]/40">
              <svg viewBox="0 0 100 120" fill="none" className="w-full h-full stroke-current">
                <path d="M 32,32 C 32,13 68,13 68,32" strokeWidth="2.5" strokeLinecap="round" />
                <path d="M 44,14 L 56,14" strokeWidth="3.5" strokeLinecap="round" />
                <path d="M 27,32 L 27,105" strokeWidth="2.5" strokeLinecap="round" />
                <path d="M 73,32 L 73,105" strokeWidth="2.5" strokeLinecap="round" />
                <rect x="30" y="34" width="40" height="20" rx="3" strokeWidth="2" />
                <rect x="30" y="58" width="40" height="20" rx="3" strokeWidth="2" />
                <rect x="30" y="82" width="40" height="22" rx="4" strokeWidth="2" />
              </svg>
            </div>
            <h3 className="font-display text-2xl font-bold text-charcoal mb-3">
              No order history yet
            </h3>
            <p className="text-xs text-[#2B2118]/50 max-w-xs leading-relaxed mb-6 font-body">
              No order history yet. Start ordering to see your tiffin journey here!
            </p>
            <button
              onClick={() => navigate('/customer/home')}
              className="py-3.5 px-6 rounded-2xl bg-[#5C7A52] hover:bg-[#4a6342] text-white font-display font-bold text-xs uppercase tracking-wider shadow-[0_8px_25px_rgba(92,122,82,0.25)] transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer"
            >
              Browse Vendors
            </button>
          </div>
        ) : (
          <div className="space-y-4 animate-scale-up">
            {filteredHistory.length === 0 ? (
              <div className="bg-white/30 backdrop-blur-md border border-[#2B2118]/10 border-dashed rounded-[32px] p-12 text-center flex flex-col items-center justify-center min-h-[240px] shadow-sm max-w-lg mx-auto animate-scale-up mt-8">
                <p className="text-3xl mb-3 select-none">📅</p>
                <h3 className="font-display text-lg font-bold text-charcoal mb-2">
                  No orders in this range
                </h3>
                <p className="text-xs text-[#2B2118]/50 max-w-xs leading-relaxed font-body">
                  No orders found for the selected time filter. Try choosing a different range.
                </p>
              </div>
            ) : (
              filteredHistory.map((item, index) => {
                const currentDateStr = formatDateString(item.date);
                const prevDateStr = index > 0 ? formatDateString(filteredHistory[index - 1].date) : null;
                const showDateSeparator = currentDateStr !== prevDateStr;

                return (
                  <React.Fragment key={`${item.date}-${item.vendorName}-${index}`}>
                    {showDateSeparator && (
                      <div className="my-6 pt-4 flex justify-center">
                        <div className="text-[11px] font-bold uppercase tracking-wider text-charcoal/50 bg-white/40 border border-white/20 px-4 py-1.5 rounded-full mx-auto w-fit shadow-xs">
                          {currentDateStr}
                        </div>
                      </div>
                    )}

                    {/* VENDOR DAY CARD */}
                    <div className="bg-white/40 backdrop-blur-md border border-white/20 rounded-[24px] p-5 shadow-sm">
                      {/* Card Header */}
                      <div className="flex justify-between items-center mb-4">
                        <h2 className="font-display font-bold text-lg text-charcoal truncate pr-2">
                          {item.vendorName}
                        </h2>
                        <span className="font-display font-bold text-xl text-[#5C7A52] shrink-0">
                          ₹{item.totalSpent}
                        </span>
                      </div>

                      {/* Orders List inside Card */}
                      <div className="space-y-4">
                        {item.orders.map((order, orderIdx) => (
                          <div
                            key={`${order.session}-${orderIdx}`}
                            className="border-t border-[#2B2118]/8 pt-3.5 mt-3.5 first:border-t-0 first:pt-0 first:mt-0"
                          >
                            {/* Order Row Header */}
                            <div className="flex items-center justify-between gap-3 mb-2.5">
                              <div className="flex items-center gap-2">
                                {getSessionBadge(order.session)}
                                {getStatusBadge(order.status)}
                              </div>
                              <span className="text-sm font-bold text-charcoal/80 shrink-0">
                                ₹{order.totalAmount}
                              </span>
                            </div>

                            {/* Items List */}
                            <div className="space-y-1 pl-1">
                              {/* Tiers */}
                              {order.items
                                ?.filter((itm) => itm.type === 'tier')
                                .map((itm, itmIdx) => (
                                  <div key={`tier-${itmIdx}`} className="text-xs font-body text-charcoal/70">
                                    <span className="font-extrabold">{itm.quantity}×</span> {itm.name}{' '}
                                    <span className="text-[10px] text-charcoal/40 font-normal">₹{itm.price} each</span>
                                  </div>
                                ))}

                              {/* Addons */}
                              {order.items
                                ?.filter((itm) => itm.type === 'addon')
                                .map((itm, itmIdx) => (
                                  <div key={`addon-${itmIdx}`} className="text-xs font-body text-charcoal/50">
                                    <span>+ </span>
                                    <span className="font-extrabold">{itm.quantity}×</span> {itm.name}{' '}
                                    <span className="text-[10px] text-charcoal/40 font-normal">₹{itm.price} each</span>
                                  </div>
                                ))}
                            </div>

                            {/* Profile Indicator */}
                            {order.profile && order.profile.toLowerCase() !== 'myself' && (
                              <div className="mt-2 text-[10px] text-charcoal/50 font-body flex items-center gap-1 select-none">
                                <span>👤</span>
                                <span>{order.profile}</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </React.Fragment>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerHistory;
