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

export interface DashboardData {
  totalTiffins: number;
  totalAmount: number;
  vendorStats: {
    vendorId: string;
    vendorName: string;
    totalAmount: number;
    totalTiffins: number;
  }[];
  profileStats: {
    profile: string;
    totalQuantity: number;
    totalAmount: number;
  }[];
  dailyBreakdown: {
    _id: string;
    date: string;
    vendorName: string;
    tiers: { name: string; quantity: number; profile?: string }[];
    addOns: { name: string; quantity: number; profile?: string }[];
  }[];
}

// ==========================================
// DUMMY REFERENCE DATA
// ==========================================

const dummyWeekData: DashboardData = {
  totalTiffins: 7,
  totalAmount: 850,
  vendorStats: [
    {
      vendorId: 'v1',
      vendorName: 'ShivShree Tiffin',
      totalAmount: 600,
      totalTiffins: 5,
    },
    {
      vendorId: 'v2',
      vendorName: 'Annapurna Rasoi',
      totalAmount: 250,
      totalTiffins: 2,
    },
  ],
  profileStats: [
    {
      profile: 'Myself',
      totalQuantity: 4,
      totalAmount: 480,
    },
    {
      profile: 'Kushal',
      totalQuantity: 2,
      totalAmount: 250,
    },
    {
      profile: 'Shivtej',
      totalQuantity: 1,
      totalAmount: 120,
    },
  ],
  dailyBreakdown: [
    {
      _id: 'db1',
      date: '2026-06-21T13:00:00.000Z',
      vendorName: 'ShivShree Tiffin',
      tiers: [
        { name: 'Regular Thali', quantity: 2, profile: 'Myself' },
        { name: 'Misal Pav', quantity: 1, profile: 'Kushal' },
      ],
      addOns: [
        { name: 'Solkadhi', quantity: 1, profile: 'Myself' },
      ],
    },
    {
      _id: 'db2',
      date: '2026-06-19T20:30:00.000Z',
      vendorName: 'Annapurna Rasoi',
      tiers: [
        { name: 'Regular Thali', quantity: 1, profile: 'Shivtej' },
        { name: 'Deluxe Thali', quantity: 1, profile: 'Kushal' },
      ],
      addOns: [],
    },
    {
      _id: 'db3',
      date: '2026-06-18T12:45:00.000Z',
      vendorName: 'ShivShree Tiffin',
      tiers: [
        { name: 'Regular Thali', quantity: 2, profile: 'Myself' },
      ],
      addOns: [
        { name: 'Extra Roti', quantity: 2, profile: 'Myself' },
      ],
    },
  ],
};

const dummyMonthData: DashboardData = {
  totalTiffins: 22,
  totalAmount: 2850,
  vendorStats: [
    {
      vendorId: 'v1',
      vendorName: 'ShivShree Tiffin',
      totalAmount: 1800,
      totalTiffins: 14,
    },
    {
      vendorId: 'v2',
      vendorName: 'Annapurna Rasoi',
      totalAmount: 1050,
      totalTiffins: 8,
    },
  ],
  profileStats: [
    {
      profile: 'Myself',
      totalQuantity: 12,
      totalAmount: 1550,
    },
    {
      profile: 'Kushal',
      totalQuantity: 6,
      totalAmount: 800,
    },
    {
      profile: 'Shivtej',
      totalQuantity: 4,
      totalAmount: 500,
    },
  ],
  dailyBreakdown: [
    {
      _id: 'db1',
      date: '2026-06-21T13:00:00.000Z',
      vendorName: 'ShivShree Tiffin',
      tiers: [
        { name: 'Regular Thali', quantity: 2, profile: 'Myself' },
        { name: 'Misal Pav', quantity: 1, profile: 'Kushal' },
      ],
      addOns: [
        { name: 'Solkadhi', quantity: 1, profile: 'Myself' },
      ],
    },
    {
      _id: 'db2',
      date: '2026-06-19T20:30:00.000Z',
      vendorName: 'Annapurna Rasoi',
      tiers: [
        { name: 'Regular Thali', quantity: 1, profile: 'Shivtej' },
        { name: 'Deluxe Thali', quantity: 1, profile: 'Kushal' },
      ],
      addOns: [],
    },
    {
      _id: 'db3',
      date: '2026-06-18T12:45:00.000Z',
      vendorName: 'ShivShree Tiffin',
      tiers: [
        { name: 'Regular Thali', quantity: 2, profile: 'Myself' },
      ],
      addOns: [
        { name: 'Extra Roti', quantity: 2, profile: 'Myself' },
      ],
    },
    {
      _id: 'db4',
      date: '2026-06-12T12:45:00.000Z',
      vendorName: 'ShivShree Tiffin',
      tiers: [
        { name: 'Regular Thali', quantity: 2 },
      ],
      addOns: [
        { name: 'Gulab Jamun', quantity: 2 },
      ],
    },
    {
      _id: 'db5',
      date: '2026-06-05T20:00:00.000Z',
      vendorName: 'Annapurna Rasoi',
      tiers: [
        { name: 'Deluxe Thali', quantity: 1 },
      ],
      addOns: [],
    },
  ],
};

