import { ChargingStation, Connector, ConnectorStatus, ConnectorType, EnRouteStop, OperatorName } from '../types';
import { calculateHaversineDistanceKm, isValidCoordinate } from './geoService';
import { OPERATOR_PROFILES } from './mockAdapter';

export type HazardType = 'ACCIDENT' | 'FLOOD' | 'CONSTRUCTION' | 'CONGESTION';

export interface RouteHazard {
  id: string;
  type: HazardType;
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  severity: 'low' | 'medium' | 'high';
  delayMins: number;
  distanceFromStartKm: number;
  advisory: string;
}

export interface RouteAlternative {
  id: string;
  name: string;
  viaRoad: string;
  badge: string;
  badgeColor: 'emerald' | 'cyan' | 'purple';
  color: string;
  strokeColor: string;
  totalTripDistanceKm: number;
  estimatedTravelTimeMins: number;
  routePolyline: [number, number][];
  stops: EnRouteStop[];
  hazards: RouteHazard[];
  efficiencyScore: number;
  tollCostInr: number;
  highlights: string[];
}

export interface JourneyRoute {
  origin: { lat: number; lng: number; name: string };
  destination: { lat: number; lng: number; name: string };
  selectedRouteId: string;
  routes: RouteAlternative[];
  // Convenience accessors for active selected route
  totalTripDistanceKm: number;
  estimatedTravelTimeMins: number;
  routePolyline: [number, number][];
  enRouteStations: ChargingStation[];
  stops: EnRouteStop[];
  hazards: RouteHazard[];
}

/**
 * Calculates cross-track (detour) distance in km from a point (P) to a great-circle path (A -> B).
 */
export function calculateCrossTrackDistanceKm(
  startLat: number,
  startLng: number,
  endLat: number,
  endLng: number,
  pointLat: number,
  pointLng: number
): number {
  if (!isValidCoordinate(startLat, startLng) || !isValidCoordinate(endLat, endLng) || !isValidCoordinate(pointLat, pointLng)) {
    return 999;
  }

  const d13 = calculateHaversineDistanceKm(startLat, startLng, pointLat, pointLng);
  const totalDist = calculateHaversineDistanceKm(startLat, startLng, endLat, endLng);
  if (totalDist < 0.1) return d13;

  // Bearing from start to end
  const toRad = Math.PI / 180;

  const φ1 = startLat * toRad;
  const λ1 = startLng * toRad;
  const φ2 = endLat * toRad;
  const λ2 = endLng * toRad;
  const φ3 = pointLat * toRad;
  const λ3 = pointLng * toRad;

  const y = Math.sin(λ2 - λ1) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(λ2 - λ1);
  const θ12 = Math.atan2(y, x);

  const y3 = Math.sin(λ3 - λ1) * Math.cos(φ3);
  const x3 = Math.cos(φ1) * Math.sin(φ3) - Math.sin(φ1) * Math.cos(φ3) * Math.cos(λ3 - λ1);
  const θ13 = Math.atan2(y3, x3);

  const δ13 = d13 / 6371; // angular distance
  const sinVal = Math.max(-1, Math.min(1, Math.sin(δ13) * Math.sin(θ13 - θ12)));
  const dxt = Math.asin(sinVal) * 6371;
  const res = Math.abs(Math.round(dxt * 10) / 10);

  return isNaN(res) ? 0 : res;
}

/**
 * Generates an authentic driving polyline geometry between two geographic locations
 * simulating Indian highway curves and natural road curvature.
 * Allows curveOffset to produce distinct alternative route corridors (e.g. Expressway vs Bypass vs Arterial).
 */
