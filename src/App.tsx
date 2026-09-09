import React, { useState, useEffect, useMemo } from 'react';
import { ResqProvider, useResq } from './context/ResqContext';
import { Sidebar } from './components/Sidebar';
import { TopAppBar } from './components/TopAppBar';
import { EmergencyFAB } from './components/EmergencyFAB';
import { ConfirmSpotModal } from './components/ConfirmSpotModal';
import { DemoControlPanel } from './components/DemoControlPanel';
import { ShelterDrawer } from './components/ShelterDrawer';
import { ReportIncorrectModal } from './components/ReportIncorrectModal';
import { RegisterShelterModal } from './components/RegisterShelterModal';
import { EmergencyDistressModal } from './components/EmergencyDistressModal';
import { PublicLandingView } from './views/PublicLandingView';
import { RegisterShelterView } from './views/RegisterShelterView';
import { OperationsDashboardView } from './views/OperationsDashboardView';
import { FastIntakeView } from './views/FastIntakeView';
import { ResourceManagementView } from './views/ResourceManagementView';
import { AlertCenterView } from './views/AlertCenterView';
import { AnalyticsView } from './views/AnalyticsView';
import { AdminView } from './views/AdminView';
import { ProfileView } from './views/ProfileView';
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
  Radio,
  AlertOctagon,
  PlusCircle,
  User
} from 'lucide-react';

