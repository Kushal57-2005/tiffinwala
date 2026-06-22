import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../utils/api';
import { useAuthStore } from '../../store/authStore';
import tiffinBg from '../../assets/slate_spices_bg.png';
import { MobileNavbar } from '../../components/MobileNavbar';
import { DashboardHeader } from '../../components/DashboardHeader';

// ==========================================
// TYPES & PROP INTERFACES
// ==========================================

export interface VendorDashboardData {
  totalTiffins: number;
  totalRevenue: number;
  platformFee: number;
  netEarnings: number;
  customerStats: {
    customerId: string;
    name: string;
    totalSpent: number;
    orders: number;
  }[];
  monthlyPayslip: {
    year: number;
    month: number;
    revenue: number;
    platformFee: number;
    netEarnings: number;
  }[];
}

// ==========================================
// DUMMY REFERENCE DATA
// ==========================================

const dummyWeekData: VendorDashboardData = {
  totalTiffins: 14,
  totalRevenue: 2800,
  platformFee: 280,
  netEarnings: 2520,
  customerStats: [
    {
      customerId: 'c1',
      name: 'Pranav Kshirsagar',
      totalSpent: 1600,
      orders: 8,
    },
    {
      customerId: 'c2',
      name: 'Siddesh Ghadage',
      totalSpent: 1200,
      orders: 6,
    },
  ],
  monthlyPayslip: [
    {
      year: 2026,
      month: 6,
      revenue: 2800,
      platformFee: 280,
      netEarnings: 2520,
    },
  ],
};

const dummyMonthData: VendorDashboardData = {
  totalTiffins: 58,
  totalRevenue: 11600,
  platformFee: 1160,
  netEarnings: 10440,
  customerStats: [
    {
      customerId: 'c1',
      name: 'Pranav Kshirsagar',
      totalSpent: 6400,
      orders: 32,
    },
    {
      customerId: 'c2',
      name: 'Siddesh Ghadage',
      totalSpent: 5200,
      orders: 26,
    },
  ],
  monthlyPayslip: [
    {
      year: 2026,
      month: 6,
      revenue: 11600,
      platformFee: 1160,
      netEarnings: 10440,
    },
    {
      year: 2026,
      month: 5,
      revenue: 9800,
      platformFee: 980,
      netEarnings: 8820,
    },
  ],
};

