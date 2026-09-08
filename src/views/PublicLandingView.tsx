import React, { useState, useMemo, useEffect } from 'react';
import { useResq } from '../context/ResqContext';
import { Shelter } from '../types';
import { ShelterMap } from '../components/ShelterMap';
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
  X
} from 'lucide-react';

interface PublicLandingViewProps {
  onSelectShelter: (shelter: Shelter) => void;
  onNavigateToDashboard: () => void;
  onNavigateToIntake: () => void;
  onOpenDistressModal?: () => void;
  onOpenRegisterModal?: () => void;
  onNavigateToRegister?: () => void;
  overrideCoordinates?: [number, number] | null;
}

export const PublicLandingView: React.FC<PublicLandingViewProps> = ({
  onSelectShelter,
  onNavigateToDashboard,
  onNavigateToIntake,
  onOpenDistressModal,
  onOpenRegisterModal,
  onNavigateToRegister,
  overrideCoordinates
}) => {
  const { 
    shelters, 
    selectedShelterId, 
    setSelectedShelterId, 
    showToast 
  } = useResq();

  const [searchQuery, setSearchQuery] = useState('');
  const [userLocation, setUserLocation] = useState<[number, number] | null>(
    overrideCoordinates || null
  );
  const [userAccuracy, setUserAccuracy] = useState<number | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationLabel, setLocationLabel] = useState<string>('');
  const [mobileTab, setMobileTab] = useState<'map' | 'list'>('list');

  // Sync override coordinates if provided externally
  useEffect(() => {
    if (overrideCoordinates) {
      setUserLocation(overrideCoordinates);
      setLocationLabel(`Specified Location (${overrideCoordinates[0].toFixed(4)}, ${overrideCoordinates[1].toFixed(4)})`);
    }
  }, [overrideCoordinates]);

  // Haversine accurate distance calculation
  const calculateDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in km
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
        showToast(`Real GPS locked (±${acc}m)! Shelters sorted by closest distance to you.`, 'success');

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
        let errorMsg = 'Could not acquire device GPS. Check browser location permissions.';
        if (err.code === 1) {
          errorMsg = 'Location access denied in browser. Please enable permissions to locate near you.';
        } else if (err.code === 2) {
          errorMsg = 'Location unavailable from device.';
        } else if (err.code === 3) {
          errorMsg = 'GPS location acquisition timed out.';
        }
        showToast(errorMsg, 'warning');
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 0 // Do not use stale cache
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

  const handleGoToRegister = () => {
    if (onNavigateToRegister) {
      onNavigateToRegister();
    } else if (onOpenRegisterModal) {
      onOpenRegisterModal();
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans">
      
      {/* 1. CLEAN EMERGENCY SEARCH & LOCATION HEADER */}
      <section className="bg-[#FFFFFF] border-b border-[#E2E8F0] px-4 sm:px-6 lg:px-8 py-4 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#475569] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              id="shelter-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by shelter name, area, or landmark..."
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-[#F8FAFC] text-[#0F172A] border-2 border-[#E2E8F0] rounded-xl focus:border-[#0F172A] focus:bg-white focus:outline-none transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {/* Locate Me Button with Accurate GPS */}
            <button
              id="btn-search-nearby"
              onClick={handleAcquireAccurateLocation}
              disabled={isLocating}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-[#0F172A] hover:bg-slate-800 disabled:bg-slate-700 text-[#FFFFFF] text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
              title="Detect accurate GPS coordinates and sort nearest shelters first"
            >
              <LocateFixed className={`w-4 h-4 text-[#38BDF8] ${isLocating ? 'animate-spin' : ''}`} />
              <span>{isLocating ? 'Acquiring GPS...' : 'Locate Me'}</span>
            </button>

            {/* Separate Page Register Shelter Button */}
            <button
              id="btn-open-register-shelter"
              onClick={handleGoToRegister}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-[#059669] text-xs font-bold rounded-xl border border-emerald-200 transition-colors cursor-pointer"
              title="Open the shelter registration page"
            >
              <PlusCircle className="w-4 h-4" />
              <span>+ Register Shelter</span>
            </button>

            {/* Emergency SOS Call */}
            {onOpenDistressModal && (
              <button
                id="btn-open-sos-broadcast"
                onClick={onOpenDistressModal}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-[#EA580C] hover:bg-orange-700 text-[#FFFFFF] text-xs font-black rounded-xl shadow-xs transition-colors cursor-pointer"
                title="Emergency distress broadcast"
              >
                <AlertOctagon className="w-4 h-4" />
                <span className="hidden sm:inline">SOS</span>
              </button>
            )}
          </div>

        </div>

        {/* Active GPS Location Indicator (Only shows when real location is active) */}
        {userLocation && (
          <div className="max-w-7xl mx-auto mt-2.5 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-[#0F172A]">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#38BDF8] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#38BDF8]"></span>
              </span>
              <span className="font-medium">
                Your Exact Location: <strong className="font-mono">{locationLabel || `${userLocation[0].toFixed(4)}, ${userLocation[1].toFixed(4)}`}</strong>
              </span>
              {sortedShelters.length > 0 && (
                <span className="hidden sm:inline-flex items-center gap-1 text-[#059669] font-bold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                  Nearest: {sortedShelters[0].name} ({formatDistance(calculateDistanceKm(userLocation[0], userLocation[1], sortedShelters[0].lat, sortedShelters[0].lng))})
                </span>
              )}
            </div>

            <button
              onClick={handleClearLocation}
              className="text-slate-400 hover:text-slate-600 text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
              title="Reset location filter"
            >
              <X className="w-3 h-3" />
              <span>Clear</span>
            </button>
          </div>
        )}
      </section>

      {/* 2. MAIN SPLIT VIEW (Shelter Cards + Interactive Map) */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-5 flex-1 flex flex-col">
        
        {/* Mobile View Toggle */}
        <div className="lg:hidden flex items-center p-1 bg-[#E2E8F0] rounded-xl mb-4 text-xs font-bold">
          <button
            onClick={() => setMobileTab('list')}
            className={`flex-1 py-2 rounded-lg transition-colors cursor-pointer ${
              mobileTab === 'list' ? 'bg-white text-[#0F172A] shadow-xs' : 'text-[#475569]'
            }`}
          >
            Shelter List ({sortedShelters.length})
          </button>
          <button
            onClick={() => setMobileTab('map')}
            className={`flex-1 py-2 rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
              mobileTab === 'map' ? 'bg-white text-[#0F172A] shadow-xs' : 'text-[#475569]'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
            <span>Live Map</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 items-start">
          
          {/* LEFT COLUMN: SHELTER CARDS */}
          <div 
            id="shelter-cards-list"
            className={`lg:col-span-6 xl:col-span-6 space-y-4 max-h-[820px] overflow-y-auto pr-1 scroll-smooth ${
              mobileTab === 'map' ? 'hidden lg:block' : 'block'
            }`}
          >
            <div className="flex items-center justify-between text-xs text-[#475569] px-1 font-semibold">
              <span>{sortedShelters.length} Verified Relief Shelters Available</span>
              {userLocation && (
                <span className="text-[#059669] font-bold">Sorted by proximity to you</span>
              )}
            </div>

            {sortedShelters.map((shelter, idx) => {
              const availableBeds = Math.max(0, shelter.capacity - shelter.currentOccupancy);
              const isFull = availableBeds === 0 || shelter.status === 'CRITICAL' || shelter.status === 'OVERCAPACITY';
              const isSelected = selectedShelterId === shelter.id;
              
              const distanceKm = userLocation
                ? calculateDistanceKm(userLocation[0], userLocation[1], shelter.lat, shelter.lng)
                : null;

              return (
                <div
                  key={shelter.id}
                  id={`shelter-card-${shelter.id}`}
                  onClick={() => {
                    setSelectedShelterId(shelter.id);
                    onSelectShelter(shelter);
                  }}
                  className={`bg-[#FFFFFF] rounded-2xl border transition-all cursor-pointer overflow-hidden p-5 ${
                    isSelected
                      ? 'border-[#0F172A] ring-2 ring-[#0F172A] shadow-md'
                      : 'border-[#E2E8F0] hover:border-slate-400 shadow-xs'
                  }`}
                >
                  {/* Top Status & Proximity */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex flex-wrap items-center gap-2">
                      {!isFull ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-[#059669] text-[#FFFFFF] shadow-xs">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{availableBeds} BEDS AVAILABLE / {shelter.capacity} TOTAL</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-[#DC2626] text-[#FFFFFF] shadow-xs">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>AT CAPACITY</span>
                        </span>
                      )}

                      {/* Distance pill */}
                      {distanceKm !== null && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-sky-50 text-[#0F172A] border border-[#38BDF8]/40">
                          <Navigation className="w-3 h-3 text-[#38BDF8]" />
                          <span>{formatDistance(distanceKm)}</span>
                          {idx === 0 && (
                            <span className="ml-1 text-[10px] text-[#059669] font-black uppercase">
                              (Closest)
                            </span>
                          )}
                        </span>
                      )}
                    </div>

                    <span className="text-xs font-mono font-bold text-[#475569]">
                      {shelter.code}
                    </span>
                  </div>

                  {/* Title & Address */}
                  <h3 className="text-base font-extrabold text-[#0F172A] leading-snug">
                    {shelter.name}
                  </h3>
                  <p className="text-xs text-[#475569] mt-0.5 flex items-start gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span>{shelter.address}, {shelter.district}</span>
                  </p>

                  {/* BASIC REQUIREMENTS SECTION */}
                  <div className="mt-3 p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
                    <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#0F172A] mb-2 flex items-center justify-between border-b border-slate-200 pb-1">
                      <span>Basic Requirements &amp; Stock</span>
                      <span className="text-[10px] font-bold text-[#059669]">Live Readiness</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      {/* Beds */}
                      <div className="flex items-center gap-1.5">
                        <Bed className="w-4 h-4 text-[#059669] shrink-0" />
                        <div>
                          <div className="font-bold text-[#0F172A]">{shelter.resources.bedsAvailable} Beds</div>
                          <div className="text-[10px] text-[#475569]">/ {shelter.capacity} max</div>
                        </div>
                      </div>

                      {/* Clean Water */}
                      <div className="flex items-center gap-1.5">
                        <Droplets className="w-4 h-4 text-[#38BDF8] shrink-0" />
                        <div>
                          <div className="font-bold text-[#0F172A]">{(shelter.resources.waterLiters / 1000).toFixed(1)}k L</div>
                          <div className="text-[10px] text-[#475569]">Drinking Water</div>
                        </div>
                      </div>

                      {/* Ration Kits */}
                      <div className="flex items-center gap-1.5">
                        <Package className="w-4 h-4 text-amber-600 shrink-0" />
                        <div>
                          <div className="font-bold text-[#0F172A]">{shelter.resources.rationKits} Kits</div>
                          <div className="text-[10px] text-[#475569]">Food Rations</div>
                        </div>
                      </div>

                      {/* Medical Aid */}
                      <div className="flex items-center gap-1.5">
                        <HeartPulse className={`w-4 h-4 shrink-0 ${shelter.facilities.medicalAid ? 'text-[#059669]' : 'text-slate-400'}`} />
                        <div>
                          <div className="font-bold text-[#0F172A]">
                            {shelter.facilities.medicalAid ? 'Doctor Unit' : 'First Aid'}
                          </div>
                          <div className="text-[10px] text-[#475569]">
                            {shelter.facilities.medicalAid ? 'On-Site' : 'Standard'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* SHELTER MANAGER DETAILS */}
                  <div className="mt-2.5 p-3 bg-white rounded-xl border border-[#E2E8F0] text-xs">
                    <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#0F172A] mb-1.5 flex items-center justify-between">
                      <span>Person Managing Shelter</span>
                      <span className="text-[10px] font-bold text-[#059669] flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Verified Coordinator</span>
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div>
                        <div className="text-[10px] text-[#475569]">Manager Name &amp; Phone:</div>
                        <div className="font-bold text-[#0F172A]">{shelter.coordinatorName}</div>
                        <div className="font-mono text-[#0F172A] text-[11px] font-semibold">{shelter.coordinatorPhone}</div>
                      </div>

                      <div>
                        <div className="text-[10px] text-[#475569]">Manager Home Address:</div>
                        <div className="text-[11px] text-[#0F172A] font-medium line-clamp-2">
                          {shelter.managerHomeAddress || 'Sector 11, Gandhinagar, Gujarat'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ACTION BUTTONS: CALL & DIRECTIONS */}
                  <div 
                    className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Call Hotline */}
                    <a
                      id={`card-call-hotline-${shelter.id}`}
                      href={`tel:${shelter.contactPhone || shelter.coordinatorPhone}`}
                      className="bg-[#0F172A] hover:bg-slate-800 text-[#FFFFFF] text-xs font-bold py-2.5 px-3 rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>Call Shelter</span>
                    </a>

                    {/* View on In-App Map */}
                    <button
                      id={`card-view-map-${shelter.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectShelter(shelter);
                        setMobileTab('map');
                        const mapEl = document.getElementById('resq-map-container');
                        if (mapEl) {
                          mapEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }
                      }}
                      className="bg-[#FFFFFF] hover:bg-slate-50 text-[#0F172A] text-xs font-bold py-2.5 px-3 rounded-xl border border-[#E2E8F0] transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <MapPin className="w-3.5 h-3.5 text-blue-600" />
                      <span>View on Map</span>
                    </button>
                  </div>

                </div>
              );
            })}

            {sortedShelters.length === 0 && (
              <div className="bg-white p-8 rounded-2xl border border-[#E2E8F0] text-center text-[#475569]">
                <p className="font-bold text-[#0F172A]">No shelters match "{searchQuery}"</p>
                <p className="text-xs mt-1">Try searching by sector or area name.</p>
                <button
                  onClick={() => setSearchQuery('')}
                  className="mt-3 text-xs font-bold text-[#0F172A] underline cursor-pointer"
                >
                  Clear Search
                </button>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: IN-APP INTERACTIVE MAP WITH REAL-TIME LOCATION */}
          <div 
            className={`lg:col-span-6 xl:col-span-6 sticky top-20 h-[720px] ${
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
              className="h-full w-full"
            />
          </div>

        </div>

      </main>

    </div>
  );
};
