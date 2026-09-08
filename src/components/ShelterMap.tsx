import React, { useState, useEffect, useCallback } from 'react';
import {
  APIProvider,
  Map,
  AdvancedMarker,
  InfoWindow,
  useMap
} from '@vis.gl/react-google-maps';
import { Shelter } from '../types';
import { useResq } from '../context/ResqContext';
import {
  MapPin,
  Compass,
  ExternalLink,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Users,
  Droplets,
  HeartPulse,
  Package,
  RotateCcw
} from 'lucide-react';

// Exact coordinate and zoom requested by the user:
// https://www.google.com/maps/@23.1541881,72.6729164,15z
const DEFAULT_CENTER = { lat: 23.1541881, lng: 72.6729164 };
const DEFAULT_ZOOM = 15;
const EXACT_GOOGLE_MAPS_URL = 'https://www.google.com/maps/@23.1541881,72.6729164,15z?entry=ttu&hl=en';

interface ShelterMapProps {
  shelters: Shelter[];
  userLocation: [number, number] | null;
  onSelectShelter: (shelter: Shelter) => void;
  selectedShelterId?: string | null;
  className?: string;
}

// Controller component inside APIProvider & Map context to manage camera movements
const MapCameraController: React.FC<{
  selectedShelter: Shelter | null;
  userLocation: [number, number] | null;
  recenterTrigger: number;
}> = ({ selectedShelter, userLocation, recenterTrigger }) => {
  const map = useMap();

  // Pan to selected shelter
  useEffect(() => {
    if (!map || !selectedShelter) return;
    map.panTo({ lat: selectedShelter.lat, lng: selectedShelter.lng });
    map.setZoom(16);
  }, [map, selectedShelter]);

  // Pan to user location when updated
  useEffect(() => {
    if (!map || !userLocation) return;
    map.panTo({ lat: userLocation[0], lng: userLocation[1] });
    map.setZoom(15);
  }, [map, userLocation]);

  // Handle explicit recenter click
  useEffect(() => {
    if (!map || recenterTrigger === 0) return;
    map.panTo(DEFAULT_CENTER);
    map.setZoom(DEFAULT_ZOOM);
  }, [map, recenterTrigger]);

  return null;
};

