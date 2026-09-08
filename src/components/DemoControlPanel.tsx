import React, { useState } from 'react';
import { useResq } from '../context/ResqContext';
import { 
  Users, 
  AlertTriangle, 
  Droplet, 
  PackageCheck, 
  XOctagon, 
  RotateCcw, 
  Wifi, 
  WifiOff, 
  Sparkles,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface DemoControlPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DemoControlPanel: React.FC<DemoControlPanelProps> = ({ isOpen, onClose }) => {
  const { 
    shelters,
    simulateArrivals,
    simulateCriticalCapacity,
    simulateWaterShortage,
    simulateResourceDelivery,
    simulateShelterClosure,
    resetDemoData,
    isOnline,
    setIsOnline
  } = useResq();

  const [selectedShelterId, setSelectedShelterId] = useState(shelters[1]?.id || 'sh-02');

  if (!isOpen) return null;

  return (
    <aside 
      id="hackathon-judge-demo-bar" 
      aria-label="Hackathon judge simulation panel"
      className="bg-amber-950/95 text-amber-100 border-b-2 border-amber-500 shadow-xl px-4 py-3 z-40 transition-all"
    >
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        
        {/* Header / Notice */}
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-amber-500/20 rounded-lg text-amber-400 border border-amber-500/40">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs uppercase font-extrabold tracking-wider bg-amber-500 text-slate-950 px-1.5 py-0.5 rounded-sm">
                JUDGE DEMO CONTROLS
              </span>
              <span className="text-xs text-amber-300/80 font-medium">Ahmedabad Flood Simulation</span>
            </div>
            <p className="text-[11px] text-amber-200/70">
              Trigger real-time state events to evaluate live occupancy, alert creation, and offline resilience.
            </p>
          </div>
        </div>

        {/* Shelter selector for simulation */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <label htmlFor="sim-target-shelter" className="text-xs text-amber-300 font-semibold shrink-0">
            Target Shelter:
          </label>
          <select
            id="sim-target-shelter"
            value={selectedShelterId}
            onChange={(e) => setSelectedShelterId(e.target.value)}
            className="bg-amber-900/80 text-amber-100 text-xs px-2 py-1.5 rounded-md border border-amber-600 focus:outline-hidden focus:ring-1 focus:ring-amber-400 max-w-[220px] truncate"
          >
            {shelters.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.currentOccupancy}/{s.capacity})
              </option>
            ))}
          </select>
        </div>

        {/* Action Trigger Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          
          <button
            id="demo-btn-arrivals"
            onClick={() => simulateArrivals(selectedShelterId, 15)}
            title="Simulate 15 urgent evacuee arrivals"
            className="flex items-center gap-1 bg-amber-500 hover:bg-amber-400 text-slate-950 px-2.5 py-1.5 rounded-md text-xs font-bold transition-colors cursor-pointer shadow-xs"
          >
            <Users className="w-3.5 h-3.5" />
            <span>+15 Arrivals</span>
          </button>

          <button
            id="demo-btn-surge-critical"
            onClick={() => simulateCriticalCapacity(selectedShelterId)}
            title="Surge occupancy to 94% Critical"
            className="flex items-center gap-1 bg-rose-600 hover:bg-rose-500 text-white px-2.5 py-1.5 rounded-md text-xs font-bold transition-colors cursor-pointer shadow-xs"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Surge to 94%</span>
          </button>

          <button
            id="demo-btn-water-shortage"
            onClick={() => simulateWaterShortage(selectedShelterId)}
            title="Simulate water depletion alert"
            className="flex items-center gap-1 bg-cyan-700 hover:bg-cyan-600 text-white px-2.5 py-1.5 rounded-md text-xs font-bold transition-colors cursor-pointer shadow-xs"
          >
            <Droplet className="w-3.5 h-3.5" />
            <span>Water Shortage</span>
          </button>

          <button
            id="demo-btn-deliver-relief"
            onClick={() => simulateResourceDelivery(selectedShelterId, 'ration', 200)}
            title="Record emergency delivery of 200 ration kits"
            className="flex items-center gap-1 bg-emerald-700 hover:bg-emerald-600 text-white px-2.5 py-1.5 rounded-md text-xs font-bold transition-colors cursor-pointer shadow-xs"
          >
            <PackageCheck className="w-3.5 h-3.5" />
            <span>Deliver Rations</span>
          </button>

          <button
            id="demo-btn-close-shelter"
            onClick={() => simulateShelterClosure(selectedShelterId)}
            title="Simulate shelter closure due to hazard"
            className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 px-2.5 py-1.5 rounded-md text-xs font-bold transition-colors cursor-pointer"
          >
            <XOctagon className="w-3.5 h-3.5" />
            <span>Close Shelter</span>
          </button>

          <button
            id="demo-btn-toggle-offline"
            onClick={() => setIsOnline((prev) => !prev)}
            title="Simulate unstable disaster connectivity"
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-bold transition-colors cursor-pointer ${
              isOnline
                ? 'bg-amber-900/60 text-amber-200 border border-amber-600 hover:bg-amber-800'
                : 'bg-red-600 text-white animate-pulse'
            }`}
          >
            {isOnline ? <Wifi className="w-3.5 h-3.5 text-emerald-400" /> : <WifiOff className="w-3.5 h-3.5" />}
            <span>{isOnline ? 'Network: Online' : 'Network: Offline'}</span>
          </button>

          <button
            id="demo-btn-reset"
            onClick={resetDemoData}
            title="Restore seed data"
            className="flex items-center gap-1 bg-slate-700 hover:bg-slate-600 text-white px-2.5 py-1.5 rounded-md text-xs font-bold transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Demo</span>
          </button>

          <button
            id="demo-btn-close-panel"
            onClick={onClose}
            className="text-amber-400 hover:text-white p-1 text-xs ml-1"
            title="Hide Demo Bar"
          >
            ✕
          </button>
        </div>

      </div>
    </aside>
  );
};
