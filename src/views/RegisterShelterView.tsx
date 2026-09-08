import React, { useState } from 'react';
import { useResq } from '../context/ResqContext';
import { NewShelterSubmission, Shelter } from '../types';
import { 
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
  ArrowLeft,
  Lock,
  Sparkles
} from 'lucide-react';

interface RegisterShelterViewProps {
  onBack: () => void;
  onRegistered: (shelter: Shelter) => void;
  initialCoordinates?: [number, number] | null;
}

export const RegisterShelterView: React.FC<RegisterShelterViewProps> = ({
  onBack,
  onRegistered,
  initialCoordinates
}) => {
  const { addShelter, showToast } = useResq();

  // Mode: 'DEMO' (instant quick registration) vs 'STATUTORY' (enforces Aadhaar + Police NOC)
  const [mode, setMode] = useState<'DEMO' | 'STATUTORY'>('DEMO');

  // Form states - Facility Details
  const [shelterName, setShelterName] = useState('');
  const [address, setAddress] = useState('');
  const [district, setDistrict] = useState('Gandhinagar');
  const [lat, setLat] = useState<number>(initialCoordinates ? initialCoordinates[0] : 23.1542);
  const [lng, setLng] = useState<number>(initialCoordinates ? initialCoordinates[1] : 72.6729);
  const [capacity, setCapacity] = useState<number>(250);
  const [contactPhone, setContactPhone] = useState('+91 79 0000 0088');

  // Manager Details
  const [managerName, setManagerName] = useState('');
  const [managerPhone, setManagerPhone] = useState('+91 90000 00088');
  const [managerHomeAddress, setManagerHomeAddress] = useState('');

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

  // Autofill demo data helper
  const handleFillDemoData = () => {
    setShelterName('Sector 12 Community Relief Centre');
    setAddress('Near Civil Hospital Complex, Sector 12, Gandhinagar');
    setDistrict('Gandhinagar');
    setCapacity(300);
    setContactPhone('+91 79 0000 0092');
    setManagerName('Rajesh Patel (Lead Coordinator)');
    setManagerPhone('+91 90000 00092');
    setManagerHomeAddress('Quarter 44/A, Sector 12, Gandhinagar, Gujarat');
    setBedsAvailable(260);
    setWaterLiters(10000);
    setRationKits(300);
    setHasMedicalAid(true);
    setHasElectricity(true);
    setPoliceStation('Sector 12 Police Chowki, Gandhinagar');
    setPoliceNocNumber('GJ/GN/NOC-2026/4102');
    setPoliceDocVerified(true);
    setPoliceDocName('Police_Permission_Signed.pdf');
    setAadhaarNumber('9999 8888 7777');
    setAadhaarVerified(true);
    showToast('Demo centre data pre-filled.', 'info');
  };

  // Get current device coordinates for shelter pin
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      showToast('Geolocation is not supported in this browser.', 'warning');
      return;
    }
    showToast('Detecting precise GPS coordinates for shelter...', 'info');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(parseFloat(pos.coords.latitude.toFixed(6)));
        setLng(parseFloat(pos.coords.longitude.toFixed(6)));
        showToast('Coordinates updated to your device GPS location!', 'success');
      },
      (err) => {
        showToast('Could not access GPS. Please enter coordinates manually.', 'warning');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
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
      showToast('Aadhaar OTP sent to linked mobile number (Use OTP: 4829).', 'info');
    }, 700);
  };

  const handleConfirmAadhaarOtp = () => {
    if (!aadhaarOtp || aadhaarOtp.trim().length < 4) {
      showToast('Please enter the 4-digit verification OTP (e.g. 4829).', 'warning');
      return;
    }
    setAadhaarVerified(true);
    setShowAadhaarOtpInput(false);
    showToast('Aadhaar authenticated successfully via UIDAI gateway.', 'success');
  };

  // Police NOC Upload
  const handlePoliceFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPoliceDocName(file.name);
      setPoliceDocVerified(true);
      showToast(`Police permission document "${file.name}" attached & validated.`, 'success');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!shelterName.trim()) {
      showToast('Please enter the shelter facility name.', 'warning');
      return;
    }
    if (!address.trim()) {
      showToast('Please enter the shelter address.', 'warning');
      return;
    }
    if (!managerName.trim()) {
      showToast('Please enter the shelter manager full name.', 'warning');
      return;
    }
    if (!managerPhone.trim()) {
      showToast('Please enter the shelter manager contact number.', 'warning');
      return;
    }
    if (!managerHomeAddress.trim()) {
      showToast('Please enter the shelter manager residential address.', 'warning');
      return;
    }

    if (mode === 'STATUTORY') {
      if (!aadhaarVerified) {
        showToast('Aadhaar verification is strictly compulsory in Statutory Mode.', 'error');
        return;
      }
      if (!policeNocNumber.trim() || !policeDocVerified) {
        showToast('Local Police Station NOC & signed certificate are required in Statutory Mode.', 'error');
        return;
      }
    }

    const isDemo = mode === 'DEMO';

    const submission: NewShelterSubmission = {
      name: shelterName.trim(),
      address: address.trim(),
      district: district.trim(),
      lat: Number(lat),
      lng: Number(lng),
      capacity: Number(capacity),
      contactPhone: contactPhone.trim() || managerPhone.trim(),
      managerName: managerName.trim(),
      managerPhone: managerPhone.trim(),
      managerHomeAddress: managerHomeAddress.trim(),
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

    const newShelter = addShelter(submission);
    showToast(`Shelter "${newShelter.name}" registered and activated on RESQTECH network!`, 'success');
    onRegistered(newShelter);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-4xl mx-auto">
        
        {/* Top Navigation Bar */}
        <div className="flex items-center justify-between mb-6">
          <button
            id="register-back-to-directory-btn"
            onClick={onBack}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-[#0F172A] font-bold text-xs border border-[#E2E8F0] shadow-xs transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Shelter Directory</span>
          </button>

          <button
            type="button"
            onClick={handleFillDemoData}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>Pre-fill Demo Data</span>
          </button>
        </div>

        {/* Main Card Container */}
        <div className="bg-white rounded-2xl shadow-sm border border-[#E2E8F0] overflow-hidden">
          
          {/* Header Banner */}
          <div className="bg-[#0F172A] text-white p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold mb-2">
                  <Building2 className="w-3.5 h-3.5" />
                  <span>RESQTECH Crisis Network</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                  Register a New Emergency Shelter
                </h1>
                <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
                  Register a school, community hall, stadium, or private facility as an active disaster relief centre.
                </p>
              </div>

              {/* Mode Switcher */}
              <div className="bg-slate-800 p-1.5 rounded-xl border border-slate-700 shrink-0">
                <div className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400 px-2 pb-1">
                  Registration Mode
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setMode('DEMO')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                      mode === 'DEMO'
                        ? 'bg-amber-500 text-[#0F172A] shadow-xs'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    ⚡ Demo Mode
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode('STATUTORY')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                      mode === 'STATUTORY'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    🛡️ Statutory Verified
                  </button>
                </div>
              </div>
            </div>

            {mode === 'DEMO' ? (
              <div className="mt-4 pt-3 border-t border-slate-800 text-xs text-amber-300 flex items-center gap-2">
                <span className="font-bold">⚡ Demo Quick-Register:</span>
                <span>Aadhaar OTP and Police NOC document checks are bypassed for testing and drills.</span>
              </div>
            ) : (
              <div className="mt-4 pt-3 border-t border-slate-800 text-xs text-emerald-300 flex items-center gap-2">
                <span className="font-bold">🛡️ Statutory Verification:</span>
                <span>Mandatory UIDAI Aadhaar verification and signed local Police Station NOC upload enforced.</span>
              </div>
            )}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
            
            {/* SECTION 1: FACILITY DETAILS */}
            <div className="space-y-4">
              <div className="border-b border-[#E2E8F0] pb-2">
                <h2 className="text-sm font-bold text-[#0F172A] uppercase tracking-wider flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-[#059669]" />
                  <span>1. Facility Location &amp; Capacity</span>
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-[#0F172A] mb-1">
                    Shelter Facility Name <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sector 12 Government High School Relief Wing"
                    value={shelterName}
                    onChange={(e) => setShelterName(e.target.value)}
                    className="w-full text-sm px-3.5 py-2.5 bg-[#F8FAFC] border-2 border-[#E2E8F0] rounded-xl focus:border-[#0F172A] focus:bg-white focus:outline-none text-[#0F172A]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-[#0F172A] mb-1">
                    Full Street Address &amp; Landmark <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Near Mahatma Mandir, Sector 12, Gandhinagar"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full text-sm px-3.5 py-2.5 bg-[#F8FAFC] border-2 border-[#E2E8F0] rounded-xl focus:border-[#0F172A] focus:bg-white focus:outline-none text-[#0F172A]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#0F172A] mb-1">
                    District / Region <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full text-sm px-3.5 py-2.5 bg-[#F8FAFC] border-2 border-[#E2E8F0] rounded-xl focus:border-[#0F172A] focus:bg-white focus:outline-none text-[#0F172A]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#0F172A] mb-1">
                    Total Bed Capacity (People) <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min={10}
                    max={5000}
                    value={capacity}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setCapacity(val);
                      if (bedsAvailable > val) setBedsAvailable(val);
                    }}
                    className="w-full text-sm px-3.5 py-2.5 bg-[#F8FAFC] border-2 border-[#E2E8F0] rounded-xl focus:border-[#0F172A] focus:bg-white focus:outline-none text-[#0F172A] font-mono"
                  />
                </div>

                {/* Coordinates */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-[#0F172A]">
                      Latitude
                    </label>
                    <button
                      type="button"
                      onClick={handleUseCurrentLocation}
                      className="text-[11px] text-[#059669] font-bold hover:underline cursor-pointer"
                    >
                      📍 Use My GPS
                    </button>
                  </div>
                  <input
                    type="number"
                    step="0.000001"
                    required
                    value={lat}
                    onChange={(e) => setLat(parseFloat(e.target.value) || 0)}
                    className="w-full text-sm px-3.5 py-2.5 bg-[#F8FAFC] border-2 border-[#E2E8F0] rounded-xl focus:border-[#0F172A] focus:bg-white focus:outline-none text-[#0F172A] font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#0F172A] mb-1">
                    Longitude
                  </label>
                  <input
                    type="number"
                    step="0.000001"
                    required
                    value={lng}
                    onChange={(e) => setLng(parseFloat(e.target.value) || 0)}
                    className="w-full text-sm px-3.5 py-2.5 bg-[#F8FAFC] border-2 border-[#E2E8F0] rounded-xl focus:border-[#0F172A] focus:bg-white focus:outline-none text-[#0F172A] font-mono"
                  />
                </div>
              </div>
            </div>

            {/* SECTION 2: SHELTER MANAGER DETAILS */}
            <div className="space-y-4 pt-2">
              <div className="border-b border-[#E2E8F0] pb-2">
                <h2 className="text-sm font-bold text-[#0F172A] uppercase tracking-wider flex items-center gap-2">
                  <User className="w-4 h-4 text-[#059669]" />
                  <span>2. Shelter Manager Profile</span>
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#0F172A] mb-1">
                    Manager Full Name <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ketan Trivedi"
                    value={managerName}
                    onChange={(e) => setManagerName(e.target.value)}
                    className="w-full text-sm px-3.5 py-2.5 bg-[#F8FAFC] border-2 border-[#E2E8F0] rounded-xl focus:border-[#0F172A] focus:bg-white focus:outline-none text-[#0F172A]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#0F172A] mb-1">
                    Manager Contact Phone Number <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. +91 90000 00088 (Demo)"
                    value={managerPhone}
                    onChange={(e) => setManagerPhone(e.target.value)}
                    className="w-full text-sm px-3.5 py-2.5 bg-[#F8FAFC] border-2 border-[#E2E8F0] rounded-xl focus:border-[#0F172A] focus:bg-white focus:outline-none text-[#0F172A] font-mono"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-[#0F172A] mb-1">
                    Manager Residential / Home Address <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Plot 44, Sector 12, Gandhinagar, Gujarat"
                    value={managerHomeAddress}
                    onChange={(e) => setManagerHomeAddress(e.target.value)}
                    className="w-full text-sm px-3.5 py-2.5 bg-[#F8FAFC] border-2 border-[#E2E8F0] rounded-xl focus:border-[#0F172A] focus:bg-white focus:outline-none text-[#0F172A]"
                  />
                </div>
              </div>

              {/* UIDAI Aadhaar Verification Box */}
              <div className="bg-[#F8FAFC] p-4 rounded-xl border border-[#E2E8F0]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-[#0F172A] flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-[#059669]" />
                    <span>UIDAI Aadhaar Authentication {mode === 'DEMO' && '(Optional in Demo)'}</span>
                  </span>
                  {mode === 'DEMO' ? (
                    <span className="text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300 px-2.5 py-0.5 rounded-full">
                      Bypassed in Demo
                    </span>
                  ) : aadhaarVerified ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#059669] text-white">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>UID Authenticated</span>
                    </span>
                  ) : (
                    <span className="text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                      Compulsory
                    </span>
                  )}
                </div>

                {mode === 'DEMO' ? (
                  <div className="text-xs text-[#475569] flex items-center justify-between bg-white p-3 rounded-lg border border-[#E2E8F0]">
                    <span>Demo mode allows direct registration without OTP verification.</span>
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
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div className="sm:col-span-2">
                        <input
                          type="text"
                          maxLength={14}
                          disabled={aadhaarVerified}
                          placeholder="Enter 12-digit Aadhaar Number"
                          value={aadhaarNumber}
                          onChange={(e) => setAadhaarNumber(e.target.value)}
                          className="w-full text-sm px-3.5 py-2.5 bg-white border-2 border-[#E2E8F0] rounded-xl text-[#0F172A] font-mono"
                        />
                      </div>
                      <div>
                        {!aadhaarVerified && !showAadhaarOtpInput && (
                          <button
                            type="button"
                            onClick={handleRequestAadhaarOtp}
                            disabled={isVerifyingAadhaar || aadhaarNumber.replace(/\D/g, '').length !== 12}
                            className="w-full bg-[#0F172A] hover:bg-slate-800 disabled:bg-slate-300 text-white text-xs font-bold py-2.5 px-3 rounded-xl transition-colors cursor-pointer"
                          >
                            {isVerifyingAadhaar ? 'Verifying...' : 'Verify Aadhaar'}
                          </button>
                        )}
                        {aadhaarVerified && (
                          <div className="text-xs font-bold text-[#059669] flex items-center h-full gap-1">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>UID Verified: XXXX-XXXX-{aadhaarNumber.slice(-4) || '7777'}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {showAadhaarOtpInput && !aadhaarVerified && (
                      <div className="flex items-center gap-2 pt-2 border-t border-slate-200">
                        <input
                          type="text"
                          maxLength={6}
                          placeholder="Enter OTP (Use 4829)"
                          value={aadhaarOtp}
                          onChange={(e) => setAadhaarOtp(e.target.value)}
                          className="w-44 text-sm px-3 py-2 bg-white border-2 border-[#0F172A] rounded-xl font-mono text-center"
                        />
                        <button
                          type="button"
                          onClick={handleConfirmAadhaarOtp}
                          className="bg-[#059669] hover:bg-emerald-700 text-white text-xs font-bold py-2.5 px-4 rounded-xl cursor-pointer"
                        >
                          Confirm OTP
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* SECTION 3: POLICE STATION NOC */}
            <div className="space-y-4 pt-2">
              <div className="border-b border-[#E2E8F0] pb-2">
                <h2 className="text-sm font-bold text-[#0F172A] uppercase tracking-wider flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <FileCheck2 className="w-4 h-4 text-[#059669]" />
                    <span>3. Local Police Station Permission &amp; NOC</span>
                  </span>
                  {mode === 'DEMO' && (
                    <span className="text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300 px-2.5 py-0.5 rounded-full">
                      Exempted in Demo
                    </span>
                  )}
                </h2>
              </div>

              {mode === 'DEMO' ? (
                <div className="bg-[#F8FAFC] p-4 rounded-xl border border-[#E2E8F0] text-xs text-[#475569] flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Police NOC checks are bypassed for rapid testing. In statutory mode, station name, NOC number, and signed certificate upload are required.</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#0F172A] mb-1">
                      Jurisdiction Police Station <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Infocity Police Station, Gandhinagar"
                      value={policeStation}
                      onChange={(e) => setPoliceStation(e.target.value)}
                      className="w-full text-sm px-3.5 py-2.5 bg-[#F8FAFC] border-2 border-[#E2E8F0] rounded-xl focus:border-[#0F172A] focus:bg-white focus:outline-none text-[#0F172A]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#0F172A] mb-1">
                      Police NOC / Permission Reference No. <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. GJ/POL/NOC-2026/8941"
                      value={policeNocNumber}
                      onChange={(e) => setPoliceNocNumber(e.target.value)}
                      className="w-full text-sm px-3.5 py-2.5 bg-[#F8FAFC] border-2 border-[#E2E8F0] rounded-xl focus:border-[#0F172A] focus:bg-white focus:outline-none text-[#0F172A] font-mono"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-[#0F172A] mb-1">
                      Upload Signed Police Permission / NOC Certificate <span className="text-rose-600">*</span>
                    </label>
                    <div className="border-2 border-dashed border-[#E2E8F0] rounded-xl p-5 text-center bg-[#F8FAFC] hover:bg-slate-50 transition-colors">
                      <input
                        type="file"
                        id="police-noc-file-input"
                        accept=".pdf,.png,.jpg,.jpeg"
                        onChange={handlePoliceFileUpload}
                        className="hidden"
                      />
                      <label htmlFor="police-noc-file-input" className="cursor-pointer flex flex-col items-center gap-1.5">
                        <Upload className="w-6 h-6 text-[#475569]" />
                        <span className="text-xs font-bold text-[#0F172A]">
                          {policeDocName ? `Uploaded: ${policeDocName}` : 'Click to Upload Signed Police NOC Certificate'}
                        </span>
                        <span className="text-[11px] text-[#475569]">PDF, JPG, PNG up to 10MB</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* SECTION 4: BASIC REQUIREMENTS & INVENTORY */}
            <div className="space-y-4 pt-2">
              <div className="border-b border-[#E2E8F0] pb-2">
                <h2 className="text-sm font-bold text-[#0F172A] uppercase tracking-wider flex items-center gap-2">
                  <Package className="w-4 h-4 text-[#059669]" />
                  <span>4. Initial Basic Requirements &amp; Inventory</span>
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#0F172A] mb-1">
                    Available Bed Units
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={capacity}
                    value={bedsAvailable}
                    onChange={(e) => setBedsAvailable(Number(e.target.value))}
                    className="w-full text-sm px-3.5 py-2.5 bg-[#F8FAFC] border-2 border-[#E2E8F0] rounded-xl focus:border-[#0F172A] focus:bg-white focus:outline-none text-[#0F172A] font-mono"
                  />
                  <span className="text-[11px] text-[#475569] mt-0.5 block">Max capacity: {capacity}</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#0F172A] mb-1">
                    Clean Drinking Water (Litres)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={waterLiters}
                    onChange={(e) => setWaterLiters(Number(e.target.value))}
                    className="w-full text-sm px-3.5 py-2.5 bg-[#F8FAFC] border-2 border-[#E2E8F0] rounded-xl focus:border-[#0F172A] focus:bg-white focus:outline-none text-[#0F172A] font-mono"
                  />
                  <span className="text-[11px] text-[#475569] mt-0.5 block">Recommended: 25L per person</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#0F172A] mb-1">
                    Packaged Ration Kits
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={rationKits}
                    onChange={(e) => setRationKits(Number(e.target.value))}
                    className="w-full text-sm px-3.5 py-2.5 bg-[#F8FAFC] border-2 border-[#E2E8F0] rounded-xl focus:border-[#0F172A] focus:bg-white focus:outline-none text-[#0F172A] font-mono"
                  />
                  <span className="text-[11px] text-[#475569] mt-0.5 block">Family food packages</span>
                </div>
              </div>

              {/* Checkbox facilities */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <label className="flex items-center gap-2 p-3 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] hover:bg-slate-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasMedicalAid}
                    onChange={(e) => setHasMedicalAid(e.target.checked)}
                    className="w-4 h-4 rounded text-[#059669] focus:ring-0"
                  />
                  <div>
                    <span className="text-xs font-bold text-[#0F172A] block">On-Site Doctor / Medical Aid Team</span>
                    <span className="text-[11px] text-[#475569]">First aid readiness and medical staff present</span>
                  </div>
                </label>

                <label className="flex items-center gap-2 p-3 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] hover:bg-slate-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasElectricity}
                    onChange={(e) => setHasElectricity(e.target.checked)}
                    className="w-4 h-4 rounded text-[#059669] focus:ring-0"
                  />
                  <div>
                    <span className="text-xs font-bold text-[#0F172A] block">Backup Generator &amp; Power</span>
                    <span className="text-[11px] text-[#475569]">Continuous 24/7 power supply available</span>
                  </div>
                </label>
              </div>
            </div>

            {/* ACTION BUTTONS */}
            <div className="pt-6 border-t border-[#E2E8F0] flex flex-col sm:flex-row items-center justify-end gap-3">
              <button
                type="button"
                onClick={onBack}
                className="w-full sm:w-auto px-5 py-3 rounded-xl bg-white hover:bg-slate-100 text-[#0F172A] font-bold text-xs border border-[#E2E8F0] transition-colors cursor-pointer"
              >
                Cancel &amp; Return
              </button>

              <button
                type="submit"
                id="submit-register-shelter-btn"
                className="w-full sm:w-auto px-8 py-3 rounded-xl bg-[#0F172A] hover:bg-slate-800 text-white font-black text-xs shadow-md transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>SUBMIT &amp; ACTIVATE SHELTER</span>
              </button>
            </div>

          </form>

        </div>
      </div>
    </div>
  );
};
