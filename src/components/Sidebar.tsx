import React from 'react';
import { useResq } from '../context/ResqContext';
import { useRipple, triggerHaptic } from './Ripple';
import { 
  ShieldAlert, 
  MapPin, 
  Package, 
  Bell, 
  User, 
  Activity, 
  UserPlus, 
  BarChart3, 
  Settings, 
  PlusCircle, 
  AlertOctagon, 
  X, 
  Radio, 
  WifiOff, 
  CheckCircle2,
  ChevronRight
} from 'lucide-react';

interface SidebarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  onOpenDistressModal: () => void;
  onOpenRegisterModal: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onNavigate,
  isOpenMobile,
  onCloseMobile,
  onOpenDistressModal,
  onOpenRegisterModal
}) => {
  const { 
    alerts, 
    userRole, 
    setUserRole, 
    emergencyMode, 
    setEmergencyMode, 
    isOnline, 
    pendingQueue 
  } = useResq();

  const { createRipple, RippleElements } = useRipple();
  const unresolvedAlertsCount = alerts.filter((a) => !a.resolved).length;

  // Primary 4 Dedicated Pages as requested: Shelter, Resources, Alerts, Profile
  const primaryNavItems = [
    { 
      id: 'public', 
      label: 'Shelters', 
      sub: 'Safe zones & live capacity', 
      icon: MapPin 
    },
    { 
      id: 'resources', 
      label: 'Resources', 
      sub: 'Rations, water & supplies', 
      icon: Package 
    },
    { 
      id: 'alerts', 
      label: 'Alerts', 
      sub: 'Live disaster broadcast', 
      icon: Bell, 
      badge: unresolvedAlertsCount > 0 ? unresolvedAlertsCount : undefined 
    },
    { 
      id: 'profile', 
      label: 'Profile', 
      sub: 'Emergency pass & ICE data', 
      icon: User 
    },
  ];

  // Secondary Coordinator / Emergency Operations items
  const operationalNavItems = [
    { id: 'dashboard', label: 'EOC Command', icon: Activity, role: 'VOLUNTEER' },
    { id: 'intake', label: 'Fast Intake', icon: UserPlus, role: 'SHELTER_COORDINATOR' },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, role: 'ADMIN' },
    { id: 'admin', label: 'Admin', icon: Settings, role: 'ADMIN' },
  ];

  const handleItemClick = (viewId: string) => {
    triggerHaptic([30]);
    onNavigate(viewId);
    onCloseMobile();
  };

  const handleSosClick = (e: React.MouseEvent) => {
    createRipple(e);
    triggerHaptic([60, 40, 100]);
    onOpenDistressModal();
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div 
          onClick={onCloseMobile}
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm lg:hidden transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* Persistent Sidebar for Laptop/Tablet, Collapsible drawer for Mobile */}
      <aside
        id="app-sidebar"
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-[#0F172A] text-white flex flex-col border-r border-slate-800 transition-transform duration-300 ease-fast-stop ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
        style={{
          paddingTop: 'env(safe-area-inset-top)',
          paddingBottom: 'env(safe-area-inset-bottom)'
        }}
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
          <button
            onClick={() => handleItemClick('public')}
            className="flex items-center gap-3 text-left group cursor-pointer focus:outline-none"
          >
            <div className="w-10 h-10 rounded-2xl bg-[#EA580C] flex items-center justify-center text-white shadow-lg font-black text-xl">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-lg tracking-tight text-white">RESQTECH</span>
                <span className="text-[9px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/30">
                  Live
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium">
                Relief Shelter Intelligence
              </p>
            </div>
          </button>

          {/* Close button on mobile */}
          <button
            onClick={onCloseMobile}
            className="lg:hidden p-2 text-slate-400 hover:text-white rounded-xl cursor-pointer"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Offline & Crisis Status Warnings */}
        {!isOnline && (
          <div className="bg-amber-600/90 text-slate-950 px-4 py-2 text-[11px] font-bold flex items-center gap-2">
            <WifiOff className="w-4 h-4 shrink-0 animate-bounce" />
            <span>Offline Resilience Active ({pendingQueue.length} queued)</span>
          </div>
        )}

        {emergencyMode && (
          <div className="bg-[#DC2626] text-white px-4 py-2 text-[11px] font-black tracking-wider uppercase flex items-center gap-2">
            <Radio className="w-4 h-4 shrink-0 animate-pulse" />
            <span>Crisis Priority Mode Active</span>
          </div>
        )}

        {/* Navigation Content Area */}
        <div className="flex-1 px-3 py-4 space-y-6 overflow-y-auto">
          
          {/* PRIMARY 4 CORE PAGES */}
          <div>
            <div className="px-3 pb-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
              Disaster Relief Access
            </div>
            <nav className="space-y-1" aria-label="Primary Navigation">
              {primaryNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentView === item.id;
                return (
                  <button
                    key={item.id}
                    id={`nav-link-${item.id}`}
                    onClick={() => handleItemClick(item.id)}
                    className={`w-full min-h-[52px] px-3.5 py-2.5 rounded-2xl flex items-center justify-between text-left transition-all cursor-pointer select-none group ${
                      isActive
                        ? 'bg-[#1E293B] text-white border border-slate-700 shadow-md font-extrabold'
                        : 'text-slate-300 hover:bg-slate-800/60 hover:text-white font-medium'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
                        isActive 
                          ? 'bg-[#EA580C] text-white shadow-sm' 
                          : 'bg-slate-800 text-slate-300 group-hover:bg-slate-700 group-hover:text-white'
                      }`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-sm tracking-tight leading-none mb-1">
                          {item.label}
                        </div>
                        <div className="text-[10px] text-slate-400 font-normal">
                          {item.sub}
                        </div>
                      </div>
                    </div>

                    {item.badge !== undefined && (
                      <span className="w-5 h-5 rounded-full bg-[#DC2626] text-white text-[10px] font-black flex items-center justify-center animate-pulse">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* CRITICAL ACTIONS: SOS & REGISTER SHELTER */}
          <div className="pt-2 border-t border-slate-800/80 space-y-2">
            <div className="px-3 text-[10px] font-black uppercase tracking-widest text-slate-400">
              Immediate Crisis Actions
            </div>

            {/* Claymorphic SOS Button */}
            <button
              id="sidebar-sos-btn"
              onClick={handleSosClick}
              className="clay-btn-emergency w-full min-h-[50px] px-4 py-3 rounded-2xl text-white font-black text-xs tracking-wider uppercase flex items-center justify-center gap-2 cursor-pointer shadow-lg relative overflow-hidden"
            >
              {RippleElements}
              <AlertOctagon className="w-4 h-4 text-white animate-pulse" />
              <span>Broadcast SOS Distress</span>
            </button>

            {/* Register Shelter Button */}
            <button
              id="sidebar-register-btn"
              onClick={() => {
                onOpenRegisterModal();
                onCloseMobile();
              }}
              className="w-full min-h-[46px] px-4 py-2.5 rounded-2xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>+ Register New Shelter</span>
            </button>
          </div>

          {/* SECONDARY COORDINATOR / EOC CONTROLS */}
          <div className="pt-2 border-t border-slate-800/80">
            <div className="px-3 pb-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center justify-between">
              <span>Coordinator &amp; EOC</span>
              <span className="text-[9px] text-slate-500">{userRole}</span>
            </div>
            <div className="space-y-1">
              {operationalNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleItemClick(item.id)}
                    className={`w-full min-h-[42px] px-3 py-2 rounded-xl flex items-center justify-between text-left text-xs transition-colors cursor-pointer ${
                      isActive 
                        ? 'bg-slate-800 text-sky-300 font-bold' 
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className="w-3.5 h-3.5 text-slate-400" />
                      <span>{item.label}</span>
                    </div>
                    <ChevronRight className="w-3 h-3 text-slate-600" />
                  </button>
                );
              })}
            </div>
          </div>

        </div>

        {/* Sidebar Footer: Mode Toggle & Role Badge */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/40 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase text-slate-400">
              High-Stress Mode
            </span>
            <button
              onClick={() => setEmergencyMode((prev) => !prev)}
              className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider transition-colors cursor-pointer border ${
                emergencyMode 
                  ? 'bg-red-600 text-white border-red-500 shadow-sm' 
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
              }`}
            >
              {emergencyMode ? 'Active (Dark)' : 'Normal'}
            </button>
          </div>
        </div>

      </aside>
    </>
  );
};
