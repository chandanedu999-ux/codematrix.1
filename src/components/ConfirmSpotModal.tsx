import React, { useState } from 'react';
import { Shelter } from '../types';
import { useResq } from '../context/ResqContext';
import { useRipple, triggerHaptic } from './Ripple';
import { 
  X, 
  CheckCircle2, 
  ShieldCheck, 
  MapPin, 
  Users, 
  AlertTriangle, 
  Phone, 
  QrCode, 
  Download, 
  ArrowRight,
  HeartPulse,
  Baby,
  Accessibility,
  Check
} from 'lucide-react';

interface ConfirmSpotModalProps {
  shelter: Shelter | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmed?: (passData: any) => void;
}

export const ConfirmSpotModal: React.FC<ConfirmSpotModalProps> = ({
  shelter,
  isOpen,
  onClose,
  onConfirmed
}) => {
  const { showToast } = useResq();
  const { createRipple, RippleElements } = useRipple();

  const [partySize, setPartySize] = useState<number>(1);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [hasInfant, setHasInfant] = useState(false);
  const [hasMedical, setHasMedical] = useState(false);
  const [hasMobility, setHasMobility] = useState(false);
  const [hasPets, setHasPets] = useState(false);
  const [confirmedPass, setConfirmedPass] = useState<any | null>(null);

  if (!isOpen || !shelter) return null;

  const availableBeds = Math.max(0, shelter.capacity - shelter.currentOccupancy);

  const handleConfirmReservation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !phone.trim()) {
      showToast('Please enter your full name and emergency contact phone.', 'warning');
      return;
    }

    triggerHaptic([50, 40, 100]);

    const pass = {
      passId: `PASS-${shelter.code}-${Math.floor(1000 + Math.random() * 9000)}`,
      shelterId: shelter.id,
      shelterName: shelter.name,
      shelterAddress: shelter.address,
      shelterDistrict: shelter.district,
      shelterPhone: shelter.contactPhone || shelter.coordinatorPhone,
      fullName: fullName.trim(),
      phone: phone.trim(),
      partySize,
      specialNeeds: [
        hasInfant ? 'Infant in Party' : null,
        hasMedical ? 'Medical / Prescription Needs' : null,
        hasMobility ? 'Wheelchair / Mobility Access' : null,
        hasPets ? 'Companion Animal' : null
      ].filter(Boolean),
      timestamp: new Date().toISOString(),
      status: 'CONFIRMED'
    };

    // Store in localStorage for Profile View access
    try {
      const existing = localStorage.getItem('resqtech_saved_passes');
      const list = existing ? JSON.parse(existing) : [];
      list.unshift(pass);
      localStorage.setItem('resqtech_saved_passes', JSON.stringify(list));
      localStorage.setItem('resqtech_active_pass', JSON.stringify(pass));
    } catch (err) {
      console.error(err);
    }

    setConfirmedPass(pass);
    showToast(`Emergency spot confirmed at ${shelter.name}!`, 'success');
    if (onConfirmed) onConfirmed(pass);
  };

  const handlePrintOrDownload = () => {
    window.print();
  };

  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-spot-title"
    >
      <div 
        className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Modal Header */}
        <div className="bg-[#0F172A] text-white p-5 sm:p-6 flex items-start justify-between gap-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Critical Confirmation
              </span>
              <span className="text-xs font-mono font-bold text-slate-300">
                {shelter.code}
              </span>
            </div>
            <h2 id="confirm-spot-title" className="text-lg sm:text-xl font-black text-white leading-tight">
              {confirmedPass ? 'Emergency Shelter Pass' : `Confirm your spot at ${shelter.name}?`}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6">
          {!confirmedPass ? (
            /* Reservation Form */
            <form onSubmit={handleConfirmReservation} className="space-y-4">
              
              {/* Shelter Summary Card */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs font-bold text-[#0F172A] flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-blue-600" />
                    <span>{shelter.name}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5 ml-4">
                    {shelter.address}, {shelter.district}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-xs font-black text-[#059669]">
                    {availableBeds} Available
                  </div>
                  <div className="text-[10px] text-slate-400">
                    of {shelter.capacity} beds
                  </div>
                </div>
              </div>

              {/* Notice */}
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  Reserving a spot holds your bed intake allocation for <strong>2 hours</strong> to allow safe travel to the shelter corridor.
                </span>
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-[#0F172A] mb-1">
                  Full Name / Household Representative *
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Aarav Patel"
                  className="w-full px-4 py-3 text-sm rounded-xl border-2 border-slate-200 focus:border-[#0F172A] focus:outline-none transition-colors"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-[#0F172A] mb-1">
                  Emergency Phone Number *
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full px-4 py-3 text-sm rounded-xl border-2 border-slate-200 focus:border-[#0F172A] focus:outline-none transition-colors font-mono"
                />
              </div>

              {/* Party Size */}
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-[#0F172A] mb-1 flex items-center justify-between">
                  <span>Number of People Needing Shelter</span>
                  <span className="text-blue-600 font-bold">{partySize} {partySize === 1 ? 'Person' : 'People'}</span>
                </label>
                <div className="grid grid-cols-6 gap-2">
                  {[1, 2, 3, 4, 5, 6].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setPartySize(num)}
                      className={`py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                        partySize === num
                          ? 'bg-[#0F172A] text-white shadow-md'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              {/* Priority Access Needs */}
              <div>
                <span className="block text-xs font-black uppercase tracking-wider text-[#0F172A] mb-2">
                  Priority Care &amp; Accessibility (Select if applicable)
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <label className={`p-2.5 rounded-xl border flex items-center gap-2 cursor-pointer transition-colors ${
                    hasInfant ? 'bg-blue-50 border-blue-300 font-bold text-blue-950' : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}>
                    <input
                      type="checkbox"
                      checked={hasInfant}
                      onChange={(e) => setHasInfant(e.target.checked)}
                      className="rounded text-blue-600"
                    />
                    <Baby className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>Infant / Toddler</span>
                  </label>

                  <label className={`p-2.5 rounded-xl border flex items-center gap-2 cursor-pointer transition-colors ${
                    hasMedical ? 'bg-blue-50 border-blue-300 font-bold text-blue-950' : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}>
                    <input
                      type="checkbox"
                      checked={hasMedical}
                      onChange={(e) => setHasMedical(e.target.checked)}
                      className="rounded text-blue-600"
                    />
                    <HeartPulse className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>Medical / Rx</span>
                  </label>

                  <label className={`p-2.5 rounded-xl border flex items-center gap-2 cursor-pointer transition-colors ${
                    hasMobility ? 'bg-blue-50 border-blue-300 font-bold text-blue-950' : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}>
                    <input
                      type="checkbox"
                      checked={hasMobility}
                      onChange={(e) => setHasMobility(e.target.checked)}
                      className="rounded text-blue-600"
                    />
                    <Accessibility className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Wheelchair Access</span>
                  </label>

                  <label className={`p-2.5 rounded-xl border flex items-center gap-2 cursor-pointer transition-colors ${
                    hasPets ? 'bg-blue-50 border-blue-300 font-bold text-blue-950' : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}>
                    <input
                      type="checkbox"
                      checked={hasPets}
                      onChange={(e) => setHasPets(e.target.checked)}
                      className="rounded text-blue-600"
                    />
                    <span>Companion Pet</span>
                  </label>
                </div>
              </div>

              {/* Action Buttons: Cancel vs Claymorphic Confirm */}
              <div className="pt-3 border-t border-slate-100 flex items-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 px-4 rounded-2xl border-2 border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  onClick={(e) => createRipple(e)}
                  className="clay-btn-emergency flex-2 py-3.5 px-6 rounded-2xl text-white font-black text-xs tracking-wider uppercase flex items-center justify-center gap-2 cursor-pointer relative overflow-hidden"
                >
                  {RippleElements}
                  <span>Confirm Spot ({partySize})</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

            </form>
          ) : (
            /* Confirmed Pass Digital Ticket */
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50 rounded-2xl border-2 border-emerald-300 text-center">
                <div className="w-12 h-12 rounded-full bg-[#059669] text-white flex items-center justify-center mx-auto mb-2 shadow-md">
                  <Check className="w-6 h-6 stroke-[3]" />
                </div>
                <h3 className="text-base font-black text-emerald-950 uppercase tracking-wide">
                  Spot Confirmed &amp; Reserved
                </h3>
                <p className="text-xs text-emerald-800 mt-0.5">
                  Show this pass upon arrival for priority check-in at the shelter intake gate.
                </p>
              </div>

              {/* Digital Pass Card */}
              <div id="printable-intake-slip" className="bg-slate-900 text-white p-5 rounded-2xl shadow-xl border border-slate-800">
                <div className="flex items-start justify-between border-b border-slate-800 pb-3 mb-3">
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-[#38BDF8]">
                      OFFICIAL DISASTER RELIEF PASS
                    </div>
                    <div className="font-mono text-sm font-black text-white">
                      {confirmedPass.passId}
                    </div>
                  </div>
                  <div className="w-10 h-10 bg-white p-1 rounded-lg text-slate-950 flex items-center justify-center">
                    <QrCode className="w-8 h-8" />
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  <div>
                    <div className="text-[10px] text-slate-400">Shelter Location:</div>
                    <div className="font-bold text-white text-sm">{confirmedPass.shelterName}</div>
                    <div className="text-slate-300 text-[11px]">{confirmedPass.shelterAddress}</div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800">
                    <div>
                      <div className="text-[10px] text-slate-400">Reserved For:</div>
                      <div className="font-bold text-white">{confirmedPass.fullName}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400">Party Size:</div>
                      <div className="font-bold text-amber-300">{confirmedPass.partySize} {confirmedPass.partySize === 1 ? 'Person' : 'Members'}</div>
                    </div>
                  </div>

                  {confirmedPass.specialNeeds.length > 0 && (
                    <div className="pt-2 border-t border-slate-800">
                      <div className="text-[10px] text-slate-400">Special Accommodations:</div>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {confirmedPass.specialNeeds.map((need: string, i: number) => (
                          <span key={i} className="text-[10px] bg-slate-800 text-sky-300 px-2 py-0.5 rounded border border-slate-700">
                            {need}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="pt-2 border-t border-slate-800 text-[10px] text-slate-400 flex items-center justify-between">
                    <span>Saved Offline on Device</span>
                    <span className="font-mono">{new Date(confirmedPass.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={handlePrintOrDownload}
                  className="flex-1 py-3 px-4 rounded-xl border-2 border-slate-300 text-slate-800 font-bold text-xs hover:bg-slate-50 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Print / Save Pass</span>
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="clay-btn-primary flex-1 py-3 px-4 rounded-xl text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>Done</span>
                </button>
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
};
