import React, { useState } from 'react';
import { useResq } from '../context/ResqContext';
import { UserRole, Language } from '../types';
import { 
  ShieldAlert, 
  MapPin, 
  Activity, 
  UserPlus, 
  Package, 
  Bell, 
  BarChart3, 
  Settings, 
  WifiOff, 
  Globe, 
  Zap, 
  Menu, 
  X, 
  Radio, 
  PlusCircle, 
  AlertOctagon,
  ChevronDown
} from 'lucide-react';

interface NavbarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  onToggleDemoBar: () => void;
  isDemoBarOpen: boolean;
  onOpenDistressModal?: () => void;
  onOpenRegisterModal?: () => void;
  onSelectLocatorLocation?: (lat: number, lng: number, label: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  onToggleDemoBar,
  isDemoBarOpen,
  onOpenDistressModal,
  onOpenRegisterModal,
  onSelectLocatorLocation
}) => {
  const { 
    userRole, 
    setUserRole, 
    language, 
    setLanguage, 
    emergencyMode, 
    setEmergencyMode, 
    isOnline, 
    alerts,
    pendingQueue
  } = useResq();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const unresolvedAlertsCount = alerts.filter((a) => !a.resolved).length;

  const navItems = [
    { id: 'public', label: 'Shelters Map', icon: MapPin, roleRequired: 'PUBLIC' },
    { id: 'dashboard', label: 'Command Center', icon: Activity, roleRequired: 'VOLUNTEER' },
    { id: 'intake', label: 'Fast Intake', icon: UserPlus, roleRequired: 'SHELTER_COORDINATOR' },
    { id: 'resources', label: 'Resources', icon: Package, roleRequired: 'VOLUNTEER' },
    { id: 'alerts', label: 'Alerts', icon: Bell, badge: unresolvedAlertsCount, roleRequired: 'PUBLIC' },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, roleRequired: 'ADMIN' },
    { id: 'admin', label: 'Admin', icon: Settings, roleRequired: 'ADMIN' }
  ];

  const handleNavClick = (viewId: string) => {
    onNavigate(viewId);
    setMobileMenuOpen(false);
  };

  const handleLocatorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (!val) return;
    const [latStr, lngStr, label] = val.split('|');
    if (onSelectLocatorLocation && latStr && lngStr) {
      onSelectLocatorLocation(parseFloat(latStr), parseFloat(lngStr), label);
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-[#0F172A] border-b border-slate-800 text-white shadow-md">
      {/* Offline ticker */}
      {!isOnline && (
        <div className="bg-amber-600 text-slate-950 px-4 py-1 text-xs font-bold flex items-center justify-center gap-2">
          <WifiOff className="w-4 h-4 shrink-0 animate-bounce" />
          <span>OFFLINE RESILIENCE ACTIVE: Registrations safely cached ({pendingQueue.length} pending).</span>
        </div>
      )}

      {emergencyMode && (
        <div className="bg-[#DC2626] text-white px-4 py-1 text-xs font-black tracking-wider uppercase flex items-center justify-center gap-2">
          <ShieldAlert className="w-4 h-4 shrink-0 animate-pulse" />
          <span>CRISIS MODE ACTIVE — Priority Evacuation &amp; Verified Allocations</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo: RESQTECH with #FFFFFF text */}
          <div className="flex items-center gap-3">
            <button 
              id="resq-brand-logo-btn"
              onClick={() => handleNavClick('public')} 
              className="flex items-center gap-2.5 text-left group cursor-pointer focus:outline-none"
            >
              <div className="w-9 h-9 rounded-xl bg-[#EA580C] flex items-center justify-center text-white shadow-md font-black text-xl">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-lg tracking-tight text-[#FFFFFF]">RESQTECH</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-[#059669] px-1.5 py-0.2 rounded border border-emerald-500/30">
                    Live
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-medium hidden sm:block">
                  Verified Disaster Shelters &amp; Rapid Coordination
                </p>
              </div>
            </button>

            {/* Quick Locator Dropdown with #FFFFFF text */}
            <div className="hidden md:flex items-center ml-2 pl-2 border-l border-slate-700">
              <MapPin className="w-3.5 h-3.5 text-[#38BDF8] mr-1.5 shrink-0" />
              <select
                id="quick-locator-select"
                onChange={handleLocatorChange}
                defaultValue="23.1541881|72.6729164|Gandhinagar/Ahmedabad (23.1541881, 72.6729164)"
                className="bg-slate-800 text-[#FFFFFF] text-xs font-semibold px-2 py-1 rounded-md border border-slate-700 hover:border-slate-600 focus:outline-none cursor-pointer"
                title="Quick locate sector"
              >
                <option value="23.1541881|72.6729164|Gandhinagar / Raysan Hub (23.1541881, 72.6729164)">
                  📍 Gandhinagar / Raysan (23.154, 72.672)
                </option>
                <option value="23.1582|72.6685|PDPU Sports Complex">
                  📍 PDPU Campus Corridor
                </option>
                <option value="23.1510|72.6755|Bhaijipura Cross Road">
                  📍 Bhaijipura Cross Road
                </option>
                <option value="23.1485|72.6620|Koba Circle Transit Node">
                  📍 Koba Circle Transit
                </option>
                <option value="23.0225|72.5714|Central Ahmedabad">
                  📍 Central Ahmedabad
                </option>
              </select>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden xl:flex items-center space-x-1" aria-label="Main Navigation">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-link-${item.id}`}
                  onClick={() => handleNavClick(item.id)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-slate-800 text-[#FFFFFF] shadow-xs'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                  {Boolean(item.badge && item.badge > 0) && (
                    <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-extrabold bg-[#DC2626] text-white animate-pulse">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Top Right Actions */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            
            {/* Register Shelter Button */}
            <button
              id="btn-register-shelter-nav"
              onClick={() => onNavigate('register')}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-white text-[#0F172A] hover:bg-slate-100 border border-[#E2E8F0] shadow-xs transition-colors cursor-pointer"
              title="Add your verified shelter with Aadhaar & Police Permission"
            >
              <PlusCircle className="w-3.5 h-3.5 text-[#059669]" />
              <span>+ Register Shelter</span>
            </button>

            {/* MANDATORY SIGNAL AMBER CTA: SOS Broadcast Button */}
            {onOpenDistressModal && (
              <button
                id="btn-sos-broadcast-nav"
                onClick={onOpenDistressModal}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-black tracking-wide bg-[#EA580C] hover:bg-orange-700 text-[#FFFFFF] shadow-md transition-all cursor-pointer animate-pulse"
                title="Broadcast emergency distress call"
              >
                <AlertOctagon className="w-4 h-4" />
                <span>SOS Broadcast</span>
              </button>
            )}

            {/* Language Selector */}
            <div className="relative hidden md:inline-flex items-center">
              <Globe className="w-3.5 h-3.5 text-slate-400 absolute left-2 pointer-events-none" />
              <select
                id="language-select"
                aria-label="Select interface language"
                value={language}
                onChange={(e) => setLanguage(e.target.value as Language)}
                className="bg-slate-800 text-slate-200 text-xs font-medium pl-6 pr-2 py-1.5 rounded-lg border border-slate-700 hover:border-slate-600 focus:outline-none cursor-pointer"
              >
                <option value="en">EN</option>
                <option value="hi">HI</option>
                <option value="gu">GU</option>
              </select>
            </div>

            {/* Demo Controls Toggle */}
            <button
              id="demo-controls-toggle-btn"
              onClick={onToggleDemoBar}
              title="Toggle Judge Demo Controls"
              className={`p-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                isDemoBarOpen
                  ? 'bg-amber-500/20 text-amber-300 border-amber-400'
                  : 'bg-slate-800 text-slate-300 hover:text-amber-300 border-slate-700'
              }`}
            >
              <Radio className="w-4 h-4 text-amber-400" />
            </button>

            {/* Mobile Menu Button */}
            <button
              id="mobile-menu-toggle-btn"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label="Toggle navigation menu"
              className="xl:hidden p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 focus:outline-none"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="xl:hidden bg-[#0F172A] border-b border-slate-800 px-4 pt-2 pb-4 space-y-2">
          <div className="grid grid-cols-2 gap-2 pb-2 mb-2 border-b border-slate-800">
            {onOpenDistressModal && (
              <button
                onClick={() => {
                  onOpenDistressModal();
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg text-xs font-bold bg-[#EA580C] text-white"
              >
                <AlertOctagon className="w-4 h-4" />
                <span>SOS Broadcast</span>
              </button>
            )}
            <button
              onClick={() => {
                onNavigate('register');
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg text-xs font-bold bg-white text-[#0F172A]"
            >
              <PlusCircle className="w-4 h-4 text-[#059669]" />
              <span>+ Register Shelter</span>
            </button>
          </div>

          <div className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold ${
                    isActive ? 'bg-slate-800 text-white' : 'text-slate-300 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>
                  {Boolean(item.badge && item.badge > 0) && (
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-[#DC2626] text-white">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
};