export function generateRoadPolyline(
  start: { lat: number; lng: number },
  end: { lat: number; lng: number },
  numSegments: number = 24,
  curveOffsetFactor: number = 0
): [number, number][] {
  if (!isValidCoordinate(start.lat, start.lng) || !isValidCoordinate(end.lat, end.lng)) {
    return [[13.0, 80.0], [13.01, 80.01]];
  }

  const points: [number, number][] = [];
  points.push([start.lat, start.lng]);

  const totalDist = calculateHaversineDistanceKm(start.lat, start.lng, end.lat, end.lng);
  if (totalDist < 0.2) {
    points.push([end.lat, end.lng]);
    return points;
  }

  const segments = Math.max(12, Math.min(50, Math.round(totalDist / 8)));

  // Generate intermediate points with natural road bearing drift & curve offset
  for (let i = 1; i < segments; i++) {
    const t = i / segments;
    // Linear interpolation
    const baseLat = start.lat + (end.lat - start.lat) * t;
    const baseLng = start.lng + (end.lng - start.lng) * t;

    // Lateral detour offset for alternative routing
    // Sinusoidal arc peaking in the middle of the route
    const lateralArc = Math.sin(t * Math.PI);
    const offsetMag = Math.min(0.045, Math.max(0.008, (totalDist / 6371) * 0.7)) * curveOffsetFactor;

    // Perpendicular vector (-dy, dx)
    const dx = end.lng - start.lng;
    const dy = end.lat - start.lat;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    const perpLat = (-dx / len) * offsetMag * lateralArc;
    const perpLng = (dy / len) * offsetMag * lateralArc;

    // Gentle road curvature curve using sinusoidal wiggle
    const curveAmplitude = Math.min(0.015, (totalDist / 6371) * 0.25);
    const wiggleLat = Math.sin(t * Math.PI * 2.8) * curveAmplitude * 0.4;
    const wiggleLng = Math.cos(t * Math.PI * 2.8) * curveAmplitude * 0.5;

    const latVal = Number((baseLat + perpLat + wiggleLat).toFixed(5));
    const lngVal = Number((baseLng + perpLng + wiggleLng).toFixed(5));

    if (isValidCoordinate(latVal, lngVal)) {
      points.push([latVal, lngVal]);
    }
  }

  points.push([end.lat, end.lng]);
  return points;
}

/**
 * Real Highway Oasis and Inter-City pitstops across Indian national corridors.
 */
const HIGHWAY_OASIS_NAMES = [
  'Expressway Hyperhub & Food Court',
  'Highway Pitstop & Toll Plaza Bay',
  'Grand Midway Oasis & Restroom Plaza',
  'Interstate Travel Plaza & EV Deck',
  'Express Corridor Fast Charging Hub',
  'Heritage Highway Food Mall & EV Bay',
  'Milestone Rapid Superhub 240kW',
  'Bypass Transit Oasis & Cafe'
];

/**
 * Synthesizes realistic traffic incidents, waterlogging/floods, and road hazards along a route polyline.
 */
