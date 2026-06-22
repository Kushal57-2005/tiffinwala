/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/set-state-in-effect */
import React, { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import StatusBadge from '../customer/components/StatusBadge';
import tiffinBg from '../../assets/slate_spices_bg.png';
import { MobileNavbar } from '../../components/MobileNavbar';
import { DashboardHeader } from '../../components/DashboardHeader';

interface ConnectionUser {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  age?: number;
}

interface ConnectionCustomer {
  _id: string;
  userId: ConnectionUser;
}

interface IVendorConnection {
  _id: string;
  customerId: ConnectionCustomer;
  vendorId: string;
  status: 'pending' | 'accepted' | 'rejected';
  pendingDue: number;
  createdAt: string;
  updatedAt: string;
}

export const VendorConnections: React.FC = () => {
  // States
  const [connections, setConnections] = useState<IVendorConnection[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [actionType, setActionType] = useState<'accept' | 'reject' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'accepted' | 'pending'>('all');

  // Track cursor movement for parallax floating elements
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const handleMouseMove = (e: React.MouseEvent) => {
    const { clientX, clientY } = e;
    const x = (clientX - window.innerWidth / 2) / 45;
    const y = (clientY - window.innerHeight / 2) / 45;
    setMousePos({ x, y });
  };

  // Load connections
  const fetchConnections = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/connections/vendor');
      if (res.data?.success && Array.isArray(res.data?.data)) {
        setConnections(res.data.data);
      }
    } catch (err: any) {
      console.error('Error fetching vendor connections:', err);
      setError(err.response?.data?.message || 'Failed to load connections.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConnections();
  }, []);

  // Accept Connection request
  const handleAcceptConnection = async (connectionId: string) => {
    setActioningId(connectionId);
    setActionType('accept');
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await api.put(`/connections/${connectionId}/accept`);
      if (res.data?.success) {
        setSuccessMsg('Connection accepted successfully!');
        setConnections((prev) =>
          prev.map((c) => (c._id === connectionId ? { ...c, status: 'accepted' } : c))
        );
        setTimeout(() => setSuccessMsg(null), 3000);
      }
    } catch (err: any) {
      console.error('Accept connection error:', err);
      setError(err.response?.data?.message || 'Failed to accept connection request.');
    } finally {
      setActioningId(null);
      setActionType(null);
    }
  };

  // Reject Connection request
  const handleRejectConnection = async (connectionId: string) => {
    setActioningId(connectionId);
    setActionType('reject');
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await api.put(`/connections/${connectionId}/reject`);
      if (res.data?.success) {
        setSuccessMsg('Connection request rejected.');
        // Filter out the rejected request from the UI
        setConnections((prev) => prev.filter((c) => c._id !== connectionId));
        setTimeout(() => setSuccessMsg(null), 3000);
      }
    } catch (err: any) {
      console.error('Reject connection error:', err);
      setError(err.response?.data?.message || 'Failed to reject connection request.');
    } finally {
      setActioningId(null);
      setActionType(null);
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase().slice(0, 2);
  };

  // Group connections
  const acceptedConnections = connections.filter((c) => c.status === 'accepted');
  const pendingConnections = connections.filter((c) => c.status === 'pending');

  const showAccepted = activeTab === 'all' || activeTab === 'accepted';
  const showPending = activeTab === 'all' || activeTab === 'pending';

  const totalFilteredCount =
    (activeTab === 'all' ? connections.length : 0) +
    (activeTab === 'accepted' ? acceptedConnections.length : 0) +
    (activeTab === 'pending' ? pendingConnections.length : 0);

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
        .pulse-glow-orange { animation: pulse-glow 12s ease-in-out infinite; }
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

      {/* Background Ambient Glows (Accentuated in Spice Orange #E0653A) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full blur-[130px] bg-[#E0653A]/15 pulse-glow-orange transition-all duration-1000" />
        <div className="absolute top-1/2 right-0 w-[500px] h-[500px] rounded-full blur-[150px] bg-[#F2B340]/10 pulse-glow-orange transition-all duration-1000" />
      </div>

      {/* Floating Parallax Spices */}
      <div
        style={{
          transform: `translate3d(${mousePos.x * 0.8}px, ${mousePos.y * 0.8}px, 0)`,
          transition: 'transform 0.15s ease-out',
        }}
        className="absolute top-[15%] left-[8%] floating-leaf opacity-[0.85] pointer-events-none z-10 hidden md:block"
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
        className="absolute bottom-[20%] right-[6%] floating-anise opacity-75 pointer-events-none z-10 hidden md:block"
      >
        <svg width="60" height="60" viewBox="0 0 24 24" fill="none">
          <path d="M12 2L14 9H10L12 2Z" fill="#8C5B3E" />
          <path d="M12 22L10 15H14L12 22Z" fill="#8C5B3E" />
          <path d="M2 12L9 10V14L2 12Z" fill="#8C5B3E" />
          <path d="M22 12L15 14V10L22 12Z" fill="#8C5B3E" />
          <path d="M5 5L10 10L9 11L4 6L5 5Z" fill="#A46E4D" />
          <path d="M19 19L14 14L15 13L20 18L19 19Z" fill="#A46E4D" />
          <path d="M5 19L10 14L9 13L4 18L5 19Z" fill="#A46E4D" />
          <path d="M19 5L14 10L15 11L20 6L19 5Z" fill="#A46E4D" />
          <circle cx="12" cy="12" r="3" fill="#D2996A" />
        </svg>
      </div>

      <div
        style={{
          transform: `translate3d(${mousePos.x * 0.9}px, ${mousePos.y * -0.4}px, 0)`,
          transition: 'transform 0.15s ease-out',
        }}
        className="absolute top-[35%] right-[10%] floating-cardamom opacity-80 pointer-events-none z-10 hidden md:block"
      >
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
          <path
            d="M12 2C7 5 5 11 7 16C9 21 15 22 17 17C19 12 17 5 12 2Z"
            fill="#758F69"
          />
          <path
            d="M12 2C10 6 10 12 12 22"
            stroke="#52664A"
            strokeWidth="0.8"
            strokeDasharray="1 1"
          />
          <path d="M7 16C9 14 13 14 17 17" stroke="#52664A" strokeWidth="0.5" />
          <path
            d="M8 11C10 10 13 11 15 13"
            stroke="#52664A"
            strokeWidth="0.5"
          />
        </svg>
      </div>

      <div className="max-w-6xl mx-auto px-4 pt-6 md:pt-10 relative z-10">
        {/* ==========================================
            1. TOP HEADER BAR
           ========================================== */}
        <DashboardHeader role="vendor" subpageTitle="Connections" />

        {/* Mobile Sub-Navbar */}
        <MobileNavbar role="vendor" activeTab="connections" />

        {/* Notifications & Error alerts */}
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

        {/* ==========================================
            2. TABS & FILTER BAR
           ========================================== */}
        <div className="flex flex-wrap justify-between items-center gap-4 mb-8 select-none">
          <div className="flex gap-2 overflow-x-auto no-scrollbar max-w-full bg-white/40 border border-white/20 p-1.5 rounded-[20px] backdrop-blur-md scroll-smooth whitespace-nowrap">
            {[
              { id: 'all', label: 'All', count: connections.length },
              { id: 'accepted', label: 'Connected', count: acceptedConnections.length },
              { id: 'pending', label: 'Pending Requests', count: pendingConnections.length },
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 flex items-center gap-1.5 shrink-0 whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-spice text-white shadow-sm scale-105'
                      : 'text-[#2B2118]/60 hover:text-charcoal hover:bg-white/40'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`text-[10px] font-extrabold ml-1 ${
                      isActive ? 'text-white' : 'text-spice'
                    }`}
                  >
                    ({tab.count})
                  </span>
                </button>
              );
            })}
          </div>

          <div className="text-xs text-[#2B2118]/60 font-semibold font-body">
            Showing <span className="font-extrabold text-spice">{totalFilteredCount}</span>{' '}
            {totalFilteredCount === 1 ? 'connection' : 'connections'}
          </div>
        </div>

        {/* ==========================================
            3. CONNECTIONS GRID & SECTIONS
           ========================================== */}
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
              Loading Customer Connections...
            </p>
          </div>
        ) : connections.length === 0 ? (
          /* Global Empty State */
          <div className="bg-white/30 backdrop-blur-md border border-[#2B2118]/10 border-dashed rounded-[32px] p-12 text-center flex flex-col items-center justify-center min-h-[300px] shadow-sm max-w-lg mx-auto animate-scale-up">
            <div className="w-20 h-20 mb-5 text-spice/40 stroke-current">
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
              No customer connections found
            </h3>
            <p className="text-xs text-[#2B2118]/50 max-w-xs leading-relaxed font-body">
              Customer connection requests will appear here once they request a link to book tiffins with you.
            </p>
          </div>
        ) : (
          <div className="space-y-12 animate-fade-in-up">
            {/* Accepted Section */}
            {showAccepted && (
              <div className="space-y-4">
                <div className="px-1 flex items-center justify-between border-b border-[#2B2118]/5 pb-2">
                  <h2 className="font-display text-xl font-bold text-[#2B2118] flex items-center gap-2">
                    <span>Connected Customers</span>
                    <span className="text-xs font-bold font-body text-emerald-800 select-none">
                      ({acceptedConnections.length} Active)
                    </span>
                  </h2>
                </div>

                {acceptedConnections.length === 0 ? (
                  <div className="p-6 bg-white/20 border border-[#2B2118]/5 rounded-[24px] text-center text-xs text-[#2B2118]/45 font-medium py-10">
                    No active customer connections.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {acceptedConnections.map((c) => {
                      const userDetails = c.customerId?.userId || {};
                      const fullName = `${userDetails.firstName || 'Customer'} ${userDetails.lastName || ''}`;
                      return (
                        <div
                          key={c._id}
                          className="bg-white/40 border border-white/30 backdrop-blur-xl rounded-[32px] p-6 shadow-[0_24px_70px_-15px_rgba(43,33,24,0.12)] hover:shadow-[0_28px_80px_-15px_rgba(43,33,24,0.16)] hover:border-spice/30 hover:bg-white/60 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between h-full group"
                        >
                          <div className="space-y-4">
                            <div className="flex justify-between items-start gap-4">
                              <div className="flex items-center space-x-3">
                                <h3 className="font-display font-extrabold text-base text-[#2B2118] leading-tight group-hover:text-spice transition-colors">
                                  {fullName}
                                </h3>
                              </div>
                              <StatusBadge status="accepted" />
                            </div>

                            <div className="h-px bg-[#2B2118]/5 w-full" />

                            <div className="space-y-2 text-xs font-body text-[#2B2118]/70">
                              <p className="flex items-center gap-2">
                                <svg className="w-3.5 h-3.5 text-charcoal/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                </svg>
                                {userDetails.phone || 'No phone'}
                              </p>
                              <p className="flex items-center gap-2">
                                <svg className="w-3.5 h-3.5 text-charcoal/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                                {userDetails.email || 'No email'}
                              </p>
                              {userDetails.age && (
                                <p className="flex items-center gap-2">
                                  <span className="font-semibold text-charcoal/40 text-[10px] uppercase">Age:</span>
                                  {userDetails.age} years old
                                </p>
                              )}
                            </div>

                            <div className="h-px bg-[#2B2118]/5 w-full" />

                            <div className="flex justify-between items-center pt-1">
                              <div>
                                <p className="text-[10px] text-[#2B2118]/50 uppercase tracking-wider font-extrabold font-body">
                                  Customer Balance Due
                                </p>
                                <p className="text-xl font-display font-extrabold text-[#2B2118] mt-0.5">
                                  ₹{c.pendingDue.toFixed(2)}
                                </p>
                              </div>
                              {c.pendingDue > 0 && (
                                <span className="text-amber-700 text-[10px] font-bold tracking-wider uppercase select-none">
                                  Pending Payment
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Pending Requests Section */}
            {showPending && (
              <div className="space-y-4">
                <div className="px-1 flex items-center justify-between border-b border-[#2B2118]/5 pb-2">
                  <h2 className="font-display text-xl font-bold text-[#2B2118] flex items-center gap-2">
                    <span>Pending Requests</span>
                    <span className="text-xs font-bold font-body text-amber-800 select-none">
                      ({pendingConnections.length} Pending)
                    </span>
                  </h2>
                </div>

                {pendingConnections.length === 0 ? (
                  <div className="p-6 bg-white/20 border border-[#2B2118]/5 rounded-[24px] text-center text-xs text-[#2B2118]/45 font-medium py-10">
                    No pending customer requests.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {pendingConnections.map((c) => {
                      const userDetails = c.customerId?.userId || {};
                      const fullName = `${userDetails.firstName || 'Customer'} ${userDetails.lastName || ''}`;
                      const isActioning = actioningId === c._id;
                      return (
                        <div
                          key={c._id}
                          className="bg-white/40 border border-white/30 backdrop-blur-xl rounded-[32px] p-6 shadow-[0_24px_70px_-15px_rgba(43,33,24,0.12)] hover:shadow-[0_28px_80px_-15px_rgba(43,33,24,0.16)] hover:border-turmeric/30 hover:bg-white/60 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between h-full group"
                        >
                          <div className="space-y-4">
                            <div className="flex justify-between items-start gap-4">
                              <div className="flex items-center space-x-3">
                                <h3 className="font-display font-extrabold text-base text-[#2B2118] leading-tight group-hover:text-turmeric transition-colors">
                                  {fullName}
                                </h3>
                              </div>
                              <StatusBadge status="pending" />
                            </div>

                            <div className="h-px bg-[#2B2118]/5 w-full" />

                            <div className="space-y-2 text-xs font-body text-[#2B2118]/70">
                              <p className="flex items-center gap-2">
                                <svg className="w-3.5 h-3.5 text-charcoal/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                </svg>
                                {userDetails.phone || 'No phone'}
                              </p>
                              <p className="flex items-center gap-2">
                                <svg className="w-3.5 h-3.5 text-charcoal/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                                {userDetails.email || 'No email'}
                              </p>
                            </div>
                          </div>

                          <div className="mt-6 flex items-center gap-3">
                            <button
                              onClick={() => handleRejectConnection(c._id)}
                              disabled={isActioning}
                              className="flex-1 py-3 px-4 rounded-2xl border border-rose-200 hover:border-rose-300 text-rose-600 bg-white hover:bg-rose-50 font-display font-bold text-xs uppercase tracking-wider transition-all duration-300 cursor-pointer disabled:opacity-50 disabled:cursor-wait active:scale-95"
                            >
                              {isActioning && actionType === 'reject' ? 'Rejecting...' : 'Reject'}
                            </button>
                            <button
                              onClick={() => handleAcceptConnection(c._id)}
                              disabled={isActioning}
                              className="flex-1 py-3 px-4 rounded-2xl border border-spice bg-spice text-white hover:bg-spice/90 hover:border-spice/90 font-display font-bold text-xs uppercase tracking-wider transition-all duration-300 shadow-[0_4px_12px_rgba(224,101,58,0.2)] hover:shadow-[0_6px_20px_rgba(224,101,58,0.3)] active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-wait"
                            >
                              {isActioning && actionType === 'accept' ? 'Accepting...' : 'Accept'}
                            </button>
                          </div>
                        </div>
                      );
                    })}
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

export default VendorConnections;
