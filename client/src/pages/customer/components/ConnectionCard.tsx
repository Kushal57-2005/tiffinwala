import React from 'react';
import { useNavigate } from 'react-router-dom';
import StatusBadge from './StatusBadge';

export interface ConnectionVendor {
  _id: string;
  businessName: string;
}

export interface IConnection {
  _id: string;
  customerId: string;
  vendorId: ConnectionVendor;
  status: 'pending' | 'accepted' | 'rejected';
  pendingDue: number;
}

interface ConnectionCardProps {
  connection: IConnection;
  onPayDue?: (id: string) => Promise<void>;
  isPaying?: boolean;
}

export const ConnectionCard: React.FC<ConnectionCardProps> = ({
  connection,
  onPayDue,
  isPaying = false,
}) => {
  const navigate = useNavigate();
  const { _id, vendorId, status, pendingDue } = connection;
  const businessName = vendorId?.businessName || 'Unknown Vendor';
  const isAccepted = status === 'accepted';
  const hasDue = pendingDue > 0;

  const handlePay = () => {
    if (onPayDue && hasDue && isAccepted && !isPaying) {
      onPayDue(_id);
    }
  };

  return (
    <div className="bg-white/40 border border-white/30 backdrop-blur-xl rounded-[32px] p-6 shadow-[0_24px_70px_-15px_rgba(43,33,24,0.12)] hover:shadow-[0_28px_80px_-15px_rgba(43,33,24,0.16)] hover:border-leaf/30 hover:bg-white/60 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between h-full group">
      <div className="space-y-4">
        {/* Header row: Name & Badge */}
        <div className="flex justify-between items-start gap-4">
          <h3 className="font-display font-extrabold text-lg text-[#2B2118] leading-snug group-hover:text-leaf transition-colors line-clamp-2">
            {businessName}
          </h3>
          <StatusBadge status={status} />
        </div>

        {isAccepted && (
          <>
            {/* Divider */}
            <div className="h-px bg-[#2B2118]/5 w-full" />

            {/* Due Details */}
            <div className="flex justify-between items-center py-1">
              <div>
                <p className="text-[10px] text-[#2B2118]/50 uppercase tracking-wider font-extrabold font-body">
                  Pending Due
                </p>
                <p className="text-2xl font-display font-extrabold text-[#2B2118] mt-1">
                  ₹{pendingDue.toFixed(2)}
                </p>
              </div>
              {hasDue && (
                <span className="text-amber-700 text-[10px] font-bold tracking-wider uppercase select-none">
                  Overdue
                </span>
              )}
            </div>
          </>
        )}
      </div>

      {isAccepted && (
        <div className="mt-6 flex gap-3">
          <button
            onClick={() => navigate(`/customer/chat/${vendorId?._id}`, { state: { businessName } })}
            className="flex-1 py-3.5 px-4 rounded-2xl font-display font-bold text-xs uppercase tracking-wider border border-leaf/35 text-leaf hover:bg-leaf hover:text-white transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer active:scale-98"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            Chat
          </button>
          {hasDue ? (
            <button
              onClick={handlePay}
              disabled={isPaying}
              className={`flex-1 py-3.5 px-4 rounded-2xl font-display font-bold text-xs uppercase tracking-wider border transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer ${
                isPaying
                  ? 'bg-amber-500/10 border-amber-500/20 text-amber-700 cursor-wait'
                  : 'bg-leaf text-white border-leaf hover:bg-[#4C6643] hover:border-[#4C6643] shadow-[0_4px_12px_rgba(92,122,82,0.2)] hover:shadow-[0_6px_20px_rgba(92,122,82,0.3)] active:scale-98'
              }`}
            >
              {isPaying ? 'Processing...' : 'Pay Due'}
            </button>
          ) : (
            <div className="flex-1 py-3.5 px-4 rounded-2xl font-display font-bold text-xs uppercase tracking-wider border border-[#2B2118]/10 bg-gray-50 text-gray-400 flex items-center justify-center select-none">
              No Dues
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ConnectionCard;
