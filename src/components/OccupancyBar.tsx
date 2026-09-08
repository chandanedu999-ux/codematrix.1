import React from 'react';
import { ShelterStatus } from '../types';

interface OccupancyBarProps {
  current: number;
  capacity: number;
  status: ShelterStatus;
  showLabels?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const OccupancyBar: React.FC<OccupancyBarProps> = ({
  current,
  capacity,
  status,
  showLabels = true,
  size = 'md',
  className = ''
}) => {
  const percent = Math.min(100, Math.round((current / Math.max(1, capacity)) * 100));
  const isOver = current > capacity;

  let barColor = 'bg-emerald-600';
  if (status === 'CRITICAL' || percent >= 90) barColor = 'bg-rose-600';
  else if (status === 'LIMITED' || percent >= 70) barColor = 'bg-amber-500';
  else if (status === 'OVERCAPACITY' || isOver) barColor = 'bg-red-700';
  else if (status === 'INACTIVE') barColor = 'bg-slate-400';

  const heights = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4'
  };

  return (
    <div className={`w-full ${className}`} id={`occupancy-bar-${current}-${capacity}`}>
      {showLabels && (
        <div className="flex justify-between items-center text-xs text-slate-600 mb-1.5 font-medium">
          <span className="font-semibold text-slate-800">
            {current.toLocaleString()} / {capacity.toLocaleString()}{' '}
            <span className="text-slate-500 font-normal">people</span>
          </span>
          <span className={`font-bold ${percent >= 90 ? 'text-rose-600' : percent >= 70 ? 'text-amber-600' : 'text-emerald-700'}`}>
            {percent}% occupied
          </span>
        </div>
      )}
      <div className={`w-full bg-slate-200 rounded-full overflow-hidden ${heights[size]} relative`}>
        <div
          className={`${heights[size]} rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${percent}%` }}
          role="progressbar"
          aria-valuenow={current}
          aria-valuemin={0}
          aria-valuemax={capacity}
          aria-label={`${current} out of ${capacity} people sheltered (${percent}%)`}
        />
        {isOver && (
          <div 
            className="absolute top-0 right-0 bottom-0 bg-red-900 animate-pulse opacity-80" 
            style={{ width: '8px' }}
            title="Overcapacity Alert"
          />
        )}
      </div>
    </div>
  );
};
