import React, { useState, useMemo } from 'react';
import { useResq } from '../context/ResqContext';
import { Shelter } from '../types';
import { ShelterMap } from '../components/ShelterMap';
import { StatusBadge } from '../components/StatusBadge';
import { OccupancyBar } from '../components/OccupancyBar';
import { 
  Search, 
  MapPin, 
  Navigation, 
  Filter, 
  ShieldCheck, 
  Info, 
  ChevronRight, 
  Phone, 
  Check, 
  HeartHandshake, 
  Layers, 
  List, 
  Map, 
  Clock,
  Sparkles,
  AlertCircle
} from 'lucide-react';

interface PublicLandingViewProps {
  onSelectShelter: (shelter: Shelter) => void;
  onNavigateToDashboard: () => void;
  onNavigateToIntake: () => void;
}

export const PublicLandingView: React.FC<PublicLandingViewProps> = ({
  onSelectShelter,
  onNavigateToDashboard,
  onNavigateToIntake
}) => {
  const { shelters, t, selectedShelterId, setSelectedShelterId, showToast } = useResq();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'AVAILABLE' | 'LIMITED' | 'CRITICAL'>('ALL');
  const [needMedical, setNeedMedical] = useState(false);
  const [needFood, setNeedFood] = useState(false);
  const [needWater, setNeedWater] = useState(false);
  const [needWheelchair, setNeedWheelchair] = useState(false);
  const [needFamily, setNeedFamily] = useState(false);
  const [mobileTab, setMobileTab] = useState<'map' | 'list'>('split');
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [showTrustInfo, setShowTrustInfo] = useState(false);

  // Network Totals
  const activeSheltersCount = shelters.filter((s) => s.status !== 'INACTIVE').length;
  const totalSheltered = shelters.reduce((acc, s) => acc + s.currentOccupancy, 0);
  const totalCapacity = shelters.reduce((acc, s) => acc + s.capacity, 0);
  const networkOccupancyPercent = Math.round((totalSheltered / Math.max(1, totalCapacity)) * 100);
  const availableCapacity = Math.max(0, totalCapacity - totalSheltered);

  // Haversine distance calculator
  const calculateDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
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
    return (R * c).toFixed(1);
  };

  // Acquire User Location
  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      showToast('Geolocation is not supported by your browser', 'error');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const loc: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setUserLocation(loc);
        showToast('Your emergency coordinates have been acquired. Shelters sorted by proximity.', 'success');
      },
      (err) => {
        setIsLocating(false);
        // Fallback to designated coordinates
        const fallback: [number, number] = [23.1541881, 72.6729164];
        setUserLocation(fallback);
        showToast('Using reference coordinates (23.1541881, 72.6729164) for proximity sort.', 'info');
      },
      { timeout: 8000 }
    );
  };

  // Filtered shelters
  const filteredShelters = useMemo(() => {
    return shelters.filter((shelter) => {
      // Query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          shelter.name.toLowerCase().includes(q) ||
          shelter.address.toLowerCase().includes(q) ||
          shelter.district.toLowerCase().includes(q) ||
          shelter.code.toLowerCase().includes(q);
        if (!matches) return false;
      }

      // Status filter
      if (statusFilter !== 'ALL') {
        if (statusFilter === 'AVAILABLE' && shelter.status !== 'AVAILABLE') return false;
        if (statusFilter === 'LIMITED' && shelter.status !== 'LIMITED') return false;
        if (statusFilter === 'CRITICAL' && shelter.status !== 'CRITICAL' && shelter.status !== 'OVERCAPACITY') return false;
      }

      // Facilities filters
      if (needMedical && !shelter.facilities.medicalAid) return false;
      if (needFood && !shelter.facilities.foodRation) return false;
      if (needWater && !shelter.facilities.drinkingWater) return false;
      if (needWheelchair && !shelter.facilities.wheelchairAccessible) return false;
      if (needFamily && (!shelter.facilities.womenChildrenArea && !shelter.facilities.infantCare)) return false;

      return true;
    });
  }, [shelters, searchQuery, statusFilter, needMedical, needFood, needWater, needWheelchair, needFamily]);

  // Sort by distance if user location is available
  const sortedShelters = useMemo(() => {
    if (!userLocation) return filteredShelters;
    return [...filteredShelters].sort((a, b) => {
      const distA = parseFloat(calculateDistanceKm(userLocation[0], userLocation[1], a.lat, a.lng));
      const distB = parseFloat(calculateDistanceKm(userLocation[0], userLocation[1], b.lat, b.lng));
      return distA - distB;
    });
  }, [filteredShelters, userLocation]);

  return (
    <div className="min-h-screen bg-[#F7F9FC]">
      
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-[#12304A] to-[#0B1F33] text-white pt-10 pb-12 px-4 sm:px-6 lg:px-8 border-b border-slate-700">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-400/30 mb-4">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              {t.systemOperational} &bull; Ahmedabad Emergency Response Network
            </div>
            
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white mb-3 leading-tight">
              {t.findShelter}
            </h1>
            
            <p className="text-base sm:text-lg text-slate-300 mb-6 font-normal leading-relaxed">
              {t.heroSubtitle}
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <a
                href="#shelter-map-section"
                className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 py-3 rounded-xl text-sm shadow-lg transition-all flex items-center gap-2 cursor-pointer"
              >
                <MapPin className="w-4 h-4" />
                <span>Find Nearby Shelter</span>
              </a>
              
              <button
                onClick={onNavigateToIntake}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 font-bold px-5 py-3 rounded-xl text-sm transition-colors flex items-center gap-2 cursor-pointer"
              >
                <HeartHandshake className="w-4 h-4 text-emerald-400" />
                <span>I Manage a Shelter / Rapid Intake</span>
              </button>

              <button
                onClick={() => setShowTrustInfo((prev) => !prev)}
                className="text-xs text-slate-300 hover:text-white underline underline-offset-4 py-2 px-3 cursor-pointer"
              >
                Why trust this information?
              </button>
            </div>
          </div>

          {/* Trust Explanation Box */}
          {showTrustInfo && (
            <div className="mt-6 p-4 rounded-xl bg-slate-800/90 border border-slate-600 text-xs text-slate-200 max-w-2xl animate-in fade-in duration-200">
              <div className="flex items-start gap-2.5">
                <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div className="space-y-1.5">
                  <p className="font-bold text-white text-sm">Real-time Verified Intelligence</p>
                  <p className="leading-relaxed text-slate-300">
                    Shelter availability is updated directly by designated municipal coordinators on the ground. Timestamps indicate data freshness. If you observe any discrepancies during an evacuation, report it immediately to update the central command center.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Live Network Status Bar */}
          <div className="mt-8 pt-6 border-t border-slate-700/80 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700">
              <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Active Shelters</div>
              <div className="text-2xl sm:text-3xl font-black text-white mt-1">{activeSheltersCount}</div>
              <div className="text-[11px] text-emerald-400 flex items-center gap-1 mt-0.5">
                <span>● Monitored 24/7</span>
              </div>
            </div>

            <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700">
              <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">{t.peopleSheltered}</div>
              <div className="text-2xl sm:text-3xl font-black text-white mt-1">{totalSheltered.toLocaleString()}</div>
              <div className="text-[11px] text-slate-400 mt-0.5">out of {totalCapacity.toLocaleString()} total</div>
            </div>

            <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700">
              <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Available Spaces</div>
              <div className="text-2xl sm:text-3xl font-black text-emerald-400 mt-1">{availableCapacity.toLocaleString()}</div>
              <div className="text-[11px] text-slate-400 mt-0.5">ready for intake</div>
            </div>

            <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700">
              <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Network Occupancy</div>
              <div className="text-2xl sm:text-3xl font-black text-amber-400 mt-1">{networkOccupancyPercent}%</div>
              <div className="w-full bg-slate-700 rounded-full h-1.5 mt-2">
                <div 
                  className="bg-amber-400 h-1.5 rounded-full" 
                  style={{ width: `${networkOccupancyPercent}%` }} 
                />
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Main Map & Shelter Directory Section */}
      <main id="shelter-map-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Search & Location Bar */}
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200 p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-3">
            
            {/* Search input */}
            <div className="relative flex-1">
              <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="public-shelter-search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search area, landmark (e.g. Navrangpura, Ashram Road), or shelter name..."
                className="w-full pl-11 pr-4 py-3 bg-slate-50 text-slate-900 placeholder-slate-400 text-sm rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-700 p-1"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Use My Location button */}
            <button
              id="use-my-location-btn"
              onClick={handleUseMyLocation}
              disabled={isLocating}
              className="flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-[#12304A] font-bold px-5 py-3 rounded-xl text-sm border border-slate-300 transition-colors shrink-0 cursor-pointer disabled:opacity-50"
            >
              <Navigation className={`w-4 h-4 text-blue-600 ${isLocating ? 'animate-spin' : ''}`} />
              <span>{isLocating ? 'Locating...' : 'Use My Location'}</span>
            </button>

          </div>

          {/* Filter Pills */}
          <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-1">
              Filter:
            </span>

            {/* Status filters */}
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                statusFilter === 'ALL'
                  ? 'bg-[#12304A] text-white border-[#12304A]'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              All ({shelters.length})
            </button>

            <button
              onClick={() => setStatusFilter('AVAILABLE')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                statusFilter === 'AVAILABLE'
                  ? 'bg-emerald-700 text-white border-emerald-700'
                  : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
              }`}
            >
              🟢 Available (&lt;70%)
            </button>

            <button
              onClick={() => setStatusFilter('LIMITED')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                statusFilter === 'LIMITED'
                  ? 'bg-amber-600 text-white border-amber-600'
                  : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
              }`}
            >
              🟡 Limited (70-89%)
            </button>

            <button
              onClick={() => setStatusFilter('CRITICAL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                statusFilter === 'CRITICAL'
                  ? 'bg-rose-700 text-white border-rose-700'
                  : 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100'
              }`}
            >
              🔴 Critical / Full (&gt;90%)
            </button>

            <div className="h-4 w-[1px] bg-slate-200 mx-1 hidden sm:block"></div>

            {/* Capability filters */}
            <button
              onClick={() => setNeedMedical((prev) => !prev)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                needMedical
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              🩺 Medical Aid
            </button>

            <button
              onClick={() => setNeedFood((prev) => !prev)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                needFood
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              🍲 Ration / Food
            </button>

            <button
              onClick={() => setNeedWater((prev) => !prev)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                needWater
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              💧 Drinking Water
            </button>

            <button
              onClick={() => setNeedFamily((prev) => !prev)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                needFamily
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              👨‍👩‍👧 Family &amp; Women Wing
            </button>

            <button
              onClick={() => setNeedWheelchair((prev) => !prev)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                needWheelchair
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              ♿ Accessible
            </button>

            {(statusFilter !== 'ALL' || needMedical || needFood || needWater || needWheelchair || needFamily) && (
              <button
                onClick={() => {
                  setStatusFilter('ALL');
                  setNeedMedical(false);
                  setNeedFood(false);
                  setNeedWater(false);
                  setNeedWheelchair(false);
                  setNeedFamily(false);
                }}
                className="text-xs text-rose-600 hover:text-rose-800 font-bold ml-auto cursor-pointer"
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>

        {/* Mobile View Switcher (Map vs List) */}
        <div className="lg:hidden flex items-center justify-between mb-4 bg-white p-2 rounded-xl border border-slate-200">
          <span className="text-xs font-bold text-slate-700">
            Found {sortedShelters.length} shelter{sortedShelters.length === 1 ? '' : 's'}
          </span>
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
            <button
              onClick={() => setMobileTab('list')}
              className={`px-3 py-1 rounded-md text-xs font-bold flex items-center gap-1.5 ${
                mobileTab === 'list' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>List</span>
            </button>
            <button
              onClick={() => setMobileTab('map')}
              className={`px-3 py-1 rounded-md text-xs font-bold flex items-center gap-1.5 ${
                mobileTab === 'map' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              <Map className="w-3.5 h-3.5" />
              <span>Map</span>
            </button>
          </div>
        </div>

        {/* Desktop Split-Screen Layout: Left List, Right Map */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Column: Shelter Cards List */}
          <div className={`lg:col-span-5 space-y-3.5 ${mobileTab === 'map' ? 'hidden lg:block' : 'block'}`}>
            <div className="hidden lg:flex items-center justify-between px-1 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Shelters ({sortedShelters.length})
              </span>
              {userLocation && (
                <span className="text-xs text-blue-700 font-semibold flex items-center gap-1">
                  <Navigation className="w-3 h-3" />
                  Sorted by distance from you
                </span>
              )}
            </div>

            {sortedShelters.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center border border-slate-200">
                <AlertCircle className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                <h3 className="text-base font-bold text-slate-800 mb-1">No matching shelters found</h3>
                <p className="text-xs text-slate-500 mb-4 max-w-xs mx-auto">
                  Try clearing some filters or searching for a broader district or landmark.
                </p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setStatusFilter('ALL');
                    setNeedMedical(false);
                    setNeedFood(false);
                    setNeedWater(false);
                  }}
                  className="px-4 py-2 bg-[#12304A] text-white text-xs font-bold rounded-lg shadow-xs"
                >
                  View All Shelters
                </button>
              </div>
            ) : (
              sortedShelters.map((shelter) => {
                const occPercent = Math.min(100, Math.round((shelter.currentOccupancy / Math.max(1, shelter.capacity)) * 100));
                const isSelected = selectedShelterId === shelter.id;
                const distance = userLocation 
                  ? calculateDistanceKm(userLocation[0], userLocation[1], shelter.lat, shelter.lng)
                  : null;

                return (
                  <article
                    key={shelter.id}
                    id={`shelter-card-${shelter.id}`}
                    onClick={() => {
                      setSelectedShelterId(shelter.id);
                      onSelectShelter(shelter);
                    }}
                    className={`bg-white rounded-xl p-4 border transition-all cursor-pointer hover:shadow-md ${
                      isSelected
                        ? 'border-blue-600 ring-2 ring-blue-500/20 shadow-md'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <StatusBadge status={shelter.status} occupancyPercent={occPercent} showPercent size="sm" />
                      <div className="flex items-center gap-2">
                        {distance && (
                          <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                            {distance} km away
                          </span>
                        )}
                        <span className="text-[11px] text-slate-400 font-mono">{shelter.code}</span>
                      </div>
                    </div>

                    <h3 className="font-bold text-slate-900 text-sm leading-snug mb-1">
                      {shelter.name}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-1 mb-3">
                      {shelter.address}, {shelter.district}
                    </p>

                    <OccupancyBar
                      current={shelter.currentOccupancy}
                      capacity={shelter.capacity}
                      status={shelter.status}
                      size="sm"
                    />

                    {/* Service quick icons */}
                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                      <div className="flex items-center gap-3">
                        <span className={shelter.facilities.drinkingWater ? 'text-emerald-700 font-semibold' : 'text-slate-300'} title="Drinking water available">
                          💧 Water
                        </span>
                        <span className={shelter.facilities.foodRation ? 'text-emerald-700 font-semibold' : 'text-slate-300'} title="Food ration available">
                          🍲 Food
                        </span>
                        <span className={shelter.facilities.medicalAid ? 'text-emerald-700 font-semibold' : 'text-rose-500 font-semibold'} title="Medical staff">
                          🩺 {shelter.facilities.medicalAid ? 'Medical' : 'No Med'}
                        </span>
                      </div>

                      <span className="text-blue-600 font-bold text-xs flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                        Details &rarr;
                      </span>
                    </div>
                  </article>
                );
              })
            )}
          </div>

          {/* Right Column: Interactive Google Maps Platform (English Only) */}
          <div className={`lg:col-span-7 sticky top-20 ${mobileTab === 'list' ? 'hidden lg:block' : 'block'}`}>
            <div className="h-[580px] lg:h-[720px] rounded-2xl overflow-hidden shadow-md border border-slate-200">
              <ShelterMap
                shelters={sortedShelters}
                userLocation={userLocation}
                selectedShelterId={selectedShelterId}
                onSelectShelter={onSelectShelter}
                className="h-full"
              />
            </div>
          </div>

        </div>

      </main>

    </div>
  );
};