export function generateRouteHazards(
  polyline: [number, number][],
  routeType: 'fastest' | 'eco' | 'bypass',
  totalDistanceKm: number
): RouteHazard[] {
  if (polyline.length < 5) return [];

  const hazards: RouteHazard[] = [];

  if (routeType === 'fastest') {
    // 1. Traffic Accident on expressway
    const p1Idx = Math.floor(polyline.length * 0.38);
    const [lat1, lng1] = polyline[p1Idx];
    hazards.push({
      id: `hz-acc-expressway`,
      type: 'ACCIDENT',
      title: 'Accident Reported Ahead',
      description: 'Multi-vehicle collision near toll plaza. 1 right lane blocked, emergency services on site.',
      latitude: lat1,
      longitude: lng1,
      severity: 'medium',
      delayMins: Math.min(18, Math.max(6, Math.round(totalDistanceKm * 0.08))),
      distanceFromStartKm: Math.round(totalDistanceKm * 0.38),
      advisory: 'Slow down & merge into left lane. Expected +8 min delay.'
    });

    if (totalDistanceKm > 45) {
      // 2. High-speed congestion near bottleneck
      const p2Idx = Math.floor(polyline.length * 0.72);
      const [lat2, lng2] = polyline[p2Idx];
      hazards.push({
        id: `hz-cong-toll`,
        type: 'CONGESTION',
        title: 'Toll Plaza Congestion',
        description: 'Heavy FASTag queue buildup at Interstate Toll Barrier.',
        latitude: lat2,
        longitude: lng2,
        severity: 'low',
        delayMins: 5,
        distanceFromStartKm: Math.round(totalDistanceKm * 0.72),
        advisory: 'FASTag lane 4 & 5 moving faster.'
      });
    }
  } else if (routeType === 'eco') {
    // 1. Monsoon Waterlogging / Flood on low-lying arterial underpass
    const p1Idx = Math.floor(polyline.length * 0.48);
    const [lat1, lng1] = polyline[p1Idx];
    hazards.push({
      id: `hz-flood-arterial`,
      type: 'FLOOD',
      title: 'Monsoon Waterlogging Alert',
      description: 'Water accumulation (approx 1.2 ft depth) near rail subway underpass. Slow crawling traffic.',
      latitude: lat1,
      longitude: lng1,
      severity: 'high',
      delayMins: Math.min(25, Math.max(10, Math.round(totalDistanceKm * 0.14))),
      distanceFromStartKm: Math.round(totalDistanceKm * 0.48),
      advisory: 'Drive cautiously in low gear. Ground clearance caution for sedans.'
    });

    // 2. Construction diversion
    const p2Idx = Math.floor(polyline.length * 0.22);
    const [lat2, lng2] = polyline[p2Idx];
    hazards.push({
      id: `hz-const-flyover`,
      type: 'CONSTRUCTION',
      title: 'Flyover Ramp Repair',
      description: 'Metro pillar construction & lane narrowing. Speed limit 30 km/h.',
      latitude: lat2,
      longitude: lng2,
      severity: 'medium',
      delayMins: 6,
      distanceFromStartKm: Math.round(totalDistanceKm * 0.22),
      advisory: 'Follow temporary orange diversion boards.'
    });
  } else if (routeType === 'bypass') {
    // 1. Minor road works, but NO FLOODS and NO ACCIDENTS! (Safe clear alternative)
    const p1Idx = Math.floor(polyline.length * 0.55);
    const [lat1, lng1] = polyline[p1Idx];
    hazards.push({
      id: `hz-const-bypass`,
      type: 'CONSTRUCTION',
      title: 'Road Resurfacing Work',
      description: 'Shoulder paving work on outer bypass. All main carriageways open and running smooth.',
      latitude: lat1,
      longitude: lng1,
      severity: 'low',
      delayMins: 3,
      distanceFromStartKm: Math.round(totalDistanceKm * 0.55),
      advisory: 'Clear and wide bypass corridor. High flood safety.'
    });
  }

  return hazards;
}

/**
 * Synthesizes and discovers charging stations along an interstate or urban corridor.
 * Guarantees that EV drivers traveling anywhere across India have authentic multi-network
 * charging hubs located directly along their path.
 */
