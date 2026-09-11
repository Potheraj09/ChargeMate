import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  X, Navigation, MapPin, Zap, ChevronRight, Compass, ShieldCheck,
  BatteryCharging, Clock, ExternalLink, Plus, Check, Star, Search
} from 'lucide-react';
import L from 'leaflet';
import { ChargingStation, EnRouteStop } from '../types';
import { calculateJourneyPlan, buildGoogleMapsRouteUrl, generateHighwayCorridorStations, JourneyRoute, switchJourneyRoute } from '../services/corridorRouteService';
import { isValidCoordinate } from '../services/geoService';
import { searchIndianPlaces, resolveCustomIndianDestination, PlaceSuggestion } from '../services/placesService';

interface RouteNavigationModalProps {
  isOpen: boolean;
  onClose: () => void;
  userLocation: { lat: number; lng: number };
  userCityName: string;
  initialDestination?: { lat: number; lng: number; name: string; address?: string };
  stations: ChargingStation[];
  onSelectStation?: (station: ChargingStation) => void;
  onBookStation: (station: ChargingStation) => void;
  onStartInAppNavigation?: (journey: JourneyRoute, selectedWaypoints: ChargingStation[]) => void;
}

export const RouteNavigationModal: React.FC<RouteNavigationModalProps> = ({
  isOpen,
  onClose,
  userLocation,
  userCityName,
  initialDestination,
  stations,
  onSelectStation,
  onBookStation,
  onStartInAppNavigation
}) => {
  // Destination state
  const defaultDest = initialDestination || {
    name: 'Bengaluru (Electronic City Hub)',
    address: 'Hosur Road, Bengaluru, Karnataka',
    lat: 12.8452,
    lng: 77.6602
  };

  const [destinationName, setDestinationName] = useState(defaultDest.name);
  const [destinationCoords, setDestinationCoords] = useState<{ lat: number; lng: number }>({
    lat: defaultDest.lat,
    lng: defaultDest.lng
  });
  const [destinationAddress, setDestinationAddress] = useState(defaultDest.address || defaultDest.name);

  // Search input state: SINGLE source of truth for the input box (prevents looping when erased)
  const [destinationInputText, setDestinationInputText] = useState(defaultDest.name);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Selected waypoint charging stops to inject into navigation
  const [selectedWaypoints, setSelectedWaypoints] = useState<ChargingStation[]>([]);
  const [selectedRouteId, setSelectedRouteId] = useState<string>('route-expressway');

  // Leaflet map ref
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const routeLayersRef = useRef<L.LayerGroup | null>(null);

  // Autocomplete suggestions based on destinationInputText
  const searchSuggestions = useMemo(() => {
    return searchIndianPlaces(destinationInputText, userLocation, 6);
  }, [destinationInputText, userLocation]);

  // Compute full pan-India journey plan with en-route stops
  const baseJourneyPlan = useMemo(() => {
    const origin = { lat: userLocation.lat, lng: userLocation.lng, name: userCityName };
    const dest = { lat: destinationCoords.lat, lng: destinationCoords.lng, name: destinationName };
    return calculateJourneyPlan(origin, dest, stations);
  }, [userLocation, userCityName, destinationCoords, destinationName, stations]);

  const journeyPlan = useMemo(() => {
    return switchJourneyRoute(baseJourneyPlan, selectedRouteId);
  }, [baseJourneyPlan, selectedRouteId]);

  // Preset destinations across Indian corridors
  const PRESET_DESTINATIONS = [
    { name: 'Bengaluru (Electronic City)', address: 'Hosur Road, Bengaluru', lat: 12.8452, lng: 77.6602 },
    { name: 'Coimbatore (Avinashi Rd)', address: 'Avinashi Road, Coimbatore', lat: 11.0264, lng: 77.0124 },
    { name: 'Pondicherry Beach Corridor', address: 'East Coast Road, Pondicherry', lat: 11.9416, lng: 79.8083 },
    { name: 'Pune (Hinjawadi IT Park)', address: 'Mumbai-Pune Expressway, Pune', lat: 18.5913, lng: 73.7389 },
    { name: 'Jaipur (Delhi-Jaipur NH48)', address: 'NH48 Behror Corridor, Jaipur', lat: 26.9124, lng: 75.7873 }
  ];

  // Initialize and update Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      if ((mapContainerRef.current as any)._leaflet_id) {
        delete (mapContainerRef.current as any)._leaflet_id;
      }
      mapContainerRef.current.innerHTML = '';

      try {
        const map = L.map(mapContainerRef.current, {
          zoomControl: false,
          attributionControl: false
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          className: 'dark-map-tiles'
        }).addTo(map);

        const layersGroup = L.layerGroup().addTo(map);
        routeLayersRef.current = layersGroup;
        mapInstanceRef.current = map;

        setTimeout(() => {
          map.invalidateSize();
        }, 150);
      } catch (err) {
        console.warn('Leaflet initialization error in RouteNavigationModal:', err);
        return;
      }
    }

    const map = mapInstanceRef.current;
    const layers = routeLayersRef.current;
    if (!map || !layers) return;

    layers.clearLayers();

    const startLat = userLocation.lat;
    const startLng = userLocation.lng;
    const endLat = destinationCoords.lat;
    const endLng = destinationCoords.lng;

    if (!isValidCoordinate(startLat, startLng) || !isValidCoordinate(endLat, endLng)) return;

    // Start marker (Teal)
    const startIcon = L.divIcon({
      className: 'custom-start-marker',
      html: `<div class="w-6 h-6 rounded-full bg-teal-500 border-2 border-white shadow-lg flex items-center justify-center text-white text-[10px] font-bold">A</div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });
    L.marker([startLat, startLng], { icon: startIcon })
      .bindPopup(`<b class="text-xs">Start: Your Current Location</b><br/><span class="text-[11px] text-slate-300">${userCityName}</span>`)
      .addTo(layers);

    // End marker (Rose)
    const endIcon = L.divIcon({
      className: 'custom-end-marker',
      html: `<div class="w-6 h-6 rounded-full bg-rose-500 border-2 border-white shadow-lg flex items-center justify-center text-white text-[10px] font-bold">B</div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });
    L.marker([endLat, endLng], { icon: endIcon })
      .bindPopup(`<b class="text-xs">Destination: ${destinationName}</b><br/><span class="text-[11px] text-slate-300">${destinationAddress}</span>`)
      .addTo(layers);

    // Connecting Route Polyline
    const polyline = L.polyline(
      journeyPlan.routePolyline,
      { color: '#0d9488', weight: 4, opacity: 0.9, lineCap: 'round', lineJoin: 'round' }
    ).addTo(layers);

    // En-route stations markers
    const bounds = polyline.getBounds();

    journeyPlan.stops.forEach((stop, idx) => {
      const isSelected = selectedWaypoints.some(w => w.id === stop.station.id);
      const isSuggested = stop.isSuggestedStop;

      const chargerIcon = L.divIcon({
        className: 'custom-charger-marker',
        html: `
          <div class="flex items-center gap-1 px-1.5 py-0.5 rounded-lg border text-[9px] font-bold shadow-md cursor-pointer ${
            isSelected
              ? 'bg-teal-500 text-slate-950 border-white ring-2 ring-teal-400'
              : isSuggested
              ? 'bg-amber-500 text-slate-950 border-amber-300 ring-2 ring-amber-400/40'
              : 'bg-slate-900/90 text-slate-200 border-slate-700'
          }">
            <span class="w-3.5 h-3.5 rounded-full bg-slate-950/40 text-white flex items-center justify-center text-[8px] font-mono">
              ${idx + 1}
            </span>
            <span class="truncate max-w-[70px]">${stop.station.operator}</span>
          </div>
        `,
        iconSize: [0, 0]
      });

      L.marker([stop.station.latitude, stop.station.longitude], { icon: chargerIcon })
        .bindPopup(`
          <div class="p-1 text-xs">
            <b class="text-teal-400 font-bold">${stop.station.name}</b><br/>
            <span class="text-[10px] text-slate-300">${stop.station.address}</span><br/>
            <span class="text-amber-400 font-mono text-[10px]">At ${Math.round(stop.distanceFromStartKm)} km • +${stop.detourKm}km detour</span>
          </div>
        `)
        .addTo(layers);
    });

    try {
      map.fitBounds(bounds, { padding: [30, 30] });
    } catch (err) {
      console.warn('fitBounds error in modal:', err);
    }

    return () => {
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch (e) {}
        mapInstanceRef.current = null;
      }
    };
  }, [userLocation, destinationCoords, destinationName, destinationAddress, userCityName, journeyPlan, selectedWaypoints]);

  const toggleWaypoint = (station: ChargingStation) => {
    setSelectedWaypoints(prev => {
      const exists = prev.some(w => w.id === station.id);
      if (exists) {
        return prev.filter(w => w.id !== station.id);
      } else {
        return [...prev, station];
      }
    });
  };

  const handleSelectSuggestion = (place: PlaceSuggestion) => {
    setDestinationInputText(place.name);
    setDestinationName(place.name);
    setDestinationAddress(place.fullName);
    setDestinationCoords({ lat: place.latitude, lng: place.longitude });
    setSelectedWaypoints([]);
    setIsSearchOpen(false);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!destinationInputText.trim()) return;
    if (searchSuggestions.length > 0) {
      handleSelectSuggestion(searchSuggestions[0]);
    } else {
      const resolved = resolveCustomIndianDestination(destinationInputText, userLocation);
      handleSelectSuggestion(resolved);
    }
  };

  const handleClearDestinationInput = () => {
    setDestinationInputText('');
    setIsSearchOpen(true);
  };

  const googleMapsUrl = buildGoogleMapsRouteUrl(
    userLocation,
    { ...destinationCoords, address: destinationAddress },
    selectedWaypoints
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/95 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center font-bold text-sm border border-teal-500/40">
              <Navigation className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">En-Route EV Charge Points</h3>
                <span className="text-[9px] bg-teal-500/15 text-teal-400 font-bold px-1.5 py-0.2 rounded border border-teal-500/30">
                  {journeyPlan.stops.length} Chargers Found
                </span>
              </div>
              <p className="text-[10px] text-slate-400">
                Verified highway pitstops between your location and destination all over India
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Origin & Destination inputs */}
        <div className="p-3.5 bg-slate-950 border-b border-slate-800 space-y-2 shrink-0 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-5 flex flex-col items-center">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-500 ring-2 ring-teal-500/30"></span>
              <span className="w-0.5 h-5 bg-slate-700"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-rose-500/30"></span>
            </div>

            <div className="flex-1 space-y-1.5">
              {/* Origin */}
              <div className="flex items-center justify-between bg-slate-900 border border-slate-800 px-2.5 py-1.5 rounded-lg text-slate-300">
                <div className="flex items-center gap-1.5 truncate">
                  <span className="text-[10px] text-slate-500">From:</span>
                  <span className="font-semibold text-white truncate">Current Location ({userCityName})</span>
                </div>
                <span className="text-[9px] bg-teal-500/15 text-teal-400 px-1.5 py-0.5 rounded font-mono shrink-0">
                  GPS Active
                </span>
              </div>

              {/* Destination & Autocomplete input */}
              <div className="relative">
                <form onSubmit={handleCustomSubmit} className="relative flex items-center bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-lg text-slate-300 focus-within:border-teal-500/50">
                  <span className="text-[10px] text-slate-500 mr-2 shrink-0">To:</span>
                  <input
                    type="text"
                    placeholder="Search any destination or area in India..."
                    value={destinationInputText}
                    onFocus={() => setIsSearchOpen(true)}
                    onChange={(e) => {
                      setDestinationInputText(e.target.value);
                      setIsSearchOpen(true);
                    }}
                    className="bg-transparent text-white text-xs font-semibold w-full focus:outline-none placeholder-slate-500 pr-14"
                  />
                  {destinationInputText && (
                    <button
                      type="button"
                      onClick={handleClearDestinationInput}
                      className="absolute right-14 text-slate-400 hover:text-white p-1"
                      title="Clear destination input"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <span className="text-[9px] text-teal-400 font-mono font-bold shrink-0 ml-2">
                    {journeyPlan.totalTripDistanceKm} km
                  </span>
                </form>

                {/* Suggestions Popover */}
                {isSearchOpen && searchSuggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-slate-900 border border-slate-750 rounded-xl shadow-2xl z-30 max-h-48 overflow-y-auto">
                    {searchSuggestions.map(s => (
                      <div
                        key={s.id}
                        onMouseDown={() => handleSelectSuggestion(s)}
                        className="px-3 py-2 hover:bg-slate-800 cursor-pointer border-b border-slate-800 last:border-0 flex items-center justify-between"
                      >
                        <div>
                          <p className="text-xs font-bold text-slate-100">{s.name}</p>
                          <p className="text-[10px] text-slate-400 truncate">{s.fullName}</p>
                        </div>
                        <span className="text-[10px] text-teal-400 font-mono shrink-0 ml-2">
                          {s.distanceKm} km
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Destination Selectors */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar pt-1">
            <span className="text-[10px] text-slate-500 shrink-0">Quick Highways:</span>
            {PRESET_DESTINATIONS.map(p => (
              <button
                key={p.name}
                onClick={() => {
                  setDestinationInputText(p.name);
                  setDestinationName(p.name);
                  setDestinationAddress(p.address);
                  setDestinationCoords({ lat: p.lat, lng: p.lng });
                  setSelectedWaypoints([]);
                  setIsSearchOpen(false);
                }}
                className={`px-2 py-0.5 rounded-lg text-[10px] border whitespace-nowrap transition ${
                  destinationName === p.name
                    ? 'bg-teal-600/20 border-teal-500 text-teal-300 font-bold'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {p.name.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>

        {/* Split View: Map + Scrollable Stops */}
        <div className="flex-1 flex flex-col sm:flex-row overflow-hidden min-h-[300px]">
          {/* Map Preview Area */}
          <div className="w-full sm:w-1/2 h-44 sm:h-full relative border-b sm:border-b-0 sm:border-r border-slate-800">
            <div ref={mapContainerRef} className="w-full h-full" />
            <div className="absolute top-2 left-2 bg-slate-950/80 backdrop-blur-md px-2 py-1 rounded-md text-[10px] text-slate-300 border border-slate-800 z-10">
              Est. Drive: ~{Math.floor(journeyPlan.estimatedTravelTimeMins / 60)}h {journeyPlan.estimatedTravelTimeMins % 60}m
            </div>
          </div>

          {/* En-Route Stops List & Route Options */}
          <div className="w-full sm:w-1/2 overflow-y-auto p-3 space-y-2.5">
            {/* 2-3 Route Alternatives Selector */}
            {journeyPlan.routes && journeyPlan.routes.length > 0 && (
              <div className="space-y-1.5 pb-2 border-b border-slate-800">
                <div className="text-[11px] font-bold text-slate-300 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Compass className="w-3.5 h-3.5 text-teal-400" />
                    <span>Choose Route ({journeyPlan.routes.length} Alternatives)</span>
                  </span>
                  <span className="text-[10px] text-teal-400">Click to select</span>
                </div>

                <div className="grid grid-cols-1 gap-1.5">
                  {journeyPlan.routes.map(r => {
                    const isSelected = r.id === selectedRouteId;
                    const hazardCount = (r.hazards || []).length;
                    const hasFlood = (r.hazards || []).some(h => h.type === 'FLOOD');
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => setSelectedRouteId(r.id)}
                        className={`w-full text-left p-2 rounded-xl border transition flex items-center justify-between gap-2 ${
                          isSelected
                            ? 'bg-teal-500/15 border-teal-400 text-white'
                            : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-extrabold text-teal-300">{r.badge}</span>
                            <span className="text-xs font-bold text-white truncate">{r.name}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                            <span>{r.viaRoad}</span>
                            <span>•</span>
                            <span className="text-teal-300 font-mono">{r.totalTripDistanceKm} km</span>
                            <span>•</span>
                            <span>{Math.floor(r.estimatedTravelTimeMins / 60)}h {r.estimatedTravelTimeMins % 60}m</span>
                          </div>
                        </div>

                        <div className="shrink-0 text-right">
                          {hazardCount > 0 ? (
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${hasFlood ? 'bg-sky-500/20 text-sky-300' : 'bg-amber-500/20 text-amber-300'}`}>
                              {hasFlood ? '🌊 Flood' : '⚠️ Hazard'}
                            </span>
                          ) : (
                            <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/15 px-1.5 py-0.5 rounded">
                              ✓ Clear
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Hazard alert banner if active route has hazard */}
            {journeyPlan.hazards && journeyPlan.hazards.length > 0 && (
              <div className="bg-amber-950/40 border border-amber-500/40 rounded-xl p-2 flex items-start gap-2 text-xs">
                <span className="text-base">{journeyPlan.hazards[0].type === 'FLOOD' ? '🌊' : '⚠️'}</span>
                <div>
                  <div className="font-bold text-amber-300">
                    {journeyPlan.hazards[0].title} (+{journeyPlan.hazards[0].delayMins}m delay)
                  </div>
                  <div className="text-[10px] text-slate-300">
                    {journeyPlan.hazards[0].description} • {journeyPlan.hazards[0].advisory}
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between text-xs text-slate-400 pb-1 border-b border-slate-800">
              <span className="font-semibold text-slate-200">
                Stops Along Journey ({journeyPlan.stops.length})
              </span>
              <span className="text-[10px] text-teal-400">
                {selectedWaypoints.length} waypoints selected
              </span>
            </div>

            {journeyPlan.stops.map((stop, idx) => {
              const { station, distanceFromStartKm, detourKm, isSuggestedStop } = stop;
              const isSelected = selectedWaypoints.some(w => w.id === station.id);
              const availCount = station.connectors.filter(c => c.status === 'AVAILABLE').length;
              const maxPower = Math.max(...station.connectors.map(c => c.powerKw));

              return (
                <div
                  key={station.id}
                  className={`p-2.5 rounded-xl border transition ${
                    isSelected
                      ? 'bg-teal-500/10 border-teal-500/80'
                      : isSuggestedStop
                      ? 'bg-amber-500/10 border-amber-500/40'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="flex items-center gap-1.5">
                      <span className="w-4 h-4 rounded-full bg-slate-800 text-teal-400 flex items-center justify-center font-mono text-[9px] font-bold">
                        #{idx + 1}
                      </span>
                      <span
                        className="text-[10px] font-bold px-1.5 py-0.2 rounded truncate max-w-[120px]"
                        style={{ backgroundColor: `${station.operatorLogoColor}20`, color: station.operatorLogoColor }}
                      >
                        {station.operator}
                      </span>
                    </div>

                    {isSuggestedStop && (
                      <span className="text-[9px] bg-amber-500 text-slate-950 font-bold px-1.5 py-0.2 rounded">
                        Fastest DC Stop
                      </span>
                    )}
                  </div>

                  <h4 className="text-xs font-bold text-white truncate mb-1">
                    {station.name}
                  </h4>

                  <p className="text-[10px] text-slate-400 line-clamp-1 mb-2">
                    {station.address}
                  </p>

                  <div className="flex items-center justify-between text-[10px] text-slate-300 pt-1.5 border-t border-slate-800/80 mb-2">
                    <span className="font-mono text-teal-400 font-bold">
                      At {Math.round(distanceFromStartKm)} km
                    </span>
                    <span className="text-slate-400">
                      +{detourKm} km detour
                    </span>
                    <span className={availCount > 0 ? 'text-teal-400 font-semibold' : 'text-rose-400 font-semibold'}>
                      {availCount} open • {maxPower}kW
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => toggleWaypoint(station)}
                      className={`flex-1 flex items-center justify-center gap-1 text-[10px] font-bold py-1 rounded-lg border transition ${
                        isSelected
                          ? 'bg-teal-500 text-slate-950 border-teal-400'
                          : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-750'
                      }`}
                    >
                      {isSelected ? (
                        <>
                          <Check className="w-3 h-3 stroke-[3]" /> Added to Route
                        </>
                      ) : (
                        <>
                          <Plus className="w-3 h-3" /> Add as Stopover
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onBookStation(station);
                      }}
                      className="px-2.5 py-1 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-[10px] font-bold transition shrink-0"
                    >
                      Book Slot
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer: In-App Navigation Primary + Google Maps Secondary */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2.5 shrink-0">
          <div className="text-[11px] text-slate-400">
            <span>{selectedWaypoints.length} stop{selectedWaypoints.length === 1 ? '' : 's'} selected for corridor route</span>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-slate-400 hover:text-slate-200 text-[11px] px-2.5 py-1.5 rounded-lg border border-slate-800 hover:border-slate-700 transition"
              title="Open driving route in external Google Maps"
            >
              <ExternalLink className="w-3 h-3 text-teal-400" />
              <span className="hidden xs:inline">Google Maps</span>
            </a>

            <button
              type="button"
              onClick={() => {
                if (onStartInAppNavigation) {
                  onStartInAppNavigation(journeyPlan, selectedWaypoints);
                }
                onClose();
              }}
              className="flex items-center gap-1.5 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-extrabold text-xs px-3.5 py-2 rounded-xl transition shadow-lg shadow-teal-500/20 active:scale-95 cursor-pointer"
            >
              <Navigation className="w-3.5 h-3.5 fill-current" />
              <span>Start In-App Navigation</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
