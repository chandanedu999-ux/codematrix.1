import React, { useState } from 'react';
import { useResq } from '../context/ResqContext';
import { ResidentMember, FamilyRegistration } from '../types';
import { 
  UserPlus, 
  Users, 
  CheckCircle, 
  Printer, 
  Share2, 
  AlertTriangle, 
  Plus, 
  Trash2, 
  HeartPulse, 
  Baby, 
  Accessibility, 
  Sparkles, 
  ChevronRight, 
  ArrowLeft,
  Clock,
  ShieldCheck,
  Building
} from 'lucide-react';

interface FastIntakeViewProps {
  initialShelterId?: string | null;
  onNavigateToDashboard: () => void;
}

export const FastIntakeView: React.FC<FastIntakeViewProps> = ({
  initialShelterId,
  onNavigateToDashboard
}) => {
  const { shelters, registerFamily, isOnline, showToast } = useResq();

  // Find valid shelters accepting people
  const availableShelters = shelters.filter((s) => s.status !== 'INACTIVE');

  // Form states
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [shelterId, setShelterId] = useState(initialShelterId || availableShelters[0]?.id || 'sh-01');
  const [familyName, setFamilyName] = useState('');
  const [phone, setPhone] = useState('');
  const [origin, setOrigin] = useState('');
  
  // Rapid members list
  const [members, setMembers] = useState<ResidentMember[]>([
    { id: 'm-initial-1', name: '', age: 35, gender: 'M', specialNeeds: [] }
  ]);

  // Registered receipt
  const [lastRegistration, setLastRegistration] = useState<FamilyRegistration | null>(null);

  const selectedShelter = shelters.find((s) => s.id === shelterId) || shelters[0];

  const SPECIAL_NEEDS_OPTIONS = [
    { id: 'Medical Attention', label: '🩺 Medical Attention', icon: HeartPulse },
    { id: 'Pregnant', label: '🤰 Pregnant', icon: HeartPulse },
    { id: 'Infant', label: '🍼 Infant (<2 yrs)', icon: Baby },
    { id: 'Elderly', label: '👵 Elderly (65+)', icon: Users },
    { id: 'Disability / Wheelchair', label: '♿ Disability / Mobility', icon: Accessibility },
    { id: 'Medication Required', label: '💊 Daily Medication', icon: Sparkles },
    { id: 'Food Allergy', label: '⚠️ Food Allergy / Dietary', icon: AlertTriangle },
    { id: 'Trauma / Counseling', label: '🤍 Mental Health Support', icon: Users }
  ];

  const handleAddMember = () => {
    const newMember: ResidentMember = {
      id: `m-${Date.now()}-${members.length + 1}`,
      name: '',
      age: 25,
      gender: 'F',
      specialNeeds: []
    };
    setMembers((prev) => [...prev, newMember]);
  };

  const handleRemoveMember = (index: number) => {
    if (members.length === 1) return;
    setMembers((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateMember = (index: number, field: keyof ResidentMember, value: any) => {
    setMembers((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleToggleSpecialNeed = (index: number, need: string) => {
    setMembers((prev) => {
      const copy = [...prev];
      const curNeeds = copy[index].specialNeeds;
      if (curNeeds.includes(need)) {
        copy[index].specialNeeds = curNeeds.filter((n) => n !== need);
      } else {
        copy[index].specialNeeds = [...curNeeds, need];
      }
      return copy;
    });
  };

  // Compile summary of all family special needs
  const allSpecialNeeds = Array.from(new Set(members.flatMap((m) => m.specialNeeds)));

  const handleConfirmRegistration = async () => {
    if (!familyName.trim()) {
      showToast('Please enter family / group name', 'error');
      setStep(1);
      return;
    }

    const cleanedMembers: ResidentMember[] = members.map((m, idx) => ({
      ...m,
      name: m.name.trim() || `Member ${idx + 1}`
    }));

    const reg = await registerFamily({
      familyName: familyName.trim(),
      phone: phone.trim() || 'Not provided',
      origin: origin.trim() || 'Local Evacuee',
      shelterId: selectedShelter.id,
      shelterName: selectedShelter.name,
      members: cleanedMembers,
      totalMembers: cleanedMembers.length,
      specialNeedsSummary: allSpecialNeeds
    });

    setLastRegistration(reg);
    setStep(4); // Success view
  };

  const handleResetForNext = () => {
    setFamilyName('');
    setPhone('');
    setOrigin('');
    setMembers([{ id: `m-${Date.now()}`, name: '', age: 35, gender: 'M', specialNeeds: [] }]);
    setLastRegistration(null);
    setStep(1);
  };

  const handlePrintSlip = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-[#F7F9FC] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        
        {/* Header Title */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse"></span>
              <span className="text-xs font-mono font-bold text-blue-700 tracking-widest uppercase">
                EMERGENCY RESIDENT INTAKE
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Fast Intake &amp; Family Grouping
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Optimized for high-speed reception under disaster conditions. Low cognitive load.
            </p>
          </div>

          <button
            onClick={onNavigateToDashboard}
            className="flex items-center gap-1 text-xs font-bold text-slate-600 hover:text-slate-900 py-1.5 px-3 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 self-start sm:self-auto cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to EOC</span>
          </button>
        </div>

        {/* Offline notice if offline */}
        {!isOnline && (
          <div className="mb-6 bg-amber-100 border border-amber-300 rounded-xl p-3 flex items-center gap-2.5 text-xs text-amber-950">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Offline Mode Active:</strong> This registration will be issued a local temporary RSQ-ID and synced automatically once internet connectivity is restored.
            </span>
          </div>
        )}

        {/* Multi-step progress bar (for steps 1-3) */}
        {step < 4 && (
          <div className="bg-white rounded-xl p-3 mb-6 border border-slate-200 shadow-2xs flex items-center justify-between text-xs">
            <button
              onClick={() => setStep(1)}
              className={`flex items-center gap-2 font-bold ${step === 1 ? 'text-blue-700' : 'text-slate-500'}`}
            >
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step === 1 ? 'bg-blue-600 text-white' : 'bg-slate-100'}`}>1</span>
              <span>Family &amp; Shelter</span>
            </button>
            <ChevronRight className="w-4 h-4 text-slate-300" />
            <button
              onClick={() => setStep(2)}
              className={`flex items-center gap-2 font-bold ${step === 2 ? 'text-blue-700' : 'text-slate-500'}`}
            >
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step === 2 ? 'bg-blue-600 text-white' : 'bg-slate-100'}`}>2</span>
              <span>Members ({members.length})</span>
            </button>
            <ChevronRight className="w-4 h-4 text-slate-300" />
            <button
              onClick={() => setStep(3)}
              className={`flex items-center gap-2 font-bold ${step === 3 ? 'text-blue-700' : 'text-slate-500'}`}
            >
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step === 3 ? 'bg-blue-600 text-white' : 'bg-slate-100'}`}>3</span>
              <span>Review &amp; Confirm</span>
            </button>
          </div>
        )}

        {/* STEP 1: Family & Shelter selection */}
        {step === 1 && (
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-5">
            <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
              Step 1: Family / Group &amp; Destination Shelter
            </h2>

            {/* Target Shelter Selector */}
            <div>
              <label htmlFor="intake-shelter-select" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Receiving Shelter Site *
              </label>
              <select
                id="intake-shelter-select"
                value={shelterId}
                onChange={(e) => setShelterId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs sm:text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-blue-600 cursor-pointer"
              >
                {shelters.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} — ({s.currentOccupancy}/{s.capacity} people, {s.status})
                  </option>
                ))}
              </select>
              <div className="mt-1.5 text-xs text-slate-500 flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-slate-400" />
                <span>
                  {selectedShelter.address} &bull; Beds available: {Math.max(0, selectedShelter.capacity - selectedShelter.currentOccupancy)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="intake-family-name" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Family / Surname / Group Head *
                </label>
                <input
                  id="intake-family-name"
                  type="text"
                  value={familyName}
                  onChange={(e) => setFamilyName(e.target.value)}
                  placeholder="e.g. Patel, Shah, Kumar"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-blue-600"
                  required
                />
              </div>

              <div>
                <label htmlFor="intake-contact-phone" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Contact Phone (Optional)
                </label>
                <input
                  id="intake-contact-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. +91 98250 XXXXX"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>

            <div>
              <label htmlFor="intake-origin-locality" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Origin Neighborhood / Evacuated Locality *
              </label>
              <input
                id="intake-origin-locality"
                type="text"
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                placeholder="e.g. Sabarmati West Bank, Sector 8 Low-Lying Area"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div className="pt-4 flex justify-end">
              <button
                id="intake-step1-next-btn"
                onClick={() => {
                  if (!familyName.trim()) {
                    showToast('Please provide family or group name', 'error');
                    return;
                  }
                  setStep(2);
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl text-xs sm:text-sm flex items-center gap-2 shadow-md cursor-pointer"
              >
                <span>Continue to Members ({members.length})</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Rapid Member Entry */}
        {step === 2 && (
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Step 2: Add Members — Family {familyName || 'Group'}
                </h2>
                <p className="text-xs text-slate-500">
                  Quickly log individuals and tag special dietary, mobility, or medication needs.
                </p>
              </div>
              <button
                id="intake-add-member-btn"
                onClick={handleAddMember}
                className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2 px-3.5 rounded-xl shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Add Member</span>
              </button>
            </div>

            {/* Member Cards */}
            <div className="space-y-4">
              {members.map((member, index) => (
                <div key={member.id} className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Member #{index + 1}
                    </span>
                    {members.length > 1 && (
                      <button
                        onClick={() => handleRemoveMember(index)}
                        className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                        title="Remove member"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                        First Name
                      </label>
                      <input
                        type="text"
                        value={member.name}
                        onChange={(e) => handleUpdateMember(index, 'name', e.target.value)}
                        placeholder={`Member ${index + 1}`}
                        className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs font-medium text-slate-900"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                        Age
                      </label>
                      <input
                        type="number"
                        value={member.age}
                        min={0}
                        max={110}
                        onChange={(e) => handleUpdateMember(index, 'age', parseInt(e.target.value) || 0)}
                        className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs font-medium text-slate-900"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                        Gender
                      </label>
                      <select
                        value={member.gender}
                        onChange={(e) => handleUpdateMember(index, 'gender', e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs font-medium text-slate-900 cursor-pointer"
                      >
                        <option value="M">Male</option>
                        <option value="F">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>

                  {/* Special Needs Quick Toggles */}
                  <div>
                    <span className="block text-[11px] font-bold text-slate-600 uppercase mb-1.5">
                      Special Needs / Vulnerabilities (Tap to toggle):
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {SPECIAL_NEEDS_OPTIONS.map((opt) => {
                        const isSelected = member.specialNeeds.includes(opt.id);
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => handleToggleSpecialNeed(index, opt.id)}
                            className={`px-2.5 py-1 rounded-md text-[11px] font-bold border transition-all cursor-pointer min-h-[36px] ${
                              isSelected
                                ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                            }`}
                          >
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                </div>
              ))}
            </div>

            {/* Quick Summary Card */}
            <div className="bg-blue-50/70 rounded-xl p-4 border border-blue-200 text-xs text-blue-950 flex items-center justify-between">
              <div>
                <span className="font-bold">Family {familyName || 'Patel'}</span> &bull; {members.length} member{members.length === 1 ? '' : 's'}
                {allSpecialNeeds.length > 0 && (
                  <div className="text-[11px] text-blue-800 mt-0.5">
                    Special tags: {allSpecialNeeds.join(', ')}
                  </div>
                )}
              </div>
              <button
                onClick={handleAddMember}
                className="text-xs font-bold text-blue-700 underline cursor-pointer"
              >
                + Add another
              </button>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <button
                onClick={() => setStep(1)}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 cursor-pointer"
              >
                &larr; Back
              </button>
              <button
                id="intake-step2-next-btn"
                onClick={() => setStep(3)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl text-xs sm:text-sm flex items-center gap-2 shadow-md cursor-pointer"
              >
                <span>Review Summary &rarr;</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Review & One-Tap Confirmation */}
        {step === 3 && (
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-6">
            <div className="border-b border-slate-100 pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Final Confirmation
              </span>
              <h2 className="text-xl font-black text-slate-900 mt-0.5">
                READY TO REGISTER
              </h2>
            </div>

            {/* Summary card */}
            <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 space-y-4">
              <div className="flex items-baseline justify-between border-b border-slate-200 pb-3">
                <div>
                  <div className="text-xs text-slate-500 font-medium">Family Name</div>
                  <div className="text-xl font-black text-slate-900">Family {familyName}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-500 font-medium">Total Headcount</div>
                  <div className="text-xl font-black text-blue-700">{members.length} people</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-500 block">Assigned Shelter:</span>
                  <span className="font-bold text-slate-900">{selectedShelter.name}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Origin Locality:</span>
                  <span className="font-bold text-slate-900">{origin || 'Local Area'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Contact:</span>
                  <span className="font-bold text-slate-900">{phone || 'Not recorded'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Special Needs Flag:</span>
                  <span className="font-bold text-rose-700">
                    {allSpecialNeeds.length > 0 ? allSpecialNeeds.join(', ') : 'None specified'}
                  </span>
                </div>
              </div>

              {/* Members breakdown */}
              <div className="pt-3 border-t border-slate-200">
                <div className="text-xs font-bold text-slate-700 mb-2">Member Roster:</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {members.map((m, i) => (
                    <div key={m.id} className="bg-white p-2 rounded-lg border border-slate-200 flex items-center justify-between">
                      <span className="font-semibold text-slate-800">
                        {m.name || `Member ${i + 1}`} ({m.age} yrs, {m.gender})
                      </span>
                      {m.specialNeeds.length > 0 && (
                        <span className="text-[10px] bg-rose-50 text-rose-700 px-1.5 py-0.5 rounded-sm font-bold">
                          {m.specialNeeds[0]}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <button
                onClick={() => setStep(2)}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 cursor-pointer"
              >
                &larr; Modify Details
              </button>
              <button
                id="intake-confirm-registration-btn"
                onClick={handleConfirmRegistration}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-3.5 px-8 rounded-xl text-sm shadow-lg flex items-center gap-2 transition-all cursor-pointer"
              >
                <CheckCircle className="w-5 h-5" />
                <span>CONFIRM REGISTRATION</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: Success & Printable Intake Slip */}
        {step === 4 && lastRegistration && (
          <div className="space-y-6 animate-in zoom-in-95 duration-200">
            
            {/* Printable Slip Container */}
            <div id="printable-intake-slip" className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-md">
              <div className="flex items-center justify-between border-b-2 border-slate-900 pb-4 mb-6">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xl font-black tracking-tight text-slate-900">RESQ</span>
                    <span className="text-xs bg-slate-900 text-white px-2 py-0.5 rounded-sm font-bold uppercase">
                      Official Intake Slip
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">District Emergency Disaster Management Authority</p>
                </div>
                <div className="text-right font-mono">
                  <div className="text-xs text-slate-400">REGISTRATION ID</div>
                  <div className="text-xl font-black text-blue-700">{lastRegistration.rsqId}</div>
                </div>
              </div>

              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-6 text-center">
                <CheckCircle className="w-8 h-8 text-emerald-600 mx-auto mb-1" />
                <h3 className="text-lg font-black text-emerald-900">REGISTRATION COMPLETE</h3>
                <p className="text-xs text-emerald-800">
                  Headcount updated in centralized shelter register. Bed &amp; meal quota reserved.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs mb-6">
                <div className="p-3 bg-slate-50 rounded-lg">
                  <span className="text-slate-500 block">Family Name:</span>
                  <span className="font-bold text-sm text-slate-900">Family {lastRegistration.familyName}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <span className="text-slate-500 block">Total Members:</span>
                  <span className="font-bold text-sm text-slate-900">{lastRegistration.totalMembers} Persons</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <span className="text-slate-500 block">Assigned Shelter:</span>
                  <span className="font-bold text-sm text-slate-900">{lastRegistration.shelterName}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <span className="text-slate-500 block">Timestamp:</span>
                  <span className="font-bold text-sm text-slate-900">
                    {new Date(lastRegistration.timestamp).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Members List */}
              <div className="mb-6">
                <div className="text-xs font-bold uppercase text-slate-500 mb-2">Registered Members</div>
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 text-slate-700">
                    <tr>
                      <th className="p-2">#</th>
                      <th className="p-2">Name</th>
                      <th className="p-2">Age</th>
                      <th className="p-2">Gender</th>
                      <th className="p-2">Special Needs</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {lastRegistration.members.map((m, idx) => (
                      <tr key={m.id}>
                        <td className="p-2 text-slate-400">{idx + 1}</td>
                        <td className="p-2 font-bold text-slate-900">{m.name}</td>
                        <td className="p-2 text-slate-700">{m.age}</td>
                        <td className="p-2 text-slate-700">{m.gender}</td>
                        <td className="p-2 text-rose-700 font-semibold">{m.specialNeeds.join(', ') || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mock Barcode */}
              <div className="pt-4 border-t border-slate-200 text-center font-mono text-[10px] text-slate-400">
                <div className="h-8 max-w-xs mx-auto bg-slate-900 flex items-center justify-center text-white tracking-widest font-black text-xs mb-1">
                  |||||| |||| | ||||| ||||||| | |||
                </div>
                <span>AUTHENTICATED RESQ EMERGENCY RECORD &bull; {lastRegistration.rsqId}</span>
              </div>
            </div>

            {/* Print / Next Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 no-print">
              <button
                onClick={handlePrintSlip}
                className="flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white py-3 px-5 rounded-xl text-xs font-bold shadow-md cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print / Save Slip</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={onNavigateToDashboard}
                  className="px-4 py-3 bg-white border border-slate-300 text-slate-800 hover:bg-slate-50 rounded-xl text-xs font-bold cursor-pointer"
                >
                  View in Command Center
                </button>
                <button
                  id="intake-next-family-btn"
                  onClick={handleResetForNext}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-xl text-xs font-bold shadow-md cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Register Next Family</span>
                </button>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
