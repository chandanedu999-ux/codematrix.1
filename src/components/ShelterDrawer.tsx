import React, { useState } from 'react';
import { Shelter } from '../types';
import { useResq } from '../context/ResqContext';
import { useRipple, triggerHaptic } from './Ripple';
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
  ShieldAlert,
  Navigation,
  BookmarkCheck,
  ArrowRight
} from 'lucide-react';

interface ShelterDrawerProps {
  shelter: Shelter | null;
  onClose: () => void;
  onNavigateToIntake: (shelterId: string) => void;
  onOpenReportModal: (shelter: Shelter) => void;
  onOpenBookSpotModal?: (shelter: Shelter) => void;
}

export const ShelterDrawer: React.FC<ShelterDrawerProps> = ({
  shelter,
  onClose,
  onNavigateToIntake,
  onOpenReportModal,
  onOpenBookSpotModal
}) => {
  const { userRole, updateShelterStatus, showToast } = useResq();
  const { createRipple, RippleElements } = useRipple();

  if (!shelter) return null;

  const availableBeds = Math.max(0, shelter.capacity - shelter.currentOccupancy);
  const isFull = availableBeds === 0 || shelter.status === 'CRITICAL' || shelter.status === 'OVERCAPACITY';

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(`${window.location.origin}/#shelter-${shelter.id}`);
      showToast(`Link to ${shelter.name} copied to clipboard`, 'success');
    }
  };

  const handleBookSpot = (e: React.MouseEvent) => {
    createRipple(e);
    triggerHaptic([50, 40, 90]);
    if (onOpenBookSpotModal) {
      onOpenBookSpotModal(shelter);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 overflow-hidden bg-slate-950/75 backdrop-blur-sm flex sm:justify-end items-end sm:items-stretch transition-opacity"
      role="dialog"
      aria-modal="true"
      aria-labelledby="shelter-drawer-title"
      style={{
        paddingBottom: 'env(safe-area-inset-bottom)'
      }}
    >
      {/* Click outside backdrop */}
      <div 
        className="absolute inset-0 -z-10" 
        onClick={onClose} 
        aria-hidden="true" 
      />

      {/* Responsive Sheet: Bottom Sheet on Mobile, Slide-over Drawer on Desktop */}
      <div 
        className="w-full sm:max-w-xl bg-[#F8FAFC] max-h-[92vh] sm:max-h-full sm:h-full rounded-t-3xl sm:rounded-none shadow-2xl flex flex-col overflow-y-auto animate-in slide-in-from-bottom sm:slide-in-from-right duration-200 border-t sm:border-t-0 sm:border-l border-slate-300"
      >
        {/* Mobile Swipe/Drag Pill Indicator */}
        <div className="sm:hidden w-full pt-3 pb-1 flex justify-center bg-[#0F172A] rounded-t-3xl">
          <div className="w-12 h-1.5 bg-slate-500 rounded-full" />
        </div>

        {/* Header - Deep Slate #0F172A */}
        <div className="sticky top-0 z-10 bg-[#0F172A] border-b border-slate-800 px-6 py-4 flex items-start justify-between gap-4 text-white">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              {!isFull ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-[#059669] text-[#FFFFFF] shadow-sm">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{availableBeds} BEDS LEFT / {shelter.capacity} TOTAL</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-[#DC2626] text-[#FFFFFF] shadow-sm">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>AT CAPACITY</span>
                </span>
              )}
              <span className="text-xs font-mono font-bold text-slate-300 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                {shelter.code}
              </span>
            </div>
            <h2 id="shelter-drawer-title" className="text-lg sm:text-xl font-black text-[#FFFFFF] leading-snug">
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
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Share shelter link"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <button
              id="shelter-drawer-close-btn"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Close shelter drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-5 flex-1">
          
          {/* PRIMARY CALL TO ACTION: CLAYMORPHIC BOOK SPOT BUTTON */}
          {onOpenBookSpotModal && !isFull && (
            <button
              id="drawer-book-spot-btn"
              onClick={handleBookSpot}
              className="clay-btn-emergency w-full py-4 px-6 rounded-2xl text-white font-black text-sm tracking-wide uppercase flex items-center justify-center gap-2 cursor-pointer shadow-xl relative overflow-hidden select-none"
            >
              {RippleElements}
              <BookmarkCheck className="w-5 h-5 text-white" />
              <span>Book Spot / Reserve Bed Now</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

          {/* SECTION 1: SEPARATE SECTION FOR BASIC REQUIREMENTS */}
          <div className="bg-[#FFFFFF] rounded-2xl p-5 border border-[#E2E8F0] shadow-xs">
            <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#0F172A] flex items-center gap-1.5">
                <Package className="w-4 h-4 text-[#059669]" />
                <span>Basic Requirements &amp; Live Stock</span>
              </h3>
              <span className="text-[10px] font-bold text-[#059669] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Verified On-Site
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
                <div className="flex items-center gap-2 text-[#475569] mb-1">
                  <Bed className="w-4 h-4 text-[#059669]" />
                  <span className="font-bold">Bed Allocations</span>
                </div>
                <div className="text-base font-extrabold text-[#0F172A]">
                  {shelter.resources.bedsAvailable} Beds Available
                </div>
                <div className="text-[10px] text-[#475569]">
                  Total capacity: {shelter.capacity}
                </div>
              </div>

              <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
                <div className="flex items-center gap-2 text-[#475569] mb-1">
                  <Droplets className="w-4 h-4 text-[#38BDF8]" />
                  <span className="font-bold">Clean Potable Water</span>
                </div>
                <div className="text-base font-extrabold text-[#0F172A]">
                  {(shelter.resources.waterLiters / 1000).toFixed(1)}k Liters
                </div>
                <div className="text-[10px] text-[#475569]">
                  Tankers &amp; UV Filtration
                </div>
              </div>

              <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
                <div className="flex items-center gap-2 text-[#475569] mb-1">
                  <Utensils className="w-4 h-4 text-amber-600" />
                  <span className="font-bold">Ration &amp; Food Kits</span>
                </div>
                <div className="text-base font-extrabold text-[#0F172A]">
                  {shelter.resources.rationKits} Prepared Kits
                </div>
                <div className="text-[10px] text-[#475569]">
                  Community hot kitchen active
                </div>
              </div>

              <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
                <div className="flex items-center gap-2 text-[#475569] mb-1">
                  <HeartPulse className="w-4 h-4 text-rose-600" />
                  <span className="font-bold">Medical &amp; First Aid</span>
                </div>
                <div className="text-base font-extrabold text-[#0F172A]">
                  {shelter.facilities.medicalAid ? 'Doctor On-Site' : 'First Aid Only'}
                </div>
                <div className="text-[10px] text-[#475569]">
                  {shelter.resources.medicalTeams} Medical Staff Assigned
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: VERIFIED SHELTER MANAGER DETAILS */}
          <div className="bg-[#FFFFFF] rounded-2xl p-5 border border-[#E2E8F0] shadow-xs">
            <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#0F172A] flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-blue-600" />
                <span>Person Managing Shelter</span>
              </h3>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#059669] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                <ShieldCheck className="w-3 h-3" />
                <span>Verified Authority</span>
              </span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-start justify-between">
                <span className="text-[#475569]">Coordinator Name:</span>
                <span className="font-bold text-[#0F172A]">{shelter.coordinatorName}</span>
              </div>
              <div className="flex items-start justify-between">
                <span className="text-[#475569]">Mobile Phone:</span>
                <span className="font-mono font-bold text-[#0F172A]">{shelter.coordinatorPhone}</span>
              </div>
              <div className="flex items-start justify-between">
                <span className="text-[#475569]">Manager Address:</span>
                <span className="font-medium text-[#0F172A] text-right max-w-[240px]">
                  {shelter.managerHomeAddress}
                </span>
              </div>
              {shelter.managerAadhaarVerified && (
                <div className="flex items-start justify-between pt-1 border-t border-slate-100">
                  <span className="text-[#475569]">Identity Card:</span>
                  <span className="text-emerald-700 font-bold flex items-center gap-1">
                    <Check className="w-3.5 h-3.5 text-[#059669]" />
                    <span>Aadhaar ({shelter.managerAadhaarMasked})</span>
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* SECTION 3: POLICE NOC & LEGAL VERIFICATION */}
          <div className="bg-[#FFFFFF] rounded-2xl p-5 border border-[#E2E8F0] shadow-xs">
            <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#0F172A] flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-emerald-600" />
                <span>Police Permission &amp; Jurisdiction</span>
              </h3>
              <span className="text-[10px] font-bold text-[#059669] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                NOC Valid
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-start justify-between">
                <span className="text-[#475569]">Police Station:</span>
                <span className="font-bold text-[#0F172A] text-right">{shelter.policeStation}</span>
              </div>
              <div className="flex items-start justify-between">
                <span className="text-[#475569]">NOC Number:</span>
                <span className="font-mono font-bold text-slate-800">{shelter.policeNocNumber}</span>
              </div>
            </div>
          </div>

        </div>

        {/* STICKY BOTTOM ACTION FOOTER */}
        <div className="sticky bottom-0 bg-[#FFFFFF] border-t border-[#E2E8F0] p-4 sm:p-5 space-y-2.5 shadow-lg">
          <div className="grid grid-cols-2 gap-2">
            
            {/* Direct Call Hotline */}
            <a
              id="drawer-call-hotline-btn"
              href={`tel:${shelter.contactPhone || shelter.coordinatorPhone}`}
              className="flex items-center justify-center gap-2 bg-[#0F172A] hover:bg-slate-800 text-[#FFFFFF] py-3 px-4 rounded-xl text-xs font-bold tracking-wide shadow-md transition-colors"
            >
              <Phone className="w-4 h-4" />
              <span>Call Hotline</span>
            </a>

            {/* Focus on In-App Map */}
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
            className="w-full flex items-center justify-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-700 py-3 px-3 rounded-xl text-xs font-bold transition-colors border border-blue-200 shadow-xs"
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