const AppContent: React.FC = () => {
  const { 
    shelters, 
    emergencyMode, 
    toast, 
    selectedShelterId, 
    setSelectedShelterId, 
    alerts,
    showToast
  } = useResq();

  // Navigation State: Primary options have dedicated pages (Shelters, Resources, Alerts, Profile)
  const [currentView, setCurrentView] = useState<string>('public');
  const [isSidebarOpenMobile, setIsSidebarOpenMobile] = useState<boolean>(false);
  const [isDemoBarOpen, setIsDemoBarOpen] = useState<boolean>(false);

  // Search & Location
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [userCoordinates, setUserCoordinates] = useState<[number, number] | null>(null);
  const [locationLabel, setLocationLabel] = useState<string>('');
  const [isLocating, setIsLocating] = useState<boolean>(false);

  // Modals & Drawers
  const [drawerShelter, setDrawerShelter] = useState<Shelter | null>(null);
  const [reportModalShelter, setReportModalShelter] = useState<Shelter | null>(null);
  const [bookingShelter, setBookingShelter] = useState<Shelter | null>(null);
  const [intakeInitialShelterId, setIntakeInitialShelterId] = useState<string | null>(null);
  const [isDistressModalOpen, setIsDistressModalOpen] = useState<boolean>(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState<boolean>(false);

  // Haversine calculation for nearest shelter
  const calculateDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return parseFloat((R * c).toFixed(2));
  };

  // Find nearest shelter based on userCoordinates or Gandhinagar default
  const nearestShelterData = useMemo(() => {
    if (shelters.length === 0) return { shelter: null, distance: null };
    const baseCoords = userCoordinates || [23.1541881, 72.6729164];
    let bestDist = Infinity;
    let bestShelter = shelters[0];

    shelters.forEach((s) => {
      const dist = calculateDistanceKm(baseCoords[0], baseCoords[1], s.lat, s.lng);
      if (dist < bestDist) {
        bestDist = dist;
        bestShelter = s;
      }
    });

    return { shelter: bestShelter, distance: bestDist };
  }, [shelters, userCoordinates]);

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

  // Immediate Access action from FAB or Top App Bar
  const handleImmediateAccess = () => {
    if (nearestShelterData.shelter) {
      handleSelectShelter(nearestShelterData.shelter);
      if (currentView !== 'public') {
        setCurrentView('public');
      }
      showToast(
        `Immediate Safe Route: Locked onto ${nearestShelterData.shelter.name} (${nearestShelterData.distance?.toFixed(1)} km)`,
        'success'
      );
    } else {
      handleLocateNearby();
    }
  };

  // Accurate GPS Geolocation
  const handleLocateNearby = () => {
    if (!navigator.geolocation) {
      showToast('Geolocation is not supported by your browser.', 'warning');
      return;
    }
    setIsLocating(true);
    showToast('Locating your position for immediate safe zone triage...', 'info');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const acc = Math.round(pos.coords.accuracy);
        setUserCoordinates([lat, lng]);
        setLocationLabel(`GPS (${lat.toFixed(4)}, ${lng.toFixed(4)}) · ±${acc}m`);
        showToast(`GPS Position Locked (±${acc}m). Safe zones re-ordered by distance.`, 'success');

        if (currentView !== 'public') {
          setCurrentView('public');
        }
      },
      (err) => {
        setIsLocating(false);
        console.warn('Geolocation error:', err);
        showToast('Unable to acquire GPS signal. Selecting default relief sector.', 'warning');
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  };

  const handleSelectSectorLocation = (lat: number, lng: number, label: string) => {
    setUserCoordinates([lat, lng]);
    setLocationLabel(label);
    showToast(`Relief sector shifted to ${label}`, 'info');
    if (currentView !== 'public') {
      setCurrentView('public');
    }
  };

  const handleClearLocation = () => {
    setUserCoordinates(null);
    setLocationLabel('');
    showToast('GPS coordinates reset.', 'info');
  };

  const handleOpenBookSpotModal = (shelter: Shelter) => {
    setBookingShelter(shelter);
  };

  const unresolvedAlertsCount = alerts.filter((a) => !a.resolved).length;

  return (
    <div className={`min-h-screen flex flex-col ${
      emergencyMode ? 'emergency-mode-active bg-slate-950 text-white' : 'bg-[#F8FAFC] text-[#0F172A]'
    }`}>
      
      {/* 1. PERSISTENT SIDEBAR NAVIGATION (Laptop/Tablet persistent, Mobile drawer) */}
      <Sidebar
        currentView={currentView}
        onNavigate={(view) => setCurrentView(view)}
        isOpenMobile={isSidebarOpenMobile}
        onCloseMobile={() => setIsSidebarOpenMobile(false)}
        onOpenDistressModal={() => setIsDistressModalOpen(true)}
        onOpenRegisterModal={() => setCurrentView('register')}
      />

      {/* 2. MAIN LAYOUT WRAPPER (Shifted on Laptop/Tablet by Sidebar width w-72) */}
      <div className="flex-1 flex flex-col lg:pl-72 transition-all duration-300">
        
        {/* Floating Glassmorphic Top App Bar for Robust Search & GPS */}
        <TopAppBar
          onToggleSidebar={() => setIsSidebarOpenMobile((prev) => !prev)}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onLocateNearby={handleLocateNearby}
          isLocating={isLocating}
          onOpenDistressModal={() => setIsDistressModalOpen(true)}
          onSelectSectorLocation={handleSelectSectorLocation}
          activeLocationLabel={locationLabel}
          onClearLocation={handleClearLocation}
        />

        {/* Demo Simulation Controls Button (Top Right Floater) */}
        <div className="px-4 pt-2 flex justify-end">
          <button
            onClick={() => setIsDemoBarOpen((prev) => !prev)}
            className="text-[11px] font-bold text-slate-500 hover:text-[#0F172A] bg-white/70 hover:bg-white px-3 py-1 rounded-full border border-slate-200 transition-colors shadow-xs cursor-pointer"
          >
            ⚡ {isDemoBarOpen ? 'Hide Simulation Tools' : 'Open Disaster Scenario Simulator'}
          </button>
        </div>

        {/* Demo Simulation Controls Drawer Panel */}
        <DemoControlPanel
          isOpen={isDemoBarOpen}
          onClose={() => setIsDemoBarOpen(false)}
        />

        {/* 3. DEDICATED SEPARATE PAGES */}
        <div className="flex-1 pb-20 lg:pb-8">
          
          {/* PAGE 1: SHELTERS */}
          {currentView === 'public' && (
            <PublicLandingView
              onSelectShelter={handleSelectShelter}
              onNavigateToDashboard={() => setCurrentView('dashboard')}
              onNavigateToIntake={() => handleNavigateToIntake()}
              onOpenDistressModal={() => setIsDistressModalOpen(true)}
              onOpenRegisterModal={() => setIsRegisterModalOpen(true)}
              onNavigateToRegister={() => setCurrentView('register')}
              onOpenBookSpotModal={handleOpenBookSpotModal}
              overrideCoordinates={userCoordinates}
              externalSearchQuery={searchQuery}
              onExternalSearchChange={setSearchQuery}
            />
          )}

          {/* PAGE 2: RESOURCES */}
          {currentView === 'resources' && (
            <ResourceManagementView
              onSelectShelter={handleSelectShelter}
            />
          )}

          {/* PAGE 3: ALERTS */}
          {currentView === 'alerts' && (
            <AlertCenterView
              onSelectShelter={handleSelectShelter}
            />
          )}

          {/* PAGE 4: PROFILE */}
          {currentView === 'profile' && (
            <ProfileView />
          )}

          {/* REGISTER SHELTER VIEW */}
          {currentView === 'register' && (
            <RegisterShelterView
              onBack={() => setCurrentView('public')}
              onRegistered={(newShelter) => {
                setSelectedShelterId(newShelter.id);
                setCurrentView('public');
              }}
              initialCoordinates={userCoordinates}
            />
          )}

          {/* EOC COMMAND DASHBOARD */}
          {currentView === 'dashboard' && (
            <OperationsDashboardView
              onSelectShelter={handleSelectShelter}
              onNavigateToIntake={() => handleNavigateToIntake()}
              onNavigateToResources={() => setCurrentView('resources')}
              onNavigateToAlerts={() => setCurrentView('alerts')}
            />
          )}

          {/* FAST INTAKE */}
          {currentView === 'intake' && (
            <FastIntakeView
              initialShelterId={intakeInitialShelterId}
              onNavigateToDashboard={() => setCurrentView('dashboard')}
            />
          )}

          {/* ANALYTICS */}
          {currentView === 'analytics' && (
            <AnalyticsView />
          )}

          {/* ADMIN */}
          {currentView === 'admin' && (
            <AdminView
              onSelectShelter={handleSelectShelter}
            />
          )}

        </div>

      </div>

      {/* 4. MASSIVE EMERGENCY FLOATING ACTION BUTTON (FAB) */}
      <EmergencyFAB
        onImmediateAccess={handleImmediateAccess}
        nearestShelter={nearestShelterData.shelter}
        distanceKm={nearestShelterData.distance}
        isLocating={isLocating}
      />

      {/* 5. CRITICAL CONFIRMATION MODAL: BOOK SPOT / RESERVE BED */}
      <ConfirmSpotModal
        shelter={bookingShelter}
        isOpen={Boolean(bookingShelter)}
        onClose={() => setBookingShelter(null)}
        onConfirmed={(pass) => {
          // Optional callback
        }}
      />

      {/* 6. SHELTER DETAILS BOTTOM SHEET / SLIDE-OVER DRAWER */}
      {drawerShelter && (
        <ShelterDrawer
          shelter={drawerShelter}
          onClose={handleCloseDrawer}
          onNavigateToIntake={(shId) => handleNavigateToIntake(shId)}
          onOpenReportModal={(sh) => setReportModalShelter(sh)}
          onOpenBookSpotModal={handleOpenBookSpotModal}
        />
      )}

      {/* Citizen Discrepancy Reporting Modal */}
      {reportModalShelter && (
        <ReportIncorrectModal
          shelter={reportModalShelter}
          onClose={() => setReportModalShelter(null)}
        />
      )}

      {/* Register Shelter Modal */}
      <RegisterShelterModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        userCoordinates={userCoordinates}
      />

      {/* SOS Distress Call Modal */}
      <EmergencyDistressModal
        isOpen={isDistressModalOpen}
        onClose={() => setIsDistressModalOpen(false)}
        userCoordinates={userCoordinates}
      />

      {/* 7. HIGH-CONTRAST TOAST NOTIFICATION CONTAINER */}
      {toast && (
        <div 
          role="status" 
          aria-live="polite"
          className="fixed bottom-24 sm:bottom-8 left-4 sm:left-auto right-4 sm:right-28 z-50 max-w-sm w-full bg-[#0F172A] text-white p-4 rounded-2xl shadow-2xl border-2 border-slate-700 flex items-start gap-3 animate-in slide-in-from-bottom-5 duration-200"
        >
          {toast.type === 'success' && <CheckCircle className="w-5 h-5 text-[#059669] shrink-0 mt-0.5" />}
          {toast.type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />}
          {toast.type === 'error' && <AlertTriangle className="w-5 h-5 text-[#DC2626] shrink-0 mt-0.5" />}
          {toast.type === 'info' && <Info className="w-5 h-5 text-[#38BDF8] shrink-0 mt-0.5" />}
          <div className="flex-1 text-xs font-semibold leading-relaxed">
            {toast.message}
          </div>
        </div>
      )}

      {/* 8. MOBILE BOTTOM QUICK NAVIGATION BAR */}
      <nav 
        aria-label="Mobile Navigation"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-[#0F172A] border-t border-slate-800 px-3 py-1 flex items-center justify-around text-[10px] font-bold text-slate-300"
        style={{ paddingBottom: 'calc(0.25rem + env(safe-area-inset-bottom))' }}
      >
        <button
          onClick={() => setCurrentView('public')}
          className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl min-h-[48px] justify-center cursor-pointer ${
            currentView === 'public' ? 'text-[#38BDF8] font-black' : 'text-slate-400'
          }`}
        >
          <MapPin className="w-5 h-5" />
          <span>Shelters</span>
        </button>

        <button
          onClick={() => setCurrentView('resources')}
          className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl min-h-[48px] justify-center cursor-pointer ${
            currentView === 'resources' ? 'text-[#38BDF8] font-black' : 'text-slate-400'
          }`}
        >
          <Package className="w-5 h-5" />
          <span>Resources</span>
        </button>

        <button
          onClick={() => setCurrentView('alerts')}
          className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl min-h-[48px] justify-center relative cursor-pointer ${
            currentView === 'alerts' ? 'text-[#38BDF8] font-black' : 'text-slate-400'
          }`}
        >
          <Bell className="w-5 h-5" />
          <span>Alerts</span>
          {unresolvedAlertsCount > 0 && (
            <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-[#DC2626] animate-ping"></span>
          )}
        </button>

        <button
          onClick={() => setCurrentView('profile')}
          className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl min-h-[48px] justify-center cursor-pointer ${
            currentView === 'profile' ? 'text-[#38BDF8] font-black' : 'text-slate-400'
          }`}
        >
          <User className="w-5 h-5" />
          <span>Profile</span>
        </button>

        <button
          onClick={() => setIsDistressModalOpen(true)}
          className="flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl min-h-[48px] justify-center text-[#EA580C] font-black cursor-pointer"
        >
          <AlertOctagon className="w-5 h-5 animate-pulse" />
          <span>SOS</span>
        </button>
      </nav>

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
