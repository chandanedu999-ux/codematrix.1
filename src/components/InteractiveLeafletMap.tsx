import React, { useEffect, useRef, useCallback, useMemo } from 'react';
import L from 'leaflet';
import { Shelter } from '../types';
import { 
  LocateFixed, 
  Maximize2, 
  Navigation, 
  MapPin, 
  Phone, 
  Info, 
  AlertTriangle, 
  CheckCircle2, 
  UserPlus,
  ShieldCheck,
  Radio,
  Sliders
} from 'lucide-react';

interface InteractiveLeafletMapProps {
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

export const InteractiveLeafletMap: React.FC<InteractiveLeafletMapProps> = ({
  shelters,
  selectedShelterId,
  onSelectShelter,
  userCoordinates,
  userAccuracy,
  onNavigateToIntake,
  className = 'w-full h-full min-h-[460px]',
  onUserLocationChange,
  radiusKm = null,
  onRadiusChange
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const accuracyCircleRef = useRef<L.Circle | null>(null);
  const radiusCircleRef = useRef<L.Circle | null>(null);
  const distanceLineRef = useRef<L.Polyline | null>(null);

  // Haversine formula for distance calculation in kilometers
  const calculateDistanceKm = useCallback((lat1: number, lon1: number, lat2: number, lon2: number): number => {
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
  }, []);

  const formatDistance = (distKm: number): string => {
    if (distKm < 1) {
      return `${Math.round(distKm * 1000)} m away`;
    }
    return `${distKm.toFixed(1)} km away`;
  };

  // Find nearest shelter
  const nearestShelter = useMemo(() => {
    if (!userCoordinates || shelters.length === 0) return null;
    let closest = shelters[0];
    let minDistance = calculateDistanceKm(userCoordinates[0], userCoordinates[1], shelters[0].lat, shelters[0].lng);

    for (let i = 1; i < shelters.length; i++) {
      const dist = calculateDistanceKm(userCoordinates[0], userCoordinates[1], shelters[i].lat, shelters[i].lng);
      if (dist < minDistance) {
        minDistance = dist;
        closest = shelters[i];
      }
    }
    return { shelter: closest, distanceKm: minDistance };
  }, [userCoordinates, shelters, calculateDistanceKm]);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    // Initial center: either user coordinates or first shelter or Gandhinagar relief zone
    const initialCenter: [number, number] = userCoordinates
      ? [userCoordinates[0], userCoordinates[1]]
      : shelters.length > 0
      ? [shelters[0].lat, shelters[0].lng]
      : [23.1541881, 72.6729164];

    const map = L.map(mapContainerRef.current, {
      center: initialCenter,
      zoom: 13,
      zoomControl: false,
      attributionControl: false
    });

    // High quality crisp CartoDB Positron tiles (fast, SSL, zero rate limits)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      subdomains: 'abcd',
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO'
    }).addTo(map);

    // Zoom control on bottom-right to keep top clean
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Attribution control bottom-left
    L.control.attribution({ position: 'bottomleft', prefix: 'ResQ Emergency Map' }).addTo(map);

    // Layer group for shelter markers
    const markersLayer = L.layerGroup().addTo(map);
    markersLayerRef.current = markersLayer;
    mapInstanceRef.current = map;

    // Click anywhere on map to reposition live user coordinates
    map.on('click', (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      if (onUserLocationChange) {
        onUserLocationChange(lat, lng, 25);
      }
    });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Shelter Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    if (!map || !markersLayer) return;

    markersLayer.clearLayers();

