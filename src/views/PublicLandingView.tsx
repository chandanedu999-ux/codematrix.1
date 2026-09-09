import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useResq } from '../context/ResqContext';
import { Shelter } from '../types';
import { GoogleShelterMap } from '../components/GoogleShelterMap';
import { 
  Search, 
  MapPin, 
  Navigation, 
  ShieldCheck, 
  Phone, 
  Droplets,
  Package,
  Bed,
  HeartPulse,
  CheckCircle2,
  AlertTriangle,
  PlusCircle,
  AlertOctagon,
  LocateFixed,
  X,
  Info,
  Layers,
  Compass,
  LayoutGrid
} from 'lucide-react';

interface PublicLandingViewProps {
  onSelectShelter: (shelter: Shelter) => void;
  onNavigateToDashboard: () => void;
  onNavigateToIntake: (shelterId?: string) => void;
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
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'AVAILABLE' | 'FULL'>('ALL');
  const [viewMode, setViewMode] = useState<'SPLIT' | 'MAP' | 'LIST'>('SPLIT');
  const [userLocation, setUserLocation] = useState<[number, number] | null>(
    overrideCoordinates || null
  );
  const [userAccuracy, setUserAccuracy] = useState<number | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationLabel, setLocationLabel] = useState<string>('');
  const [radiusFilter, setRadiusFilter] = useState<number | null>(null);
  
  const mapSectionRef = useRef<HTMLDivElement>(null);

  // Quick preset relocation helper
  const handleSetPresetLocation = useCallback((lat: number, lng: number, label: string) => {
    setUserLocation([lat, lng]);
    setUserAccuracy(25);
    setLocationLabel(label);
    showToast(`Position set to ${label}. Shelters sorted by closest distance.`, 'success');
  }, [showToast]);

  // Initial location lock on mount
  useEffect(() => {
    if (!userLocation && !overrideCoordinates) {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;
            const acc = Math.round(pos.coords.accuracy);
            setUserLocation([lat, lng]);
            setUserAccuracy(acc);
            setLocationLabel(`GPS (${lat.toFixed(4)}, ${lng.toFixed(4)}) · ±${acc}m`);
          },
          () => {
            // Geolocation blocked or in iframe: default to Gandhinagar Sector 11 Relief Zone
            setUserLocation([23.1541881, 72.6729164]);
            setUserAccuracy(50);
            setLocationLabel('Gandhinagar Relief Zone (HQ)');
          },
          { enableHighAccuracy: true, timeout: 6000 }
        );
      } else {
        setUserLocation([23.1541881, 72.6729164]);
        setUserAccuracy(50);
        setLocationLabel('Gandhinagar Relief Zone (HQ)');
      }
    }
  }, []);

  // Sync override coordinates if provided externally
  useEffect(() => {
    if (overrideCoordinates) {
      setUserLocation(overrideCoordinates);
      setLocationLabel(`Specified Location (${overrideCoordinates[0].toFixed(4)}, ${overrideCoordinates[1].toFixed(4)})`);
    }
  }, [overrideCoordinates]);

  // Haversine accurate distance calculation
  const calculateDistanceKm = useCallback((lat1: number, lon1: number, lat2: number, lon2: number): number => {
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
  }, []);

  const formatDistance = (distKm: number): string => {
    if (distKm < 1) {
      return `${Math.round(distKm * 1000)} m away`;
    }
    return `${distKm.toFixed(1)} km away`;
  };

  // High-Accuracy Real-Time Geolocation Detection with IP Fallback
  const handleAcquireAccurateLocation = () => {
    setIsLocating(true);
    showToast('Acquiring high-precision GPS coordinates...', 'info');

    if (!navigator.geolocation) {
      fallbackIpLocation();
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const acc = Math.round(pos.coords.accuracy);

        setUserLocation([lat, lng]);
        setUserAccuracy(acc);
        setLocationLabel(`GPS (${lat.toFixed(4)}, ${lng.toFixed(4)}) · ±${acc}m accuracy`);
        showToast(`Real GPS locked (±${acc}m)! Shelters and map sorted by closest distance.`, 'success');

        // Automatically select the nearest shelter
        const sorted = [...shelters].sort((a, b) => {
          return calculateDistanceKm(lat, lng, a.lat, a.lng) - calculateDistanceKm(lat, lng, b.lat, b.lng);
        });
        if (sorted.length > 0) {
          setSelectedShelterId(sorted[0].id);
        }
      },
      (err) => {
        console.warn('Browser GPS acquisition failed, attempting network IP geolocation:', err.message);
        fallbackIpLocation();
      },
      {
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 0
      }
    );
  };

  const fallbackIpLocation = () => {
    fetch('https://get.geojs.io/v1/ip/geo.json')
      .then((res) => res.json())
      .then((data) => {
        setIsLocating(false);
        if (data && data.latitude && data.longitude) {
          const lat = parseFloat(data.latitude);
          const lng = parseFloat(data.longitude);
          setUserLocation([lat, lng]);
          setUserAccuracy(5000);
          const label = `IP Geolocation (${data.city || 'Detected Region'}, ${data.country_code || ''})`;
          setLocationLabel(label);
          showToast(`Detected location near ${data.city || 'your area'} (${lat.toFixed(3)}, ${lng.toFixed(3)})`, 'info');
        } else {
          handleSetPresetLocation(23.1541881, 72.6729164, 'Gandhinagar Relief Zone (HQ)');
        }
      })
      .catch(() => {
        setIsLocating(false);
        handleSetPresetLocation(23.1541881, 72.6729164, 'Gandhinagar Relief Zone (HQ)');
      });
  };

  const handleClearLocation = () => {
    setUserLocation(null);
    setUserAccuracy(null);
    setLocationLabel('');
    setRadiusFilter(null);
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
  }, [filteredShelters, userLocation, calculateDistanceKm]);

  // Status-filtered and radius-filtered shelters
  const displayedShelters = useMemo(() => {
    return sortedShelters.filter((s) => {
      // Radius filter check
      if (radiusFilter && userLocation) {
        const dist = calculateDistanceKm(userLocation[0], userLocation[1], s.lat, s.lng);
        if (dist > radiusFilter) return false;
      }

      if (statusFilter === 'ALL') return true;
      const availableBeds = Math.max(0, s.capacity - s.currentOccupancy);
      const isFull = availableBeds === 0 || s.status === 'CRITICAL' || s.status === 'OVERCAPACITY';
      if (statusFilter === 'AVAILABLE') return !isFull;
      if (statusFilter === 'FULL') return isFull;
      return true;
    });
  }, [sortedShelters, statusFilter, radiusFilter, userLocation, calculateDistanceKm]);

  const availableCount = useMemo(() => {
    return sortedShelters.filter((s) => {
      const availableBeds = Math.max(0, s.capacity - s.currentOccupancy);
      return availableBeds > 0 && s.status !== 'CRITICAL' && s.status !== 'OVERCAPACITY';
    }).length;
  }, [sortedShelters]);

  const fullCount = sortedShelters.length - availableCount;

  const handleGoToRegister = () => {
    if (onNavigateToRegister) {
      onNavigateToRegister();
    } else if (onOpenRegisterModal) {
      onOpenRegisterModal();
    }
  };

  const handleLocateCentreOnMap = (shelter: Shelter) => {
    setSelectedShelterId(shelter.id);
    if (viewMode === 'LIST') {
      setViewMode('SPLIT');
    }
    if (mapSectionRef.current) {
      mapSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  };

  // Selected shelter object for Map-Only bottom preview
  const selectedShelterObj = useMemo(() => {
    return shelters.find((s) => s.id === selectedShelterId) || null;
  }, [shelters, selectedShelterId]);

  // Reusable Shelter Card Item
  const renderShelterCard = (shelter: Shelter, idx: number, isCompact = false) => {
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
        className={`bg-[#FFFFFF] rounded-2xl border transition-all cursor-pointer overflow-hidden p-4 sm:p-5 flex flex-col justify-between ${
          isSelected
            ? 'border-blue-600 ring-2 ring-blue-500 shadow-md'
            : 'border-[#E2E8F0] hover:border-slate-400 shadow-xs'
        }`}
      >
        <div>
          {/* Top Status & Proximity */}
          <div className="flex items-start justify-between gap-2 mb-2.5">
            <div className="flex flex-wrap items-center gap-2">
              {!isFull ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-extrabold bg-[#059669] text-[#FFFFFF] shadow-xs">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{availableBeds} BEDS / {shelter.capacity} TOTAL</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-extrabold bg-[#DC2626] text-[#FFFFFF] shadow-xs">
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
          <p className="text-xs text-[#475569] mt-1 flex items-start gap-1">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
            <span>{shelter.address}, {shelter.district}</span>
          </p>

          {/* BASIC REQUIREMENTS SECTION */}
          <div className="mt-3 p-2.5 sm:p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
            <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#0F172A] mb-1.5 flex items-center justify-between border-b border-slate-200 pb-1">
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
                  <div className="text-[10px] text-[#475569]">Water</div>
                </div>
              </div>

              {/* Ration Kits */}
              <div className="flex items-center gap-1.5">
                <Package className="w-4 h-4 text-amber-600 shrink-0" />
                <div>
                  <div className="font-bold text-[#0F172A]">{shelter.resources.rationKits} Kits</div>
                  <div className="text-[10px] text-[#475569]">Rations</div>
                </div>
              </div>

              {/* Medical Aid */}
              <div className="flex items-center gap-1.5">
                <HeartPulse className={`w-4 h-4 shrink-0 ${shelter.facilities.medicalAid ? 'text-[#059669]' : 'text-slate-400'}`} />
                <div>
                  <div className="font-bold text-[#0F172A]">
                    {shelter.facilities.medicalAid ? 'Doctor' : 'First Aid'}
                  </div>
                  <div className="text-[10px] text-[#475569]">
                    {shelter.facilities.medicalAid ? 'On-Site' : 'Standard'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* SHELTER MANAGER DETAILS */}
          <div className="mt-2.5 p-2.5 sm:p-3 bg-white rounded-xl border border-[#E2E8F0] text-xs">
            <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#0F172A] mb-1.5 flex items-center justify-between">
              <span>Person Managing Shelter</span>
              <span className="text-[10px] font-bold text-[#059669] flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Verified Coordinator</span>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div>
                <div className="text-[10px] text-[#475569]">Manager:</div>
                <div className="font-bold text-[#0F172A]">{shelter.coordinatorName}</div>
                <div className="font-mono text-[#0F172A] text-[11px] font-semibold">{shelter.coordinatorPhone}</div>
              </div>

              <div>
                <div className="text-[10px] text-[#475569]">Location:</div>
                <div className="text-[11px] text-[#0F172A] font-medium line-clamp-2">
                  {shelter.managerHomeAddress || 'Sector 11, Gandhinagar'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ACTION BUTTONS: CALL, DETAILS & MAP FOCUS */}
        <div 
          className="mt-3.5 pt-3 border-t border-slate-100 grid grid-cols-3 gap-1.5"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Call Hotline */}
          <a
            id={`card-call-hotline-${shelter.id}`}
            href={`tel:${shelter.contactPhone || shelter.coordinatorPhone}`}
            className="bg-[#0F172A] hover:bg-slate-800 text-[#FFFFFF] text-xs font-bold py-2 px-2 rounded-xl transition-colors flex items-center justify-center gap-1 shadow-xs"
          >
            <Phone className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Call</span>
          </a>

          {/* View Details / Open Drawer */}
          <button
            id={`card-view-details-${shelter.id}`}
            onClick={(e) => {
              e.stopPropagation();
              onSelectShelter(shelter);
            }}
            className="bg-[#FFFFFF] hover:bg-slate-50 text-[#0F172A] text-xs font-bold py-2 px-2 rounded-xl border border-[#E2E8F0] transition-colors flex items-center justify-center gap-1 cursor-pointer shadow-xs"
          >
            <Info className="w-3.5 h-3.5 text-blue-600" />
            <span>Details</span>
          </button>

          {/* Locate On Google Map */}
          <button
            id={`card-locate-map-${shelter.id}`}
            onClick={(e) => {
              e.stopPropagation();
              handleLocateCentreOnMap(shelter);
            }}
            className="bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold py-2 px-2 rounded-xl border border-blue-200 transition-colors flex items-center justify-center gap-1 cursor-pointer"
            title="Focus this rescue centre on Google Map"
          >
            <Compass className="w-3.5 h-3.5 text-blue-600" />
            <span>On Map</span>
          </button>
        </div>

      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans">
      
      {/* 1. EMERGENCY SEARCH & LOCATION HEADER */}
      <section className="bg-[#FFFFFF] border-b border-[#E2E8F0] px-4 sm:px-6 lg:px-8 py-3.5 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#475569] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              id="shelter-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search rescue centres by name, sector, landmark, or coordinator..."
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
            {/* Locate Me Button with Real-Time Accurate GPS */}
            <button
              id="btn-search-nearby"
              onClick={handleAcquireAccurateLocation}
              disabled={isLocating}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-[#0F172A] hover:bg-slate-800 disabled:bg-slate-700 text-[#FFFFFF] text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
              title="Detect real-time GPS coordinates and locate all centres relative to you"
            >
              <LocateFixed className={`w-4 h-4 text-[#38BDF8] ${isLocating ? 'animate-spin' : ''}`} />
              <span>{isLocating ? 'Acquiring GPS...' : 'Locate Me (GPS)'}</span>
            </button>

            {/* Separate Page Register Shelter Button */}
            <button
              id="btn-open-register-shelter"
              onClick={handleGoToRegister}
              className="flex items-center gap-1.5 px-3.5 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-[#059669] text-xs font-bold rounded-xl border border-emerald-200 transition-colors cursor-pointer"
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
                className="flex items-center gap-1.5 px-3.5 py-2.5 bg-[#EA580C] hover:bg-orange-700 text-[#FFFFFF] text-xs font-black rounded-xl shadow-xs transition-colors cursor-pointer"
                title="Emergency distress broadcast"
              >
                <AlertOctagon className="w-4 h-4" />
                <span className="hidden sm:inline">SOS</span>
              </button>
            )}
          </div>

        </div>

        {/* Active GPS Location Indicator (Shows when live coordinates are locked) */}
        <div className="max-w-7xl mx-auto mt-2.5 pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2 text-[#0F172A]">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#38BDF8] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#38BDF8]"></span>
            </span>
            <span className="font-medium">
              Active Location: <strong className="font-mono text-blue-700">{locationLabel || (userLocation ? `${userLocation[0].toFixed(4)}, ${userLocation[1].toFixed(4)}` : 'Detecting...')}</strong>
            </span>

            {/* Quick Location Presets */}
            <div className="flex items-center gap-1 ml-1">
              <button
                onClick={() => handleSetPresetLocation(23.1541881, 72.6729164, 'Gandhinagar Relief HQ')}
                className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] transition-colors cursor-pointer border border-slate-200"
                title="Switch location to Gandhinagar Relief Sector 11"
              >
                📍 Gandhinagar HQ
              </button>
              <button
                onClick={() => handleSetPresetLocation(23.0583, 72.5850, 'Ahmedabad Relief Hub')}
                className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] transition-colors cursor-pointer border border-slate-200"
                title="Switch location to Ahmedabad Relief Hub"
              >
                📍 Ahmedabad
              </button>
              <button
                onClick={handleAcquireAccurateLocation}
                className="px-2 py-0.5 rounded-md bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-[11px] transition-colors cursor-pointer border border-blue-200"
                title="Detect device GPS"
              >
                📡 Live GPS
              </button>
            </div>

            {/* Radius Filter Pills */}
            <div className="flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200 text-[11px] ml-1">
              <span className="text-slate-500 font-bold">Nearby:</span>
              {[
                { label: 'All', value: null },
                { label: '5 km', value: 5 },
                { label: '10 km', value: 10 },
                { label: '25 km', value: 25 },
              ].map((r) => (
                <button
                  key={r.label}
                  onClick={() => setRadiusFilter(r.value)}
                  className={`px-1.5 py-0.5 rounded font-bold transition-colors cursor-pointer ${
                    radiusFilter === r.value
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>

            {sortedShelters.length > 0 && userLocation && (
              <span className="hidden lg:inline-flex items-center gap-1 text-[#059669] font-bold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-[11px]">
                Nearest: {sortedShelters[0].name} ({formatDistance(calculateDistanceKm(userLocation[0], userLocation[1], sortedShelters[0].lat, sortedShelters[0].lng))})
              </span>
            )}
          </div>

          {userLocation && (
            <button
              onClick={handleClearLocation}
              className="text-slate-400 hover:text-slate-600 text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
              title="Reset location filter"
            >
              <X className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </section>

      {/* 2. MAIN DIRECTORY & GOOGLE MAP CONTENT */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-5 flex-1 flex flex-col">
        
        {/* Controls Bar: Counts, View Mode Switcher & Status Filter Chips */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 mb-4 border-b border-[#E2E8F0]">
          <div>
            <h2 className="text-base font-extrabold text-[#0F172A] flex items-center gap-2">
              <span>Rescue Centres on Real-Time Map</span>
              <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                {displayedShelters.length} Available
              </span>
            </h2>
            {userLocation ? (
              <p className="text-xs text-[#059669] font-bold mt-0.5">
                Actively positioned with real-time GPS coordinates
              </p>
            ) : (
              <p className="text-xs text-slate-500 mt-0.5">
                Click "Locate Me (GPS)" to pinpoint your live location and see nearest shelters
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* View Mode Toggle: Split vs Full Map vs Cards */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                id="view-mode-split-btn"
                onClick={() => setViewMode('SPLIT')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'SPLIT'
                    ? 'bg-white text-[#0F172A] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Google Map & Cards side-by-side"
              >
                <Layers className="w-3.5 h-3.5 text-blue-600" />
                <span className="hidden sm:inline">Map &amp; List</span>
              </button>

              <button
                id="view-mode-map-btn"
                onClick={() => setViewMode('MAP')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'MAP'
                    ? 'bg-white text-[#0F172A] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Expanded full-screen Google Map"
              >
                <Compass className="w-3.5 h-3.5 text-blue-600" />
                <span>Google Map</span>
              </button>

              <button
                id="view-mode-list-btn"
                onClick={() => setViewMode('LIST')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'LIST'
                    ? 'bg-white text-[#0F172A] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Cards Directory only"
              >
                <LayoutGrid className="w-3.5 h-3.5 text-slate-600" />
                <span className="hidden sm:inline">Cards Only</span>
              </button>
            </div>

            {/* Status Filter Chips */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setStatusFilter('ALL')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  statusFilter === 'ALL'
                    ? 'bg-[#0F172A] text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                All ({sortedShelters.length})
              </button>
              <button
                onClick={() => setStatusFilter('AVAILABLE')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  statusFilter === 'AVAILABLE'
                    ? 'bg-[#059669] text-white shadow-xs'
                    : 'bg-white text-emerald-700 hover:bg-emerald-50 border border-emerald-200'
                }`}
              >
                Has Beds ({availableCount})
              </button>
              <button
                onClick={() => setStatusFilter('FULL')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  statusFilter === 'FULL'
                    ? 'bg-[#DC2626] text-white shadow-xs'
                    : 'bg-white text-rose-700 hover:bg-rose-50 border border-rose-200'
                }`}
              >
                Full ({fullCount})
              </button>
            </div>
          </div>
        </div>

        {/* 3. DYNAMIC CONTENT BASED ON VIEW MODE */}

        {/* MODE 1: SPLIT VIEW (Google Map on Left, Cards on Right) */}
        {viewMode === 'SPLIT' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* Google Map Container (Sticky on Desktop) */}
            <div 
              ref={mapSectionRef}
              className="lg:col-span-6 xl:col-span-7 lg:sticky lg:top-20 h-[420px] lg:h-[calc(100vh-180px)] min-h-[400px] w-full"
            >
              <GoogleShelterMap
                shelters={displayedShelters}
                selectedShelterId={selectedShelterId}
                onSelectShelter={onSelectShelter}
                userCoordinates={userLocation}
                userAccuracy={userAccuracy}
                onNavigateToIntake={onNavigateToIntake}
                radiusKm={radiusFilter}
                onRadiusChange={setRadiusFilter}
                onUserLocationChange={(lat, lng, acc) => {
                  setUserLocation([lat, lng]);
                  if (acc) setUserAccuracy(acc);
                }}
                className="w-full h-full"
              />
            </div>

            {/* Scrollable Cards Column */}
            <div className="lg:col-span-6 xl:col-span-5 space-y-4">
              {displayedShelters.map((shelter, idx) => renderShelterCard(shelter, idx, true))}

              {displayedShelters.length === 0 && (
                <div className="bg-white p-8 rounded-2xl border border-[#E2E8F0] text-center text-[#475569]">
                  <p className="font-bold text-[#0F172A] text-sm">No rescue centres match your criteria</p>
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setStatusFilter('ALL');
                    }}
                    className="mt-3 px-3 py-1.5 bg-[#0F172A] text-white text-xs font-bold rounded-lg cursor-pointer"
                  >
                    Reset Filters
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* MODE 2: EXPANDED GOOGLE MAP VIEW */}
        {viewMode === 'MAP' && (
          <div className="flex-1 flex flex-col h-[calc(100vh-220px)] min-h-[540px] relative">
            <GoogleShelterMap
              shelters={displayedShelters}
              selectedShelterId={selectedShelterId}
              onSelectShelter={onSelectShelter}
              userCoordinates={userLocation}
              userAccuracy={userAccuracy}
              onNavigateToIntake={onNavigateToIntake}
              radiusKm={radiusFilter}
              onRadiusChange={setRadiusFilter}
              onUserLocationChange={(lat, lng, acc) => {
                setUserLocation([lat, lng]);
                if (acc) setUserAccuracy(acc);
              }}
              className="w-full h-full flex-1"
            />

            {/* Floating selected shelter preview drawer */}
            {selectedShelterObj && (
              <div className="absolute bottom-4 left-4 right-4 max-w-lg mx-auto bg-white/95 backdrop-blur-md rounded-2xl border border-slate-300 shadow-2xl p-4 z-20 animate-in fade-in slide-in-from-bottom-3 duration-200">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-mono font-bold text-slate-500 uppercase">
                        {selectedShelterObj.code}
                      </span>
                      {selectedShelterObj.capacity - selectedShelterObj.currentOccupancy > 0 ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#059669] text-white">
                          {selectedShelterObj.capacity - selectedShelterObj.currentOccupancy} BEDS OPEN
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#DC2626] text-white">
                          AT CAPACITY
                        </span>
                      )}
                    </div>

                    <h4 className="font-extrabold text-sm text-[#0F172A]">
                      {selectedShelterObj.name}
                    </h4>
                    <p className="text-xs text-slate-600 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{selectedShelterObj.address}</span>
                    </p>
                  </div>

                  <button
                    onClick={() => setSelectedShelterId(null)}
                    className="text-slate-400 hover:text-slate-600 p-1"
                    title="Dismiss"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-3 pt-2 border-t border-slate-100">
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${selectedShelterObj.lat},${selectedShelterObj.lng}&travelmode=driving`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1.5 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    <span>Google Directions ↗</span>
                  </a>

                  <button
                    onClick={() => onSelectShelter(selectedShelterObj)}
                    className="flex items-center justify-center gap-1.5 py-2 px-3 bg-[#0F172A] hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    <Info className="w-3.5 h-3.5 text-blue-400" />
                    <span>View Full Details</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* MODE 3: CARDS DIRECTORY ONLY */}
        {viewMode === 'LIST' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {displayedShelters.map((shelter, idx) => renderShelterCard(shelter, idx, false))}

            {displayedShelters.length === 0 && (
              <div className="col-span-full bg-white p-12 rounded-2xl border border-[#E2E8F0] text-center text-[#475569] my-6">
                <p className="font-bold text-[#0F172A] text-base">No shelters found</p>
                <p className="text-xs mt-1">
                  {searchQuery ? `No shelters matched "${searchQuery}".` : 'No shelters match the selected filter.'}
                </p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setStatusFilter('ALL');
                  }}
                  className="mt-4 px-4 py-2 bg-[#0F172A] text-white text-xs font-bold rounded-xl cursor-pointer"
                >
                  Reset Filters
                </button>
              </div>
            )}
          </div>
        )}

      </main>

    </div>
  );
};
