import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { 
  APIProvider, 
  Map, 
  AdvancedMarker, 
  InfoWindow, 
  useMap,
  ControlPosition,
  MapControl
} from '@vis.gl/react-google-maps';
import { Shelter } from '../types';
import { OccupancyBar } from './OccupancyBar';
import { InteractiveLeafletMap } from './InteractiveLeafletMap';
import { 
  MapPin, 
  Navigation, 
  Phone, 
  LocateFixed, 
  Maximize2, 
  CheckCircle2, 
  AlertTriangle, 
  Info, 
  UserPlus, 
  ShieldCheck,
  Compass,
  Radio,
  Sliders,
  Settings,
  ExternalLink
} from 'lucide-react';

interface GoogleShelterMapProps {
  shelters: Shelter[];
  selectedShelterId?: string | null;
  onSelectShelter: (shelter: Shelter) => void;
  userCoordinates?: [number, number] | null;
  userAccuracy?: number | null;
  onNavigateToIntake?: (shelterId?: string) => void;
  className?: string;
  onUserLocationChange?: (lat: number, lng: number, accuracy?: number) => void;
  radiusKm?: number | null;
  onRadiusChange?: (radius: number | null) => void;
}

// Inner controller that accesses the google.maps.Map instance
const MapController: React.FC<{
  shelters: Shelter[];
  selectedShelter: Shelter | null;
  userLocation: [number, number] | null;
  triggerFitAll: number;
  triggerRecenterUser: number;
}> = ({ shelters, selectedShelter, userLocation, triggerFitAll, triggerRecenterUser }) => {
  const map = useMap();
  const initialFitDone = useRef(false);

  // Fit all shelters and user position into view
  const fitAll = useCallback(() => {
    if (!map || typeof google === 'undefined' || !google.maps || !google.maps.LatLngBounds) return;
    const bounds = new google.maps.LatLngBounds();
    let count = 0;

    shelters.forEach((s) => {
      if (typeof s.lat === 'number' && typeof s.lng === 'number') {
        bounds.extend({ lat: s.lat, lng: s.lng });
        count++;
      }
    });

    if (userLocation) {
      bounds.extend({ lat: userLocation[0], lng: userLocation[1] });
      count++;
    }

    if (count > 0) {
      map.fitBounds(bounds, { top: 60, right: 60, bottom: 60, left: 60 });
    }
  }, [map, shelters, userLocation]);

  // Initial fit on map ready
  useEffect(() => {
    if (map && !initialFitDone.current && shelters.length > 0) {
      fitAll();
      initialFitDone.current = true;
    }
  }, [map, shelters, fitAll]);

  // Handle triggerFitAll
  useEffect(() => {
    if (triggerFitAll > 0) {
      fitAll();
    }
  }, [triggerFitAll, fitAll]);

  // Handle triggerRecenterUser or live location update
  useEffect(() => {
    if (triggerRecenterUser > 0 && map && userLocation) {
      map.panTo({ lat: userLocation[0], lng: userLocation[1] });
      map.setZoom(15);
    }
  }, [triggerRecenterUser, map, userLocation]);

  // Smoothly pan to selected shelter when selection changes
  useEffect(() => {
    if (map && selectedShelter) {
      map.panTo({ lat: selectedShelter.lat, lng: selectedShelter.lng });
      if (map.getZoom() && (map.getZoom() || 0) < 14) {
        map.setZoom(14);
      }
    }
  }, [map, selectedShelter]);

  return null;
};