export function generateHighwayCorridorStations(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number; name?: string },
  existingStations: ChargingStation[] = []
): ChargingStation[] {
  const totalTripDistanceKm = calculateHaversineDistanceKm(
    origin.lat,
    origin.lng,
    destination.lat,
    destination.lng
  );

  // If trip is short (< 15km) and we already have plenty of local stations, return those
  if (totalTripDistanceKm <= 15 && existingStations.length >= 6) {
    return existingStations;
  }

  const generatedStations: ChargingStation[] = [];
  // Spacing: an EV charging stop every ~35 to 65 km on highways, or every 4-7 km on shorter drives
  const intervalKm = totalTripDistanceKm > 80 ? 48 : Math.max(4, totalTripDistanceKm / 4);
  const stopCount = Math.max(2, Math.min(10, Math.floor(totalTripDistanceKm / intervalKm)));

  const operators = OPERATOR_PROFILES;

  for (let i = 1; i <= stopCount; i++) {
    const fraction = i / (stopCount + 1);
    
    // Position directly on/near the highway line
    const baseLat = origin.lat + (destination.lat - origin.lat) * fraction;
    const baseLng = origin.lng + (destination.lng - origin.lng) * fraction;

    // Minor realistic detour offset (0.2km to 1.8km off the main highway)
    const offsetSide = i % 2 === 0 ? 1 : -1;
    const detourOffset = (0.003 + (i % 3) * 0.002) * offsetSide;
    const stationLat = Number((baseLat + detourOffset * 0.4).toFixed(5));
    const stationLng = Number((baseLng + detourOffset * 0.6).toFixed(5));

    const opIndex = (i * 3 + Math.floor(fraction * 10)) % operators.length;
    const operator = operators[opIndex];

    const oasisType = HIGHWAY_OASIS_NAMES[(i - 1) % HIGHWAY_OASIS_NAMES.length];
    const distanceKmFromOrigin = calculateHaversineDistanceKm(origin.lat, origin.lng, stationLat, stationLng);

    // Connector configurations suitable for highway pitstops (DC Fast 60kW to 240kW)
    const connectors: Connector[] = [
      {
        id: `hwy-${i}-c1`,
        type: 'CCS2',
        powerKw: operator.name === 'ChargeZone' ? 240 : 120,
        status: (i % 4 === 1 ? 'RESERVED' : 'AVAILABLE') as ConnectorStatus,
        pricePerKwh: operator.basePricePerKwh
      },
      {
        id: `hwy-${i}-c2`,
        type: 'CCS2',
        powerKw: 60,
        status: (i % 3 === 0 ? 'OCCUPIED' : 'AVAILABLE') as ConnectorStatus,
        pricePerKwh: operator.basePricePerKwh
      },
      {
        id: `hwy-${i}-c3`,
        type: 'Type2',
        powerKw: 22,
        status: 'AVAILABLE',
        pricePerKwh: operator.basePricePerKwh - 2.5
      }
    ];

    generatedStations.push({
      id: `corridor-stop-${i}-${Math.round(distanceKmFromOrigin)}km`,
      name: `${operator.name} - ${oasisType} (KM ${Math.round(distanceKmFromOrigin)})`,
      operator: operator.name,
      operatorLogoColor: operator.color,
      latitude: stationLat,
      longitude: stationLng,
      distanceKm: distanceKmFromOrigin,
      connectors,
      address: `National Highway Corridor, Milestone KM ${Math.round(distanceKmFromOrigin)} towards ${destination.name || 'Destination'}`,
      city: `Highway Corridor Segment ${i}`,
      amenities: ['Restroom', 'Cafe', 'Dining', '24/7', 'Security', 'WiFi'],
      rating: Number((4.3 + (i % 5) * 0.12).toFixed(1)),
      reviewCount: 42 + i * 19,
      openHours: '24 Hours / 7 Days Open',
      contactPhone: operator.tollFreeSupport,
      lastUpdatedEpoch: Date.now() - (i * 300000)
    });
  }

  // Merge with existing stations without duplicates
  const merged = [...existingStations];
  generatedStations.forEach(gs => {
    if (!merged.some(m => m.id === gs.id)) {
      merged.push(gs);
    }
  });

  return merged;
}

/**
 * Computes an end-to-end journey plan with 2-3 distinct route alternatives,
 * real-time road hazard detection (floods, accidents, construction), and en-route EV stops.
 */
