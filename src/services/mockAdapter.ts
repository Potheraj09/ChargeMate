// ================= MOCK / SANDBOX =================
// The functions in this file simulate external Charge Point Operator (CPO) APIs
// normalized into the unified ChargeMate schema.
// In production, these will be replaced with real OCPI 2.2.1 (Open Charge Point Interface)
// endpoints or direct CPO Webhook feeds.

import { ChargingStation, Connector, ConnectorStatus, ConnectorType, OperatorName } from '../types';
import { calculateHaversineDistanceKm, isValidCoordinate } from './geoService';

export interface OperatorProfile {
  name: OperatorName;
  color: string;
  prefix: string;
  basePricePerKwh: number;
  tollFreeSupport: string;
}

export const OPERATOR_PROFILES: OperatorProfile[] = [
  {
    name: 'ChargeZone',
    color: '#eab308', // Amber / Electric Gold
    prefix: 'CHZN',
    basePricePerKwh: 21.0,
    tollFreeSupport: '1800 120 2225'
  },
  {
    name: 'Zeon Charging',
    color: '#8b5cf6', // Violet
    prefix: 'ZEON',
    basePricePerKwh: 21.5,
    tollFreeSupport: '080 4718 3600'
  },
  {
    name: 'Relux Electric',
    color: '#06b6d4', // Cyan
    prefix: 'RELX',
    basePricePerKwh: 18.5,
    tollFreeSupport: '1800 889 0081'
  },
  {
    name: 'Tata Power EZ Charge',
    color: '#0284c7', // Sky Blue
    prefix: 'EZTP',
    basePricePerKwh: 19.5,
    tollFreeSupport: '1800 209 8282'
  },
  {
    name: 'Jio-bp pulse',
    color: '#16a34a', // Emerald Green
    prefix: 'JBPL',
    basePricePerKwh: 20.8,
    tollFreeSupport: '1800 891 9023'
  },
  {
    name: 'Shell Recharge',
    color: '#ef4444', // Red / Yellow
    prefix: 'SHEL',
    basePricePerKwh: 22.5,
    tollFreeSupport: '1800 266 0115'
  },
  {
    name: 'Statiq',
    color: '#f97316', // Orange
    prefix: 'STIQ',
    basePricePerKwh: 18.0,
    tollFreeSupport: '1800 212 7828'
  },
  {
    name: 'Ather Grid',
    color: '#059669', // Forest Green
    prefix: 'ATHR',
    basePricePerKwh: 15.5,
    tollFreeSupport: '1800 102 8437'
  }
];

