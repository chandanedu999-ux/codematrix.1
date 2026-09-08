import React, { useState, useEffect } from 'react';
import { ResqProvider, useResq } from './context/ResqContext';
import { Navbar } from './components/Navbar';
import { DemoControlPanel } from './components/DemoControlPanel';
import { ShelterDrawer } from './components/ShelterDrawer';
import { ReportIncorrectModal } from './components/ReportIncorrectModal';
import { PublicLandingView } from './views/PublicLandingView';
import { OperationsDashboardView } from './views/OperationsDashboardView';
import { FastIntakeView } from './views/FastIntakeView';
import { ResourceManagementView } from './views/ResourceManagementView';
import { AlertCenterView } from './views/AlertCenterView';
import { AnalyticsView } from './views/AnalyticsView';
import { AdminView } from './views/AdminView';
import { Shelter } from './types';
import { 
  MapPin, 
  Activity, 
  UserPlus, 
  Package, 
  Bell, 
  CheckCircle, 
  AlertTriangle, 
  Info, 
  X,
  Radio
} from 'lucide-react';

const AppContent: React.FC = () => {
  const { 
    shelters, 
    emergencyMode, 
    toast, 
    selectedShelterId, 
    setSelectedShelterId, 
    alerts 
  } = useResq();

  const [currentView, setCurrentView] = useState<string>('public');
  const [isDemoBarOpen, setIsDemoBarOpen] = useState<boolean>(true); // Open by default for hackathon judges
  const [drawerShelter, setDrawerShelter] = useState<Shelter | null>(null);
  const [reportModalShelter, setReportModalShelter] = useState<Shelter | null>(null);
  const [intakeInitialShelterId, setIntakeInitialShelterId] = useState<string | null>(null);

  // Sync drawer shelter if selectedShelterId changes
  useEffect(() => {
    if (selectedShelterId) {
      const sh = shelters.find((s) => s.id === selectedShelterId);
      if (sh) setDrawerShelter(sh);
    }
  }, [selectedShelterId, shelters]);

  const handleSelectShelter = (shelter: Shelter) => {
    setDrawerShelter(shelter);
    setSelectedShelterId(shelter.id);
  };

  const handleCloseDrawer = () => {
    setDrawerShelter(null);
    setSelectedShelterId(null);
  };

  const handleNavigateToIntake = (shelterId?: string) => {
    if (shelterId) setIntakeInitialShelterId(shelterId);
    setCurrentView('intake');
  };

  const unresolvedAlertsCount = alerts.filter((a) => !a.resolved).length;

  return (
    <div className={`min-h-screen flex flex-col ${emergencyMode ? 'emergency-mode-active bg-slate-900 text-white' : 'bg-[#F7F9FC] text-[#172033]'}`}>
      
      {/* Top Navbar */}
      <Navbar
        currentView={currentView}
        onNavigate={(view) => setCurrentView(view)}
        onToggleDemoBar={() => setIsDemoBarOpen((prev) => !prev)}
        isDemoBarOpen={isDemoBarOpen}
      />

      {/* Hackathon Judge Interactive Simulation Panel */}
      <DemoControlPanel
        isOpen={isDemoBarOpen}
        onClose={() => setIsDemoBarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 pb-16 lg:pb-0">
        {currentView === 'public' && (
          <PublicLandingView
            onSelectShelter={handleSelectShelter}
            onNavigateToDashboard={() => setCurrentView('dashboard')}
            onNavigateToIntake={() => handleNavigateToIntake()}
          />
        )}

        {currentView === 'dashboard' && (
          <OperationsDashboardView
            onSelectShelter={handleSelectShelter}
            onNavigateToIntake={() => handleNavigateToIntake()}
            onNavigateToResources={() => setCurrentView('resources')}
            onNavigateToAlerts={() => setCurrentView('alerts')}
          />
        )}

        {currentView === 'intake' && (
          <FastIntakeView
            initialShelterId={intakeInitialShelterId}
            onNavigateToDashboard={() => setCurrentView('dashboard')}
          />
        )}

        {currentView === 'resources' && (
          <ResourceManagementView
            onSelectShelter={handleSelectShelter}
          />
        )}

        {currentView === 'alerts' && (
          <AlertCenterView
            onSelectShelter={handleSelectShelter}
          />
        )}

        {currentView === 'analytics' && (
          <AnalyticsView />
        )}

        {currentView === 'admin' && (
          <AdminView
            onSelectShelter={handleSelectShelter}
          />
        )}
      </div>

      {/* Shelter Drawer / Operational Details */}
      {drawerShelter && (
        <ShelterDrawer
          shelter={drawerShelter}
          onClose={handleCloseDrawer}
          onNavigateToIntake={(shId) => handleNavigateToIntake(shId)}
          onOpenReportModal={(sh) => setReportModalShelter(sh)}
        />
      )}

      {/* Citizen Discrepancy Reporting Modal */}
      {reportModalShelter && (
        <ReportIncorrectModal
          shelter={reportModalShelter}
          onClose={() => setReportModalShelter(null)}
        />
      )}

      {/* Toast Notification Container */}
      {toast && (
        <div 
          role="status" 
          aria-live="polite"
          className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-50 max-w-sm w-full bg-[#0B1F33] text-white p-4 rounded-xl shadow-2xl border border-slate-700 flex items-start gap-3 animate-in slide-in-from-bottom-5 duration-200"
        >
          {toast.type === 'success' && <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />}
          {toast.type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />}
          {toast.type === 'error' && <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />}
          {toast.type === 'info' && <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />}
          <div className="flex-1 text-xs font-medium leading-relaxed">
            {toast.message}
          </div>
        </div>
      )}

      {/* Mobile Bottom Quick-Action Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0B1F33] border-t border-slate-700 px-2 py-1.5 flex items-center justify-around text-[10px] font-semibold text-slate-300">
        <button
          onClick={() => setCurrentView('public')}
          className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-md min-h-[44px] justify-center ${
            currentView === 'public' ? 'text-blue-400 font-bold' : 'text-slate-400'
          }`}
        >
          <MapPin className="w-4 h-4" />
          <span>Shelters</span>
        </button>

        <button
          onClick={() => setCurrentView('dashboard')}
          className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-md min-h-[44px] justify-center ${
            currentView === 'dashboard' ? 'text-blue-400 font-bold' : 'text-slate-400'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>EOC</span>
        </button>

        <button
          onClick={() => handleNavigateToIntake()}
          className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-md min-h-[44px] justify-center ${
            currentView === 'intake' ? 'text-blue-400 font-bold' : 'text-slate-400'
          }`}
        >
          <UserPlus className="w-4 h-4" />
          <span>Intake</span>
        </button>

        <button
          onClick={() => setCurrentView('resources')}
          className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-md min-h-[44px] justify-center ${
            currentView === 'resources' ? 'text-blue-400 font-bold' : 'text-slate-400'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Relief</span>
        </button>

        <button
          onClick={() => setCurrentView('alerts')}
          className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-md min-h-[44px] justify-center relative ${
            currentView === 'alerts' ? 'text-blue-400 font-bold' : 'text-slate-400'
          }`}
        >
          <Bell className="w-4 h-4" />
          <span>Alerts</span>
          {unresolvedAlertsCount > 0 && (
            <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-rose-600 animate-ping"></span>
          )}
        </button>
      </div>

    </div>
  );
};

export default function App() {
  return (
    <ResqProvider>
      <AppContent />
    </ResqProvider>
  );
}