export const ShelterMap: React.FC<ShelterMapProps> = ({
  shelters,
  userLocation,
  onSelectShelter,
  selectedShelterId,
  className = ''
}) => {
  const { setSelectedShelterId } = useResq();
  const [activeShelter, setActiveShelter] = useState<Shelter | null>(null);
  const [mapTypeId, setMapTypeId] = useState<'roadmap' | 'satellite' | 'hybrid' | 'terrain'>('roadmap');
  const [recenterCounter, setRecenterCounter] = useState<number>(0);
  const [apiError, setApiError] = useState<boolean>(false);
  const [useDirectEmbed, setUseDirectEmbed] = useState<boolean>(false);

  // Read Google Maps API key from environment variable if configured
  const apiKey = ((import.meta as unknown as { env?: Record<string, string> }).env?.VITE_GOOGLE_MAPS_API_KEY) || '';

  // Synchronize active shelter with external selectedShelterId
  useEffect(() => {
    if (selectedShelterId) {
      const found = shelters.find((s) => s.id === selectedShelterId);
      if (found) {
        setActiveShelter(found);
      }
    }
  }, [selectedShelterId, shelters]);

  const handleMarkerClick = useCallback(
    (shelter: Shelter) => {
      setActiveShelter(shelter);
      setSelectedShelterId(shelter.id);
      onSelectShelter(shelter);
    },
    [onSelectShelter, setSelectedShelterId]
  );

  const handleRecenter = () => {
    setRecenterCounter((prev) => prev + 1);
  };

  return (
    <div
      id="resq-google-map-container"
      className={`relative w-full h-full min-h-[460px] rounded-xl overflow-hidden border border-slate-200 shadow-xs bg-slate-100 flex flex-col ${className}`}
    >
      {/* Top Map Action Bar */}
      <div className="absolute top-3 left-3 right-3 z-20 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* Location & Language Indicator Badge */}
        <div className="pointer-events-auto flex items-center gap-2 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-200/90 shadow-md text-xs">
          <span className="flex h-2.5 w-2.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <div className="flex items-center gap-1.5 font-semibold text-slate-800">
            <span>Google Maps</span>
            <span className="text-slate-400">·</span>
            <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded text-[10px] font-bold">
              English Only
            </span>
            <span className="text-slate-400 hidden sm:inline">·</span>
            <span className="font-mono text-slate-600 hidden sm:inline text-[11px]">
              23.1541881, 72.6729164 (15z)
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="pointer-events-auto flex items-center gap-1.5 bg-white/95 backdrop-blur-md p-1 rounded-lg border border-slate-200/90 shadow-md text-xs">
          {/* Recenter Button */}
          <button
            id="map-btn-recenter"
            onClick={handleRecenter}
            title="Reset view to 23.1541881, 72.6729164 (Zoom 15)"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-md hover:bg-slate-100 text-slate-700 font-medium transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-[#1769AA]" />
            <span className="hidden md:inline">Recenter (15z)</span>
          </button>

          {/* Map Type Selector */}
          <div className="relative group">
            <button
              id="map-btn-layers"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-md hover:bg-slate-100 text-slate-700 font-medium transition-colors cursor-pointer"
              title="Change map style"
            >
              <Layers className="w-3.5 h-3.5 text-slate-600" />
              <span className="capitalize hidden md:inline">{mapTypeId}</span>
            </button>
            <div className="absolute right-0 top-full mt-1 hidden group-hover:flex flex-col bg-white border border-slate-200 rounded-lg shadow-lg p-1 min-w-[120px] z-30">
              {(['roadmap', 'satellite', 'hybrid', 'terrain'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setMapTypeId(type)}
                  className={`text-left px-2.5 py-1.5 rounded text-xs capitalize cursor-pointer transition-colors ${
                    mapTypeId === type
                      ? 'bg-[#1769AA] text-white font-semibold'
                      : 'hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Direct Link to Google Maps */}
          <a
            id="map-btn-open-google"
            href={EXACT_GOOGLE_MAPS_URL}
            target="_blank"
            rel="noopener noreferrer"
            title="Open exact coordinate in Google Maps"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-[#12304A] hover:bg-[#0B1F33] text-white font-medium transition-colors"
          >
            <span>Google Maps</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* Primary Map Canvas: Interactive Google Maps Platform with English Localization */}
      {!useDirectEmbed && !apiError ? (
        <div className="w-full h-full flex-1">
          <APIProvider
            apiKey={apiKey}
            language="en"
            onError={() => {
              // Fallback to direct embed if API key is restricted or fails to load
              setApiError(true);
            }}
          >
            <Map
              id="resq-google-map"
              // Mandatory internal attribution tracking for compliance
              internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
              mapId="DEMO_MAP_ID"
              defaultCenter={DEFAULT_CENTER}
              defaultZoom={DEFAULT_ZOOM}
              mapTypeId={mapTypeId}
              gestureHandling="greedy"
              disableDefaultUI={false}
              fullscreenControl={false}
              streetViewControl={true}
              mapTypeControl={false}
              className="w-full h-full"
            >
              {/* Camera Pan & Center Manager */}
              <MapCameraController
                selectedShelter={activeShelter}
                userLocation={userLocation}
                recenterTrigger={recenterCounter}
              />

              {/* Shelter Advanced Markers */}
              {shelters.map((shelter) => {
                const occPercent = Math.min(
                  100,
                  Math.round(
                    (shelter.currentOccupancy / Math.max(1, shelter.capacity)) * 100
                  )
                );
                const isSelected = activeShelter?.id === shelter.id;

                let badgeBg = '#15803D'; // Emerald
                if (shelter.status === 'CRITICAL' || occPercent >= 90) {
                  badgeBg = '#DC2626'; // Red
                } else if (shelter.status === 'LIMITED' || occPercent >= 70) {
                  badgeBg = '#D97706'; // Amber
                } else if (shelter.status === 'INACTIVE') {
                  badgeBg = '#64748B'; // Slate
                }

                return (
                  <AdvancedMarker
                    key={shelter.id}
                    position={{ lat: shelter.lat, lng: shelter.lng }}
                    onClick={() => handleMarkerClick(shelter)}
                    title={`${shelter.name} (${occPercent}% Occupied)`}
                  >
                    <div
                      className={`relative cursor-pointer transition-transform duration-200 ${
                        isSelected ? 'scale-115 z-30' : 'hover:scale-110 z-10'
                      }`}
                    >
                      <div
                        style={{ backgroundColor: badgeBg }}
                        className={`flex items-center gap-1 text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-lg border-2 ${
                          isSelected ? 'border-amber-300 ring-2 ring-[#12304A]' : 'border-white'
                        } whitespace-nowrap`}
                      >
                        <span className="text-[10px]">
                          {shelter.status === 'CRITICAL' ? '🔴' : shelter.status === 'LIMITED' ? '🟡' : '🟢'}
                        </span>
                        <span>{occPercent}%</span>
                      </div>
                      {/* Anchor arrow indicator */}
                      <div
                        style={{ borderTopColor: badgeBg }}
                        className="w-0 h-0 border-x-4 border-x-transparent border-t-[5px] mx-auto"
                      />
                    </div>
                  </AdvancedMarker>
                );
              })}

              {/* User Real-time Location Marker */}
              {userLocation && (
                <AdvancedMarker
                  position={{ lat: userLocation[0], lng: userLocation[1] }}
                  title="Your Current Location"
                >
                  <div className="relative flex items-center justify-center w-6 h-6">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-500 opacity-75" />
                    <div className="relative w-4 h-4 bg-blue-600 rounded-full border-2 border-white shadow-md" />
                  </div>
                </AdvancedMarker>
              )}

              {/* Interactive InfoWindow for Selected Shelter */}
              {activeShelter && (
                <InfoWindow
                  position={{ lat: activeShelter.lat, lng: activeShelter.lng }}
                  onCloseClick={() => setActiveShelter(null)}
                  maxWidth={320}
                  headerDisabled={false}
                >
                  <div className="p-1 max-w-[290px] font-sans text-slate-900">
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span
                        className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border ${
                          activeShelter.status === 'AVAILABLE'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : activeShelter.status === 'LIMITED'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : 'bg-rose-50 text-rose-800 border-rose-200'
                        }`}
                      >
                        {activeShelter.status}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500 font-semibold">
                        {activeShelter.code}
                      </span>
                    </div>

                    <h4 className="font-bold text-sm text-slate-900 leading-snug mb-1">
                      {activeShelter.name}
                    </h4>
                    <p className="text-xs text-slate-600 mb-2.5 line-clamp-2">
                      {activeShelter.address}
                    </p>

                    {/* Capacity Progress Bar */}
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-2 mb-3">
                      <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3 text-slate-500" />
                          <span>
                            {activeShelter.currentOccupancy} / {activeShelter.capacity} people
                          </span>
                        </span>
                        <span className="font-bold text-slate-900">
                          {Math.round(
                            (activeShelter.currentOccupancy /
                              Math.max(1, activeShelter.capacity)) *
                              100
                          )}
                          %
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                        <div
                          style={{
                            width: `${Math.min(
                              100,
                              (activeShelter.currentOccupancy /
                                Math.max(1, activeShelter.capacity)) *
                                100
                            )}%`
                          }}
                          className={`h-full rounded-full ${
                            activeShelter.status === 'CRITICAL'
                              ? 'bg-rose-600'
                              : activeShelter.status === 'LIMITED'
                              ? 'bg-amber-500'
                              : 'bg-emerald-600'
                          }`}
                        />
                      </div>
                    </div>

                    {/* Quick Resources List */}
                    <div className="grid grid-cols-2 gap-1.5 text-[11px] text-slate-700 mb-3">
                      <div className="flex items-center gap-1">
                        <Droplets className="w-3 h-3 text-cyan-600 shrink-0" />
                        <span>{activeShelter.resources.waterLiters.toLocaleString()} L Water</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Package className="w-3 h-3 text-amber-600 shrink-0" />
                        <span>{activeShelter.resources.rationKits} Ration Kits</span>
                      </div>
                      <div className="flex items-center gap-1 col-span-2">
                        <HeartPulse
                          className={`w-3 h-3 shrink-0 ${
                            activeShelter.facilities.medicalAid ? 'text-emerald-600' : 'text-slate-400'
                          }`}
                        />
                        <span>
                          {activeShelter.facilities.medicalAid
                            ? 'Medical Doctor Unit On-Site'
                            : 'No On-Site Medical Unit'}
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100">
                      <button
                        id={`btn-select-shelter-${activeShelter.id}`}
                        onClick={() => {
                          onSelectShelter(activeShelter);
                          setSelectedShelterId(activeShelter.id);
                        }}
                        className="w-full bg-[#12304A] hover:bg-[#0B1F33] text-white text-xs font-semibold py-1.5 px-2.5 rounded-md text-center transition-colors cursor-pointer"
                      >
                        Select Shelter
                      </button>
                      <a
                        id={`btn-directions-shelter-${activeShelter.id}`}
                        href={`https://www.google.com/maps/dir/?api=1&destination=${activeShelter.lat},${activeShelter.lng}&hl=en`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold py-1.5 px-2.5 rounded-md text-center border border-slate-200 transition-colors flex items-center justify-center gap-1"
                      >
                        <span>Directions</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                </InfoWindow>
              )}
            </Map>
          </APIProvider>
        </div>
      ) : (
        /* Direct Interactive Google Map Embed View (English Only: hl=en) */
        <div className="relative w-full h-full flex-1">
          <iframe
            id="google-maps-direct-frame"
            title="Google Maps Location 23.1541881, 72.6729164"
            src="https://maps.google.com/maps?q=23.1541881,72.6729164&z=15&hl=en&output=embed"
            className="w-full h-full border-0"
            loading="lazy"
            allowFullScreen
          />
          {apiError && (
            <div className="absolute top-14 left-4 right-4 z-20 bg-amber-50 border border-amber-300 text-amber-900 rounded-lg p-3 text-xs flex items-center justify-between shadow-md">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  Showing direct Google Maps view for <strong>23.1541881, 72.6729164 (15z)</strong> in English.
                  Add <code>VITE_GOOGLE_MAPS_API_KEY</code> for custom Advanced Marker overlays.
                </span>
              </div>
              <button
                onClick={() => setApiError(false)}
                className="text-amber-800 underline font-semibold text-xs ml-2 cursor-pointer"
              >
                Retry API
              </button>
            </div>
          )}
        </div>
      )}

      {/* Floating Bottom Legend & Coordinates Bar */}
      <div className="absolute bottom-3 left-3 right-3 z-10 pointer-events-none flex flex-wrap items-center justify-between gap-2">
        {/* Map Legend */}
        <div className="pointer-events-auto bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-lg px-3 py-2 shadow-md text-xs flex items-center gap-3">
          <div className="font-bold text-slate-800 text-[11px] uppercase tracking-wider hidden sm:inline">
            Status:
          </div>
          <div className="flex items-center gap-1.5 text-slate-700">
            <span className="w-2.5 h-2.5 rounded-full bg-[#15803D]" />
            <span>Available (&lt;70%)</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-700">
            <span className="w-2.5 h-2.5 rounded-full bg-[#D97706]" />
            <span>Limited (70-89%)</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-700">
            <span className="w-2.5 h-2.5 rounded-full bg-[#DC2626]" />
            <span>Critical (&gt;90%)</span>
          </div>
        </div>

        {/* View Switcher Toggle */}
        <div className="pointer-events-auto bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-lg p-1 shadow-md text-xs flex items-center gap-1">
          <button
            onClick={() => setUseDirectEmbed(false)}
            className={`px-2.5 py-1 rounded text-xs font-semibold cursor-pointer transition-colors ${
              !useDirectEmbed
                ? 'bg-[#12304A] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Interactive Shelters
          </button>
          <button
            onClick={() => setUseDirectEmbed(true)}
            className={`px-2.5 py-1 rounded text-xs font-semibold cursor-pointer transition-colors ${
              useDirectEmbed
                ? 'bg-[#12304A] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Direct Google Map
          </button>
        </div>
      </div>
    </div>
  );
};
