import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UtensilsCrossed,
  Zap,
  Users,
  Ticket,
  CreditCard,
  Utensils,
  Handshake,
  BarChart3,
  MapPin,
  Clock,
  User,
  ChefHat,
  CheckCircle2,
  AlertCircle,
  Radio,
  Sparkles,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { api } from '../utils/api';
import tiffinBg from '../assets/slate_spices_bg.png';

export default function LandingPage() {
  const navigate = useNavigate();
  const setUser = useAuthStore((state) => state.setUser);
  const [activeTab, setActiveTab] = useState<'customer' | 'vendor' | 'tech'>('customer');
  const [loginLoading, setLoginLoading] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // 1-Click Reviewer Auto-Login
  const handleAutoLogin = async (role: 'customer' | 'vendor') => {
    setLoginLoading(role);
    setFeedback(null);
    const email = role === 'customer' ? 'customer@tiffinwala.com' : 'vendor@tiffinwala.com';
    const password = role === 'customer' ? 'customer@123' : 'vendor@123';

    try {
      if (role === 'customer') {
        const res = await api.post('/auth/login/customer', { emailOrPhone: email, password });
        const { token, ...userData } = res.data.data;
        localStorage.setItem('token', token);
        setUser(userData);
        setFeedback({ type: 'success', text: 'Customer session verified! Heading to dashboard...' });
        setTimeout(() => navigate('/customer/home'), 400);
      } else {
        const res = await api.post('/auth/login/vendor', { emailOrPhone: email, password });
        if (res.data?.data?.token) {
          const { token, ...userData } = res.data.data;
          localStorage.setItem('token', token);
          setUser(userData);
          setFeedback({ type: 'success', text: 'Vendor session verified! Heading to kitchen dashboard...' });
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
          setFeedback({ type: 'success', text: 'Vendor session verified! Heading to kitchen dashboard...' });
          setTimeout(() => navigate('/vendor/home'), 400);
        }
      }
    } catch (err: any) {
      setFeedback({ type: 'error', text: `Login error: ${err.response?.data?.message || err.message}` });
      setLoginLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#FBF4EC] font-body text-[#2B2118] selection:bg-[#E0653A] selection:text-white relative overflow-hidden">
      {/* Background Texture Overlay matching Main App */}
      <img
        src={tiffinBg}
        alt=""
        className="absolute inset-0 w-full h-full object-cover opacity-[0.03] mix-blend-multiply pointer-events-none select-none z-0"
      />

      {/* Floating subtle herbal leaves (matching Customer & Vendor dashboard) */}
      <div className="absolute top-[10%] left-[4%] opacity-70 pointer-events-none z-10 hidden md:block animate-pulse duration-1000">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
          <path
            d="M2 22C2 22 7 21 12 16C17 11 20 6 22 2C22 2 17 2 12 6C7 10 3 15 2 22Z"
            fill="#5C7A52"
            opacity="0.8"
          />
          <path d="M2 22C6 18 12 14 22 2" stroke="#FBF4EC" strokeWidth="0.8" strokeLinecap="round" />
        </svg>
      </div>

      <div className="absolute top-[32%] right-[5%] opacity-60 pointer-events-none z-10 hidden md:block">
        <svg width="34" height="34" viewBox="0 0 24 24" fill="none">
          <path
            d="M2 22C2 22 7 21 12 16C17 11 20 6 22 2C22 2 17 2 12 6C7 10 3 15 2 22Z"
            fill="#8C5B3E"
            opacity="0.75"
          />
          <path d="M2 22C6 18 12 14 22 2" stroke="#FBF4EC" strokeWidth="0.8" strokeLinecap="round" />
        </svg>
      </div>

      <div className="absolute bottom-[20%] left-[6%] opacity-60 pointer-events-none z-10 hidden md:block">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
          <path
            d="M2 22C2 22 7 21 12 16C17 11 20 6 22 2C22 2 17 2 12 6C7 10 3 15 2 22Z"
            fill="#5C7A52"
            opacity="0.7"
          />
        </svg>
      </div>

      {/* ── STICKY TOP NAVBAR ──────────────────────────────────── */}
      <nav className="sticky top-0 z-50 bg-[#FBF4EC]/90 backdrop-blur-md border-b border-[#2B2118]/10 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Brand */}
          <div
            className="flex items-center space-x-3 cursor-pointer"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#E0653A] to-[#F2B340] flex items-center justify-center shadow-sm text-white">
              <UtensilsCrossed className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-display font-bold text-2xl tracking-tight text-[#2B2118]">TiffinWala</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#5C7A52]/15 text-[#44613b] border border-[#5C7A52]/30">
                  Live
                </span>
              </div>
              <p className="text-[11px] text-[#2B2118]/60 tracking-wide font-medium">Daily Meal Infrastructure</p>
            </div>
          </div>

          {/* Nav Center Links */}
          <div className="hidden md:flex items-center space-x-8 text-sm font-medium text-[#2B2118]/70">
            <a href="#customers" className="hover:text-[#2B2118] transition-colors">For Customers</a>
            <a href="#vendors" className="hover:text-[#2B2118] transition-colors">For Kitchens</a>
            <a href="#workflow" className="hover:text-[#2B2118] transition-colors">How It Works</a>
            <a href="#architecture" className="hover:text-[#2B2118] transition-colors">Architecture</a>
            <a href="#reviewer" className="hover:text-[#E0653A] text-[#E0653A] font-bold transition-colors flex items-center space-x-1.5">
              <Zap className="w-4 h-4 fill-current text-[#E0653A]" />
              <span>Reviewer Demos</span>
            </a>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate('/login')}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold text-[#2B2118] hover:bg-white/60 border border-[#2B2118]/15 bg-white/40 shadow-sm transition-all"
            >
              Sign In
            </button>
            <button
              onClick={() => navigate('/register')}
              className="px-5 py-2.5 rounded-xl text-sm font-bold bg-[#E0653A] hover:bg-[#c9532a] text-white shadow-sm transition-all transform hover:scale-[1.02] active:scale-[0.98]"
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* ── HERO SECTION ───────────────────────────────────────── */}
      <section className="relative pt-14 pb-16 md:pt-20 md:pb-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto z-10">
        <div className="text-center max-w-4xl mx-auto space-y-6">
          {/* Main Headline */}
          <h1 className="font-display text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight text-[#2B2118] leading-[1.12]">
            The Modern Daily Meal <br />
            <span className="text-[#E0653A] relative">
              Operating System
              <svg className="absolute -bottom-2 left-0 w-full h-2 text-[#F2B340]/60" viewBox="0 0 100 10" preserveAspectRatio="none">
                <path d="M0 5 Q 50 12 100 5" stroke="currentColor" strokeWidth="3" fill="none" />
              </svg>
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg md:text-xl text-[#2B2118]/70 max-w-2xl mx-auto leading-relaxed">
            Connecting homestyle tiffin kitchens with students and working professionals. Hyperlocal geo-discovery,
            multi-roommate split billing, flexible token subscriptions, automated monthly tally, and live socket chat.
          </p>

          {/* Dual Action CTAs + Reviewer Jump */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <button
              onClick={() => handleAutoLogin('customer')}
              disabled={loginLoading !== null}
              className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-[#5C7A52] hover:bg-[#4a6342] text-white font-bold text-sm shadow-md transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <Zap className="w-4 h-4 fill-current" />
              <span>{loginLoading === 'customer' ? 'Signing in...' : 'Instant Guest Customer'}</span>
              <span className="text-xs opacity-80 font-normal">(customer@tiffinwala.com)</span>
            </button>
            <button
              onClick={() => handleAutoLogin('vendor')}
              disabled={loginLoading !== null}
              className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-[#E0653A] hover:bg-[#c5512b] text-white font-bold text-sm shadow-md transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <Zap className="w-4 h-4 fill-current" />
              <span>{loginLoading === 'vendor' ? 'Signing in...' : 'Instant Guest Vendor'}</span>
              <span className="text-xs opacity-80 font-normal">(vendor@tiffinwala.com)</span>
            </button>
          </div>

          {feedback && (
            <div className="pt-2 flex justify-center">
              <span
                className={`inline-flex items-center space-x-1.5 text-xs font-semibold px-4 py-2 rounded-xl border shadow-sm ${
                  feedback.type === 'success'
                    ? 'bg-[#5C7A52]/10 border-[#5C7A52]/25 text-[#426139]'
                    : 'bg-[#E0653A]/10 border-[#E0653A]/25 text-[#b94a24]'
                }`}
              >
                {feedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-[#5C7A52]" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-[#E0653A]" />
                )}
                <span>{feedback.text}</span>
              </span>
            </div>
          )}

          {/* Trust Metrics Bar */}
          <div className="pt-10 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
            <div className="p-4 rounded-2xl bg-white/70 border border-[#2B2118]/10 shadow-sm text-center">
              <div className="text-2xl font-bold font-display text-[#2B2118]">0s</div>
              <div className="text-xs text-[#2B2118]/60 mt-0.5 font-medium">Direct Booking (Zero Barrier)</div>
            </div>
            <div className="p-4 rounded-2xl bg-white/70 border border-[#2B2118]/10 shadow-sm text-center">
              <div className="text-2xl font-bold font-display text-[#E0653A]">N × 2 Days</div>
              <div className="text-xs text-[#2B2118]/60 mt-0.5 font-medium">Fair Token Subscription Expiry</div>
            </div>
            <div className="p-4 rounded-2xl bg-white/70 border border-[#2B2118]/10 shadow-sm text-center">
              <div className="text-2xl font-bold font-display text-[#5C7A52]">Multi-Profile</div>
              <div className="text-xs text-[#2B2118]/60 mt-0.5 font-medium">Roommate Tiffin Splitting</div>
            </div>
            <div className="p-4 rounded-2xl bg-white/70 border border-[#2B2118]/10 shadow-sm text-center">
              <div className="text-2xl font-bold font-display text-[#8C5B3E]">Automated</div>
              <div className="text-xs text-[#2B2118]/60 mt-0.5 font-medium">PDF Monthly Bills & Cron Jobs</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CORE ROLE PREVIEWS SECTION ──────────────────────────── */}
      <section id="features" className="py-20 bg-white/50 border-y border-[#2B2118]/10 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-xs font-bold uppercase tracking-widest text-[#E0653A]">Engineered For Two Worlds</h2>
            <p className="font-display text-3xl sm:text-4xl font-bold text-[#2B2118] mt-2">
              Dual-Sided Experience, Zero Friction
            </p>
            <p className="text-sm text-[#2B2118]/70 mt-2">
              Every workflow in TiffinWala addresses real daily food delivery realities documented in our Product Requirements.
            </p>

            {/* Interactive Toggle Pill */}
            <div className="inline-flex p-1.5 rounded-2xl bg-[#FBF4EC] border border-[#2B2118]/15 mt-6 space-x-1 shadow-sm">
              <button
                onClick={() => setActiveTab('customer')}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'customer'
                    ? 'bg-[#5C7A52] text-white shadow-sm'
                    : 'text-[#2B2118]/70 hover:text-[#2B2118]'
                }`}
              >
                Customer Features (Students & Pros)
              </button>
              <button
                onClick={() => setActiveTab('vendor')}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'vendor'
                    ? 'bg-[#E0653A] text-white shadow-sm'
                    : 'text-[#2B2118]/70 hover:text-[#2B2118]'
                }`}
              >
                Kitchen Features (Vendors)
              </button>
              <button
                onClick={() => setActiveTab('tech')}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'tech'
                    ? 'bg-[#2B2118] text-white shadow-sm'
                    : 'text-[#2B2118]/70 hover:text-[#2B2118]'
                }`}
              >
                Architecture & Cron Jobs
              </button>
            </div>
          </div>

          {/* 1. Customer Tab Content */}
          {activeTab === 'customer' && (
            <div id="customers" className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fadeIn">
              <div className="p-7 rounded-3xl bg-white/80 border border-[#2B2118]/10 shadow-sm space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-[#5C7A52]/15 border border-[#5C7A52]/30 flex items-center justify-center">
                  <Users className="w-6 h-6 text-[#5C7A52]" />
                </div>
                <h3 className="font-display text-xl font-bold text-[#2B2118]">Multi-Profile Roommate Splitting</h3>
                <p className="text-sm text-[#2B2118]/75 leading-relaxed">
                  Unique differentiator: One customer account can register multiple friend/roommate profiles (e.g. 1 for Aman, 1 for Rahul).
                  Assign individual meals at checkout and receive split ledger tallies at month-end.
                </p>
                <div className="pt-2 text-xs text-[#5C7A52] font-semibold flex items-center space-x-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Built into Order Schema & Checkout</span>
                </div>
              </div>

              <div className="p-7 rounded-3xl bg-white/80 border border-[#2B2118]/10 shadow-sm space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-[#F2B340]/20 border border-[#F2B340]/40 flex items-center justify-center">
                  <Ticket className="w-6 h-6 text-[#8C5B3E]" />
                </div>
                <h3 className="font-display text-xl font-bold text-[#2B2118]">Coupon-Based Subscriptions</h3>
                <p className="text-sm text-[#2B2118]/75 leading-relaxed">
                  Buy a 20-token bundle and redeem meals strictly when you eat. No forced daily deductions if you skip a meal or go home for weekends.
                  Visual health badges: Low (≤3), Medium, Good stock.
                </p>
                <div className="pt-2 text-xs text-[#8C5B3E] font-semibold flex items-center space-x-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Fair Expiry = Tokens × 2 Days</span>
                </div>
              </div>

              <div className="p-7 rounded-3xl bg-white/80 border border-[#2B2118]/10 shadow-sm space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-[#E0653A]/15 border border-[#E0653A]/30 flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-[#E0653A]" />
                </div>
                <h3 className="font-display text-xl font-bold text-[#2B2118]">Wallet & Monthly Credit Tab</h3>
                <p className="text-sm text-[#2B2118]/75 leading-relaxed">
                  Pay instantly using built-in digital wallet, or request a <strong>Monthly Billing Connection</strong> with trusted vendors
                  to add meals to pending dues for consolidated month-end settlement.
                </p>
                <div className="pt-2 text-xs text-[#E0653A] font-semibold flex items-center space-x-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Auto-Settled via Month-End Cron</span>
                </div>
              </div>
            </div>
          )}

          {/* 2. Vendor Tab Content */}
          {activeTab === 'vendor' && (
            <div id="vendors" className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fadeIn">
              <div className="p-7 rounded-3xl bg-white/80 border border-[#2B2118]/10 shadow-sm space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-[#E0653A]/15 border border-[#E0653A]/30 flex items-center justify-center">
                  <Utensils className="w-6 h-6 text-[#E0653A]" />
                </div>
                <h3 className="font-display text-xl font-bold text-[#2B2118]">Daily Session Menu Publishing</h3>
                <p className="text-sm text-[#2B2118]/75 leading-relaxed">
                  Vendors configure distinct Lunch & Dinner sessions with multi-tier pricing (Standard / Deluxe Thali), custom add-ons (extra roti, sweet),
                  and real-time quantity quotas with instant Open/Close kitchen toggles.
                </p>
                <div className="pt-2 text-xs text-[#E0653A] font-semibold flex items-center space-x-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Prevents overbooking with quota guards</span>
                </div>
              </div>

              <div className="p-7 rounded-3xl bg-white/80 border border-[#2B2118]/10 shadow-sm space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-[#F2B340]/20 border border-[#F2B340]/40 flex items-center justify-center">
                  <Handshake className="w-6 h-6 text-[#8C5B3E]" />
                </div>
                <h3 className="font-display text-xl font-bold text-[#2B2118]">Credit Customer Management</h3>
                <p className="text-sm text-[#2B2118]/75 leading-relaxed">
                  Vendors maintain transparent ledger connections for customers on monthly khata. Review incoming credit requests,
                  track each customer's accumulated <code>pendingDue</code>, and see who owes what at a glance.
                </p>
                <div className="pt-2 text-xs text-[#8C5B3E] font-semibold flex items-center space-x-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Connection & DuePayment schemas</span>
                </div>
              </div>

              <div className="p-7 rounded-3xl bg-white/80 border border-[#2B2118]/10 shadow-sm space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-[#5C7A52]/15 border border-[#5C7A52]/30 flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-[#5C7A52]" />
                </div>
                <h3 className="font-display text-xl font-bold text-[#2B2118]">Platform Fee & Revenue Analytics</h3>
                <p className="text-sm text-[#2B2118]/75 leading-relaxed">
                  Transparent 10% platform fee auto-deducted each month from the vendor's initial ₹9,999 registration balance.
                  Live analytics for gross revenue, net payout, ratings breakdown, and customer retention metrics.
                </p>
                <div className="pt-2 text-xs text-[#5C7A52] font-semibold flex items-center space-x-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Automated monthly invoice generation</span>
                </div>
              </div>
            </div>
          )}

          {/* 3. Tech & Architecture Tab */}
          {activeTab === 'tech' && (
            <div id="architecture" className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fadeIn">
              <div className="p-7 rounded-3xl bg-white/80 border border-[#2B2118]/10 shadow-sm space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-[#F2B340]/20 border border-[#F2B340]/40 flex items-center justify-center">
                  <MapPin className="w-6 h-6 text-[#8C5B3E]" />
                </div>
                <h3 className="font-display text-xl font-bold text-[#2B2118]">Hyperlocal Geospatial Engine</h3>
                <p className="text-sm text-[#2B2118]/75 leading-relaxed">
                  Leverages MongoDB's <code>2dsphere</code> index. Automatically queries vendors within their specified delivery radius (km)
                  relative to the customer's exact GPS latitude & longitude.
                </p>
                <div className="pt-2 text-xs text-[#8C5B3E] font-semibold flex items-center space-x-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>MongoDB $near & $geoWithin Queries</span>
                </div>
              </div>

              <div className="p-7 rounded-3xl bg-white/80 border border-[#2B2118]/10 shadow-sm space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-[#5C7A52]/15 border border-[#5C7A52]/30 flex items-center justify-center">
                  <Radio className="w-6 h-6 text-[#5C7A52]" />
                </div>
                <h3 className="font-display text-xl font-bold text-[#2B2118]">Real-Time Socket.io Gateway</h3>
                <p className="text-sm text-[#2B2118]/75 leading-relaxed">
                  Dedicated in-memory socket manager maps active connected user IDs to socket sessions.
                  Instantly unlocks customer-vendor chat upon order placement with built-in complaint lifecycle tracking (<code>Raised</code> → <code>Acknowledged</code> → <code>Resolved</code>).
                </p>
                <div className="pt-2 text-xs text-[#5C7A52] font-semibold flex items-center space-x-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Bi-directional live messaging</span>
                </div>
              </div>

              <div className="p-7 rounded-3xl bg-white/80 border border-[#2B2118]/10 shadow-sm space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-[#E0653A]/15 border border-[#E0653A]/30 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-[#E0653A]" />
                </div>
                <h3 className="font-display text-xl font-bold text-[#2B2118]">Scheduled Node-Cron Daemons</h3>
                <p className="text-sm text-[#2B2118]/75 leading-relaxed">
                  Two background crons keep the system running autonomously:
                  <br />• <strong>Monthly Billing Cron</strong>: Runs midnight on 1st of every month to compute bills, generate HTML/PDF, and email tallies.
                  <br />• <strong>Token Expiry Cron</strong>: Runs daily at 9:00 AM to mark elapsed tokens and trigger push alerts.
                </p>
                <div className="pt-2 text-xs text-[#E0653A] font-semibold flex items-center space-x-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Fully backgrounded cron tasks</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── STEP-BY-STEP WORKFLOW ───────────────────────────────── */}
      <section id="workflow" className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10 relative">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-xs font-bold uppercase tracking-widest text-[#5C7A52]">Lifecycle Blueprint</h2>
          <p className="font-display text-3xl sm:text-4xl font-bold text-[#2B2118] mt-2">How An Order Travels</p>
          <p className="text-sm text-[#2B2118]/70 mt-2">
            No gatekeeping or approval hurdles. Customers discover, customize, split, and track meals in seconds.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative">
          <div className="p-6 rounded-3xl bg-white/70 border border-[#2B2118]/10 shadow-sm space-y-3">
            <div className="text-xs font-bold text-[#E0653A] uppercase tracking-wider">Step 01</div>
            <h4 className="font-display font-bold text-lg text-[#2B2118]">Geo Discovery</h4>
            <p className="text-xs text-[#2B2118]/70 leading-relaxed">
              Customer views nearby verified kitchens sorted by live distance and kitchen open/closed status.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white/70 border border-[#2B2118]/10 shadow-sm space-y-3">
            <div className="text-xs font-bold text-[#8C5B3E] uppercase tracking-wider">Step 02</div>
            <h4 className="font-display font-bold text-lg text-[#2B2118]">Select & Split</h4>
            <p className="text-xs text-[#2B2118]/70 leading-relaxed">
              Customer picks Thali tiers and divides quantities across roommate profiles with special kitchen instructions.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white/70 border border-[#2B2118]/10 shadow-sm space-y-3">
            <div className="text-xs font-bold text-[#5C7A52] uppercase tracking-wider">Step 03</div>
            <h4 className="font-display font-bold text-lg text-[#2B2118]">Flexible Payment</h4>
            <p className="text-xs text-[#2B2118]/70 leading-relaxed">
              Redeem subscription tokens, deduct from wallet, or post to Monthly Bill tab (if connected).
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white/70 border border-[#2B2118]/10 shadow-sm space-y-3">
            <div className="text-xs font-bold text-[#E0653A] uppercase tracking-wider">Step 04</div>
            <h4 className="font-display font-bold text-lg text-[#2B2118]">Live Kitchen Queue</h4>
            <p className="text-xs text-[#2B2118]/70 leading-relaxed">
              Vendor accepts order request. Real-time chat unlocks instantly for delivery coordination.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white/70 border border-[#2B2118]/10 shadow-sm space-y-3">
            <div className="text-xs font-bold text-[#5C7A52] uppercase tracking-wider">Step 05</div>
            <h4 className="font-display font-bold text-lg text-[#2B2118]">Delivery & Tally</h4>
            <p className="text-xs text-[#2B2118]/70 leading-relaxed">
              Kitchen marks Delivered, customer confirms, ratings update, and order logs to monthly automated PDF statement.
            </p>
          </div>
        </div>
      </section>

      {/* ── REVIEWER / RECRUITER PLAYGROUND ────────────────────── */}
      <section id="reviewer" className="py-20 bg-white/40 border-t border-[#2B2118]/10 relative z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="p-8 sm:p-12 rounded-[32px] bg-white/80 border border-[#E0653A]/25 backdrop-blur-md shadow-sm relative overflow-hidden">
            <div className="flex items-center space-x-2 mb-3">
              <span className="p-1 rounded-lg bg-[#E0653A]/10 text-[#E0653A]">
                <Sparkles className="w-3.5 h-3.5" />
              </span>
              <span className="text-xs font-bold uppercase tracking-widest text-[#E0653A] font-body">
                Recruiter & Reviewer Test Drive
              </span>
            </div>

            <h3 className="font-display text-2xl sm:text-4xl font-bold text-[#2B2118] mb-3">
              One-Click Instant Evaluation
            </h3>
            <p className="text-sm text-[#2B2118]/75 max-w-2xl leading-relaxed mb-8">
              No need to register fake phone numbers or verify test OTPs. We have pre-seeded full production-grade demo accounts
              with loaded wallets, active lunch menus, connected friend profiles, and pending dues so you can test the entire workflow in seconds.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Customer Box */}
              <div className="p-6 rounded-2xl bg-[#FBF4EC] border border-[#2B2118]/10 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <User className="w-5 h-5 text-[#5C7A52]" />
                    <span className="font-bold text-sm text-[#2B2118]">Customer Demo Account</span>
                  </div>
                  <span className="text-[10px] bg-[#5C7A52]/15 text-[#426139] px-2 py-0.5 rounded-full font-semibold border border-[#5C7A52]/25">
                    ₹2,000 Wallet
                  </span>
                </div>
                <div className="text-xs text-[#2B2118]/70 space-y-1">
                  <div><strong>Email:</strong> <code className="bg-white px-2 py-0.5 rounded border border-[#2B2118]/10 text-[#2B2118]">customer@tiffinwala.com</code></div>
                  <div><strong>Password:</strong> <code className="bg-white px-2 py-0.5 rounded border border-[#2B2118]/10 text-[#2B2118]">customer@123</code></div>
                  <div className="text-[11px] text-[#2B2118]/50 pt-1">Preloaded with roommate split profiles & delivery location</div>
                </div>
                <button
                  onClick={() => handleAutoLogin('customer')}
                  disabled={loginLoading !== null}
                  className="w-full mt-2 py-3 rounded-xl bg-[#5C7A52] hover:bg-[#4a6342] text-white font-bold text-xs tracking-wider uppercase transition-all shadow-sm active:scale-[0.98] disabled:opacity-50 flex items-center justify-center space-x-1.5"
                >
                  <Zap className="w-3.5 h-3.5 fill-current" />
                  <span>{loginLoading === 'customer' ? 'Signing In...' : 'Auto-Run Customer Session'}</span>
                </button>
              </div>

              {/* Vendor Box */}
              <div className="p-6 rounded-2xl bg-[#FBF4EC] border border-[#2B2118]/10 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <ChefHat className="w-5 h-5 text-[#E0653A]" />
                    <span className="font-bold text-sm text-[#2B2118]">Vendor Demo Kitchen</span>
                  </div>
                  <span className="text-[10px] bg-[#E0653A]/15 text-[#b94a24] px-2 py-0.5 rounded-full font-semibold border border-[#E0653A]/25">
                    Active Kitchen
                  </span>
                </div>
                <div className="text-xs text-[#2B2118]/70 space-y-1">
                  <div><strong>Email:</strong> <code className="bg-white px-2 py-0.5 rounded border border-[#2B2118]/10 text-[#2B2118]">vendor@tiffinwala.com</code></div>
                  <div><strong>Password:</strong> <code className="bg-white px-2 py-0.5 rounded border border-[#2B2118]/10 text-[#2B2118]">vendor@123</code></div>
                  <div className="text-[11px] text-[#2B2118]/50 pt-1">Platform fee verified + today's lunch menu pre-published</div>
                </div>
                <button
                  onClick={() => handleAutoLogin('vendor')}
                  disabled={loginLoading !== null}
                  className="w-full mt-2 py-3 rounded-xl bg-[#E0653A] hover:bg-[#c5512b] text-white font-bold text-xs tracking-wider uppercase transition-all shadow-sm active:scale-[0.98] disabled:opacity-50 flex items-center justify-center space-x-1.5"
                >
                  <Zap className="w-3.5 h-3.5 fill-current" />
                  <span>{loginLoading === 'vendor' ? 'Signing In...' : 'Auto-Run Vendor Session'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────────── */}
      <footer className="py-12 border-t border-[#2B2118]/10 text-center text-xs text-[#2B2118]/70 space-y-4 bg-white/40">
        <div className="flex items-center justify-center space-x-2">
          <UtensilsCrossed className="w-5 h-5 text-[#E0653A]" />
          <span className="font-display font-bold text-base text-[#2B2118]">TiffinWala</span>
          <span className="text-[#2B2118]/30">|</span>
          <span>Crafted with MERN & TypeScript</span>
        </div>
        <p className="max-w-md mx-auto text-[11px] text-[#2B2118]/60 leading-relaxed">
          Designed and developed by <strong>Kushal Kishor Waykole</strong>. A production-grade portfolio system for real-world food logistics.
        </p>
        <div className="flex justify-center space-x-6 pt-2 font-medium">
          <a
            href="https://github.com/Kushal57-2005/tiffinwala"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#2B2118]/80 hover:text-[#E0653A] hover:underline transition-colors"
          >
            GitHub Repository
          </a>
          <button
            onClick={() => navigate('/login')}
            className="text-[#2B2118]/80 hover:text-[#E0653A] hover:underline transition-colors"
          >
            Login Portal
          </button>
          <button
            onClick={() => navigate('/register')}
            className="text-[#2B2118]/80 hover:text-[#E0653A] hover:underline transition-colors"
          >
            Register
          </button>
        </div>
      </footer>
    </div>
  );
}
