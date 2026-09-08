import React, { useState, useEffect, useRef, useCallback } from 'react';
import L from 'leaflet';
import { Shelter } from '../types';
import { useResq } from '../context/ResqContext';
import {
  MapPin,
  Layers,
  Phone,
  Bed,
  Navigation,
  Compass,
  LocateFixed,
  Maximize2,
  ZoomIn,
  ZoomOut,
  RefreshCw,
  Clock,
  Sparkles,
  Route
} from 'lucide-react';

const DEFAULT_CENTER: [number, number] = [23.1541881, 72.6729164];
const DEFAULT_ZOOM = 14;

interface ShelterMapProps {
  shelters: Shelter[];
  userLocation: [number, number] | null;
  userAccuracy?: number | null;
  onSelectShelter: (shelter: Shelter) => void;
  selectedShelterId?: string | null;
  onLocateUser?: () => void;
  isLocating?: boolean;
  className?: string;
}

export const ShelterMap: React.FC<ShelterMapProps> = ({
  shelters,
  userLocation,
  userAccuracy,
  onSelectShelter,
  selectedShelterId,
  onLocateUser,
  isLocating = false,
  className = ''
}) => {
  const { setSelectedShelterId } = useResq();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const accuracyCircleRef = useRef<L.Circle | null>(null);
  const routeLineRef = useRef<L.Polyline | null>(null);

  const [activeShelter, setActiveShelter] = useState<Shelter | null>(null);
  const [mapTheme, setMapTheme] = useState<'light' | 'streets' | 'satellite'>('light');
  const [isLiveWatching, setIsLiveWatching] = useState<boolean>(true);
  const [liveLocation, setLiveLocation] = useState<[number, number] | null>(userLocation);
  const [liveAccuracy, setLiveAccuracy] = useState<number | null>(userAccuracy || null);
  const [liveTimestamp, setLiveTimestamp] = useState<string>('Live');

  // Tile layer URLs (Free, OpenStreetMap / CARTO Positron - zero API keys required)
  const tileProviders = {
    light: {
      url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
      attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    },
    streets: {
      url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    },
    satellite: {
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
    }
  };

  // Sync active shelter with external selectedShelterId
  useEffect(() => {
    if (selectedShelterId) {
      const found = shelters.find((s) => s.id === selectedShelterId);
      if (found) {
        setActiveShelter(found);
      }
    }
  }, [selectedShelterId, shelters]);

  // Sync external userLocation prop if passed
  useEffect(() => {
    if (userLocation) {
      setLiveLocation(userLocation);
      if (userAccuracy) setLiveAccuracy(userAccuracy);
      setLiveTimestamp(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }
  }, [userLocation, userAccuracy]);

  // Real-Time Location Geolocation Watcher
  useEffect(() => {
    if (!navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const acc = Math.round(pos.coords.accuracy);
        setLiveLocation([lat, lng]);
        setLiveAccuracy(acc);
        setLiveTimestamp(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      },
      (err) => {
        console.warn('Real-time geolocation watch notice:', err.message);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 10000
      }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return; // Prevent double init

    const initialCenter = liveLocation || (shelters.length > 0 ? [shelters[0].lat, shelters[0].lng] : DEFAULT_CENTER);

    const map = L.map(mapContainerRef.current, {
      center: initialCenter,
      zoom: DEFAULT_ZOOM,
      zoomControl: false, // We supply custom accessible controls
      attributionControl: false
    });

    // Add Attribution in bottom right with minimal footprint
    L.control.attribution({ position: 'bottomright', prefix: 'RESQTECH Engine' }).addTo(map);

    // Initial tile layer
    const provider = tileProviders[mapTheme];
    const tiles = L.tileLayer(provider.url, {
      attribution: provider.attribution,
      maxZoom: 19
    }).addTo(map);

    tileLayerRef.current = tiles;

    // Create Layer Groups for markers and route
    const markersGroup = L.layerGroup().addTo(map);
    markersLayerRef.current = markersGroup;

    mapInstanceRef.current = map;

    // Invalidate size on container resize
    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });
    resizeObserver.observe(mapContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update tile layer when theme changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    const provider = tileProviders[mapTheme];
    const newTiles = L.tileLayer(provider.url, {
      attribution: provider.attribution,
      maxZoom: 19
    }).addTo(map);

    tileLayerRef.current = newTiles;
  }, [mapTheme]);

  // Update Real-time User Location Marker & Accuracy Circle
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (liveLocation) {
      const [lat, lng] = liveLocation;

      // Custom pulsing GPS DivIcon
      const userHtml = `
        <div class="relative flex items-center justify-center w-8 h-8 pointer-events-none">
          <div class="absolute w-8 h-8 rounded-full bg-blue-500/30 animate-ping"></div>
          <div class="absolute w-6 h-6 rounded-full bg-blue-500/20 border-2 border-blue-500"></div>
          <div class="relative w-3.5 h-3.5 rounded-full bg-blue-600 border-2 border-white shadow-md"></div>
        </div>
      `;

      const userIcon = L.divIcon({
        html: userHtml,
        className: 'user-gps-marker',
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      if (userMarkerRef.current) {
        userMarkerRef.current.setLatLng([lat, lng]);
      } else {
        userMarkerRef.current = L.marker([lat, lng], {
          icon: userIcon,
          zIndexOffset: 1000
        }).addTo(map);

        userMarkerRef.current.bindTooltip('<b>Your Live Location</b><br/>High Precision GPS', {
          direction: 'top',
          offset: [0, -14],
          className: 'px-2 py-1 bg-slate-900 text-white text-xs rounded-md shadow-md border-0'
        });
      }

      // Accuracy circle
      if (liveAccuracy && liveAccuracy > 0) {
        if (accuracyCircleRef.current) {
          accuracyCircleRef.current.setLatLng([lat, lng]);
          accuracyCircleRef.current.setRadius(Math.min(liveAccuracy, 500));
        } else {
          accuracyCircleRef.current = L.circle([lat, lng], {
            radius: Math.min(liveAccuracy, 500),
            color: '#3B82F6',
            fillColor: '#60A5FA',
            fillOpacity: 0.12,
            weight: 1.5,
            dashArray: '3, 4'
          }).addTo(map);
        }
      }
    } else {
      if (userMarkerRef.current) {
        map.removeLayer(userMarkerRef.current);
        userMarkerRef.current = null;
      }
      if (accuracyCircleRef.current) {
        map.removeLayer(accuracyCircleRef.current);
        accuracyCircleRef.current = null;
      }
    }
  }, [liveLocation, liveAccuracy]);

  // Render Shelter Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersGroup = markersLayerRef.current;
    if (!map || !markersGroup) return;

    markersGroup.clearLayers();

    shelters.forEach((shelter) => {
      const avail = Math.max(0, shelter.capacity - shelter.currentOccupancy);
      const isFull = avail === 0;
      const isSelected = activeShelter?.id === shelter.id;

      const bgColor = isFull ? '#DC2626' : '#059669';
      const ringColor = isSelected ? '#0F172A' : isFull ? '#FCA5A5' : '#6EE7B7';
      const scaleClass = isSelected ? 'scale-110 -translate-y-1 ring-4 ring-slate-900' : 'hover:scale-105';

      const markerHtml = `
        <div class="relative flex flex-col items-center cursor-pointer transition-all duration-200 ${scaleClass}">
          <div class="flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-bold text-white shadow-lg border-2 border-white" style="background-color: ${bgColor};">
            <svg class="w-3 h-3 text-white shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
            </svg>
            <span class="font-mono leading-none">${isFull ? 'FULL' : `${avail}B`}</span>
          </div>
          <div class="w-2 h-2 -mt-1 rotate-45 border-r border-b border-white" style="background-color: ${bgColor};"></div>
          ${
            isSelected
              ? `<div class="absolute -top-1 -right-1 w-3 h-3 bg-amber-400 rounded-full border-2 border-white shadow-xs"></div>`
              : ''
          }
        </div>
      `;

      const customIcon = L.divIcon({
        html: markerHtml,
        className: 'shelter-custom-pin',
        iconSize: [60, 34],
        iconAnchor: [30, 30]
      });

      const marker = L.marker([shelter.lat, shelter.lng], {
        icon: customIcon,
        zIndexOffset: isSelected ? 500 : 100
      });

      marker.on('click', () => {
        handleMarkerClick(shelter);
      });

      marker.bindTooltip(
        `<b>${shelter.name}</b><br/><span style="color:${isFull ? '#DC2626' : '#059669'};font-weight:bold;">${
          isFull ? 'At Capacity' : `${avail} Beds Available`
        }</span>`,
        {
          direction: 'top',
          offset: [0, -26],
          className: 'px-2.5 py-1.5 bg-white text-slate-900 text-xs rounded-lg shadow-lg border border-slate-200'
        }
      );

      marker.addTo(markersGroup);
    });
  }, [shelters, activeShelter]);

  // Update Route Polyline between user location and active shelter
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (routeLineRef.current) {
      map.removeLayer(routeLineRef.current);
      routeLineRef.current = null;
    }

    if (liveLocation && activeShelter) {
      const latlngs: [number, number][] = [liveLocation, [activeShelter.lat, activeShelter.lng]];
      const polyline = L.polyline(latlngs, {
        color: '#2563EB',
        weight: 3.5,
        opacity: 0.85,
        dashArray: '6, 8',
        lineCap: 'round'
      }).addTo(map);

      routeLineRef.current = polyline;
    }
  }, [liveLocation, activeShelter]);

  const handleMarkerClick = useCallback(
    (shelter: Shelter) => {
      setActiveShelter(shelter);
      setSelectedShelterId(shelter.id);
      onSelectShelter(shelter);

      if (mapInstanceRef.current) {
        mapInstanceRef.current.flyTo([shelter.lat, shelter.lng], 16, {
          duration: 0.8
        });
      }
    },
    [onSelectShelter, setSelectedShelterId]
  );

  // Recenter to live user location
  const handleCenterOnUser = () => {
    if (onLocateUser) {
      onLocateUser();
    }
    if (liveLocation && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo(liveLocation, 16, { duration: 0.8 });
    }
  };

  // Fit all shelters and user into view
  const handleFitAll = () => {
    if (!mapInstanceRef.current) return;
    const bounds = L.latLngBounds(shelters.map((s) => [s.lat, s.lng] as [number, number]));
    if (liveLocation) {
      bounds.extend(liveLocation);
    }
    if (bounds.isValid()) {
      mapInstanceRef.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 });
    }
  };

  // Zoom helpers
  const handleZoomIn = () => {
    mapInstanceRef.current?.zoomIn();
  };
  const handleZoomOut = () => {
    mapInstanceRef.current?.zoomOut();
  };

  // Haversine distance calculator for bottom chips
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c;
    return d < 1 ? `${Math.round(d * 1000)}m` : `${d.toFixed(1)}km`;
  };

  return (
    <div
      id="resq-map-container"
      className={`relative w-full h-full flex flex-col rounded-2xl overflow-hidden border border-[#E2E8F0] shadow-sm bg-slate-100 ${className}`}
    >
      {/* Top Floating Control Bar */}
      <div className="absolute top-3 left-3 right-3 z-[400] flex items-center justify-between pointer-events-none gap-2">
        {/* Real-time Location Indicator Badge */}
        <div className="pointer-events-auto bg-white/95 backdrop-blur-md border border-[#E2E8F0] rounded-xl px-3 py-2 shadow-md flex items-center gap-2 text-xs">
          <div className="relative flex items-center justify-center w-3 h-3">
            <span className="absolute w-3 h-3 rounded-full bg-blue-500 animate-ping opacity-75"></span>
            <span className="relative w-2 h-2 rounded-full bg-blue-600"></span>
          </div>
          <div>
            <div className="font-bold text-[#0F172A] flex items-center gap-1.5 leading-tight">
              <span>Real-Time In-App Map</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 bg-blue-50 text-blue-700 border border-blue-200 rounded">
                GPS Active
              </span>
            </div>
            <div className="text-[11px] text-slate-500 leading-tight">
              {liveLocation ? (
                <>
                  <span className="font-mono">{liveLocation[0].toFixed(4)}, {liveLocation[1].toFixed(4)}</span>
                  {liveAccuracy && <span className="ml-1 text-slate-400">· ±{liveAccuracy}m</span>}
                </>
              ) : (
                <span>Locating nearest shelters...</span>
              )}
            </div>
          </div>
        </div>

        {/* Map Quick Action Controls */}
        <div className="pointer-events-auto flex items-center gap-1.5 bg-white/95 backdrop-blur-md border border-[#E2E8F0] rounded-xl p-1 shadow-md">
          {/* My Location Button */}
          <button
            id="map-btn-my-location"
            onClick={handleCenterOnUser}
            disabled={isLocating}
            title="Center on My Real-Time Location"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors shadow-xs cursor-pointer"
          >
            <LocateFixed className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">My Location</span>
          </button>

          {/* Fit All Shelters */}
          <button
            id="map-btn-fit-all"
            onClick={handleFitAll}
            title="Fit All Shelters on Map"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 text-[#0F172A] font-medium text-xs transition-colors cursor-pointer"
          >
            <Maximize2 className="w-3.5 h-3.5 text-slate-600" />
            <span className="hidden md:inline">Fit All</span>
          </button>

          {/* Map Layer Switcher */}
          <div className="relative group">
            <button
              id="map-btn-layers"
              title="Change Map Style"
              className="flex items-center gap-1 px-2 py-1.5 rounded-lg hover:bg-slate-100 text-[#0F172A] font-medium text-xs transition-colors cursor-pointer"
            >
              <Layers className="w-3.5 h-3.5 text-slate-600" />
              <span className="capitalize hidden lg:inline">{mapTheme}</span>
            </button>
            <div className="absolute right-0 top-full mt-1 hidden group-hover:flex flex-col bg-white border border-[#E2E8F0] rounded-xl shadow-xl p-1 min-w-[130px] z-50">
              <button
                onClick={() => setMapTheme('light')}
                className={`text-left px-2.5 py-1.5 rounded-lg text-xs cursor-pointer transition-colors ${
                  mapTheme === 'light' ? 'bg-[#0F172A] text-white font-bold' : 'hover:bg-slate-100 text-slate-700'
                }`}
              >
                Clean Light
              </button>
              <button
                onClick={() => setMapTheme('streets')}
                className={`text-left px-2.5 py-1.5 rounded-lg text-xs cursor-pointer transition-colors ${
                  mapTheme === 'streets' ? 'bg-[#0F172A] text-white font-bold' : 'hover:bg-slate-100 text-slate-700'
                }`}
              >
                OpenStreetMap
              </button>
              <button
                onClick={() => setMapTheme('satellite')}
                className={`text-left px-2.5 py-1.5 rounded-lg text-xs cursor-pointer transition-colors ${
                  mapTheme === 'satellite' ? 'bg-[#0F172A] text-white font-bold' : 'hover:bg-slate-100 text-slate-700'
                }`}
              >
                Satellite Imagery
              </button>
            </div>
          </div>

          {/* Zoom Buttons */}
          <div className="flex items-center border-l border-slate-200 pl-1">
            <button
              onClick={handleZoomIn}
              title="Zoom In"
              className="p-1.5 rounded-md hover:bg-slate-100 text-slate-700 cursor-pointer"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleZoomOut}
              title="Zoom Out"
              className="p-1.5 rounded-md hover:bg-slate-100 text-slate-700 cursor-pointer"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Primary Interactive Leaflet Map Container */}
      <div
        ref={mapContainerRef}
        id="leaflet-map-canvas"
        className="w-full h-full flex-1 z-0"
        style={{ minHeight: '400px' }}
      />

      {/* Floating Active Shelter Card Overlay */}
      {activeShelter && (
        <div className="absolute top-16 left-3 max-w-sm w-[calc(100%-24px)] sm:w-80 bg-white/95 backdrop-blur-md rounded-2xl border border-[#E2E8F0] shadow-2xl p-3.5 z-[400] animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-start justify-between gap-2 pb-2 border-b border-slate-100">
            <div>
              <div className="text-xs font-bold text-[#0F172A] flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#059669]" />
                <span className="truncate max-w-[200px]">{activeShelter.name}</span>
              </div>
              <div className="text-[11px] text-slate-500 truncate max-w-[220px]">
                {activeShelter.address}
              </div>
            </div>
            <button
              onClick={() => setActiveShelter(null)}
              className="text-slate-400 hover:text-slate-600 text-xs px-1.5 py-0.5 rounded font-bold cursor-pointer hover:bg-slate-100"
              title="Close card"
            >
              ✕
            </button>
          </div>

          {/* Status & Available Beds */}
          {(() => {
            const avail = Math.max(0, activeShelter.capacity - activeShelter.currentOccupancy);
            const isFull = avail === 0;
            return (
              <div className="my-2 flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                <span className="font-semibold text-[#0F172A] flex items-center gap-1.5">
                  <Bed className="w-4 h-4 text-slate-600" />
                  {isFull ? 'At Capacity' : 'Available Beds'}
                </span>
                <span
                  className={`font-bold font-mono px-2 py-0.5 rounded text-xs ${
                    isFull ? 'bg-red-100 text-[#DC2626]' : 'bg-emerald-100 text-[#059669]'
                  }`}
                >
                  {avail} / {activeShelter.capacity}
                </span>
              </div>
            );
          })()}

          {/* Essential Supplies */}
          <div className="grid grid-cols-3 gap-1.5 py-1 text-center text-[10px] mb-2.5">
            <div className="p-1.5 rounded-lg bg-slate-50 border border-slate-100">
              <div className="text-slate-400 text-[9px]">Clean Water</div>
              <div className="font-bold text-[#0F172A] font-mono">{activeShelter.resources.waterLiters}L</div>
            </div>
            <div className="p-1.5 rounded-lg bg-slate-50 border border-slate-100">
              <div className="text-slate-400 text-[9px]">Ration Kits</div>
              <div className="font-bold text-[#0F172A] font-mono">{activeShelter.resources.foodKits}</div>
            </div>
            <div className="p-1.5 rounded-lg bg-slate-50 border border-slate-100">
              <div className="text-slate-400 text-[9px]">Medical Aid</div>
              <div className="font-bold text-[#0F172A] truncate">{activeShelter.resources.medicalStatus}</div>
            </div>
          </div>

          {/* Manager info & distance */}
          <div className="text-[11px] text-slate-600 mb-3 space-y-0.5 bg-slate-50 p-2 rounded-lg border border-slate-100">
            <div className="flex justify-between">
              <span>Manager:</span>
              <strong className="text-[#0F172A]">{activeShelter.coordinatorName}</strong>
            </div>
            <div className="flex justify-between">
              <span>Hotline:</span>
              <span className="font-mono text-slate-700 font-semibold">{activeShelter.coordinatorPhone}</span>
            </div>
            {liveLocation && (
              <div className="flex justify-between pt-1 border-t border-slate-200/60 text-blue-700 font-semibold">
                <span className="flex items-center gap-1">
                  <Route className="w-3 h-3" /> Distance from you:
                </span>
                <span className="font-mono">
                  {calculateDistance(liveLocation[0], liveLocation[1], activeShelter.lat, activeShelter.lng)}
                </span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <a
              id={`inmap-call-${activeShelter.id}`}
              href={`tel:${activeShelter.contactPhone || activeShelter.coordinatorPhone}`}
              className="bg-[#0F172A] hover:bg-slate-800 text-white text-xs font-bold py-2 px-2.5 rounded-xl text-center flex items-center justify-center gap-1.5 transition-colors shadow-xs"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Call Shelter</span>
            </a>
            <a
              id={`inmap-google-dir-${activeShelter.id}`}
              href={
                liveLocation
                  ? `https://www.google.com/maps/dir/?api=1&origin=${liveLocation[0]},${liveLocation[1]}&destination=${activeShelter.lat},${activeShelter.lng}&travelmode=driving`
                  : `https://www.google.com/maps/dir/?api=1&destination=${activeShelter.lat},${activeShelter.lng}&travelmode=driving`
              }
              target="_blank"
              rel="noopener noreferrer"
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2 px-2.5 rounded-xl text-center flex items-center justify-center gap-1.5 transition-colors shadow-xs"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Google Maps ↗</span>
            </a>
          </div>
        </div>
      )}

      {/* Floating Bottom Navigation & Controls */}
      <div className="absolute bottom-3 left-3 right-3 z-[400] pointer-events-none flex flex-col gap-2">
        {/* Quick Shelter Selector Chips Strip */}
        <div className="pointer-events-auto flex items-center gap-1.5 overflow-x-auto max-w-full pb-1 scrollbar-none">
          {shelters.map((shelter) => {
            const avail = Math.max(0, shelter.capacity - shelter.currentOccupancy);
            const isFull = avail === 0;
            const isSelected = activeShelter?.id === shelter.id;
            const distStr = liveLocation
              ? calculateDistance(liveLocation[0], liveLocation[1], shelter.lat, shelter.lng)
              : null;

            return (
              <button
                key={shelter.id}
                id={`chip-shelter-${shelter.id}`}
                onClick={() => handleMarkerClick(shelter)}
                className={`shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#0F172A] text-white border-[#0F172A] shadow-md scale-105'
                    : 'bg-white/95 text-[#0F172A] border-[#E2E8F0] shadow-xs hover:bg-slate-100'
                }`}
              >
                <span className={`w-2 h-2 rounded-full shrink-0 ${isFull ? 'bg-[#DC2626]' : 'bg-[#059669]'}`} />
                <span className="truncate max-w-[120px]">{shelter.name}</span>
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${
                    isSelected ? 'bg-white/20 text-white' : isFull ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-700'
                  }`}
                >
                  {isFull ? 'FULL' : `${avail}b`}
                </span>
                {distStr && (
                  <span className={`text-[10px] font-mono ${isSelected ? 'text-blue-200' : 'text-slate-400'}`}>
                    {distStr}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Bottom Bar: Status Legend and Real-time Status */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          {/* Map Legend */}
          <div className="pointer-events-auto bg-white/95 backdrop-blur-md border border-[#E2E8F0] rounded-xl px-3 py-1.5 shadow-md text-xs flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-[#0F172A]">
              <span className="w-2.5 h-2.5 rounded-full bg-[#059669]" />
              <span className="font-semibold">Beds Available</span>
            </div>
            <div className="flex items-center gap-1.5 text-[#0F172A]">
              <span className="w-2.5 h-2.5 rounded-full bg-[#DC2626]" />
              <span className="font-semibold">At Capacity</span>
            </div>
            <div className="flex items-center gap-1.5 text-blue-700">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
              <span className="font-semibold">Your Location</span>
            </div>
          </div>

          {/* Live Status indicator */}
          <div className="pointer-events-auto bg-white/95 backdrop-blur-md border border-[#E2E8F0] rounded-xl px-2.5 py-1.5 shadow-md text-xs flex items-center gap-1.5 text-[#475569]">
            <span className="inline-block w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
            <span className="font-medium text-[#0F172A]">Real-Time GPS Tracking</span>
          </div>
        </div>
      </div>
    </div>
  );
};
