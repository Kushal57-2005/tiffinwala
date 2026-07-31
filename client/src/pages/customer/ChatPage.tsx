import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { api } from '../../utils/api';
import { DashboardHeader } from '../../components/DashboardHeader';
import { MobileNavbar } from '../../components/MobileNavbar';
import tiffinBg from '../../assets/slate_spices_bg.png';
import { socket } from '../../utils/socket';

export interface IConversation {
  vendorId?: string;       // present when fetched as customer
  customerId?: string;     // present when fetched as vendor
  businessName?: string;   // present for customer's conversation list
  customerName?: string;   // present for vendor's conversation list
  latestMessage: string;
  latestMessageTime: string;
  latestSender: string;
  unreadCount: number;
}

export const formatTime = (timeStr: string) => {
  if (!timeStr) return '';
  const date = new Date(timeStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);

  if (diffSecs < 60) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24 && date.getDate() === now.getDate()) {
    return `${diffHours}h ago`;
  }
  if (diffHours < 48 && new Date(now.getTime() - 86400000).getDate() === date.getDate()) {
    return 'Yesterday';
  }
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const getInitials = (name: string) => {
  if (!name) return '?';
  return name
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

export const ChatPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isVendor = user?.role === 'vendor';

  const [conversations, setConversations] = useState<IConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Colors based on role
  const accentColor = isVendor ? '#E0653A' : '#5C7A52';
  const accentBgClass = isVendor ? 'bg-[#E0653A]' : 'bg-[#5C7A52]';
  const accentHoverBgClass = isVendor ? 'hover:bg-[#E0653A]/60' : 'hover:bg-[#5C7A52]/60';
  const textAccentClass = isVendor ? 'text-[#E0653A]' : 'text-[#5C7A52]';
  const borderAccentClass = isVendor ? 'border-[#E0653A]/20' : 'border-[#5C7A52]/20';
  const lightBgClass = isVendor ? 'bg-[#E0653A]/10' : 'bg-[#5C7A52]/10';

  const fetchConversations = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const endpoint = isVendor ? '/chat/conversations/vendor' : '/chat/conversations';
      const res = await api.get(endpoint);
      if (res.data?.success && Array.isArray(res.data?.data)) {
        setConversations(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching conversations:', err);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [isVendor]);

  useEffect(() => {
    fetchConversations(false);
  }, [fetchConversations]);

  useEffect(() => {
    const handleConversationUpdate = () => {
      fetchConversations(true);
    };

    socket.on('conversationUpdate', handleConversationUpdate);
    return () => {
      socket.off('conversationUpdate', handleConversationUpdate);
    };
  }, [fetchConversations]);

  const filteredConversations = conversations.filter((convo) => {
    const name = isVendor ? convo.customerName : convo.businessName;
    return name?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleCardClick = (convo: IConversation) => {
    if (isVendor) {
      navigate(`/vendor/chat/${convo.customerId}`, {
        state: { partnerName: convo.customerName },
      });
    } else {
      navigate(`/customer/chat/${convo.vendorId}`, {
        state: { partnerName: convo.businessName },
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#FBF4EC] font-body text-[#2B2118] pb-24 relative overflow-hidden select-text transition-all duration-300">
      {/* Background Texture Overlay */}
      <img
        src={tiffinBg}
        alt=""
        className="absolute inset-0 w-full h-full object-cover opacity-[0.025] mix-blend-multiply pointer-events-none select-none z-0"
      />

      {/* Floating Decorations */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className={`absolute -top-40 -left-40 w-96 h-96 rounded-full blur-[130px] opacity-10 ${accentBgClass}`} />
        <div className={`absolute top-1/2 right-0 w-[500px] h-[500px] rounded-full blur-[150px] opacity-5 ${accentBgClass}`} />

        {isVendor ? (
          <div className="absolute bottom-[25%] left-[6%] opacity-30 animate-pulse">
            <svg width="60" height="60" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L14 9H10L12 2Z" fill={accentColor} />
              <path d="M12 22L10 15H14L12 22Z" fill={accentColor} />
              <path d="M2 12L9 10V14L2 12Z" fill={accentColor} />
              <path d="M22 12L15 14V10L22 12Z" fill={accentColor} />
            </svg>
          </div>
        ) : (
          <div className="absolute top-[12%] left-[6%] opacity-40">
            <svg width="45" height="45" viewBox="0 0 24 24" fill="none">
              <path
                d="M2 22C2 22 7 21 12 16C17 11 20 6 22 2C22 2 17 2 12 6C7 10 3 15 2 22Z"
                fill={accentColor}
              />
            </svg>
          </div>
        )}
      </div>

      <div className="max-w-6xl mx-auto px-4 pt-6 md:pt-10 relative z-10">
        {/* Header Dashboard integration */}
        <DashboardHeader role={isVendor ? 'vendor' : 'customer'} subpageTitle="Messages" />
        <MobileNavbar role={isVendor ? 'vendor' : 'customer'} activeTab="chat" />

        {/* Custom Header Title area */}
        <div className="bg-white/40 border border-white/20 backdrop-blur-xl rounded-[32px] p-6 md:p-8 shadow-sm mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] text-[#2B2118]/50 font-bold uppercase tracking-widest font-body block mb-1">
              MESSAGES
            </span>
            <h2 className="font-display text-3xl font-extrabold text-[#2B2118]">
              Your Conversations
            </h2>
          </div>
          <div className={`w-12 h-12 rounded-2xl ${lightBgClass} border ${borderAccentClass} flex items-center justify-center`}>
            <span className={`text-lg font-display font-extrabold ${textAccentClass}`}>
              {user ? getInitials(`${user.firstName} ${user.lastName}`) : '?'}
            </span>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative flex-1 group">
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/50 border border-charcoal/10 rounded-[20px] py-4 pl-12 pr-4 text-sm font-medium placeholder-charcoal/40 text-charcoal focus:outline-none focus:bg-white focus:border-charcoal/20 transition-all duration-300 shadow-sm"
            />
            <svg
              className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-charcoal/30 group-focus-within:text-charcoal/60 transition-colors"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Conversation List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="bg-white/40 border border-white/20 backdrop-blur-md rounded-2xl p-4 animate-pulse flex items-center justify-between"
              >
                <div className="flex items-center gap-4 w-2/3">
                  <div className="w-12 h-12 rounded-full bg-charcoal/10 shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-charcoal/10 rounded w-1/2" />
                    <div className="h-3 bg-charcoal/5 rounded w-3/4" />
                  </div>
                </div>
                <div className="w-16 h-3 bg-charcoal/10 rounded" />
              </div>
            ))}
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="bg-white/40 border border-white/20 backdrop-blur-xl rounded-[32px] p-12 text-center flex flex-col items-center justify-center shadow-sm">
            <svg
              className={`w-20 h-20 mb-5 stroke-current opacity-40 ${textAccentClass}`}
              viewBox="0 0 24 24"
              fill="none"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="5" y="8" width="14" height="6" rx="2" />
              <rect x="5" y="14" width="14" height="6" rx="2" />
              <path d="M12 2v6" />
              <path d="M9 2h6" />
              <path d="M5 8h14v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V8z" opacity="0.2" />
            </svg>
            <h3 className="font-display text-xl font-bold text-[#2B2118] mb-2">
              No conversations yet
            </h3>
            <p className="text-xs text-[#2B2118]/50 max-w-sm leading-relaxed font-body">
              {isVendor
                ? 'Customers will appear here once they chat with you.'
                : 'Place an order to start chatting with vendors!'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredConversations.map((convo) => {
              const name = isVendor ? convo.customerName : convo.businessName;
              const hasUnread = convo.unreadCount > 0;
              const isMeSender = convo.latestSender === (isVendor ? 'vendor' : 'customer');

              return (
                <div
                  key={isVendor ? convo.customerId : convo.vendorId}
                  onClick={() => handleCardClick(convo)}
                  className="bg-white/40 backdrop-blur border border-white/20 rounded-2xl p-4 hover:bg-white/60 hover:-translate-y-0.5 transition-all duration-300 cursor-pointer flex items-center justify-between shadow-sm group"
                >
                  <div className="flex items-center gap-4 min-w-0 flex-1 mr-3">
                    {/* Left initials badge */}
                    <div className={`w-12 h-12 rounded-full ${lightBgClass} border ${borderAccentClass} flex items-center justify-center shrink-0`}>
                      <span className={`text-sm font-display font-extrabold ${textAccentClass}`}>
                        {name ? getInitials(name) : '?'}
                      </span>
                    </div>

                    {/* Center Details */}
                    <div className="min-w-0 flex-1">
                      <h4 className="font-display font-bold text-[#2B2118] text-base group-hover:text-charcoal transition-colors truncate">
                        {name || 'Unknown User'}
                      </h4>
                      <p className={`text-xs truncate ${hasUnread ? 'text-[#2B2118] font-bold' : 'text-charcoal/60'} mt-0.5`}>
                        {isMeSender ? <span className="opacity-60">You: </span> : null}
                        {convo.latestMessage}
                      </p>
                    </div>
                  </div>

                  {/* Right time & badges */}
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <span className="text-[10px] text-[#2B2118]/40 font-semibold font-body">
                      {formatTime(convo.latestMessageTime)}
                    </span>
                    <div className="flex items-center gap-2">
                      {hasUnread && (
                        <span className={`w-5 h-5 rounded-full ${accentBgClass} text-white text-[10px] font-bold flex items-center justify-center shadow-sm`}>
                          {convo.unreadCount}
                        </span>
                      )}
                      <svg
                        className="w-4 h-4 text-charcoal/30 group-hover:text-charcoal/60 group-hover:translate-x-0.5 transition-all"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2.5}
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatPage;
