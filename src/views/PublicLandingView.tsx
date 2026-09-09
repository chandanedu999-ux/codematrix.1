import React, { useState, useMemo, useEffect } from 'react';
import { useResq } from '../context/ResqContext';
import { Shelter } from '../types';
import { ShelterMap } from '../components/ShelterMap';
import { ProjectLogoLoader } from '../components/ProjectLogoLoader';
import { useRipple, triggerHaptic } from '../components/Ripple';
import { 
  Search, 
  MapPin, 
  Navigation, 
  ShieldCheck, 
  Phone, 
  ExternalLink,
  Droplets,
  Package,
  Bed,
  HeartPulse,
  Home,
  CheckCircle2,
  AlertTriangle,
  PlusCircle,
  AlertOctagon,
  LocateFixed,
  X,
  BookmarkCheck,
  ChevronDown,
  ChevronUp,
  Info,
  LifeBuoy
} from 'lucide-react';

interface PublicLandingViewProps {
  onSelectShelter: (shelter: Shelter) => void;
  onNavigateToDashboard: () => void;
  onNavigateToIntake: () => void;
  onOpenDistressModal?: () => void;
  onOpenRegisterModal?: () => void;
  onNavigateToRegister?: () => void;
  onOpenBookSpotModal?: (shelter: Shelter) => void;
  overrideCoordinates?: [number, number] | null;
  externalSearchQuery?: string;
  onExternalSearchChange?: (query: string) => void;
}

