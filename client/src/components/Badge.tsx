import React from 'react';

interface BadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({ status, size = 'sm' }) => {
  const norm = status.toLowerCase();

  let styles = 'bg-slate-100 text-slate-700 border-slate-200';

  if (norm === 'available' || norm === 'completed' || norm === 'paid' || norm === 'successful') {
    styles = 'bg-emerald-50 text-emerald-800 border-emerald-200';
  } else if (norm === 'confirmed' || norm === 'active' || norm === 'full') {
    styles = 'bg-teal-50 text-teal-800 border-teal-200';
  } else if (norm === 'pending' || norm === 'in_progress' || norm === 'new') {
    styles = 'bg-amber-50 text-amber-800 border-amber-200';
  } else if (norm === 'rented') {
    styles = 'bg-blue-50 text-blue-800 border-blue-200';
  } else if (norm === 'cancelled' || norm === 'failed' || norm === 'archived' || norm === 'maintenance') {
    styles = 'bg-rose-50 text-rose-800 border-rose-200';
  }

  const padding = size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-sm';

  return (
    <span className={`inline-flex items-center font-medium rounded-full border capitalize ${padding} ${styles}`}>
      {status.replace('_', ' ')}
    </span>
  );
};