export const VendorDashboard: React.FC = () => {
  const navigate = useNavigate();
  const authUser = useAuthStore((state) => state.user);

  // Local states
  const [filter, setFilter] = useState<'week' | 'month'>('week');
  const [loading, setLoading] = useState<boolean>(true);
  const [data, setData] = useState<VendorDashboardData | null>(null);
  const [businessName, setBusinessName] = useState<string>('');
  const [walletBalance, setWalletBalance] = useState<number>(0);

  // Simulation configurations for review/debugging
  const [simulateEmpty, setSimulateEmpty] = useState<boolean>(false);
  const [showDevTools, setShowDevTools] = useState<boolean>(false);

  // Parallax Mouse coordinates
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent) => {
    const { clientX, clientY } = e;
    const x = (clientX - window.innerWidth / 2) / 45;
    const y = (clientY - window.innerHeight / 2) / 45;
    setMousePos({ x, y });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Fetch vendor profile fallback info
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get('/vendor/profile');
        if (res.data?.success && res.data?.data) {
          const profile = res.data.data;
          setBusinessName(profile.businessName || 'Annapurna Rasoi');
          setWalletBalance(profile.walletBalance || 0);
        }
      } catch (err) {
        console.error('Error loading vendor profile on dashboard:', err);
        if (authUser) {
          setBusinessName(`${authUser.firstName} ${authUser.lastName}` || 'Annapurna Rasoi');
        }
      }
    };

    fetchProfile();
  }, [authUser]);

  // Real API fetch handler for Vendor Dashboard stats
  useEffect(() => {
    const loadDashboardData = async () => {
      setLoading(true);
      try {
        if (simulateEmpty) {
          setData({
            totalTiffins: 0,
            totalRevenue: 0,
            platformFee: 0,
            netEarnings: 0,
            customerStats: [],
            monthlyPayslip: [],
          });
          setLoading(false);
          return;
        }

        const res = await api.get(`/vendor/dashboard?filter=${filter}`);
        if (res.data?.success && res.data?.data) {
          setData(res.data.data);
        } else {
          // Fallback to dummy data
          setData(filter === 'week' ? dummyWeekData : dummyMonthData);
        }
      } catch (err) {
        console.error('Error fetching vendor dashboard data from API:', err);
        // Fallback to local dummy data for demonstration
        setData(filter === 'week' ? dummyWeekData : dummyMonthData);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [filter, simulateEmpty]);

  // Sort customerStats descending by totalSpent
  const sortedCustomerStats = React.useMemo(() => {
    if (!data?.customerStats) return [];
    return [...data.customerStats].sort((a, b) => b.totalSpent - a.totalSpent);
  }, [data]);

  return (
    <div
      onMouseMove={handleMouseMove}
      className="min-h-screen bg-[#FBF4EC] font-body text-[#2B2118] pb-24 relative overflow-hidden select-text transition-all duration-300"
    >
      {/* Custom Embedded Keyframes and Styles */}
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
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-scale-up { animation: scale-up 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-spin-slow { animation: spin-slow 15s linear infinite; }
        .floating-leaf { animation: float-slow 7s ease-in-out infinite; }
        .floating-anise { animation: float-medium 9s ease-in-out infinite; }
        .floating-cardamom { animation: float-slow 6s ease-in-out infinite; }
        .floating-chili { animation: float-reverse 9s ease-in-out infinite; }
        .floating-leaf-2 { animation: float-fast 6s ease-in-out infinite; }

        /* Premium Scrollbar */
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(224, 101, 58, 0.2);
          border-radius: 9999px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(224, 101, 58, 0.4);
        }
      `}</style>

      {/* Background Texture Overlay */}
      <img
        src={tiffinBg}
        alt=""
        className="absolute inset-0 w-full h-full object-cover opacity-[0.025] mix-blend-multiply pointer-events-none select-none z-0"
      />

      {/* Ambient Glows */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full blur-[130px] bg-[#E0653A]/10 transition-all duration-1000" />
        <div className="absolute top-1/2 right-0 w-[500px] h-[500px] rounded-full blur-[150px] bg-[#D2996A]/10 transition-all duration-1000" />
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
            fill="#E0653A"
            opacity="0.25"
          />
        </svg>
      </div>

      <div
        style={{
          transform: `translate3d(${mousePos.x * -0.7}px, ${mousePos.y * -0.7}px, 0)`,
          transition: 'transform 0.15s ease-out',
        }}
        className="absolute top-[28%] right-[8%] floating-leaf-2 opacity-60 pointer-events-none z-10 hidden md:block"
      >
        <svg width="40" height="50" viewBox="0 0 24 30" fill="none">
          <path
            d="M12 2C12 2 3 9 4 20C5 28 12 28 12 28C12 28 19 28 20 20C21 9 12 2 12 2Z"
            fill="#E0653A"
            opacity="0.15"
          />
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
          <path d="M12 2C8 6 6 12 12 22C18 12 16 6 12 2Z" fill="#D2996A" opacity="0.4" />
        </svg>
      </div>

      <div
        style={{
          transform: `translate3d(${mousePos.x * -0.5}px, ${mousePos.y * -0.5}px, 0)`,
          transition: 'transform 0.15s ease-out',
        }}
        className="absolute top-[62%] right-[5%] floating-chili opacity-75 pointer-events-none z-10 hidden md:block"
      >
        <svg width="50" height="25" viewBox="0 0 50 25" fill="none">
          <path
            d="M2 18C15 8 35 8 48 18"
            stroke="#8C5B3E"
            strokeWidth="3.5"
            strokeLinecap="round"
            opacity="0.75"
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
          <circle cx="12" cy="12" r="3" fill="#E0653A" opacity="0.6" />
        </svg>
      </div>

      {/* Main Layout Container */}
      <div className="max-w-6xl mx-auto px-4 pt-6 md:pt-10 relative z-10">
        
        {/* ==========================================
            1. TOP BAR (via shared DashboardHeader)
           ========================================== */}
        <DashboardHeader
          role="vendor"
          subpageTitle="Business Overview"
          passedWalletBalance={walletBalance}
          passedName={businessName}
        />

        {/* Mobile Sub-Navbar */}
        <MobileNavbar role="vendor" activeTab="dashboard" />

        {/* ==========================================
            2. FILTER TABS ROW
           ========================================== */}
        <div className="flex flex-wrap justify-between items-center gap-4 mb-8 select-none">
          <div className="flex gap-1 bg-white/50 border border-charcoal/10 p-1 rounded-2xl backdrop-blur-md shadow-xs">
            {(['week', 'month'] as const).map((filterOpt) => {
              const isActive = filter === filterOpt;
              return (
                <button
                  key={filterOpt}
                  type="button"
                  onClick={() => setFilter(filterOpt)}
                  className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest font-body transition-all duration-300 cursor-pointer ${
                    isActive
                      ? 'bg-[#E0653A] text-white shadow-sm font-extrabold scale-102'
                      : 'text-[#2B2118]/60 hover:text-charcoal hover:bg-white/30'
                  }`}
                >
                  {filterOpt === 'week' ? 'This Week' : 'This Month'}
                </button>
              );
            })}
          </div>

          <div className="text-xs text-charcoal/50 font-bold font-body tracking-wider uppercase hidden sm:block">
            Dashboard • <span className="text-[#E0653A]">{filter === 'week' ? 'Weekly Ledger' : 'Monthly Ledger'}</span>
          </div>
        </div>

        {/* MAIN BODY AREA */}
        {loading ? (
          <div className="space-y-8 animate-pulse">
            {/* Stat Cards skeleton */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="bg-white/50 border border-charcoal/10 rounded-[32px] p-6 h-36 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="h-3 w-16 bg-charcoal/10 rounded" />
                    <div className="h-8 w-24 bg-charcoal/10 rounded-lg" />
                  </div>
                  <div className="h-10 w-full bg-charcoal/5 rounded-xl" />
                </div>
              ))}
            </div>
            
            {/* Split body skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Column (Customer breakdown) */}
              <div className="lg:col-span-7 space-y-4">
                <div className="h-6 w-48 bg-charcoal/10 rounded" />
                <div className="space-y-3">
                  {[1, 2, 3].map((n) => (
                    <div key={n} className="bg-white/50 border border-charcoal/10 rounded-[24px] p-5 h-20" />
                  ))}
                </div>
              </div>
              {/* Right Column (Monthly Payslip) */}
              <div className="lg:col-span-5 space-y-4">
                <div className="h-6 w-40 bg-charcoal/10 rounded" />
                <div className="space-y-3">
                  {[1, 2].map((n) => (
                    <div key={n} className="bg-white/50 border border-charcoal/10 rounded-[24px] p-5 h-24" />
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : simulateEmpty || !data || data.totalTiffins === 0 ? (
          <div className="bg-white/30 backdrop-blur-md border border-[#2B2118]/10 border-dashed rounded-[32px] p-12 text-center flex flex-col items-center justify-center min-h-[400px] shadow-sm max-w-lg mx-auto animate-scale-up">
            <div className="w-24 h-24 mb-6 text-[#E0653A]/40">
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
            <h3 className="font-display text-2xl font-bold text-charcoal mb-2">
              No sales yet this {filter === 'week' ? 'week' : 'month'}
            </h3>
            <p className="text-sm text-[#2B2118]/50 max-w-xs leading-relaxed mb-8 font-body">
              Orders will appear here once customers start ordering!
            </p>
            <button
              onClick={() => navigate('/vendor/home')}
              className="py-3.5 px-6 rounded-2xl bg-[#E0653A] hover:bg-[#c2512a] text-white font-display font-bold text-xs uppercase tracking-wider shadow-[0_8px_25px_rgba(224,101,58,0.25)] transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer"
            >
              Go to Culinary Pitch
            </button>
          </div>
        ) : (
          <div className="space-y-8 animate-scale-up">
            
            {/* ==========================================
                3. STAT CARDS ROW
               ========================================== */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Card 1: Total Tiffins */}
              <div className="bg-white/70 border border-charcoal/10 rounded-[32px] p-6 md:p-8 shadow-sm flex flex-col justify-between transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 hover:border-[#E0653A]/20 relative overflow-hidden group">
                <div>
                  <p className="text-[10px] uppercase font-bold tracking-widest text-charcoal/40 font-body">
                    Total Tiffins
                  </p>
                  <p className="text-3xl md:text-4xl font-display font-extrabold text-charcoal mt-3 tracking-tight">
                    {data.totalTiffins}
                  </p>
                </div>
                <div className="flex justify-between items-center mt-4">
                  <span className="text-[11px] text-charcoal/50 font-body">Delivered tiffins</span>
                  <div className="w-10 h-10 bg-[#E0653A]/10 border border-[#E0653A]/20 rounded-xl flex items-center justify-center shrink-0 shadow-xs">
                    <svg className="w-5 h-5 text-[#E0653A]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v3M8 6h8c1.5 0 2 1 2 2v10c0 1.5-.5 2-2 2H8c-1.5 0-2-.5-2-2V8c0-1 .5-2 2-2z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 10h12M6 14h12" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Card 2: Total Revenue */}
              <div className="bg-white/70 border border-charcoal/10 rounded-[32px] p-6 md:p-8 shadow-sm flex flex-col justify-between transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 hover:border-[#E0653A]/20 relative overflow-hidden group">
                <div>
                  <p className="text-[10px] uppercase font-bold tracking-widest text-charcoal/40 font-body">
                    Total Revenue
                  </p>
                  <p className="text-3xl md:text-4xl font-display font-extrabold text-charcoal mt-3 tracking-tight">
                    ₹{data.totalRevenue}
                  </p>
                </div>
                <div className="flex justify-between items-center mt-4">
                  <span className="text-[11px] text-charcoal/50 font-body">Gross sales</span>
                  <div className="w-10 h-10 bg-[#E0653A]/10 border border-[#E0653A]/20 rounded-xl flex items-center justify-center shrink-0 shadow-xs">
                    <svg className="w-5 h-5 text-[#E0653A]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Card 3: Platform Fee */}
              <div className="bg-white/70 border border-charcoal/10 rounded-[32px] p-6 md:p-8 shadow-sm flex flex-col justify-between transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 hover:border-[#E0653A]/20 relative overflow-hidden group">
                <div>
                  <p className="text-[10px] uppercase font-bold tracking-widest text-charcoal/40 font-body">
                    Platform Fee
                  </p>
                  <p className="text-2xl md:text-3xl font-display font-bold text-charcoal/60 mt-3 tracking-tight">
                    ₹{data.platformFee}
                  </p>
                </div>
                <div className="flex justify-between items-center mt-4">
                  <span className="text-[11px] text-charcoal/40 font-body">10% Platform fee</span>
                  <div className="w-10 h-10 bg-[#E0653A]/5 border border-charcoal/10 rounded-xl flex items-center justify-center shrink-0 shadow-xs">
                    <svg className="w-5 h-5 text-charcoal/50" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 14l6-6m-5.5.5h.01m5.99 5h.01M3 21h18M3 10h18M3 7h18M4 4h16" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Card 4: Net Earnings */}
              <div className="bg-white/70 border border-charcoal/10 rounded-[32px] p-6 md:p-8 shadow-sm flex flex-col justify-between transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 hover:border-[#E0653A]/30 relative overflow-hidden group">
                <div>
                  <p className="text-[10px] uppercase font-bold tracking-widest text-charcoal/40 font-body">
                    Net Earnings
                  </p>
                  <p className="text-4xl md:text-5xl font-display font-extrabold text-[#E0653A] mt-2 tracking-tight">
                    ₹{data.netEarnings}
                  </p>
                </div>
                <div className="flex justify-between items-center mt-4">
                  <span className="text-[11px] text-charcoal/50 font-body">Take home earnings</span>
                  <div className="w-10 h-10 bg-[#E0653A]/20 border border-[#E0653A]/30 rounded-xl flex items-center justify-center shrink-0 shadow-xs">
                    <svg className="w-5 h-5 text-[#E0653A]" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Split dashboard sections */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Left Column: Customer Breakdown */}
              {/* ==========================================
                  4. CUSTOMER BREAKDOWN SECTION
                 ========================================== */}
              <section className="lg:col-span-7 space-y-4">
                <div className="flex items-center gap-3">
                  <h2 className="font-display text-2xl font-bold text-charcoal">
                    Top Customers
                  </h2>
                  <span className="px-2.5 py-1 rounded-full bg-[#E0653A]/10 text-[#E0653A] text-xs font-bold font-body">
                    {data.customerStats.length} {data.customerStats.length === 1 ? 'Customer' : 'Customers'}
                  </span>
                </div>
                
                {sortedCustomerStats.length === 0 ? (
                  <div className="bg-white/30 backdrop-blur-md border border-[#2B2118]/10 border-dashed rounded-[32px] p-8 text-center flex flex-col items-center justify-center min-h-[180px] shadow-sm">
                    <h3 className="font-display text-base font-bold text-charcoal mb-1">
                      No customers yet this {filter === 'week' ? 'week' : 'month'}
                    </h3>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {sortedCustomerStats.map((cust) => (
                      <div
                        key={cust.customerId}
                        className="bg-white/70 border border-charcoal/10 rounded-[28px] p-5 shadow-sm hover:shadow-md hover:border-[#E0653A]/30 transition-all duration-300 flex items-center justify-between group"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-[#E0653A]/10 border border-[#E0653A]/20 flex items-center justify-center shrink-0">
                            <span className="text-sm font-display font-extrabold text-[#E0653A]">
                              {getInitials(cust.name)}
                            </span>
                          </div>
                          <div>
                            <h3 className="font-display font-bold text-base text-charcoal group-hover:text-[#E0653A] transition-colors leading-tight">
                              {cust.name}
                            </h3>
                            <span className="text-xs font-semibold text-charcoal/50 mt-0.5 block select-none">
                              {cust.orders} {cust.orders === 1 ? 'order' : 'orders'}
                            </span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="font-display font-extrabold text-xl text-[#E0653A] tracking-tight">
                            ₹{cust.totalSpent}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Right Column: Monthly Payslip */}
              {/* ==========================================
                  5. MONTHLY PAYSLIP SECTION
                 ========================================== */}
              <section className="lg:col-span-5 space-y-4">
                <h2 className="font-display text-2xl font-bold text-charcoal">
                  Monthly Payslips
                </h2>

                <div className="space-y-4 pr-1">
                  {data.monthlyPayslip.length === 0 ? (
                    <div className="bg-white/40 border border-charcoal/10 rounded-[24px] p-8 text-center text-xs font-bold uppercase tracking-wider text-charcoal/40 font-body">
                      No payslips generated yet
                    </div>
                  ) : (
                    data.monthlyPayslip.map((slip, index) => (
                      <div
                        key={index}
                        className="bg-white/70 border border-charcoal/10 rounded-[24px] p-5 shadow-sm hover:border-[#E0653A]/20 hover:bg-white/90 hover:shadow-md transition-all duration-300 relative overflow-hidden group space-y-4"
                      >
                        <div className="flex justify-between items-center pb-2 border-b border-charcoal/5">
                          <h3 className="font-display font-bold text-base text-charcoal group-hover:text-[#E0653A] transition-colors leading-tight">
                            {monthNames[slip.month - 1]} {slip.year}
                          </h3>
                        </div>

                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div>
                            <p className="text-[9px] uppercase font-bold text-charcoal/40 font-body">
                              Revenue
                            </p>
                            <p className="text-sm font-extrabold text-charcoal mt-1">
                              ₹{slip.revenue}
                            </p>
                          </div>
                          <div>
                            <p className="text-[9px] uppercase font-bold text-charcoal/40 font-body">
                              Platform Fee
                            </p>
                            <p className="text-sm font-bold text-charcoal/60 mt-1">
                              ₹{slip.platformFee}
                            </p>
                          </div>
                          <div>
                            <p className="text-[9px] uppercase font-bold text-[#E0653A]/80 font-body">
                              Net Earnings
                            </p>
                            <p className="text-sm font-extrabold text-[#E0653A] mt-1">
                              ₹{slip.netEarnings}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>

            </div>

          </div>
        )}

      </div>

      {/* FLOATING DEV SIMULATOR BUTTON & TOOLKIT PANEL */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          type="button"
          onClick={() => setShowDevTools(!showDevTools)}
          className="w-12 h-12 rounded-full bg-white/90 border border-charcoal/10 shadow-lg backdrop-blur-md text-charcoal/60 hover:text-[#E0653A] hover:scale-110 active:scale-95 transition-all duration-300 flex items-center justify-center cursor-pointer focus:outline-none"
          title="Simulator Settings"
        >
          <svg className="w-6 h-6 animate-spin-slow text-charcoal/70" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>

        {showDevTools && (
          <div className="absolute right-0 bottom-14 w-64 bg-white/95 border border-charcoal/10 rounded-2xl shadow-xl p-4 backdrop-blur-md animate-scale-up z-50 text-xs">
            <div className="flex justify-between items-center border-b border-charcoal/5 pb-2 mb-3">
              <span className="font-display font-bold text-charcoal">Simulation Tools</span>
              <button
                type="button"
                onClick={() => setShowDevTools(false)}
                className="text-[10px] font-bold uppercase tracking-wider text-charcoal/40 hover:text-charcoal cursor-pointer focus:outline-none"
              >
                Close
              </button>
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-2.5 cursor-pointer py-1 select-none">
                <input
                  type="checkbox"
                  checked={simulateEmpty}
                  onChange={(e) => setSimulateEmpty(e.target.checked)}
                  className="w-4 h-4 rounded border-charcoal/20 text-[#E0653A] focus:ring-[#E0653A] cursor-pointer"
                />
                <span className="font-semibold text-charcoal/80">Simulate Empty State</span>
              </label>
              <p className="text-[10px] text-charcoal/40 font-body leading-normal">
                Toggle this to test how the dashboard behaves when no sales or metrics are available.
              </p>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};
