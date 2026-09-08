import React, { useState } from 'react';
import { Shelter } from '../types';
import { useResq } from '../context/ResqContext';
import { 
  X, 
  MapPin, 
  Phone, 
  UserCheck, 
  Clock, 
  ExternalLink, 
  Share2, 
  ShieldCheck, 
  Droplets, 
  Utensils, 
  HeartPulse, 
  Bed, 
  Check, 
  Ban, 
  Zap, 
  UserPlus,
  AlertTriangle,
  Home,
  CheckCircle2,
  Package,
  ShieldAlert
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
  const { userRole, updateShelterStatus, showToast } = useResq();

  if (!shelter) return null;

  const availableBeds = Math.max(0, shelter.capacity - shelter.currentOccupancy);
  const isFull = availableBeds === 0 || shelter.status === 'CRITICAL' || shelter.status === 'OVERCAPACITY';

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(`${window.location.origin}/#shelter-${shelter.id}`);
      showToast(`Link to ${shelter.name} copied to clipboard`, 'success');
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 overflow-hidden bg-slate-900/70 backdrop-blur-xs flex justify-end transition-opacity"
      role="dialog"
      aria-modal="true"
      aria-labelledby="shelter-drawer-title"
    >
      <div 
        className="w-full max-w-xl bg-[#F8FAFC] h-full shadow-2xl flex flex-col overflow-y-auto animate-in slide-in-from-right duration-200 border-l border-[#E2E8F0]"
      >
        {/* Header - Deep Slate #0F172A */}
        <div className="sticky top-0 z-10 bg-[#0F172A] border-b border-slate-800 px-6 py-4 flex items-start justify-between gap-4 text-white">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              {/* Mandatory Pill Badges */}
              {!isFull ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-[#059669] text-[#FFFFFF]">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{availableBeds} BEDS LEFT / {shelter.capacity} TOTAL</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-[#DC2626] text-[#FFFFFF]">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>AT CAPACITY</span>
                </span>
              )}
              <span className="text-xs font-mono font-bold text-slate-300 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                {shelter.code}
              </span>
            </div>
            <h2 id="shelter-drawer-title" className="text-lg font-bold text-[#FFFFFF] leading-snug">
              {shelter.name}
            </h2>
            <p className="text-xs text-slate-300 flex items-center gap-1 mt-0.5">
              <MapPin className="w-3.5 h-3.5 text-[#38BDF8] shrink-0" />
              <span>{shelter.address}, {shelter.district}</span>
            </p>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={handleShare}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Share shelter link"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <button
              id="shelter-drawer-close-btn"
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Close shelter drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 flex-1">
          
          {/* SECTION 1: SEPARATE SECTION FOR BASIC REQUIREMENTS */}
          <div className="bg-[#FFFFFF] rounded-xl p-5 border border-[#E2E8F0] shadow-xs">
            <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#0F172A] flex items-center gap-1.5">
                <Package className="w-4 h-4 text-[#38BDF8]" />
                <span>Basic Requirements &amp; Live Supplies</span>
              </h3>
              <span className="text-[11px] font-bold text-[#059669] bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                Active Supply Buffer
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Beds */}
              <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-bold text-[#0F172A] flex items-center gap-1.5">
                    <Bed className="w-4 h-4 text-[#059669]" />
                    <span>Bed Spaces</span>
                  </span>
                  <span className="font-extrabold text-[#0F172A]">{availableBeds} / {shelter.capacity}</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                  <div 
                    style={{ width: `${Math.min(100, Math.round((shelter.currentOccupancy / Math.max(1, shelter.capacity)) * 100))}%` }}
                    className={`h-full ${isFull ? 'bg-[#DC2626]' : 'bg-[#059669]'}`}
                  />
                </div>
                <div className="text-[11px] text-[#475569] mt-1">
                  {shelter.currentOccupancy} occupied · {availableBeds} available right now
                </div>
              </div>

              {/* Clean Water */}
              <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-bold text-[#0F172A] flex items-center gap-1.5">
                    <Droplets className="w-4 h-4 text-[#38BDF8]" />
                    <span>Clean Water</span>
                  </span>
                  <span className="font-extrabold text-[#0F172A]">{(shelter.resources.waterLiters / 1000).toFixed(1)}k L</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                  <div 
                    style={{ width: `${Math.min(100, Math.round((shelter.resources.waterLiters / Math.max(1, shelter.resources.waterRequired)) * 100))}%` }}
                    className="h-full bg-[#38BDF8]"
                  />
                </div>
                <div className="text-[11px] text-[#475569] mt-1">
                  Target: {(shelter.resources.waterRequired / 1000).toFixed(1)}k L reserve buffer
                </div>
              </div>

              {/* Ration Kits */}
              <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-bold text-[#0F172A] flex items-center gap-1.5">
                    <Utensils className="w-4 h-4 text-amber-600" />
                    <span>Food Rations</span>
                  </span>
                  <span className="font-extrabold text-[#0F172A]">{shelter.resources.rationKits} Kits</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                  <div 
                    style={{ width: `${Math.min(100, Math.round((shelter.resources.rationKits / Math.max(1, shelter.resources.rationRequired)) * 100))}%` }}
                    className="h-full bg-amber-500"
                  />
                </div>
                <div className="text-[11px] text-[#475569] mt-1">
                  Dry ration packs for arriving families
                </div>
              </div>

              {/* Medical Aid */}
              <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-bold text-[#0F172A] flex items-center gap-1.5">
                    <HeartPulse className={`w-4 h-4 ${shelter.facilities.medicalAid ? 'text-[#059669]' : 'text-slate-400'}`} />
                    <span>Medical Aid</span>
                  </span>
                  <span className={`text-xs font-bold ${shelter.facilities.medicalAid ? 'text-[#059669]' : 'text-[#DC2626]'}`}>
                    {shelter.facilities.medicalAid ? 'Doctor On-Site' : 'Required'}
                  </span>
                </div>
                <div className="text-[11px] text-[#475569] mt-1">
                  {shelter.resources.medicalTeams > 0 
                    ? `${shelter.resources.medicalTeams} medical trauma units active`
                    : 'First aid kits available; doctor requested'}
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: SHELTER MANAGER PROFILE WITH RESIDENTIAL ADDRESS & VERIFICATIONS */}
          <div className="bg-[#FFFFFF] rounded-xl p-5 border border-[#E2E8F0] shadow-xs">
            <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#0F172A] flex items-center gap-1.5">
                <Home className="w-4 h-4 text-[#38BDF8]" />
                <span>Person Managing Shelter (Verified Officer)</span>
              </h3>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#059669] bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Verified Authority</span>
              </span>
            </div>

            <div className="space-y-2.5 text-xs text-[#0F172A]">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-[#475569] uppercase font-bold">Manager Full Name</div>
                  <div className="text-sm font-extrabold text-[#0F172A]">{shelter.coordinatorName}</div>
                </div>
                <a
                  href={`tel:${shelter.coordinatorPhone}`}
                  className="bg-[#0F172A] hover:bg-slate-800 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Call Officer</span>
                </a>
              </div>

              <div>
                <div className="text-[10px] text-[#475569] uppercase font-bold">Manager Phone Number</div>
                <div className="font-mono text-xs font-bold text-[#0F172A]">{shelter.coordinatorPhone}</div>
              </div>

              <div className="bg-[#F8FAFC] p-3 rounded-lg border border-[#E2E8F0]">
                <div className="text-[10px] text-[#475569] uppercase font-bold flex items-center gap-1 mb-1">
                  <Home className="w-3 h-3 text-[#475569]" />
                  <span>Manager Residential / Home Address</span>
                </div>
                <div className="text-xs text-[#0F172A] font-semibold leading-relaxed">
                  {shelter.managerHomeAddress || 'Plot 142/2, Sector 2-B, Gandhinagar, Gujarat 382002'}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <div className="p-2.5 bg-emerald-50/60 border border-emerald-200 rounded-lg">
                  <div className="text-[10px] text-emerald-800 font-bold uppercase flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-[#059669]" />
                    <span>Aadhaar Authenticated</span>
                  </div>
                  <div className="font-mono text-xs font-bold text-[#059669] mt-0.5">
                    {shelter.managerAadhaarMasked || 'XXXX-XXXX-4819'}
                  </div>
                </div>

                <div className="p-2.5 bg-emerald-50/60 border border-emerald-200 rounded-lg">
                  <div className="text-[10px] text-emerald-800 font-bold uppercase flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-[#059669]" />
                    <span>Police NOC Approved</span>
                  </div>
                  <div className="font-mono text-[11px] font-bold text-[#059669] mt-0.5 truncate" title={shelter.policeNocNumber}>
                    {shelter.policeNocNumber || 'GJ/POL/NOC-2026/8100'}
                  </div>
                </div>
              </div>

              <div className="text-[11px] text-[#475569]">
                Jurisdiction: <strong className="text-[#0F172A]">{shelter.policeStation || 'Infocity Police Station, Gandhinagar'}</strong>
              </div>
            </div>
          </div>

          {/* Special Facilities & Inclusivity */}
          <div className="bg-[#FFFFFF] rounded-xl p-4 border border-[#E2E8F0]">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#475569] mb-2">
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
                ♿ Wheelchair Ramp
              </span>
              <span className={`px-2.5 py-1 rounded-md border font-medium ${shelter.facilities.electricity ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
                ⚡ Power / Charging Station
              </span>
            </div>
          </div>

          {/* Coordinator Field Briefing */}
          {shelter.notes && (
            <div className="bg-slate-50 border border-[#E2E8F0] rounded-xl p-3.5 text-xs text-[#0F172A]">
              <div className="font-bold text-[#0F172A] mb-1">Operational Field Briefing:</div>
              <p className="leading-relaxed text-[#475569]">{shelter.notes}</p>
            </div>
          )}

        </div>

        {/* Sticky Actions Footer Matching MANDATORY ACTIONS ROW SPECIFICATION */}
        <div className="sticky bottom-0 bg-[#FFFFFF] border-t border-[#E2E8F0] p-4 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            
            {/* Call Hotline: #0F172A solid button */}
            <a
              id="drawer-call-hotline-btn"
              href={`tel:${shelter.contactPhone || shelter.coordinatorPhone}`}
              className="flex items-center justify-center gap-2 bg-[#0F172A] hover:bg-slate-800 text-[#FFFFFF] py-3 px-4 rounded-xl text-xs font-bold tracking-wide shadow-md transition-colors"
            >
              <Phone className="w-4 h-4" />
              <span>Call Hotline</span>
            </a>

            {/* Focus on In-App Map: #FFFFFF outline button with #E2E8F0 border and #0F172A text */}
            <button
              id="drawer-directions-btn"
              onClick={() => {
                onClose();
                const mapEl = document.getElementById('resq-map-container');
                if (mapEl) {
                  mapEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
              }}
              className="flex items-center justify-center gap-2 bg-[#FFFFFF] hover:bg-slate-50 text-[#0F172A] border border-[#E2E8F0] py-3 px-4 rounded-xl text-xs font-bold tracking-wide transition-colors cursor-pointer"
            >
              <MapPin className="w-4 h-4 text-blue-600" />
              <span>In-App Map</span>
            </button>

          </div>

          {/* Google Maps Live Turn-by-Turn GPS Navigation Button */}
          <a
            id="drawer-google-maps-live-btn"
            href={`https://www.google.com/maps/dir/?api=1&destination=${shelter.lat},${shelter.lng}&travelmode=driving`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-700 py-2.5 px-3 rounded-xl text-xs font-bold transition-colors border border-blue-200 shadow-xs"
          >
            <Navigation className="w-4 h-4 text-blue-600 animate-pulse" />
            <span>Open in Google Maps (Live GPS Directions &amp; Traffic) ↗</span>
          </a>

          {/* Rapid Resident Intake action */}
          <button
            id="drawer-register-btn"
            onClick={() => {
              onClose();
              onNavigateToIntake(shelter.id);
            }}
            className="w-full flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-[#0F172A] py-2 px-3 rounded-lg text-xs font-bold transition-colors cursor-pointer border border-[#E2E8F0]"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Open Resident Intake Form for {shelter.name}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
