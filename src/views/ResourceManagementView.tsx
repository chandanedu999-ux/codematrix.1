import React, { useState } from 'react';
import { useResq } from '../context/ResqContext';
import { Shelter, ResourceTransaction } from '../types';
import { 
  Package, 
  Droplet, 
  Bed, 
  Utensils, 
  HeartPulse, 
  Plus, 
  Minus, 
  ArrowRightLeft, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Filter, 
  Search, 
  Truck,
  Building,
  ShieldAlert,
  ChevronRight
} from 'lucide-react';

interface ResourceManagementViewProps {
  onSelectShelter: (shelter: Shelter) => void;
}

export const ResourceManagementView: React.FC<ResourceManagementViewProps> = ({
  onSelectShelter
}) => {
  const { 
    shelters, 
    resourceTransactions, 
    recordResourceTransaction, 
    getShelterPriority 
  } = useResq();

  const [modalOpen, setModalOpen] = useState(false);
  const [modalAction, setModalAction] = useState<'DELIVERY' | 'CONSUMPTION' | 'TRANSFER' | 'SHORTAGE_REPORT'>('DELIVERY');
  const [targetShelterId, setTargetShelterId] = useState(shelters[0]?.id || 'sh-01');
  const [resourceType, setResourceType] = useState<'beds' | 'ration' | 'water' | 'medical'>('ration');
  const [quantity, setQuantity] = useState<number>(100);
  const [donorOrRecipient, setDonorOrRecipient] = useState('Ahmedabad District Relief Depot');
  const [recordedBy, setRecordedBy] = useState('Logistics Officer — Patel');
  const [notes, setNotes] = useState('');

  // Aggregate stats across all shelters
  const totalBedsAvail = shelters.reduce((acc, s) => acc + s.resources.bedsAvailable, 0);
  const totalBedsReq = shelters.reduce((acc, s) => acc + s.resources.bedsRequired, 0);
  const totalBedsShortage = Math.max(0, totalBedsReq - totalBedsAvail);

  const totalWaterAvail = shelters.reduce((acc, s) => acc + s.resources.waterLiters, 0);
  const totalWaterReq = shelters.reduce((acc, s) => acc + s.resources.waterRequired, 0);
  const totalWaterShortage = Math.max(0, totalWaterReq - totalWaterAvail);

  const totalRationsAvail = shelters.reduce((acc, s) => acc + s.resources.rationKits, 0);
  const totalRationsReq = shelters.reduce((acc, s) => acc + s.resources.rationRequired, 0);
  const totalRationsShortage = Math.max(0, totalRationsReq - totalRationsAvail);

  const totalMedAvail = shelters.reduce((acc, s) => acc + s.resources.medicalTeams, 0);
  const totalMedReq = shelters.reduce((acc, s) => acc + s.resources.medicalTeamsRequired, 0);
  const totalMedShortage = Math.max(0, totalMedReq - totalMedAvail);

  const handleOpenModal = (
    action: 'DELIVERY' | 'CONSUMPTION' | 'TRANSFER' | 'SHORTAGE_REPORT',
    shelterId?: string,
    type?: 'beds' | 'ration' | 'water' | 'medical'
  ) => {
    setModalAction(action);
    if (shelterId) setTargetShelterId(shelterId);
    if (type) setResourceType(type);
    setModalOpen(true);
  };

  const handleSubmitTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    const sh = shelters.find((s) => s.id === targetShelterId) || shelters[0];
    recordResourceTransaction({
      shelterId: sh.id,
      shelterName: sh.name,
      type: resourceType,
      quantity: Number(quantity) || 1,
      action: modalAction,
      donorOrRecipient: donorOrRecipient.trim() || 'Official Dispatch',
      recordedBy: recordedBy.trim() || 'Logistics Officer',
      notes: notes.trim()
    });
    setModalOpen(false);
    setNotes('');
  };

  // Sort shelters by priority score descending
  const prioritizedShelters = [...shelters].sort((a, b) => {
    const pA = getShelterPriority(a).score;
    const pB = getShelterPriority(b).score;
    return pB - pA;
  });

  return (
    <div className="min-h-screen bg-[#F7F9FC] pb-12">
      
      {/* Header */}
      <div className="bg-[#12304A] text-white border-b border-slate-700 py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Package className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-mono font-bold tracking-widest text-amber-400 uppercase">
                LOGISTICS &amp; RELIEF PIPELINE
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Resource Management &amp; Auditing
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1">
              Track inventory, dispatch deliveries, audit supply consumption, and calculate relief priorities.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleOpenModal('DELIVERY')}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs shadow-md cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Record Delivery</span>
            </button>
            <button
              onClick={() => handleOpenModal('CONSUMPTION')}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 font-bold py-2.5 px-4 rounded-xl text-xs cursor-pointer"
            >
              <Minus className="w-4 h-4" />
              <span>Log Consumption</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        
        {/* 4 Core Resource Metric Cards */}
        <section aria-label="Essential Relief Resources" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Beds */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-50 text-indigo-700 rounded-lg">
                  <Bed className="w-5 h-5" />
                </div>
                <span className="font-bold text-slate-900 text-sm">Emergency Beds</span>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                totalBedsShortage > 200 ? 'bg-rose-50 text-rose-800 border-rose-200' : 'bg-amber-50 text-amber-800 border-amber-200'
              }`}>
                {totalBedsShortage > 0 ? 'Shortage' : 'Sufficient'}
              </span>
            </div>

            <div className="space-y-1.5 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Available:</span>
                <span className="font-bold text-slate-900 text-sm">{totalBedsAvail.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Required Buffer:</span>
                <span className="font-medium">{totalBedsReq.toLocaleString()}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-100 font-bold text-rose-700">
                <span>Total Shortage:</span>
                <span>{totalBedsShortage.toLocaleString()} beds</span>
              </div>
            </div>
          </div>

          {/* Clean Water */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-50 text-blue-700 rounded-lg">
                  <Droplet className="w-5 h-5" />
                </div>
                <span className="font-bold text-slate-900 text-sm">Drinking Water</span>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                totalWaterAvail < (totalWaterReq * 0.4) ? 'bg-rose-50 text-rose-800 border-rose-200' : 'bg-emerald-50 text-emerald-800 border-emerald-200'
              }`}>
                {totalWaterAvail < (totalWaterReq * 0.4) ? 'Critical Low' : 'Adequate'}
              </span>
            </div>

            <div className="space-y-1.5 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Available:</span>
                <span className="font-bold text-slate-900 text-sm">{totalWaterAvail.toLocaleString()} L</span>
              </div>
              <div className="flex justify-between">
                <span>Required 24h Buffer:</span>
                <span className="font-medium">{totalWaterReq.toLocaleString()} L</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-100 font-bold text-rose-700">
                <span>Deficit:</span>
                <span>{totalWaterShortage.toLocaleString()} L</span>
              </div>
            </div>
          </div>

          {/* Ration Kits */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-50 text-amber-700 rounded-lg">
                  <Utensils className="w-5 h-5" />
                </div>
                <span className="font-bold text-slate-900 text-sm">Dry Ration Kits</span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-emerald-50 text-emerald-800 border-emerald-200">
                Active Supply
              </span>
            </div>

            <div className="space-y-1.5 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Available:</span>
                <span className="font-bold text-slate-900 text-sm">{totalRationsAvail.toLocaleString()} kits</span>
              </div>
              <div className="flex justify-between">
                <span>Required:</span>
                <span className="font-medium">{totalRationsReq.toLocaleString()} kits</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-100 font-bold text-amber-700">
                <span>Pending Demand:</span>
                <span>{totalRationsShortage.toLocaleString()} kits</span>
              </div>
            </div>
          </div>

          {/* Medical Teams */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-rose-50 text-rose-700 rounded-lg">
                  <HeartPulse className="w-5 h-5" />
                </div>
                <span className="font-bold text-slate-900 text-sm">Medical Units</span>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                totalMedShortage > 0 ? 'bg-rose-50 text-rose-800 border-rose-200' : 'bg-emerald-50 text-emerald-800 border-emerald-200'
              }`}>
                {totalMedShortage > 0 ? 'Understaffed' : 'Sufficient'}
              </span>
            </div>

            <div className="space-y-1.5 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Deployed Teams:</span>
                <span className="font-bold text-slate-900 text-sm">{totalMedAvail} teams</span>
              </div>
              <div className="flex justify-between">
                <span>Required Units:</span>
                <span className="font-medium">{totalMedReq} teams</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-100 font-bold text-rose-700">
                <span>Field Shortage:</span>
                <span>{totalMedShortage} team{totalMedShortage === 1 ? '' : 's'}</span>
              </div>
            </div>
          </div>

        </section>

        {/* Priority Dispatch Calculator Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-600" />
                <span>Automated Resource Allocation Priority</span>
              </h2>
              <p className="text-xs text-slate-500">
                Calculated dynamically based on occupancy load, water buffer hours, and medical cover.
              </p>
            </div>
            <span className="text-xs text-slate-500">Sorted by Urgency</span>
          </div>

          <div className="divide-y divide-slate-100 overflow-x-auto">
            <table className="w-full text-xs text-left min-w-[640px]">
              <thead className="bg-slate-50 text-slate-700 uppercase font-bold text-[11px]">
                <tr>
                  <th className="p-3">Shelter</th>
                  <th className="p-3">Priority Level</th>
                  <th className="p-3">Water Status</th>
                  <th className="p-3">Rations</th>
                  <th className="p-3">Medical</th>
                  <th className="p-3">Rationale &amp; Decision</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {prioritizedShelters.slice(0, 7).map((shelter) => {
                  const pri = getShelterPriority(shelter);
                  const waterRatio = Math.round((shelter.resources.waterLiters / Math.max(1, shelter.resources.waterRequired)) * 100);
                  return (
                    <tr key={shelter.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3">
                        <button
                          onClick={() => onSelectShelter(shelter)}
                          className="font-bold text-slate-900 hover:text-blue-600 text-left cursor-pointer"
                        >
                          {shelter.name}
                        </button>
                        <div className="text-[10px] text-slate-400 font-mono">{shelter.code}</div>
                      </td>

                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full font-extrabold text-[10px] border ${
                          pri.level === 'CRITICAL' ? 'bg-rose-100 text-rose-800 border-rose-300' :
                          pri.level === 'HIGH' ? 'bg-amber-100 text-amber-800 border-amber-300' :
                          'bg-emerald-100 text-emerald-800 border-emerald-300'
                        }`}>
                          {pri.level} ({pri.score} pts)
                        </span>
                      </td>

                      <td className="p-3">
                        <span className={`font-semibold ${waterRatio < 25 ? 'text-rose-600 font-bold' : 'text-slate-700'}`}>
                          {shelter.resources.waterLiters.toLocaleString()} L ({waterRatio}%)
                        </span>
                      </td>

                      <td className="p-3">
                        <span className="font-semibold text-slate-700">
                          {shelter.resources.rationKits} kits
                        </span>
                      </td>

                      <td className="p-3">
                        <span className={`font-semibold ${shelter.resources.medicalTeams === 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
                          {shelter.resources.medicalTeams} team{shelter.resources.medicalTeams === 1 ? '' : 's'}
                        </span>
                      </td>

                      <td className="p-3 max-w-xs text-slate-600 leading-snug">
                        {pri.rationale}
                      </td>

                      <td className="p-3 text-right">
                        <button
                          onClick={() => handleOpenModal('DELIVERY', shelter.id)}
                          className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-2xs"
                        >
                          Dispatch Relief
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Auditable Transaction Log */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Auditable Relief Delivery &amp; Consumption Ledger
              </h2>
              <p className="text-xs text-slate-500">
                Every transaction records donor identity, receiving officer, time, and inventory adjustments.
              </p>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              Total Logged: {resourceTransactions.length} events
            </span>
          </div>

          <div className="divide-y divide-slate-100 overflow-x-auto">
            <table className="w-full text-xs text-left min-w-[700px]">
              <thead className="bg-slate-50 text-slate-700 font-bold uppercase text-[11px]">
                <tr>
                  <th className="p-3">Timestamp</th>
                  <th className="p-3">Shelter</th>
                  <th className="p-3">Action</th>
                  <th className="p-3">Resource &amp; Qty</th>
                  <th className="p-3">Donor / Recipient</th>
                  <th className="p-3">Recorded By</th>
                  <th className="p-3">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {resourceTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/60">
                    <td className="p-3 text-slate-500 whitespace-nowrap">
                      {new Date(tx.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="p-3 font-bold text-slate-900">
                      {tx.shelterName}
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        tx.action === 'DELIVERY' ? 'bg-emerald-100 text-emerald-800' :
                        tx.action === 'CONSUMPTION' ? 'bg-slate-200 text-slate-800' :
                        tx.action === 'TRANSFER' ? 'bg-blue-100 text-blue-800' :
                        'bg-rose-100 text-rose-800'
                      }`}>
                        {tx.action}
                      </span>
                    </td>
                    <td className="p-3 font-bold text-slate-900">
                      +{tx.quantity} {tx.type}
                    </td>
                    <td className="p-3 text-slate-700">
                      {tx.donorOrRecipient}
                    </td>
                    <td className="p-3 text-slate-600">
                      {tx.recordedBy}
                    </td>
                    <td className="p-3 text-slate-500 italic max-w-xs truncate">
                      {tx.notes || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Record Transaction Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3 mb-4">
              Log Resource {modalAction}
            </h3>

            <form onSubmit={handleSubmitTransaction} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Destination Shelter
                </label>
                <select
                  value={targetShelterId}
                  onChange={(e) => setTargetShelterId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 font-semibold"
                >
                  {shelters.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.district})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Resource Category
                  </label>
                  <select
                    value={resourceType}
                    onChange={(e) => setResourceType(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 font-semibold"
                  >
                    <option value="ration">🍲 Dry Ration Kits</option>
                    <option value="water">💧 Drinking Water (Liters)</option>
                    <option value="beds">🛏️ Cots / Beds</option>
                    <option value="medical">🩺 Medical Team Unit</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Quantity
                  </label>
                  <input
                    type="number"
                    value={quantity}
                    min={1}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 font-semibold"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Donor Organization / Transport Vehicle
                </label>
                <input
                  type="text"
                  value={donorOrRecipient}
                  onChange={(e) => setDonorOrRecipient(e.target.value)}
                  placeholder="e.g. Red Cross, AMC Water Works Tanker #08, SEWA NGO"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Officer Recording Event
                </label>
                <input
                  type="text"
                  value={recordedBy}
                  onChange={(e) => setRecordedBy(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Notes / Batch Verification
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. 50 sealed boxes inspected, expiry 2027..."
                  rows={2}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer"
                >
                  Record &amp; Sync Inventory
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
