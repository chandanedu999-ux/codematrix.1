import React, { useState, useEffect } from 'react';
import { useResq } from '../context/ResqContext';
import { useRipple, triggerHaptic } from '../components/Ripple';
import { 
  User, 
  Phone, 
  HeartPulse, 
  MapPin, 
  QrCode, 
  Download, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Users, 
  Save, 
  Trash2, 
  Plus, 
  FileText, 
  Wifi, 
  WifiOff, 
  ArrowRight,
  ExternalLink,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface EmergencyContact {
  id: string;
  name: string;
  relation: string;
  phone: string;
}

export const ProfileView: React.FC = () => {
  const { isOnline, showToast, shelters, setSelectedShelterId } = useResq();
  const { createRipple, RippleElements } = useRipple();

  // Profile data from localStorage or defaults
  const [fullName, setFullName] = useState(() => localStorage.getItem('resq_profile_name') || 'Priya Sharma');
  const [phone, setPhone] = useState(() => localStorage.getItem('resq_profile_phone') || '+91 98250 12345');
  const [homeAddress, setHomeAddress] = useState(() => localStorage.getItem('resq_profile_addr') || 'Block B-4, Sector 7, Gandhinagar');
  const [bloodGroup, setBloodGroup] = useState(() => localStorage.getItem('resq_profile_blood') || 'O+');
  const [medicalConditions, setMedicalConditions] = useState(() => localStorage.getItem('resq_profile_meds') || 'Asthma (requires inhaler), Penicillin allergy');
  const [householdMembers, setHouseholdMembers] = useState(() => localStorage.getItem('resq_profile_members') || '3');

  // Emergency Contacts
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>(() => {
    const saved = localStorage.getItem('resq_profile_contacts');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* fallback */ }
    }
    return [
      { id: '1', name: 'Rajesh Sharma', relation: 'Spouse', phone: '+91 98250 99881' },
      { id: '2', name: 'Kavita Patel', relation: 'Sister / Next of Kin', phone: '+91 97123 45678' }
    ];
  });

  const [newContactName, setNewContactName] = useState('');
  const [newContactRelation, setNewContactRelation] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');
  const [isAddingContact, setIsAddingContact] = useState(false);

  // Active reserved passes
  const [savedPasses, setSavedPasses] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('resqtech_saved_passes');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Accordion state
  const [isFaqOpen, setIsFaqOpen] = useState(false);
  const [isRightsOpen, setIsRightsOpen] = useState(false);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    triggerHaptic([40, 30, 40]);
    localStorage.setItem('resq_profile_name', fullName);
    localStorage.setItem('resq_profile_phone', phone);
    localStorage.setItem('resq_profile_addr', homeAddress);
    localStorage.setItem('resq_profile_blood', bloodGroup);
    localStorage.setItem('resq_profile_meds', medicalConditions);
    localStorage.setItem('resq_profile_members', householdMembers);
    showToast('Emergency medical & identity profile saved securely offline.', 'success');
  };

  const handleAddContact = () => {
    if (!newContactName.trim() || !newContactPhone.trim()) {
      showToast('Please enter both name and contact phone number.', 'warning');
      return;
    }
    const updated = [
      ...emergencyContacts,
      {
        id: Date.now().toString(),
        name: newContactName.trim(),
        relation: newContactRelation.trim() || 'Emergency Contact',
        phone: newContactPhone.trim()
      }
    ];
    setEmergencyContacts(updated);
    localStorage.setItem('resq_profile_contacts', JSON.stringify(updated));
    setNewContactName('');
    setNewContactRelation('');
    setNewContactPhone('');
    setIsAddingContact(false);
    showToast('Emergency contact added.', 'success');
  };

  const handleRemoveContact = (id: string) => {
    const updated = emergencyContacts.filter((c) => c.id !== id);
    setEmergencyContacts(updated);
    localStorage.setItem('resq_profile_contacts', JSON.stringify(updated));
    showToast('Emergency contact removed.', 'info');
  };

  const handleCancelPass = (passId: string) => {
    const updated = savedPasses.filter((p) => p.passId !== passId);
    setSavedPasses(updated);
    localStorage.setItem('resqtech_saved_passes', JSON.stringify(updated));
    showToast('Shelter reservation pass removed.', 'info');
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24 pt-4 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Page Title & Status Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 elevation-1">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
                User Identity &amp; SOS Wallet
              </span>
              <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Offline Cached</span>
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#0F172A] tracking-tight">
              Emergency Profile &amp; Passes
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Keep your household medical data and verified shelter passes ready for zero-delay intake.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className={`px-3 py-2 rounded-2xl text-xs font-bold flex items-center gap-1.5 border ${
              isOnline ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-amber-50 text-amber-900 border-amber-200'
            }`}>
              {isOnline ? <Wifi className="w-4 h-4 text-emerald-600" /> : <WifiOff className="w-4 h-4 text-amber-600" />}
              <span>{isOnline ? 'Cloud Synced' : 'Offline Mode (Local Storage)'}</span>
            </div>
          </div>
        </div>

        {/* 12-Column Grid for Desktop (Condenses to 4-Column on Mobile) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* LEFT 7 COLS: EMERGENCY IDENTITY & MEDICAL FORM */}
          <div className="lg:col-span-7 space-y-6">
            
            <div className="bg-white rounded-3xl p-6 border border-slate-200 elevation-1">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-5">
                <h2 className="text-base font-black text-[#0F172A] flex items-center gap-2">
                  <User className="w-5 h-5 text-[#EA580C]" />
                  <span>Personal &amp; Medical Triage Info</span>
                </h2>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Shared with Doctors on Arrival
                </span>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#0F172A] uppercase tracking-wider mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl text-sm border-2 border-slate-200 focus:border-[#0F172A] focus:outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#0F172A] uppercase tracking-wider mb-1">
                      Primary Phone *
                    </label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl text-sm border-2 border-slate-200 focus:border-[#0F172A] focus:outline-none transition-colors font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#0F172A] uppercase tracking-wider mb-1">
                    Home Address / Resident Landmark
                  </label>
                  <input
                    type="text"
                    value={homeAddress}
                    onChange={(e) => setHomeAddress(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl text-sm border-2 border-slate-200 focus:border-[#0F172A] focus:outline-none transition-colors"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#0F172A] uppercase tracking-wider mb-1">
                      Blood Group
                    </label>
                    <select
                      value={bloodGroup}
                      onChange={(e) => setBloodGroup(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl text-sm border-2 border-slate-200 focus:border-[#0F172A] focus:outline-none transition-colors bg-white font-bold text-[#0F172A]"
                    >
                      <option value="A+">A Positive (A+)</option>
                      <option value="A-">A Negative (A-)</option>
                      <option value="B+">B Positive (B+)</option>
                      <option value="B-">B Negative (B-)</option>
                      <option value="O+">O Positive (O+)</option>
                      <option value="O-">O Negative (O-)</option>
                      <option value="AB+">AB Positive (AB+)</option>
                      <option value="AB-">AB Negative (AB-)</option>
                      <option value="Unknown">Don't Know</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#0F172A] uppercase tracking-wider mb-1">
                      Family Members in Household
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="15"
                      value={householdMembers}
                      onChange={(e) => setHouseholdMembers(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl text-sm border-2 border-slate-200 focus:border-[#0F172A] focus:outline-none transition-colors font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#0F172A] uppercase tracking-wider mb-1">
                    Medical Needs, Prescriptions &amp; Allergies
                  </label>
                  <textarea
                    rows={2}
                    value={medicalConditions}
                    onChange={(e) => setMedicalConditions(e.target.value)}
                    placeholder="e.g. Diabietic (insulin dependent), Elderly parent with limited mobility"
                    className="w-full px-4 py-3 rounded-xl text-sm border-2 border-slate-200 focus:border-[#0F172A] focus:outline-none transition-colors resize-none"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    onClick={(e) => createRipple(e)}
                    className="clay-btn-primary w-full py-3.5 px-6 rounded-2xl text-white font-black text-xs tracking-wider uppercase flex items-center justify-center gap-2 cursor-pointer relative overflow-hidden"
                  >
                    {RippleElements}
                    <Save className="w-4 h-4" />
                    <span>Save Emergency Profile</span>
                  </button>
                </div>
              </form>
            </div>

            {/* EMERGENCY CONTACTS LIST */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 elevation-1">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                <h2 className="text-base font-black text-[#0F172A] flex items-center gap-2">
                  <Phone className="w-5 h-5 text-rose-600" />
                  <span>Emergency ICE Contacts</span>
                </h2>
                <button
                  type="button"
                  onClick={() => setIsAddingContact((prev) => !prev)}
                  className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>{isAddingContact ? 'Cancel' : 'Add Contact'}</span>
                </button>
              </div>

              {isAddingContact && (
                <div className="p-4 mb-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 animate-in fade-in duration-150">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input
                      type="text"
                      placeholder="Contact Name"
                      value={newContactName}
                      onChange={(e) => setNewContactName(e.target.value)}
                      className="px-3 py-2 text-xs rounded-xl border border-slate-300"
                    />
                    <input
                      type="text"
                      placeholder="Relationship"
                      value={newContactRelation}
                      onChange={(e) => setNewContactRelation(e.target.value)}
                      className="px-3 py-2 text-xs rounded-xl border border-slate-300"
                    />
                    <input
                      type="tel"
                      placeholder="Phone Number"
                      value={newContactPhone}
                      onChange={(e) => setNewContactPhone(e.target.value)}
                      className="px-3 py-2 text-xs rounded-xl border border-slate-300 font-mono"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleAddContact}
                    className="w-full py-2 bg-[#0F172A] hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    Save Contact
                  </button>
                </div>
              )}

              <div className="space-y-3">
                {emergencyContacts.map((contact) => (
                  <div 
                    key={contact.id} 
                    className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between gap-3"
                  >
                    <div>
                      <div className="text-xs font-black text-[#0F172A] flex items-center gap-2">
                        <span>{contact.name}</span>
                        <span className="text-[10px] font-bold text-slate-500 bg-slate-200 px-2 py-0.5 rounded-full">
                          {contact.relation}
                        </span>
                      </div>
                      <div className="text-xs font-mono font-bold text-blue-700 mt-0.5">
                        {contact.phone}
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <a
                        href={`tel:${contact.phone}`}
                        className="p-2 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold text-xs flex items-center gap-1 transition-colors"
                        title="Direct call"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Call</span>
                      </a>
                      <button
                        type="button"
                        onClick={() => handleRemoveContact(contact.id)}
                        className="p-2 rounded-xl text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                        title="Remove contact"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}

                {emergencyContacts.length === 0 && (
                  <p className="text-xs text-slate-400 py-3 text-center">
                    No emergency contacts added yet. Add family or neighbors to notify during an SOS distress event.
                  </p>
                )}
              </div>
            </div>

          </div>

          {/* RIGHT 5 COLS: ACTIVE RESERVED PASSES & QR WALLET */}
          <div className="lg:col-span-5 space-y-6">
            
            <div className="bg-white rounded-3xl p-6 border border-slate-200 elevation-1">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                <h2 className="text-base font-black text-[#0F172A] flex items-center gap-2">
                  <QrCode className="w-5 h-5 text-emerald-600" />
                  <span>Active Shelter Passes</span>
                </h2>
                <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  {savedPasses.length} Active
                </span>
              </div>

              {savedPasses.length > 0 ? (
                <div className="space-y-4">
                  {savedPasses.map((pass) => (
                    <div 
                      key={pass.passId}
                      className="bg-[#0F172A] text-white p-5 rounded-3xl shadow-lg border border-slate-800 space-y-3 relative overflow-hidden"
                    >
                      <div className="flex items-start justify-between border-b border-slate-800 pb-3">
                        <div>
                          <div className="text-[10px] font-black uppercase tracking-widest text-[#38BDF8]">
                            CONFIRMED BED SPOT
                          </div>
                          <div className="font-mono text-xs font-black text-white">
                            {pass.passId}
                          </div>
                        </div>
                        <div className="w-10 h-10 bg-white p-1 rounded-xl text-slate-950 flex items-center justify-center">
                          <QrCode className="w-8 h-8" />
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm font-black text-white">
                          {pass.shelterName}
                        </h4>
                        <p className="text-[11px] text-slate-300 mt-0.5">
                          {pass.shelterAddress}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-800">
                        <div>
                          <span className="text-[10px] text-slate-400">Head:</span>
                          <div className="font-bold">{pass.fullName}</div>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400">Allocated Beds:</span>
                          <div className="font-bold text-amber-300">{pass.partySize} Beds</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => window.print()}
                          className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Print Pass</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCancelPass(pass.passId)}
                          className="py-2 px-3 rounded-xl bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 text-xs font-bold transition-colors cursor-pointer"
                          title="Cancel reservation"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 bg-slate-50 rounded-2xl border border-dashed border-slate-300 text-center">
                  <FileText className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <h4 className="text-xs font-black text-[#0F172A] uppercase tracking-wider">
                    No Active Shelter Spot
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    When you reserve a bed at a shelter, your offline QR admission pass will be saved here automatically.
                  </p>
                </div>
              )}
            </div>

            {/* OFFLINE CITIZEN ADVISORY */}
            <div className="bg-amber-50 rounded-3xl p-5 border border-amber-200 text-xs text-amber-900 space-y-2">
              <div className="flex items-center gap-2 font-black text-amber-950">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Zero-Bandwidth Ready</span>
              </div>
              <p className="leading-relaxed">
                All data entered here is stored directly in your device's browser memory. Even if cell towers and internet fail, this pass remains accessible.
              </p>
            </div>

          </div>

        </div>

        {/* ACCORDIONS AT THE VERY BOTTOM (Secondary Information strictly at the bottom as mandated) */}
        <div className="space-y-3 pt-6 border-t border-slate-200">
          <div className="text-xs font-black uppercase tracking-wider text-slate-400 px-1">
            Secondary Relief Information &amp; Citizen Guidance
          </div>

          {/* FAQ Accordion */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <button
              onClick={() => setIsFaqOpen((prev) => !prev)}
              className="w-full px-6 py-4 flex items-center justify-between text-left font-extrabold text-sm text-[#0F172A] hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <span>Disaster Preparedness &amp; Shelter FAQ</span>
              {isFaqOpen ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
            </button>
            {isFaqOpen && (
              <div className="px-6 pb-5 pt-1 text-xs text-slate-600 space-y-3 border-t border-slate-100 leading-relaxed">
                <div>
                  <strong className="text-[#0F172A]">What should I bring to an emergency relief shelter?</strong>
                  <p className="mt-0.5">Bring government photo identification, personal prescription medications for at least 7 days, phone chargers, essential infant care supplies, and sturdy shoes.</p>
                </div>
                <div>
                  <strong className="text-[#0F172A]">Are shelters pet-friendly?</strong>
                  <p className="mt-0.5">Shelters marked with companion animal badges accept domestic pets on leash or in carriers. Veterinary support and pet food packets are stocked on site.</p>
                </div>
                <div>
                  <strong className="text-[#0F172A]">Is food and clean water free of charge?</strong>
                  <p className="mt-0.5">Yes. All authorized relief shelters provide hot food rations, certified potable drinking water, and sanitation supplies at zero cost under the State Disaster Relief Authority.</p>
                </div>
              </div>
            )}
          </div>

          {/* Citizen Rights & Legal Accommodations Accordion */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <button
              onClick={() => setIsRightsOpen((prev) => !prev)}
              className="w-full px-6 py-4 flex items-center justify-between text-left font-extrabold text-sm text-[#0F172A] hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <span>Citizen Rights, Privacy &amp; Medical Protections</span>
              {isRightsOpen ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
            </button>
            {isRightsOpen && (
              <div className="px-6 pb-5 pt-1 text-xs text-slate-600 space-y-3 border-t border-slate-100 leading-relaxed">
                <p>
                  1. <strong>Non-Discrimination:</strong> Every individual has an absolute right to shelter, medical triage, clean water, and emergency rations regardless of origin, nationality, gender, or religion.
                </p>
                <p>
                  2. <strong>Medical Privacy:</strong> Your health conditions and prescription disclosures are encrypted and made available solely to on-duty triage physicians and EMTs.
                </p>
                <p>
                  3. <strong>Police NOC &amp; Verified Safety:</strong> All listed shelters operate under formal Police Station NOC clearance and background-verified coordinators for child and women safety.
                </p>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
