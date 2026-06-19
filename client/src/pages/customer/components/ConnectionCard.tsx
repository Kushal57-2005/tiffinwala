import React from 'react';
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
                <div className="px-2.5 py-1 bg-amber-500/10 text-amber-800 text-[10px] font-bold tracking-wider uppercase rounded-lg border border-amber-500/15">
                  Overdue
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {isAccepted && (
        <div className="mt-6">
          <button
            onClick={handlePay}
            disabled={!hasDue || isPaying}
            className={`w-full py-3.5 px-4 rounded-2xl font-display font-bold text-xs uppercase tracking-wider border transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer ${
              hasDue
                ? isPaying
                  ? 'bg-amber-500/10 border-amber-500/20 text-amber-700 cursor-wait'
                  : 'bg-leaf text-white border-leaf hover:bg-[#4C6643] hover:border-[#4C6643] shadow-[0_4px_12px_rgba(92,122,82,0.2)] hover:shadow-[0_6px_20px_rgba(92,122,82,0.3)] active:scale-98'
                : 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {isPaying ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-amber-700"
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
                Processing...
              </>
            ) : hasDue ? (
              'Pay Due Amount'
            ) : (
              'No Dues Pending'
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default ConnectionCard;
