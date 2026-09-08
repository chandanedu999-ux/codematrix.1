import React, { useState } from 'react';
import { useResq } from '../context/ResqContext';
import { NewShelterSubmission } from '../types';
import { 
  X, 
  Building2, 
  ShieldCheck, 
  FileCheck2, 
  Upload, 
  User, 
  Phone, 
  Home, 
  CheckCircle2, 
  AlertTriangle,
  Droplets,
  Package,
  Bed,
  HeartPulse,
  Zap,
  MapPin,
  Lock
} from 'lucide-react';

interface RegisterShelterModalProps {
  isOpen: boolean;
  onClose: () => void;
  userCoordinates: [number, number] | null;
}

export const RegisterShelterModal: React.FC<RegisterShelterModalProps> = ({
  isOpen,
  onClose,
  userCoordinates
}) => {
  const { addShelter, showToast } = useResq();

  // Registration Mode: 'DEMO' (bypasses Aadhaar & Police NOC) vs 'STATUTORY' (enforces both)
  const [mode, setMode] = useState<'DEMO' | 'STATUTORY'>('DEMO');

  // Form states
  const [shelterName, setShelterName] = useState('');
  const [address, setAddress] = useState('');
  const [district, setDistrict] = useState('Gandhinagar');
  const [lat, setLat] = useState<number>(userCoordinates ? userCoordinates[0] : 23.1541881);
  const [lng, setLng] = useState<number>(userCoordinates ? userCoordinates[1] : 72.6729164);
  const [capacity, setCapacity] = useState<number>(250);
  const [contactPhone, setContactPhone] = useState('+91 79 0000 0088 (Demo)');

  // Manager Details
  const [managerName, setManagerName] = useState('Demo Duty Coordinator');
  const [managerPhone, setManagerPhone] = useState('+91 90000 00088 (Demo)');
  const [managerHomeAddress, setManagerHomeAddress] = useState('Sector 11, Gandhinagar, Gujarat');

  // Aadhaar Verification State
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [isVerifyingAadhaar, setIsVerifyingAadhaar] = useState(false);
  const [aadhaarVerified, setAadhaarVerified] = useState(false);
  const [aadhaarOtp, setAadhaarOtp] = useState('');
  const [showAadhaarOtpInput, setShowAadhaarOtpInput] = useState(false);

  // Local Police Permission State
  const [policeStation, setPoliceStation] = useState('Infocity Police Station, Gandhinagar');
  const [policeNocNumber, setPoliceNocNumber] = useState('');
  const [policeDocName, setPoliceDocName] = useState<string | null>(null);
  const [policeDocVerified, setPoliceDocVerified] = useState(false);

  // Basic Requirements Initial Stock
  const [bedsAvailable, setBedsAvailable] = useState<number>(200);
  const [waterLiters, setWaterLiters] = useState<number>(8000);
  const [rationKits, setRationKits] = useState<number>(250);
  const [hasMedicalAid, setHasMedicalAid] = useState(true);
  const [hasElectricity, setHasElectricity] = useState(true);

  if (!isOpen) return null;

  const handleFillSample = () => {
    setShelterName('Gandhinagar Sector 11 Community Relief Hall');
    setAddress('Near Mahatma Mandir Convention Center, Sector 11, Gandhinagar');
    setDistrict('Gandhinagar');
    setCapacity(350);
    setContactPhone('+91 79 0000 0088 (Demo)');
    setManagerName('Ketan Trivedi (Volunteer Lead)');
    setManagerPhone('+91 90000 00088 (Demo)');
    setManagerHomeAddress('Plot 21, Sector 11-A, Gandhinagar, Gujarat');
    setBedsAvailable(300);
    setWaterLiters(8000);
    setRationKits(350);
    setHasMedicalAid(true);
    setHasElectricity(true);
    showToast('Loaded sample demo centre data.', 'info');
  };

  // Handle Aadhaar verification simulation
  const handleRequestAadhaarOtp = () => {
    const cleanNum = aadhaarNumber.replace(/\D/g, '');
    if (cleanNum.length !== 12) {
      showToast('Please enter a valid 12-digit Aadhaar number.', 'warning');
      return;
    }
    setIsVerifyingAadhaar(true);
    setTimeout(() => {
      setIsVerifyingAadhaar(false);
      setShowAadhaarOtpInput(true);
      showToast('Aadhaar OTP sent to mobile linked with UIDAI (Demo OTP: 4829).', 'info');
    }, 700);
  };

  const handleConfirmAadhaarOtp = () => {
    if (!aadhaarOtp || aadhaarOtp.trim().length < 4) {
      showToast('Please enter the 4-digit verification OTP (e.g. 4829).', 'warning');
      return;
    }
    setAadhaarVerified(true);
    setShowAadhaarOtpInput(false);
    showToast('Aadhaar verified successfully via UIDAI authentication.', 'success');
  };

  // Handle Police permission upload simulation
  const handlePoliceFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPoliceDocName(file.name);
      setPoliceDocVerified(true);
      showToast(`Police permission document "${file.name}" uploaded & validated.`, 'success');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!shelterName.trim()) {
      showToast('Please enter shelter name.', 'warning');
      return;
    }
    if (!address.trim()) {
      showToast('Please enter shelter address.', 'warning');
      return;
    }
    if (!managerName.trim()) {
      showToast('Please enter manager full name.', 'warning');
      return;
    }
    if (!managerPhone.trim()) {
      showToast('Please enter manager phone number.', 'warning');
      return;
    }
    if (!managerHomeAddress.trim()) {
      showToast('Please enter manager residential home address.', 'warning');
      return;
    }

    if (mode === 'STATUTORY') {
      if (!aadhaarVerified) {
        showToast('Mandatory Aadhaar verification required before registering shelter in Statutory Mode.', 'error');
        return;
      }
      if (!policeNocNumber.trim() || !policeDocVerified) {
        showToast('Mandatory Local Police Permission NOC & document upload required in Statutory Mode.', 'error');
        return;
      }
    }

    const isDemo = mode === 'DEMO';

    const submission: NewShelterSubmission = {
      name: shelterName,
      address,
      district,
      lat: Number(lat),
      lng: Number(lng),
      capacity: Number(capacity),
      contactPhone: contactPhone || managerPhone,
      managerName,
      managerPhone,
      managerHomeAddress,
      aadhaarNumber: isDemo ? 'DEMO' : aadhaarNumber,
      policeStation: isDemo ? 'Demo Station (No NOC Required)' : policeStation,
      policeNocNumber: isDemo ? 'DEMO-NOC-EXEMPT' : policeNocNumber,
      policeDocName: isDemo ? undefined : (policeDocName || 'Police_NOC_Document.pdf'),
      isDemoMode: isDemo,
      facilities: {
        drinkingWater: true,
        foodRation: true,
        toilets: true,
        electricity: hasElectricity,
        medicalAid: hasMedicalAid,
        chargingStation: true,
        wifi: false,
        petFriendly: false,
        wheelchairAccessible: true,
        infantCare: true,
        elderlySupport: true,
        womenChildrenArea: true
      },
      resources: {
        bedsAvailable: Number(bedsAvailable),
        bedsRequired: Number(capacity),
        waterLiters: Number(waterLiters),
        waterRequired: Number(capacity) * 25,
        rationKits: Number(rationKits),
        rationRequired: Number(capacity),
        medicalTeams: hasMedicalAid ? 1 : 0,
        medicalTeamsRequired: 1
      }
    };

    addShelter(submission);
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-3xl bg-[#F8FAFC] rounded-2xl shadow-2xl border border-[#E2E8F0] overflow-hidden my-6">
        
        {/* Header - Deep Slate #0F172A */}
        <div className="bg-[#0F172A] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg border border-emerald-500/30">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight text-[#FFFFFF]">Add &amp; Register Emergency Shelter</h2>
              <p className="text-xs text-slate-300">RESQTECH Community &amp; Institutional Shelter Onboarding</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="px-6 pt-4 pb-2 bg-[#FFFFFF] border-b border-[#E2E8F0] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex rounded-xl p-1 bg-[#F1F5F9] border border-[#E2E8F0] w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setMode('DEMO')}
              className={`flex-1 sm:flex-none px-4 py-2 text-xs font-black rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                mode === 'DEMO'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'text-[#475569] hover:text-[#0F172A]'
              }`}
            >
              <span>⚡ Demo Mode (No Verification)</span>
            </button>
            <button
              type="button"
              onClick={() => setMode('STATUTORY')}
              className={`flex-1 sm:flex-none px-4 py-2 text-xs font-black rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                mode === 'STATUTORY'
                  ? 'bg-[#0F172A] text-white shadow-xs'
                  : 'text-[#475569] hover:text-[#0F172A]'
              }`}
            >
              <span>🛡️ Statutory Verified (Aadhaar + Police NOC)</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleFillSample}
            className="text-xs font-bold text-[#0F172A] bg-amber-100 hover:bg-amber-200 border border-amber-300 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <span>⚡ Auto-Fill Sample Data</span>
          </button>
        </div>

        {/* Demo Mode Notice Banner */}
        {mode === 'DEMO' && (
          <div className="mx-6 mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between text-xs text-amber-900">
            <div className="flex items-center gap-2">
              <span className="font-black px-1.5 py-0.5 bg-amber-500 text-slate-950 rounded text-[10px]">DEMO ACTIVE</span>
              <span><strong>Aadhaar &amp; Police Verification Bypassed:</strong> Anyone can quickly add and test shelters on the map without document verification.</span>
            </div>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          
          {/* SECTION 1: Shelter Location & Details */}
          <div className="bg-[#FFFFFF] p-5 rounded-xl border border-[#E2E8F0]">
            <h3 className="text-sm font-bold text-[#0F172A] uppercase tracking-wider mb-3 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#38BDF8]" />
              <span>1. Shelter Centre Details</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                  Shelter Facility Name <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Raysan Community Hall / PDPU Indoor Sports Center"
                  value={shelterName}
                  onChange={(e) => setShelterName(e.target.value)}
                  className="w-full text-sm px-3.5 py-2.5 bg-[#FFFFFF] border-2 border-[#E2E8F0] rounded-lg focus:border-[#0F172A] focus:outline-none text-[#0F172A]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                  Complete Facility Street Address <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Near PDPU Knowledge Corridor, Raysan, Gandhinagar"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full text-sm px-3.5 py-2.5 bg-[#FFFFFF] border-2 border-[#E2E8F0] rounded-lg focus:border-[#0F172A] focus:outline-none text-[#0F172A]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                  District / Zone <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="w-full text-sm px-3.5 py-2.5 bg-[#FFFFFF] border-2 border-[#E2E8F0] rounded-lg focus:border-[#0F172A] focus:outline-none text-[#0F172A]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                  Total Shelter Capacity (Persons) <span className="text-rose-600">*</span>
                </label>
                <input
                  type="number"
                  required
                  min={20}
                  max={5000}
                  value={capacity}
                  onChange={(e) => setCapacity(Number(e.target.value))}
                  className="w-full text-sm px-3.5 py-2.5 bg-[#FFFFFF] border-2 border-[#E2E8F0] rounded-lg focus:border-[#0F172A] focus:outline-none text-[#0F172A]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                  Facility Contact / Emergency Hotline
                </label>
                <input
                  type="tel"
                  placeholder="+91 79 2327 5000"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  className="w-full text-sm px-3.5 py-2.5 bg-[#FFFFFF] border-2 border-[#E2E8F0] rounded-lg focus:border-[#0F172A] focus:outline-none text-[#0F172A]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                  GPS Coordinates (Latitude, Longitude)
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    step="0.000001"
                    value={lat}
                    onChange={(e) => setLat(Number(e.target.value))}
                    className="w-1/2 text-xs px-2.5 py-2.5 bg-[#FFFFFF] border-2 border-[#E2E8F0] rounded-lg text-[#0F172A]"
                    placeholder="Lat"
                  />
                  <input
                    type="number"
                    step="0.000001"
                    value={lng}
                    onChange={(e) => setLng(Number(e.target.value))}
                    className="w-1/2 text-xs px-2.5 py-2.5 bg-[#FFFFFF] border-2 border-[#E2E8F0] rounded-lg text-[#0F172A]"
                    placeholder="Lng"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: Person Managing Shelter (With Residential Address & Aadhaar) */}
          <div className="bg-[#FFFFFF] p-5 rounded-xl border border-[#E2E8F0]">
            <h3 className="text-sm font-bold text-[#0F172A] uppercase tracking-wider mb-3 flex items-center gap-2">
              <User className="w-4 h-4 text-[#38BDF8]" />
              <span>2. Shelter Manager Profile & Residential Verification</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                  Manager Full Name <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Chandra Sharma"
                  value={managerName}
                  onChange={(e) => setManagerName(e.target.value)}
                  className="w-full text-sm px-3.5 py-2.5 bg-[#FFFFFF] border-2 border-[#E2E8F0] rounded-lg focus:border-[#0F172A] focus:outline-none text-[#0F172A]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                  Manager Mobile Phone Number <span className="text-rose-600">*</span>
                </label>
                <input
                  type="tel"
                  required
                  placeholder="+91 98251 00000"
                  value={managerPhone}
                  onChange={(e) => setManagerPhone(e.target.value)}
                  className="w-full text-sm px-3.5 py-2.5 bg-[#FFFFFF] border-2 border-[#E2E8F0] rounded-lg focus:border-[#0F172A] focus:outline-none text-[#0F172A]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                  Manager Residential / Home Address <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Plot 142/2, Sector 2-B, Gandhinagar, Gujarat 382002"
                  value={managerHomeAddress}
                  onChange={(e) => setManagerHomeAddress(e.target.value)}
                  className="w-full text-sm px-3.5 py-2.5 bg-[#FFFFFF] border-2 border-[#E2E8F0] rounded-lg focus:border-[#0F172A] focus:outline-none text-[#0F172A]"
                />
                <p className="text-[11px] text-[#475569] mt-1">
                  Must be the permanent residential address for emergency verification & public record.
                </p>
              </div>
            </div>

            {/* Aadhaar Verification Box */}
            <div className="mt-3 p-4 bg-slate-50 rounded-xl border-2 border-[#E2E8F0]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-[#0F172A] flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#059669]" />
                  <span>UIDAI Aadhaar Verification {mode === 'DEMO' && '(Optional in Demo)'}</span>
                </span>
                {mode === 'DEMO' ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                    Bypassed for Demo
                  </span>
                ) : aadhaarVerified ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#059669] text-[#FFFFFF]">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Aadhaar Authenticated</span>
                  </span>
                ) : (
                  <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    Compulsory
                  </span>
                )}
              </div>

              {mode === 'DEMO' ? (
                <div className="text-xs text-[#475569] bg-white p-3 rounded-lg border border-[#E2E8F0] flex items-center justify-between">
                  <span>Demo quick-register bypasses biometric/OTP checks. You can proceed directly to create this centre.</span>
                  <button
                    type="button"
                    onClick={() => {
                      setAadhaarNumber('9999 8888 7777');
                      setAadhaarVerified(true);
                      showToast('Demo Aadhaar attached.', 'info');
                    }}
                    className="text-xs font-bold text-[#0F172A] bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded cursor-pointer"
                  >
                    Attach Demo UID
                  </button>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div className="sm:col-span-2">
                      <input
                        type="text"
                        maxLength={14}
                        disabled={aadhaarVerified}
                        placeholder="Enter 12-digit Aadhaar Number"
                        value={aadhaarNumber}
                        onChange={(e) => setAadhaarNumber(e.target.value)}
                        className="w-full text-sm px-3.5 py-2 bg-[#FFFFFF] border-2 border-[#E2E8F0] rounded-lg text-[#0F172A] font-mono"
                      />
                    </div>
                    <div>
                      {!aadhaarVerified && !showAadhaarOtpInput && (
                        <button
                          type="button"
                          onClick={handleRequestAadhaarOtp}
                          disabled={isVerifyingAadhaar || aadhaarNumber.replace(/\D/g, '').length !== 12}
                          className="w-full bg-[#0F172A] hover:bg-slate-800 disabled:bg-slate-300 text-white text-xs font-bold py-2.5 px-3 rounded-lg transition-colors cursor-pointer"
                        >
                          {isVerifyingAadhaar ? 'Verifying...' : 'Verify Aadhaar'}
                        </button>
                      )}
                      {aadhaarVerified && (
                        <div className="text-xs font-bold text-[#059669] flex items-center h-full gap-1">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>UID Verified: XXXX-XXXX-{aadhaarNumber.slice(-4) || '3819'}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {showAadhaarOtpInput && !aadhaarVerified && (
                    <div className="mt-3 pt-3 border-t border-slate-200 flex items-center gap-2">
                      <input
                        type="text"
                        maxLength={6}
                        placeholder="Enter OTP (Use: 4829)"
                        value={aadhaarOtp}
                        onChange={(e) => setAadhaarOtp(e.target.value)}
                        className="w-48 text-sm px-3 py-1.5 bg-[#FFFFFF] border-2 border-[#0F172A] rounded-lg font-mono text-center"
                      />
                      <button
                        type="button"
                        onClick={handleConfirmAadhaarOtp}
                        className="bg-[#059669] hover:bg-emerald-700 text-white text-xs font-bold py-2 px-4 rounded-lg cursor-pointer"
                      >
                        Confirm OTP
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* SECTION 3: Police Permission & NOC */}
          <div className="bg-[#FFFFFF] p-5 rounded-xl border border-[#E2E8F0]">
            <h3 className="text-sm font-bold text-[#0F172A] uppercase tracking-wider mb-3 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <FileCheck2 className="w-4 h-4 text-[#38BDF8]" />
                <span>3. Local Police Station Permission</span>
              </span>
              {mode === 'DEMO' && (
                <span className="text-[11px] font-bold text-amber-900 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-full">
                  Exempted in Demo
                </span>
              )}
            </h3>

            {mode === 'DEMO' ? (
              <div className="text-xs text-[#475569] bg-slate-50 p-3.5 rounded-xl border border-[#E2E8F0] space-y-2">
                <div className="flex items-center gap-2 text-emerald-800 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Police NOC &amp; verification document checks are bypassed for quick testing.</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  This shelter will be flagged as a rapid community addition and appear instantly on the live network map.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                    Jurisdiction Police Station <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Infocity Police Station, Gandhinagar"
                    value={policeStation}
                    onChange={(e) => setPoliceStation(e.target.value)}
                    className="w-full text-sm px-3.5 py-2.5 bg-[#FFFFFF] border-2 border-[#E2E8F0] rounded-lg focus:border-[#0F172A] focus:outline-none text-[#0F172A]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                    Police Permission / NOC Number <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. GJ/POL/NOC-2026/8941"
                    value={policeNocNumber}
                    onChange={(e) => setPoliceNocNumber(e.target.value)}
                    className="w-full text-sm px-3.5 py-2.5 bg-[#FFFFFF] border-2 border-[#E2E8F0] rounded-lg focus:border-[#0F172A] focus:outline-none text-[#0F172A] font-mono"
                  />
                </div>

                {/* Upload File */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                    Upload Signed Police Permission / NOC Certificate <span className="text-rose-600">*</span>
                  </label>
                  <div className="border-2 border-dashed border-[#E2E8F0] rounded-xl p-4 text-center bg-[#F8FAFC] hover:bg-slate-50 transition-colors">
                    <input
                      type="file"
                      id="police-noc-file"
                      accept=".pdf,.png,.jpg,.jpeg"
                      onChange={handlePoliceFileUpload}
                      className="hidden"
                    />
                    <label htmlFor="police-noc-file" className="cursor-pointer flex flex-col items-center gap-1.5">
                      <Upload className="w-6 h-6 text-[#475569]" />
                      <span className="text-xs font-bold text-[#0F172A]">
                        {policeDocName ? `Uploaded: ${policeDocName}` : 'Click or Drag Police NOC / Permission File'}
                      </span>
                      <span className="text-[11px] text-[#475569]">Supports PDF, JPG, PNG up to 10MB</span>
                    </label>
                  </div>
                  {policeDocVerified && (
                    <div className="mt-2 text-xs font-bold text-[#059669] flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Verified Police NOC document attached. Verified by local jurisdiction.</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* SECTION 4: Basic Requirements & Supplies Initial Stock */}
          <div className="bg-[#FFFFFF] p-5 rounded-xl border border-[#E2E8F0]">
            <h3 className="text-sm font-bold text-[#0F172A] uppercase tracking-wider mb-3 flex items-center gap-2">
              <Package className="w-4 h-4 text-[#38BDF8]" />
              <span>4. Initial Basic Requirements &amp; Inventory</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                  Beds Ready
                </label>
                <input
                  type="number"
                  min={0}
                  value={bedsAvailable}
                  onChange={(e) => setBedsAvailable(Number(e.target.value))}
                  className="w-full text-sm px-3 py-2 bg-[#FFFFFF] border-2 border-[#E2E8F0] rounded-lg text-[#0F172A]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                  Clean Drinking Water (Liters)
                </label>
                <input
                  type="number"
                  min={0}
                  value={waterLiters}
                  onChange={(e) => setWaterLiters(Number(e.target.value))}
                  className="w-full text-sm px-3 py-2 bg-[#FFFFFF] border-2 border-[#E2E8F0] rounded-lg text-[#0F172A]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                  Ration Kits Ready
                </label>
                <input
                  type="number"
                  min={0}
                  value={rationKits}
                  onChange={(e) => setRationKits(Number(e.target.value))}
                  className="w-full text-sm px-3 py-2 bg-[#FFFFFF] border-2 border-[#E2E8F0] rounded-lg text-[#0F172A]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 pt-3 border-t border-slate-100">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-[#0F172A]">
                <input
                  type="checkbox"
                  checked={hasMedicalAid}
                  onChange={(e) => setHasMedicalAid(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-[#059669] focus:ring-0"
                />
                <span>On-Site Medical Aid / Doctor Unit Available</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-[#0F172A]">
                <input
                  type="checkbox"
                  checked={hasElectricity}
                  onChange={(e) => setHasElectricity(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-[#059669] focus:ring-0"
                />
                <span>Backup Generator &amp; Continuous Electricity</span>
              </label>
            </div>
          </div>

          {/* Dynamic Action Footer */}
          <div className="pt-2">
            {mode === 'DEMO' ? (
              <button
                type="submit"
                id="submit-demo-shelter-btn"
                className="w-full bg-[#0F172A] hover:bg-slate-800 text-[#FFFFFF] text-sm font-black py-3.5 px-4 rounded-xl shadow-lg transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-5 h-5 text-amber-400" />
                <span>⚡ ACTIVATE DEMO RELIEF CENTRE (INSTANT)</span>
              </button>
            ) : (
              <>
                <button
                  type="submit"
                  disabled={!aadhaarVerified || !policeDocVerified}
                  className="w-full bg-[#EA580C] hover:bg-orange-700 disabled:bg-slate-300 text-[#FFFFFF] text-sm font-bold py-3.5 px-4 rounded-xl shadow-lg transition-colors cursor-pointer flex items-center justify-center gap-2"
                >
                  <ShieldCheck className="w-5 h-5" />
                  <span>SUBMIT &amp; ACTIVATE VERIFIED SHELTER</span>
                </button>
                {(!aadhaarVerified || !policeDocVerified) && (
                  <p className="text-center text-xs text-[#DC2626] font-semibold mt-2">
                    * In Statutory Mode, both Aadhaar UID authentication and Signed Police Permission upload are strictly compulsory.
                  </p>
                )}
              </>
            )}
          </div>

        </form>
      </div>
    </div>
  );
};
