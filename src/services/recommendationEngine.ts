import { ChargingStation, Connector, EVProfile, RecommendationResult } from '../types';

export const EV_PRESETS: EVProfile[] = [
  // --- Tata Motors ---
  {
    id: 'nexon-ev',
    brand: 'Tata Motors',
    model: 'Nexon EV Long Range',
    batteryKwh: 40.5,
    maxDcKw: 50,
    supportedConnectors: ['CCS2', 'Type2'],
    rangeKm: 325
  },
  {
    id: 'curvv-ev',
    brand: 'Tata Motors',
    model: 'Curvv.ev 55',
    batteryKwh: 55.0,
    maxDcKw: 70,
    supportedConnectors: ['CCS2', 'Type2'],
    rangeKm: 502
  },
  {
    id: 'punch-ev',
    brand: 'Tata Motors',
    model: 'Punch.ev Empowered+',
    batteryKwh: 35.0,
    maxDcKw: 50,
    supportedConnectors: ['CCS2', 'Type2'],
    rangeKm: 365
  },
  {
    id: 'tiago-ev',
    brand: 'Tata Motors',
    model: 'Tiago.ev XZ+',
    batteryKwh: 24.0,
    maxDcKw: 25,
    supportedConnectors: ['CCS2', 'Type2'],
    rangeKm: 250
  },

  // --- Mahindra ---
  {
    id: 'xuv400',
    brand: 'Mahindra',
    model: 'XUV400 EL Pro',
    batteryKwh: 39.4,
    maxDcKw: 50,
    supportedConnectors: ['CCS2', 'Type2'],
    rangeKm: 375
  },
  {
    id: 'be-6e',
    brand: 'Mahindra',
    model: 'BE 6e INGLO',
    batteryKwh: 59.0,
    maxDcKw: 175,
    supportedConnectors: ['CCS2', 'Type2'],
    rangeKm: 550
  },
  {
    id: 'xev-9e',
    brand: 'Mahindra',
    model: 'XEV 9e Flagship',
    batteryKwh: 79.0,
    maxDcKw: 175,
    supportedConnectors: ['CCS2', 'Type2'],
    rangeKm: 656
  },

  // --- MG Motor ---
  {
    id: 'mg-windsor',
    brand: 'MG Motor',
    model: 'Windsor EV Essence',
    batteryKwh: 38.0,
    maxDcKw: 45,
    supportedConnectors: ['CCS2', 'Type2'],
    rangeKm: 331
  },
  {
    id: 'mg-zs-ev',
    brand: 'MG Motor',
    model: 'ZS EV Exclusive Plus',
    batteryKwh: 50.3,
    maxDcKw: 75,
    supportedConnectors: ['CCS2', 'Type2'],
    rangeKm: 461
  },
  {
    id: 'mg-comet',
    brand: 'MG Motor',
    model: 'Comet EV Pace',
    batteryKwh: 17.3,
    maxDcKw: 3.3,
    supportedConnectors: ['Type2'],
    rangeKm: 230
  },

  // --- Hyundai ---
  {
    id: 'ioniq-5',
    brand: 'Hyundai',
    model: 'Ioniq 5 AWD (800V)',
    batteryKwh: 72.6,
    maxDcKw: 350,
    supportedConnectors: ['CCS2', 'Type2'],
    rangeKm: 631
  },
  {
    id: 'creta-ev',
    brand: 'Hyundai',
    model: 'Creta Electric',
    batteryKwh: 45.0,
    maxDcKw: 60,
    supportedConnectors: ['CCS2', 'Type2'],
    rangeKm: 410
  },
  {
    id: 'kona-ev',
    brand: 'Hyundai',
    model: 'Kona Electric Premium',
    batteryKwh: 39.2,
    maxDcKw: 50,
    supportedConnectors: ['CCS2', 'Type2'],
    rangeKm: 452
  },

  // --- Kia ---
  {
    id: 'kia-ev6',
    brand: 'Kia',
    model: 'EV6 GT-Line AWD',
    batteryKwh: 77.4,
    maxDcKw: 350,
    supportedConnectors: ['CCS2', 'Type2'],
    rangeKm: 708
  },
  {
    id: 'kia-ev9',
    brand: 'Kia',
    model: 'EV9 Luxury GT',
    batteryKwh: 99.8,
    maxDcKw: 350,
    supportedConnectors: ['CCS2', 'Type2'],
    rangeKm: 561
  },

  // --- BYD ---
  {
    id: 'byd-atto3',
    brand: 'BYD',
    model: 'Atto 3 Blade Dynamic',
    batteryKwh: 60.5,
    maxDcKw: 80,
    supportedConnectors: ['CCS2', 'Type2'],
    rangeKm: 521
  },
  {
    id: 'byd-seal',
    brand: 'BYD',
    model: 'Seal Performance AWD',
    batteryKwh: 82.5,
    maxDcKw: 150,
    supportedConnectors: ['CCS2', 'Type2'],
    rangeKm: 580
  },
  {
    id: 'byd-emax7',
    brand: 'BYD',
    model: 'eMAX 7 Superior MPV',
    batteryKwh: 71.8,
    maxDcKw: 115,
    supportedConnectors: ['CCS2', 'Type2'],
    rangeKm: 530
  },

  // --- Citroën ---
  {
    id: 'citroen-ec3',
    brand: 'Citroën',
    model: 'ë-C3 Shine Turbo',
    batteryKwh: 29.2,
    maxDcKw: 30,
    supportedConnectors: ['CCS2', 'Type2'],
    rangeKm: 320
  },

  // --- Luxury Tier (Volvo, BMW, Mercedes) ---
  {
    id: 'volvo-ex40',
    brand: 'Volvo',
    model: 'EX40 Recharge Twin',
    batteryKwh: 78.0,
    maxDcKw: 150,
    supportedConnectors: ['CCS2', 'Type2'],
    rangeKm: 534
  },
  {
    id: 'bmw-i4',
    brand: 'BMW',
    model: 'i4 eDrive40 Gran Coupé',
    batteryKwh: 83.9,
    maxDcKw: 205,
    supportedConnectors: ['CCS2', 'Type2'],
    rangeKm: 590
  },
  {
    id: 'mercedes-eqb',
    brand: 'Mercedes-Benz',
    model: 'EQB 350 4MATIC',
    batteryKwh: 70.5,
    maxDcKw: 100,
    supportedConnectors: ['CCS2', 'Type2'],
    rangeKm: 423
  },

  // --- Two-Wheelers ---
  {
    id: 'ather-450x',
    brand: 'Ather Energy',
    model: '450X Gen 3 Pro',
    batteryKwh: 3.7,
    maxDcKw: 3.3,
    supportedConnectors: ['Type2'],
    rangeKm: 110
  },
  {
    id: 'ola-s1-pro',
    brand: 'Ola Electric',
    model: 'S1 Pro Gen 2',
    batteryKwh: 4.0,
    maxDcKw: 3.3,
    supportedConnectors: ['Type2'],
    rangeKm: 195
  }
];