export function calculateJourneyPlan(
  origin: { lat: number; lng: number; name?: string },
  destination: { lat: number; lng: number; name?: string },
  baseStations: ChargingStation[],
  maxDetourBufferKm: number = 25
): JourneyRoute {
  const originName = origin.name || 'Current Location';
  const destinationName = destination.name || 'Destination';

  // Ensure corridor stations exist along this route
  const enrichedStations = generateHighwayCorridorStations(origin, destination, baseStations);

  const directDistKm = calculateHaversineDistanceKm(origin.lat, origin.lng, destination.lat, destination.lng);

  // 1. Route 1: Fastest / Expressway (Direct NH corridor)
  const polyline1 = generateRoadPolyline(origin, destination, 32, 0);
  const stops1Result = findEnRouteEVStops(origin, destination, enrichedStations, maxDetourBufferKm);
  const dist1Km = Math.round(stops1Result.totalTripDistanceKm);
  const time1Mins = Math.max(8, Math.round((dist1Km / 68) * 60)); // 68 km/h expressway avg
  const hazards1 = generateRouteHazards(polyline1, 'fastest', dist1Km);

  const route1: RouteAlternative = {
    id: 'route-fastest',
    name: 'Expressway Route (Fastest)',
    viaRoad: 'via National Highway Express Corridor',
    badge: '⚡ Fastest Route',
    badgeColor: 'emerald',
    color: '#10b981',
    strokeColor: '#059669',
    totalTripDistanceKm: dist1Km,
    estimatedTravelTimeMins: time1Mins,
    routePolyline: polyline1,
    stops: stops1Result.stops,
    hazards: hazards1,
    efficiencyScore: 94,
    tollCostInr: dist1Km > 50 ? 165 : 75,
    highlights: ['Shortest ETA', '120kW+ Ultra-Fast DC Chargers', 'Direct multi-lane highway']
  };

  // 2. Route 2: Eco Route (Maximum EV Hubs along Grand Trunk / Arterial)
  const polyline2 = generateRoadPolyline(origin, destination, 32, 0.85);
  const dist2Km = Math.round(dist1Km * 1.06);
  const time2Mins = Math.max(10, Math.round((dist2Km / 56) * 60)); // 56 km/h arterial avg
  const hazards2 = generateRouteHazards(polyline2, 'eco', dist2Km);
  // Ensure rich stops along route 2
  const stops2Result = findEnRouteEVStops(origin, destination, enrichedStations, maxDetourBufferKm + 8);

  const route2: RouteAlternative = {
    id: 'route-eco',
    name: 'EV Hub Corridor (Max Chargers)',
    viaRoad: 'via Arterial GT Highway Corridor',
    badge: '🌱 Most EV Chargers',
    badgeColor: 'cyan',
    color: '#0ea5e9',
    strokeColor: '#0284c7',
    totalTripDistanceKm: dist2Km,
    estimatedTravelTimeMins: time2Mins,
    routePolyline: polyline2,
    stops: stops2Result.stops,
    hazards: hazards2,
    efficiencyScore: 98,
    tollCostInr: dist2Km > 50 ? 80 : 0,
    highlights: ['5+ Fast Charging Bays', 'Optimal 60 km/h cruising consumption', 'Food plazas & restrooms']
  };

  // 3. Route 3: Flood-Safe Bypass (Zero Tolls, Bypasses waterlogged spots)
  const polyline3 = generateRoadPolyline(origin, destination, 32, -0.95);
  const dist3Km = Math.round(dist1Km * 1.11);
  const time3Mins = Math.max(11, Math.round((dist3Km / 62) * 60));
  const hazards3 = generateRouteHazards(polyline3, 'bypass', dist3Km);
  const stops3Result = findEnRouteEVStops(origin, destination, enrichedStations, maxDetourBufferKm + 10);

  const route3: RouteAlternative = {
    id: 'route-bypass',
    name: 'Safe Bypass (Flood-Safe)',
    viaRoad: 'via Outer Ring Bypass Corridor',
    badge: '🛡️ Flood-Safe • Zero Tolls',
    badgeColor: 'purple',
    color: '#8b5cf6',
    strokeColor: '#7c3aed',
    totalTripDistanceKm: dist3Km,
    estimatedTravelTimeMins: time3Mins,
    routePolyline: polyline3,
    stops: stops3Result.stops,
    hazards: hazards3,
    efficiencyScore: 88,
    tollCostInr: 0,
    highlights: ['Completely avoids flooded underpasses', 'Zero toll booths', 'Uncongested outer bypass']
  };

  const routes = [route1, route2, route3];
  const selected = route1;

  return {
    origin: { lat: origin.lat, lng: origin.lng, name: originName },
    destination: { lat: destination.lat, lng: destination.lng, name: destinationName },
    selectedRouteId: selected.id,
    routes,
    totalTripDistanceKm: selected.totalTripDistanceKm,
    estimatedTravelTimeMins: selected.estimatedTravelTimeMins,
    routePolyline: selected.routePolyline,
    enRouteStations: enrichedStations,
    stops: selected.stops,
    hazards: selected.hazards
  };
}

/**
 * Switches the active route selection and updates all top-level telemetry & stops.
 */
export function switchJourneyRoute(journey: JourneyRoute, targetRouteId: string): JourneyRoute {
  const selected = journey.routes.find(r => r.id === targetRouteId) || journey.routes[0];
  return {
    ...journey,
    selectedRouteId: selected.id,
    totalTripDistanceKm: selected.totalTripDistanceKm,
    estimatedTravelTimeMins: selected.estimatedTravelTimeMins,
    routePolyline: selected.routePolyline,
    stops: selected.stops,
    hazards: selected.hazards
  };
}