const HUB_NAMES = [
  'ChargeZone Superhub - OMR Sholinganallur Tech Corridor',
  'ChargeZone Dual Gun 120kW - Guindy Olympia Tech Park',
  'ChargeZone Highway Oasis - GST Road Chengalpattu Toll',
  'ChargeZone Fast EV Bay - Sriperumbudur Industrial Corridor',
  'Zeon Fast Charging - Outer Ring Road (ORR) Interchange Hub',
  'Relux Electric Mega Hub - Highway Expressway Plaza',
  'Relux Electric Bay - City Bypass Toll Gate Junction',
  'Tata Power EZ Charge - Central Commercial Core Boulevard',
  'Jio-bp pulse - Inter-City Transit Terminal Mega Deck',
  'ChargeZone Hyperhub - International Airport T2 Aerocity',
  'Zeon Charging - National Highway Expressway Midway Oasis',
  'ChargeZone 240kW Ultra CCS2 - South Radial Expressway',
  'Tata Power EZ Charge - Premier City Mall & Retail Hub',
  'Statiq Hyperhub - Southern Gateway Railway Plaza',
  'ChargeZone - East Coast Scenic Highway Beach Corridor',
  'Relux Electric - North Peripheral Bypass Junction',
  'Ather Grid Rapid Hub - Central Shopping & Business District',
  'Shell Recharge - Western Flyover Junction Deck',
  'ChargeZone - Automotive & Manufacturing Hub Deck',
  'Zeon Charging - Interstate Highway Industrial Gateway',
  'ChargeZone - Industrial Estate North Technology Deck',
  'Tata Power EZ Charge - IT Expressway Cyber City Corridor',
  'Relux Electric - Grand Expressway Milepost Oasis',
  'Jio-bp pulse - Radial Ring Road Express Charging Hub',
  'ChargeZone - Expressway Gateway Oasis & Food Court',
  'Statiq - West Roundtana Urban EV Charging Hub',
  'Shell Recharge - Kathipara Cloverleaf Urban Deck',
  'ChargeZone - Poonamallee Bypass Transit Corridor',
  'Zeon Charging - Western Bypass Highway Oasis',
  'Relux Electric - Metropolitan Outer Ring Road Deck',
  'Tata Power EZ Charge - North Harbor Port Expressway Hub',
  'ChargeZone 120kW Dual - Airport Cargo Aeropark Plaza',
  'Statiq Fast Hub - Metro Rail Terminus Park & Charge',
  'Jio-bp pulse - Southern Suburbs Ring Road Hub',
  'Zeon Charging - Electronics City Tech Boulevard',
  'ChargeZone 240kW Hyper - Satellite New Town Central',
  'Tata Power EZ Charge - Bio-Tech Park Rapid Station',
  'Relux Electric - Grand Southern Trunk Road Hub',
  'Shell Recharge - Peripheral Ring Road Service Corridor',
  'ChargeZone - Global Infocity Special Economic Zone',
  'Zeon Fast Charging - Highway Logistics Park Station',
  'Ather Grid - Central Avenue Commuter Station',
  'Statiq - East Coast Highway Drive-In EV Station',
  'Tata Power EZ Charge - North Suburbs Railway Terminal',
  'ChargeZone - Western Industrial Belt Rapid Deck',
  'Relux Electric - Outer Expressway Rest Stop 24/7',
  'Jio-bp pulse - Central Financial District EV Hub',
  'Zeon Charging - Suburban Expressway Junction'
];

const LOCALITY_NAMES = [
  'OMR IT Expressway Corridor',
  'GST Road Highway Corridor',
  'Guindy Tech Core Zone',
  'Velachery Bypass Avenue',
  'Central Commercial Boulevard',
  'Industrial & Tech Sector 4',
  'Inter-City Transit Terminal',
  'Expressway Highway Belt',
  'Outer Ring Road (ORR) Core',
  'International Airport Aerocity',
  'East Coast Highway KM 22',
  'Southern Railway Gateway',
  'North Peripheral Bypass',
  'Western Highway Arterial',
  'Suburban Satellite Hub'
];

/**
 * MOCK ADAPTER — replace with real OCPI/operator API call
 * Simulates calling multi-operator APIs (Tata Power, Jio-bp, Statiq, Zeon)
 * and normalizing responses into the unified ChargingStation interface.
 */
