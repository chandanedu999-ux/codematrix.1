import React, { useState } from 'react';
import { useResq } from '../context/ResqContext';
import { Shelter, ActivityEvent } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { OccupancyBar } from '../components/OccupancyBar';
import { 
  Building2, 
  Users, 
  Maximize2, 
  CheckCircle2, 
  AlertOctagon, 
  AlertTriangle, 
  ArrowUpRight, 
  UserPlus, 
  PackagePlus, 
  TrendingUp, 
  Clock, 
  ShieldAlert, 
  Droplet, 
  HeartPulse, 
  Filter, 
  ChevronRight 
} from 'lucide-react';

interface OperationsDashboardViewProps {
  onSelectShelter: (shelter: Shelter) => void;
  onNavigateToIntake: () => void;
  onNavigateToResources: () => void;
  onNavigateToAlerts: () => void;
}

export const OperationsDashboardView: React.FC<OperationsDashboardViewProps> = ({
  onSelectShelter,
  onNavigateToIntake,
  onNavigateToResources,
  onNavigateToAlerts
}) => {
  const { shelters, activity, alerts } = useResq();
  const [filterMode, setFilterMode] = useState<'ALL' | 'CRITICAL' | 'LIMITED' | 'AVAILABLE'>('ALL');

  // KPI Calculations
  const activeShelters = shelters.filter((s) => s.status !== 'INACTIVE').length;
  const totalOccupancy = shelters.reduce((acc, s) => acc + s.currentOccupancy, 0);
  const totalCapacity = shelters.reduce((acc, s) => acc + s.capacity, 0);
  const availableCapacity = Math.max(0, totalCapacity - totalOccupancy);
  const overallOccupancyPercent = Math.round((totalOccupancy / Math.max(1, totalCapacity)) * 100);

  const criticalSheltersCount = shelters.filter(
    (s) => s.status === 'CRITICAL' || s.status === 'OVERCAPACITY' || (s.currentOccupancy / s.capacity) >= 0.9
  ).length;

  const unresolvedAlertsCount = alerts.filter((a) => !a.resolved).length;

  // Sorted shelters by occupancy ratio
  const mostOccupiedShelters = [...shelters]
    .filter((s) => s.status !== 'INACTIVE')
    .sort((a, b) => (b.currentOccupancy / b.capacity) - (a.currentOccupancy / a.capacity));

  const filteredShelters = mostOccupiedShelters.filter((s) => {
    if (filterMode === 'CRITICAL') return s.status === 'CRITICAL' || s.status === 'OVERCAPACITY';
    if (filterMode === 'LIMITED') return s.status === 'LIMITED';
    if (filterMode === 'AVAILABLE') return s.status === 'AVAILABLE';
    return true;
  });

  return (
    <div className="min-h-screen bg-[#F7F9FC] pb-12">
      
      {/* Top EOC Command Header */}
      <div className="bg-[#12304A] text-white border-b border-slate-700 py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-xs font-mono font-bold tracking-widest text-emerald-400 uppercase">
                EMERGENCY OPERATIONS CENTER (EOC)
              </span>
              <span className="text-xs text-slate-400">| Sector 01 Command</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Command &amp; Coordination Center
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1">
              Real-time situational awareness across municipal shelters, bed allocations, and critical shortages.
            </p>
          </div>

          {/* Quick Command Actions */}
          <div className="flex items-center gap-2.5">
            <button
              id="dash-quick-intake-btn"
              onClick={onNavigateToIntake}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition-colors shadow-sm cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Fast Resident Intake</span>
            </button>
            <button
              id="dash-quick-resources-btn"
              onClick={onNavigateToResources}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              <PackagePlus className="w-4 h-4 text-amber-400" />
              <span>Log Relief Delivery</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        
        {/* 6 Premium KPI Cards */}
        <section aria-label="Key Performance Indicators" className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
          
          {/* 1. Active Shelters */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-2">
              <span>Active Shelters</span>
              <Building2 className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900">{activeShelters}</div>
            <div className="text-[11px] font-bold text-emerald-700 flex items-center gap-1 mt-1">
              <span>↑ 8 today</span>
            </div>
          </div>

          {/* 2. People Sheltered */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-2">
              <span>People Sheltered</span>
              <Users className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900">{totalOccupancy.toLocaleString()}</div>
            <div className="text-[11px] font-bold text-indigo-700 flex items-center gap-1 mt-1">
              <span>↑ 1,240 today</span>
            </div>
          </div>

          {/* 3. Total Capacity */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-2">
              <span>Total Capacity</span>
              <Maximize2 className="w-4 h-4 text-slate-600" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900">{totalCapacity.toLocaleString()}</div>
            <div className="text-[11px] text-slate-500 mt-1">
              beds &amp; space max
            </div>
          </div>

          {/* 4. Available Spaces */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-2">
              <span>Available Spaces</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-700">{availableCapacity.toLocaleString()}</div>
            <div className="text-[11px] text-emerald-600 font-medium mt-1">
              ready for arrival
            </div>
          </div>

          {/* 5. Critical Shelters (Clickable Filter) */}
          <button
            onClick={() => setFilterMode(filterMode === 'CRITICAL' ? 'ALL' : 'CRITICAL')}
            className={`p-4 rounded-xl border text-left transition-all cursor-pointer shadow-2xs ${
              filterMode === 'CRITICAL'
                ? 'bg-rose-100 border-rose-400 ring-2 ring-rose-500/20'
                : 'bg-rose-50/70 hover:bg-rose-100/70 border-rose-200'
            }`}
          >
            <div className="flex items-center justify-between text-rose-800 text-xs font-bold mb-2">
              <span>Critical Shelters</span>
              <AlertOctagon className="w-4 h-4 text-rose-600 animate-pulse" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-rose-900">{criticalSheltersCount}</div>
            <div className="text-[11px] font-bold text-rose-700 mt-1">
              🔴 Immediate attention
            </div>
          </button>

          {/* 6. Resource Alerts (Clickable to Alerts) */}
          <button
            onClick={onNavigateToAlerts}
            className="bg-amber-50/70 hover:bg-amber-100/70 p-4 rounded-xl border border-amber-200 text-left transition-all cursor-pointer shadow-2xs"
          >
            <div className="flex items-center justify-between text-amber-900 text-xs font-bold mb-2">
              <span>Resource Alerts</span>
              <AlertTriangle className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-amber-900">{unresolvedAlertsCount}</div>
            <div className="text-[11px] font-bold text-amber-700 mt-1">
              ⚠ Requires action
            </div>
          </button>

        </section>

        {/* Live Occupancy Overview & Crisis Triage */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left: Overall Capacity Distribution Visualization */}
          <div className="lg:col-span-8 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Network Shelter Capacity Overview
                </h2>
                <p className="text-xs text-slate-500">
                  Aggregate population distribution across operational evacuation sites
                </p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black text-slate-900">{overallOccupancyPercent}%</span>
                <span className="text-xs text-slate-500 block">
                  {totalOccupancy.toLocaleString()} / {totalCapacity.toLocaleString()} sheltered
                </span>
              </div>
            </div>

            {/* Stacked Capacity Progress Bar */}
            <div>
              <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
                <div 
                  style={{ width: `${Math.min(100, overallOccupancyPercent)}%` }}
                  className="bg-blue-600 h-full transition-all duration-700"
                  title="Sheltered Residents"
                />
                <div 
                  style={{ width: `${Math.max(0, 100 - overallOccupancyPercent)}%` }}
                  className="bg-emerald-500/30 h-full"
                  title="Available Capacity"
                />
              </div>
              <div className="flex items-center justify-between text-xs text-slate-600 mt-2 font-medium">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-xs bg-blue-600 inline-block"></span>
                  <span>Sheltered ({totalOccupancy.toLocaleString()})</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-xs bg-emerald-500/40 inline-block border border-emerald-500"></span>
                  <span>Available Spaces ({availableCapacity.toLocaleString()})</span>
                </div>
              </div>
            </div>

            {/* Most Occupied Shelters Table */}
            <div className="pt-2">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Shelters Occupancy Ladder
                  </h3>
                  {filterMode !== 'ALL' && (
                    <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                      Filtered: {filterMode} ({filteredShelters.length})
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setFilterMode('ALL')}
                    className={`px-2 py-1 rounded-md text-xs font-semibold ${filterMode === 'ALL' ? 'bg-slate-200 text-slate-900' : 'text-slate-500 hover:text-slate-800'}`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setFilterMode('CRITICAL')}
                    className={`px-2 py-1 rounded-md text-xs font-semibold ${filterMode === 'CRITICAL' ? 'bg-rose-600 text-white' : 'text-slate-500 hover:text-slate-800'}`}
                  >
                    Critical
                  </button>
                  <button
                    onClick={() => setFilterMode('LIMITED')}
                    className={`px-2 py-1 rounded-md text-xs font-semibold ${filterMode === 'LIMITED' ? 'bg-amber-500 text-white' : 'text-slate-500 hover:text-slate-800'}`}
                  >
                    Limited
                  </button>
                  <button
                    onClick={() => setFilterMode('AVAILABLE')}
                    className={`px-2 py-1 rounded-md text-xs font-semibold ${filterMode === 'AVAILABLE' ? 'bg-emerald-600 text-white' : 'text-slate-500 hover:text-slate-800'}`}
                  >
                    Available
                  </button>
                </div>
              </div>

              <div className="divide-y divide-slate-100 max-h-[380px] overflow-y-auto">
                {filteredShelters.map((shelter) => {
                  const pct = Math.round((shelter.currentOccupancy / Math.max(1, shelter.capacity)) * 100);
                  return (
                    <div
                      key={shelter.id}
                      onClick={() => onSelectShelter(shelter)}
                      className="py-3 px-2 flex items-center justify-between hover:bg-slate-50 rounded-lg cursor-pointer transition-colors group"
                    >
                      <div className="flex-1 pr-4">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-900 group-hover:text-blue-600 transition-colors">
                            {shelter.name}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {shelter.district}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="w-48 bg-slate-100 rounded-full h-2 overflow-hidden">
                            <div
                              style={{ width: `${Math.min(100, pct)}%` }}
                              className={`h-full rounded-full ${
                                pct >= 90 ? 'bg-rose-600' : pct >= 70 ? 'bg-amber-500' : 'bg-emerald-600'
                              }`}
                            />
                          </div>
                          <span className="text-xs font-mono font-bold text-slate-700">
                            {pct}% ({shelter.currentOccupancy}/{shelter.capacity})
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <StatusBadge status={shelter.status} size="sm" />
                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-transform group-hover:translate-x-0.5" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Right: Live Real-Time Activity Feed */}
          <div className="lg:col-span-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
                <h2 className="text-base font-bold text-slate-900">Live Field Activity</h2>
              </div>
              <span className="text-xs text-slate-400 font-mono">Real-time sync</span>
            </div>

            <div className="space-y-4 flex-1 overflow-y-auto max-h-[480px] pr-1">
              {activity.map((event) => (
                <div key={event.id} className="text-xs flex items-start gap-2.5 pb-3 border-b border-slate-50 last:border-0">
                  <div className="p-1.5 rounded-md bg-slate-100 text-slate-600 shrink-0 mt-0.5 font-bold text-[10px]">
                    {event.badge || 'Event'}
                  </div>
                  <div className="flex-1">
                    <p className="text-slate-800 font-medium leading-snug">{event.message}</p>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      {event.shelterName && <span>&bull; {event.shelterName}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-slate-100 text-center">
              <button
                onClick={onNavigateToAlerts}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center justify-center gap-1 mx-auto"
              >
                <span>View All System Alerts ({unresolvedAlertsCount})</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
