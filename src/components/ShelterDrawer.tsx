import React, { useState } from 'react';
import { Shelter } from '../types';
import { useResq } from '../context/ResqContext';
import { StatusBadge } from './StatusBadge';
import { OccupancyBar } from './OccupancyBar';
import { 
  X, 
  MapPin, 
  Phone, 
  UserCheck, 
  Clock, 
  ExternalLink, 
  Share2, 
  AlertCircle, 
  ShieldCheck, 
  Droplet, 
  Utensils, 
  HeartPulse, 
  Bed, 
  Check, 
  Ban, 
  Zap, 
  Wifi, 
  UserPlus,
  AlertTriangle
} from 'lucide-react';

interface ShelterDrawerProps {
  shelter: Shelter | null;
  onClose: () => void;
  onNavigateToIntake: (shelterId: string) => void;
  onOpenReportModal: (shelter: Shelter) => void;
}

export const ShelterDrawer: React.FC<ShelterDrawerProps> = ({
  shelter,
  onClose,
  onNavigateToIntake,
  onOpenReportModal
}) => {
  const { userRole, updateShelterStatus, showToast, getShelterPriority } = useResq();

  if (!shelter) return null;

  const occPercent = Math.min(100, Math.round((shelter.currentOccupancy / Math.max(1, shelter.capacity)) * 100));
  const availableBeds = Math.max(0, shelter.capacity - shelter.currentOccupancy);
  const priority = getShelterPriority(shelter);

  // Time diff calculation
  const updatedDate = new Date(shelter.lastUpdated);
  const diffMinutes = Math.max(1, Math.round((Date.now() - updatedDate.getTime()) / 60000));
  const isStale = diffMinutes > 25;

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(`${window.location.origin}/#shelter-${shelter.id}`);
      showToast(`Link to ${shelter.name} copied to clipboard`, 'success');
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-xs flex justify-end transition-opacity"
      role="dialog"
      aria-modal="true"
      aria-labelledby="shelter-drawer-title"
    >
      <div 
        className="w-full max-w-xl bg-white h-full shadow-2xl flex flex-col overflow-y-auto animate-in slide-in-from-right duration-200 border-l border-slate-200"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-slate-200 px-6 py-4 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <StatusBadge status={shelter.status} occupancyPercent={occPercent} showPercent size="sm" />
              <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-sm">
                {shelter.code}
              </span>
              {shelter.verifiedByAuthority && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-sm border border-blue-200">
                  <ShieldCheck className="w-3 h-3" />
                  Verified
                </span>
              )}
            </div>
            <h2 id="shelter-drawer-title" className="text-lg font-bold text-slate-900 leading-snug">
              {shelter.name}
            </h2>
            <p className="text-xs text-slate-600 flex items-center gap-1 mt-0.5">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>{shelter.address}, {shelter.district}</span>
            </p>
          </div>

          <button
            id="shelter-drawer-close-btn"
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Close shelter drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="px-6 py-5 space-y-6 flex-1">

          {/* Stale Data Warning if needed */}
          {isStale ? (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2.5 text-xs text-amber-900">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Information may be outdated: </span>
                Last field check was {diffMinutes} minutes ago. If you arrive and find different capacity, please use the report button below.
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between text-xs text-slate-500 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">
              <span className="flex items-center gap-1.5 font-medium text-slate-700">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                Live Intelligence Active
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                Updated {diffMinutes} min ago
              </span>
            </div>
          )}

          {/* Large Capacity Card */}
          <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
            <div className="text-xs uppercase font-bold tracking-wider text-slate-500 mb-2">
              Current Shelter Capacity
            </div>
            
            <div className="flex items-baseline justify-between mb-3">
              <div>
                <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
                  {shelter.currentOccupancy.toLocaleString()}
                </span>
                <span className="text-sm font-semibold text-slate-500 ml-1.5">
                  / {shelter.capacity.toLocaleString()} total
                </span>
              </div>
              <span className={`text-2xl font-black ${occPercent >= 90 ? 'text-rose-600' : occPercent >= 70 ? 'text-amber-600' : 'text-emerald-700'}`}>
                {occPercent}%
              </span>
            </div>

            <OccupancyBar 
              current={shelter.currentOccupancy} 
              capacity={shelter.capacity} 
              status={shelter.status} 
              size="lg" 
              showLabels={false} 
            />

            <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-200 text-center">
              <div className="bg-white p-2 rounded-lg border border-slate-200">
                <div className="text-xs text-slate-500 font-medium">Available Spaces</div>
                <div className="text-base font-bold text-emerald-700">{availableBeds}</div>
              </div>
              <div className="bg-white p-2 rounded-lg border border-slate-200">
                <div className="text-xs text-slate-500 font-medium">Beds Set Up</div>
                <div className="text-base font-bold text-slate-800">{shelter.resources.bedsAvailable}</div>
              </div>
              <div className="bg-white p-2 rounded-lg border border-slate-200">
                <div className="text-xs text-slate-500 font-medium">Accepting</div>
                <div className="text-base font-bold text-slate-800">
                  {shelter.acceptingNewArrivals ? 'YES' : 'NO'}
                </div>
              </div>
            </div>
          </div>

          {/* Priority Callout if high or critical */}
          {priority.level !== 'NORMAL' && (
            <div className={`p-4 rounded-xl border text-xs ${
              priority.level === 'CRITICAL' ? 'bg-rose-50 border-rose-200 text-rose-950' : 'bg-amber-50 border-amber-200 text-amber-950'
            }`}>
              <div className="font-bold text-sm mb-1 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>Operational Priority: {priority.level}</span>
              </div>
              <p className="leading-relaxed opacity-90">{priority.rationale}</p>
            </div>
          )}

          {/* Essential Relief Services */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
              Essential Relief Services
            </h3>
            <div className="grid grid-cols-2 gap-2.5">
              
              <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-start gap-3">
                <div className={`p-2 rounded-lg ${shelter.facilities.drinkingWater ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-400'}`}>
                  <Droplet className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-800 flex items-center gap-1">
                    Drinking Water
                    {shelter.facilities.drinkingWater ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Ban className="w-3.5 h-3.5 text-slate-400" />}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {shelter.resources.waterLiters.toLocaleString()} L in reserve
                  </div>
                </div>
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-start gap-3">
                <div className={`p-2 rounded-lg ${shelter.facilities.foodRation ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-400'}`}>
                  <Utensils className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-800 flex items-center gap-1">
                    Food / Rations
                    {shelter.facilities.foodRation ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Ban className="w-3.5 h-3.5 text-slate-400" />}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {shelter.resources.rationKits} family dry packs
                  </div>
                </div>
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-start gap-3">
                <div className={`p-2 rounded-lg ${shelter.facilities.medicalAid ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-400'}`}>
                  <HeartPulse className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-800 flex items-center gap-1">
                    Medical Team
                    {shelter.facilities.medicalAid ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Ban className="w-3.5 h-3.5 text-rose-500" />}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {shelter.resources.medicalTeams > 0 ? `${shelter.resources.medicalTeams} medical unit on site` : 'Dispatched / On-call'}
                  </div>
                </div>
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-start gap-3">
                <div className={`p-2 rounded-lg ${shelter.facilities.electricity ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-400'}`}>
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-800 flex items-center gap-1">
                    Power &amp; Charging
                    {shelter.facilities.electricity ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Ban className="w-3.5 h-3.5 text-slate-400" />}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {shelter.facilities.chargingStation ? 'Device Charging Station' : 'Generator only'}
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Special Facilities & Inclusivity */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Accessibility &amp; Vulnerable Support
            </h3>
            <div className="flex flex-wrap gap-1.5 text-xs">
              <span className={`px-2.5 py-1 rounded-md border font-medium ${shelter.facilities.womenChildrenArea ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
                👩‍👧 Women &amp; Children Safe Wing
              </span>
              <span className={`px-2.5 py-1 rounded-md border font-medium ${shelter.facilities.elderlySupport ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
                👵 Elderly Support Care
              </span>
              <span className={`px-2.5 py-1 rounded-md border font-medium ${shelter.facilities.wheelchairAccessible ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
                ♿ Wheelchair Accessible Ramp
              </span>
              <span className={`px-2.5 py-1 rounded-md border font-medium ${shelter.facilities.infantCare ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
                🍼 Infant / Baby Supplies
              </span>
              <span className={`px-2.5 py-1 rounded-md border font-medium ${shelter.facilities.petFriendly ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
                🐾 Pet Accommodation
              </span>
            </div>
          </div>

          {/* Notes / Field Intelligence */}
          {shelter.notes && (
            <div className="bg-blue-50/60 border border-blue-200 rounded-xl p-3.5 text-xs text-slate-800">
              <div className="font-bold text-blue-900 mb-1">Coordinator Field Briefing:</div>
              <p className="leading-relaxed">{shelter.notes}</p>
            </div>
          )}

          {/* Coordinator & Contact */}
          <div className="bg-white rounded-xl p-4 border border-slate-200 flex items-center justify-between">
            <div>
              <div className="text-[11px] text-slate-500 uppercase font-semibold">Shelter Coordinator</div>
              <div className="text-sm font-bold text-slate-900">{shelter.coordinatorName}</div>
              <div className="text-xs text-slate-600">{shelter.contactPhone}</div>
            </div>
            <a
              href={`tel:${shelter.contactPhone}`}
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors shadow-xs"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Call Now</span>
            </a>
          </div>

          {/* Admin Status Override Controls */}
          {(userRole === 'ADMIN' || userRole === 'SHELTER_COORDINATOR') && (
            <div className="bg-slate-100 p-4 rounded-xl border border-slate-300">
              <div className="text-xs font-bold text-slate-900 mb-2 flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-blue-600" />
                <span>Coordinator Status Override:</span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                <button
                  onClick={() => updateShelterStatus(shelter.id, 'AVAILABLE', true)}
                  className={`py-1.5 px-2 rounded-md text-xs font-bold border cursor-pointer ${
                    shelter.status === 'AVAILABLE' ? 'bg-emerald-600 text-white border-emerald-700' : 'bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  Available
                </button>
                <button
                  onClick={() => updateShelterStatus(shelter.id, 'LIMITED', true)}
                  className={`py-1.5 px-2 rounded-md text-xs font-bold border cursor-pointer ${
                    shelter.status === 'LIMITED' ? 'bg-amber-500 text-white border-amber-600' : 'bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  Limited
                </button>
                <button
                  onClick={() => updateShelterStatus(shelter.id, 'CRITICAL', true)}
                  className={`py-1.5 px-2 rounded-md text-xs font-bold border cursor-pointer ${
                    shelter.status === 'CRITICAL' ? 'bg-rose-600 text-white border-rose-700' : 'bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  Critical
                </button>
                <button
                  onClick={() => updateShelterStatus(shelter.id, 'INACTIVE', false)}
                  className={`py-1.5 px-2 rounded-md text-xs font-bold border cursor-pointer ${
                    shelter.status === 'INACTIVE' ? 'bg-slate-800 text-white border-slate-900' : 'bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  Close
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 bg-white border-t border-slate-200 p-4 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            
            <button
              id="drawer-register-btn"
              onClick={() => {
                onClose();
                onNavigateToIntake(shelter.id);
              }}
              className="flex items-center justify-center gap-2 bg-[#12304A] hover:bg-[#0B1F33] text-white py-3 px-4 rounded-xl text-xs font-bold tracking-wide shadow-md transition-colors cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Register Intake</span>
            </button>

            <a
              id="drawer-directions-btn"
              href={`https://www.google.com/maps/dir/?api=1&destination=${shelter.lat},${shelter.lng}&hl=en`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-xl text-xs font-bold tracking-wide shadow-md transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Directions ↗</span>
            </a>

          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              onClick={handleShare}
              className="text-xs text-slate-600 hover:text-slate-900 font-semibold flex items-center gap-1.5 py-1 px-2 rounded-md hover:bg-slate-100 cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5 text-slate-500" />
              <span>Share Location</span>
            </button>

            <button
              onClick={() => onOpenReportModal(shelter)}
              className="text-xs text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1.5 py-1 px-2 rounded-md hover:bg-rose-50 cursor-pointer"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Report Discrepancy</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
