import React, { useState } from 'react';
import { useResq } from '../context/ResqContext';
import { 
  X, 
  Sparkles, 
  Building, 
  MapPin, 
  Phone, 
  User, 
  Home, 
  Bed, 
  Droplets, 
  Utensils, 
  HeartPulse, 
  Zap, 
  ShieldAlert, 
  CheckCircle2 
} from 'lucide-react';

interface QuickAddCentreModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessSelect?: (shelterId: string) => void;
}

export const QuickAddCentreModal: React.FC<QuickAddCentreModalProps> = ({
  isOpen,
  onClose,
  onSuccessSelect
}) => {
  const { addShelter, showToast } = useResq();

  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [district, setDistrict] = useState('Gandhinagar');
  const [capacity, setCapacity] = useState(300);
  const [contactPhone, setContactPhone] = useState('+91 79 0000 0088 (Demo)');
  const [managerName, setManagerName] = useState('Demo Duty Coordinator');
  const [managerPhone, setManagerPhone] = useState('+91 90000 00088 (Demo)');
  const [managerHomeAddress, setManagerHomeAddress] = useState('Plot 21, Sector 11-A, Gandhinagar');

  // Basic Requirements initial states
  const [waterLiters, setWaterLiters] = useState(6000);
  const [rationKits, setRationKits] = useState(300);
  const [hasMedical, setHasMedical] = useState(true);
  const [hasPower, setHasPower] = useState(true);
  const [hasWomenSafeWing, setHasWomenSafeWing] = useState(true);

  if (!isOpen) return null;

  // Auto-fill sample demo data for quick review
  const handleAutoFillSample = () => {
    setName('Gandhinagar Sector 11 Community Relief Hall');
    setAddress('Near Mahatma Mandir Convention Center, Sector 11');
    setDistrict('Gandhinagar');
    setCapacity(350);
    setContactPhone('+91 79 0000 0088 (Demo)');
    setManagerName('Ketan Trivedi (Volunteer Lead)');
    setManagerPhone('+91 90000 00088 (Demo)');
    setManagerHomeAddress('B-14 Swagat Residency, Sector 11, Gandhinagar');
    setWaterLiters(8500);
    setRationKits(400);
    setHasMedical(true);
    setHasPower(true);
    setHasWomenSafeWing(true);
    showToast('Loaded sample demo centre data in 1 click.', 'info');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !address.trim()) {
      showToast('Please enter centre name and street address', 'error');
      return;
    }

    // Default coordinates around Gandhinagar center
    const lat = district === 'Ahmedabad' ? 23.03 + Math.random() * 0.05 : 23.21 + Math.random() * 0.04;
    const lng = district === 'Ahmedabad' ? 72.56 + Math.random() * 0.05 : 72.63 + Math.random() * 0.04;

    const newShelter = addShelter({
      name: name.trim(),
      address: address.trim(),
      district: district.trim(),
      lat,
      lng,
      capacity: Number(capacity) || 200,
      contactPhone: contactPhone.trim(),
      managerName: managerName.trim(),
      managerPhone: managerPhone.trim(),
      managerHomeAddress: managerHomeAddress.trim(),
      isDemoMode: true, // EXPLICIT DEMO: no Aadhaar, no police verification required
      facilities: {
        drinkingWater: true,
        foodRation: true,
        toilets: true,
        electricity: hasPower,
        medicalAid: hasMedical,
        chargingStation: true,
        wifi: true,
        petFriendly: true,
        wheelchairAccessible: true,
        infantCare: true,
        elderlySupport: true,
        womenChildrenArea: hasWomenSafeWing
      },
      resources: {
        bedsAvailable: Number(capacity) || 200,
        bedsRequired: Number(capacity) || 200,
        waterLiters: Number(waterLiters) || 6000,
        waterRequired: Number(capacity) * 20,
        rationKits: Number(rationKits) || 300,
        rationRequired: Number(capacity),
        medicalTeams: hasMedical ? 1 : 0,
        medicalTeamsRequired: 1
      }
    });

    if (onSuccessSelect) {
      onSuccessSelect(newShelter.id);
    }
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="quick-add-centre-title"
    >
      <div className="bg-[#FFFFFF] rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-[#E2E8F0] my-8 animate-in fade-in duration-200">
        
        {/* Header with Deep Slate #0F172A and badge */}
        <div className="flex items-start justify-between pb-4 border-b border-[#E2E8F0]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1 bg-amber-500 text-slate-950 text-[11px] font-black px-2 py-0.5 rounded uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                <span>DEMO ADD CENTRE</span>
              </span>
              <span className="text-[11px] font-bold text-[#059669] bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                NO AADHAAR / POLICE NOC REQUIRED
              </span>
            </div>
            <h2 id="quick-add-centre-title" className="text-xl sm:text-2xl font-black text-[#0F172A] tracking-tight">
              Add Relief Centre (Demo Mode)
            </h2>
            <p className="text-xs text-[#475569] mt-0.5">
              Instantly create a new relief centre for testing and rapid volunteer response on RESQTECH.
            </p>
          </div>

          <button
            id="quick-add-centre-close-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Close add centre modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Demo Mode Notice Callout */}
        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-900">
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-bold">Instant Activation Notice:</span> This separate section allows anyone to add and test relief centres without undergoing statutory Aadhaar OTP authentication or local Police permission checks.
          </div>
          <button
            type="button"
            onClick={handleAutoFillSample}
            className="shrink-0 text-xs font-extrabold text-[#0F172A] bg-amber-200 hover:bg-amber-300 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
          >
            Auto-Fill Sample
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          
          {/* Centre Identification */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label htmlFor="demo-centre-name" className="block text-xs font-bold text-[#0F172A] uppercase tracking-wider mb-1">
                Centre / Facility Name *
              </label>
              <div className="relative">
                <Building className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  id="demo-centre-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Sector 11 Community Relief Hall"
                  className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl pl-9 pr-3 py-2.5 text-xs sm:text-sm font-semibold text-[#0F172A] focus:border-[#0F172A] focus:ring-1 focus:ring-[#0F172A]"
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="demo-centre-address" className="block text-xs font-bold text-[#0F172A] uppercase tracking-wider mb-1">
                Location Address / Landmark *
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  id="demo-centre-address"
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. Near Mahatma Mandir, Sector 11, Gandhinagar"
                  className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl pl-9 pr-3 py-2.5 text-xs sm:text-sm font-semibold text-[#0F172A] focus:border-[#0F172A] focus:ring-1 focus:ring-[#0F172A]"
                />
              </div>
            </div>

            <div>
              <label htmlFor="demo-centre-district" className="block text-xs font-bold text-[#0F172A] uppercase tracking-wider mb-1">
                District / Region
              </label>
              <select
                id="demo-centre-district"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-xs sm:text-sm font-semibold text-[#0F172A] focus:border-[#0F172A]"
              >
                <option value="Gandhinagar">Gandhinagar</option>
                <option value="Ahmedabad">Ahmedabad</option>
                <option value="Gandhinagar / Ahmedabad Border">Gandhinagar / Ahmedabad Border</option>
              </select>
            </div>

            <div>
              <label htmlFor="demo-centre-capacity" className="block text-xs font-bold text-[#0F172A] uppercase tracking-wider mb-1">
                Total Bed Capacity (People) *
              </label>
              <div className="relative">
                <Bed className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  id="demo-centre-capacity"
                  type="number"
                  min="20"
                  max="5000"
                  required
                  value={capacity}
                  onChange={(e) => setCapacity(Number(e.target.value))}
                  className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl pl-9 pr-3 py-2.5 text-xs sm:text-sm font-semibold text-[#0F172A] focus:border-[#0F172A]"
                />
              </div>
            </div>
          </div>

          {/* Section: Person Managing Shelter (Demo Contact) */}
          <div className="p-3.5 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] space-y-3">
            <div className="text-xs font-bold text-[#0F172A] uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-[#38BDF8]" />
              <span>Person Managing Shelter (Demo Data)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="demo-manager-name" className="block text-[11px] font-bold text-[#475569] mb-1">
                  Manager Full Name
                </label>
                <input
                  id="demo-manager-name"
                  type="text"
                  value={managerName}
                  onChange={(e) => setManagerName(e.target.value)}
                  placeholder="e.g. Ketan Trivedi"
                  className="w-full bg-white border border-[#E2E8F0] rounded-lg px-3 py-2 text-xs font-semibold text-[#0F172A]"
                />
              </div>

              <div>
                <label htmlFor="demo-manager-phone" className="block text-[11px] font-bold text-[#475569] mb-1">
                  Manager Phone (Demo Number)
                </label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    id="demo-manager-phone"
                    type="text"
                    value={managerPhone}
                    onChange={(e) => setManagerPhone(e.target.value)}
                    placeholder="+91 90000 00088 (Demo)"
                    className="w-full bg-white border border-[#E2E8F0] rounded-lg pl-8 pr-3 py-2 text-xs font-mono font-semibold text-[#0F172A]"
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="demo-manager-address" className="block text-[11px] font-bold text-[#475569] mb-1">
                  Manager Home / Residential Address
                </label>
                <div className="relative">
                  <Home className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    id="demo-manager-address"
                    type="text"
                    value={managerHomeAddress}
                    onChange={(e) => setManagerHomeAddress(e.target.value)}
                    placeholder="e.g. Plot 21, Sector 11-A, Gandhinagar"
                    className="w-full bg-white border border-[#E2E8F0] rounded-lg pl-8 pr-3 py-2 text-xs font-semibold text-[#0F172A]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section: Basic Requirements in Shelter */}
          <div className="p-3.5 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] space-y-3">
            <div className="text-xs font-bold text-[#0F172A] uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Utensils className="w-3.5 h-3.5 text-amber-600" />
                <span>Basic Requirements &amp; Live Supplies</span>
              </span>
              <span className="text-[10px] text-[#059669] font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Supply Setup
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label htmlFor="demo-water-liters" className="block text-[11px] font-bold text-[#475569] mb-1 flex items-center gap-1">
                  <Droplets className="w-3 h-3 text-[#38BDF8]" />
                  <span>Clean Water Buffer (Liters)</span>
                </label>
                <input
                  id="demo-water-liters"
                  type="number"
                  value={waterLiters}
                  onChange={(e) => setWaterLiters(Number(e.target.value))}
                  className="w-full bg-white border border-[#E2E8F0] rounded-lg px-3 py-2 text-xs font-semibold text-[#0F172A]"
                />
              </div>

              <div>
                <label htmlFor="demo-ration-kits" className="block text-[11px] font-bold text-[#475569] mb-1 flex items-center gap-1">
                  <Utensils className="w-3 h-3 text-amber-600" />
                  <span>Food Ration Kits</span>
                </label>
                <input
                  id="demo-ration-kits"
                  type="number"
                  value={rationKits}
                  onChange={(e) => setRationKits(Number(e.target.value))}
                  className="w-full bg-white border border-[#E2E8F0] rounded-lg px-3 py-2 text-xs font-semibold text-[#0F172A]"
                />
              </div>
            </div>

            {/* Quick Feature Toggles */}
            <div className="grid grid-cols-3 gap-2 pt-1">
              <label className="flex items-center gap-2 p-2 bg-white rounded-lg border border-[#E2E8F0] cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={hasMedical}
                  onChange={(e) => setHasMedical(e.target.checked)}
                  className="rounded text-[#0F172A] focus:ring-[#0F172A]"
                />
                <span className="font-semibold text-[#0F172A]">Medical Aid</span>
              </label>

              <label className="flex items-center gap-2 p-2 bg-white rounded-lg border border-[#E2E8F0] cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={hasPower}
                  onChange={(e) => setHasPower(e.target.checked)}
                  className="rounded text-[#0F172A] focus:ring-[#0F172A]"
                />
                <span className="font-semibold text-[#0F172A]">Power / DG</span>
              </label>

              <label className="flex items-center gap-2 p-2 bg-white rounded-lg border border-[#E2E8F0] cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={hasWomenSafeWing}
                  onChange={(e) => setHasWomenSafeWing(e.target.checked)}
                  className="rounded text-[#0F172A] focus:ring-[#0F172A]"
                />
                <span className="font-semibold text-[#0F172A]">Safe Wing</span>
              </label>
            </div>
          </div>

          {/* Action Row */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-[#E2E8F0]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-bold text-[#475569] hover:text-[#0F172A] transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              id="demo-publish-centre-btn"
              type="submit"
              className="bg-[#0F172A] hover:bg-slate-800 text-[#FFFFFF] text-xs font-extrabold py-2.5 px-5 rounded-xl shadow-md transition-colors flex items-center gap-2 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4 text-[#38BDF8]" />
              <span>Publish Demo Centre to Network</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