export function generateSeedStationsAroundLocation(userLat: number, userLng: number): ChargingStation[] {
  // Guard against non-numeric or NaN coordinates
  const safeUserLat = isValidCoordinate(userLat, userLng) ? userLat : 12.9716;
  const safeUserLng = isValidCoordinate(userLat, userLng) ? userLng : 80.2464;

  const stations: ChargingStation[] = [];

  HUB_NAMES.forEach((hubName, idx) => {
    const operator = OPERATOR_PROFILES[idx % OPERATOR_PROFILES.length];
    
    // Distribute stations across the entire city perimeter (from 1.5km to 50km radius)
    // Using 4 realistic concentric urban zones:
    // Zone 1: Inner City Core (1.5km - 9km)
    // Zone 2: Middle City & Tech Belts (9km - 22km)
    // Zone 3: Outer Ring Road & Suburbs (22km - 36km)
    // Zone 4: Peripheral Expressways & Satellite Towns (36km - 52km)
    const ringZone = idx % 4;
    let distKmRange: number;
    if (ringZone === 0) {
      distKmRange = 1.8 + (idx % 8) * 0.9; // 1.8 - 8.5 km
    } else if (ringZone === 1) {
      distKmRange = 9.0 + (idx % 12) * 1.1; // 9 - 22 km
    } else if (ringZone === 2) {
      distKmRange = 22.0 + (idx % 12) * 1.2; // 22 - 36 km
    } else {
      distKmRange = 36.0 + (idx % 12) * 1.35; // 36 - 52 km
    }

    // Convert approx km to latitude / longitude degrees (1 deg ~ 111 km)
    const distDeg = distKmRange / 111.0;
    const angle = (idx / HUB_NAMES.length) * 2 * Math.PI + (idx * 0.618);
    
    let lat = safeUserLat + distDeg * Math.cos(angle);
    let lng = safeUserLng + (distDeg / Math.cos((safeUserLat * Math.PI) / 180)) * Math.sin(angle);
    
    if (!isValidCoordinate(lat, lng)) {
      lat = safeUserLat + 0.015 * (idx + 1);
      lng = safeUserLng + 0.015 * (idx + 1);
    }

    const distanceKm = calculateHaversineDistanceKm(safeUserLat, safeUserLng, lat, lng);

    // Varied connector arrangements (2 to 6 connectors per hub)
    const connectorCount = 2 + (idx % 4);
    const connectors: Connector[] = [];

    // Realistic spectrum of speeds & plugs from 3.3kW (3kW) up to 240kW
    // Spanning AC 3.3kW (slow/2-wheeler), 7.4kW, 11kW, 22kW (AC Fast), 30kW, 60kW, 120kW, 180kW, and 240kW (Ultra Hypercharger)
    const connectorConfigs: { type: ConnectorType; powerKw: number }[] = [
      { type: 'Type2', powerKw: 3.3 },   // 3kW Slow AC for 2W & small EVs
      { type: 'Type2', powerKw: 7.4 },   // 7.4kW AC Single-phase
      { type: 'Type2', powerKw: 22 },    // 22kW AC Fast
      { type: 'CCS2', powerKw: 30 },     // 30kW DC City Fast
      { type: 'CCS2', powerKw: 60 },     // 60kW DC Dual Gun
      { type: 'CCS2', powerKw: 120 },    // 120kW DC Highway Rapid
      { type: 'CCS2', powerKw: 180 },    // 180kW DC Hypercharger
      { type: 'CCS2', powerKw: 240 },    // 240kW DC Ultra Hypercharger (ChargeZone / Flagship)
      { type: 'CHAdeMO', powerKw: 50 },  // 50kW CHAdeMO
      { type: 'Type2', powerKw: 11 }     // 11kW AC Destination
    ];

    // Priority for ChargeZone to have 120kW and 240kW hyperchargers
    const isChargeZone = operator.name === 'ChargeZone';
    const isZeon = operator.name === 'Zeon Charging';

    for (let c = 0; c < connectorCount; c++) {
      let config: { type: ConnectorType; powerKw: number };
      if (isChargeZone) {
        // ChargeZone flagship 60kW, 120kW, 240kW CCS2 + 22kW Type2
        const czOptions: { type: ConnectorType; powerKw: number }[] = [
          { type: 'CCS2', powerKw: 240 },
          { type: 'CCS2', powerKw: 120 },
          { type: 'CCS2', powerKw: 60 },
          { type: 'CCS2', powerKw: 240 },
          { type: 'Type2', powerKw: 22 },
          { type: 'Type2', powerKw: 7.4 }
        ];
        config = czOptions[(idx + c) % czOptions.length];
      } else if (operator.name === 'Ather Grid') {
        const atherOptions: { type: ConnectorType; powerKw: number }[] = [
          { type: 'Type2', powerKw: 3.3 },
          { type: 'Type2', powerKw: 3.3 },
          { type: 'Type2', powerKw: 7.4 },
          { type: 'Type2', powerKw: 22 }
        ];
        config = atherOptions[(idx + c) % atherOptions.length];
      } else {
        config = connectorConfigs[(idx * 2 + c) % connectorConfigs.length];
      }
      
      // Determine initial status with realistic probability: ~65% Available, 25% Occupied, 5% Reserved, 5% Maintenance
      const statusRoll = (idx * 3 + c * 7 + 11) % 20;
      let status: ConnectorStatus = 'AVAILABLE';
      if (statusRoll < 5) {
        status = 'OCCUPIED';
      } else if (statusRoll === 18) {
        status = 'RESERVED';
      } else if (statusRoll === 19) {
        status = 'OUT_OF_SERVICE';
      }

      // Slightly higher tariff for ultra-fast DC charging (>100kW), lower for 3kW-7kW AC
      let price = operator.basePricePerKwh;
      if (config.powerKw >= 240) {
        price += 4.5;
      } else if (config.powerKw >= 120) {
        price += 2.5;
      } else if (config.powerKw >= 60) {
        price += 1.2;
      } else if (config.powerKw <= 3.3) {
        price -= 3.0; // Budget 3kW slow charging
      } else if (config.powerKw <= 7.4) {
        price -= 2.0;
      }

      connectors.push({
        id: `${operator.prefix}-${1000 + idx}-P${c + 1}`,
        type: config.type,
        powerKw: config.powerKw,
        status,
        pricePerKwh: Math.round(price * 10) / 10
      });
    }

    const locality = LOCALITY_NAMES[idx % LOCALITY_NAMES.length];
    const streetNo = 100 + (idx * 17);

    // Realistic amenities
    const allAmenities: ChargingStation['amenities'] = ['Cafe', 'Restroom', 'WiFi', '24/7', 'Security', 'Shopping', 'Dining'];
    const hubAmenities = allAmenities.filter((_, aIdx) => (idx + aIdx) % 2 === 0 || aIdx === 1);

    stations.push({
      id: `station-${idx + 1}`,
      name: `${operator.name} - ${hubName}`,
      operator: operator.name,
      operatorLogoColor: operator.color,
      latitude: Number(lat.toFixed(6)),
      longitude: Number(lng.toFixed(6)),
      distanceKm,
      connectors,
      address: `${streetNo}, ${locality}`,
      city: 'Live GPS Region',
      amenities: hubAmenities,
      rating: Number((4.1 + (idx % 8) * 0.11).toFixed(1)),
      reviewCount: 38 + idx * 14,
      openHours: idx % 5 === 0 ? '06:00 AM - 11:30 PM' : '24 Hours Open (24/7)',
      contactPhone: operator.tollFreeSupport,
      lastUpdatedEpoch: Date.now() - (idx * 2500)
    });
  });

  // Sort by actual distance from GPS
  return stations.sort((a, b) => a.distanceKm - b.distanceKm);
}