export const PublicLandingView: React.FC<PublicLandingViewProps> = ({
  onSelectShelter,
  onNavigateToDashboard,
  onNavigateToIntake,
  onOpenDistressModal,
  onOpenRegisterModal,
  onNavigateToRegister,
  onOpenBookSpotModal,
  overrideCoordinates,
  externalSearchQuery,
  onExternalSearchChange
}) => {
  const { 
    shelters, 
    selectedShelterId, 
    setSelectedShelterId, 
    showToast 
  } = useResq();

  const { createRipple, RippleElements } = useRipple();

  const [localSearchQuery, setLocalSearchQuery] = useState('');
  const searchQuery = externalSearchQuery !== undefined ? externalSearchQuery : localSearchQuery;
  const setSearchQuery = onExternalSearchChange || setLocalSearchQuery;

  const [userLocation, setUserLocation] = useState<[number, number] | null>(
    overrideCoordinates || null
  );
  const [userAccuracy, setUserAccuracy] = useState<number | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationLabel, setLocationLabel] = useState<string>('');
  const [mobileTab, setMobileTab] = useState<'map' | 'list'>('list');

  // Accordion open/close state
  const [isFaqOpen, setIsFaqOpen] = useState(false);
  const [isRightsOpen, setIsRightsOpen] = useState(false);
  const [isHotlinesOpen, setIsHotlinesOpen] = useState(false);

  // Sync override coordinates if provided externally
  useEffect(() => {
    if (overrideCoordinates) {
      setUserLocation(overrideCoordinates);
      setLocationLabel(`Relief Sector (${overrideCoordinates[0].toFixed(4)}, ${overrideCoordinates[1].toFixed(4)})`);
    }
  }, [overrideCoordinates]);

  // Haversine accurate distance calculation
  const calculateDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) * Math.PI / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return parseFloat((R * c).toFixed(2));
  };

  const formatDistance = (distKm: number): string => {
    if (distKm < 1) {
      return `${Math.round(distKm * 1000)} m away`;
    }
    return `${distKm.toFixed(1)} km away`;
  };

  // High-Accuracy Real-Time Geolocation Detection
  const handleAcquireAccurateLocation = () => {
    if (!navigator.geolocation) {
      showToast('Geolocation is not supported by your browser.', 'warning');
      return;
    }

    setIsLocating(true);
    showToast('Acquiring high-precision GPS coordinates...', 'info');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const acc = Math.round(pos.coords.accuracy);

        setUserLocation([lat, lng]);
        setUserAccuracy(acc);
        setLocationLabel(`GPS (${lat.toFixed(4)}, ${lng.toFixed(4)}) · ±${acc}m accuracy`);
        showToast(`GPS locked (±${acc}m). Shelters sorted by closest distance.`, 'success');

        // Automatically select the nearest shelter
        const sorted = [...shelters].sort((a, b) => {
          return calculateDistanceKm(lat, lng, a.lat, a.lng) - calculateDistanceKm(lat, lng, b.lat, b.lng);
        });
        if (sorted.length > 0) {
          setSelectedShelterId(sorted[0].id);
        }

        const listContainer = document.getElementById('shelter-cards-list');
        if (listContainer) {
          listContainer.scrollTo({ top: 0, behavior: 'smooth' });
        }
      },
      (err) => {
        setIsLocating(false);
        console.warn('Geolocation error:', err);
        let errorMsg = 'Could not acquire device GPS. Check location permissions.';
        if (err.code === 1) {
          errorMsg = 'Location access denied. Please grant permission in your browser.';
        } else if (err.code === 2) {
          errorMsg = 'GPS signal unavailable from device.';
        } else if (err.code === 3) {
          errorMsg = 'GPS acquisition timed out.';
        }
        showToast(errorMsg, 'warning');
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 0
      }
    );
  };

  const handleClearLocation = () => {
    setUserLocation(null);
    setUserAccuracy(null);
    setLocationLabel('');
    showToast('Cleared active GPS location filter.', 'info');
  };

  // Filter shelters by user search term
  const filteredShelters = useMemo(() => {
    if (!searchQuery.trim()) return shelters;
    const q = searchQuery.toLowerCase();
    return shelters.filter((shelter) => {
      return (
        shelter.name.toLowerCase().includes(q) ||
        shelter.address.toLowerCase().includes(q) ||
        shelter.district.toLowerCase().includes(q) ||
        shelter.coordinatorName.toLowerCase().includes(q) ||
        shelter.code.toLowerCase().includes(q)
      );
    });
  }, [shelters, searchQuery]);

  // Sort strictly by distance if user location is available
  const sortedShelters = useMemo(() => {
    if (!userLocation) return filteredShelters;
    return [...filteredShelters].sort((a, b) => {
      const distA = calculateDistanceKm(userLocation[0], userLocation[1], a.lat, a.lng);
      const distB = calculateDistanceKm(userLocation[0], userLocation[1], b.lat, b.lng);
      return distA - distB;
    });
  }, [filteredShelters, userLocation]);

  const totalVerifiedCapacity = useMemo(() => {
    return shelters.reduce((acc, s) => acc + s.capacity, 0);
  }, [shelters]);

  const totalBedsLeft = useMemo(() => {
    return shelters.reduce((acc, s) => acc + Math.max(0, s.capacity - s.currentOccupancy), 0);
  }, [shelters]);

  const handleGoToRegister = () => {
    if (onNavigateToRegister) {
      onNavigateToRegister();
    } else if (onOpenRegisterModal) {
      onOpenRegisterModal();
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans">
      
      {/* 1. HERO UTILITY SECTION: Immediate search prompt & vital live stats */}
      <section className="bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8 py-4 sm:py-5 elevation-1">
        <div className="max-w-7xl mx-auto">
          
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            
            {/* Quick Live Capacity Pill Strip */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <div className="flex items-center gap-2 bg-[#0F172A] text-white px-3.5 py-2 rounded-2xl shadow-xs">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-xs font-black tracking-tight">
                  {shelters.length} Verified Shelters
                </span>
              </div>

              <div className="flex items-center gap-2 bg-emerald-50 text-emerald-800 border border-emerald-200 px-3.5 py-2 rounded-2xl">
                <Bed className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-black">
                  {totalBedsLeft} Beds Available
                </span>
                <span className="text-[10px] text-emerald-600">
                  / {totalVerifiedCapacity} Total
                </span>
              </div>
            </div>

            {/* Quick Actions Strip */}
            <div className="flex items-center gap-2">
              <button
                id="btn-search-nearby-hero"
                onClick={handleAcquireAccurateLocation}
                disabled={isLocating}
                className="clay-btn-primary px-4 py-2.5 rounded-2xl text-white text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-sm select-none"
              >
                <LocateFixed className={`w-4 h-4 text-sky-200 ${isLocating ? 'animate-spin' : ''}`} />
                <span>{isLocating ? 'Locating...' : 'Locate Nearest Safe Zone'}</span>
              </button>

              <button
                id="btn-hero-register"
                onClick={handleGoToRegister}
                className="px-3.5 py-2.5 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span className="hidden sm:inline">+ Register Shelter</span>
              </button>
            </div>

          </div>

          {/* Active GPS Location Indicator */}
          {userLocation && (
            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 text-[#0F172A]">
                <span className="flex h-2.5 w-2.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#EA580C] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#EA580C]"></span>
                </span>
                <span className="font-bold">
                  Active GPS: <span className="font-mono text-slate-600">{locationLabel || `${userLocation[0].toFixed(4)}, ${userLocation[1].toFixed(4)}`}</span>
                </span>
                {sortedShelters.length > 0 && (
                  <span className="hidden sm:inline-flex items-center gap-1 text-[#059669] font-black bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-lg">
                    Closest: {sortedShelters[0].name} ({formatDistance(calculateDistanceKm(userLocation[0], userLocation[1], sortedShelters[0].lat, sortedShelters[0].lng))})
                  </span>
                )}
              </div>

              <button
                onClick={handleClearLocation}
                className="text-slate-400 hover:text-slate-700 text-xs font-bold flex items-center gap-1 cursor-pointer"
                title="Reset location filter"
              >
                <X className="w-3.5 h-3.5" />
                <span>Clear GPS</span>
              </button>
            </div>
          )}

        </div>
      </section>

      {/* 2. MAIN 12-COLUMN RESPONSIVE LAYOUT (Shelter Cards + Interactive Map) */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-5 flex-1 flex flex-col">
        
        {/* Mobile View Toggle (List vs Map) */}
        <div className="lg:hidden flex items-center p-1 bg-slate-200 rounded-2xl mb-4 text-xs font-bold">
          <button
            onClick={() => setMobileTab('list')}
            className={`flex-1 py-2.5 rounded-xl transition-all cursor-pointer ${
              mobileTab === 'list' ? 'bg-white text-[#0F172A] shadow-sm font-black' : 'text-slate-600'
            }`}
          >
            Safe Zone List ({sortedShelters.length})
          </button>
          <button
            onClick={() => setMobileTab('map')}
            className={`flex-1 py-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              mobileTab === 'map' ? 'bg-white text-[#0F172A] shadow-sm font-black' : 'text-slate-600'
            }`}
          >
            <MapPin className="w-3.5 h-3.5 text-blue-600" />
            <span>Interactive Map</span>
          </button>
        </div>

        {/* Pulsing Project Logo Breathing Loader when locating */}
        {isLocating && (
          <div className="bg-white rounded-3xl p-8 mb-6 border border-slate-200 elevation-2">
            <ProjectLogoLoader 
              message="ACQUIRING HIGH-PRECISION GPS LOCK..."
              subMessage="Triangulating your position against active disaster relief shelters and safe corridors."
            />
          </div>
        )}

        {/* 12-Column Responsive Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1">
          
          {/* LEFT COLUMN: SHELTER CARDS (12 cols mobile, 6 cols desktop) */}
          <div 
            id="shelter-cards-list"
            className={`lg:col-span-6 xl:col-span-6 space-y-4 overflow-y-auto max-h-[800px] pr-1 ${
              mobileTab === 'map' ? 'hidden lg:block' : 'block'
            }`}
          >
            {sortedShelters.map((shelter) => {
              const isSelected = selectedShelterId === shelter.id;
              const availableBeds = Math.max(0, shelter.capacity - shelter.currentOccupancy);
              const isFull = availableBeds === 0 || shelter.status === 'CRITICAL' || shelter.status === 'OVERCAPACITY';

              let distKm: number | null = null;
              if (userLocation) {
                distKm = calculateDistanceKm(userLocation[0], userLocation[1], shelter.lat, shelter.lng);
              }

              return (
                <div
                  key={shelter.id}
                  id={`shelter-card-${shelter.id}`}
                  onClick={() => onSelectShelter(shelter)}
                  className={`bg-white rounded-3xl p-5 border-2 transition-all cursor-pointer select-none ${
                    isSelected 
                      ? 'border-[#0F172A] elevation-3 ring-2 ring-[#0F172A]/20' 
                      : 'border-slate-200 hover:border-slate-300 elevation-1'
                  }`}
                >
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        {!isFull ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase bg-[#059669] text-white">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>{availableBeds} BEDS LEFT</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase bg-[#DC2626] text-white">
                            <AlertTriangle className="w-3 h-3" />
                            <span>AT CAPACITY</span>
                          </span>
                        )}

                        <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          {shelter.code}
                        </span>
                      </div>

                      <h3 className="text-base sm:text-lg font-black text-[#0F172A] leading-tight">
                        {shelter.name}
                      </h3>
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span>{shelter.address}, {shelter.district}</span>
                      </p>
                    </div>

                    {distKm !== null && (
                      <div className="text-right shrink-0 bg-slate-50 p-2 rounded-2xl border border-slate-200">
                        <div className="text-sm font-black text-[#0F172A] font-mono">
                          {formatDistance(distKm)}
                        </div>
                        <div className="text-[10px] font-bold text-emerald-700">
                          Live Corridor
                        </div>
                      </div>
                    )}
                  </div>

                  {/* VITAL RESOURCES BAR */}
                  <div className="grid grid-cols-3 gap-2 mt-4 p-3 bg-slate-50 rounded-2xl border border-slate-100 text-xs">
                    <div className="flex items-center gap-2">
                      <Bed className="w-4 h-4 text-emerald-600 shrink-0" />
                      <div>
                        <div className="text-[10px] text-slate-400 font-bold">CAPACITY</div>
                        <div className="font-extrabold text-[#0F172A]">{availableBeds}/{shelter.capacity}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Droplets className="w-4 h-4 text-sky-600 shrink-0" />
                      <div>
                        <div className="text-[10px] text-slate-400 font-bold">WATER</div>
                        <div className="font-extrabold text-[#0F172A]">{(shelter.resources.waterLiters / 1000).toFixed(1)}k L</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-amber-600 shrink-0" />
                      <div>
                        <div className="text-[10px] text-slate-400 font-bold">FOOD RATIONS</div>
                        <div className="font-extrabold text-[#0F172A]">{shelter.resources.rationKits} Kits</div>
                      </div>
                    </div>
                  </div>

                  {/* VERIFIED COORDINATOR & POLICE NOC */}
                  <div className="mt-3 flex items-center justify-between text-xs text-slate-600 pt-2 border-t border-slate-100">
                    <div className="flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span className="font-bold text-[#0F172A]">{shelter.coordinatorName}</span>
                      <span className="text-[10px] text-slate-400">({shelter.coordinatorPhone})</span>
                    </div>

                    <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      NOC: {shelter.policeNocNumber}
                    </span>
                  </div>

                  {/* ACTION BUTTONS: BOOK SPOT & MAP/CALL */}
                  <div 
                    className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Claymorphic "Book Spot" button */}
                    {onOpenBookSpotModal && !isFull && (
                      <button
                        id={`card-book-spot-${shelter.id}`}
                        onClick={(e) => {
                          createRipple(e);
                          triggerHaptic([50, 40, 80]);
                          onOpenBookSpotModal(shelter);
                        }}
                        className="clay-btn-emergency flex-1 min-h-[44px] py-2.5 px-4 rounded-2xl text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer shadow-md select-none"
                      >
                        {RippleElements}
                        <BookmarkCheck className="w-4 h-4" />
                        <span>Book Spot</span>
                      </button>
                    )}

                    {/* Direct Call Button */}
                    <a
                      id={`card-call-btn-${shelter.id}`}
                      href={`tel:${shelter.contactPhone || shelter.coordinatorPhone}`}
                      className="min-h-[44px] px-3.5 rounded-2xl bg-[#0F172A] hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>Call</span>
                    </a>

                    {/* View Details / Bottom Sheet */}
                    <button
                      id={`card-details-btn-${shelter.id}`}
                      onClick={() => onSelectShelter(shelter)}
                      className="min-h-[44px] px-3.5 rounded-2xl bg-white hover:bg-slate-50 text-[#0F172A] border-2 border-slate-200 text-xs font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                    >
                      <span>Details</span>
                    </button>
                  </div>

                </div>
              );
            })}

            {sortedShelters.length === 0 && (
              <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center text-slate-500 elevation-1">
                <p className="font-black text-base text-[#0F172A]">No shelters match "{searchQuery}"</p>
                <p className="text-xs mt-1">Try searching by sector or area name.</p>
                <button
                  onClick={() => setSearchQuery('')}
                  className="mt-3 text-xs font-bold text-[#EA580C] underline cursor-pointer"
                >
                  Clear Search
                </button>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: IN-APP INTERACTIVE MAP (6 cols desktop) */}
          <div 
            className={`lg:col-span-6 xl:col-span-6 sticky top-24 h-[740px] ${
              mobileTab === 'list' ? 'hidden lg:block' : 'block'
            }`}
          >
            <ShelterMap
              shelters={sortedShelters}
              userLocation={userLocation}
              userAccuracy={userAccuracy}
              onSelectShelter={onSelectShelter}
              selectedShelterId={selectedShelterId}
              onLocateUser={handleAcquireAccurateLocation}
              isLocating={isLocating}
              className="h-full w-full rounded-3xl overflow-hidden border border-slate-200 elevation-2"
            />
          </div>

        </div>

        {/* 3. ACCORDIONS AT THE VERY BOTTOM (Secondary Information strictly at the bottom) */}
        <div className="mt-12 space-y-3 border-t border-slate-200 pt-8 pb-12">
          
          <div className="flex items-center gap-2 mb-2">
            <Info className="w-4 h-4 text-slate-500" />
            <span className="text-xs font-black uppercase tracking-wider text-slate-500">
              Disaster Relief Protocol &amp; Emergency Rights
            </span>
          </div>

          {/* FAQ Accordion */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden elevation-1">
            <button
              onClick={() => setIsFaqOpen((prev) => !prev)}
              className="w-full px-6 py-4 flex items-center justify-between text-left font-extrabold text-sm text-[#0F172A] hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <span>Evacuation, Safe Corridors &amp; Shelter FAQ</span>
              {isFaqOpen ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
            </button>
            {isFaqOpen && (
              <div className="px-6 pb-5 pt-1 text-xs text-slate-600 space-y-3 border-t border-slate-100 leading-relaxed">
                <div>
                  <strong className="text-[#0F172A]">How is bed availability verified?</strong>
                  <p className="mt-0.5">Shelter coordinators report headcounts in real-time through the offline Fast Intake system. Verified numbers are marked with green checkmarks.</p>
                </div>
                <div>
                  <strong className="text-[#0F172A]">What happens if the cellular network goes down?</strong>
                  <p className="mt-0.5">All shelter addresses, GPS coordinates, and offline emergency passes remain fully accessible in your device browser cache.</p>
                </div>
                <div>
                  <strong className="text-[#0F172A]">Can I bring pets and service animals?</strong>
                  <p className="mt-0.5">Yes, designated shelter facilities have dedicated pet areas with animal food kits and veterinary checks.</p>
                </div>
              </div>
            )}
          </div>

          {/* Citizen Shelter Rights Accordion */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden elevation-1">
            <button
              onClick={() => setIsRightsOpen((prev) => !prev)}
              className="w-full px-6 py-4 flex items-center justify-between text-left font-extrabold text-sm text-[#0F172A] hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <span>Disaster Victim Rights &amp; Free Relief Guarantees</span>
              {isRightsOpen ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
            </button>
            {isRightsOpen && (
              <div className="px-6 pb-5 pt-1 text-xs text-slate-600 space-y-3 border-t border-slate-100 leading-relaxed">
                <p>
                  1. <strong>Zero-Cost Shelter &amp; Nutrition:</strong> No fee or charge of any kind may be requested for shelter admission, safe drinking water, dry rations, or sanitation facilities.
                </p>
                <p>
                  2. <strong>Priority Care:</strong> Pregnant women, lactating mothers, children, the elderly, and disabled citizens receive immediate intake priority and dedicated medical attention.
                </p>
                <p>
                  3. <strong>Police &amp; Family Protection:</strong> All designated emergency relief centers are under 24/7 patrol by local Police jurisdictions and licensed civil defense personnel.
                </p>
              </div>
            )}
          </div>

          {/* Official Hotlines Accordion */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden elevation-1">
            <button
              onClick={() => setIsHotlinesOpen((prev) => !prev)}
              className="w-full px-6 py-4 flex items-center justify-between text-left font-extrabold text-sm text-[#0F172A] hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <LifeBuoy className="w-4 h-4 text-rose-600" />
                <span>State &amp; National Disaster Emergency Hotlines</span>
              </div>
              {isHotlinesOpen ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
            </button>
            {isHotlinesOpen && (
              <div className="px-6 pb-5 pt-1 text-xs text-slate-600 border-t border-slate-100">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  <a href="tel:112" className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between font-bold text-[#0F172A] hover:bg-slate-100">
                    <span>National Emergency:</span>
                    <span className="text-rose-600 font-mono text-sm">112</span>
                  </a>
                  <a href="tel:1078" className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between font-bold text-[#0F172A] hover:bg-slate-100">
                    <span>NDRF Disaster Control:</span>
                    <span className="text-rose-600 font-mono text-sm">1078</span>
                  </a>
                  <a href="tel:108" className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between font-bold text-[#0F172A] hover:bg-slate-100">
                    <span>Ambulance / EMT:</span>
                    <span className="text-rose-600 font-mono text-sm">108</span>
                  </a>
                  <a href="tel:101" className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between font-bold text-[#0F172A] hover:bg-slate-100">
                    <span>Fire &amp; Rescue:</span>
                    <span className="text-rose-600 font-mono text-sm">101</span>
                  </a>
                </div>
              </div>
            )}
          </div>

        </div>

      </main>

    </div>
  );
};
