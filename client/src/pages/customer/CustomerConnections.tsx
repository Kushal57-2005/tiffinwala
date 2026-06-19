/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/set-state-in-effect */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../utils/api';
import { useAuthStore } from '../../store/authStore';
import ConnectionCard, { type IConnection } from './components/ConnectionCard';
import tiffinBg from '../../assets/slate_spices_bg.png';

interface IVendorSuggestion {
  _id: string;
  businessName: string;
}

export const CustomerConnections: React.FC = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);

  // States
  const [connections, setConnections] = useState<IConnection[]>([]);
  const [myVendors, setMyVendors] = useState<IVendorSuggestion[]>([]);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [requestingId, setRequestingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'accepted' | 'pending' | 'unconnected'>('all');

  // Track cursor movement for parallax floating elements
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const handleMouseMove = (e: React.MouseEvent) => {
    const { clientX, clientY } = e;
    const x = (clientX - window.innerWidth / 2) / 45;
    const y = (clientY - window.innerHeight / 2) / 45;
    setMousePos({ x, y });
  };

  // Load connections, myVendors and wallet balance
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [connectionsRes, profileRes] = await Promise.all([
        api.get('/connections/my'),
        api.get('/customer/profile'),
      ]);

      if (connectionsRes.data?.success && Array.isArray(connectionsRes.data?.data)) {
        setConnections(connectionsRes.data.data);
      }
      if (profileRes.data?.success && profileRes.data?.data) {
        setWalletBalance(profileRes.data.data.walletBalance || 0);
        setMyVendors(profileRes.data.data.myVendors || []);
      }
    } catch (err: any) {
      console.error('Error fetching connection data:', err);
      setError(err.response?.data?.message || 'Failed to load connections data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Pay Due Handler
  const handlePayDue = async (connectionId: string) => {
    setPayingId(connectionId);
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await api.post(`/connections/${connectionId}/pay-due`);
      if (res.data?.success) {
        setSuccessMsg('Due paid successfully!');
        // Update connection state and refetch profile to sync wallet
        setConnections((prev) =>
          prev.map((c) => (c._id === connectionId ? { ...c, pendingDue: 0 } : c))
        );
        const profileRes = await api.get('/customer/profile');
        if (profileRes.data?.success && profileRes.data?.data) {
          setWalletBalance(profileRes.data.data.walletBalance || 0);
        }
        // Auto-dismiss success message
        setTimeout(() => setSuccessMsg(null), 3000);
      }
    } catch (err: any) {
      console.error('Payment error:', err);
      setError(err.response?.data?.message || 'Payment failed. Please check your wallet balance.');
    } finally {
      setPayingId(null);
    }
  };

  // Request Connection Handler
  const handleRequestConnection = async (vendorId: string) => {
    setRequestingId(vendorId);
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await api.post('/connections/request', { vendorId });
      if (res.data?.success) {
        setSuccessMsg('Connection request sent successfully!');
        // Refresh connection and profile lists
        await fetchData();
        setTimeout(() => setSuccessMsg(null), 3000);
      }
    } catch (err: any) {
      console.error('Request connection error:', err);
      setError(err.response?.data?.message || 'Failed to send connection request.');
    } finally {
      setRequestingId(null);
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

  const customerName = user ? `${user.firstName} ${user.lastName}` : 'Customer';

  // Group connections
  const acceptedConnections = connections.filter((c) => c.status === 'accepted');
  const pendingConnections = connections.filter((c) => c.status === 'pending');

  // Filter unconnected vendors (ordered from previously but no active/pending connection)
  const unconnectedVendors = myVendors.filter(
    (vendor) =>
      vendor &&
      !connections.some(
        (c) => c.vendorId && c.vendorId._id.toString() === vendor._id.toString()
      )
  );

  const showAccepted = activeTab === 'all' || activeTab === 'accepted';
  const showPending = activeTab === 'all' || activeTab === 'pending';
  const showUnconnected = activeTab === 'all' || activeTab === 'unconnected';

  const totalFilteredCount =
    (activeTab === 'all' ? connections.length + unconnectedVendors.length : 0) +
    (activeTab === 'accepted' ? acceptedConnections.length : 0) +
    (activeTab === 'pending' ? pendingConnections.length : 0) +
    (activeTab === 'unconnected' ? unconnectedVendors.length : 0);

  const isGlobalEmpty = connections.length === 0 && unconnectedVendors.length === 0;

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
        @keyframes float-sparkle {
          0%, 100% { transform: translate(0px, 0px) scale(0.8); opacity: 0.2; }
          50% { transform: translate(12px, -18px) scale(1.2); opacity: 0.6; }
        }
        .animate-scale-up { animation: scale-up 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-pulse-dot { animation: pulse-dot 2s infinite ease-in-out; }
        .floating-leaf { animation: float-slow 7s ease-in-out infinite; }
        .floating-anise { animation: float-medium 9s ease-in-out infinite; }
        .floating-cardamom { animation: float-slow 6s ease-in-out infinite; }
        .floating-clove { animation: float-medium 10s ease-in-out infinite; }
        .floating-chili { animation: float-reverse 9s ease-in-out infinite; }
        .floating-leaf-2 { animation: float-fast 6s ease-in-out infinite; }
        .pulse-glow-green { animation: pulse-glow 12s ease-in-out infinite; }
        .sparkle-slow { animation: float-sparkle 8s ease-in-out infinite; }
        .sparkle-fast { animation: float-sparkle 5s ease-in-out infinite; }
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

      {/* Background Ambient Glows (Accentuated in Leaf Green #5C7A52) */}
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
          <path
            d="M10 15C10 15 13 14 15 11"
            stroke="#FBF4EC"
            strokeWidth="0.5"
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
          <path
            d="M12 2C8 6 6 12 12 22C18 12 16 6 12 2Z"
            fill="#7E9C73"
            opacity="0.8"
          />
          <path
            d="M12 2C10 6 9 12 12 22"
            stroke="#5C7A52"
            strokeWidth="0.8"
          />
        </svg>
      </div>

      <div className="max-w-6xl mx-auto px-4 pt-6 md:pt-10 relative z-10">
        {/* ==========================================
            1. TOP HEADER BAR
           ========================================== */}
        <header className="relative z-30 bg-white/40 border border-white/30 backdrop-blur-xl rounded-[32px] p-5 md:p-6 shadow-[0_24px_70px_-15px_rgba(43,33,24,0.12)] mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3 w-full sm:w-auto">
            <button
              onClick={() => navigate('/customer/home')}
              title="Go back to Home"
              className="w-10 h-10 rounded-xl bg-white/70 hover:bg-leaf/10 hover:text-leaf border border-[#2B2118]/10 flex items-center justify-center text-[#2B2118]/80 transition-all duration-200 hover:scale-105 active:scale-95 shadow-sm shrink-0 cursor-pointer"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.5}
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="text-left">
              <p className="text-[10px] text-[#2B2118]/50 font-bold uppercase tracking-wider font-body">
                Dashboard
              </p>
              <h1 className="font-display text-2xl md:text-3xl font-extrabold text-[#2B2118]">
                My Connections
              </h1>
            </div>
          </div>

          <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-3">
            {/* Wallet Balance Pill */}
            <div className="bg-leaf/10 border border-leaf/20 rounded-2xl pl-4 pr-3 py-2 flex items-center gap-3 select-none shadow-sm bg-white/30">
              <div className="flex items-center gap-2">
                <svg
                  className="w-4 h-4 text-leaf"
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
                  <p className="text-sm font-extrabold text-leaf leading-none mt-1">
                    ₹{walletBalance.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            {/* Profile Avatar */}
            <div className="w-10 h-10 rounded-xl bg-leaf/10 border border-leaf/20 flex items-center justify-center shrink-0 shadow-sm">
              <span className="text-sm font-display font-extrabold text-leaf select-none">
                {customerName ? getInitials(customerName) : 'C'}
              </span>
            </div>
          </div>
        </header>

        {/* Notifications & Error alerts */}
        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl flex items-start gap-3 shadow-sm animate-scale-up animate-fade-in-up">
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
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-start gap-3 shadow-sm animate-scale-up animate-fade-in-up">
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

        {/* ==========================================
            2. TABS & FILTER BAR
           ========================================== */}
        <div className="flex flex-wrap justify-between items-center gap-4 mb-8 select-none">
          <div className="flex gap-2 overflow-x-auto no-scrollbar max-w-full bg-white/40 border border-white/20 p-1.5 rounded-[20px] backdrop-blur-md scroll-smooth whitespace-nowrap">
            {[
              { id: 'all', label: 'All', count: connections.length + unconnectedVendors.length },
              { id: 'accepted', label: 'Connected', count: acceptedConnections.length },
              { id: 'pending', label: 'Pending', count: pendingConnections.length },
              { id: 'unconnected', label: 'Past Vendors', count: unconnectedVendors.length },
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 flex items-center gap-1.5 shrink-0 whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-leaf text-white shadow-sm scale-105'
                      : 'text-[#2B2118]/60 hover:text-charcoal hover:bg-white/40'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded-md text-[10px] font-extrabold ${
                      isActive ? 'bg-white/20 text-white' : 'bg-leaf/10 text-leaf'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="text-xs text-[#2B2118]/60 font-semibold font-body">
            Showing <span className="font-extrabold text-leaf">{totalFilteredCount}</span>{' '}
            {totalFilteredCount === 1 ? 'record' : 'records'}
          </div>
        </div>

        {/* ==========================================
            3. CONNECTIONS GRID & SECTIONS
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
              Loading Connections...
            </p>
          </div>
        ) : isGlobalEmpty ? (
          /* Global Empty State */
          <div className="bg-white/30 backdrop-blur-md border border-[#2B2118]/10 border-dashed rounded-[32px] p-12 text-center flex flex-col items-center justify-center min-h-[300px] shadow-sm max-w-lg mx-auto">
            <div className="w-20 h-20 mb-5 text-leaf/40 stroke-current">
              <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
                <path
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <h3 className="font-display text-xl font-bold text-charcoal mb-2">
              No connections found
            </h3>
            <p className="text-xs text-[#2B2118]/50 max-w-xs leading-relaxed font-body mb-6">
              You haven't established connections with any tiffin vendors yet. Search for vendors on the home page and send a connection request.
            </p>
            <button
              onClick={() => navigate('/customer/home')}
              className="py-3 px-6 rounded-2xl bg-leaf hover:bg-leaf/90 text-white font-display font-bold text-xs uppercase tracking-wider shadow-[0_8px_25px_rgba(92,122,82,0.25)] hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
            >
              Discover Vendors
            </button>
          </div>
        ) : (
          <div className="space-y-12">
            {/* Accepted Section */}
            {showAccepted && (
              <div className="space-y-4">
                <div className="px-1 flex items-center justify-between border-b border-[#2B2118]/5 pb-2">
                  <h2 className="font-display text-xl font-bold text-[#2B2118] flex items-center gap-2">
                    <span>Connected Vendors</span>
                    <span className="text-xs font-bold font-body px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-800">
                      {acceptedConnections.length} Active
                    </span>
                  </h2>
                </div>

                {acceptedConnections.length === 0 ? (
                  <div className="p-6 bg-white/20 border border-[#2B2118]/5 rounded-[24px] text-center text-xs text-[#2B2118]/45 font-medium py-10">
                    No active connections found.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {acceptedConnections.map((c) => (
                      <ConnectionCard
                        key={c._id}
                        connection={c}
                        onPayDue={handlePayDue}
                        isPaying={payingId === c._id}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Pending Section */}
            {showPending && (
              <div className="space-y-4">
                <div className="px-1 flex items-center justify-between border-b border-[#2B2118]/5 pb-2">
                  <h2 className="font-display text-xl font-bold text-[#2B2118] flex items-center gap-2">
                    <span>Pending Requests</span>
                    <span className="text-xs font-bold font-body px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-800">
                      {pendingConnections.length} Pending
                    </span>
                  </h2>
                </div>

                {pendingConnections.length === 0 ? (
                  <div className="p-6 bg-white/20 border border-[#2B2118]/5 rounded-[24px] text-center text-xs text-[#2B2118]/45 font-medium py-10">
                    No pending connection requests.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {pendingConnections.map((c) => (
                      <ConnectionCard key={c._id} connection={c} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Unconnected Past Vendors Section */}
            {showUnconnected && (
              <div className="space-y-4">
                <div className="px-1 flex items-center justify-between border-b border-[#2B2118]/5 pb-2">
                  <h2 className="font-display text-xl font-bold text-[#2B2118] flex items-center gap-2">
                    <span>Connect with Past Vendors</span>
                    <span className="text-xs font-bold font-body px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-800">
                      {unconnectedVendors.length} Available
                    </span>
                  </h2>
                </div>

                {unconnectedVendors.length === 0 ? (
                  <div className="p-6 bg-white/20 border border-[#2B2118]/5 rounded-[24px] text-center text-xs text-[#2B2118]/45 font-medium py-10">
                    No past vendors available for connection requests.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {unconnectedVendors.map((vendor) => (
                      <div
                        key={vendor._id}
                        className="bg-white/40 border border-white/30 backdrop-blur-xl rounded-[32px] p-6 shadow-[0_24px_70px_-15px_rgba(43,33,24,0.12)] hover:shadow-[0_28px_80px_-15px_rgba(43,33,24,0.16)] hover:border-leaf/30 hover:bg-white/60 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between h-full group"
                      >
                        <div className="space-y-4">
                          <div className="flex justify-between items-start gap-4">
                            <h3 className="font-display font-extrabold text-lg text-[#2B2118] leading-snug group-hover:text-leaf transition-colors line-clamp-2">
                              {vendor.businessName}
                            </h3>
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full border bg-gray-50 border-gray-200 text-gray-500 select-none">
                              Unconnected
                            </span>
                          </div>
                          <div className="h-px bg-[#2B2118]/5 w-full" />
                          <p className="text-xs text-[#2B2118]/60 font-body leading-relaxed">
                            You have successfully ordered from this vendor before. Send a connection request to link your tiffin subscriptions.
                          </p>
                        </div>
                        <div className="mt-6">
                          <button
                            onClick={() => handleRequestConnection(vendor._id)}
                            disabled={requestingId === vendor._id}
                            className="w-full py-3.5 px-4 rounded-2xl font-display font-bold text-xs uppercase tracking-wider border bg-white hover:bg-leaf hover:text-white border-leaf/20 text-leaf hover:border-leaf flex items-center justify-center gap-2 cursor-pointer transition-all duration-300 active:scale-98 disabled:opacity-50"
                          >
                            {requestingId === vendor._id ? (
                              <>
                                <svg
                                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-leaf group-hover:text-white"
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
                                Sending...
                              </>
                            ) : (
                              'Request Connection'
                            )}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerConnections;