/**
 * Simulates real-time IoT connector state updates from charging networks.
 * Mutates 2-3 stations' availability without disrupting active user reservations.
 */
export function simulateLiveTelemetryUpdates(
  currentStations: ChargingStation[],
  lockedConnectorIds: Set<string>
): { updatedStations: ChargingStation[]; changeCount: number } {
  if (!currentStations.length) return { updatedStations: currentStations, changeCount: 0 };

  let changeCount = 0;
  const updatedStations = currentStations.map((station, index) => {
    // Only mutate ~25% of stations per cycle
    if (index % 4 === 0) {
      let modified = false;
      const newConnectors = station.connectors.map(connector => {
        // Skip user-held or reserved connectors
        if (lockedConnectorIds.has(connector.id) || connector.status === 'OUT_OF_SERVICE') {
          return connector;
        }

        const rand = Math.random();
        // 35% chance to toggle state if conditions match
        if (connector.status === 'AVAILABLE' && rand > 0.65) {
          modified = true;
          return { ...connector, status: 'OCCUPIED' as ConnectorStatus };
        } else if (connector.status === 'OCCUPIED' && rand > 0.55) {
          modified = true;
          return { ...connector, status: 'AVAILABLE' as ConnectorStatus };
        }

        return connector;
      });

      if (modified) {
        changeCount++;
        return {
          ...station,
          connectors: newConnectors,
          lastUpdatedEpoch: Date.now()
        };
      }
    }
    return station;
  });

  return { updatedStations, changeCount };
}
