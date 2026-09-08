import React, { useState } from 'react';
import { useResq } from '../context/ResqContext';
import { Shelter, ShelterStatus } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { 
  Settings, 
  Search, 
  Filter, 
  Plus, 
  Edit3, 
  Eye, 
  CheckCircle, 
  AlertTriangle, 
  FileText, 
  Droplet, 
  HeartPulse, 
  ShieldCheck, 
  Radio
} from 'lucide-react';

interface AdminViewProps {
  onSelectShelter: (shelter: Shelter) => void;
}

export const AdminView: React.FC<AdminViewProps> = ({ onSelectShelter }) => {
  const { shelters, updateShelterStatus, userReports, showToast } = useResq();
  const [activeTab, setActiveTab] = useState<'shelters' | 'reports' | 'config'>('shelters');
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [sortKey, setSortKey] = useState<'occupancy' | 'name' | 'capacity'>('occupancy');

  const filteredShelters = shelters.filter((s) => {
    if (search.trim()) {
      const q = search.toLowerCase();
      if (!s.name.toLowerCase().includes(q) && !s.district.toLowerCase().includes(q) && !s.code.toLowerCase().includes(q)) {
        return false;
      }
    }
    if (filterStatus !== 'ALL' && s.status !== filterStatus) return false;
    return true;
  }).sort((a, b) => {
    if (sortKey === 'occupancy') {
      return (b.currentOccupancy / b.capacity) - (a.currentOccupancy / a.capacity);
    }
    if (sortKey === 'capacity') return b.capacity - a.capacity;
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="min-h-screen bg-[#F7F9FC] pb-12">
      
      {/* Header */}
      <div className="bg-[#12304A] text-white border-b border-slate-700 py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Settings className="w-4 h-4 text-blue-400" />
              <span className="text-xs font-mono font-bold tracking-widest text-blue-400 uppercase">
                DISTRICT ADMINISTRATION
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Shelter &amp; Registry Administration
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1">
              Configure shelter capacities, manage status overrides, audit citizen discrepancy flags, and broadcast alerts.
            </p>
          </div>

          {/* Tab Selector */}
          <div className="flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700">
            <button
              onClick={() => setActiveTab('shelters')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                activeTab === 'shelters' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:text-white'
              }`}
            >
              Shelter Master Table ({shelters.length})
            </button>
            <button
              onClick={() => setActiveTab('reports')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                activeTab === 'reports' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:text-white'
              }`}
            >
              Citizen Flags ({userReports.length})
            </button>
            <button
              onClick={() => setActiveTab('config')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                activeTab === 'config' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:text-white'
              }`}
            >
              EOC Config
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        
        {activeTab === 'shelters' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-6 space-y-4">
            
            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative flex-1 w-full sm:w-auto">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Filter by shelter name, code, or district..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="AVAILABLE">AVAILABLE</option>
                  <option value="LIMITED">LIMITED</option>
                  <option value="CRITICAL">CRITICAL</option>
                  <option value="OVERCAPACITY">OVERCAPACITY</option>
                  <option value="INACTIVE">CLOSED</option>
                </select>

                <select
                  value={sortKey}
                  onChange={(e) => setSortKey(e.target.value as any)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700"
                >
                  <option value="occupancy">Sort: Occupancy %</option>
                  <option value="capacity">Sort: Capacity</option>
                  <option value="name">Sort: Name</option>
                </select>
              </div>
            </div>

            {/* Desktop Table */}
            <div className="divide-y divide-slate-100 overflow-x-auto">
              <table className="w-full text-xs text-left min-w-[850px]">
                <thead className="bg-slate-50 text-slate-700 font-bold uppercase text-[11px]">
                  <tr>
                    <th className="p-3">Shelter</th>
                    <th className="p-3">District</th>
                    <th className="p-3">Occupancy</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Water Reserve</th>
                    <th className="p-3">Rations</th>
                    <th className="p-3">Medical</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredShelters.map((shelter) => {
                    const pct = Math.round((shelter.currentOccupancy / Math.max(1, shelter.capacity)) * 100);
                    return (
                      <tr key={shelter.id} className="hover:bg-slate-50/70">
                        <td className="p-3">
                          <div className="font-bold text-slate-900">{shelter.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{shelter.code}</div>
                        </td>

                        <td className="p-3 text-slate-600 font-medium">
                          {shelter.district}
                        </td>

                        <td className="p-3">
                          <div className="font-mono font-bold text-slate-900">
                            {shelter.currentOccupancy} / {shelter.capacity} ({pct}%)
                          </div>
                          <div className="w-28 bg-slate-100 rounded-full h-1.5 mt-1 overflow-hidden">
                            <div
                              style={{ width: `${Math.min(100, pct)}%` }}
                              className={`h-full ${pct >= 90 ? 'bg-rose-600' : pct >= 70 ? 'bg-amber-500' : 'bg-emerald-600'}`}
                            />
                          </div>
                        </td>

                        <td className="p-3">
                          <StatusBadge status={shelter.status} size="sm" />
                        </td>

                        <td className="p-3">
                          <span className={shelter.resources.waterLiters < 2000 ? 'text-rose-600 font-bold' : 'text-slate-700'}>
                            {shelter.resources.waterLiters.toLocaleString()} L
                          </span>
                        </td>

                        <td className="p-3 text-slate-700 font-medium">
                          {shelter.resources.rationKits} kits
                        </td>

                        <td className="p-3">
                          <span className={shelter.resources.medicalTeams === 0 ? 'text-rose-600 font-bold' : 'text-emerald-700 font-semibold'}>
                            {shelter.resources.medicalTeams > 0 ? `${shelter.resources.medicalTeams} Team` : 'No Team'}
                          </span>
                        </td>

                        <td className="p-3 text-right">
                          <button
                            onClick={() => onSelectShelter(shelter)}
                            className="px-2.5 py-1.5 bg-[#12304A] hover:bg-[#0B1F33] text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                          >
                            Open Drawer
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

          </div>
        )}

        {/* Tab 2: Citizen Reports */}
        {activeTab === 'reports' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-6 space-y-4">
            <h2 className="text-base font-bold text-slate-900">
              Citizen Discrepancy &amp; Field Reports ({userReports.length})
            </h2>
            <p className="text-xs text-slate-500">
              Crowdsourced evacuation reports flagged by citizens on the public map.
            </p>

            {userReports.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">
                No active citizen discrepancy reports submitted yet.
              </div>
            ) : (
              <div className="space-y-3">
                {userReports.map((rep) => (
                  <div key={rep.id} className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-sm bg-rose-100 text-rose-800 border border-rose-200">
                          {rep.reason}
                        </span>
                        <span className="text-xs font-bold text-slate-900">{rep.shelterName}</span>
                        <span className="text-[11px] text-slate-400">{new Date(rep.timestamp).toLocaleTimeString()}</span>
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed">{rep.details}</p>
                      <div className="text-[11px] text-slate-400 mt-1">Reported by: {rep.reportedBy || 'Citizen'}</div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => showToast('Report marked as verified by district telephone operator.', 'success')}
                        className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold"
                      >
                        Verify
                      </button>
                      <button
                        onClick={() => showToast('Report dismissed as resolved.', 'info')}
                        className="px-3 py-1.5 bg-slate-200 text-slate-700 rounded-lg text-xs font-bold"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: System Emergency Thresholds */}
        {activeTab === 'config' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-6 space-y-5 max-w-2xl">
            <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
              Emergency Response Thresholds
            </h2>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Critical Capacity Surge Alert Threshold (%)
                </label>
                <input
                  type="number"
                  defaultValue={90}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-bold text-slate-900"
                />
                <span className="text-[11px] text-slate-500">
                  Shelters crossing this percentage automatically broadcast CRITICAL alerts.
                </span>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Water Shortage Trigger Ratio (%)
                </label>
                <input
                  type="number"
                  defaultValue={25}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-bold text-slate-900"
                />
                <span className="text-[11px] text-slate-500">
                  Triggers AMC Municipal water tanker deployment protocol.
                </span>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => showToast('Emergency threshold configuration saved.', 'success')}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md cursor-pointer"
                >
                  Save Configuration
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
