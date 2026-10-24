import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Flag, Eye, CheckCircle2 } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { api } from '../../utils/api';
import { socket, connectSocket } from '../../utils/socket';
import tiffinBg from '../../assets/slate_spices_bg.png';

interface IMessage {
  _id: string;
  customerId: string;
  vendorId: string;
  senderId: string;
  senderRole: 'customer' | 'vendor';
  text: string;
  isRead: boolean;
  isComplaint: boolean;
  complaintStatus: 'none' | 'raised' | 'acknowledged' | 'resolved';
  createdAt: string;
}

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

const formatMessageTime = (timeStr: string) => {
  try {
    const date = new Date(timeStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
};

const groupMessagesByDate = (msgs: IMessage[]) => {
  const groups: { [key: string]: IMessage[] } = {};
  msgs.forEach((msg) => {
    try {
      const date = new Date(msg.createdAt);
      const dateString = date.toDateString();
      if (!groups[dateString]) {
        groups[dateString] = [];
      }
      groups[dateString].push(msg);
    } catch (e) {
      console.error(e);
    }
  });
  return groups;
};

const formatDateSeparator = (dateStr: string) => {
  const date = new Date(dateStr);
  const now = new Date();
  const yesterday = new Date(now.getTime() - 86400000);

  if (date.toDateString() === now.toDateString()) {
    return 'Today';
  }
  if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  }
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
};

export const ChatWindow: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();
  const isVendor = user?.role === 'vendor';

  const { vendorId: routeVendorId, customerId: routeCustomerId } = useParams<{
    vendorId?: string;
    customerId?: string;
  }>();

  // State
  const [profileId, setProfileId] = useState<string | null>(null);
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [isPartnerTyping, setIsPartnerTyping] = useState(false);
  const [roomError, setRoomError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [partnerName, setPartnerName] = useState<string>(
    location.state?.partnerName || '',
  );
  const [activeComplaintMenuId, setActiveComplaintMenuId] = useState<
    string | null
  >(null);

  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const handleMouseMove = (e: React.MouseEvent) => {
    const { clientX, clientY } = e;
    const x = (clientX - window.innerWidth / 2) / 45;
    const y = (clientY - window.innerHeight / 2) / 45;
    setMousePos({ x, y });
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimerRef = useRef<any>(null);

  // Active theme properties
  const accentColor = isVendor ? '#E0653A' : '#5C7A52';
  const accentBgClass = isVendor ? 'bg-[#E0653A]' : 'bg-[#5C7A52]';
  const textAccentClass = isVendor ? 'text-[#E0653A]' : 'text-[#5C7A52]';
  const borderAccentClass = isVendor
    ? 'border-[#E0653A]/20'
    : 'border-[#5C7A52]/20';
  const lightBgClass = isVendor ? 'bg-[#E0653A]/10' : 'bg-[#5C7A52]/10';

  // 1. Fetch current user profile to obtain profileId document reference
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const endpoint = isVendor ? '/vendor/profile' : '/customer/profile';
        const res = await api.get(endpoint);
        if (res.data?.success && res.data?.data?._id) {
          setProfileId(res.data.data._id);
        }
      } catch (err) {
        console.error('Failed to fetch profile details:', err);
      }
    };
    fetchProfile();
  }, [isVendor]);

  // Derive final client and vendor profile IDs
  const activeCustomerId = isVendor ? routeCustomerId : profileId;
  const activeVendorId = isVendor ? profileId : routeVendorId;

  // 2. Manage Socket connection status state
  useEffect(() => {
    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    setIsConnected(socket.connected);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
    };
  }, []);

  // 3. Resolve Partner Name dynamically
  useEffect(() => {
    if (partnerName || !activeCustomerId || !activeVendorId) return;

    const fetchPartnerName = async () => {
      try {
        if (isVendor) {
          // Check vendor conversations
          const convoRes = await api.get('/chat/conversations/vendor');
          if (convoRes.data?.success && Array.isArray(convoRes.data?.data)) {
            const convo = convoRes.data.data.find(
              (c: any) => c.customerId === activeCustomerId,
            );
            if (convo?.customerName) {
              setPartnerName(convo.customerName);
              return;
            }
          }
          // Fallback: search vendor connection list
          const connRes = await api.get('/connections/vendor');
          if (connRes.data?.success && Array.isArray(connRes.data?.data)) {
            const conn = connRes.data.data.find(
              (c: any) => c.customerId?._id === activeCustomerId,
            );
            const userDetails = conn?.customerId?.userId;
            if (userDetails) {
              setPartnerName(
                `${userDetails.firstName} ${userDetails.lastName}`,
              );
              return;
            }
          }
        } else {
          // Check vendor details
          const res = await api.get(`/customer/vendors/${activeVendorId}`);
          if (res.data?.success && res.data?.data?.businessName) {
            setPartnerName(res.data.data.businessName);
            return;
          }
          // Fallback: search conversations list
          const convoRes = await api.get('/chat/conversations');
          if (convoRes.data?.success && Array.isArray(convoRes.data?.data)) {
            const convo = convoRes.data.data.find(
              (c: any) => c.vendorId === activeVendorId,
            );
            if (convo?.businessName) {
              setPartnerName(convo.businessName);
              return;
            }
          }
        }
      } catch (err) {
        console.error('Failed to resolve partner name:', err);
      }
    };

    fetchPartnerName();
  }, [activeCustomerId, activeVendorId, partnerName, isVendor]);

  // 4. Setup Chat Socket listeners, Join Room & Fetch message history
  useEffect(() => {
    if (!activeCustomerId || !activeVendorId) return;

    connectSocket();

    // Fetch messages history
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const endpoint = isVendor
          ? `/chat/customer/${activeCustomerId}`
          : `/chat/vendor/${activeVendorId}`;
        const res = await api.get(endpoint);
        if (res.data?.success && Array.isArray(res.data?.data)) {
          setMessages(res.data.data);
          // Wait briefly for render and scroll
          setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
          }, 100);
        }
      } catch (err) {
        console.error('Failed to load chat history:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();

    // Join room
    socket.emit('joinRoom', {
      customerId: activeCustomerId,
      vendorId: activeVendorId,
    });

    // Listeners
    const handleReceiveMessage = (message: IMessage) => {
      setMessages((prev) => {
        if (prev.some((m) => m._id === message._id)) return prev;
        return [...prev, message];
      });

      // Mark message as read if received from partner
      const currentUserRole = isVendor ? 'vendor' : 'customer';
      if (message.senderRole !== currentUserRole) {
        api
          .put(`/chat/message/${message._id}/read`)
          .catch((err) => console.error(err));
      }

      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 50);
    };

    const handlePartnerTyping = () => setIsPartnerTyping(true);
    const handlePartnerStoppedTyping = () => setIsPartnerTyping(false);
    const handleRoomError = (err: { message: string }) =>
      setRoomError(err.message);
    const handleMessageError = (err: { message: string }) =>
      console.error('Message socket error:', err);

    socket.on('receiveMessage', handleReceiveMessage);
    socket.on('partnerTyping', handlePartnerTyping);
    socket.on('partnerStoppedTyping', handlePartnerStoppedTyping);
    socket.on('roomError', handleRoomError);
    socket.on('messageError', handleMessageError);

    return () => {
      socket.off('receiveMessage', handleReceiveMessage);
      socket.off('partnerTyping', handlePartnerTyping);
      socket.off('partnerStoppedTyping', handlePartnerStoppedTyping);
      socket.off('roomError', handleRoomError);
      socket.off('messageError', handleMessageError);
      socket.emit('stopTyping', {
        customerId: activeCustomerId,
        vendorId: activeVendorId,
      });
    };
  }, [activeCustomerId, activeVendorId, isVendor]);

  // Typing debounce detection
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);

    if (!activeCustomerId || !activeVendorId || !user) return;

    socket.emit('typing', {
      customerId: activeCustomerId,
      vendorId: activeVendorId,
      senderRole: user.role,
    });

    if (typingTimerRef.current) {
      clearTimeout(typingTimerRef.current);
    }

    typingTimerRef.current = setTimeout(() => {
      socket.emit('stopTyping', {
        customerId: activeCustomerId,
        vendorId: activeVendorId,
      });
    }, 1500);
  };

  // Send Message
  const handleSendMessage = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (
      !inputText.trim() ||
      isSending ||
      !activeCustomerId ||
      !activeVendorId ||
      !user
    )
      return;

    setIsSending(true);

    socket.emit('sendMessage', {
      customerId: activeCustomerId,
      vendorId: activeVendorId,
      senderId: user._id,
      senderRole: user.role,
      text: inputText.trim(),
    });

    setInputText('');
    setIsSending(false);

    if (typingTimerRef.current) {
      clearTimeout(typingTimerRef.current);
      socket.emit('stopTyping', {
        customerId: activeCustomerId,
        vendorId: activeVendorId,
      });
    }
  };

  // Customer: Raise Complaint
  const handleRaiseComplaint = async (messageId: string) => {
    try {
      const res = await api.put(`/chat/message/${messageId}/complaint`);
      if (res.data?.success) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg._id === messageId
              ? { ...msg, isComplaint: true, complaintStatus: 'raised' }
              : msg,
          ),
        );
      }
    } catch (err) {
      console.error('Failed to raise complaint:', err);
    }
  };

  // Vendor: Update Complaint Status
  const handleUpdateComplaintStatus = async (
    messageId: string,
    status: 'acknowledged' | 'resolved',
  ) => {
    try {
      const res = await api.put(`/chat/complaint/${messageId}/status`, {
        status,
      });
      if (res.data?.success) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg._id === messageId ? { ...msg, complaintStatus: status } : msg,
          ),
        );
        setActiveComplaintMenuId(null);
      }
    } catch (err) {
      console.error('Failed to update complaint status:', err);
    }
  };

  // Render Date Groups and bubbles
  const messageGroups = groupMessagesByDate(messages);

  if (roomError) {
    return (
      <div className="min-h-screen bg-[#FBF4EC] flex items-center justify-center p-6 relative select-none">
        <img
          src={tiffinBg}
          alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-[0.025] mix-blend-multiply pointer-events-none z-0"
        />
        <div className="bg-white/40 backdrop-blur border border-white/20 rounded-[32px] p-8 max-w-sm mx-auto text-center shadow-lg relative z-10">
          <svg className="w-12 h-12 text-charcoal/30 mx-auto mb-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <h3 className="font-display text-xl font-bold text-charcoal mb-3">
            Chat Unavailable
          </h3>
          <p className="text-sm text-charcoal/60 mb-6 font-body leading-relaxed">
            {roomError}
          </p>
          <button
            onClick={() => navigate(-1)}
            className="w-full border border-charcoal/20 rounded-2xl px-6 py-3 text-sm font-bold hover:bg-charcoal/5 transition cursor-pointer"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      onMouseMove={handleMouseMove}
      className="h-screen h-[100dvh] bg-[#FBF4EC] flex flex-col relative select-text transition-all duration-300 overflow-hidden font-body"
    >
      <style>{`
        @keyframes typingBounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-6px); opacity: 1; }
        }
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.08; transform: scale(1); }
          50% { opacity: 0.18; transform: scale(1.15); }
        }
        .typing-dot {
          animation: typingBounce 1.4s infinite ease-in-out;
        }
        .pulse-glow-green { animation: pulse-glow 12s ease-in-out infinite; }
        .pulse-glow-orange { animation: pulse-glow 12s ease-in-out infinite; }
        .floating-leaf { animation: float-slow 7s ease-in-out infinite; }
        .floating-anise { animation: float-medium 9s ease-in-out infinite; }
        @keyframes float-slow {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-15px) rotate(5deg); }
        }
        @keyframes float-medium {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-22px) rotate(-8deg); }
        }
      `}</style>

      {/* Background Texture Overlay */}
      <img
        src={tiffinBg}
        alt=""
        className="absolute inset-0 w-full h-full object-cover opacity-[0.025] mix-blend-multiply pointer-events-none select-none z-0"
      />

      {/* Background Ambient Glows */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className={`absolute -top-40 -left-40 w-96 h-96 rounded-full blur-[130px] transition-all duration-1000 ${isVendor ? 'bg-[#E0653A]/5 pulse-glow-orange' : 'bg-[#5C7A52]/10 pulse-glow-green'}`} />
        <div className={`absolute top-1/2 right-0 w-[500px] h-[500px] rounded-full blur-[150px] transition-all duration-1000 ${isVendor ? 'bg-[#E0653A]/5 pulse-glow-orange' : 'bg-[#5C7A52]/10 pulse-glow-green'}`} />
      </div>

      {/* Floating Parallax Spices & Leaf Accents */}
      <div
        style={{
          transform: `translate3d(${mousePos.x * 0.8}px, ${mousePos.y * 0.8}px, 0)`,
          transition: 'transform 0.15s ease-out',
        }}
        className="absolute top-[12%] left-[6%] floating-leaf opacity-[0.85] pointer-events-none z-0 hidden md:block"
      >
        <svg width="45" height="45" viewBox="0 0 24 24" fill="none">
          <path
            d="M2 22C2 22 7 21 12 16C17 11 20 6 22 2C22 2 17 2 12 6C7 10 3 15 2 22Z"
            fill={isVendor ? "#E0653A" : "#5C7A52"}
            opacity={isVendor ? 0.25 : 0.9}
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
        className="absolute bottom-[25%] right-[6%] floating-anise opacity-70 pointer-events-none z-0 hidden md:block"
      >
        <svg width="60" height="60" viewBox="0 0 24 24" fill="none">
          <path d="M12 2L14 9H10L12 2Z" fill="#8C5B3E" />
          <path d="M12 22L10 15H14L12 22Z" fill="#8C5B3E" />
          <path d="M2 12L9 10V14L2 12Z" fill="#8C5B3E" />
          <path d="M22 12L15 14V10L22 12Z" fill="#8C5B3E" />
          <circle cx="12" cy="12" r="3" fill={isVendor ? "#E0653A" : "#7E9C73"} />
        </svg>
      </div>

      {/* TOP HEADER */}
      <div className="px-4 pt-4 md:pt-6 relative z-30 select-none shrink-0">
        <header className="bg-white/40 backdrop-blur-xl border border-white/30 rounded-[32px] shadow-[0_24px_70px_-15px_rgba(43,33,24,0.12)] p-4 md:p-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            {/* Back button */}
            <button
              onClick={() => navigate(-1)}
              className="w-10 h-10 rounded-2xl bg-white/70 border border-charcoal/10 flex items-center justify-center hover:scale-105 transition-all cursor-pointer active:scale-95 shrink-0"
              title="Go Back"
            >
              <svg
                className="w-5 h-5 text-charcoal/80"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.5}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>

            {/* Initials avatar of partner */}
            <div
              className={`w-10 h-10 rounded-2xl ${isVendor ? 'bg-[#5C7A52]' : 'bg-[#E0653A]'} text-white flex items-center justify-center shrink-0 shadow-sm`}
            >
              <span className="text-sm font-display font-extrabold select-none">
                {partnerName ? getInitials(partnerName) : '?'}
              </span>
            </div>

            {/* Name & Online Status */}
            <div className="min-w-0">
              <h3 className="font-display font-bold text-sm md:text-base text-[#2B2118] leading-tight truncate">
                {partnerName || 'Chat'}
              </h3>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span
                  className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`}
                />
                <span className="text-[9px] uppercase tracking-wider font-extrabold text-[#2B2118]/40 leading-none">
                  {isConnected ? 'Online' : 'Connecting...'}
                </span>
              </div>
            </div>
          </div>
          <div className="w-10 h-10 pointer-events-none opacity-0 shrink-0" />
        </header>
      </div>

      {/* MESSAGES AREA */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6 pb-28 md:pb-24 z-10 bg-transparent">
        {loading ? (
          <div className="h-full flex flex-col items-center justify-center py-20 select-none bg-transparent">
            <div
              className="w-12 h-12 rounded-full border-4 animate-spin"
              style={{
                borderColor: isVendor ? '#E0653A33' : '#5C7A5233',
                borderTopColor: isVendor ? '#E0653A' : '#5C7A52',
              }}
            />
            <p className="mt-4 text-xs font-bold uppercase tracking-wider text-charcoal/50 font-body animate-pulse">
              Loading messages...
            </p>
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center py-20 text-center select-none bg-transparent">
            <svg className="w-16 h-16 text-charcoal/20 mb-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <h4 className="font-display font-bold text-lg text-charcoal/40 mb-1">
              No messages yet
            </h4>
            <p className="text-xs text-charcoal/50 font-body mt-1">
              Say hello to start the conversation
            </p>
          </div>
        ) : (
          Object.keys(messageGroups).map((dateStr) => (
            <div key={dateStr} className="space-y-4">
              {/* Date Separator */}
              <div className="flex justify-center select-none my-4 mx-auto w-fit">
                <span className="bg-white/50 backdrop-blur border border-white/30 rounded-full px-4 py-1 text-[11px] font-bold uppercase tracking-wider text-charcoal/50 shadow-xs">
                  {formatDateSeparator(dateStr)}
                </span>
              </div>

              {/* Day Messages */}
              {messageGroups[dateStr].map((msg) => {
                const isSent =
                  msg.senderRole === (isVendor ? 'vendor' : 'customer');
                const showComplaintBadge =
                  msg.isComplaint && msg.complaintStatus !== 'none';

                return (
                  <div
                    key={msg._id}
                    className={`flex flex-col ${isSent ? 'items-end' : 'items-start'} gap-1 mb-3`}
                  >
                    {/* Message Bubble wrapper */}
                    <div className={`flex items-center gap-2 max-w-[72%] group ${isSent ? 'flex-row-reverse' : 'flex-row'}`}>
                      {/* Flag icon for customer to complain (only on received or any message, when hovered/tapped, only if not already complained) */}
                      {!isVendor && !msg.isComplaint && (
                        <button
                          onClick={() => handleRaiseComplaint(msg._id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-red-50 text-red-500 cursor-pointer"
                          title="Raise Complaint"
                        >
                          <svg
                            className="w-3.5 h-3.5"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={2}
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21v8h-6l-1-1H5v5h4M3 17h6"
                            />
                          </svg>
                        </button>
                      )}

                      {/* Bubble itself */}
                      <div
                        className={`px-4 py-3 rounded-[20px] shadow-sm relative ${
                          isSent
                            ? `${accentBgClass} text-white rounded-br-[6px] ${
                                isVendor
                                  ? 'shadow-[0_4px_15px_rgba(224,101,58,0.25)]'
                                  : 'shadow-[0_4px_15px_rgba(92,122,82,0.25)]'
                              }`
                            : 'bg-white/70 text-[#2B2118] border border-white/40 rounded-bl-[6px] backdrop-blur shadow-xs'
                        }`}
                      >
                        <p className="text-sm font-body leading-relaxed break-words whitespace-pre-wrap">
                          {msg.text}
                        </p>
                        <span className={`text-[10px] mt-1.5 block text-right ${isSent ? 'text-white/60' : 'text-charcoal/40'}`}>
                          {formatMessageTime(msg.createdAt)}
                        </span>
                      </div>
                    </div>

                    {/* Complaint Pills/Actions below bubble */}
                    {showComplaintBadge && (
                      <div className="px-2">
                        {/* CUSTOMER display pill */}
                        {!isVendor && (
                          <div
                            className={`text-[10px] font-bold py-1 px-2.5 rounded-full inline-flex items-center gap-1 shadow-sm border ${
                              msg.complaintStatus === 'raised'
                                ? 'bg-amber-50 border-amber-200 text-amber-700'
                                : msg.complaintStatus === 'acknowledged'
                                  ? 'bg-blue-50 border-blue-200 text-blue-700'
                                  : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                            }`}
                          >
                            <span className="inline-flex items-center gap-1">
                              {msg.complaintStatus === 'raised' && <Flag className="w-3 h-3 text-amber-600 inline" />}
                              {msg.complaintStatus === 'acknowledged' && <Eye className="w-3 h-3 text-blue-600 inline" />}
                              {msg.complaintStatus === 'resolved' && <CheckCircle2 className="w-3 h-3 text-emerald-600 inline" />}
                              {msg.complaintStatus === 'raised'
                                ? 'Complaint Raised'
                                : msg.complaintStatus === 'acknowledged'
                                  ? 'Acknowledged'
                                  : 'Resolved'}
                            </span>
                          </div>
                        )}

                        {/* VENDOR display & action buttons */}
                        {isVendor && (
                          <div className="flex flex-col items-start gap-1">
                            <div
                              className={`text-[10px] font-bold py-1 px-2.5 rounded-full inline-flex items-center gap-1 shadow-sm border ${
                                msg.complaintStatus === 'raised'
                                  ? 'bg-amber-50 border-amber-200 text-amber-700'
                                  : msg.complaintStatus === 'acknowledged'
                                    ? 'bg-blue-50 border-blue-200 text-blue-700'
                                    : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                              }`}
                            >
                              <span className="inline-flex items-center gap-1">
                                {msg.complaintStatus === 'raised' && <Flag className="w-3 h-3 text-amber-600 inline" />}
                                {msg.complaintStatus === 'acknowledged' && <Eye className="w-3 h-3 text-blue-600 inline" />}
                                {msg.complaintStatus === 'resolved' && <CheckCircle2 className="w-3 h-3 text-emerald-600 inline" />}
                                {msg.complaintStatus === 'raised'
                                  ? 'Complaint Raised'
                                  : msg.complaintStatus === 'acknowledged'
                                    ? 'Acknowledged'
                                    : 'Resolved'}
                              </span>
                            </div>

                            {/* Status update menu trigger */}
                            {(msg.complaintStatus === 'raised' ||
                              msg.complaintStatus === 'acknowledged') && (
                              <div className="relative mt-1">
                                <button
                                  onClick={() =>
                                    setActiveComplaintMenuId(
                                      activeComplaintMenuId === msg._id
                                        ? null
                                        : msg._id,
                                    )
                                  }
                                  className="text-[10px] text-charcoal/50 hover:text-charcoal font-bold uppercase tracking-wider border border-charcoal/10 rounded-lg px-2 py-1 bg-white/60 cursor-pointer shadow-sm"
                                >
                                  Update Status
                                </button>
                                {activeComplaintMenuId === msg._id && (
                                  <div className="absolute left-0 mt-1 bg-white border border-charcoal/10 rounded-xl shadow-lg p-1.5 z-40 flex flex-col gap-1 w-36">
                                    {msg.complaintStatus === 'raised' && (
                                      <button
                                        onClick={() =>
                                          handleUpdateComplaintStatus(
                                            msg._id,
                                            'acknowledged',
                                          )
                                        }
                                        className="text-left text-[10px] font-bold hover:bg-blue-50 hover:text-blue-700 text-charcoal/80 px-2 py-1.5 rounded-lg cursor-pointer"
                                      >
                                        Acknowledge
                                      </button>
                                    )}
                                    <button
                                      onClick={() =>
                                        handleUpdateComplaintStatus(
                                          msg._id,
                                          'resolved',
                                        )
                                      }
                                      className="text-left text-[10px] font-bold hover:bg-emerald-50 hover:text-emerald-700 text-charcoal/80 px-2 py-1.5 rounded-lg cursor-pointer"
                                    >
                                      Mark Resolved
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))
        )}

        {/* Partner Typing Bubble */}
        {isPartnerTyping && (
          <div className="flex flex-col items-start gap-1 mb-3">
            <div className="bg-white/70 backdrop-blur border border-white/40 rounded-[20px] rounded-bl-[6px] px-4 py-3 shadow-sm max-w-[72%] flex items-center gap-1 h-10">
              <span className="w-2 h-2 rounded-full bg-charcoal/40 typing-dot animate-pulse" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 rounded-full bg-charcoal/40 typing-dot animate-pulse" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 rounded-full bg-charcoal/40 typing-dot animate-pulse" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* INPUT BAR */}
      <footer className="fixed bottom-0 left-0 right-0 z-30 bg-white/70 backdrop-blur-xl border-t border-white/30 px-4 py-3 pb-[max(12px,env(safe-area-inset-bottom))] shadow-lg select-none shrink-0">
        <form
          onSubmit={handleSendMessage}
          className="max-w-4xl mx-auto flex items-center gap-3 w-full"
        >
          <input
            type="text"
            value={inputText}
            onChange={handleInputChange}
            disabled={loading}
            placeholder="Type your message..."
            className={`flex-1 bg-white/60 border border-white/40 rounded-[24px] px-5 py-3 text-sm font-body text-charcoal focus:outline-none focus:ring-2 transition-all ${
              isVendor
                ? 'focus:ring-[#E0653A]/20 focus:border-[#E0653A]'
                : 'focus:ring-[#5C7A52]/20 focus:border-[#5C7A52]'
            }`}
          />

          <button
            type="submit"
            disabled={!inputText.trim() || isSending || loading}
            className={`w-11 h-11 rounded-2xl ${accentBgClass} text-white flex items-center justify-center shrink-0 transition-all ${
              isVendor
                ? 'shadow-[0_8px_25px_rgba(224,101,58,0.3)]'
                : 'shadow-[0_8px_25px_rgba(92,122,82,0.3)]'
            } hover:scale-105 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100 disabled:shadow-none`}
            title="Send Message"
          >
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
            </svg>
          </button>
        </form>
      </footer>
    </div>
  );
};

export default ChatWindow;
