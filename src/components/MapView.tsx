import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import { 
  Search, X, Compass, ChevronRight, Zap, Star, Navigation, 
  MapPin, Clock, Route, ExternalLink, ArrowRight, ShieldCheck,
  Play, Pause, FastForward, RotateCcw, Volume2, VolumeX, Eye, BatteryCharging,
  AlertTriangle, Waves, ShieldAlert, Sparkles, AlertCircle, RefreshCw
} from 'lucide-react';
import { ChargingStation, FilterState, RecommendationResult, AppTheme } from '../types';
import { isValidCoordinate, calculateHaversineDistanceKm } from '../services/geoService';
import { searchIndianPlaces, resolveCustomIndianDestination, PlaceSuggestion, INDIAN_PLACES_DATABASE } from '../services/placesService';
import { 
  calculateJourneyPlan, 
  JourneyRoute, 
  RouteAlternative, 
  RouteHazard, 
  switchJourneyRoute, 
  buildGoogleMapsRouteUrl 
} from '../services/corridorRouteService';

/**
 * Calculates vehicle coordinate and heading angle along the route polyline at progress [0..1]
 */
function getNavPosition(polyline: [number, number][], progress: number): {
  position: [number, number];
  bearing: number;
  segmentIndex: number;
} {
  if (!polyline || polyline.length === 0) {
    return { position: [13.0, 80.0], bearing: 0, segmentIndex: 0 };
  }
  if (polyline.length === 1 || progress <= 0) {
    const p1 = polyline[0];
    const p2 = polyline[1] || p1;
    const bearing = calculateBearing(p1[0], p1[1], p2[0], p2[1]);
    return { position: p1, bearing, segmentIndex: 0 };
  }
  if (progress >= 1) {
    const last = polyline[polyline.length - 1];
    const prev = polyline[polyline.length - 2] || last;
    const bearing = calculateBearing(prev[0], prev[1], last[0], last[1]);
    return { position: last, bearing, segmentIndex: polyline.length - 1 };
  }

  const segmentDistances: number[] = [];
  let totalLength = 0;
  for (let i = 0; i < polyline.length - 1; i++) {
    const d = calculateHaversineDistanceKm(polyline[i][0], polyline[i][1], polyline[i + 1][0], polyline[i + 1][1]);
    segmentDistances.push(d);
    totalLength += d;
  }

  if (totalLength === 0) {
    return { position: polyline[0], bearing: 0, segmentIndex: 0 };
  }

  const targetDistance = totalLength * progress;
  let accumulated = 0;

  for (let i = 0; i < segmentDistances.length; i++) {
    const segDist = segmentDistances[i];
    if (accumulated + segDist >= targetDistance || i === segmentDistances.length - 1) {
      const segProgress = segDist > 0 ? Math.max(0, Math.min(1, (targetDistance - accumulated) / segDist)) : 0;
      const p1 = polyline[i];
      const p2 = polyline[i + 1] || p1;
      const lat = p1[0] + (p2[0] - p1[0]) * segProgress;
      const lng = p1[1] + (p2[1] - p1[1]) * segProgress;
      const bearing = calculateBearing(p1[0], p1[1], p2[0], p2[1]);
      return {
        position: [isNaN(lat) ? p1[0] : lat, isNaN(lng) ? p1[1] : lng],
        bearing: isNaN(bearing) ? 0 : bearing,
        segmentIndex: i
      };
    }
    accumulated += segDist;
  }

  const lastP = polyline[polyline.length - 1] || [13.0067, 80.2030];
  return { position: lastP, bearing: 0, segmentIndex: Math.max(0, polyline.length - 1) };
}

function calculateBearing(lat1: number, lng1: number, lat2: number, lng2: number): number {
  if (isNaN(lat1) || isNaN(lng1) || isNaN(lat2) || isNaN(lng2)) return 0;
  const toRad = Math.PI / 180;
  const φ1 = lat1 * toRad;
  const φ2 = lat2 * toRad;
  const Δλ = (lng2 - lng1) * toRad;
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  const θ = Math.atan2(y, x);
  const deg = (θ * 180 / Math.PI + 360) % 360;
  return isNaN(deg) ? 0 : deg;
}

interface MapViewProps {
  userLocation: { lat: number; lng: number } | null;
  stations: ChargingStation[];
  filteredStations: ChargingStation[];
  bestMatch: RecommendationResult | null;
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  selectedStation: ChargingStation | null;
  onSelectStation: (station: ChargingStation) => void;
  onRecenter: () => void;
  vehicleModelName: string;
  theme?: AppTheme;
  onEnrichStations?: (newStations: ChargingStation[]) => void;
  onLaunchBooking?: (station: ChargingStation) => void;
  initialJourney?: JourneyRoute | null;
  initialNavigating?: boolean;
  onStopNavigation?: () => void;
}

