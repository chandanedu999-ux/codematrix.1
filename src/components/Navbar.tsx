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
  Wifi, 
  WifiOff, 
  Globe, 
  Zap, 
  Menu, 
  X,
  Radio
} from 'lucide-react';

interface NavbarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  onToggleDemoBar: () => void;
  isDemoBarOpen: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  onToggleDemoBar,
  isDemoBarOpen
}) => {
  const { 
    userRole, 
    setUserRole, 
    language, 
    setLanguage, 
    t, 
    emergencyMode, 
    setEmergencyMode, 
    isOnline, 
    alerts,
    pendingQueue
  } = useResq();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const unresolvedAlertsCount = alerts.filter((a) => !a.resolved).length;

  const navItems = [
    { id: 'public', label: 'Public Map', icon: MapPin, roleRequired: 'PUBLIC' },
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

  return (
    <header className="sticky top-0 z-50 bg-[#0B1F33] border-b border-slate-700 text-white shadow-md">
      {/* Top emergency announcement ticker / offline alert banner */}
      {!isOnline && (
        <div className="bg-amber-600 text-slate-950 px-4 py-1.5 text-xs font-bold flex items-center justify-center gap-2">
          <WifiOff className="w-4 h-4 shrink-0 animate-bounce" />
          <span>OFFLINE RESILIENCE ACTIVE: Network connection unavailable. Intake registrations are safely cached locally ({pendingQueue.length} pending).</span>
        </div>
      )}

      {emergencyMode && (
        <div className="bg-red-700 text-white px-4 py-1 text-xs font-black tracking-wider uppercase flex items-center justify-center gap-2">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span>EMERGENCY MODE ACTIVE — High-contrast display &amp; prioritized response protocol</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Tagline */}
          <div className="flex items-center gap-3">
            <button 
              id="resq-brand-logo-btn"
              onClick={() => handleNavClick('public')} 
              className="flex items-center gap-2.5 text-left group cursor-pointer focus:outline-hidden"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-inner font-black text-xl tracking-tighter group-hover:bg-blue-500 transition-colors">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-xl tracking-tight text-white font-mono-code">RESQ</span>
                  <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1 animate-pulse"></span>
                    EOC LIVE
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-medium hidden md:block">
                  {t.tagline}
                </p>
              </div>
            </button>
          </div>

          {/* Desktop Nav Items */}
          <nav className="hidden lg:flex items-center space-x-1" aria-label="Main Navigation">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-link-${item.id}`}
                  onClick={() => handleNavClick(item.id)}
                  className={`relative flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold tracking-wide transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                  {Boolean(item.badge && item.badge > 0) && (
                    <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-extrabold bg-rose-600 text-white animate-pulse">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Top Right Utilities */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Language Selector */}
            <div className="relative inline-flex items-center">
              <Globe className="w-3.5 h-3.5 text-slate-400 absolute left-2 pointer-events-none" />
              <select
                id="language-select"
                aria-label="Select interface language"
                value={language}
                onChange={(e) => setLanguage(e.target.value as Language)}
                className="bg-slate-800 text-slate-200 text-xs font-medium pl-7 pr-3 py-1.5 rounded-lg border border-slate-700 hover:border-slate-600 focus:outline-hidden focus:ring-1 focus:ring-blue-500 cursor-pointer"
              >
                <option value="en">English</option>
                <option value="hi">हिन्दी (Hindi)</option>
                <option value="gu">ગુજરાતી (Gujarati)</option>
              </select>
            </div>

            {/* Role Switcher */}
            <div className="hidden sm:block">
              <select
                id="role-select"
                aria-label="Select system persona role"
                value={userRole}
                onChange={(e) => setUserRole(e.target.value as UserRole)}
                className="bg-slate-800 text-amber-400 font-semibold text-xs px-2.5 py-1.5 rounded-lg border border-amber-500/40 hover:border-amber-400 focus:outline-hidden focus:ring-1 focus:ring-amber-400 cursor-pointer"
              >
                <option value="PUBLIC">👤 Citizen / Public</option>
                <option value="VOLUNTEER">🤝 Volunteer / NGO</option>
                <option value="SHELTER_COORDINATOR">📋 Shelter Coordinator</option>
                <option value="ADMIN">🏛️ Disaster Official (Admin)</option>
              </select>
            </div>

            {/* Emergency Mode Button */}
            <button
              id="emergency-mode-btn"
              onClick={() => setEmergencyMode((prev) => !prev)}
              title="Toggle high-contrast emergency mode"
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                emergencyMode 
                  ? 'bg-rose-600 text-white shadow-md animate-pulse'
                  : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 border border-slate-700'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden md:inline">{emergencyMode ? 'Emergency On' : 'Emergency Mode'}</span>
            </button>

            {/* Demo Controls Panel Toggle */}
            <button
              id="demo-controls-toggle-btn"
              onClick={onToggleDemoBar}
              title="Open Hackathon Judge Simulation Controls"
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                isDemoBarOpen
                  ? 'bg-amber-500/20 text-amber-300 border-amber-400'
                  : 'bg-slate-800 text-slate-300 hover:text-amber-300 border-slate-700'
              }`}
            >
              <Radio className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden lg:inline">Judge Demo Controls</span>
              <span className="lg:hidden">Demo</span>
            </button>

            {/* Mobile menu toggle */}
            <button
              id="mobile-menu-toggle-btn"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label="Toggle navigation menu"
              className="lg:hidden p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 focus:outline-hidden"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#0B1F33] border-t border-slate-800 px-4 pt-3 pb-5 space-y-2">
          <div className="mb-3 pb-2 border-b border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-400">Current Role:</span>
            <select
              value={userRole}
              onChange={(e) => setUserRole(e.target.value as UserRole)}
              className="bg-slate-800 text-amber-400 font-semibold text-xs px-2 py-1 rounded-sm border border-amber-500/40"
            >
              <option value="PUBLIC">👤 Citizen</option>
              <option value="VOLUNTEER">🤝 Volunteer</option>
              <option value="SHELTER_COORDINATOR">📋 Coordinator</option>
              <option value="ADMIN">🏛️ Official / Admin</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-semibold transition-colors min-h-[44px] ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-800/80 text-slate-200 hover:bg-slate-700'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                  {Boolean(item.badge && item.badge > 0) && (
                    <span className="ml-auto px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-600 text-white">
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