/**
 * Evaluates stations and selects the single "Best Match" for the active vehicle profile.
 */
export function calculateBestMatch(
  stations: ChargingStation[],
  profile: EVProfile
): RecommendationResult | null {
  if (!stations.length) return null;

  let bestStation: ChargingStation | null = null;
  let topScore = -Infinity;
  let bestConnector: Connector | null = null;
  let matchReason = '';

  for (const station of stations) {
    // 1. Filter compatible connectors
    const compatible = station.connectors.filter(c => profile.supportedConnectors.includes(c.type));
    if (!compatible.length) continue;

    // Separate available vs busy
    const availableConnectors = compatible.filter(c => c.status === 'AVAILABLE');
    const targetPool = availableConnectors.length > 0 ? availableConnectors : compatible;

    // Pick highest power connector in that pool
    const selectedConn = targetPool.reduce((best, cur) => cur.powerKw > best.powerKw ? cur : best, targetPool[0]);

    // 2. Compute Power Suitability
    // If car caps at 50kW, receiving 50-60kW is 100% efficient.
    // Paying extra for 150kW+ when capped at 50kW has diminishing returns.
    let powerSuitabilityScore = 0;
    if (selectedConn.powerKw >= profile.maxDcKw) {
      // Station delivers car's max ceiling or higher
      const overkill = selectedConn.powerKw - profile.maxDcKw;
      if (overkill > 100) {
        // High overkill (e.g. 240kW for 50kW car)
        powerSuitabilityScore = 20; // good, but slight tariff penalty
      } else {
        // Optimal match
        powerSuitabilityScore = 32;
      }
    } else {
      // Connector slower than car's DC rate
      const ratio = selectedConn.powerKw / profile.maxDcKw;
      powerSuitabilityScore = Math.max(5, Math.round(ratio * 25));
    }

    // 3. Proximity score (closer is much better)
    // 0km -> 40pts, 10km -> 20pts, 20km -> 0pts
    const distanceScore = Math.max(0, 40 - (station.distanceKm * 1.8));

    // 4. Live Availability score
    const availBonus = availableConnectors.length > 0 ? 45 + Math.min(10, availableConnectors.length * 4) : -25;

    // 5. Price factor
    const priceScore = Math.max(0, 30 - selectedConn.pricePerKwh);

    // 6. Rating bonus
    const ratingScore = station.rating * 3; // ~12-15 pts

    const totalScore = Math.round(availBonus + distanceScore + powerSuitabilityScore + priceScore + ratingScore);

    if (totalScore > topScore) {
      topScore = totalScore;
      bestStation = station;
      bestConnector = selectedConn;

      // Formulate clear, insightful explanation
      if (availableConnectors.length > 0 && selectedConn.powerKw >= profile.maxDcKw) {
        matchReason = `Peak ${profile.maxDcKw} kW charging speed match for your ${profile.model} with ${availableConnectors.length} open plug(s).`;
      } else if (availableConnectors.length > 0) {
        matchReason = `Fastest available socket (${selectedConn.powerKw} kW) just ${station.distanceKm} km away.`;
      } else {
        matchReason = `High-power hub with low queue times; slots opening shortly.`;
      }
    }
  }

  if (!bestStation || !bestConnector) return null;

  return {
    station: bestStation,
    score: Math.max(1, Math.min(100, topScore)),
    reason: matchReason,
    recommendedConnector: bestConnector
  };
}
