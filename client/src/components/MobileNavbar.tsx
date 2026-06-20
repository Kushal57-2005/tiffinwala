import React from 'react';
import { useNavigate } from 'react-router-dom';

interface MobileNavbarProps {
  role: 'customer' | 'vendor';
  activeTab: 'home' | 'subscriptions' | 'connections' | 'ratings' | 'none';
}

export const MobileNavbar: React.FC<MobileNavbarProps> = ({
  role,
  activeTab,
}) => {
  const navigate = useNavigate();
  const isCustomer = role === 'customer';

  // Theme styling based on role
  const activeBg = isCustomer ? 'bg-[#5C7A52] text-white shadow-[0_4px_12px_rgba(92,122,82,0.18)]' : 'bg-[#E0653A] text-white shadow-[0_4px_12px_rgba(224,101,58,0.18)]';
  const hoverBg = isCustomer ? 'hover:bg-[#5C7A52]/10 hover:text-[#5C7A52]' : 'hover:bg-[#E0653A]/10 hover:text-[#E0653A]';
  const homePath = isCustomer ? '/customer/home' : '/vendor/home';
  const subPath = isCustomer ? '/customer/subscriptions' : '/vendor/subscriptions';
  const connPath = isCustomer ? '/customer/connections' : '/vendor/connections';
  const ratingsPath = '/vendor/ratings';

  return (
    <div className="flex md:hidden items-center justify-center gap-4 py-2 mb-6">
      {/* Home Button */}
      <button
        onClick={() => navigate(homePath)}
        className={`w-12 h-12 rounded-2xl border border-charcoal/10 flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 shadow-sm cursor-pointer ${
          activeTab === 'home' ? activeBg : 'bg-white/70 text-charcoal/80 ' + hoverBg
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
          activeTab === 'subscriptions' ? activeBg : 'bg-white/70 text-charcoal/80 ' + hoverBg
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
          activeTab === 'connections' ? activeBg : 'bg-white/70 text-charcoal/80 ' + hoverBg
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
            activeTab === 'ratings' ? activeBg : 'bg-white/70 text-charcoal/80 ' + hoverBg
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
  );
};
