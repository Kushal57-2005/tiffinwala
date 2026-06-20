/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/set-state-in-effect */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../utils/api';
import tiffinBg from '../../assets/slate_spices_bg.png';
import { MobileNavbar } from '../../components/MobileNavbar';
import { DashboardHeader } from '../../components/DashboardHeader';

interface IVendor {
  _id: string;
  businessName: string;
  isOpen: boolean;
}

interface ISubscriptionPlan {
  _id: string;
  name: string;
  totalTokens: number;
  price: number;
  isActive: boolean;
  vendorId: string;
}

interface ISubscription {
  _id: string;
  planName: string;
  totalTokens: number;
  remainingTokens: number;
  pricePaid: number;
  purchaseDate: string;
  expiryDate: string;
  status: 'active' | 'expired' | 'exhausted';
  vendorId: {
    _id: string;
    businessName: string;
  } | null;
}

export const CustomerSubscriptions: React.FC = () => {
  const navigate = useNavigate();

  // States
  const [myVendors, setMyVendors] = useState<IVendor[]>([]);
  const [subscriptions, setSubscriptions] = useState<ISubscription[]>([]);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'vendors' | 'subscriptions'>(
    'vendors',
  );

  // Selected vendor & plan states (for available plans modal)
  const [selectedVendor, setSelectedVendor] = useState<IVendor | null>(null);
  const [plans, setPlans] = useState<ISubscriptionPlan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState<boolean>(false);
  const [buyingPlanId, setBuyingPlanId] = useState<string | null>(null);

  // Track cursor movement for parallax floating elements
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const handleMouseMove = (e: React.MouseEvent) => {
    const { clientX, clientY } = e;
    const x = (clientX - window.innerWidth / 2) / 45;
    const y = (clientY - window.innerHeight / 2) / 45;
    setMousePos({ x, y });
  };

  // Load profile (which contains myVendors & walletBalance) and subscriptions
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [profileRes, subsRes] = await Promise.all([
        api.get('/customer/profile'),
        api.get('/subscriptions/my'),
      ]);

      if (profileRes.data?.success && profileRes.data?.data) {
        setWalletBalance(profileRes.data.data.walletBalance || 0);
        setMyVendors(profileRes.data.data.myVendors || []);
      }

      if (subsRes.data?.success && Array.isArray(subsRes.data?.data)) {
        setSubscriptions(subsRes.data.data);
      }
    } catch (err: any) {
      console.error('Error fetching subscription page data:', err);
      setError(
        err.response?.data?.message || 'Failed to load subscription data.',
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Fetch plans when a vendor is selected
  const handleViewPlans = async (vendor: IVendor) => {
    setSelectedVendor(vendor);
    setLoadingPlans(true);
    setError(null);
    try {
      const res = await api.get(`/customer/vendors/${vendor._id}/plans`);
      if (res.data?.success && Array.isArray(res.data?.data)) {
        setPlans(res.data.data.filter((p: ISubscriptionPlan) => p.isActive));
      } else {
        setPlans([]);
      }
    } catch (err: any) {
      console.error('Error fetching vendor plans:', err);
      setError(
        err.response?.data?.message || 'Failed to fetch available plans.',
      );
      setPlans([]);
    } finally {
      setLoadingPlans(false);
    }
  };

  // Buy Plan Handler
  const handleBuyPlan = async (planId: string, price: number) => {
    if (walletBalance < price) {
      setError(
        `Insufficient balance. Add at least ₹${(price - walletBalance).toFixed(2)} to your wallet.`,
      );
      return;
    }

    setBuyingPlanId(planId);
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await api.post('/subscriptions/buy', {
        subscriptionPlanId: planId,
      });
      if (res.data?.success) {
        setSuccessMsg('Plan purchased successfully!');
        // Refresh wallet balance and subscriptions list
        await fetchData();
        // Close modal
        setSelectedVendor(null);
        setPlans([]);
        // Auto-dismiss success message
        setTimeout(() => setSuccessMsg(null), 4000);
      }
    } catch (err: any) {
      console.error('Purchase error:', err);
      setError(
        err.response?.data?.message ||
          'Failed to purchase the subscription plan.',
      );
    } finally {
      setBuyingPlanId(null);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Highlight the best value plan based on lowest cost per token
  const getBestValuePlanId = () => {
    if (plans.length <= 1) return null;
    let bestPlan = plans[0];
    let lowestRatio = bestPlan.price / bestPlan.totalTokens;

    for (let i = 1; i < plans.length; i++) {
      const ratio = plans[i].price / plans[i].totalTokens;
      if (ratio < lowestRatio) {
        lowestRatio = ratio;
        bestPlan = plans[i];
      }
    }
    return bestPlan._id;
  };

  const bestValuePlanId = getBestValuePlanId();

  return (
    <div
      onMouseMove={handleMouseMove}
      className="min-h-screen bg-[#FBF4EC] font-body text-[#2B2118] pb-24 relative overflow-hidden select-text transition-all duration-300"
    >
      {/* Custom Embedded Keyframes */}
      <style>{`
        @keyframes scale-up {
          0% { transform: scale(0.95); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes pulse-dot {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.3); opacity: 0.8; }
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
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.08; transform: scale(1); }
          50% { opacity: 0.18; transform: scale(1.15); }
        }
        .animate-scale-up { animation: scale-up 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-pulse-dot { animation: pulse-dot 2s infinite ease-in-out; }
        .floating-leaf { animation: float-slow 7s ease-in-out infinite; }
        .floating-anise { animation: float-medium 9s ease-in-out infinite; }
        .floating-cardamom { animation: float-slow 6s ease-in-out infinite; }
        .pulse-glow-green { animation: pulse-glow 12s ease-in-out infinite; }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
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

      {/* Floating Parallax Spices */}
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

      <div className="max-w-6xl mx-auto px-4 pt-6 md:pt-10 relative z-10">
        {/* ==========================================
            1. TOP HEADER BAR
           ========================================== */}
        <DashboardHeader role="customer" subpageTitle="Subscriptions" passedWalletBalance={walletBalance} />

        {/* Mobile Sub-Navbar */}
        <MobileNavbar role="customer" activeTab="subscriptions" />

        {/* Success/Error Alerts */}
        {error && !selectedVendor && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl flex items-start gap-3 shadow-sm animate-scale-up">
            <svg
              className="w-5 h-5 text-rose-600 shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <div className="text-sm font-semibold flex-1">{error}</div>
            <button
              onClick={() => setError(null)}
              className="text-rose-600 hover:text-rose-800 text-xs font-bold uppercase cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {successMsg && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-start gap-3 shadow-sm animate-scale-up">
            <svg
              className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div className="text-sm font-semibold flex-1">{successMsg}</div>
            <button
              onClick={() => setSuccessMsg(null)}
              className="text-emerald-600 hover:text-emerald-800 text-xs font-bold uppercase cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* ==========================================
            2. TABS SELECTOR
           ========================================== */}
        <div className="flex flex-wrap justify-between items-center gap-4 mb-8 select-none">
          <div className="flex gap-2 overflow-x-auto no-scrollbar max-w-full bg-white/40 border border-white/20 p-1.5 rounded-[20px] backdrop-blur-md">
            <button
              onClick={() => setActiveTab('vendors')}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 flex items-center gap-2 cursor-pointer ${
                activeTab === 'vendors'
                  ? 'bg-leaf text-white shadow-sm scale-105'
                  : 'text-[#2B2118]/60 hover:text-[#2B2118] hover:bg-white/40'
              }`}
            >
              <span>My Vendors</span>
              <span
                className={`px-1.5 py-0.5 rounded-md text-[10px] font-extrabold ${
                  activeTab === 'vendors'
                    ? 'bg-white/20 text-white'
                    : 'bg-leaf/10 text-leaf'
                }`}
              >
                {myVendors.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('subscriptions')}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 flex items-center gap-2 cursor-pointer ${
                activeTab === 'subscriptions'
                  ? 'bg-leaf text-white shadow-sm scale-105'
                  : 'text-[#2B2118]/60 hover:text-[#2B2118] hover:bg-white/40'
              }`}
            >
              <span>My Subscriptions</span>
              <span
                className={`px-1.5 py-0.5 rounded-md text-[10px] font-extrabold ${
                  activeTab === 'subscriptions'
                    ? 'bg-white/20 text-white'
                    : 'bg-leaf/10 text-leaf'
                }`}
              >
                {subscriptions.length}
              </span>
            </button>
          </div>
        </div>

        {/* ==========================================
            3. MAIN VIEW (CONDITIONAL TABS)
           ========================================== */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <svg
              className="animate-spin h-10 w-10 text-leaf"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <p className="mt-4 text-xs font-bold uppercase tracking-widest text-[#2B2118]/50">
              Loading Data...
            </p>
          </div>
        ) : activeTab === 'vendors' ? (
          /* ==========================================
              TAB A: MY VENDORS
             ========================================== */
          myVendors.length === 0 ? (
            <div className="bg-white/30 backdrop-blur-md border border-[#2B2118]/10 border-dashed rounded-[32px] p-12 text-center flex flex-col items-center justify-center min-h-[300px] shadow-sm max-w-lg mx-auto">
              <div className="w-20 h-20 mb-5 text-leaf/40">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  className="w-full h-full"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
              </div>
              <h3 className="font-display text-xl font-bold text-charcoal mb-2">
                No vendors found
              </h3>
              <p className="text-xs text-[#2B2118]/50 max-w-xs leading-relaxed mb-6">
                You haven't ordered from any tiffin vendors yet. Start ordering
                from the home page to link vendor subscriptions.
              </p>
              <button
                onClick={() => navigate('/customer/home')}
                className="py-3.5 px-6 rounded-2xl bg-leaf hover:bg-leaf/90 text-white font-display font-bold text-xs uppercase tracking-wider shadow-[0_8px_25px_rgba(92,122,82,0.25)] transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer"
              >
                Browse Menu Cards
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-scale-up">
              {myVendors.map((vendor) => (
                <div
                  key={vendor._id}
                  className="bg-white/40 border border-white/30 backdrop-blur-xl rounded-[32px] p-6 shadow-[0_24px_70px_-15px_rgba(43,33,24,0.12)] hover:shadow-[0_28px_80px_-15px_rgba(43,33,24,0.16)] hover:border-leaf/30 hover:bg-white/60 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between h-full group"
                >
                  <div className="space-y-4">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex items-center gap-3">
                        {/* Avatar */}
                        <div className="w-10 h-10 rounded-xl bg-leaf/10 border border-leaf/15 flex items-center justify-center shrink-0">
                          <span className="text-xs font-display font-bold text-leaf select-none">
                            {getInitials(vendor.businessName)}
                          </span>
                        </div>
                        <h3 className="font-display font-extrabold text-base text-[#2B2118] leading-snug group-hover:text-leaf transition-colors line-clamp-2">
                          {vendor.businessName}
                        </h3>
                      </div>

                      {/* Status Badge */}
                      {vendor.isOpen ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider rounded-full border border-emerald-200 bg-emerald-500/10 text-emerald-800 select-none">
                          <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                          ACTIVE
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider rounded-full border border-rose-200 bg-rose-500/10 text-rose-800 select-none">
                          <span className="w-1 h-1 rounded-full bg-rose-500" />
                          CLOSED
                        </span>
                      )}
                    </div>
                    <div className="h-px bg-[#2B2118]/5 w-full" />
                    <p className="text-xs text-[#2B2118]/50 leading-relaxed">
                      Purchase tokens in advance to save on your daily meal
                      orders.
                    </p>
                  </div>
                  <div className="mt-6">
                    <button
                      onClick={() => handleViewPlans(vendor)}
                      className="w-full py-3.5 px-4 rounded-2xl font-display font-bold text-xs uppercase tracking-wider border bg-white hover:bg-leaf hover:text-white border-leaf/20 text-leaf hover:border-leaf flex items-center justify-center gap-2 cursor-pointer transition-all duration-300 active:scale-95 shadow-sm"
                    >
                      View Plans
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : /* ==========================================
              TAB B: MY SUBSCRIPTIONS
             ========================================== */
        subscriptions.length === 0 ? (
          <div className="bg-white/30 backdrop-blur-md border border-[#2B2118]/10 border-dashed rounded-[32px] p-12 text-center flex flex-col items-center justify-center min-h-[300px] shadow-sm max-w-lg mx-auto animate-scale-up">
            <div className="w-20 h-20 mb-5 text-[#2B2118]/20">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className="w-full h-full"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"
                />
              </svg>
            </div>
            <h3 className="font-display text-xl font-bold text-charcoal mb-2">
              You have no active plans
            </h3>
            <p className="text-xs text-[#2B2118]/50 max-w-xs leading-relaxed mb-6">
              Save money by buying subscription plans from your preferred
              vendors. Remaining tokens can be redeemed for daily meals.
            </p>
            <button
              onClick={() => setActiveTab('vendors')}
              className="py-3.5 px-6 rounded-2xl bg-leaf hover:bg-leaf/90 text-white font-display font-bold text-xs uppercase tracking-wider shadow-[0_8px_25px_rgba(92,122,82,0.25)] transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer"
            >
              View Vendor Plans
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-scale-up">
            {subscriptions.map((sub) => {
              const vendorName = sub.vendorId?.businessName || 'Unknown Vendor';
              const remaining = sub.remainingTokens;
              const total = sub.totalTokens;
              const percentage = Math.max(
                0,
                Math.min(100, (remaining / total) * 100),
              );

              // Expiry formatting
              const expDate = new Date(sub.expiryDate);
              const isExpired =
                sub.status === 'expired' || expDate < new Date();
              const isExhausted = sub.status === 'exhausted' || remaining <= 0;

              // Color of progress bar based on capacity: red when low token, yellow when enough, green when many
              let progressColor = 'bg-emerald-500'; // green when many token (> 60%)
              if (percentage <= 25) {
                progressColor = 'bg-rose-500'; // red when low token (<= 25%)
              } else if (percentage <= 60) {
                progressColor = 'bg-yellow-500'; // yellow when enough token (25% - 60%)
              }

              return (
                <div
                  key={sub._id}
                  className="bg-white/40 border border-white/30 backdrop-blur-xl rounded-[32px] p-6 shadow-[0_24px_70px_-15px_rgba(43,33,24,0.12)] flex flex-col justify-between h-full hover:shadow-[0_28px_80px_-15px_rgba(43,33,24,0.16)] transition-all duration-300"
                >
                  <div className="space-y-4 w-full">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <p className="text-[9px] uppercase tracking-wider font-extrabold text-leaf">
                          {vendorName}
                        </p>
                        <h3 className="font-display font-extrabold text-lg text-charcoal leading-snug mt-0.5 line-clamp-1">
                          {sub.planName}
                        </h3>
                      </div>

                      {/* Status Badge */}
                      {isExpired ? (
                        <span className="inline-flex items-center px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-md border border-rose-200 bg-rose-50 text-rose-700 select-none shrink-0">
                          Expired
                        </span>
                      ) : isExhausted ? (
                        <span className="inline-flex items-center px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-md border border-gray-300 bg-gray-100 text-gray-500 select-none shrink-0">
                          Exhausted
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-md border border-emerald-200 bg-emerald-50 text-emerald-700 select-none shrink-0">
                          Active
                        </span>
                      )}
                    </div>

                    <div className="h-px bg-[#2B2118]/5 w-full" />

                    {/* Token details and Progress Bar */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-end text-xs font-semibold">
                        <span className="text-[#2B2118]/50">Token Balance</span>
                        <span className="text-charcoal font-bold">
                          <span className="text-base font-extrabold text-charcoal">
                            {remaining}
                          </span>{' '}
                          / {total} left
                        </span>
                      </div>
                      {/* Progress Bar container */}
                      <div className="w-full h-2.5 rounded-full bg-[#2B2118]/5 overflow-hidden">
                        <div
                          style={{ width: `${percentage}%` }}
                          className={`h-full rounded-full transition-all duration-500 ${progressColor}`}
                        />
                      </div>
                      <p className="text-[10px] text-[#2B2118]/40 text-right">
                        {total - remaining} of {total} tokens used
                      </p>
                    </div>

                    <div className="h-px bg-[#2B2118]/5 w-full" />

                    {/* Expiry Details */}
                    <div className="flex justify-between items-center text-xs">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-[#2B2118]/45 uppercase font-bold tracking-wider">
                          Purchased
                        </span>
                        <span className="font-semibold text-charcoal">
                          {new Date(sub.purchaseDate).toLocaleDateString(
                            undefined,
                            {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            },
                          )}
                        </span>
                      </div>
                      <div className="flex flex-col text-right">
                        <span className="text-[10px] text-[#2B2118]/45 uppercase font-bold tracking-wider">
                          Expires
                        </span>
                        <span
                          className={`font-semibold ${isExpired ? 'text-rose-600' : 'text-charcoal'}`}
                        >
                          {expDate.toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ==========================================
          MODAL: AVAILABLE PLANS
         ========================================== */}
      {selectedVendor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-hidden select-text animate-fade-in">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-md"
            onClick={() => {
              setSelectedVendor(null);
              setPlans([]);
            }}
          />

          {/* Modal Content */}
          <div className="bg-[#FBF4EC] border border-white/40 w-full max-w-xl rounded-[32px] p-6 shadow-[0_32px_80px_rgba(43,33,24,0.25)] relative z-10 max-h-[85vh] overflow-y-auto no-scrollbar animate-scale-up flex flex-col justify-between">
            <div>
              {/* Header */}
              <div className="flex justify-between items-start gap-4 mb-4">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-leaf">
                    Available Plans for
                  </span>
                  <h3 className="font-display font-extrabold text-2xl text-[#2B2118] leading-tight">
                    {selectedVendor.businessName}
                  </h3>
                </div>
                <button
                  onClick={() => {
                    setSelectedVendor(null);
                    setPlans([]);
                  }}
                  className="w-8 h-8 rounded-full bg-[#2B2118]/5 hover:bg-[#2B2118]/10 text-charcoal flex items-center justify-center transition-all cursor-pointer"
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
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <div className="h-px bg-[#2B2118]/5 w-full mb-6" />

              {/* Modal Error alert */}
              {error && (
                <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl flex items-start gap-3 shadow-sm animate-scale-up">
                  <svg
                    className="w-5 h-5 text-rose-600 shrink-0 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                  <div className="text-sm font-semibold flex-1">{error}</div>
                  <button onClick={() => setError(null)} className="text-rose-600 hover:text-rose-800 text-xs font-bold uppercase cursor-pointer">
                    Dismiss
                  </button>
                </div>
              )}

              {/* Plans Loading/Render */}
              {loadingPlans ? (
                <div className="flex flex-col items-center justify-center py-10">
                  <svg
                    className="animate-spin h-8 w-8 text-leaf"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  <p className="mt-3 text-[10px] font-bold uppercase tracking-widest text-[#2B2118]/50">
                    Loading Plans...
                  </p>
                </div>
              ) : plans.length === 0 ? (
                <div className="py-12 text-center text-xs text-[#2B2118]/50 font-bold uppercase">
                  No plans available for this vendor
                </div>
              ) : (
                <div className="space-y-4">
                  {plans.map((plan) => {
                    const isBestValue = plan._id === bestValuePlanId;
                    const pricePerToken = (
                      plan.price / plan.totalTokens
                    ).toFixed(1);
                    return (
                      <div
                        key={plan._id}
                        className={`bg-white/50 border rounded-2xl p-5 flex flex-col sm:flex-row justify-between sm:items-center gap-4 transition-all duration-300 relative overflow-hidden ${
                          isBestValue
                            ? 'border-leaf shadow-[0_8px_30px_rgba(92,122,82,0.12)] bg-[#5C7A52]/5'
                            : 'border-white/40 hover:border-leaf/25'
                        }`}
                      >
                        {isBestValue && (
                          <div className="absolute top-0 right-0 bg-leaf text-white text-[9px] uppercase tracking-wider font-extrabold py-0.5 px-3 rounded-bl-xl">
                            Best Value
                          </div>
                        )}

                        <div className="space-y-2">
                          <div>
                            <h4 className="font-display font-extrabold text-lg text-charcoal">
                              {plan.name}
                            </h4>
                            <p className="text-xs text-[#2B2118]/50 font-medium">
                              ₹{pricePerToken} per token • Validity:{' '}
                              {plan.totalTokens * 2} days
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <span className="px-2 py-0.5 bg-leaf/10 border border-leaf/15 text-leaf rounded text-[10px] font-extrabold uppercase">
                              {plan.totalTokens} Tokens
                            </span>
                            <span className="px-2 py-0.5 bg-[#2B2118]/5 text-charcoal rounded text-[10px] font-extrabold uppercase">
                              {plan.totalTokens * 2} Days
                            </span>
                          </div>
                        </div>

                        <div className="flex sm:flex-col items-start sm:items-end justify-between sm:justify-center gap-2">
                          <span className="font-display font-extrabold text-2xl text-charcoal leading-none">
                            ₹{plan.price}
                          </span>
                          <button
                            onClick={() => handleBuyPlan(plan._id, plan.price)}
                            disabled={buyingPlanId !== null}
                            className="py-2.5 px-5 rounded-xl bg-leaf hover:bg-leaf/90 text-white font-display font-bold text-xs uppercase tracking-wider shadow-[0_4px_12px_rgba(92,122,82,0.18)] hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                          >
                            {buyingPlanId === plan._id ? (
                              <>
                                <svg
                                  className="animate-spin h-3.5 w-3.5 text-white"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                >
                                  <circle
                                    className="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                  />
                                  <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                  />
                                </svg>
                                Buying...
                              </>
                            ) : (
                              'Buy Plan'
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => {
                  setSelectedVendor(null);
                  setPlans([]);
                }}
                className="py-2.5 px-5 rounded-xl border border-charcoal/15 bg-white text-[#2B2118]/70 hover:bg-[#2B2118]/5 transition-all text-xs font-bold uppercase tracking-wider cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerSubscriptions;