export const GoogleShelterMap: React.FC<GoogleShelterMapProps> = ({
  shelters,
  selectedShelterId,
  onSelectShelter,
  userCoordinates,
  userAccuracy,
  onNavigateToIntake,
  className = 'w-full h-full min-h-[480px]',
  onUserLocationChange,
  radiusKm = null,
  onRadiusChange
}) => {
  // Google Maps API Key from Vite env or local state
  const envApiKey = (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string) || '';
  const [customApiKey, setCustomApiKey] = useState<string>(() => {
    return localStorage.getItem('resq_custom_maps_key') || '';
  });
  const activeApiKey = customApiKey || envApiKey;

  // Active Map Engine: default to 'LEAFLET' if no API key, or 'GOOGLE' if key is present
  const [mapEngine, setMapEngine] = useState<'LEAFLET' | 'GOOGLE'>(() => {
    return activeApiKey ? 'GOOGLE' : 'LEAFLET';
  });

  const [googleLoadFailed, setGoogleLoadFailed] = useState<boolean>(false);
  const [showConfigModal, setShowConfigModal] = useState<boolean>(false);
  const [tempApiKey, setTempApiKey] = useState<string>(customApiKey);

  // Internal user coordinates state
  const [liveLocation, setLiveLocation] = useState<[number, number] | null>(
    userCoordinates || null
  );
  const [liveAccuracy, setLiveAccuracy] = useState<number | null>(userAccuracy || null);
  const [activeInfoWindow, setActiveInfoWindow] = useState<Shelter | null>(null);
  const [showUserLocationInfo, setShowUserLocationInfo] = useState<boolean>(false);

  const [triggerFitAll, setTriggerFitAll] = useState<number>(0);
  const [triggerRecenterUser, setTriggerRecenterUser] = useState<number>(0);

  // Sync external coordinate overrides
  useEffect(() => {
    if (userCoordinates) {
      setLiveLocation(userCoordinates);
    }
    if (userAccuracy) {
      setLiveAccuracy(userAccuracy);
    }
  }, [userCoordinates, userAccuracy]);

  // Sync selected shelter from props to InfoWindow
  useEffect(() => {
    if (selectedShelterId) {
      const match = shelters.find((s) => s.id === selectedShelterId);
      if (match) {
        setActiveInfoWindow(match);
      }
    }
  }, [selectedShelterId, shelters]);

  // Haversine Distance helper
  const calculateDistanceKm = useCallback((lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // km
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
      return `${Math.round(distKm * 1000)} m`;
    }
    return `${distKm.toFixed(1)} km`;
  };

  // Find the selected shelter object
  const selectedShelter = useMemo(() => {
    return shelters.find((s) => s.id === selectedShelterId) || null;
  }, [shelters, selectedShelterId]);

  // Filter shelters by radius if applicable
  const displayShelters = useMemo(() => {
    if (!radiusKm || !liveLocation) return shelters;
    return shelters.filter((s) => {
      const dist = calculateDistanceKm(liveLocation[0], liveLocation[1], s.lat, s.lng);
      return dist <= radiusKm;
    });
  }, [shelters, liveLocation, radiusKm, calculateDistanceKm]);

  // Nearest shelter calculation relative to live location
  const nearestShelter = useMemo(() => {
    if (!liveLocation || displayShelters.length === 0) return null;
    let closest: Shelter = displayShelters[0];
    let minDistance = calculateDistanceKm(liveLocation[0], liveLocation[1], displayShelters[0].lat, displayShelters[0].lng);

    for (let i = 1; i < displayShelters.length; i++) {
      const dist = calculateDistanceKm(liveLocation[0], liveLocation[1], displayShelters[i].lat, displayShelters[i].lng);
      if (dist < minDistance) {
        minDistance = dist;
        closest = displayShelters[i];
      }
    }
    return { shelter: closest, distanceKm: minDistance };
  }, [liveLocation, displayShelters, calculateDistanceKm]);

  // Default Center
  const defaultCenter = useMemo(() => {
    if (liveLocation) {
      return { lat: liveLocation[0], lng: liveLocation[1] };
    }
    if (shelters.length > 0) {
      return { lat: shelters[0].lat, lng: shelters[0].lng };
    }
    return { lat: 23.1541881, lng: 72.6729164 };
  }, [liveLocation, shelters]);

  const handleMarkerClick = (shelter: Shelter) => {
    setActiveInfoWindow(shelter);
    setShowUserLocationInfo(false);
    onSelectShelter(shelter);
  };

  const handleRecenterToLiveUser = () => {
    if (liveLocation) {
      setTriggerRecenterUser((prev) => prev + 1);
    } else if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          const acc = Math.round(pos.coords.accuracy);
          setLiveLocation([lat, lng]);
          setLiveAccuracy(acc);
          if (onUserLocationChange) {
            onUserLocationChange(lat, lng, acc);
          }
          setTriggerRecenterUser((prev) => prev + 1);
        },
        () => {
          setTriggerRecenterUser((prev) => prev + 1);
        },
        { enableHighAccuracy: true }
      );
    }
  };

  const handleSaveCustomKey = () => {
    const cleanKey = tempApiKey.trim();
    setCustomApiKey(cleanKey);
    localStorage.setItem('resq_custom_maps_key', cleanKey);
    setShowConfigModal(false);
    if (cleanKey) {
      setGoogleLoadFailed(false);
      setMapEngine('GOOGLE');
    }
  };

  // If map engine is Leaflet, or if Google failed to load, render high-performance Leaflet radar map
  if (mapEngine === 'LEAFLET' || googleLoadFailed || !activeApiKey) {
    return (
      <div className={`relative flex flex-col ${className}`}>
        {/* Engine Switcher Bar */}
        <div className="bg-slate-900 text-white px-3 py-1.5 flex items-center justify-between gap-2 text-[11px] rounded-t-2xl z-20">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 font-bold text-emerald-400">
              <Radio className="w-3.5 h-3.5 animate-pulse" />
              <span>Emergency Radar Active (Zero-Lag Mode)</span>
            </span>
            <span className="text-slate-400 text-[10px] hidden md:inline">
              · 100% Real-time GPS &amp; Proximity Sorting
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowConfigModal(true)}
              className="flex items-center gap-1 px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded border border-slate-700 text-[10px] font-bold transition-colors cursor-pointer"
              title="Configure Google Maps Platform Key"
            >
              <Settings className="w-3 h-3 text-blue-400" />
              <span>{activeApiKey ? 'Maps Key Set' : 'Use Google Maps API'}</span>
            </button>

            {activeApiKey && (
              <button
                onClick={() => {
                  setGoogleLoadFailed(false);
                  setMapEngine('GOOGLE');
                }}
                className="px-2 py-0.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-[10px] font-bold transition-colors cursor-pointer"
              >
                Switch to Google Maps ↗
              </button>
            )}
          </div>
        </div>

        <InteractiveLeafletMap
          shelters={shelters}
          selectedShelterId={selectedShelterId}
          onSelectShelter={onSelectShelter}
          userCoordinates={liveLocation}
          userAccuracy={liveAccuracy}
          onNavigateToIntake={onNavigateToIntake}
          className="w-full flex-1 rounded-b-2xl rounded-t-none border-t-0"
          onUserLocationChange={onUserLocationChange}
          radiusKm={radiusKm}
          onRadiusChange={onRadiusChange}
        />

        {/* Modal for Setting Google Maps API Key or Demo Key */}
        {showConfigModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-[9999]">
            <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200">
              <h3 className="text-base font-extrabold text-[#0F172A] mb-1">
                Google Maps Platform Configuration
              </h3>
              <p className="text-xs text-slate-600 mb-4 leading-relaxed">
                You can prototype for free with the official <strong>Google Maps Demo Key</strong> (no credit card or Cloud billing required), or enter your Google Cloud API Key.
              </p>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-[#0F172A] mb-1">
                    Google Maps API Key / Demo Key
                  </label>
                  <input
                    type="text"
                    value={tempApiKey}
                    onChange={(e) => setTempApiKey(e.target.value)}
                    placeholder="AIzaSy..."
                    className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>

                <div className="bg-blue-50 border border-blue-200 p-2.5 rounded-lg text-[11px] text-blue-900 flex items-start gap-2">
                  <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <span>Get a free instant prototype key from </span>
                    <a
                      href="https://mapsplatform.google.com/maps-demo-key?utm_campaign=gmp_mcp_codeassist_v1_aistudio"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-bold underline text-blue-700 hover:text-blue-900 inline-flex items-center gap-0.5"
                    >
                      Google Maps Demo Key Portal <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                  <button
                    onClick={() => setShowConfigModal(false)}
                    className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:text-slate-800 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveCustomKey}
                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg cursor-pointer transition-colors"
                  >
                    Save &amp; Activate
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Google Maps Platform Mode
  return (
    <div className={`relative overflow-hidden rounded-2xl border border-[#E2E8F0] shadow-sm bg-slate-100 flex flex-col ${className}`}>
      
      {/* Map Header / Telemetry Bar */}
      <div className="bg-[#FFFFFF] border-b border-[#E2E8F0] px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs z-10">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 font-extrabold text-[#0F172A]">
            <Compass className="w-4 h-4 text-blue-600 animate-spin-slow" />
            <span>Google Maps Platform</span>
          </div>
          <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200">
            {displayShelters.length} Rescue Centres
          </span>
        </div>

        {/* Live GPS status */}
        <div className="flex items-center gap-2">
          {liveLocation ? (
            <div className="flex items-center gap-1.5 text-slate-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="font-medium text-[11px]">
                Live GPS: <span className="font-mono font-bold text-[#0F172A]">{liveLocation[0].toFixed(4)}, {liveLocation[1].toFixed(4)}</span>
                {liveAccuracy && <span className="text-slate-500 ml-1">(±{liveAccuracy}m)</span>}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded text-[11px] font-semibold">
              <Radio className="w-3 h-3 animate-pulse" />
              <span>Acquiring GPS...</span>
            </div>
          )}

          {/* Engine Switcher to Leaflet */}
          <button
            onClick={() => setMapEngine('LEAFLET')}
            className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition-colors cursor-pointer border border-slate-200 text-[11px]"
            title="Switch back to Open Radar Map"
          >
            Radar Map Mode
          </button>

          {/* Fit all centres button */}
          <button
            onClick={() => setTriggerFitAll((prev) => prev + 1)}
            className="flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-[#0F172A] font-bold rounded-lg transition-colors cursor-pointer border border-slate-200 text-xs"
            title="Fit all rescue centres in view"
          >
            <Maximize2 className="w-3.5 h-3.5 text-slate-600" />
            <span className="hidden md:inline">Fit All</span>
          </button>
        </div>
      </div>

      {/* Primary Google Map Container */}
      <div className="relative flex-1 w-full h-full min-h-[420px]">
        <APIProvider 
          apiKey={activeApiKey} 
          libraries={['marker', 'places', 'geometry']}
          onError={() => {
            console.warn('Google Maps API failed to load. Falling back to Leaflet Emergency Radar.');
            setGoogleLoadFailed(true);
          }}
        >
          <Map
            id="resq-google-map"
            mapId={'DEMO_MAP_ID'}
            defaultCenter={defaultCenter}
            defaultZoom={12}
            gestureHandling={'greedy'}
            disableDefaultUI={false}
            zoomControl={true}
            mapTypeControl={true}
            streetViewControl={false}
            fullscreenControl={true}
            className="w-full h-full min-h-[420px]"
            internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
            onClick={(e) => {
              if (e.detail?.latLng && onUserLocationChange) {
                const lat = e.detail.latLng.lat;
                const lng = e.detail.latLng.lng;
                onUserLocationChange(lat, lng, 20);
              }
            }}
          >
            {/* Map Camera / Pan Controller */}
            <MapController
              shelters={displayShelters}
              selectedShelter={selectedShelter}
              userLocation={liveLocation}
              triggerFitAll={triggerFitAll}
              triggerRecenterUser={triggerRecenterUser}
            />

            {/* LIVE USER REAL-TIME LOCATION MARKER */}
            {liveLocation && (
              <AdvancedMarker
                position={{ lat: liveLocation[0], lng: liveLocation[1] }}
                title="Your Current Real-Time Location"
                onClick={() => {
                  setShowUserLocationInfo(true);
                  setActiveInfoWindow(null);
                }}
              >
                <div className="relative flex items-center justify-center cursor-pointer group">
                  <div className="absolute -inset-3 bg-blue-500/20 rounded-full animate-ping pointer-events-none" />
                  <div className="absolute -inset-1.5 bg-blue-500/30 rounded-full pointer-events-none" />
                  
                  <div className="w-5 h-5 bg-blue-600 border-2 border-white rounded-full shadow-lg flex items-center justify-center text-white text-[10px] font-black z-10">
                    <div className="w-2 h-2 bg-white rounded-full" />
                  </div>

                  <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-[#0F172A] text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-md whitespace-nowrap pointer-events-none">
                    You Are Here
                  </div>
                </div>
              </AdvancedMarker>
            )}

            {/* INFO WINDOW FOR LIVE USER LOCATION */}
            {showUserLocationInfo && liveLocation && (
              <InfoWindow
                position={{ lat: liveLocation[0], lng: liveLocation[1] }}
                onCloseClick={() => setShowUserLocationInfo(false)}
              >
                <div className="p-3 text-[#0F172A] max-w-[260px] font-sans">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-blue-700 mb-1">
                    <LocateFixed className="w-4 h-4 text-blue-600" />
                    <span>Your Live GPS Coordinates</span>
                  </div>
                  <div className="text-[11px] font-mono font-semibold bg-slate-100 p-1.5 rounded border border-slate-200">
                    {liveLocation[0].toFixed(6)}, {liveLocation[1].toFixed(6)}
                  </div>
                  {liveAccuracy && (
                    <div className="text-[10px] text-slate-500 mt-1">
                      Device precision: ±{liveAccuracy} meters
                    </div>
                  )}

                  {nearestShelter && (
                    <div className="mt-2 pt-2 border-t border-slate-200 text-[11px]">
                      <div className="text-[10px] text-slate-500 font-bold uppercase">Closest Rescue Centre:</div>
                      <div className="font-extrabold text-[#0F172A] mt-0.5">{nearestShelter.shelter.name}</div>
                      <div className="text-[#059669] font-bold text-xs mt-0.5 flex items-center gap-1">
                        <Navigation className="w-3 h-3" />
                        <span>{formatDistance(nearestShelter.distanceKm)} from here</span>
                      </div>
                      <button
                        onClick={() => {
                          onSelectShelter(nearestShelter.shelter);
                          setActiveInfoWindow(nearestShelter.shelter);
                          setShowUserLocationInfo(false);
                        }}
                        className="mt-2 w-full py-1.5 px-2 bg-[#0F172A] hover:bg-slate-800 text-white rounded-lg text-[10px] font-bold transition-colors cursor-pointer"
                      >
                        Inspect Nearest Shelter
                      </button>
                    </div>
                  )}
                </div>
              </InfoWindow>
            )}

            {/* RESCUE CENTRES MARKERS */}
            {displayShelters.map((shelter) => {
              const availableBeds = Math.max(0, shelter.capacity - shelter.currentOccupancy);
              const isFull = availableBeds === 0 || shelter.status === 'CRITICAL' || shelter.status === 'OVERCAPACITY';
              const isSelected = selectedShelterId === shelter.id;

              return (
                <AdvancedMarker
                  key={shelter.id}
                  position={{ lat: shelter.lat, lng: shelter.lng }}
                  title={`${shelter.name} (${availableBeds} beds available)`}
                  onClick={() => handleMarkerClick(shelter)}
                >
                  <div 
                    className={`relative cursor-pointer transition-transform duration-200 ${
                      isSelected ? 'scale-110 z-50' : 'hover:scale-105 z-20'
                    }`}
                  >
                    <div 
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl shadow-md border font-sans text-xs font-black transition-all ${
                        isFull
                          ? 'bg-[#DC2626] text-white border-red-800'
                          : 'bg-[#059669] text-white border-emerald-800'
                      } ${isSelected ? 'ring-3 ring-blue-500 shadow-xl' : ''}`}
                    >
                      {isFull ? (
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      ) : (
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                      )}
                      <span className="whitespace-nowrap font-extrabold tracking-tight">
                        {isFull ? 'FULL' : `${availableBeds} Beds`}
                      </span>
                    </div>

                    <div 
                      className={`w-0 h-0 mx-auto border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[7px] ${
                        isFull ? 'border-t-[#DC2626]' : 'border-t-[#059669]'
                      }`}
                    />
                  </div>
                </AdvancedMarker>
              );
            })}

            {/* INFO WINDOW FOR ACTIVE RESCUE CENTRE */}
            {activeInfoWindow && (
              <InfoWindow
                position={{ lat: activeInfoWindow.lat, lng: activeInfoWindow.lng }}
                onCloseClick={() => setActiveInfoWindow(null)}
              >
                <div className="p-3 text-[#0F172A] max-w-[320px] font-sans">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <span className="text-[10px] font-mono font-bold text-slate-500 uppercase">
                        {activeInfoWindow.code}
                      </span>
                      <h4 className="font-extrabold text-sm text-[#0F172A] leading-tight">
                        {activeInfoWindow.name}
                      </h4>
                    </div>
                    {activeInfoWindow.capacity - activeInfoWindow.currentOccupancy > 0 ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-[#059669] shrink-0">
                        {activeInfoWindow.capacity - activeInfoWindow.currentOccupancy} BEDS OPEN
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 text-[#DC2626] shrink-0">
                        AT CAPACITY
                      </span>
                    )}
                  </div>

                  <div className="mb-2">
                    <OccupancyBar
                      current={activeInfoWindow.currentOccupancy}
                      capacity={activeInfoWindow.capacity}
                      status={activeInfoWindow.status}
                      size="sm"
                    />
                  </div>

                  {liveLocation && (
                    <div className="text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-1 rounded-lg mb-2 flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Navigation className="w-3 h-3 text-blue-600" />
                        <span>Distance from you:</span>
                      </span>
                      <span className="font-mono">
                        {formatDistance(
                          calculateDistanceKm(
                            liveLocation[0],
                            liveLocation[1],
                            activeInfoWindow.lat,
                            activeInfoWindow.lng
                          )
                        )}
                      </span>
                    </div>
                  )}

                  <div className="text-[11px] text-slate-600 mb-2 flex items-start gap-1">
                    <MapPin className="w-3 h-3 text-slate-400 shrink-0 mt-0.5" />
                    <span>{activeInfoWindow.address}, {activeInfoWindow.district}</span>
                  </div>

                  <div className="text-[10px] text-slate-700 bg-slate-50 p-2 rounded-lg border border-slate-200 mb-3 flex items-center justify-between">
                    <div>
                      <span className="text-slate-400">Coordinator: </span>
                      <strong className="text-[#0F172A]">{activeInfoWindow.coordinatorName}</strong>
                    </div>
                    <span className="text-[#059669] font-bold flex items-center gap-0.5">
                      <ShieldCheck className="w-3 h-3" />
                      <span>Verified</span>
                    </span>
                  </div>

                  <div className="space-y-1.5 pt-1 border-t border-slate-100">
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${activeInfoWindow.lat},${activeInfoWindow.lng}&travelmode=driving`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      <span>Turn-by-Turn GPS Directions ↗</span>
                    </a>

                    <div className="grid grid-cols-2 gap-1.5">
                      <a
                        href={`tel:${activeInfoWindow.contactPhone || activeInfoWindow.coordinatorPhone}`}
                        className="py-1.5 px-2 bg-[#0F172A] hover:bg-slate-800 text-white rounded-lg text-[11px] font-bold transition-colors flex items-center justify-center gap-1"
                      >
                        <Phone className="w-3 h-3" />
                        <span>Call</span>
                      </a>

                      <button
                        onClick={() => {
                          onSelectShelter(activeInfoWindow);
                        }}
                        className="py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-[#0F172A] rounded-lg text-[11px] font-bold border border-slate-300 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Info className="w-3 h-3 text-blue-600" />
                        <span>Details</span>
                      </button>
                    </div>

                    {onNavigateToIntake && (
                      <button
                        onClick={() => {
                          onNavigateToIntake(activeInfoWindow.id);
                        }}
                        className="w-full py-1 px-2 text-slate-600 hover:text-slate-900 text-[10px] font-bold transition-colors flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <UserPlus className="w-3 h-3" />
                        <span>Open Resident Intake for this Centre</span>
                      </button>
                    )}
                  </div>
                </div>
              </InfoWindow>
            )}

            {/* Quick In-Map Floating Action Bar */}
            <MapControl position={ControlPosition.TOP_LEFT}>
              <div className="m-3 flex flex-col gap-2 z-10">
                <div className="bg-white/95 backdrop-blur-xs rounded-xl shadow-lg border border-slate-200 p-1 flex items-center gap-1">
                  <button
                    onClick={handleRecenterToLiveUser}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0F172A] hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-xs"
                    title="Recenter map to your current GPS position"
                  >
                    <LocateFixed className="w-3.5 h-3.5 text-[#38BDF8] animate-pulse" />
                    <span>My Location</span>
                  </button>

                  <button
                    onClick={() => setTriggerFitAll((prev) => prev + 1)}
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold transition-colors cursor-pointer border border-slate-200"
                    title="Show all rescue centres"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Fit All</span>
                  </button>
                </div>

                {/* Radius Filter in Google Maps mode */}
                {liveLocation && onRadiusChange && (
                  <div className="bg-white/95 backdrop-blur-xs rounded-xl shadow-md border border-slate-200 px-2 py-1.5 flex items-center gap-1 text-[11px]">
                    <span className="text-slate-500 font-bold flex items-center gap-1 mr-1">
                      <Sliders className="w-3 h-3 text-slate-400" />
                      <span>Radius:</span>
                    </span>
                    {[
                      { label: 'All', value: null },
                      { label: '5km', value: 5 },
                      { label: '10km', value: 10 },
                      { label: '25km', value: 25 },
                    ].map((item) => (
                      <button
                        key={item.label}
                        onClick={() => onRadiusChange(item.value)}
                        className={`px-2 py-0.5 rounded-md font-bold transition-colors cursor-pointer ${
                          radiusKm === item.value
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </MapControl>

          </Map>
        </APIProvider>
      </div>

      {/* Map Legend Footer */}
      <div className="bg-[#FFFFFF] border-t border-[#E2E8F0] px-4 py-2 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-600">
        <div className="flex items-center gap-3">
          <span className="font-bold text-[#0F172A]">Legend:</span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#059669] inline-block" />
            <span>Available Beds</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#DC2626] inline-block" />
            <span>At Capacity / Critical</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block" />
            <span>Your Live GPS</span>
          </span>
        </div>

        <div className="text-[10px] text-slate-400">
          Powered by Google Maps Platform · AdvancedMarkerElement
        </div>
      </div>

    </div>
  );
};