export const MapView: React.FC<MapViewProps> = ({
  userLocation,
  stations,
  filteredStations,
  bestMatch,
  filters,
  setFilters,
  selectedStation,
  onSelectStation,
  onRecenter,
  vehicleModelName,
  theme = 'dark',
  onEnrichStations,
  onLaunchBooking,
  initialJourney = null,
  initialNavigating = false,
  onStopNavigation
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersGroupRef = useRef<L.LayerGroup | null>(null);
  const routeLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const vehicleMarkerRef = useRef<L.Marker | null>(null);

  // Search & Autocomplete State
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [searchInput, setSearchInput] = useState(filters.searchQuery);

  // Active Journey Route State
  const [activeJourney, setActiveJourney] = useState<JourneyRoute | null>(initialJourney);
  const [selectedJourneyStopIndex, setSelectedJourneyStopIndex] = useState<number | null>(null);
  const [showAllEnRouteStops, setShowAllEnRouteStops] = useState<boolean>(false);
  const [selectedHazard, setSelectedHazard] = useState<RouteHazard | null>(null);

  // Map viewport & pan-away tracking (allows user to drag and inspect route without auto-snap)
  const [isMapPannedAway, setIsMapPannedAway] = useState<boolean>(false);

  // In-App Turn-by-Turn Navigation Engine State
  const [isNavigating, setIsNavigating] = useState<boolean>(initialNavigating);
  const [navProgress, setNavProgress] = useState<number>(0); // 0 to 1
  const [isNavPaused, setIsNavPaused] = useState<boolean>(false);
  const [navSpeedMultiplier, setNavSpeedMultiplier] = useState<number>(1); // 1x, 2x, 5x, 10x
  const [autoFollowCar, setAutoFollowCar] = useState<boolean>(true);

  const isDark = theme === 'dark';

  // Autocomplete Suggestions
  const placeSuggestions = useMemo(() => {
    return searchIndianPlaces(searchInput, userLocation, 8);
  }, [searchInput, userLocation]);

  // Sync external filter changes to searchInput ONLY when not focused (avoids loop when erasing)
  useEffect(() => {
    if (!isSearchFocused && filters.searchQuery !== searchInput) {
      setSearchInput(filters.searchQuery);
    }
  }, [filters.searchQuery, isSearchFocused]);

  // Sync initialJourney and initialNavigating from props
  useEffect(() => {
    if (initialJourney) {
      setActiveJourney(initialJourney);
      if (initialNavigating) {
        setIsNavigating(true);
        setNavProgress(0);
        setIsNavPaused(false);
      }
    } else {
      setActiveJourney(null);
      setIsNavigating(false);
    }
  }, [initialJourney, initialNavigating]);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Safely remove any prior map instance or leftover DOM state
    if (mapInstanceRef.current) {
      try {
        mapInstanceRef.current.remove();
      } catch (e) {
        console.warn('Map cleanup error:', e);
      }
      mapInstanceRef.current = null;
    }
    if ((mapContainerRef.current as any)._leaflet_id) {
      delete (mapContainerRef.current as any)._leaflet_id;
    }
    mapContainerRef.current.innerHTML = '';

    const initialLat = (userLocation && isValidCoordinate(userLocation.lat, userLocation.lng))
      ? userLocation.lat
      : 13.0067;
    const initialLng = (userLocation && isValidCoordinate(userLocation.lat, userLocation.lng))
      ? userLocation.lng
      : 80.2030;

    // Default zoom 11.2 provides comprehensive coverage of the entire city's charging points
    const map = L.map(mapContainerRef.current, {
      zoomControl: false,
      attributionControl: false
    }).setView([initialLat, initialLng], 11.2);

    // Dynamic tile styling based on eye-friendly theme
    const tileClass = isDark ? 'dark-map-tiles' : 'light-map-tiles';
    const tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

    L.tileLayer(tileUrl, {
      maxZoom: 19,
      className: tileClass
    }).addTo(map);

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    markersGroupRef.current = L.layerGroup().addTo(map);
    routeLayerGroupRef.current = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;

    // User drag / pan detection: allows user to freely inspect route without forced snap-back
    map.on('dragstart', () => {
      setIsMapPannedAway(true);
      setAutoFollowCar(false);
    });

    map.on('movestart', (e: any) => {
      if (e && (e as any).originalEvent) {
        setIsMapPannedAway(true);
        setAutoFollowCar(false);
      }
    });

    map.on('zoomstart', (e: any) => {
      if (e && (e as any).originalEvent) {
        setIsMapPannedAway(true);
        setAutoFollowCar(false);
      }
    });

    // Cover city perimeter if stations are available
    if (stations.length > 0 && !activeJourney) {
      try {
        const bounds = L.latLngBounds(stations.slice(0, 30).map(s => [s.latitude, s.longitude] as [number, number]));
        bounds.extend([initialLat, initialLng]);
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 12.5 });
      } catch (e) {}
    }

    const resizeObserver = new ResizeObserver(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    });
    resizeObserver.observe(mapContainerRef.current);

    setTimeout(() => {
      map.invalidateSize();
    }, 150);

    return () => {
      resizeObserver.disconnect();
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch (e) {}
        mapInstanceRef.current = null;
      }
    };
  }, [isDark]);

  // Update User GPS Marker & center map
  useEffect(() => {
    if (!mapInstanceRef.current || !userLocation) return;
    if (!isValidCoordinate(userLocation.lat, userLocation.lng)) return;

    if (!activeJourney && !isMapPannedAway) {
      try {
        mapInstanceRef.current.flyTo([userLocation.lat, userLocation.lng], 11.5, {
          animate: true,
          duration: 0.8
        });
      } catch (err) {
        console.warn('Map flyTo warning:', err);
      }
    }

    try {
      if (userMarkerRef.current) {
        userMarkerRef.current.setLatLng([userLocation.lat, userLocation.lng]);
      } else {
        // High-visibility user emoji marker with live radar pulse
        const userDivIcon = L.divIcon({
          className: 'user-gps-pulse-icon',
          html: `
            <div class="relative flex items-center justify-center cursor-pointer select-none group -translate-x-1/2 -translate-y-1/2">
              <div class="absolute w-12 h-12 rounded-full bg-teal-500/20 animate-ping pointer-events-none"></div>
              <div class="absolute w-8 h-8 rounded-full bg-teal-400/25 pointer-events-none"></div>
              <div class="relative w-10 h-10 rounded-full bg-slate-950 border-2 border-teal-400 shadow-2xl flex items-center justify-center text-lg transform group-hover:scale-110 transition-transform ring-2 ring-teal-500/40">
                <span>🚗</span>
                <span class="absolute -top-1 -right-1 flex h-3 w-3">
                  <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span class="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border border-white"></span>
                </span>
              </div>
              <div class="absolute -bottom-6 bg-slate-950/95 text-teal-300 border border-teal-500/50 text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-lg whitespace-nowrap pointer-events-none">
                You 📍
              </div>
            </div>
          `,
          iconSize: [0, 0],
          iconAnchor: [0, 0]
        });

        userMarkerRef.current = L.marker([userLocation.lat, userLocation.lng], {
          icon: userDivIcon,
          zIndexOffset: 1000
        })
          .addTo(mapInstanceRef.current)
          .bindPopup(
            `<div class="text-xs p-1"><b class="text-teal-400">Your Live GPS Location 📍</b><br/>EV routes, live turn-by-turn guidance, and fast chargers originate here.</div>`,
            { className: 'custom-leaflet-popup' }
          );
      }
    } catch (err) {
      console.warn('User marker warning:', err);
    }
  }, [userLocation, activeJourney, isMapPannedAway]);

  // RENDER ROUTE & EN-ROUTE CHARGING STATIONS ON MAP
  useEffect(() => {
    if (!mapInstanceRef.current || !routeLayerGroupRef.current) return;

    routeLayerGroupRef.current.clearLayers();

    if (!activeJourney) return;

    const map = mapInstanceRef.current;
    const group = routeLayerGroupRef.current;

    const allRoutes: RouteAlternative[] = (activeJourney.routes && activeJourney.routes.length > 0)
      ? activeJourney.routes
      : [
          {
            id: 'route-fastest',
            name: 'Expressway Route',
            viaRoad: 'via National Highway',
            badge: '⚡ Fastest Route',
            badgeColor: 'emerald',
            color: '#10b981',
            strokeColor: '#059669',
            totalTripDistanceKm: activeJourney.totalTripDistanceKm,
            estimatedTravelTimeMins: activeJourney.estimatedTravelTimeMins,
            routePolyline: activeJourney.routePolyline,
            stops: activeJourney.stops,
            hazards: activeJourney.hazards || [],
            efficiencyScore: 94,
            tollCostInr: 165,
            highlights: ['Fastest time', 'DC Fast chargers']
          }
        ];

    const currentSelectedId = activeJourney.selectedRouteId || allRoutes[0].id;
    let selectedPolylineRef: L.Polyline | null = null;

    // 1. Draw All Route Alternatives (Clickable on map!)
    allRoutes.forEach(route => {
      const isSelected = route.id === currentSelectedId;

      // Invisible wide hit area for seamless clicking anywhere on the road
      const hitArea = L.polyline(route.routePolyline, {
        color: 'transparent',
        weight: 26,
        opacity: 0.001
      }).addTo(group);

      hitArea.on('click', () => {
        handleSelectRoute(route.id);
      });

      if (isSelected) {
        // Deep background aura
        L.polyline(route.routePolyline, {
          color: route.strokeColor,
          weight: 8,
          opacity: 0.9,
          lineCap: 'round',
          lineJoin: 'round'
        }).addTo(group);

        // Core route line
        const primaryLine = L.polyline(route.routePolyline, {
          color: route.color,
          weight: 5,
          opacity: 1,
          lineCap: 'round',
          lineJoin: 'round'
        }).addTo(group);

        selectedPolylineRef = primaryLine;

        // Animated dashed overlay highlight
        L.polyline(route.routePolyline, {
          color: '#ffffff',
          weight: 2,
          opacity: 0.85,
          dashArray: '6, 12'
        }).addTo(group);

        primaryLine.on('click', () => {
          handleSelectRoute(route.id);
        });
      } else {
        // Unselected alternative route: subtle slate dashed line
        const altLine = L.polyline(route.routePolyline, {
          color: isDark ? '#475569' : '#64748b',
          weight: 4.5,
          opacity: 0.7,
          lineCap: 'round',
          lineJoin: 'round',
          dashArray: '8, 8'
        }).addTo(group);

        altLine.on('click', () => {
          handleSelectRoute(route.id);
        });
      }

      // Clickable floating route badge pill in the middle of each route
      const midIdx = Math.floor(route.routePolyline.length * 0.42);
      const midCoord = route.routePolyline[midIdx];
      if (midCoord) {
        const routePillIcon = L.divIcon({
          className: 'journey-route-badge-pin',
          html: `
            <div class="cursor-pointer group flex items-center gap-1.5 px-2.5 py-1 rounded-full border shadow-2xl backdrop-blur-md transition-all transform hover:scale-110 active:scale-95 -translate-x-1/2 -translate-y-1/2 select-none ${
              isSelected
                ? 'bg-slate-950 border-teal-400 text-white ring-2 ring-teal-400/50'
                : 'bg-slate-900/90 border-slate-700 text-slate-300 hover:text-white hover:border-slate-500'
            }">
              <span class="text-xs">${route.badge.split(' ')[0]}</span>
              <span class="text-[10px] font-extrabold truncate max-w-[90px]">${route.name.split(' ')[0]}</span>
              <span class="text-[10px] font-mono font-bold text-teal-300">${route.totalTripDistanceKm}km</span>
              ${!isSelected ? '<span class="text-[9px] text-teal-400 underline ml-0.5">Select</span>' : ''}
            </div>
          `,
          iconSize: [0, 0]
        });

        const pillMarker = L.marker(midCoord, {
          icon: routePillIcon,
          zIndexOffset: isSelected ? 950 : 450
        }).addTo(group);

        pillMarker.on('click', () => {
          handleSelectRoute(route.id);
        });
      }
    });

    // 2. Draw Road Hazards (Floods, Accidents, Roadwork) for active route
    const activeRoute = allRoutes.find(r => r.id === currentSelectedId) || allRoutes[0];
    (activeRoute.hazards || []).forEach(hazard => {
      let emoji = '⚠️';
      let badgeBg = 'bg-amber-950 border-amber-400 text-amber-200 ring-2 ring-amber-500/30';
      let dotBg = 'bg-amber-400';
      let label = 'Road Work';

      if (hazard.type === 'FLOOD') {
        emoji = '🌊';
        badgeBg = 'bg-sky-950 border-sky-400 text-sky-200 ring-2 ring-sky-500/40';
        dotBg = 'bg-sky-400';
        label = 'Flood / Waterlogging';
      } else if (hazard.type === 'ACCIDENT') {
        emoji = '💥';
        badgeBg = 'bg-rose-950 border-rose-500 text-rose-200 ring-2 ring-rose-500/40';
        dotBg = 'bg-rose-500';
        label = 'Accident Ahead';
      } else if (hazard.type === 'CONGESTION') {
        emoji = '🚗';
        badgeBg = 'bg-orange-950 border-orange-400 text-orange-200 ring-2 ring-orange-500/30';
        dotBg = 'bg-orange-400';
        label = 'Heavy Traffic';
      }

      const hazardIcon = L.divIcon({
        className: 'route-hazard-pin',
        html: `
          <div class="cursor-pointer group flex flex-col items-center -translate-x-1/2 -translate-y-full hover:scale-110 transition-transform select-none">
            <div class="flex items-center gap-1.5 px-2 py-1 rounded-xl border-2 shadow-2xl ${badgeBg} text-[10px] font-extrabold whitespace-nowrap">
              <span class="text-sm">${emoji}</span>
              <span>${label}</span>
              <span class="bg-black/50 text-white font-mono text-[9px] px-1 rounded font-bold">+${hazard.delayMins}m</span>
            </div>
            <div class="w-1.5 h-2 bg-slate-700"></div>
            <div class="w-2.5 h-2.5 rounded-full ${dotBg} -mt-1 shadow-md"></div>
          </div>
        `,
        iconSize: [0, 0]
      });

      const hazardMarker = L.marker([hazard.latitude, hazard.longitude], {
        icon: hazardIcon,
        zIndexOffset: 880
      }).addTo(group);

      hazardMarker.bindPopup(`
        <div class="p-1 space-y-1.5 text-xs select-none">
          <div class="flex items-center gap-1.5 font-bold ${hazard.type === 'FLOOD' ? 'text-sky-400' : hazard.type === 'ACCIDENT' ? 'text-rose-400' : 'text-amber-400'}">
            <span class="text-base">${emoji}</span>
            <span>${hazard.title}</span>
          </div>
          <p class="text-slate-300 text-[11px] leading-tight">${hazard.description}</p>
          <div class="flex items-center justify-between text-[10px] pt-1 border-t border-slate-800 text-slate-400 font-mono">
            <span>Delay: <b class="text-rose-400">+${hazard.delayMins} mins</b></span>
            <span>At KM ${hazard.distanceFromStartKm}</span>
          </div>
          <div class="text-[10px] text-amber-300 bg-amber-500/10 p-1.5 rounded font-semibold border border-amber-500/20">
            💡 ${hazard.advisory}
          </div>
        </div>
      `, { className: 'custom-leaflet-popup' });
    });

    // 3. Start Marker (Origin)
    const originIcon = L.divIcon({
      className: 'journey-origin-pin',
      html: `
        <div class="flex items-center gap-1.5 bg-slate-900 border border-teal-500 text-teal-300 text-[10px] font-bold px-2 py-1 rounded-full shadow-lg whitespace-nowrap -translate-x-1/2 -translate-y-full">
          <span class="w-2 h-2 rounded-full bg-teal-400"></span>
          <span>Start: ${activeJourney.origin.name.split(',')[0]}</span>
        </div>
      `,
      iconSize: [0, 0]
    });
    L.marker([activeJourney.origin.lat, activeJourney.origin.lng], { icon: originIcon }).addTo(group);

    // 4. Destination Marker
    const destIcon = L.divIcon({
      className: 'journey-dest-pin',
      html: `
        <div class="flex items-center gap-1.5 bg-slate-900 border border-rose-500 text-rose-300 text-[10px] font-bold px-2 py-1 rounded-full shadow-lg whitespace-nowrap -translate-x-1/2 -translate-y-full">
          <span class="w-2 h-2 rounded-full bg-rose-500"></span>
          <span>Dest: ${activeJourney.destination.name.split(',')[0]}</span>
        </div>
      `,
      iconSize: [0, 0]
    });
    L.marker([activeJourney.destination.lat, activeJourney.destination.lng], { icon: destIcon }).addTo(group);

    // 5. En-Route Charging Stops with sequential number badges
    activeJourney.stops.forEach((stop, idx) => {
      const { station, distanceFromStartKm, isSuggestedStop } = stop;
      const isSelected = selectedStation?.id === station.id;

      const stopBadgeIcon = L.divIcon({
        className: 'journey-stop-pin',
        html: `
          <div class="cursor-pointer group flex flex-col items-center -translate-x-1/2 -translate-y-full transition-transform hover:scale-110">
            <div class="flex items-center gap-1 px-2 py-1 rounded-lg border text-[10px] font-bold shadow-xl ${
              isSuggestedStop
                ? 'bg-amber-500 text-slate-950 border-amber-300 ring-2 ring-amber-400/40'
                : isSelected
                ? 'bg-teal-500 text-slate-950 border-teal-300 ring-2 ring-teal-400/40'
                : 'bg-slate-900 text-slate-100 border-slate-700 hover:border-teal-400'
            }">
              <span class="w-4 h-4 rounded-full bg-slate-950/30 text-white flex items-center justify-center text-[9px] font-mono font-bold">
                ${idx + 1}
              </span>
              <span class="truncate max-w-[80px] sm:max-w-[110px]">${station.operator}</span>
              <span class="font-mono opacity-85">${Math.round(distanceFromStartKm)}km</span>
            </div>
            <div class="w-1.5 h-2 bg-slate-700"></div>
            <div class="w-2 h-2 rounded-full bg-teal-400 -mt-1 shadow-sm"></div>
          </div>
        `,
        iconSize: [0, 0]
      });

      const marker = L.marker([station.latitude, station.longitude], {
        icon: stopBadgeIcon,
        zIndexOffset: isSuggestedStop ? 800 : 500
      }).addTo(group);

      marker.on('click', () => {
        onSelectStation(station);
        setSelectedJourneyStopIndex(idx);
      });
    });

    // Fit map bounds only if user hasn't panned away
    if (!isMapPannedAway && selectedPolylineRef) {
      try {
        const bounds = (selectedPolylineRef as L.Polyline).getBounds();
        map.fitBounds(bounds, {
          padding: [60, 60],
          maxZoom: 14,
          animate: true
        });
      } catch (err) {
        console.warn('fitBounds error:', err);
      }
    }
  }, [activeJourney, selectedStation, onSelectStation, isDark, isMapPannedAway]);

  // Update Standard Station Markers (when not in exclusive route mode or to supplement)
  useEffect(() => {
    if (!mapInstanceRef.current || !markersGroupRef.current) return;

    markersGroupRef.current.clearLayers();

    // When journey is active, activeJourney.stops are rendered with sequential stop badges.
    // We ALSO render all other filtered EV stations along the corridor so the user can see every charge point on the map!
    const routeStopStationIds = new Set(activeJourney?.stops.map(s => s.station.id) || []);

    filteredStations.forEach(station => {
      if (!isValidCoordinate(station.latitude, station.longitude)) return;
      if (routeStopStationIds.has(station.id)) return; // already rendered as sequential stop pin

      const availCount = station.connectors.filter(c => c.status === 'AVAILABLE').length;
      const isSelected = selectedStation?.id === station.id;
      const isBest = bestMatch?.station.id === station.id;

      const markerHtml = `
        <div class="relative cursor-pointer transition-transform duration-200 hover:scale-110 flex items-center justify-center">
          <div class="flex items-center gap-1 px-2 py-1 rounded-xl shadow-lg border text-xs font-bold ${
            isSelected
              ? 'bg-teal-500 text-slate-950 border-white ring-2 ring-teal-400'
              : isBest
              ? 'bg-amber-500 text-slate-950 border-amber-300 ring-2 ring-amber-400/40'
              : 'bg-slate-900/95 text-slate-100 border-slate-700/80 hover:border-slate-500'
          }">
            <span class="w-2 h-2 rounded-full shrink-0 ${
              availCount > 0 ? 'bg-teal-400' : 'bg-rose-500'
            }"></span>
            <span class="text-[11px] font-mono">${station.connectors[0].pricePerKwh ? `₹${station.connectors[0].pricePerKwh}` : 'EV'}</span>
          </div>
          <div class="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rotate-45 ${
            isSelected ? 'bg-teal-500' : isBest ? 'bg-amber-500' : 'bg-slate-900'
          }"></div>
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'station-custom-marker',
        html: markerHtml,
        iconSize: [60, 30],
        iconAnchor: [30, 28]
      });

      const marker = L.marker([station.latitude, station.longitude], {
        icon: customIcon,
        zIndexOffset: isSelected ? 500 : isBest ? 400 : 100
      });

      marker.on('click', () => {
        onSelectStation(station);
      });

      markersGroupRef.current?.addLayer(marker);
    });
  }, [filteredStations, selectedStation, bestMatch, activeJourney, onSelectStation]);

  // Handler: User selects a Place / Area from autocomplete or hits Enter
  const handleSelectDestination = (place: PlaceSuggestion) => {
    if (!userLocation || !isValidCoordinate(userLocation.lat, userLocation.lng)) return;

    setSearchInput(place.name);
    setIsSearchFocused(false);

    // Calculate Pan-India Journey Plan with En-Route Stops
    const origin = {
      lat: userLocation.lat,
      lng: userLocation.lng,
      name: 'Current Location'
    };
    const dest = {
      lat: place.latitude,
      lng: place.longitude,
      name: place.name
    };

    const journey = calculateJourneyPlan(origin, dest, stations);
    setActiveJourney(journey);
    setSelectedJourneyStopIndex(0);

    // If new highway corridor stations were synthesized along this route, add them globally
    if (onEnrichStations && journey.enRouteStations.length > 0) {
      onEnrichStations(journey.enRouteStations);
    }
  };

  // Handler: Freeform submit when user types any custom city/highway name
  const handleCustomSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchInput.trim() || !userLocation) return;

    // Check if directly matches a suggestion
    if (placeSuggestions.length > 0) {
      handleSelectDestination(placeSuggestions[0]);
    } else {
      const customPlace = resolveCustomIndianDestination(searchInput, userLocation);
      handleSelectDestination(customPlace);
    }
  };

  // Animation loop for live in-app navigation along the plotted route
  useEffect(() => {
    if (!isNavigating || !activeJourney || isNavPaused) {
      return;
    }

    // Default simulation takes ~100 seconds at 1x
    const baseDurationSec = 100;
    let lastTimestamp = performance.now();

    const interval = setInterval(() => {
      const now = performance.now();
      const deltaSec = (now - lastTimestamp) / 1000;
      lastTimestamp = now;

      setNavProgress(prev => {
        const step = (deltaSec / baseDurationSec) * navSpeedMultiplier;
        const next = prev + step;
        if (next >= 1) {
          setIsNavPaused(true);
          return 1;
        }
        return next;
      });
    }, 150);

    return () => clearInterval(interval);
  }, [isNavigating, activeJourney, isNavPaused, navSpeedMultiplier]);

  // Update vehicle position and heading marker on Leaflet map
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    if (!isNavigating || !activeJourney || activeJourney.routePolyline.length < 2) {
      if (vehicleMarkerRef.current) {
        vehicleMarkerRef.current.remove();
        vehicleMarkerRef.current = null;
      }
      return;
    }

    const { position, bearing } = getNavPosition(activeJourney.routePolyline, navProgress);
    const speed = navProgress >= 1 ? 0 : Math.round(65 + Math.sin(navProgress * 25) * 12);

    const vehicleHtml = `
      <div class="relative flex items-center justify-center pointer-events-none -translate-x-1/2 -translate-y-1/2">
        <div class="w-10 h-10 rounded-full bg-teal-400/25 animate-ping absolute"></div>
        <div class="w-9 h-9 rounded-full bg-slate-950 border-2 border-teal-400 shadow-2xl flex items-center justify-center text-teal-400 ring-2 ring-teal-400/40" style="transform: rotate(${Math.round(bearing)}deg); transition: transform 0.2s linear;">
          <svg class="w-5 h-5 fill-teal-400" viewBox="0 0 24 24">
            <polygon points="12 2 19 21 12 17 5 21 12 2"/>
          </svg>
        </div>
        <div class="absolute -bottom-5 bg-slate-900/95 text-teal-300 border border-teal-500/40 text-[9px] font-bold px-1.5 py-0.2 rounded-md shadow-md whitespace-nowrap">
          ${vehicleModelName || 'EV'} • ${speed} km/h
        </div>
      </div>
    `;

    const icon = L.divIcon({
      className: 'nav-vehicle-marker',
      html: vehicleHtml,
      iconSize: [0, 0]
    });

    if (!vehicleMarkerRef.current) {
      vehicleMarkerRef.current = L.marker(position, { icon, zIndexOffset: 1200 }).addTo(map);
      if (autoFollowCar && !isMapPannedAway) {
        map.setView(position, 15, { animate: true });
      }
    } else {
      vehicleMarkerRef.current.setLatLng(position);
      vehicleMarkerRef.current.setIcon(icon);
      if (autoFollowCar && !isMapPannedAway) {
        map.panTo(position, { animate: true, duration: 0.15 });
      }
    }
  }, [isNavigating, activeJourney, navProgress, autoFollowCar, vehicleModelName, isMapPannedAway]);

  // Handle user switching between the 2-3 best route alternatives
  const handleSelectRoute = (routeId: string) => {
    if (!activeJourney) return;
    const updated = switchJourneyRoute(activeJourney, routeId);
    setActiveJourney(updated);
    if (isNavigating) {
      setNavProgress(0); // restart navigation cleanly along selected path
    }
    if (mapInstanceRef.current && !isMapPannedAway) {
      try {
        const bounds = L.latLngBounds(updated.routePolyline);
        mapInstanceRef.current.fitBounds(bounds, { padding: [60, 60], maxZoom: 14, animate: true });
      } catch (e) {}
    }
  };

  // Re-centre map back to user location or navigating vehicle
  const handleRecenterMap = () => {
    setIsMapPannedAway(false);
    setAutoFollowCar(true);
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    if (isNavigating && activeJourney && activeJourney.routePolyline.length >= 2) {
      const { position } = getNavPosition(activeJourney.routePolyline, navProgress);
      map.setView(position, 15, { animate: true });
    } else if (activeJourney && activeJourney.routePolyline.length > 0) {
      const bounds = L.latLngBounds(activeJourney.routePolyline);
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 14, animate: true });
    } else if (userLocation && isValidCoordinate(userLocation.lat, userLocation.lng)) {
      map.flyTo([userLocation.lat, userLocation.lng], 13.5, { animate: true, duration: 0.6 });
    }
  };

  // Allow user to zoom out and inspect entire route corridor
  const handleFitFullRoute = () => {
    if (!mapInstanceRef.current || !activeJourney) return;
    setIsMapPannedAway(true);
    setAutoFollowCar(false);
    try {
      const bounds = L.latLngBounds(activeJourney.routePolyline);
      mapInstanceRef.current.fitBounds(bounds, { padding: [60, 60], maxZoom: 14, animate: true });
    } catch (e) {}
  };

  // Derived live navigation telemetry
  const navTelemetry = useMemo(() => {
    if (!activeJourney) return null;

    const totalKm = activeJourney.totalTripDistanceKm;
    const coveredKm = totalKm * navProgress;
    const remainingKm = Math.max(0, Math.round(totalKm - coveredKm));
    const remainingMins = Math.max(0, Math.round(activeJourney.estimatedTravelTimeMins * (1 - navProgress)));

    // Battery simulation: Start around 90%, consumes approx 0.18 kWh/km
    const startSoc = 92;
    const currentSoc = Math.max(8, Math.round(startSoc - (coveredKm / totalKm) * 65));
    const destSoc = Math.max(6, Math.round(startSoc - 65));

    // Next upcoming en-route charging stop
    const upcomingStops = activeJourney.stops.filter(s => s.distanceFromStartKm >= coveredKm);
    const nextStop = upcomingStops[0] || null;
    const distanceToNextStop = nextStop ? Math.max(0, Math.round(nextStop.distanceFromStartKm - coveredKm)) : null;

    // Upcoming road hazards along the selected path
    const upcomingHazards = (activeJourney.hazards || []).filter(h => h.distanceFromStartKm >= coveredKm);
    const nextHazard = upcomingHazards[0] || null;
    const distanceToNextHazard = nextHazard ? Math.max(0, Math.round(nextHazard.distanceFromStartKm - coveredKm)) : null;

    // Current guidance maneuver text
    let maneuverInstruction = `Follow Highway Corridor towards ${activeJourney.destination.name.split(',')[0]}`;
    let maneuverDistance = `${remainingKm} km`;
    let maneuverBadge = 'Highway NH Corridor';

    if (navProgress >= 1) {
      maneuverInstruction = `🎉 Destination Arrived! Journey Completed Successfully.`;
      maneuverDistance = '0 m';
      maneuverBadge = 'Destination Reached';
    } else if (distanceToNextHazard !== null && distanceToNextHazard <= 5 && nextHazard) {
      maneuverInstruction = `Caution: ${nextHazard.title} (+${nextHazard.delayMins}m delay)`;
      maneuverDistance = `In ${distanceToNextHazard} km`;
      maneuverBadge = nextHazard.type === 'FLOOD' ? '🌊 Flood Alert' : nextHazard.type === 'ACCIDENT' ? '💥 Accident Alert' : '⚠️ Hazard Ahead';
    } else if (distanceToNextStop !== null && distanceToNextStop <= 15) {
      maneuverInstruction = `Prepare to pitstop at ${nextStop.station.name}`;
      maneuverDistance = `In ${distanceToNextStop} km`;
      maneuverBadge = '⚡ Upcoming EV Charging Hub';
    } else if (navProgress <= 0.05) {
      maneuverInstruction = `Head towards main road to join National Highway`;
      maneuverDistance = '500 m';
      maneuverBadge = 'Trip Start';
    }

    const currentSpeed = navProgress >= 1 ? 0 : Math.round(68 + Math.sin(navProgress * 30) * 10);

    return {
      totalKm,
      coveredKm,
      remainingKm,
      remainingMins,
      currentSoc,
      destSoc,
      nextStop,
      distanceToNextStop,
      nextHazard,
      distanceToNextHazard,
      upcomingHazards,
      maneuverInstruction,
      maneuverDistance,
      maneuverBadge,
      currentSpeed
    };
  }, [activeJourney, navProgress]);

  const handleStartInAppNavigation = () => {
    setIsNavigating(true);
    setNavProgress(0);
    setIsNavPaused(false);
    setAutoFollowCar(true);
    if (activeJourney && activeJourney.routePolyline.length > 0 && mapInstanceRef.current) {
      mapInstanceRef.current.setView(activeJourney.routePolyline[0], 15, { animate: true });
    }
  };

  const handleStopNavigation = () => {
    setIsNavigating(false);
    setNavProgress(0);
    setIsNavPaused(false);
    if (vehicleMarkerRef.current) {
      vehicleMarkerRef.current.remove();
      vehicleMarkerRef.current = null;
    }
    if (onStopNavigation) {
      onStopNavigation();
    }
    if (activeJourney && mapInstanceRef.current) {
      try {
        const bounds = L.latLngBounds(activeJourney.routePolyline);
        mapInstanceRef.current.fitBounds(bounds, { padding: [60, 60] });
      } catch (err) {}
    }
  };

  const handleJumpToNextStop = () => {
    if (!activeJourney || !navTelemetry?.nextStop) return;
    const stopKm = navTelemetry.nextStop.distanceFromStartKm;
    const nextProg = Math.min(0.99, stopKm / activeJourney.totalTripDistanceKm);
    setNavProgress(nextProg);
  };

  const handleClearJourney = () => {
    setIsNavigating(false);
    setNavProgress(0);
    setIsNavPaused(false);
    if (vehicleMarkerRef.current) {
      vehicleMarkerRef.current.remove();
      vehicleMarkerRef.current = null;
    }
    setActiveJourney(null);
    setSelectedJourneyStopIndex(null);
    setSearchInput('');
    setFilters(f => ({ ...f, searchQuery: '' }));
    if (onStopNavigation) onStopNavigation();
    if (userLocation && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([userLocation.lat, userLocation.lng], 13, { duration: 0.8 });
    }
  };

  return (
    <div className="relative w-full h-full">
      {/* Leaflet Map DOM Container */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* LIVE IN-APP TURN-BY-TURN NAVIGATION HUD (When Navigating) */}
      {isNavigating && navTelemetry && activeJourney && (
        <div className="absolute top-3 inset-x-2 sm:inset-x-4 max-w-xl mx-auto z-30 pointer-events-none space-y-2">
          {/* Primary Maneuver & Highway HUD Card */}
          <div className="bg-slate-900/95 border-2 border-teal-500/80 rounded-2xl p-3.5 shadow-2xl backdrop-blur-md pointer-events-auto text-white">
            <div className="flex items-center justify-between gap-3">
              {/* Maneuver Icon */}
              <div className="w-11 h-11 rounded-xl bg-teal-500/20 text-teal-400 border border-teal-500/40 flex items-center justify-center shrink-0 shadow-inner">
                <Navigation className="w-6 h-6 fill-teal-400 animate-pulse" />
              </div>

              {/* Instructions */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase tracking-wider font-extrabold px-1.5 py-0.2 rounded bg-teal-500/20 text-teal-300 border border-teal-500/40">
                    {navTelemetry.maneuverBadge}
                  </span>
                  <span className="text-xs font-mono font-bold text-amber-300">
                    {navTelemetry.maneuverDistance}
                  </span>
                </div>
                <h3 className="text-sm sm:text-base font-extrabold text-white truncate mt-0.5">
                  {navTelemetry.maneuverInstruction}
                </h3>
              </div>

              {/* Live Vehicle Telemetry (Speed & Battery SoC) */}
              <div className="text-right shrink-0">
                <div className="text-lg font-black text-teal-400 font-mono leading-none">
                  {navTelemetry.currentSpeed} <span className="text-[10px] font-normal text-slate-400">km/h</span>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-bold font-mono mt-1 justify-end">
                  <BatteryCharging className="w-3 h-3" />
                  <span>{navTelemetry.currentSoc}%</span>
                </div>
              </div>
            </div>

            {/* Trip Progress Bar */}
            <div className="mt-2.5 pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-300">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-white">To: {activeJourney.destination.name.split(',')[0]}</span>
                <span className="text-slate-500">•</span>
                <span className="font-mono text-teal-300">{navTelemetry.remainingKm} km left</span>
                <span className="text-slate-500">•</span>
                <span className="text-slate-400">~{Math.floor(navTelemetry.remainingMins / 60)}h {navTelemetry.remainingMins % 60}m</span>
              </div>
              <span className="font-mono text-xs font-bold text-teal-400">
                {Math.round(navProgress * 100)}%
              </span>
            </div>

            {/* Visual Progress Track */}
            <div className="w-full h-1.5 bg-slate-800 rounded-full mt-1.5 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-teal-500 to-emerald-400 transition-all duration-300"
                style={{ width: `${Math.min(100, Math.round(navProgress * 100))}%` }}
              />
            </div>
          </div>

          {/* Upcoming En-Route Pitstop Alert (if station within reach) */}
          {navTelemetry.nextStop && (
            <div className="bg-slate-900/90 border border-teal-500/40 rounded-xl p-2.5 shadow-xl backdrop-blur-md pointer-events-auto flex items-center justify-between gap-2.5">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center text-xs shrink-0">
                  <Zap className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 text-[10px]">
                    <span className="font-bold text-amber-300">Next EV Pitstop</span>
                    <span className="text-slate-400">• in {navTelemetry.distanceToNextStop} km</span>
                  </div>
                  <p className="text-xs font-bold text-white truncate">
                    {navTelemetry.nextStop.station.name}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[10px] text-teal-400 font-mono font-bold bg-slate-800 px-1.5 py-0.5 rounded">
                  {navTelemetry.nextStop.station.connectors.filter(c => c.status === 'AVAILABLE').length} Open
                </span>
                <button
                  onClick={() => {
                    if (onLaunchBooking && navTelemetry.nextStop) {
                      onLaunchBooking(navTelemetry.nextStop.station);
                    } else if (navTelemetry.nextStop) {
                      onSelectStation(navTelemetry.nextStop.station);
                    }
                  }}
                  className="bg-teal-600 hover:bg-teal-500 text-white font-bold text-[10px] px-2.5 py-1 rounded-lg transition shadow active:scale-95 cursor-pointer"
                >
                  Reserve Bay
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TOP FLOATING AREA SEARCH BAR & AUTOCOMPLETE (Only when not in full active navigation) */}
      {!isNavigating && (
        <div className="absolute top-3 inset-x-2 sm:inset-x-4 max-w-xl mx-auto z-20 space-y-2 pointer-events-none">
          <div className="relative pointer-events-auto">
            <form onSubmit={handleCustomSearchSubmit} className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchInput}
                onFocus={() => setIsSearchFocused(true)}
                onChange={(e) => {
                  setSearchInput(e.target.value);
                  setFilters(f => ({ ...f, searchQuery: e.target.value }));
                }}
                placeholder="Search Indian cities, highways (NH44, NH48) or areas..."
                className={`w-full text-xs pl-9 pr-20 py-2.5 rounded-xl border shadow-lg backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-teal-500 transition-colors ${
                  isDark
                    ? 'bg-slate-900/90 text-slate-100 placeholder-slate-400 border-slate-750'
                    : 'bg-white/95 text-slate-800 placeholder-slate-500 border-slate-300 shadow-sm'
                }`}
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchInput('');
                    setFilters(f => ({ ...f, searchQuery: '' }));
                    if (activeJourney) handleClearJourney();
                  }}
                  className="absolute right-12 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1 text-xs"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-teal-600 hover:bg-teal-500 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg transition"
              >
                Route
              </button>
            </form>

            {/* Autocomplete Suggestions Dropdown */}
            {isSearchFocused && placeSuggestions.length > 0 && (
              <div
                className={`absolute top-full left-0 right-0 mt-1.5 rounded-xl border shadow-2xl backdrop-blur-md overflow-hidden z-30 max-h-72 overflow-y-auto ${
                  isDark ? 'bg-slate-900/95 border-slate-750' : 'bg-white/95 border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between px-3 py-1.5 border-b border-slate-800/80 text-[10px] text-slate-400 font-medium">
                  <span>Suggested Destinations across India</span>
                  <button
                    type="button"
                    onMouseDown={() => setIsSearchFocused(false)}
                    className="hover:underline text-teal-400"
                  >
                    Close
                  </button>
                </div>

                {placeSuggestions.map(place => (
                  <div
                    key={place.id}
                    onMouseDown={() => handleSelectDestination(place)}
                    className={`flex items-center justify-between px-3.5 py-2.5 cursor-pointer border-b last:border-0 transition ${
                      isDark
                        ? 'border-slate-800/60 hover:bg-slate-800 text-slate-200'
                        : 'border-slate-100 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-teal-500/15 border border-teal-500/25 flex items-center justify-center text-teal-400 shrink-0">
                        <MapPin className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold truncate text-slate-100">
                          {place.name}
                        </p>
                        <p className="text-[10px] text-slate-400 truncate">
                          {place.fullName}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0 ml-2">
                      <span className="text-[10px] font-semibold text-teal-400 font-mono block">
                        {place.distanceKm ? `${place.distanceKm} km` : 'India'}
                      </span>
                      <span className="text-[9px] bg-slate-800 px-1.5 py-0.2 rounded text-slate-400 font-medium">
                        {place.category}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Filter Chips (When not in full journey view) */}
          {!activeJourney && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar pointer-events-auto">
              <button
                onClick={() => setFilters(f => ({ ...f, availableOnly: !f.availableOnly }))}
                className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border backdrop-blur-md shadow-sm transition whitespace-nowrap ${
                  filters.availableOnly
                    ? 'bg-teal-500 text-slate-950 border-teal-400 font-bold'
                    : isDark
                    ? 'bg-slate-900/85 text-slate-300 border-slate-750 hover:border-slate-600'
                    : 'bg-white/90 text-slate-700 border-slate-200 hover:border-slate-300'
                }`}
              >
                ● Available Now
              </button>
              <button
                onClick={() => setFilters(f => ({ ...f, minPowerKw: f.minPowerKw === 60 ? 0 : 60 }))}
                className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border backdrop-blur-md shadow-sm transition whitespace-nowrap ${
                  filters.minPowerKw === 60
                    ? 'bg-teal-500 text-slate-950 border-teal-400 font-bold'
                    : isDark
                    ? 'bg-slate-900/85 text-slate-300 border-slate-750 hover:border-slate-600'
                    : 'bg-white/90 text-slate-700 border-slate-200 hover:border-slate-300'
                }`}
              >
                ⚡ Fast 60kW+
              </button>
              <button
                onClick={() => setFilters(f => ({ ...f, minPowerKw: f.minPowerKw === 120 ? 0 : 120 }))}
                className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border backdrop-blur-md shadow-sm transition whitespace-nowrap ${
                  filters.minPowerKw === 120
                    ? 'bg-teal-500 text-slate-950 border-teal-400 font-bold'
                    : isDark
                    ? 'bg-slate-900/85 text-slate-300 border-slate-750 hover:border-slate-600'
                    : 'bg-white/90 text-slate-700 border-slate-200 hover:border-slate-300'
                }`}
              >
                ⚡ Ultra 120kW+
              </button>
            </div>
          )}
        </div>
      )}

      {/* FLOATING "RE-CENTRE" PROMPT (Pops up whenever user drags the map away from position/car) */}
      {isMapPannedAway && (
        <div className="absolute top-20 sm:top-18 left-1/2 -translate-x-1/2 z-30 pointer-events-auto">
          <button
            type="button"
            onClick={handleRecenterMap}
            className="flex items-center gap-2 bg-slate-950/95 hover:bg-slate-900 text-teal-300 hover:text-white px-4 py-2 rounded-full border-2 border-teal-400 shadow-2xl backdrop-blur-md text-xs font-extrabold transition transform hover:scale-105 active:scale-95 cursor-pointer ring-4 ring-teal-500/25 animate-pulse"
          >
            <Compass className="w-4 h-4 text-teal-400" />
            <span>Re-centre {isNavigating ? 'to Vehicle 🚗' : 'to My Location 📍'}</span>
          </button>
        </div>
      )}

      {/* Recenter & Fit-Route Buttons on Right Edge */}
      <div className={`absolute right-3.5 z-10 flex flex-col items-center gap-2 transition-all ${isNavigating ? 'bottom-24' : 'bottom-28 sm:bottom-32'}`}>
        {activeJourney && (
          <button
            type="button"
            onClick={handleFitFullRoute}
            className="w-10 h-10 bg-slate-900/95 hover:bg-slate-850 text-white rounded-full border border-slate-700 shadow-lg flex items-center justify-center transition active:scale-95"
            title="Fit Entire Route Corridor on Screen"
          >
            <Route className="w-4 h-4 text-teal-400" />
          </button>
        )}

        <button
          onClick={handleRecenterMap}
          className="w-10 h-10 bg-slate-900/95 hover:bg-slate-850 text-white rounded-full border border-teal-500/50 shadow-lg flex items-center justify-center transition active:scale-95"
          title={isNavigating ? 'Re-centre on Vehicle' : 'Re-centre on Live GPS Position'}
        >
          <Compass className="w-4 h-4 text-teal-400" />
        </button>
      </div>

      {/* LIVE IN-APP NAVIGATION CONTROL DOCK (When Navigating) */}
      {isNavigating && activeJourney && (
        <div className="absolute bottom-2 inset-x-2 sm:inset-x-4 max-w-xl mx-auto z-20 pointer-events-auto">
          <div className="bg-slate-900/95 backdrop-blur-md border border-teal-500/50 rounded-2xl p-2.5 shadow-2xl flex items-center justify-between gap-2">
            {/* Play / Pause & Speed Multipliers */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setIsNavPaused(p => !p)}
                className="w-8 h-8 rounded-xl bg-teal-500 text-slate-950 flex items-center justify-center font-bold shadow transition active:scale-95 cursor-pointer"
                title={isNavPaused ? 'Resume Navigation' : 'Pause Navigation'}
              >
                {isNavPaused ? <Play className="w-4 h-4 fill-current ml-0.5" /> : <Pause className="w-4 h-4 fill-current" />}
              </button>

              <div className="flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-750 text-[10px] font-mono">
                {[1, 2, 5, 10].map(speed => (
                  <button
                    key={speed}
                    onClick={() => setNavSpeedMultiplier(speed)}
                    className={`px-1.5 py-0.5 rounded transition ${
                      navSpeedMultiplier === speed
                        ? 'bg-teal-500 text-slate-950 font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {speed}x
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons: Route stops toggle, Jump to next charger, Camera follow & Exit */}
            <div className="flex items-center gap-1.5">
              {activeJourney.stops.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowAllEnRouteStops(p => !p)}
                  className={`px-2 py-1 rounded-lg text-[10px] font-bold transition flex items-center gap-1 cursor-pointer border ${
                    showAllEnRouteStops
                      ? 'bg-amber-500 text-slate-950 border-amber-400 font-extrabold'
                      : 'bg-slate-800 hover:bg-slate-750 text-amber-300 border-amber-500/30'
                  }`}
                  title="View all EV charging hubs along this route"
                >
                  <Zap className="w-3 h-3 text-amber-400" />
                  <span>Stops ({activeJourney.stops.length})</span>
                </button>
              )}

              {navTelemetry?.nextStop && (
                <button
                  type="button"
                  onClick={handleJumpToNextStop}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-750 text-teal-300 border border-teal-500/30 rounded-lg text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
                  title="Jump vehicle simulation to the next en-route EV charging hub"
                >
                  <span>Next</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setAutoFollowCar(f => !f)}
                className={`p-1.5 rounded-lg border text-[10px] font-semibold transition ${
                  autoFollowCar
                    ? 'bg-teal-500/20 border-teal-500 text-teal-300'
                    : 'bg-slate-800 border-slate-700 text-slate-400'
                }`}
                title="Toggle Auto-Follow Camera on Vehicle"
              >
                <Eye className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={handleStopNavigation}
                className="px-3 py-1.5 bg-rose-600/90 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition shadow active:scale-95 cursor-pointer"
              >
                Exit Nav
              </button>
            </div>
          </div>

          {/* Expandable Slide-up List of All EV Charging Points Along Route */}
          {showAllEnRouteStops && (
            <div className="mt-2 bg-slate-900/95 backdrop-blur-md border border-amber-500/40 rounded-2xl p-3 shadow-2xl space-y-2 max-h-60 overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5" />
                  <span>All EV Charging Points Along Route ({activeJourney.stops.length})</span>
                </span>
                <button
                  type="button"
                  onClick={() => setShowAllEnRouteStops(false)}
                  className="text-slate-400 hover:text-white text-xs font-bold px-1.5 py-0.5 rounded bg-slate-800"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-1.5">
                {activeJourney.stops.map((stop, idx) => {
                  const availCount = stop.station.connectors.filter(c => c.status === 'AVAILABLE').length;
                  const totalCount = stop.station.connectors.length;
                  const maxKw = Math.max(...stop.station.connectors.map(c => c.powerKw));
                  return (
                    <div
                      key={stop.station.id}
                      className="p-2 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-slate-700 flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="w-4 h-4 rounded-full bg-teal-500/20 text-teal-300 font-mono text-[9px] font-bold flex items-center justify-center">
                            {idx + 1}
                          </span>
                          <h5 className="text-xs font-bold text-white truncate max-w-[180px] sm:max-w-xs">
                            {stop.station.name}
                          </h5>
                          {stop.isSuggestedStop && (
                            <span className="text-[8px] bg-amber-500/20 text-amber-300 px-1 rounded font-bold">Recommended</span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-2">
                          <span>{Math.round(stop.distanceFromStartKm)} km into trip</span>
                          <span>•</span>
                          <span className={availCount > 0 ? 'text-teal-400 font-semibold' : 'text-rose-400'}>
                            {availCount}/{totalCount} Available
                          </span>
                          <span>•</span>
                          <span className="text-slate-300">{maxKw}kW</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            if (mapInstanceRef.current) {
                              mapInstanceRef.current.flyTo([stop.station.latitude, stop.station.longitude], 14);
                            }
                            onSelectStation(stop.station);
                          }}
                          className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold"
                        >
                          View
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (onLaunchBooking) onLaunchBooking(stop.station);
                            else onSelectStation(stop.station);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-[10px] font-bold shadow"
                        >
                          Reserve
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ACTIVE JOURNEY EV ROUTE PANEL (When Route is Plotted but NOT yet in full turn-by-turn navigation) */}
      {!isNavigating && activeJourney && (
        <div className="absolute bottom-2 inset-x-2 sm:inset-x-4 max-w-2xl mx-auto z-20 pointer-events-auto">
          <div className="bg-slate-900/95 backdrop-blur-md border border-teal-500/40 rounded-2xl p-3 sm:p-3.5 shadow-2xl space-y-2.5">
            {/* Journey Header */}
            <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center font-bold text-xs shrink-0 border border-teal-500/30">
                  <Route className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white truncate">
                      {activeJourney.origin.name.split(',')[0]} → {activeJourney.destination.name.split(',')[0]}
                    </span>
                    <span className="text-[10px] bg-teal-500/20 text-teal-300 px-1.5 py-0.2 rounded font-mono font-bold">
                      {activeJourney.totalTripDistanceKm} km
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                    <span>Est. {Math.floor(activeJourney.estimatedTravelTimeMins / 60)}h {activeJourney.estimatedTravelTimeMins % 60}m drive</span>
                    <span>•</span>
                    <span className="text-teal-300 font-semibold">{activeJourney.stops.length} EV charging hubs on way</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {/* PRIMARY: IN-APP LIVE NAVIGATION BUTTON */}
                <button
                  type="button"
                  onClick={handleStartInAppNavigation}
                  className="flex items-center gap-1.5 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-extrabold text-xs px-3 py-1.5 rounded-xl shadow-lg shadow-teal-500/20 active:scale-95 transition cursor-pointer"
                >
                  <Navigation className="w-3.5 h-3.5 fill-current" />
                  <span>Start Nav</span>
                </button>

                {/* Secondary Google Maps link */}
                <a
                  href={buildGoogleMapsRouteUrl(activeJourney.origin, activeJourney.destination, activeJourney.stops.map(s => s.station))}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 bg-slate-800 hover:bg-slate-750 text-slate-300 text-[11px] font-semibold px-2 py-1.5 rounded-lg border border-slate-700 transition"
                  title="Open driving route with EV waypoints in Google Maps"
                >
                  <ExternalLink className="w-3 h-3 text-teal-400" />
                  <span className="hidden sm:inline">Maps</span>
                </a>

                <button
                  onClick={handleClearJourney}
                  className="text-[11px] text-slate-400 hover:text-white bg-slate-800 px-2 py-1.5 rounded-lg border border-slate-700 transition"
                >
                  Clear
                </button>
              </div>
            </div>

            {/* 2-3 BEST ROUTE ALTERNATIVES SELECTOR */}
            {activeJourney.routes && activeJourney.routes.length > 0 && (
              <div className="space-y-1.5 pt-0.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-slate-300 flex items-center gap-1.5">
                    <Route className="w-3.5 h-3.5 text-teal-400" />
                    <span>Choose Best Route ({activeJourney.routes.length} Options)</span>
                  </span>
                  <span className="text-[10px] text-teal-400 font-semibold">
                    Click route card or road on map
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {activeJourney.routes.map((rt) => {
                    const isSelected = rt.id === (activeJourney.selectedRouteId || activeJourney.routes![0].id);
                    const hasFlood = (rt.hazards || []).some(h => h.type === 'FLOOD');
                    const hasAccident = (rt.hazards || []).some(h => h.type === 'ACCIDENT');
                    const hazardCount = (rt.hazards || []).length;

                    return (
                      <div
                        key={rt.id}
                        onClick={() => handleSelectRoute(rt.id)}
                        className={`p-2.5 rounded-xl border transition cursor-pointer select-none relative ${
                          isSelected
                            ? 'bg-teal-500/15 border-teal-400 ring-2 ring-teal-400/40 shadow-lg'
                            : 'bg-slate-950/80 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'
                        }`}
                      >
                        {isSelected && (
                          <span className="absolute -top-2 right-2 bg-teal-500 text-slate-950 text-[9px] font-black px-1.5 py-0.2 rounded-full shadow">
                            Selected
                          </span>
                        )}
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="text-[10px] font-extrabold truncate text-teal-300">
                            {rt.badge}
                          </span>
                          <span className="font-mono text-xs font-black text-white">
                            {Math.floor(rt.estimatedTravelTimeMins / 60)}h {rt.estimatedTravelTimeMins % 60}m
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-slate-300 mb-1">
                          <span className="font-bold">{rt.name}</span>
                          <span className="font-mono text-teal-300 font-bold">{rt.totalTripDistanceKm} km</span>
                        </div>

                        <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800/80">
                          <span className="truncate max-w-[120px]">{rt.viaRoad}</span>
                          {hazardCount > 0 ? (
                            <span className={`font-bold flex items-center gap-0.5 ${hasFlood ? 'text-sky-400' : hasAccident ? 'text-rose-400' : 'text-amber-400'}`}>
                              {hasFlood ? '🌊' : hasAccident ? '💥' : '⚠️'} {hazardCount} Hazard
                            </span>
                          ) : (
                            <span className="text-emerald-400 font-bold flex items-center gap-0.5">
                              <ShieldCheck className="w-3 h-3" /> Clear Road
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ROUTE HAZARD ALERT BANNER (If active route has any hazard) */}
            {activeJourney.hazards && activeJourney.hazards.length > 0 && (
              <div className="bg-amber-950/40 border border-amber-500/50 rounded-xl p-2.5 flex items-start gap-2.5 text-xs">
                <div className="text-base shrink-0 mt-0.5">
                  {activeJourney.hazards[0].type === 'FLOOD' ? '🌊' : activeJourney.hazards[0].type === 'ACCIDENT' ? '💥' : '⚠️'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-amber-300">
                      {activeJourney.hazards[0].title} (+{activeJourney.hazards[0].delayMins}m delay)
                    </span>
                    <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1 rounded font-bold">
                      At KM {activeJourney.hazards[0].distanceFromStartKm}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 mt-0.5">
                    {activeJourney.hazards[0].description} • <span className="text-teal-300 font-semibold">{activeJourney.hazards[0].advisory}</span>
                  </p>
                </div>
                {activeJourney.routes && activeJourney.routes.length > 1 && (
                  <button
                    type="button"
                    onClick={() => {
                      const safeRoute = activeJourney.routes?.find(r => r.id !== activeJourney.selectedRouteId && !(r.hazards || []).some(h => h.type === 'FLOOD')) || activeJourney.routes?.[1];
                      if (safeRoute) handleSelectRoute(safeRoute.id);
                    }}
                    className="shrink-0 text-[10px] bg-teal-500 hover:bg-teal-400 text-slate-950 font-extrabold px-2.5 py-1.5 rounded-lg transition shadow active:scale-95 cursor-pointer"
                  >
                    Switch Safe Path 🛡️
                  </button>
                )}
              </div>
            )}

            {/* Horizontal Sequence of En-Route Charging Hubs */}
            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
              {activeJourney.stops.map((stop, idx) => {
                const { station, distanceFromStartKm, detourKm, isSuggestedStop } = stop;
                const availBays = station.connectors.filter(c => c.status === 'AVAILABLE').length;
                const totalBays = station.connectors.length;
                const maxPower = Math.max(...station.connectors.map(c => c.powerKw));
                const isSelected = selectedStation?.id === station.id;

                return (
                  <div
                    key={station.id}
                    onClick={() => {
                      onSelectStation(station);
                      setSelectedJourneyStopIndex(idx);
                    }}
                    className={`min-w-[210px] max-w-[230px] p-2.5 rounded-xl border transition cursor-pointer shrink-0 select-none ${
                      isSelected
                        ? 'bg-teal-500/15 border-teal-500 ring-1 ring-teal-500'
                        : isSuggestedStop
                        ? 'bg-amber-500/10 border-amber-500/60'
                        : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] mb-1">
                      <span className="font-bold font-mono px-1.5 py-0.2 rounded bg-slate-800 text-teal-300">
                        Stop #{idx + 1} • {Math.round(distanceFromStartKm)}km
                      </span>
                      {isSuggestedStop && (
                        <span className="text-[9px] bg-amber-500 text-slate-950 font-bold px-1.5 py-0.2 rounded">
                          Recommended
                        </span>
                      )}
                    </div>

                    <h4 className="text-xs font-bold text-white truncate mb-0.5">
                      {station.name}
                    </h4>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1.5">
                      <span className={availBays > 0 ? 'text-teal-400 font-semibold' : 'text-rose-400'}>
                        {availBays}/{totalBays} Open
                      </span>
                      <span className="font-semibold text-slate-300">{maxPower}kW Fast</span>
                      <span>+{detourKm}km detour</span>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onLaunchBooking) onLaunchBooking(station);
                        else onSelectStation(station);
                      }}
                      className="w-full bg-teal-600 hover:bg-teal-500 text-white text-[10px] font-bold py-1 rounded-lg transition text-center block"
                    >
                      Reserve Bay
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Bottom Horizontal Carousel of Local Stations (Only if no journey route active and not navigating) */}
      {!activeJourney && !isNavigating && (
        <div className="absolute bottom-2 inset-x-2 sm:inset-x-4 z-10 pointer-events-none">
          <div className="flex gap-2.5 overflow-x-auto pb-2 pt-1 no-scrollbar snap-x pointer-events-auto">
            {filteredStations.slice(0, 10).map(station => {
              const availCount = station.connectors.filter(c => c.status === 'AVAILABLE').length;
              const totalCount = station.connectors.length;
              const maxPower = Math.max(...station.connectors.map(c => c.powerKw));
              const isSelected = selectedStation?.id === station.id;

              return (
                <div
                  key={station.id}
                  onClick={() => onSelectStation(station)}
                  className={`min-w-[240px] max-w-[270px] bg-slate-900/95 backdrop-blur-md border rounded-xl p-3 snap-start cursor-pointer shadow-xl transition select-none ${
                    isSelected ? 'border-teal-500 ring-1 ring-teal-500' : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-1 mb-1">
                    <span
                      className="text-[10px] font-bold px-1.5 py-0.5 rounded truncate max-w-[150px]"
                      style={{ backgroundColor: `${station.operatorLogoColor}20`, color: station.operatorLogoColor }}
                    >
                      {station.operator}
                    </span>
                    <span className="text-[11px] font-bold text-slate-200 shrink-0">
                      {station.distanceKm} km
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-white truncate mb-1">{station.name}</h4>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/80">
                    <span className={availCount > 0 ? 'text-teal-400 font-semibold' : 'text-rose-400 font-semibold'}>
                      {availCount} of {totalCount} open
                    </span>
                    <span className="font-semibold text-slate-300">Up to {maxPower}kW</span>
                    <span className="font-mono text-teal-400 font-bold">₹{station.connectors[0].pricePerKwh}/u</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
