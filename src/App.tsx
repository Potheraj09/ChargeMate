/*
================================================================================
PORTING_NOTES.md — Production Architecture & Native Porting Guide
================================================================================
ChargeMate: Unified EV Charging Discovery, Booking, and Navigation Platform

1. Native Mobile Porting Path (Flutter or React Native):
   - Leaflet / Web Map -> Mapbox Mobile SDK or Google Maps Platform Mobile SDK for 60fps vector tiles, offline caching, and turn-by-turn navigation.
   - Geolocation -> CoreLocation (iOS) / FusedLocationProviderClient (Android) for background geofencing & battery-safe location updates.
   - UI Architecture -> The component hierarchy in this React codebase mirrors native screens:
       * MapView <-> MapController / Native MapboxView
       * StationDetailModal <-> BottomSheetDialogFragment / UIPresentationController
       * BookingModal <-> Native checkout sheet with Apple Pay / Google Pay / UPI Intent invocation
       * State Layer -> Clean service boundaries (geoService, mockAdapter, recommendationEngine) translate 1:1 to Dart BLoC/Riverpod or React Native Zustand/Redux stores.

2. Production Backend Services (NestJS / Go + PostgreSQL / PostGIS):
   - OCPI 2.2.1 Integration: Implement Open Charge Point Interface (OCPI) protocols (Locations, Sessions, Tariffs, Commands, Tokens) to stream real-time EVSE status via WebSocket / Webhooks from Tata Power, Jio-bp, Statiq, Zeon, ChargePoint, and Shell Recharge.
   - Geo-spatial Querying: PostGIS ST_DWithin and ST_Distance on geography points with spatial GiST indexing (GIST(location)) for sub-10ms queries across 50,000+ national charging stations.
   - Concurrency & Double-Booking Prevention: Distributed Redis locks (Redlock algorithm) on connector_id with TTL + database transactions (SELECT FOR UPDATE) to guarantee zero slot conflicts during peak highway travel.
   - Live Telemetry: MQTT / Kafka message brokers receiving OCPP 1.6J/2.0.1 status notifications from hardware charge points.
================================================================================
*/

import React, { useState, useEffect, useMemo } from 'react';
import {
  ChargingStation, Connector, Booking, FilterState,
  EVProfile, RecommendationResult, AppTheme
} from './types';
import {
  requestRealDeviceLocation, watchRealDeviceLocation,
  calculateHaversineDistanceKm, FALLBACK_LOCATIONS,
  isValidCoordinate
} from './services/geoService';
import {
  generateSeedStationsAroundLocation,
  simulateLiveTelemetryUpdates
} from './services/mockAdapter';
import { calculateBestMatch, EV_PRESETS } from './services/recommendationEngine';
import { calculateJourneyPlan, JourneyRoute } from './services/corridorRouteService';

// Components
import { Navbar } from './components/Navbar';
import { MapView } from './components/MapView';
import { StationList } from './components/StationList';
import { StationDetailModal } from './components/StationDetailModal';
import { BookingModal } from './components/BookingModal';
import { BookingsView } from './components/BookingsView';
import { VehicleProfileView } from './components/VehicleProfileView';
import { FilterDrawer } from './components/FilterDrawer';
import { LocationPermissionModal } from './components/LocationPermissionModal';
import { CancellationRefundModal } from './components/CancellationRefundModal';
import { LoyaltyOffersModal } from './components/LoyaltyOffersModal';
import { RouteNavigationModal } from './components/RouteNavigationModal';

import { getStoredMonthlyUsage, saveMonthlyUsage } from './services/loyaltyOffersService';

import { Map as MapIcon, List, Zap, Car, Bookmark } from 'lucide-react';

