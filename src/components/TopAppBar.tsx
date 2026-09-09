import React, { useState } from 'react';
import { useResq } from '../context/ResqContext';
import { useRipple, triggerHaptic } from './Ripple';
import { 
  Search, 
  Menu, 
  LocateFixed, 
  MapPin, 
  AlertOctagon, 
  X, 
  SlidersHorizontal,
  ChevronDown,
  ShieldAlert
} from 'lucide-react';

interface TopAppBarProps {
  onToggleSidebar: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onLocateNearby: () => void;
  isLocating?: boolean;
  onOpenDistressModal: () => void;
  onSelectSectorLocation?: (lat: number, lng: number, label: string) => void;
  activeLocationLabel?: string;
  onClearLocation?: () => void;
}

export const TopAppBar: React.FC<TopAppBarProps> = ({
  onToggleSidebar,
  searchQuery,
  onSearchChange,
  onLocateNearby,
  isLocating = false,
  onOpenDistressModal,
  onSelectSectorLocation,
  activeLocationLabel,
  onClearLocation
}) => {
  const { emergencyMode } = useResq();
  const { createRipple, RippleElements } = useRipple();

  const handleNearbyClick = (e: React.MouseEvent) => {
    createRipple(e);
    triggerHaptic([40, 30, 60]);
    onLocateNearby();
  };

  const handleSectorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (!val || !onSelectSectorLocation) return;
    const [latStr, lngStr, label] = val.split('|');
    if (latStr && lngStr) {
      triggerHaptic([30]);
      onSelectSectorLocation(parseFloat(latStr), parseFloat(lngStr), label);
    }
  };

  return (
    <header 
      id="top-floating-appbar"
      className={`sticky top-0 z-30 px-3 sm:px-6 py-3 transition-colors ${
        emergencyMode ? 'glass-panel-dark text-white' : 'glass-panel text-[#0F172A]'
      }`}
      style={{ paddingTop: 'calc(0.75rem + env(safe-area-inset-top))' }}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
        
        {/* Mobile Hamburger Toggle */}
        <button
          id="btn-sidebar-hamburger"
          onClick={onToggleSidebar}
          className="lg:hidden min-w-[48px] h-12 flex items-center justify-center rounded-2xl bg-white/80 hover:bg-white text-[#0F172A] border border-slate-200/80 shadow-xs transition-colors cursor-pointer"
          aria-label="Open navigation menu"
        >
          <Menu className="w-6 h-6" />
        </button>

        {/* Brand snippet visible on smaller screens */}
        <div className="hidden sm:flex lg:hidden items-center gap-2 font-black text-sm text-[#0F172A]">
          <div className="w-8 h-8 rounded-xl bg-[#EA580C] text-white flex items-center justify-center">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <span className="font-extrabold tracking-tight">RESQTECH</span>
        </div>

        {/* ROBUST SEARCH BAR */}
        <div className="flex-1 relative flex items-center max-w-2xl">
          <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            id="top-shelter-search-input"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search relief shelters, wards, landmarks..."
            className="w-full pl-11 pr-10 min-h-[48px] text-sm sm:text-base font-medium rounded-2xl bg-white/90 hover:bg-white focus:bg-white text-[#0F172A] border-2 border-slate-200/90 focus:border-[#0F172A] focus:outline-none transition-all placeholder:text-slate-400 shadow-xs"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer p-1"
              aria-label="Clear search input"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* QUICK SECTOR SELECTOR (Desktop/Tablet) */}
        <div className="hidden xl:flex items-center">
          <div className="relative">
            <select
              id="top-sector-selector"
              onChange={handleSectorChange}
              defaultValue=""
              className="appearance-none min-h-[48px] pl-3.5 pr-8 text-xs font-bold rounded-2xl bg-white/90 text-[#0F172A] border-2 border-slate-200/90 hover:border-slate-300 focus:outline-none cursor-pointer"
            >
              <option value="" disabled>Select Relief Sector</option>
              <option value="23.1541881|72.6729164|Gandhinagar / Raysan Hub">
                📍 Gandhinagar / Raysan
              </option>
              <option value="23.1582|72.6685|PDPU Campus Corridor">
                📍 PDPU Campus Corridor
              </option>
              <option value="23.0225|72.5714|Ahmedabad Central Arena">
                📍 Ahmedabad Central
              </option>
              <option value="23.1815|72.6342|Infocity High School">
                📍 Infocity High School
              </option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* PRIMARY "NEARBY SHELTERS" ACTION (Claymorphic / Tactical) */}
        <button
          id="top-btn-nearby-shelters"
          onClick={handleNearbyClick}
          disabled={isLocating}
          title="Detect current location and sort shelters by nearest proximity"
          className="clay-btn-primary min-h-[48px] px-3.5 sm:px-5 rounded-2xl text-white text-xs sm:text-sm font-black tracking-tight flex items-center justify-center gap-2 cursor-pointer relative overflow-hidden shrink-0 select-none"
        >
          {RippleElements}
          <LocateFixed className={`w-4 h-4 text-sky-200 ${isLocating ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">
            {isLocating ? 'Locating...' : 'Nearby Shelters'}
          </span>
          <span className="sm:hidden">
            {isLocating ? '...' : 'Nearby'}
          </span>
        </button>

        {/* EMERGENCY SOS BUTTON (Immediate Tap Target) */}
        <button
          id="top-btn-sos-trigger"
          onClick={() => {
            triggerHaptic([60, 40, 100]);
            onOpenDistressModal();
          }}
          title="Broadcast Emergency SOS"
          className="clay-btn-emergency min-w-[48px] min-h-[48px] px-3.5 rounded-2xl text-white font-black text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md select-none shrink-0"
        >
          <AlertOctagon className="w-4 h-4 animate-pulse" />
          <span className="hidden md:inline">SOS</span>
        </button>

      </div>

      {/* Active GPS Location Badge Banner */}
      {activeLocationLabel && (
        <div className="max-w-7xl mx-auto mt-2 pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-medium text-[#0F172A]">
              Active GPS: <strong>{activeLocationLabel}</strong>
            </span>
          </div>

          {onClearLocation && (
            <button
              onClick={onClearLocation}
              className="text-xs text-slate-400 hover:text-slate-700 font-bold flex items-center gap-1 cursor-pointer"
            >
              <X className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}
        </div>
      )}
    </header>
  );
};
