import React, { useState } from 'react';
import { Navigation, ShieldAlert, Radio, ArrowRight, LocateFixed } from 'lucide-react';
import { useRipple, triggerHaptic } from './Ripple';
import { Shelter } from '../types';

interface EmergencyFABProps {
  onImmediateAccess: () => void;
  nearestShelter?: Shelter | null;
  distanceKm?: number | null;
  isLocating?: boolean;
}

export const EmergencyFAB: React.FC<EmergencyFABProps> = ({
  onImmediateAccess,
  nearestShelter,
  distanceKm,
  isLocating = false
}) => {
  const { createRipple, RippleElements } = useRipple('rgba(255, 255, 255, 0.5)');
  const [isHovered, setIsHovered] = useState(false);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    createRipple(e);
    triggerHaptic([60, 40, 90]);
    onImmediateAccess();
  };

  return (
    <div 
      className="fixed bottom-20 right-4 sm:bottom-8 sm:right-8 z-40 flex items-center gap-3 pointer-events-none"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {/* Desktop Context Pill that slides out on hover or stays visible */}
      {nearestShelter && (
        <div 
          className="hidden md:flex items-center gap-2 bg-[#0F172A] text-white px-4 py-2.5 rounded-2xl shadow-xl border border-slate-700 pointer-events-auto transition-all animate-in fade-in slide-in-from-right-4 duration-200"
        >
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <div className="text-left">
            <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#38BDF8]">
              Nearest Open Shelter
            </div>
            <div className="text-xs font-bold text-white max-w-[180px] truncate">
              {nearestShelter.name}
            </div>
          </div>
          {distanceKm !== null && distanceKm !== undefined && (
            <span className="text-[11px] font-mono font-bold text-amber-300 bg-slate-800 px-2 py-0.5 rounded ml-1">
              {distanceKm < 1 ? `${Math.round(distanceKm * 1000)}m` : `${distanceKm.toFixed(1)}km`}
            </span>
          )}
        </div>
      )}

      {/* Massive Emergency FAB Button */}
      <button
        id="emergency-fab-btn"
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        aria-label="Immediate Access to Nearby Shelter"
        title="Immediate Access to Nearby Shelter (Highest Priority)"
        className="clay-fab pointer-events-auto relative group flex items-center justify-center min-w-[68px] h-[68px] sm:min-w-[76px] sm:h-[76px] px-4 sm:px-6 rounded-full text-white cursor-pointer focus:outline-none focus-visible:ring-4 focus-visible:ring-[#EA580C] focus-visible:ring-offset-2 select-none"
      >
        {RippleElements}

        {/* Pulse beacon waves radiating outwards */}
        <span className="absolute -inset-1 rounded-full bg-[#EA580C] opacity-40 animate-ping pointer-events-none" style={{ animationDuration: '2.5s' }} />

        <div className="flex items-center gap-2.5">
          {/* Main Icon */}
          <div className="relative">
            {isLocating ? (
              <LocateFixed className="w-7 h-7 sm:w-8 sm:h-8 animate-spin text-white" />
            ) : (
              <Navigation className="w-7 h-7 sm:w-8 sm:h-8 text-white fill-white transition-transform duration-200 group-hover:scale-110" />
            )}
            <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-white border-2 border-[#EA580C] flex items-center justify-center">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </span>
          </div>

          {/* Urgent Label (Visible on Tablet & Laptop, or expands on mobile) */}
          <div className="hidden sm:flex flex-col items-start leading-tight text-left">
            <span className="text-[10px] font-black uppercase tracking-wider text-orange-200">
              Immediate Access
            </span>
            <span className="text-sm font-black tracking-tight text-white flex items-center gap-1">
              <span>NEARBY SHELTER</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </span>
          </div>
        </div>
      </button>
    </div>
  );
};
