import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { api } from '../utils/api';

export default function LandingPage() {
  const navigate = useNavigate();
  const setUser = useAuthStore((state) => state.setUser);
  const [activeTab, setActiveTab] = useState<'customer' | 'vendor' | 'tech'>('customer');
  const [loginLoading, setLoginLoading] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<string>('');

  // 1-Click Reviewer Auto-Login
  const handleAutoLogin = async (role: 'customer' | 'vendor') => {
    setLoginLoading(role);
    setFeedbackMsg('');
    const email = role === 'customer' ? 'customer@tiffinwala.com' : 'vendor@tiffinwala.com';
    const password = role === 'customer' ? 'customer@123' : 'vendor@123';

    try {
      if (role === 'customer') {
        const res = await api.post('/auth/login/customer', { emailOrPhone: email, password });
        const { token, ...userData } = res.data.data;
        localStorage.setItem('token', token);
        setUser(userData);
        setFeedbackMsg('✅ Customer session verified! Redirecting to dashboard...');
        setTimeout(() => navigate('/customer/home'), 400);
      } else {
        const res = await api.post('/auth/login/vendor', { emailOrPhone: email, password });
        if (res.data?.data?.token) {
          const { token, ...userData } = res.data.data;
          localStorage.setItem('token', token);
          setUser(userData);
          setFeedbackMsg('✅ Vendor session verified! Redirecting to kitchen dashboard...');
          setTimeout(() => navigate('/vendor/home'), 400);
        } else if (res.data?.data?.userId) {
          const otp = res.data?.data?.emailOTP || '123456';
          const step2 = await api.post('/auth/login/vendor/verify-otp', {
            userId: res.data.data.userId,
            otp,
          });
          const { token, ...userData } = step2.data.data;
          localStorage.setItem('token', token);
          setUser(userData);
          setFeedbackMsg('✅ Vendor session verified! Redirecting to kitchen dashboard...');
          setTimeout(() => navigate('/vendor/home'), 400);
        }
      }
    } catch (err: any) {
      setFeedbackMsg(`❌ Login error: ${err.response?.data?.message || err.message}`);
      setLoginLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#1F1710] text-[#FBF4EC] font-body selection:bg-[#E0653A] selection:text-white relative overflow-hidden">
      {/* Ambient Radial Gradient Background Glows */}
      <div className="absolute top-[-10rem] left-[-10rem] w-[35rem] h-[35rem] bg-[#5C7A52]/20 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-[20%] right-[-8rem] w-[40rem] h-[40rem] bg-[#E0653A]/15 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[10%] left-[20%] w-[35rem] h-[35rem] bg-[#F2B340]/10 rounded-full blur-[160px] pointer-events-none" />

      {/* ── STICKY TOP NAVBAR ──────────────────────────────────── */}
      <nav className="sticky top-0 z-50 bg-[#1F1710]/80 backdrop-blur-xl border-b border-white/10 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Brand */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#E0653A] to-[#F2B340] flex items-center justify-center text-xl shadow-lg shadow-[#E0653A]/20">
              🍱
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-display font-bold text-2xl tracking-tight text-white">TiffinWala</span>
                <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-[#5C7A52]/30 text-[#8cb880] border border-[#5C7A52]/40">
                  Production Ready
                </span>
              </div>
              <p className="text-[11px] text-[#C7CCD1] tracking-wide font-medium">Daily Meal Infrastructure</p>
            </div>
          </div>

          {/* Nav Center Links */}
          <div className="hidden md:flex items-center space-x-8 text-sm font-medium text-[#C7CCD1]">
            <a href="#customers" className="hover:text-white transition-colors">For Customers</a>
            <a href="#vendors" className="hover:text-white transition-colors">For Vendors</a>
            <a href="#workflow" className="hover:text-white transition-colors">How It Works</a>
            <a href="#architecture" className="hover:text-white transition-colors">Tech Architecture</a>
            <a href="#reviewer" className="hover:text-[#F2B340] text-amber-300 font-semibold transition-colors flex items-center space-x-1">
              <span>⚡</span>
              <span>Reviewer Demos</span>
            </a>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate('/login')}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white/90 hover:text-white hover:bg-white/5 border border-white/15 transition-all"
            >
              Sign In
            </button>
            <button
              onClick={() => navigate('/register')}
              className="px-5 py-2.5 rounded-xl text-sm font-bold bg-[#E0653A] hover:bg-[#c9532a] text-white shadow-lg shadow-[#E0653A]/25 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* ── HERO SECTION ───────────────────────────────────────── */}
      <section className="relative pt-16 pb-20 md:pt-24 md:pb-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-4xl mx-auto space-y-6">
          {/* Top Pill */}
          <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/15 text-xs font-semibold text-[#F2B340] backdrop-blur-md shadow-sm">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
            <span>Complete Dual-Sided MERN + TypeScript Platform</span>
          </div>

          {/* Main Headline */}
          <h1 className="font-display text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight text-white leading-[1.1]">
            The Modern Daily Meal <br />
            <span className="bg-gradient-to-r from-[#F2B340] via-[#E0653A] to-[#E0653A] bg-clip-text text-transparent">
              Operating System
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg md:text-xl text-[#C7CCD1] max-w-2xl mx-auto leading-relaxed">
            Connecting homestyle tiffin kitchens with students and professionals. Hyperlocal geo-discovery,
            multi-roommate split billing, flexible token subscriptions, automated monthly tally, and real-time live chat.
          </p>

          {/* Dual Action CTAs + Reviewer Jump */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <button
              onClick={() => handleAutoLogin('customer')}
              disabled={loginLoading !== null}
              className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-[#5C7A52] hover:bg-[#4a6342] text-white font-bold text-sm shadow-xl shadow-[#5C7A52]/25 transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <span>{loginLoading === 'customer' ? 'Connecting...' : '⚡ Try Guest Customer'}</span>
              <span className="text-xs opacity-75 font-normal">(customer@tiffinwala.com)</span>
            </button>
            <button
              onClick={() => handleAutoLogin('vendor')}
              disabled={loginLoading !== null}
              className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-[#E0653A] hover:bg-[#c5512b] text-white font-bold text-sm shadow-xl shadow-[#E0653A]/25 transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <span>{loginLoading === 'vendor' ? 'Connecting...' : '⚡ Try Guest Vendor'}</span>
              <span className="text-xs opacity-75 font-normal">(vendor@tiffinwala.com)</span>
            </button>
          </div>

          {feedbackMsg && (
            <div className="pt-2">
              <span className="inline-block text-xs font-semibold px-4 py-2 rounded-xl bg-white/10 border border-white/20 text-[#F2B340] animate-pulse">
                {feedbackMsg}
              </span>
            </div>
          )}

          {/* Trust Metrics Bar */}
          <div className="pt-12 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm text-center">
              <div className="text-2xl font-bold font-display text-white">0s</div>
              <div className="text-xs text-[#C7CCD1] mt-0.5">Order Barrier (Direct Booking)</div>
            </div>
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm text-center">
              <div className="text-2xl font-bold font-display text-[#F2B340]">N × 2 Days</div>
              <div className="text-xs text-[#C7CCD1] mt-0.5">Fair Token Subscription Expiry</div>
            </div>
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm text-center">
              <div className="text-2xl font-bold font-display text-[#5C7A52]">Multi-Profile</div>
              <div className="text-xs text-[#C7CCD1] mt-0.5">Roommate Tiffin Splitting</div>
            </div>
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm text-center">
              <div className="text-2xl font-bold font-display text-[#E0653A]">Automated</div>
              <div className="text-xs text-[#C7CCD1] mt-0.5">PDF Monthly Bills & Cron Jobs</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CORE ROLE PREVIEWS SECTION ──────────────────────────── */}
      <section id="features" className="py-20 bg-black/20 border-y border-white/10 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-xs font-bold uppercase tracking-widest text-[#E0653A]">Engineered For Two Worlds</h2>
            <p className="font-display text-3xl sm:text-4xl font-bold text-white mt-2">
              Dual-Sided Experience, Zero Friction
            </p>
            <p className="text-sm text-[#C7CCD1] mt-2">
              Every screen in TiffinWala was architected to solve the real operational challenges of daily food subscription.
            </p>

            {/* Interactive Toggle Pill */}
            <div className="inline-flex p-1.5 rounded-2xl bg-white/5 border border-white/10 mt-6 space-x-1">
              <button
                onClick={() => setActiveTab('customer')}
                className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'customer'
                    ? 'bg-[#5C7A52] text-white shadow-md'
                    : 'text-[#C7CCD1] hover:text-white'
                }`}
              >
                Customer Features (Students & Pros)
              </button>
              <button
                onClick={() => setActiveTab('vendor')}
                className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'vendor'
                    ? 'bg-[#E0653A] text-white shadow-md'
                    : 'text-[#C7CCD1] hover:text-white'
                }`}
              >
                Vendor Features (Kitchen Owners)
              </button>
              <button
                onClick={() => setActiveTab('tech')}
                className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'tech'
                    ? 'bg-[#F2B340] text-black shadow-md'
                    : 'text-[#C7CCD1] hover:text-white'
                }`}
              >
                Architecture & Cron Jobs
              </button>
            </div>
          </div>

          {/* 1. Customer Tab Content */}
          {activeTab === 'customer' && (
            <div id="customers" className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fadeIn">
              <div className="p-6 rounded-3xl bg-gradient-to-b from-white/10 to-white/5 border border-white/15 backdrop-blur-md space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-[#5C7A52]/20 border border-[#5C7A52]/40 flex items-center justify-center text-2xl">
                  👥
                </div>
                <h3 className="font-display text-xl font-bold text-white">Multi-Profile Roommate Splitting</h3>
                <p className="text-sm text-[#C7CCD1] leading-relaxed">
                  Unique differentiator: One customer account can register multiple friend/roommate profiles (e.g. 1 for Aman, 1 for Rahul).
                  Assign individual meals at checkout and receive split ledger tallies at month-end.
                </p>
                <div className="pt-2 text-xs text-[#8cb880] font-semibold flex items-center space-x-1">
                  <span>✓ Built into Order Schema & Checkout</span>
                </div>
              </div>

              <div className="p-6 rounded-3xl bg-gradient-to-b from-white/10 to-white/5 border border-white/15 backdrop-blur-md space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-[#F2B340]/20 border border-[#F2B340]/40 flex items-center justify-center text-2xl">
                  🎟️
                </div>
                <h3 className="font-display text-xl font-bold text-white">Coupon-Based Subscriptions</h3>
                <p className="text-sm text-[#C7CCD1] leading-relaxed">
                  Buy a 20-token bundle and redeem meals strictly when you eat. No forced daily deductions if you skip a meal or go home for weekends.
                  Visual health badges: 🔴 Low (≤3), 🟡 Medium, 🟢 Good.
                </p>
                <div className="pt-2 text-xs text-[#F2B340] font-semibold flex items-center space-x-1">
                  <span>✓ Fair Expiry = Tokens × 2 Days</span>
                </div>
              </div>

              <div className="p-6 rounded-3xl bg-gradient-to-b from-white/10 to-white/5 border border-white/15 backdrop-blur-md space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-[#E0653A]/20 border border-[#E0653A]/40 flex items-center justify-center text-2xl">
                  💳
                </div>
                <h3 className="font-display text-xl font-bold text-white">Wallet & Monthly Credit Tab</h3>
                <p className="text-sm text-[#C7CCD1] leading-relaxed">
                  Pay instantly using built-in digital wallet, or request a <strong>Monthly Billing Connection</strong> with trusted vendors
                  to add meals to pending dues for consolidated month-end settlement.
                </p>
                <div className="pt-2 text-xs text-[#E0653A] font-semibold flex items-center space-x-1">
                  <span>✓ Auto-Settled via Month-End Cron</span>
                </div>
              </div>
            </div>
          )}

          {/* 2. Vendor Tab Content */}
          {activeTab === 'vendor' && (
            <div id="vendors" className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fadeIn">
              <div className="p-6 rounded-3xl bg-gradient-to-b from-white/10 to-white/5 border border-white/15 backdrop-blur-md space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-[#E0653A]/20 border border-[#E0653A]/40 flex items-center justify-center text-2xl">
                  🍲
                </div>
                <h3 className="font-display text-xl font-bold text-white">Daily Session Menu Publishing</h3>
                <p className="text-sm text-[#C7CCD1] leading-relaxed">
                  Vendors configure distinct Lunch & Dinner sessions with multi-tier pricing (Standard / Deluxe Thali), custom add-ons (extra roti, sweet),
                  and real-time quantity quotas with instant Open/Close kitchen toggles.
                </p>
                <div className="pt-2 text-xs text-[#E0653A] font-semibold flex items-center space-x-1">
                  <span>✓ Prevents overbooking with quota guards</span>
                </div>
              </div>

              <div className="p-6 rounded-3xl bg-gradient-to-b from-white/10 to-white/5 border border-white/15 backdrop-blur-md space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-[#F2B340]/20 border border-[#F2B340]/40 flex items-center justify-center text-2xl">
                  🤝
                </div>
                <h3 className="font-display text-xl font-bold text-white">Credit Customer Management</h3>
                <p className="text-sm text-[#C7CCD1] leading-relaxed">
                  Vendors maintain transparent ledger connections for customers on monthly khata. Review incoming credit requests,
                  track each customer's accumulated <code>pendingDue</code>, and see who owes what at a glance.
                </p>
                <div className="pt-2 text-xs text-[#F2B340] font-semibold flex items-center space-x-1">
                  <span>✓ Connection & DuePayment schemas</span>
                </div>
              </div>

              <div className="p-6 rounded-3xl bg-gradient-to-b from-white/10 to-white/5 border border-white/15 backdrop-blur-md space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-[#5C7A52]/20 border border-[#5C7A52]/40 flex items-center justify-center text-2xl">
                  📊
                </div>
                <h3 className="font-display text-xl font-bold text-white">Platform Fee & Revenue Analytics</h3>
                <p className="text-sm text-[#C7CCD1] leading-relaxed">
                  Transparent 10% platform fee auto-deducted each month from the vendor's initial ₹9,999 registration balance.
                  Live analytics for gross revenue, net payout, ratings breakdown, and customer retention metrics.
                </p>
                <div className="pt-2 text-xs text-[#8cb880] font-semibold flex items-center space-x-1">
                  <span>✓ Automated monthly invoice generation</span>
                </div>
              </div>
            </div>
          )}

          {/* 3. Tech & Architecture Tab */}
          {activeTab === 'tech' && (
            <div id="architecture" className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fadeIn">
              <div className="p-6 rounded-3xl bg-gradient-to-b from-white/10 to-white/5 border border-white/15 backdrop-blur-md space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-[#F2B340]/20 border border-[#F2B340]/40 flex items-center justify-center text-2xl">
                  🗺️
                </div>
                <h3 className="font-display text-xl font-bold text-white">Hyperlocal Geospatial Engine</h3>
                <p className="text-sm text-[#C7CCD1] leading-relaxed">
                  Leverages MongoDB's <code>2dsphere</code> index. Automatically queries vendors within their specified delivery radius (km)
                  relative to the customer's exact GPS latitude & longitude.
                </p>
                <div className="pt-2 text-xs text-[#F2B340] font-semibold flex items-center space-x-1">
                  <span>✓ MongoDB $near & $geoWithin Queries</span>
                </div>
              </div>

              <div className="p-6 rounded-3xl bg-gradient-to-b from-white/10 to-white/5 border border-white/15 backdrop-blur-md space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-[#5C7A52]/20 border border-[#5C7A52]/40 flex items-center justify-center text-2xl">
                  ⚡
                </div>
                <h3 className="font-display text-xl font-bold text-white">Real-Time Socket.io Gateway</h3>
                <p className="text-sm text-[#C7CCD1] leading-relaxed">
                  Dedicated in-memory socket manager maps active connected user IDs to socket sessions.
                  Instantly unlocks customer-vendor chat upon order placement with built-in complaint lifecycle tracking (<code>Raised</code> → <code>Acknowledged</code> → <code>Resolved</code>).
                </p>
                <div className="pt-2 text-xs text-[#8cb880] font-semibold flex items-center space-x-1">
                  <span>✓ Bi-directional live messaging</span>
                </div>
              </div>

              <div className="p-6 rounded-3xl bg-gradient-to-b from-white/10 to-white/5 border border-white/15 backdrop-blur-md space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-[#E0653A]/20 border border-[#E0653A]/40 flex items-center justify-center text-2xl">
                  ⏰
                </div>
                <h3 className="font-display text-xl font-bold text-white">Scheduled Node-Cron Daemons</h3>
                <p className="text-sm text-[#C7CCD1] leading-relaxed">
                  Two background crons keep the system running autonomously:
                  <br />• <strong>Monthly Billing Cron</strong>: Runs midnight on 1st of every month to compute bills, generate HTML/PDF, and email tallies.
                  <br />• <strong>Token Expiry Cron</strong>: Runs daily at 9:00 AM to mark elapsed tokens and trigger push alerts.
                </p>
                <div className="pt-2 text-xs text-[#E0653A] font-semibold flex items-center space-x-1">
                  <span>✓ Fully backgrounded cron tasks</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── STEP-BY-STEP WORKFLOW ───────────────────────────────── */}
      <section id="workflow" className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-xs font-bold uppercase tracking-widest text-[#5C7A52]">Lifecycle Blueprint</h2>
          <p className="font-display text-3xl sm:text-4xl font-bold text-white mt-2">How An Order Travels</p>
          <p className="text-sm text-[#C7CCD1] mt-2">
            No gatekeeping or approval hurdles. Customers discover, customize, split, and track meals in seconds.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative">
          <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-3 relative">
            <div className="text-xs font-bold text-[#F2B340] uppercase tracking-wider">Step 01</div>
            <h4 className="font-display font-bold text-lg text-white">Geo Discovery</h4>
            <p className="text-xs text-[#C7CCD1] leading-relaxed">
              Customer views nearby verified kitchens sorted by live distance and kitchen open/closed status.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-3 relative">
            <div className="text-xs font-bold text-[#E0653A] uppercase tracking-wider">Step 02</div>
            <h4 className="font-display font-bold text-lg text-white">Select & Split</h4>
            <p className="text-xs text-[#C7CCD1] leading-relaxed">
              Customer picks Thali tiers and divides quantities across roommate profiles with special kitchen instructions.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-3 relative">
            <div className="text-xs font-bold text-[#5C7A52] uppercase tracking-wider">Step 03</div>
            <h4 className="font-display font-bold text-lg text-white">Flexible Payment</h4>
            <p className="text-xs text-[#C7CCD1] leading-relaxed">
              Redeem subscription tokens, deduct from wallet, or post to Monthly Bill tab (if connected).
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-3 relative">
            <div className="text-xs font-bold text-[#F2B340] uppercase tracking-wider">Step 04</div>
            <h4 className="font-display font-bold text-lg text-white">Live Kitchen Queue</h4>
            <p className="text-xs text-[#C7CCD1] leading-relaxed">
              Vendor accepts order request. Real-time chat unlocks instantly for delivery coordination.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-3 relative">
            <div className="text-xs font-bold text-[#5C7A52] uppercase tracking-wider">Step 05</div>
            <h4 className="font-display font-bold text-lg text-white">Delivery & Tally</h4>
            <p className="text-xs text-[#C7CCD1] leading-relaxed">
              Kitchen marks Delivered, customer confirms, ratings update, and order logs to monthly automated PDF statement.
            </p>
          </div>
        </div>
      </section>

      {/* ── REVIEWER / RECRUITER PLAYGROUND ────────────────────── */}
      <section id="reviewer" className="py-20 bg-gradient-to-br from-[#2E2218] to-[#1F1710] border-t border-white/10 relative">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="p-8 sm:p-12 rounded-[32px] bg-white/5 border border-amber-500/30 backdrop-blur-xl relative overflow-hidden shadow-2xl">
            {/* Pulsing Accent */}
            <div className="flex items-center space-x-2 mb-3">
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
              </span>
              <span className="text-xs font-bold uppercase tracking-widest text-[#F2B340] font-body">
                Recruiter & Reviewer Test Drive
              </span>
            </div>

            <h3 className="font-display text-2xl sm:text-4xl font-bold text-white mb-3">
              One-Click Instant Evaluation
            </h3>
            <p className="text-sm text-[#C7CCD1] max-w-2xl leading-relaxed mb-8">
              No need to register fake phone numbers or verify test OTPs. We have pre-seeded full production-grade demo accounts
              with loaded wallets, active lunch menus, connected friend profiles, and pending dues so you can test the entire workflow in seconds.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Customer Box */}
              <div className="p-5 rounded-2xl bg-black/30 border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-xl">🧑‍💻</span>
                    <span className="font-bold text-sm text-white">Customer Demo Account</span>
                  </div>
                  <span className="text-[10px] bg-[#5C7A52]/30 text-[#8cb880] px-2 py-0.5 rounded-full font-semibold">
                    ₹2,000 Wallet
                  </span>
                </div>
                <div className="text-xs text-[#C7CCD1] space-y-1">
                  <div><strong>Email:</strong> <code className="bg-white/10 px-1.5 py-0.5 rounded text-white">customer@tiffinwala.com</code></div>
                  <div><strong>Password:</strong> <code className="bg-white/10 px-1.5 py-0.5 rounded text-white">customer@123</code></div>
                  <div className="text-[11px] text-white/50 pt-1">Preloaded with roommate split profiles & delivery location</div>
                </div>
                <button
                  onClick={() => handleAutoLogin('customer')}
                  disabled={loginLoading !== null}
                  className="w-full mt-2 py-3 rounded-xl bg-[#5C7A52] hover:bg-[#4a6342] text-white font-bold text-xs tracking-wider uppercase transition-all shadow-md active:scale-[0.98] disabled:opacity-50"
                >
                  {loginLoading === 'customer' ? 'Signing In...' : '⚡ Auto-Run Customer Session'}
                </button>
              </div>

              {/* Vendor Box */}
              <div className="p-5 rounded-2xl bg-black/30 border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-xl">🧑‍🍳</span>
                    <span className="font-bold text-sm text-white">Vendor Demo Kitchen</span>
                  </div>
                  <span className="text-[10px] bg-[#E0653A]/30 text-[#e67e58] px-2 py-0.5 rounded-full font-semibold">
                    Active Kitchen
                  </span>
                </div>
                <div className="text-xs text-[#C7CCD1] space-y-1">
                  <div><strong>Email:</strong> <code className="bg-white/10 px-1.5 py-0.5 rounded text-white">vendor@tiffinwala.com</code></div>
                  <div><strong>Password:</strong> <code className="bg-white/10 px-1.5 py-0.5 rounded text-white">vendor@123</code></div>
                  <div className="text-[11px] text-white/50 pt-1">Platform fee verified + today's lunch menu pre-published</div>
                </div>
                <button
                  onClick={() => handleAutoLogin('vendor')}
                  disabled={loginLoading !== null}
                  className="w-full mt-2 py-3 rounded-xl bg-[#E0653A] hover:bg-[#c5512b] text-white font-bold text-xs tracking-wider uppercase transition-all shadow-md active:scale-[0.98] disabled:opacity-50"
                >
                  {loginLoading === 'vendor' ? 'Signing In...' : '⚡ Auto-Run Vendor Session'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────────── */}
      <footer className="py-12 border-t border-white/10 text-center text-xs text-[#C7CCD1] space-y-4">
        <div className="flex items-center justify-center space-x-2">
          <span className="text-lg">🍱</span>
          <span className="font-display font-bold text-base text-white">TiffinWala</span>
          <span className="text-white/40">|</span>
          <span>Crafted with MERN & TypeScript</span>
        </div>
        <p className="max-w-md mx-auto text-[11px] text-[#C7CCD1]/70 leading-relaxed">
          Designed and developed by <strong>Kushal Kishor Waykole</strong>. A production-grade portfolio system for real-world food logistics.
        </p>
        <div className="flex justify-center space-x-6 pt-2">
          <a
            href="https://github.com/Kushal57-2005/tiffinwala"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/80 hover:text-white hover:underline transition-colors"
          >
            GitHub Repository
          </a>
          <button
            onClick={() => navigate('/login')}
            className="text-white/80 hover:text-white hover:underline transition-colors"
          >
            Login Portal
          </button>
          <button
            onClick={() => navigate('/register')}
            className="text-white/80 hover:text-white hover:underline transition-colors"
          >
            Register
          </button>
        </div>
      </footer>
    </div>
  );
}