export const CustomerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const authUser = useAuthStore((state) => state.user);

  // local states
  const [filter, setFilter] = useState<'week' | 'month'>('week');
  const [loading, setLoading] = useState<boolean>(true);
  const [data, setData] = useState<DashboardData | null>(null);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [customerName, setCustomerName] = useState<string>('');

  // simulation configurations for review/debugging
  const [simulateEmpty, setSimulateEmpty] = useState<boolean>(false);
  const [showDevTools, setShowDevTools] = useState<boolean>(false);

  // Parallax Mouse coords
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent) => {
    const { clientX, clientY } = e;
    const x = (clientX - window.innerWidth / 2) / 45;
    const y = (clientY - window.innerHeight / 2) / 45;
    setMousePos({ x, y });
  };

  // Helper to format date keys
  const formatDateString = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  // Group daily order items by formatted date
  const groupedOrders = React.useMemo(() => {
    if (!data?.dailyBreakdown) return {};
    const groups: { [key: string]: typeof data.dailyBreakdown } = {};
    data.dailyBreakdown.forEach((item) => {
      const formatted = formatDateString(item.date);
      if (!groups[formatted]) {
        groups[formatted] = [];
      }
      groups[formatted].push(item);
    });
    return groups;
  }, [data]);

  // Load customer profile fallback info
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get('/customer/profile');
        if (res.data?.success && res.data?.data) {
          const profile = res.data.data;
          const fullName = profile.userId
            ? `${profile.userId.firstName} ${profile.userId.lastName}`
            : 'Customer';
          setCustomerName(fullName);
          setWalletBalance(profile.walletBalance || 0);
        }
      } catch (err) {
        console.error('Error loading customer profile on dashboard:', err);
        // Fallback to authStore info if API fails
        if (authUser) {
          setCustomerName(`${authUser.firstName} ${authUser.lastName}`);
        }
      }
    };

    fetchProfile();
  }, [authUser]);

  // Real API fetch handler
  useEffect(() => {
    const loadDashboardData = async () => {
      setLoading(true);
      try {
        if (simulateEmpty) {
          setData({
            totalTiffins: 0,
            totalAmount: 0,
            vendorStats: [],
            profileStats: [],
            dailyBreakdown: [],
          });
          setLoading(false);
          return;
        }

        const res = await api.get(`/customer/dashboard?filter=${filter}`);
        if (res.data?.success && res.data?.data) {
          setData(res.data.data);
        } else {
          // Fallback if data shape is not successful
          setData(filter === 'week' ? dummyWeekData : dummyMonthData);
        }
      } catch (err) {
        console.error('Error fetching dashboard statistics from API:', err);
        // Fallback to local dummy data for demonstration
        setData(filter === 'week' ? dummyWeekData : dummyMonthData);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [filter, simulateEmpty]);

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
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.08; transform: scale(1); }
          50% { opacity: 0.18; transform: scale(1.15); }
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
        .floating-clove { animation: float-medium 10s ease-in-out infinite; }
        .floating-chili { animation: float-reverse 9s ease-in-out infinite; }
        .floating-leaf-2 { animation: float-fast 6s ease-in-out infinite; }
        .pulse-glow-green { animation: pulse-glow 12s ease-in-out infinite; }

        /* Premium Scrollbar */
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(92, 122, 82, 0.2);
          border-radius: 9999px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(92, 122, 82, 0.4);
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
          <path d="M10 15C10 15 13 14 15 11" stroke="#FBF4EC" strokeWidth="0.5" />
          <path d="M6 18C6 18 8 17 10 15" stroke="#FBF4EC" strokeWidth="0.5" />
          <path d="M14 12C14 12 17 11 18 9" stroke="#FBF4EC" strokeWidth="0.5" />
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
            fill="#5C7A52"
            opacity="0.25"
          />
          <path d="M12 2V28" stroke="#5C7A52" strokeWidth="0.8" opacity="0.4" />
          <path d="M12 10C9 12 7 15 6 19" stroke="#5C7A52" strokeWidth="0.5" opacity="0.4" />
          <path d="M12 14C15 16 17 19 18 23" stroke="#5C7A52" strokeWidth="0.5" opacity="0.4" />
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
          <path d="M12 2C14 6 15 12 12 22" stroke="#5C7A52" strokeWidth="0.8" />
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
          <path
            d="M4 22C16 12 34 12 46 22"
            stroke="#704328"
            strokeWidth="2.5"
            strokeLinecap="round"
            opacity="0.65"
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
          <path d="M5 5L10 10L9 11L4 6L5 5Z" fill="#5C7A52" opacity="0.4" />
          <path d="M19 19L14 14L15 13L20 18L19 19Z" fill="#5C7A52" opacity="0.4" />
          <circle cx="12" cy="12" r="3" fill="#7E9C73" />
        </svg>
      </div>

      <div
        style={{
          transform: `translate3d(${mousePos.x * 0.6}px, ${mousePos.y * 0.6}px, 0)`,
          transition: 'transform 0.15s ease-out',
        }}
        className="absolute bottom-[12%] left-[5%] floating-clove opacity-80 pointer-events-none z-10 hidden md:block"
      >
        <svg width="30" height="40" viewBox="0 0 24 32" fill="none">
          <path d="M12 8V30" stroke="#8C5B3E" strokeWidth="3" strokeLinecap="round" />
          <circle cx="12" cy="6" r="4" fill="#5C7A52" opacity="0.9" />
          <path d="M7 6C7 4 17 4 17 6" stroke="#2B2118" strokeWidth="1.2" />
          <path d="M9 12L15 12" stroke="#8C5B3E" strokeWidth="2" />
        </svg>
      </div>

      {/* Main Layout Container */}
      <div className="max-w-6xl mx-auto px-4 pt-6 md:pt-10 relative z-10">
        
        <DashboardHeader
          role="customer"
          subpageTitle="Activity"
          passedWalletBalance={walletBalance}
          passedName={customerName}
        />

        {/* Mobile Sub-Navbar */}
        <MobileNavbar role="customer" activeTab="dashboard" />

        {/* Redesigned Filter Tabs Row */}
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
                      ? 'bg-leaf text-white shadow-sm font-extrabold scale-102'
                      : 'text-[#2B2118]/60 hover:text-charcoal hover:bg-white/30'
                  }`}
                >
                  {filterOpt === 'week' ? 'This Week' : 'This Month'}
                </button>
              );
            })}
          </div>

          <div className="text-xs text-charcoal/50 font-bold font-body tracking-wider uppercase hidden sm:block">
            Dashboard • <span className="text-leaf">{filter === 'week' ? 'Weekly Ledger' : 'Monthly Ledger'}</span>
          </div>
        </div>

        {/* MAIN BODY AREA */}
        {loading ? (
          <div className="space-y-8 animate-pulse">
            {/* Stat Cards row skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2].map((n) => (
                <div
                  key={n}
                  className="bg-white/50 border border-charcoal/10 rounded-[32px] p-8 flex items-center justify-between h-36"
                >
                  <div className="space-y-3">
                    <div className="h-3.5 w-32 bg-charcoal/10 rounded" />
                    <div className="h-10 w-28 bg-charcoal/10 rounded-lg" />
                  </div>
                  <div className="w-16 h-16 bg-charcoal/10 rounded-2xl" />
                </div>
              ))}
            </div>

            {/* Split body skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Column (Breakdowns) */}
              <div className="lg:col-span-7 space-y-8">
                <div className="space-y-4">
                  <div className="h-6 w-48 bg-charcoal/10 rounded" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[1, 2].map((n) => (
                      <div
                        key={n}
                        className="bg-white/40 border border-charcoal/10 rounded-[28px] p-6 h-36 flex flex-col justify-between"
                      />
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="h-6 w-36 bg-charcoal/10 rounded" />
                  <div className="space-y-3">
                    {[1, 2, 3].map((n) => (
                      <div
                        key={n}
                        className="bg-white/50 border border-charcoal/10 rounded-[20px] p-4 h-16 flex items-center justify-between"
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column (History) */}
              <div className="lg:col-span-5 space-y-4">
                <div className="h-6 w-40 bg-charcoal/10 rounded" />
                <div className="space-y-4">
                  {[1, 2].map((n) => (
                    <div
                      key={n}
                      className="bg-white/50 border border-charcoal/10 rounded-[24px] p-5 h-44 space-y-3"
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : simulateEmpty || !data || data.totalTiffins === 0 ? (
          <div className="bg-white/30 backdrop-blur-md border border-[#2B2118]/10 border-dashed rounded-[32px] p-12 text-center flex flex-col items-center justify-center min-h-[400px] shadow-sm max-w-lg mx-auto animate-scale-up">
            <div className="w-24 h-24 mb-6 text-[#5C7A52]/40">
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
              No activity yet this {filter === 'week' ? 'week' : 'month'}
            </h3>
            <p className="text-sm text-[#2B2118]/50 max-w-xs leading-relaxed mb-8 font-body">
              Start ordering to see your stats here! Your tiffins and spending breakdown will update instantly.
            </p>
            <button
              onClick={() => navigate('/customer/home')}
              className="py-3.5 px-6 rounded-2xl bg-[#5C7A52] hover:bg-[#4a6342] text-white font-display font-bold text-xs uppercase tracking-wider shadow-[0_8px_25px_rgba(92,122,82,0.25)] transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer"
            >
              Browse Meal Options
            </button>
          </div>
        ) : (
          <div className="space-y-8 animate-scale-up">
            
            {/* ==========================================
                3. STAT CARDS ROW
               ========================================== */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Card 1: Total Tiffins */}
              <div className="bg-white/70 border border-charcoal/10 rounded-[32px] p-8 shadow-sm flex items-center justify-between transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 hover:border-leaf/20 relative overflow-hidden group">
                {/* Organic backdrop shape */}
                <div className="absolute -bottom-10 -left-10 w-28 h-28 rounded-full bg-[#5C7A52]/3 opacity-40 pointer-events-none group-hover:scale-110 transition-transform duration-500" />
                
                <div>
                  <p className="text-[10px] uppercase font-bold tracking-widest text-charcoal/40 font-body">
                    Tiffins Delivered
                  </p>
                  <p className="text-5xl font-display font-extrabold text-charcoal mt-3 tracking-tight">
                    {data.totalTiffins}
                  </p>
                  <p className="text-xs text-charcoal/50 mt-2 font-body">
                    Across your active connections
                  </p>
                </div>
                
                {/* Custom Tiffin Carrier SVG */}
                <div className="w-16 h-16 bg-[#5C7A52]/10 border border-[#5C7A52]/20 rounded-2xl flex items-center justify-center shrink-0 shadow-xs relative group-hover:scale-105 transition-transform duration-300">
                  <svg className="w-9 h-9 text-leaf" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v3M8 6h8c1.5 0 2 1 2 2v10c0 1.5-.5 2-2 2H8c-1.5 0-2-.5-2-2V8c0-1 .5-2 2-2z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 10h12M6 14h12" />
                    <circle cx="12" cy="8" r="0.75" fill="currentColor" />
                    <circle cx="12" cy="12" r="0.75" fill="currentColor" />
                    <circle cx="12" cy="16" r="0.75" fill="currentColor" />
                  </svg>
                </div>
              </div>

              {/* Card 2: Total Spent */}
              <div className="bg-white/70 border border-charcoal/10 rounded-[32px] p-8 shadow-sm flex items-center justify-between transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 hover:border-leaf/20 relative overflow-hidden group">
                {/* Organic backdrop shape */}
                <div className="absolute -bottom-10 -left-10 w-28 h-28 rounded-full bg-[#5C7A52]/3 opacity-40 pointer-events-none group-hover:scale-110 transition-transform duration-500" />
                
                <div>
                  <p className="text-[10px] uppercase font-bold tracking-widest text-charcoal/40 font-body">
                    Total Amount Spent
                  </p>
                  <p className="text-5xl font-display font-extrabold text-leaf mt-3 tracking-tight">
                    ₹{data.totalAmount}
                  </p>
                  <p className="text-xs text-charcoal/50 mt-2 font-body">
                    Charged securely from wallet
                  </p>
                </div>

                {/* Custom Pouch / Wallet SVG */}
                <div className="w-16 h-16 bg-[#5C7A52]/10 border border-[#5C7A52]/20 rounded-2xl flex items-center justify-center shrink-0 shadow-xs relative group-hover:scale-105 transition-transform duration-300">
                  <svg className="w-9 h-9 text-leaf" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h10a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V9a2 2 0 012-2h2m2-4h6a1 1 0 011 1v3H8V4a1 1 0 011-1z" />
                    <circle cx="15" cy="13" r="1" fill="currentColor" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Split dashboard sections */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Left Column (Vendors and Profiles breakdowns) */}
              <div className="lg:col-span-7 space-y-8">
                
                {/* ==========================================
                    4. VENDOR BREAKDOWN SECTION
                   ========================================== */}
                <section className="space-y-4">
                  <h2 className="font-display text-2xl font-bold text-charcoal">
                    Spending by Vendor
                  </h2>
                  
                  {data.vendorStats.length === 0 ? (
                    <div className="bg-white/30 backdrop-blur-md border border-[#2B2118]/10 border-dashed rounded-[32px] p-8 text-center flex flex-col items-center justify-center min-h-[180px] shadow-sm transition-all duration-300">
                      <div className="w-14 h-14 mb-3 text-[#5C7A52]/40 stroke-current">
                        <svg viewBox="0 0 100 120" fill="none" className="w-full h-full">
                          <path d="M 32,32 C 32,13 68,13 68,32" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                          <path d="M 44,14 L 56,14" strokeWidth="3.5" strokeLinecap="round" />
                          <path d="M 27,32 L 27,105" strokeWidth="2.5" strokeLinecap="round" />
                          <path d="M 73,32 L 73,105" strokeWidth="2.5" strokeLinecap="round" />
                          <rect x="30" y="34" width="40" height="20" rx="3" strokeWidth="2" />
                          <rect x="30" y="58" width="40" height="20" rx="3" strokeWidth="2" />
                          <rect x="30" y="82" width="40" height="22" rx="4" strokeWidth="2" />
                        </svg>
                      </div>
                      <h3 className="font-display text-base font-bold text-charcoal mb-1">
                        No orders yet this {filter === 'week' ? 'week' : 'month'}
                      </h3>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {data.vendorStats.map((vendor) => (
                        <div
                          key={vendor.vendorId}
                          className="bg-white/70 border border-charcoal/10 rounded-[28px] p-6 shadow-sm hover:shadow-md hover:border-leaf/30 transition-all duration-300 flex flex-col justify-between min-h-[150px] group relative overflow-hidden"
                        >
                          {/* Ambient backdrop organic hint */}
                          <div className="absolute -bottom-8 -right-8 w-24 h-24 rounded-full bg-[#5C7A52]/5 group-hover:bg-[#5C7A52]/10 transition-colors pointer-events-none" />

                          <div>
                            <h3 className="font-display font-bold text-xl text-charcoal group-hover:text-leaf transition-colors leading-tight">
                              {vendor.vendorName}
                            </h3>
                            <div className="mt-2 text-sm font-semibold text-leaf font-body select-none">
                              {vendor.totalTiffins} {vendor.totalTiffins === 1 ? 'Tiffin' : 'Tiffins'}
                            </div>
                          </div>

                          <div className="flex justify-between items-end mt-6 pt-3 border-t border-charcoal/5">
                            <span className="text-[10px] text-charcoal/40 font-bold uppercase tracking-wider font-body">
                              Total Cost
                            </span>
                            <span className="font-display font-extrabold text-3xl text-leaf tracking-tight">
                              ₹{vendor.totalAmount}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                {/* ==========================================
                    5. FRIEND PROFILE BREAKDOWN SECTION
                   ========================================== */}
                <section className="space-y-4">
                  <h2 className="font-display text-2xl font-bold text-charcoal">
                    Split by Profile
                  </h2>
                  
                  <div className="space-y-3">
                    {data.profileStats.length === 0 ? (
                      <div className="bg-white/40 border border-charcoal/10 rounded-[24px] p-8 text-center text-xs font-bold uppercase tracking-wider text-charcoal/40 font-body">
                        No profile allocation data
                      </div>
                    ) : (
                      data.profileStats.map((item) => {
                        const profileName = item.profile || 'Myself';
                        return (
                          <div
                            key={profileName}
                            className="bg-white/60 hover:bg-white/80 border border-charcoal/10 rounded-[20px] p-4 flex items-center justify-between transition-all duration-300 shadow-xs group"
                          >
                            <div className="flex items-center gap-4">
                              <div>
                                <h4 className="font-display font-bold text-base text-charcoal group-hover:text-leaf transition-colors">
                                  {profileName}
                                </h4>
                                <span className="text-xs font-semibold text-charcoal/50 mt-1 select-none block">
                                  {item.totalQuantity} {item.totalQuantity === 1 ? 'item' : 'items'} ordered
                                </span>
                              </div>
                            </div>

                            <div className="text-right">
                              <span className="font-display font-extrabold text-xl text-leaf tracking-tight">
                                ₹{item.totalAmount}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </section>

              </div>

              {/* Right Column (Daily Order History) */}
              {/* ==========================================
                  6. REDESIGNED ORDER LEDGER TIMELINE
                 ========================================== */}
              <section className="lg:col-span-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-2xl font-bold text-charcoal">
                    Recent Orders
                  </h2>
                  <span className="text-leaf text-sm font-bold font-body select-none">
                    {data.dailyBreakdown.length} {data.dailyBreakdown.length === 1 ? 'Entry' : 'Entries'}
                  </span>
                </div>

                <div className="max-h-[640px] overflow-y-auto custom-scrollbar pr-2 space-y-6 relative pl-1">
                  {/* Vertical Timeline Guide Line */}
                  <div className="absolute left-[8px] top-6 bottom-6 w-0.5 bg-leaf/15 pointer-events-none z-0" />

                  {Object.keys(groupedOrders).map((dateKey) => (
                    <div key={dateKey} className="space-y-4 relative z-10">
                      {/* Sticky Date Title */}
                      <div className="sticky top-0 bg-[#FBF4EC]/95 backdrop-blur-sm z-20 py-2 flex items-center gap-3">
                        {/* Timeline Node Point */}
                        <div className="w-4 h-4 rounded-full border-2 border-leaf bg-[#FBF4EC] flex items-center justify-center shrink-0 shadow-xs z-10">
                          <div className="w-1.5 h-1.5 rounded-full bg-leaf" />
                        </div>
                        <span className="font-display text-xs font-extrabold text-leaf tracking-wider uppercase border border-charcoal/10 rounded-full px-3 py-1 bg-white shadow-xs">
                          {dateKey}
                        </span>
                      </div>

                      {/* Orders for this day */}
                      <div className="space-y-4 pl-7 relative z-10">
                        {groupedOrders[dateKey].map((order) => (
                          <div
                            key={order._id}
                            className="bg-white/70 border border-charcoal/10 rounded-[24px] p-5 shadow-sm space-y-4 hover:border-leaf/30 hover:bg-white/90 hover:shadow-md transition-all duration-300 relative overflow-hidden group"
                          >
                            <div className="flex justify-between items-start gap-4">
                              <h3 className="font-display font-bold text-base text-charcoal group-hover:text-leaf transition-colors leading-tight">
                                {order.vendorName}
                              </h3>
                            </div>

                            {/* Tiers List (styled as menu items) */}
                            <div className="bg-[#5C7A52]/5 border border-[#5C7A52]/10 rounded-[18px] p-3.5 space-y-3">
                              {order.tiers.map((tier, tIdx) => {
                                const isMyself = (tier.profile || '').toLowerCase() === 'myself';
                                const isKushal = (tier.profile || '').toLowerCase() === 'kushal';
                                const isShivtej = (tier.profile || '').toLowerCase() === 'shivtej';
                                
                                let profileTextColor = 'text-cinnamon';
                                if (isMyself) profileTextColor = 'text-leaf';
                                else if (isKushal) profileTextColor = 'text-turmeric';
                                else if (isShivtej) profileTextColor = 'text-spice';

                                return (
                                  <div key={tIdx} className="flex items-center justify-between gap-3 text-xs text-charcoal font-body">
                                    <div className="flex items-center gap-2">
                                      <span className="font-display font-extrabold text-sm text-leaf select-none mr-1.5">
                                        {tier.quantity}x
                                      </span>
                                      <span className="font-semibold text-charcoal">{tier.name}</span>
                                    </div>
                                    
                                    {tier.profile && (
                                      <span className={`font-body font-bold text-[11px] uppercase tracking-wider select-none ${profileTextColor}`}>
                                        {tier.profile}
                                      </span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>

                            {/* Add-ons List */}
                            {order.addOns && order.addOns.length > 0 && (
                              <div className="border-t border-charcoal/5 pt-3.5 mt-3.5">
                                <p className="text-[10px] font-extrabold uppercase tracking-widest text-cinnamon mb-2.5 font-body flex items-center gap-1.5">
                                  <span>✨ Extra Add-ons</span>
                                </p>
                                <div className="bg-[#E0653A]/5 border border-[#E0653A]/10 rounded-[18px] p-3.5 space-y-2.5">
                                  {order.addOns.map((addOn, aIdx) => {
                                    const isMyself = (addOn.profile || '').toLowerCase() === 'myself';
                                    const isKushal = (addOn.profile || '').toLowerCase() === 'kushal';
                                    const isShivtej = (addOn.profile || '').toLowerCase() === 'shivtej';
                                    
                                    let profileTextColor = 'text-cinnamon';
                                    if (isMyself) profileTextColor = 'text-leaf';
                                    else if (isKushal) profileTextColor = 'text-turmeric';
                                    else if (isShivtej) profileTextColor = 'text-spice';

                                    return (
                                      <div key={aIdx} className="flex items-center justify-between gap-3 text-xs text-charcoal/80 font-body">
                                        <div className="flex items-center gap-2">
                                          <span className="font-display font-extrabold text-xs text-cinnamon select-none mr-1.5">
                                            {addOn.quantity}x
                                          </span>
                                          <span className="font-semibold">{addOn.name}</span>
                                        </div>
                                        
                                        {addOn.profile && (
                                          <span className={`font-body font-bold text-[10px] uppercase tracking-wider select-none ${profileTextColor}`}>
                                            {addOn.profile}
                                          </span>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
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
          className="w-12 h-12 rounded-full bg-white/90 border border-charcoal/10 shadow-lg backdrop-blur-md text-charcoal/60 hover:text-leaf hover:scale-110 active:scale-95 transition-all duration-300 flex items-center justify-center cursor-pointer focus:outline-none"
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
                  className="w-4 h-4 rounded border-charcoal/20 text-leaf focus:ring-leaf cursor-pointer"
                />
                <span className="font-semibold text-charcoal/80">Simulate Empty State</span>
              </label>
              <p className="text-[10px] text-charcoal/40 font-body leading-normal">
                Toggle this to test how the dashboard behaves when no order statistics are available.
              </p>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};
