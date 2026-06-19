import React from 'react';

interface StatusBadgeProps {
  status: 'accepted' | 'pending' | 'rejected';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const config = {
    accepted: {
      text: 'Accepted',
      classes: 'text-emerald-700 bg-emerald-50 border-emerald-200',
      dotClasses: 'bg-emerald-500',
    },
    pending: {
      text: 'Pending',
      classes: 'text-amber-700 bg-amber-50 border-amber-200',
      dotClasses: 'bg-amber-500',
    },
    rejected: {
      text: 'Rejected',
      classes: 'text-rose-700 bg-rose-50 border-rose-200',
      dotClasses: 'bg-rose-505', // typo: bg-rose-500
    },
  };

  const current = config[status] || {
    text: status,
    classes: 'text-gray-700 bg-gray-50 border-gray-200',
    dotClasses: 'bg-gray-400',
  };

  // Fix typo from bg-rose-555 or bg-rose-505
  const dotColor = status === 'rejected' ? 'bg-rose-500' : current.dotClasses;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full border select-none ${current.classes}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor} animate-pulse`} />
      {current.text}
    </span>
  );
};

export default StatusBadge;
