import React from 'react';
import { ShelterStatus } from '../types';
import { CheckCircle2, AlertTriangle, AlertOctagon, XCircle, Slash } from 'lucide-react';

interface StatusBadgeProps {
  status: ShelterStatus;
  occupancyPercent?: number;
  showPercent?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  occupancyPercent,
  showPercent = false,
  size = 'md',
  className = ''
}) => {
  let bg = 'bg-emerald-50 text-emerald-800 border-emerald-300';
  let dot = 'bg-emerald-500';
  let label = 'AVAILABLE';
  let Icon = CheckCircle2;

  switch (status) {
    case 'AVAILABLE':
      bg = 'bg-emerald-50 text-emerald-800 border-emerald-300';
      dot = 'bg-emerald-500';
      label = 'AVAILABLE';
      Icon = CheckCircle2;
      break;
    case 'LIMITED':
      bg = 'bg-amber-50 text-amber-800 border-amber-300';
      dot = 'bg-amber-500';
      label = 'LIMITED';
      Icon = AlertTriangle;
      break;
    case 'CRITICAL':
      bg = 'bg-rose-50 text-rose-800 border-rose-300';
      dot = 'bg-rose-600 animate-pulse';
      label = 'CRITICAL';
      Icon = AlertOctagon;
      break;
    case 'OVERCAPACITY':
      bg = 'bg-red-950 text-red-100 border-red-700';
      dot = 'bg-red-500 animate-ping';
      label = 'OVERCAPACITY';
      Icon = AlertOctagon;
      break;
    case 'INACTIVE':
      bg = 'bg-slate-100 text-slate-700 border-slate-300';
      dot = 'bg-slate-400';
      label = 'CLOSED';
      Icon = Slash;
      break;
  }

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs font-semibold gap-1.5',
    md: 'px-2.5 py-1 text-xs font-semibold gap-1.5',
    lg: 'px-3 py-1.5 text-sm font-bold gap-2'
  };

  return (
    <span
      id={`status-badge-${status.toLowerCase()}`}
      className={`inline-flex items-center rounded-full border shadow-2xs tracking-wide uppercase ${sizeClasses[size]} ${bg} ${className}`}
      role="status"
    >
      <span className={`w-2 h-2 rounded-full shrink-0 ${dot}`} aria-hidden="true" />
      <Icon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
      <span>
        {label}
        {showPercent && occupancyPercent !== undefined ? ` — ${occupancyPercent}%` : ''}
      </span>
    </span>
  );
};
