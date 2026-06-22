import React from 'react';

interface StatusBadgeProps {
  status: 'accepted' | 'pending' | 'rejected';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  if (status === 'accepted') {
    return (
      <span className="text-[#5C7A52] font-bold uppercase tracking-wider text-xs select-none">
        Accepted
      </span>
    );
  }
  if (status === 'pending') {
    return (
      <span className="text-amber-600 font-bold uppercase tracking-wider text-xs select-none">
        Pending
      </span>
    );
  }
  if (status === 'rejected') {
    return (
      <span className="text-rose-600 font-bold uppercase tracking-wider text-xs select-none">
        Rejected
      </span>
    );
  }

  return (
    <span className="text-gray-500 font-bold uppercase tracking-wider text-xs select-none">
      {status}
    </span>
  );
};

export default StatusBadge;
