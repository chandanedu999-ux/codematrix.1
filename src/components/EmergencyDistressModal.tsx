import React, { useState } from 'react';
import { useResq } from '../context/ResqContext';
import { 
  X, 
  AlertOctagon, 
  Phone, 
  MapPin, 
  Users, 
  ShieldAlert, 
  Radio, 
  CheckCircle2 
} from 'lucide-react';

interface EmergencyDistressModalProps {
  isOpen: boolean;
  onClose: () => void;
  userCoordinates: [number, number] | null;
}

export const EmergencyDistressModal: React.FC<EmergencyDistressModalProps> = ({
  isOpen,
  onClose,
  userCoordinates
}) => {
  const { submitDistressCall, showToast } = useResq();

  const [callerName, setCallerName] = useState('');
  const [callerPhone, setCallerPhone] = useState('');
  const [locationDetails, setLocationDetails] = useState(
    userCoordinates ? `Near GPS: ${userCoordinates[0].toFixed(5)}, ${userCoordinates[1].toFixed(5)}` : ''
  );
  const [peopleCount, setPeopleCount] = useState<number>(2);
  const [urgentNeeds, setUrgentNeeds] = useState<string[]>(['Immediate Evacuation', 'Drinking Water']);
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const toggleNeed = (need: string) => {
    setUrgentNeeds((prev) =>
      prev.includes(need) ? prev.filter((n) => n !== need) : [...prev, need]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!callerName.trim() || !callerPhone.trim() || !locationDetails.trim()) {
      showToast('Please provide your name, phone number, and location.', 'warning');
      return;
    }

    submitDistressCall({
      callerName,
      callerPhone,
      locationDetails,
      peopleCount: Number(peopleCount),
      urgentNeeds,
      additionalNotes
    });

    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      onClose();
    }, 2500);
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-xl bg-[#F8FAFC] rounded-2xl shadow-2xl border border-[#E2E8F0] overflow-hidden">
        
        {/* Header - Deep Slate #0F172A with Hazard Red Accents */}
        <div className="bg-[#0F172A] text-white px-6 py-4 flex items-center justify-between border-b-2 border-[#DC2626]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#DC2626]/20 text-[#DC2626] rounded-lg border border-[#DC2626]/40">
              <AlertOctagon className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight text-[#FFFFFF] flex items-center gap-2">
                <span>SOS BROADCAST & DISTRESS CALL</span>
                <span className="bg-[#DC2626] text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse">
                  HIGH ALERT
                </span>
              </h2>
              <p className="text-xs text-[#E2E8F0]">Instant dispatch to District Disaster Operations & Nearest Responders</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        {submitted ? (
          <div className="p-8 text-center bg-[#F8FAFC]">
            <div className="w-16 h-16 mx-auto bg-emerald-100 text-[#059669] rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-bold text-[#0F172A] mb-2">Distress Broadcast Transmitted</h3>
            <p className="text-sm text-[#475569] max-w-md mx-auto mb-4">
              Your GPS coordinates and emergency dispatch request have been routed to the District Emergency Response Authority and active staging shelters.
            </p>
            <div className="bg-white p-3 rounded-xl border border-[#E2E8F0] text-xs text-[#0F172A] font-semibold">
              Emergency Disaster Helpline: <span className="text-[#EA580C] font-mono text-sm">1077 / +91 79 2325 1900</span>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            
            {/* Instruction text with #475569 */}
            <p className="text-xs text-[#475569] leading-relaxed">
              Submit this emergency form if you or individuals around you require immediate rescue, life-saving evacuation, or are cut off from basic supplies.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-[#0F172A] mb-1">
                  Caller / Contact Full Name <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Anand Patel"
                  value={callerName}
                  onChange={(e) => setCallerName(e.target.value)}
                  className="w-full text-sm px-3.5 py-2.5 bg-[#FFFFFF] border-2 border-[#E2E8F0] rounded-lg focus:border-[#0F172A] focus:outline-none text-[#0F172A]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0F172A] mb-1">
                  Emergency Mobile Phone <span className="text-rose-600">*</span>
                </label>
                <input
                  type="tel"
                  required
                  placeholder="+91 98251 00000"
                  value={callerPhone}
                  onChange={(e) => setCallerPhone(e.target.value)}
                  className="w-full text-sm px-3.5 py-2.5 bg-[#FFFFFF] border-2 border-[#E2E8F0] rounded-lg focus:border-[#0F172A] focus:outline-none text-[#0F172A]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-[#0F172A] mb-1">
                  Current Landmark / Trapped Location <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 2nd Floor, Near Bhaijipura Cross Road, Waterlogged Street"
                  value={locationDetails}
                  onChange={(e) => setLocationDetails(e.target.value)}
                  className="w-full text-sm px-3.5 py-2.5 bg-[#FFFFFF] border-2 border-[#E2E8F0] rounded-lg focus:border-[#0F172A] focus:outline-none text-[#0F172A]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0F172A] mb-1">
                  Number of Persons Evacuating
                </label>
                <input
                  type="number"
                  min={1}
                  max={200}
                  value={peopleCount}
                  onChange={(e) => setPeopleCount(Number(e.target.value))}
                  className="w-full text-sm px-3.5 py-2.5 bg-[#FFFFFF] border-2 border-[#E2E8F0] rounded-lg focus:border-[#0F172A] focus:outline-none text-[#0F172A]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0F172A] mb-1">
                  Medical / Mobility Urgency
                </label>
                <select
                  className="w-full text-sm px-3.5 py-2.5 bg-[#FFFFFF] border-2 border-[#E2E8F0] rounded-lg focus:border-[#0F172A] focus:outline-none text-[#0F172A]"
                >
                  <option>Non-Ambulatory / Elderly Present</option>
                  <option>Infant / Pregnant Mother Present</option>
                  <option>Medical Trauma / Bleeding</option>
                  <option>General Evacuation Needed</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-[#0F172A] mb-1.5">
                  Critical Supplies Needed Immediately
                </label>
                <div className="flex flex-wrap gap-2">
                  {['Immediate Evacuation', 'Drinking Water', 'Food Rations', 'Trauma Doctor', 'Lifeboat / Raft', 'Baby Formula'].map((need) => (
                    <button
                      type="button"
                      key={need}
                      onClick={() => toggleNeed(need)}
                      className={`text-xs px-3 py-1.5 rounded-lg border-2 font-medium cursor-pointer transition-colors ${
                        urgentNeeds.includes(need)
                          ? 'bg-[#0F172A] text-white border-[#0F172A]'
                          : 'bg-white text-[#475569] border-[#E2E8F0] hover:border-slate-400'
                      }`}
                    >
                      {urgentNeeds.includes(need) ? '✓ ' : '+ '}
                      {need}
                    </button>
                  ))}
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-[#0F172A] mb-1">
                  Specific Survival / Access Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Water level rising to 3 feet, access possible only by high-clearance truck or boat."
                  value={additionalNotes}
                  onChange={(e) => setAdditionalNotes(e.target.value)}
                  className="w-full text-sm px-3.5 py-2 bg-[#FFFFFF] border-2 border-[#E2E8F0] rounded-lg focus:border-[#0F172A] focus:outline-none text-[#0F172A]"
                />
              </div>
            </div>

            {/* MANDATORY COMPULSORY PRIMARY ACTION: Massive #EA580C button */}
            <div className="pt-2">
              <button
                type="submit"
                className="w-full bg-[#EA580C] hover:bg-orange-700 text-[#FFFFFF] text-base font-extrabold tracking-wide py-4 px-6 rounded-xl shadow-xl transition-all hover:shadow-2xl cursor-pointer flex items-center justify-center gap-2 uppercase"
              >
                <ShieldAlert className="w-6 h-6" />
                <span>SUBMIT DISTRESS CALL</span>
              </button>
              <div className="text-center mt-2">
                <span className="text-[11px] text-[#475569]">
                  Immediate 24x7 Government Helpline: <strong className="text-[#0F172A]">1077</strong>
                </span>
              </div>
            </div>

          </form>
        )}

      </div>
    </div>
  );
};