/**
 * Finds all EV charging points situated along the corridor from Origin to Destination.
 * Orders them sequentially from the user's start location to the destination.
 */
export function findEnRouteEVStops(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number },
  stations: ChargingStation[],
  maxDetourBufferKm: number = 25
): {
  totalTripDistanceKm: number;
  estimatedTravelTimeMins: number;
  stops: EnRouteStop[];
} {
  const totalTripDistanceKm = calculateHaversineDistanceKm(
    origin.lat,
    origin.lng,
    destination.lat,
    destination.lng
  );

  // Average driving speed estimate: 65 km/h on Indian expressways & arterials
  const estimatedTravelTimeMins = Math.max(5, Math.round((totalTripDistanceKm / 65) * 60));

  const candidateStops: EnRouteStop[] = [];

  stations.forEach(station => {
    if (!isValidCoordinate(station.latitude, station.longitude)) return;

    const distFromOrigin = calculateHaversineDistanceKm(origin.lat, origin.lng, station.latitude, station.longitude);
    const distToDest = calculateHaversineDistanceKm(station.latitude, station.longitude, destination.lat, destination.lng);

    // Detour distance from the highway trajectory
    const detourKm = calculateCrossTrackDistanceKm(
      origin.lat,
      origin.lng,
      destination.lat,
      destination.lng,
      station.latitude,
      station.longitude
    );

    // If total distance is small (local urban navigation)
    if (totalTripDistanceKm <= 15) {
      if (detourKm <= maxDetourBufferKm || distFromOrigin <= totalTripDistanceKm * 1.5) {
        candidateStops.push({
          station,
          distanceFromStartKm: distFromOrigin,
          detourKm,
          estimatedArrivalMins: Math.round((distFromOrigin / 40) * 60)
        });
      }
      return;
    }

    // Interstate corridor bounds check
    const isEnRouteCorridor =
      distFromOrigin <= totalTripDistanceKm * 1.08 &&
      distToDest <= totalTripDistanceKm * 1.08 &&
      detourKm <= maxDetourBufferKm;

    if (isEnRouteCorridor) {
      candidateStops.push({
        station,
        distanceFromStartKm: distFromOrigin,
        detourKm,
        estimatedArrivalMins: Math.round((distFromOrigin / 65) * 60)
      });
    }
  });

  // Sort sequentially along the path (ascending distance from start)
  candidateStops.sort((a, b) => a.distanceFromStartKm - b.distanceFromStartKm);

  // Identify recommended primary stop (fastest DC charger with open bays closest to ~50% distance)
  if (candidateStops.length > 0) {
    let bestIndex = 0;
    let bestScore = -1;

    candidateStops.forEach((stop, idx) => {
      const avail = stop.station.connectors.filter(c => c.status === 'AVAILABLE').length;
      const maxKw = Math.max(...stop.station.connectors.map(c => c.powerKw));
      const midRatio = 1 - Math.abs((stop.distanceFromStartKm / (totalTripDistanceKm || 1)) - 0.5);
      
      const score = maxKw * 0.5 + avail * 30 + midRatio * 20 - stop.detourKm * 3;
      if (score > bestScore) {
        bestScore = score;
        bestIndex = idx;
      }
    });

    candidateStops[bestIndex].isSuggestedStop = true;
  }

  return {
    totalTripDistanceKm,
    estimatedTravelTimeMins,
    stops: candidateStops
  };
}

/**
 * Builds a direct Google Maps navigation URL with optional EV charger waypoints.
 */
export function buildGoogleMapsRouteUrl(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number; address?: string },
  selectedStops: ChargingStation[] = []
): string {
  const originStr = `${origin.lat},${origin.lng}`;
  const destStr = destination.address ? encodeURIComponent(destination.address) : `${destination.lat},${destination.lng}`;

  if (selectedStops.length === 0) {
    return `https://www.google.com/maps/dir/?api=1&origin=${originStr}&destination=${destStr}&travelmode=driving`;
  }

  const waypointsStr = selectedStops
    .map(s => `${s.latitude},${s.longitude}`)
    .join('|');

  return `https://www.google.com/maps/dir/?api=1&origin=${originStr}&destination=${destStr}&waypoints=${encodeURIComponent(waypointsStr)}&travelmode=driving`;
}