export default function App() {
  // Navigation tabs: 'map' | 'list' | 'bookings' | 'vehicle' | 'favorites'
  const [activeTab, setActiveTab] = useState<'map' | 'list' | 'bookings' | 'vehicle' | 'favorites'>('map');

  // Location State (Default safely to Chennai OMR EV Corridor to avoid unrendered or NaN states)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number }>(() => {
    const fallback = FALLBACK_LOCATIONS[0];
    return { lat: fallback.lat, lng: fallback.lng };
  });
  const [currentCityName, setCurrentCityName] = useState<string>('Live GPS');
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Stations & Real-time Telemetry State
  const [stations, setStations] = useState<ChargingStation[]>(() => {
    const fallback = FALLBACK_LOCATIONS[0];
    return generateSeedStationsAroundLocation(fallback.lat, fallback.lng);
  });
  const [lastTelemetryEpoch, setLastTelemetryEpoch] = useState<number>(Date.now());
  const [secondsSinceTelemetry, setSecondsSinceTelemetry] = useState<number>(0);

  // Active Vehicle Profile
  const [selectedProfile, setSelectedProfile] = useState<EVProfile>(EV_PRESETS[0]); // Default: Tata Nexon EV

  // User Bookings & Favorites (Persisted in state)
  const [bookings, setBookings] = useState<Booking[]>(() => {
    try {
      const saved = localStorage.getItem('chargemate_bookings');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('chargemate_favorites');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Filters State
  const [filters, setFilters] = useState<FilterState>({
    searchQuery: '',
    minPowerKw: 0,
    connectorTypes: [],
    availableOnly: false,
    maxDistanceKm: 60,
    operators: [],
    maxPricePerKwh: 35
  });

  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Monthly Usage & Loyalty Club State (Persisted)
  const [monthlyUses, setMonthlyUses] = useState<number>(() => getStoredMonthlyUsage());
  const [isOffersModalOpen, setIsOffersModalOpen] = useState(false);
  const [prefilledOfferCode, setPrefilledOfferCode] = useState<string>('');

  // Cancellation & Refund Flow State
  const [cancellingBooking, setCancellingBooking] = useState<Booking | null>(null);

  // En-Route Navigation & Live Map Journey State
  const [isRouteNavModalOpen, setIsRouteNavModalOpen] = useState(false);
  const [activeJourney, setActiveJourney] = useState<JourneyRoute | null>(null);
  const [isNavigating, setIsNavigating] = useState<boolean>(false);
  const [navDestination, setNavDestination] = useState<{
    lat: number;
    lng: number;
    name: string;
    address?: string;
  } | undefined>(undefined);

  // Theme Comfort Mode ('dark' | 'light' - soothing, non-glaring colors)
  const [theme, setTheme] = useState<AppTheme>(() => {
    try {
      const saved = localStorage.getItem('chargemate_theme');
      return (saved === 'light' || saved === 'dark') ? saved : 'dark';
    } catch {
      return 'dark';
    }
  });

  const handleToggleTheme = () => {
    const nextTheme: AppTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    try {
      localStorage.setItem('chargemate_theme', nextTheme);
    } catch {
      // ignore
    }
  };

  // Add dynamically discovered highway stations to global directory
  const handleEnrichStations = (newStations: ChargingStation[]) => {
    setStations(prev => {
      const existingIds = new Set(prev.map(s => s.id));
      const toAdd = newStations.filter(s => !existingIds.has(s.id));
      if (toAdd.length === 0) return prev;
      return [...prev, ...toAdd];
    });
  };

  // Modals State
  const [inspectingStation, setInspectingStation] = useState<ChargingStation | null>(null);
  const [bookingStation, setBookingStation] = useState<ChargingStation | null>(null);
  const [bookingConnector, setBookingConnector] = useState<Connector | undefined>(undefined);

  const handleUpdateMonthlyUses = (count: number) => {
    setMonthlyUses(count);
    saveMonthlyUsage(count);
  };

  // Save bookings to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('chargemate_bookings', JSON.stringify(bookings));
    } catch {
      // ignore
    }
  }, [bookings]);

  // Save favorites to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('chargemate_favorites', JSON.stringify(favorites));
    } catch {
      // ignore
    }
  }, [favorites]);

  // Request real GPS coordinates on startup
  const initLocation = async () => {
    try {
      const coords = await requestRealDeviceLocation();
      if (!isValidCoordinate(coords?.latitude, coords?.longitude)) {
        throw new Error('Invalid coordinates received from GPS device');
      }

      setUserLocation({ lat: coords.latitude, lng: coords.longitude });
      setCurrentCityName('Live GPS');
      setIsLocationModalOpen(false);
      setLocationError(null);

      // Generate seed stations around user's exact live GPS
      const generated = generateSeedStationsAroundLocation(coords.latitude, coords.longitude);
      setStations(generated);
      setLastTelemetryEpoch(Date.now());
    } catch (err: any) {
      console.warn('Geolocation prompt error or denied:', err);
      setLocationError(err?.message || 'Location permission was denied or timed out.');
      setIsLocationModalOpen(true);

      // Default to Chennai OMR EV Corridor as seamless Indian fallback
      const fallback = FALLBACK_LOCATIONS[0];
      setUserLocation({ lat: fallback.lat, lng: fallback.lng });
      setCurrentCityName(fallback.name);
      const generated = generateSeedStationsAroundLocation(fallback.lat, fallback.lng);
      setStations(generated);
      setLastTelemetryEpoch(Date.now());
    }
  };

  useEffect(() => {
    initLocation();

    // Continuously monitor device GPS updates for real-time tracking
    const watchId = watchRealDeviceLocation(
      (coords) => {
        if (isValidCoordinate(coords?.latitude, coords?.longitude)) {
          setUserLocation({ lat: coords.latitude, lng: coords.longitude });
          setCurrentCityName('Live GPS');
          setIsLocationModalOpen(false);
          setLocationError(null);
        }
      },
      (err) => {
        console.log('GPS watch note:', err.message);
      }
    );

    return () => {
      if (watchId !== null && typeof navigator !== 'undefined' && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, []);

  // Handle switching to a specific demo city or fallback
  const handleSelectCity = (lat: number, lng: number, name: string) => {
    const safeLat = isValidCoordinate(lat, lng) ? lat : FALLBACK_LOCATIONS[0].lat;
    const safeLng = isValidCoordinate(lat, lng) ? lng : FALLBACK_LOCATIONS[0].lng;
    setUserLocation({ lat: safeLat, lng: safeLng });
    setCurrentCityName(name);
    setIsLocationModalOpen(false);
    setLocationError(null);
    const generated = generateSeedStationsAroundLocation(safeLat, safeLng);
    setStations(generated);
    setLastTelemetryEpoch(Date.now());
  };

  // Recenter to live GPS
  const handleRecenter = async () => {
    try {
      const coords = await requestRealDeviceLocation();
      if (!isValidCoordinate(coords?.latitude, coords?.longitude)) {
        throw new Error('Invalid coordinates');
      }
      setUserLocation({ lat: coords.latitude, lng: coords.longitude });
      setCurrentCityName('Live GPS');
      setIsLocationModalOpen(false);
      setLocationError(null);
      // Re-seed around current live coordinates
      const generated = generateSeedStationsAroundLocation(coords.latitude, coords.longitude);
      setStations(generated);
      setLastTelemetryEpoch(Date.now());
    } catch {
      if (userLocation && isValidCoordinate(userLocation.lat, userLocation.lng)) {
        setUserLocation({ ...userLocation });
      } else {
        const fallback = FALLBACK_LOCATIONS[0];
        setUserLocation({ lat: fallback.lat, lng: fallback.lng });
      }
    }
  };

  // Live Telemetry simulation every 18-20 seconds
  const triggerTelemetryUpdate = () => {
    const activeLockSet = new Set<string>(
      bookings
        .filter(b => b.status === 'CONFIRMED')
        .map(b => b.connectorId)
    );

    setStations(prev => {
      const { updatedStations } = simulateLiveTelemetryUpdates(prev, activeLockSet);
      return updatedStations;
    });
    setLastTelemetryEpoch(Date.now());
    setSecondsSinceTelemetry(0);
  };

  useEffect(() => {
    const telemetryInterval = setInterval(() => {
      triggerTelemetryUpdate();
    }, 18000);

    const clockInterval = setInterval(() => {
      setSecondsSinceTelemetry(Math.floor((Date.now() - lastTelemetryEpoch) / 1000));
    }, 1000);

    return () => {
      clearInterval(telemetryInterval);
      clearInterval(clockInterval);
    };
  }, [lastTelemetryEpoch, bookings]);

  // Derived filtered stations
  const filteredStations = useMemo(() => {
    return stations.filter(station => {
      // 1. Search Query
      if (filters.searchQuery.trim()) {
        const query = filters.searchQuery.toLowerCase();
        const matchesName = station.name.toLowerCase().includes(query);
        const matchesAddress = station.address.toLowerCase().includes(query);
        const matchesOperator = station.operator.toLowerCase().includes(query);
        if (!matchesName && !matchesAddress && !matchesOperator) return false;
      }

      // 2. Minimum Power Filter
      if (filters.minPowerKw > 0) {
        const hasHighPower = station.connectors.some(c => c.powerKw >= filters.minPowerKw);
        if (!hasHighPower) return false;
      }

      // 3. Connector Types
      if (filters.connectorTypes.length > 0) {
        const hasConnector = station.connectors.some(c => filters.connectorTypes.includes(c.type));
        if (!hasConnector) return false;
      }

      // 4. Available Only
      if (filters.availableOnly) {
        const hasAvailable = station.connectors.some(c => c.status === 'AVAILABLE');
        if (!hasAvailable) return false;
      }

      // 5. Max Radius
      if (station.distanceKm > filters.maxDistanceKm) {
        return false;
      }

      // 6. Max Price
      const minStationPrice = Math.min(...station.connectors.map(c => c.pricePerKwh));
      if (minStationPrice > filters.maxPricePerKwh) {
        return false;
      }

      // 7. Operators
      if (filters.operators.length > 0) {
        if (!filters.operators.includes(station.operator)) return false;
      }

      return true;
    });
  }, [stations, filters]);

  // Favorites stations
  const favoriteStations = useMemo(() => {
    return stations.filter(s => favorites.includes(s.id));
  }, [stations, favorites]);

  // Compute Best Match Recommendation
  const bestMatch = useMemo<RecommendationResult | null>(() => {
    return calculateBestMatch(filteredStations, selectedProfile);
  }, [filteredStations, selectedProfile]);

  // Active filters count
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.searchQuery) count++;
    if (filters.minPowerKw > 0) count++;
    if (filters.connectorTypes.length > 0) count += filters.connectorTypes.length;
    if (filters.availableOnly) count++;
    if (filters.maxDistanceKm < 35) count++;
    if (filters.operators.length > 0) count += filters.operators.length;
    if (filters.maxPricePerKwh < 35) count++;
    return count;
  }, [filters]);

  // Handlers
  const handleToggleFavorite = (stationId: string) => {
    setFavorites(prev =>
      prev.includes(stationId)
        ? prev.filter(id => id !== stationId)
        : [...prev, stationId]
    );
  };

  const handleLaunchBooking = (station: ChargingStation, connector?: Connector) => {
    setInspectingStation(null);
    setBookingStation(station);
    setBookingConnector(connector);
  };

  const handleBookingConfirmed = (newBooking: Booking) => {
    setBookings(prev => [newBooking, ...prev]);

    // Increment monthly usage count for active driver
    handleUpdateMonthlyUses(monthlyUses + 1);

    // Update connector status in state to RESERVED
    setStations(prev =>
      prev.map(s => {
        if (s.id === newBooking.stationId) {
          return {
            ...s,
            connectors: s.connectors.map(c =>
              c.id === newBooking.connectorId ? { ...c, status: 'RESERVED' } : c
            )
          };
        }
        return s;
      })
    );
  };

  const handleInitiateCancelBooking = (booking: Booking) => {
    setCancellingBooking(booking);
  };

  const handleProcessCancellation = (updatedBooking: Booking) => {
    setBookings(prev =>
      prev.map(b => (b.id === updatedBooking.id ? updatedBooking : b))
    );

    // Release connector lock back to AVAILABLE in state
    setStations(prev =>
      prev.map(s => {
        if (s.id === updatedBooking.stationId) {
          return {
            ...s,
            connectors: s.connectors.map(c =>
              c.id === updatedBooking.connectorId ? { ...c, status: 'AVAILABLE' } : c
            )
          };
        }
        return s;
      })
    );

    setCancellingBooking(null);
  };

  // Simulates 45-minute hold lapse without check-in to demonstrate the ₹50 unused fee policy
  const handleSimulateNoShow = (bookingId: string) => {
    const booking = bookings.find(b => b.id === bookingId);
    if (!booking) return;

    // Set expiry to past so it's recognized as expired/no-show hold
    const expiredBooking: Booking = {
      ...booking,
      expiryEpoch: Date.now() - 60000
    };

    setBookings(prev =>
      prev.map(b => (b.id === bookingId ? expiredBooking : b))
    );

    // Open cancellation modal to review and process the ₹50 unused penalty & partial refund
    setCancellingBooking(expiredBooking);
  };

  const handleStartInAppNavigationToStation = (station: ChargingStation) => {
    setBookingStation(null);
    setInspectingStation(null);
    setIsRouteNavModalOpen(false);
    setActiveTab('map');
    if (userLocation && isValidCoordinate(userLocation.lat, userLocation.lng)) {
      const journey = calculateJourneyPlan(
        { lat: userLocation.lat, lng: userLocation.lng, name: currentCityName || 'Your Location' },
        { lat: station.latitude, lng: station.longitude, name: station.name },
        stations
      );
      setActiveJourney(journey);
      setIsNavigating(true);
    }
  };

  const handleOpenRouteNav = (destination?: { lat: number; lng: number; name: string; address?: string }) => {
    setNavDestination(destination);
    setIsRouteNavModalOpen(true);
  };

  const handleOpenRouteNavForStationAddress = (stationAddress: string, stationName: string) => {
    // Look up station by address or name
    const found = stations.find(s => s.address === stationAddress || s.name === stationName);
    if (found) {
      handleStartInAppNavigationToStation(found);
    } else {
      const destCoords = {
        lat: userLocation.lat + 0.08,
        lng: userLocation.lng + 0.08,
        name: stationName,
        address: stationAddress
      };
      const journey = calculateJourneyPlan(
        { lat: userLocation.lat, lng: userLocation.lng, name: currentCityName || 'Your Location' },
        destCoords,
        stations
      );
      setActiveTab('map');
      setActiveJourney(journey);
      setIsNavigating(true);
    }
  };

  const handleApplyOfferFromModal = (offerCode: string) => {
    setPrefilledOfferCode(offerCode);
    setIsOffersModalOpen(false);
  };

  return (
    <div className={`flex flex-col h-screen w-screen overflow-hidden select-none font-sans transition-colors duration-200 ${
      theme === 'dark' ? 'bg-[#0d131f] text-slate-100' : 'bg-slate-100 text-slate-800'
    }`}>
      {/* Top Aggregator Navbar */}
      <Navbar
        secondsAgo={secondsSinceTelemetry}
        isFilterOpen={isFilterOpen}
        setIsFilterOpen={setIsFilterOpen}
        activeFiltersCount={activeFiltersCount}
        selectedProfile={selectedProfile}
        onOpenProfile={() => setActiveTab('vehicle')}
        currentCity={currentCityName}
        onSelectCity={handleSelectCity}
        onRefreshTelemetry={triggerTelemetryUpdate}
        monthlyUses={monthlyUses}
        onOpenOffers={() => setIsOffersModalOpen(true)}
        onOpenRouteNav={() => handleOpenRouteNav()}
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />

      {/* Main View Area */}
      <main className="flex-1 relative overflow-hidden">
        {activeTab === 'map' && (
          <MapView
            userLocation={userLocation}
            stations={stations}
            filteredStations={filteredStations}
            bestMatch={bestMatch}
            filters={filters}
            setFilters={setFilters}
            selectedStation={inspectingStation}
            onSelectStation={(st) => setInspectingStation(st)}
            onRecenter={handleRecenter}
            vehicleModelName={selectedProfile.model.split(' ')[0]}
            theme={theme}
            onEnrichStations={handleEnrichStations}
            onLaunchBooking={handleLaunchBooking}
            initialJourney={activeJourney}
            initialNavigating={isNavigating}
            onStopNavigation={() => {
              setIsNavigating(false);
              setActiveJourney(null);
            }}
          />
        )}

        {activeTab === 'list' && (
          <StationList
            stations={filteredStations}
            favorites={favorites}
            onToggleFavorite={handleToggleFavorite}
            onSelectStation={(st) => setInspectingStation(st)}
            onQuickBook={(st) => handleLaunchBooking(st)}
          />
        )}

        {activeTab === 'bookings' && (
          <BookingsView
            bookings={bookings}
            onCancelBooking={handleInitiateCancelBooking}
            onSimulateNoShow={handleSimulateNoShow}
            monthlyUses={monthlyUses}
            onOpenOffersModal={() => setIsOffersModalOpen(true)}
            onOpenRouteNavForStation={handleOpenRouteNavForStationAddress}
          />
        )}

        {activeTab === 'vehicle' && (
          <VehicleProfileView
            selectedProfile={selectedProfile}
            onSelectProfile={(profile) => setSelectedProfile(profile)}
            stations={stations}
            onSelectStation={(st) => {
              setActiveTab('map');
              setInspectingStation(st);
            }}
            onOpenEnRouteNavModal={(destName) =>
              handleOpenRouteNav(
                destName
                  ? {
                      lat: userLocation.lat + 0.12,
                      lng: userLocation.lng + 0.08,
                      name: destName
                    }
                  : undefined
              )
            }
          />
        )}

        {activeTab === 'favorites' && (
          <StationList
            stations={favoriteStations}
            favorites={favorites}
            onToggleFavorite={handleToggleFavorite}
            onSelectStation={(st) => setInspectingStation(st)}
            onQuickBook={(st) => handleLaunchBooking(st)}
          />
        )}
      </main>

      {/* Mobile-First Bottom Navigation Bar */}
      <nav className={`h-14 sm:h-16 backdrop-blur-lg border-t flex items-center justify-around px-2 z-30 shrink-0 transition-colors ${
        theme === 'dark' ? 'bg-[#0f172a]/95 border-slate-800' : 'bg-white/95 border-slate-200 shadow-sm'
      }`}>
        <button
          onClick={() => setActiveTab('map')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition ${
            activeTab === 'map'
              ? 'text-teal-400 font-bold'
              : theme === 'dark' ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <MapIcon className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Map Hub</span>
        </button>

        <button
          onClick={() => setActiveTab('list')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition ${
            activeTab === 'list'
              ? 'text-teal-400 font-bold'
              : theme === 'dark' ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <List className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Directory</span>
        </button>

        <button
          onClick={() => setActiveTab('bookings')}
          className={`relative flex flex-col items-center justify-center flex-1 py-1 transition ${
            activeTab === 'bookings'
              ? 'text-teal-400 font-bold'
              : theme === 'dark' ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Zap className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Bookings</span>
          {bookings.filter(b => b.status === 'CONFIRMED').length > 0 && (
            <span className="absolute top-1 right-1/4 w-2 h-2 bg-teal-400 rounded-full animate-ping"></span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('vehicle')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition ${
            activeTab === 'vehicle'
              ? 'text-teal-400 font-bold'
              : theme === 'dark' ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Car className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Vehicle</span>
        </button>

        <button
          onClick={() => setActiveTab('favorites')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition ${
            activeTab === 'favorites'
              ? 'text-teal-400 font-bold'
              : theme === 'dark' ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Bookmark className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Saved</span>
        </button>
      </nav>

      {/* Station Detail Modal */}
      {inspectingStation && (
        <StationDetailModal
          station={inspectingStation}
          onClose={() => setInspectingStation(null)}
          onBookSlot={(station, connector) => handleLaunchBooking(station, connector)}
          selectedProfile={selectedProfile}
          onOpenEnRouteNav={(st) =>
            handleOpenRouteNav({
              lat: st.latitude,
              lng: st.longitude,
              name: st.name,
              address: st.address
            })
          }
        />
      )}

      {/* Sandboxed Booking Modal */}
      {bookingStation && (
        <BookingModal
          station={bookingStation}
          initialConnector={bookingConnector}
          existingBookings={bookings}
          monthlyUses={monthlyUses}
          prefilledOfferCode={prefilledOfferCode}
          onOpenOffersModal={() => setIsOffersModalOpen(true)}
          onStartInAppNavigation={handleStartInAppNavigationToStation}
          onClose={() => {
            setBookingStation(null);
            setBookingConnector(undefined);
            setPrefilledOfferCode('');
          }}
          onBookingConfirmed={handleBookingConfirmed}
        />
      )}

      {/* Cancellation & Refund Processing Modal */}
      {cancellingBooking && (
        <CancellationRefundModal
          booking={cancellingBooking}
          onClose={() => setCancellingBooking(null)}
          onConfirmCancellation={handleProcessCancellation}
        />
      )}

      {/* Loyalty Club 10+ Offers Modal */}
      {isOffersModalOpen && (
        <LoyaltyOffersModal
          isOpen={isOffersModalOpen}
          onClose={() => setIsOffersModalOpen(false)}
          monthlyUses={monthlyUses}
          onApplyOffer={handleApplyOfferFromModal}
          onUpdateUses={handleUpdateMonthlyUses}
        />
      )}

      {/* Corridor Route EV Charging Navigation Modal */}
      {isRouteNavModalOpen && (
        <RouteNavigationModal
          isOpen={isRouteNavModalOpen}
          onClose={() => setIsRouteNavModalOpen(false)}
          userLocation={userLocation}
          userCityName={currentCityName}
          stations={stations}
          initialDestination={navDestination}
          onStartInAppNavigation={(journey) => {
            setIsRouteNavModalOpen(false);
            setActiveTab('map');
            setActiveJourney(journey);
            setIsNavigating(true);
          }}
          onSelectStation={(st) => {
            setIsRouteNavModalOpen(false);
            setActiveTab('map');
            setInspectingStation(st);
          }}
          onBookStation={(st) => {
            setIsRouteNavModalOpen(false);
            handleLaunchBooking(st);
          }}
        />
      )}

      {/* Advanced Filter Drawer */}
      {isFilterOpen && (
        <FilterDrawer
          isOpen={isFilterOpen}
          onClose={() => setIsFilterOpen(false)}
          filters={filters}
          setFilters={setFilters}
          totalMatches={filteredStations.length}
        />
      )}

      {/* GPS Location Explanation Modal */}
      {isLocationModalOpen && (
        <LocationPermissionModal
          isOpen={isLocationModalOpen}
          onGrantPermission={initLocation}
          onSelectFallbackCity={handleSelectCity}
          permissionError={locationError}
        />
      )}
    </div>
  );
}
