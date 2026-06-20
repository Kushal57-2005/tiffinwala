/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/set-state-in-effect */
import React, { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import tiffinBg from '../../assets/slate_spices_bg.png';
import { MobileNavbar } from '../../components/MobileNavbar';
import { DashboardHeader } from '../../components/DashboardHeader';

interface ISubscriptionPlan {
  _id: string;
  name: string;
  totalTokens: number;
  price: number;
  isActive: boolean;
  vendorId: string;
}

interface ISubscriber {
  _id: string;
  planName: string;
  totalTokens: number;
  remainingTokens: number;
  pricePaid: number;
  purchaseDate: string;
  expiryDate: string;
  status: 'active' | 'expired' | 'exhausted';
  customerId: {
    _id: string;
    userId: {
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
    } | null;
  } | null;
}

export const VendorSubscriptions: React.FC = () => {
  // States
  const [plans, setPlans] = useState<ISubscriptionPlan[]>([]);
  const [subscribers, setSubscribers] = useState<ISubscriber[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form States
  const [formName, setFormName] = useState<string>('');
  const [formTokens, setFormTokens] = useState<number | ''>('');
  const [formPrice, setFormPrice] = useState<number | ''>('');

  // Track cursor movement for parallax floating elements
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const handleMouseMove = (e: React.MouseEvent) => {
    const { clientX, clientY } = e;
    const x = (clientX - window.innerWidth / 2) / 45;
    const y = (clientY - window.innerHeight / 2) / 45;
    setMousePos({ x, y });
  };

  // Fetch plans and subscribers
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [plansRes, subsRes] = await Promise.all([
        api.get('/vendor/subscription-plans'),
        api.get('/vendor/subscriptions/customers'),
      ]);

      if (plansRes.data?.success && Array.isArray(plansRes.data?.data)) {
        setPlans(plansRes.data.data);
      }
      if (subsRes.data?.success && Array.isArray(subsRes.data?.data)) {
        setSubscribers(subsRes.data.data);
      }
    } catch (err: any) {
      console.error('Error fetching vendor subscriptions data:', err);
      setError(err.response?.data?.message || 'Failed to load subscriptions data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handle Form Submit
  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formTokens || !formPrice) {
      setError('Please fill in all plan details.');
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await api.post('/vendor/subscription-plans', {
        name: formName,
        totalTokens: Number(formTokens),
        price: Number(formPrice),
      });

      if (res.data?.success) {
        setSuccessMsg(`Plan "${formName}" created successfully!`);
        // Reset Form
        setFormName('');
        setFormTokens('');
        setFormPrice('');
        // Refresh plans
        await fetchData();
        setTimeout(() => setSuccessMsg(null), 3000);
      }
    } catch (err: any) {
      console.error('Create plan error:', err);
      setError(err.response?.data?.message || 'Failed to create subscription plan.');
    } finally {
      setSubmitting(false);
    }
  };

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
        .pulse-glow-orange { animation: pulse-glow 12s ease-in-out infinite; }
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

      {/* Background Ambient Glows (Orange for Vendor) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full blur-[130px] bg-spice/10 pulse-glow-orange transition-all duration-1000" />
        <div className="absolute top-1/2 right-0 w-[500px] h-[500px] rounded-full blur-[150px] bg-turmeric/10 pulse-glow-orange transition-all duration-1000" />
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
            fill="#E0653A"
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
          <circle cx="12" cy="12" r="3" fill="#F2B340" />
        </svg>
      </div>

      <div className="max-w-6xl mx-auto px-4 pt-6 md:pt-10 relative z-10">
        {/* ==========================================
            1. TOP HEADER BAR
           ========================================== */}
        <DashboardHeader role="vendor" subpageTitle="Subscriptions" />

        {/* Mobile Sub-Navbar */}
        <MobileNavbar role="vendor" activeTab="subscriptions" />

        {/* Success/Error Alerts */}
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
            <button onClick={() => setSuccessMsg(null)} className="text-emerald-600 hover:text-emerald-800 text-xs font-bold uppercase cursor-pointer">
              Dismiss
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <svg
              className="animate-spin h-10 w-10 text-spice"
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
              Loading Subscriptions...
            </p>
          </div>
        ) : (
          <div className="space-y-12">
            {/* Grid for Form & Plans list */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* ==========================================
                  SECTION 1: CREATE SUBSCRIPTION PLAN
                 ========================================== */}
              <div className="lg:col-span-5 bg-white/40 border border-white/30 backdrop-blur-xl rounded-[32px] p-6 shadow-[0_24px_70px_-15px_rgba(43,33,24,0.12)]">
                <h2 className="font-display text-xl font-bold text-[#2B2118] mb-4">
                  Create Subscription Plan
                </h2>
                <form onSubmit={handleCreatePlan} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#2B2118]/55 mb-1.5">
                      Plan Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 50 Tokens Subscriptions"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-charcoal/10 bg-white/60 focus:bg-white focus:ring-2 focus:ring-spice/20 focus:border-spice outline-none transition-all text-sm font-semibold"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-[#2B2118]/55 mb-1.5">
                        Total Tokens
                      </label>
                      <input
                        type="number"
                        required
                        min="1"
                        placeholder="e.g. 50"
                        value={formTokens}
                        onChange={(e) => setFormTokens(e.target.value !== '' ? Number(e.target.value) : '')}
                        className="w-full px-4 py-3 rounded-xl border border-charcoal/10 bg-white/60 focus:bg-white focus:ring-2 focus:ring-spice/20 focus:border-spice outline-none transition-all text-sm font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-[#2B2118]/55 mb-1.5">
                        Price (₹)
                      </label>
                      <input
                        type="number"
                        required
                        min="0"
                        placeholder="e.g. 3000"
                        value={formPrice}
                        onChange={(e) => setFormPrice(e.target.value !== '' ? Number(e.target.value) : '')}
                        className="w-full px-4 py-3 rounded-xl border border-charcoal/10 bg-white/60 focus:bg-white focus:ring-2 focus:ring-spice/20 focus:border-spice outline-none transition-all text-sm font-semibold"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3.5 px-4 rounded-xl bg-spice hover:bg-spice/90 text-white font-display font-bold text-xs uppercase tracking-wider shadow-[0_8px_25px_rgba(224,101,58,0.25)] hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {submitting ? (
                      <>
                        <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Creating...
                      </>
                    ) : (
                      'Create Plan'
                    )}
                  </button>
                </form>
              </div>

              {/* ==========================================
                  SECTION 2: MY PLANS
                 ========================================== */}
              <div className="lg:col-span-7 space-y-4">
                <div className="px-1 border-b border-[#2B2118]/5 pb-2 flex justify-between items-center">
                  <h2 className="font-display text-xl font-bold text-[#2B2118]">
                    My Plans
                  </h2>
                  <span className="text-xs font-bold font-body px-2.5 py-0.5 rounded-full bg-spice/10 text-spice border border-spice/15">
                    {plans.length} Created
                  </span>
                </div>

                {plans.length === 0 ? (
                  <div className="bg-white/20 border border-[#2B2118]/10 border-dashed rounded-[32px] p-8 text-center flex flex-col items-center justify-center min-h-[220px]">
                    <h3 className="font-display text-base font-bold text-charcoal mb-1">
                      Create your first plan
                    </h3>
                    <p className="text-xs text-[#2B2118]/50 max-w-xs leading-relaxed">
                      Use the form on the left to set up subscription tokens for your customers.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {plans.map((plan) => (
                      <div
                        key={plan._id}
                        className="bg-white/40 border border-white/30 backdrop-blur-xl rounded-[24px] p-5 shadow-[0_12px_40px_-10px_rgba(43,33,24,0.08)] hover:-translate-y-0.5 transition-all duration-200"
                      >
                        <div className="flex justify-between items-start gap-3">
                          <div>
                            <h3 className="font-display font-extrabold text-base text-charcoal">
                              {plan.name}
                            </h3>
                            <p className="text-[11px] text-[#2B2118]/55 font-medium mt-0.5">
                              ₹{(plan.price / plan.totalTokens).toFixed(1)} per token
                            </p>
                          </div>
                          <span className="inline-flex items-center px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded border border-emerald-200 bg-emerald-50 text-emerald-700">
                            Active
                          </span>
                        </div>
                        <div className="h-px bg-[#2B2118]/5 my-3" />
                        <div className="flex justify-between items-end">
                          <div className="space-y-1">
                            <span className="block text-[9px] uppercase tracking-wider font-extrabold text-charcoal/40 leading-none">
                              Details
                            </span>
                            <span className="inline-flex gap-2 text-xs font-bold text-charcoal/70">
                              <span>{plan.totalTokens} Tokens</span>
                              <span>•</span>
                              <span>{plan.totalTokens * 2} Days Validity</span>
                            </span>
                          </div>
                          <span className="font-display font-extrabold text-xl text-charcoal leading-none">
                            ₹{plan.price}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* ==========================================
                SECTION 3: SUBSCRIBERS
               ========================================== */}
            <div className="space-y-4">
              <div className="px-1 border-b border-[#2B2118]/5 pb-2 flex justify-between items-center">
                <h2 className="font-display text-xl font-bold text-[#2B2118]">
                  Subscribers
                </h2>
                <span className="text-xs font-bold font-body px-2.5 py-0.5 rounded-full bg-spice/10 text-spice border border-spice/15">
                  {subscribers.length} Customers
                </span>
              </div>

              {subscribers.length === 0 ? (
                <div className="bg-white/20 border border-[#2B2118]/10 border-dashed rounded-[32px] p-12 text-center flex flex-col items-center justify-center min-h-[250px] max-w-lg mx-auto">
                  <div className="w-16 h-16 mb-4 text-[#2B2118]/25">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-full h-full">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857" />
                    </svg>
                  </div>
                  <h3 className="font-display text-base font-bold text-charcoal mb-1">
                    No customers yet
                  </h3>
                  <p className="text-xs text-[#2B2118]/50 max-w-xs leading-relaxed">
                    Once customers ordered from you buy one of your subscription plans, they will appear here.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-scale-up">
                  {subscribers.map((sub) => {
                    const customerUser = sub.customerId?.userId;
                    const customerName = customerUser ? `${customerUser.firstName} ${customerUser.lastName}` : 'Customer';
                    const customerPhone = customerUser?.phone || 'No phone';

                    const remaining = sub.remainingTokens;
                    const total = sub.totalTokens;
                    const percentage = Math.max(0, Math.min(100, (remaining / total) * 100));

                    // Expiry checks
                    const expDate = new Date(sub.expiryDate);
                    const isExpired = sub.status === 'expired' || expDate < new Date();
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
                              <h3 className="font-display font-extrabold text-base text-charcoal leading-snug">
                                {customerName}
                              </h3>
                              <p className="text-[10px] text-[#2B2118]/50 font-bold mt-0.5">
                                {customerPhone}
                              </p>
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

                          {/* Plan and price details */}
                          <div className="flex justify-between items-start text-xs font-semibold">
                            <div>
                              <span className="block text-[8px] uppercase tracking-wider font-extrabold text-charcoal/40">
                                Subscribed Plan
                              </span>
                              <span className="text-charcoal font-bold">{sub.planName}</span>
                            </div>
                            <div className="text-right">
                              <span className="block text-[8px] uppercase tracking-wider font-extrabold text-charcoal/40">
                                Price Paid
                              </span>
                              <span className="text-charcoal font-extrabold">₹{sub.pricePaid}</span>
                            </div>
                          </div>

                          <div className="h-px bg-[#2B2118]/5 w-full" />

                          {/* Token usage progress bar */}
                          <div className="space-y-1.5">
                            <div className="flex justify-between items-end text-xs font-semibold">
                              <span className="text-[#2B2118]/50">Remaining Tokens</span>
                              <span className="text-charcoal font-bold">
                                <span className="text-sm font-extrabold">{remaining}</span> / {total}
                              </span>
                            </div>
                            <div className="w-full h-2.5 rounded-full bg-[#2B2118]/5 overflow-hidden">
                              <div
                                style={{ width: `${percentage}%` }}
                                className={`h-full rounded-full transition-all duration-500 ${progressColor}`}
                              />
                            </div>
                          </div>

                          <div className="h-px bg-[#2B2118]/5 w-full" />

                          {/* Expiry information */}
                          <div className="flex justify-between items-center text-[10px] text-[#2B2118]/50 font-bold uppercase tracking-wider">
                            <span>Purchased: {new Date(sub.purchaseDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                            <span className={isExpired ? 'text-rose-600' : ''}>
                              Expires: {expDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VendorSubscriptions;