    shelters.forEach((shelter) => {
      const availableBeds = Math.max(0, shelter.capacity - shelter.currentOccupancy);
      const isFull = availableBeds === 0 || shelter.status === 'CRITICAL' || shelter.status === 'OVERCAPACITY';
      const isSelected = selectedShelterId === shelter.id;

      // Distance from user if available
      const distance = userCoordinates
        ? calculateDistanceKm(userCoordinates[0], userCoordinates[1], shelter.lat, shelter.lng)
        : null;

      // Filter by radius if active
      if (radiusKm && distance !== null && distance > radiusKm) {
        return; // skip outside radius
      }

      const badgeColor = isFull ? '#DC2626' : '#059669';
      const badgeBorder = isFull ? '#991B1B' : '#065F46';
      const badgeText = isFull ? 'FULL' : `${availableBeds} BEDS`;
      const ringClass = isSelected ? 'box-shadow: 0 0 0 4px #3B82F6, 0 10px 15px -3px rgba(0,0,0,0.3); transform: scale(1.15);' : 'box-shadow: 0 4px 6px -1px rgba(0,0,0,0.2);';

      const iconHtml = `
        <div style="position: relative; cursor: pointer; text-align: center; ${ringClass} transition: transform 0.2s ease;">
          <div style="
            background: ${badgeColor};
            border: 1.5px solid ${badgeBorder};
            color: white;
            padding: 3px 8px;
            border-radius: 9999px;
            font-size: 11px;
            font-weight: 800;
            letter-spacing: -0.025em;
            display: inline-flex;
            align-items: center;
            gap: 4px;
            white-space: nowrap;
          ">
            <span style="display:inline-block; width: 6px; height: 6px; border-radius: 50%; background: white;"></span>
            <span>${badgeText}</span>
          </div>
          <div style="
            width: 0;
            height: 0;
            border-left: 5px solid transparent;
            border-right: 5px solid transparent;
            border-top: 6px solid ${badgeColor};
            margin: 0 auto;
          "></div>
        </div>
      `;

      const customIcon = L.divIcon({
        html: iconHtml,
        className: 'shelter-marker-icon',
        iconSize: [80, 30],
        iconAnchor: [40, 30],
        popupAnchor: [0, -32]
      });

      const marker = L.marker([shelter.lat, shelter.lng], { icon: customIcon });

      // Build rich popup content
      const popupContent = document.createElement('div');
      popupContent.style.width = '260px';
      popupContent.style.padding = '4px';
      popupContent.style.fontFamily = 'system-ui, -apple-system, sans-serif';

      popupContent.innerHTML = `
        <div style="margin-bottom: 6px;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 6px;">
            <div>
              <span style="font-size: 9px; font-weight: 700; color: #64748B; letter-spacing: 0.05em;">${shelter.code}</span>
              <h4 style="margin: 0; font-size: 13px; font-weight: 800; color: #0F172A; line-height: 1.2;">${shelter.name}</h4>
            </div>
            <span style="
              background: ${isFull ? '#FEE2E2' : '#D1FAE5'};
              color: ${isFull ? '#DC2626' : '#059669'};
              padding: 2px 6px;
              border-radius: 9999px;
              font-size: 9px;
              font-weight: 800;
              white-space: nowrap;
            ">
              ${isFull ? 'AT CAPACITY' : `${availableBeds} BEDS OPEN`}
            </span>
          </div>
          <div style="font-size: 11px; color: #475569; margin-top: 4px;">
            ${shelter.address}, ${shelter.district}
          </div>
          ${
            distance !== null
              ? `<div style="margin-top: 4px; padding: 2px 6px; background: #EFF6FF; border-radius: 6px; font-size: 11px; font-weight: 700; color: #1D4ED8; display: inline-block;">
                  📍 ${formatDistance(distance)} from your location
                </div>`
              : ''
          }
        </div>

        <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #E2E8F0; display: flex; flex-direction: column; gap: 6px;">
          <a 
            href="https://www.google.com/maps/dir/?api=1&destination=${shelter.lat},${shelter.lng}&travelmode=driving" 
            target="_blank" 
            rel="noopener noreferrer"
            style="
              background: #2563EB;
              color: white;
              padding: 6px 10px;
              border-radius: 8px;
              font-size: 11px;
              font-weight: 700;
              text-align: center;
              text-decoration: none;
              display: block;
            "
          >
            Turn-by-Turn Directions ↗
          </a>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px;">
            <a 
              href="tel:${shelter.contactPhone || shelter.coordinatorPhone}"
              style="
                background: #0F172A;
                color: white;
                padding: 6px 8px;
                border-radius: 8px;
                font-size: 10px;
                font-weight: 700;
                text-align: center;
                text-decoration: none;
              "
            >
              📞 Call
            </a>
            <button 
              id="popup-details-btn-${shelter.id}"
              style="
                background: #F1F5F9;
                color: #0F172A;
                padding: 6px 8px;
                border-radius: 8px;
                font-size: 10px;
                font-weight: 700;
                border: 1px solid #CBD5E1;
                cursor: pointer;
              "
            >
              ℹ️ Details
            </button>
          </div>
        </div>
      `;

      // Bind button events inside popup
      marker.bindPopup(popupContent, { maxWidth: 280 });
      marker.on('popupopen', () => {
        const detailsBtn = document.getElementById(`popup-details-btn-${shelter.id}`);
        if (detailsBtn) {
          detailsBtn.onclick = () => {
            onSelectShelter(shelter);
          };
        }
      });

      marker.on('click', () => {
        onSelectShelter(shelter);
      });

      // Auto open if selected
      if (isSelected) {
        setTimeout(() => {
          marker.openPopup();
        }, 100);
      }

      markersLayer.addLayer(marker);
    });
  }, [shelters, selectedShelterId, userCoordinates, radiusKm, onSelectShelter, calculateDistanceKm]);

  // Update Live User Location Marker, Pulse, and Radius Circle
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clean up previous user elements
    if (userMarkerRef.current) {
      map.removeLayer(userMarkerRef.current);
      userMarkerRef.current = null;
    }
    if (accuracyCircleRef.current) {
      map.removeLayer(accuracyCircleRef.current);
      accuracyCircleRef.current = null;
    }
    if (radiusCircleRef.current) {
      map.removeLayer(radiusCircleRef.current);
      radiusCircleRef.current = null;
    }
    if (distanceLineRef.current) {
      map.removeLayer(distanceLineRef.current);
      distanceLineRef.current = null;
    }

    if (!userCoordinates) return;

    const [userLat, userLng] = userCoordinates;

    // Accuracy Circle
    if (userAccuracy && userAccuracy > 10 && userAccuracy < 10000) {
      const accCircle = L.circle([userLat, userLng], {
        radius: userAccuracy,
        color: '#3B82F6',
        fillColor: '#60A5FA',
        fillOpacity: 0.12,
        weight: 1,
        dashArray: '4, 4'
      }).addTo(map);
      accuracyCircleRef.current = accCircle;
    }

    // Nearby Radius Filter Circle (e.g. 5km, 10km)
    if (radiusKm) {
      const radCircle = L.circle([userLat, userLng], {
        radius: radiusKm * 1000,
        color: '#2563EB',
        fillColor: '#3B82F6',
        fillOpacity: 0.06,
        weight: 2,
        dashArray: '6, 6'
      }).addTo(map);
      radiusCircleRef.current = radCircle;
    }

    // Draw routing/distance line to closest shelter
    if (nearestShelter) {
      const line = L.polyline(
        [
          [userLat, userLng],
          [nearestShelter.shelter.lat, nearestShelter.shelter.lng]
        ],
        {
          color: '#2563EB',
          weight: 2.5,
          opacity: 0.8,
          dashArray: '5, 8'
        }
      ).addTo(map);
      distanceLineRef.current = line;
    }

    // Radar Pulsing User Marker
    const userRadarHtml = `
      <div style="position: relative; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center;">
        <div style="
          position: absolute;
          width: 38px;
          height: 38px;
          border-radius: 50%;
          background: rgba(37, 99, 235, 0.25);
          animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;
        "></div>
        <div style="
          position: absolute;
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: #2563EB;
          border: 3px solid white;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
        "></div>
        <div style="
          position: absolute;
          top: -24px;
          left: 50%;
          transform: translateX(-50%);
          background: #0F172A;
          color: white;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 9px;
          font-weight: 800;
          white-space: nowrap;
          pointer-events: none;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        ">
          YOU ARE HERE
        </div>
      </div>
    `;

    const userIcon = L.divIcon({
      html: userRadarHtml,
      className: 'user-radar-icon',
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });

    const userMarker = L.marker([userLat, userLng], {
      icon: userIcon,
      zIndexOffset: 1000
    }).addTo(map);

    userMarker.bindPopup(`
      <div style="padding: 4px; font-family: system-ui, sans-serif; font-size: 11px;">
        <div style="font-weight: 800; color: #1D4ED8; display: flex; align-items: center; gap: 4px;">
          📍 Your Real-Time Location
        </div>
        <div style="font-family: monospace; font-size: 10px; color: #334155; margin-top: 2px;">
          ${userLat.toFixed(5)}, ${userLng.toFixed(5)}
        </div>
        ${userAccuracy ? `<div style="font-size: 10px; color: #64748B;">Accuracy: ±${userAccuracy}m</div>` : ''}
        ${
          nearestShelter
            ? `<div style="margin-top: 6px; padding-top: 4px; border-top: 1px solid #E2E8F0; font-size: 11px;">
                <div style="color: #64748B; font-size: 9px; font-weight: 700;">NEAREST SHELTER:</div>
                <div style="font-weight: 800; color: #0F172A;">${nearestShelter.shelter.name}</div>
                <div style="color: #059669; font-weight: 700;">${formatDistance(nearestShelter.distanceKm)}</div>
              </div>`
            : ''
        }
        <div style="margin-top: 4px; font-size: 9px; color: #64748B; font-style: italic;">
          Tip: Click anywhere on the map to relocate
        </div>
      </div>
    `);

    userMarkerRef.current = userMarker;
  }, [userCoordinates, userAccuracy, radiusKm, nearestShelter]);

  // Fit all bounds action
  const handleFitAll = useCallback(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const points: [number, number][] = [];
    shelters.forEach((s) => {
      points.push([s.lat, s.lng]);
    });
    if (userCoordinates) {
      points.push([userCoordinates[0], userCoordinates[1]]);
    }

    if (points.length > 0) {
      const bounds = L.latLngBounds(points);
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
    }
  }, [shelters, userCoordinates]);

  // Recenter to user action
  const handleRecenterUser = useCallback(() => {
    const map = mapInstanceRef.current;
    if (!map || !userCoordinates) return;
    map.flyTo([userCoordinates[0], userCoordinates[1]], 14, { duration: 1.2 });
  }, [userCoordinates]);

  // Recenter when selected shelter changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !selectedShelterId) return;
    const match = shelters.find((s) => s.id === selectedShelterId);
    if (match) {
      map.flyTo([match.lat, match.lng], 15, { duration: 1 });
    }
  }, [selectedShelterId, shelters]);

  return (
    <div className={`relative overflow-hidden rounded-2xl border border-[#E2E8F0] shadow-sm bg-slate-100 flex flex-col ${className}`}>
      
      {/* Telemetry Header Bar */}
      <div className="bg-[#FFFFFF] border-b border-[#E2E8F0] px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs z-20">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 font-extrabold text-[#0F172A]">
            <Radio className="w-4 h-4 text-blue-600 animate-pulse" />
            <span>Live Emergency Radar</span>
          </div>
          <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200">
            {shelters.length} Rescue Centres Placed
          </span>
        </div>

        {/* Live GPS Lock / Signal Status */}
        <div className="flex items-center gap-2">
          {userCoordinates ? (
            <div className="flex items-center gap-1.5 text-slate-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="font-medium text-[11px]">
                Live Location: <span className="font-mono font-bold text-[#0F172A]">{userCoordinates[0].toFixed(4)}, {userCoordinates[1].toFixed(4)}</span>
                {userAccuracy && <span className="text-slate-500 ml-1">(±{Math.round(userAccuracy)}m)</span>}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded text-[11px] font-semibold">
              <Radio className="w-3 h-3 animate-pulse" />
              <span>Acquiring Location...</span>
            </div>
          )}

          {/* Fit all centres button */}
          <button
            onClick={handleFitAll}
            className="flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-[#0F172A] font-bold rounded-lg transition-colors cursor-pointer border border-slate-200 text-xs"
            title="Fit all rescue centres and user into view"
          >
            <Maximize2 className="w-3.5 h-3.5 text-slate-600" />
            <span className="hidden md:inline">Fit All</span>
          </button>
        </div>
      </div>

      {/* Map Canvas Container */}
      <div className="relative flex-1 w-full h-full min-h-[420px]">
        <div ref={mapContainerRef} className="w-full h-full min-h-[420px]" />

        {/* Floating Quick Navigation Controls (Top Left) */}
        <div className="absolute top-3 left-3 z-[400] flex flex-col gap-2">
          <div className="bg-white/95 backdrop-blur-xs rounded-xl shadow-md border border-slate-200 p-1 flex items-center gap-1">
            {userCoordinates && (
              <button
                onClick={handleRecenterUser}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-xs"
                title="Center map on your live location"
              >
                <LocateFixed className="w-3.5 h-3.5 text-white animate-pulse" />
                <span>My Location</span>
              </button>
            )}

            <button
              onClick={handleFitAll}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold transition-colors cursor-pointer border border-slate-200"
              title="Show all rescue centres"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Overview</span>
            </button>
          </div>

          {/* Quick Radius Filter (Within 5km, 10km, 25km, All) */}
          {userCoordinates && onRadiusChange && (
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

        {/* Nearest Shelter Quick Banner Floating at Bottom Center */}
        {nearestShelter && userCoordinates && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-[400] max-w-sm w-[92%] bg-white/95 backdrop-blur-xs rounded-xl shadow-lg border border-blue-200 p-2.5 flex items-center justify-between gap-3 animate-fade-in">
            <div className="min-w-0">
              <div className="text-[10px] font-bold text-blue-700 flex items-center gap-1 uppercase tracking-wide">
                <Navigation className="w-3 h-3 text-blue-600" />
                <span>Closest Shelter ({formatDistance(nearestShelter.distanceKm)})</span>
              </div>
              <div className="font-extrabold text-xs text-[#0F172A] truncate mt-0.5">
                {nearestShelter.shelter.name}
              </div>
              <div className="text-[10px] text-slate-500 truncate">
                {nearestShelter.shelter.district} · {Math.max(0, nearestShelter.shelter.capacity - nearestShelter.shelter.currentOccupancy)} beds open
              </div>
            </div>

            <button
              onClick={() => onSelectShelter(nearestShelter.shelter)}
              className="px-3 py-1.5 bg-[#0F172A] hover:bg-slate-800 text-white rounded-lg text-xs font-bold whitespace-nowrap transition-colors cursor-pointer shrink-0"
            >
              Inspect
            </button>
          </div>
        )}
      </div>

      {/* Footer Info & Legend */}
      <div className="bg-[#FFFFFF] border-t border-[#E2E8F0] px-4 py-2 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-600 z-10">
        <div className="flex items-center gap-3">
          <span className="font-bold text-[#0F172A]">Legend:</span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#059669] inline-block" />
            <span>Available Beds</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#DC2626] inline-block" />
            <span>At Capacity</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block" />
            <span>Your Live GPS</span>
          </span>
        </div>

        <div className="text-[10px] text-slate-400">
          Tip: Click anywhere on the map to set your location · Updates nearby list live
        </div>
      </div>

    </div>
  );
};
