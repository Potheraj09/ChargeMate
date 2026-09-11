import { EVProfile, ConnectorType } from '../types';

export interface EVBrand {
  id: string;
  name: string;
  tagline?: string;
  logoBadge?: string;
  models: EVProfile[];
}

export interface EVCompany {
  id: string;
  name: string;
  country: string;
  founded: string;
  category: 'Passenger Cars' | 'Luxury & Performance' | 'Two-Wheelers' | 'Commercial & Fleet';
  icon: string;
  description: string;
  brands: EVBrand[];
}

/**
 * Comprehensive EV Vehicle Catalog launched by all automotive OEMs & brands in India.
 * Hierarchical architecture: Company/OEM -> Brands/Divisions -> Exact EV Models with specs.
 */
export const EV_COMPANIES_CATALOG: EVCompany[] = [
  // ================= 1. TATA MOTORS =================
  {
    id: 'tata-motors',
    name: 'Tata Motors',
    country: 'India',
    founded: '1945',
    category: 'Passenger Cars',
    icon: '🇮🇳',
    description: "India's #1 electric vehicle pioneer commanding 70%+ market share across personal and fleet segments.",
    brands: [
      {
        id: 'tata-ev-passenger',
        name: 'Tata.ev (TPEM Passenger)',
        tagline: 'Modern Gen-2 acti.ev and Ziptron electric passenger cars',
        models: [
          {
            id: 'tata-nexon-ev-45',
            brand: 'Tata Motors',
            model: 'Nexon.ev 45 (Long Range)',
            batteryKwh: 45.0,
            maxDcKw: 60,
            supportedConnectors: ['CCS2', 'Type2'],
            rangeKm: 489
          },
          {
            id: 'tata-nexon-ev-40',
            brand: 'Tata Motors',
            model: 'Nexon EV Prime / Max 40.5',
            batteryKwh: 40.5,
            maxDcKw: 50,
            supportedConnectors: ['CCS2', 'Type2'],
            rangeKm: 325
          },
          {
            id: 'tata-curvv-ev-55',
            brand: 'Tata Motors',
            model: 'Curvv.ev 55 (Empowered+)',
            batteryKwh: 55.0,
            maxDcKw: 70,
            supportedConnectors: ['CCS2', 'Type2'],
            rangeKm: 502
          },
          {
            id: 'tata-curvv-ev-45',
            brand: 'Tata Motors',
            model: 'Curvv.ev 45 (Creative)',
            batteryKwh: 45.0,
            maxDcKw: 60,
            supportedConnectors: ['CCS2', 'Type2'],
            rangeKm: 430
          },
          {
            id: 'tata-punch-ev-35',
            brand: 'Tata Motors',
            model: 'Punch.ev Empowered+ 35',
            batteryKwh: 35.0,
            maxDcKw: 50,
            supportedConnectors: ['CCS2', 'Type2'],
            rangeKm: 421
          },
          {
            id: 'tata-punch-ev-25',
            brand: 'Tata Motors',
            model: 'Punch.ev Adventure 25',
            batteryKwh: 25.0,
            maxDcKw: 30,
            supportedConnectors: ['CCS2', 'Type2'],
            rangeKm: 315
          },
          {
            id: 'tata-tiago-ev-24',
            brand: 'Tata Motors',
            model: 'Tiago.ev XZ+ Tech Lux 24',
            batteryKwh: 24.0,
            maxDcKw: 25,
            supportedConnectors: ['CCS2', 'Type2'],
            rangeKm: 315
          },
          {
            id: 'tata-tiago-ev-19',
            brand: 'Tata Motors',
            model: 'Tiago.ev XE 19.2',
            batteryKwh: 19.2,
            maxDcKw: 20,
            supportedConnectors: ['CCS2', 'Type2'],
            rangeKm: 250
          },
          {
            id: 'tata-tigor-ev-26',
            brand: 'Tata Motors',
            model: 'Tigor.ev XZ+ Lux',
            batteryKwh: 26.0,
            maxDcKw: 25,
            supportedConnectors: ['CCS2', 'Type2'],
            rangeKm: 315
          },
          {
            id: 'tata-harrier-ev',
            brand: 'Tata Motors',
            model: 'Harrier.ev AWD (acti.ev)',
            batteryKwh: 65.0,
            maxDcKw: 120,
            supportedConnectors: ['CCS2', 'Type2'],
            rangeKm: 520
          },
          {
            id: 'tata-safari-ev',
            brand: 'Tata Motors',
            model: 'Safari.ev Long Range (65 kWh)',
            batteryKwh: 65.0,
            maxDcKw: 120,
            supportedConnectors: ['CCS2', 'Type2'],
            rangeKm: 530
          },
          {
            id: 'tata-sierra-ev',
            brand: 'Tata Motors',
            model: 'Sierra.ev AWD Iconic Heritage',
            batteryKwh: 69.0,
            maxDcKw: 130,
            supportedConnectors: ['CCS2', 'Type2'],
            rangeKm: 550
          }
        ]
      },
      {
        id: 'tata-fleet',
        name: 'Tata Commercial & Fleet',
        tagline: 'High-uptime commercial EV solutions for logistics & cabs',
        models: [
          {
            id: 'tata-xpres-t',
            brand: 'Tata Motors',
            model: 'Xpres-T EV 26 (Commercial Taxi)',
            batteryKwh: 26.0,
            maxDcKw: 25,
            supportedConnectors: ['CCS2', 'Type2'],
            rangeKm: 315
          },
          {
            id: 'tata-ace-ev',
            brand: 'Tata Motors',
            model: 'Ace EV Mini Cargo (1 Ton)',
            batteryKwh: 21.3,
            maxDcKw: 22,
            supportedConnectors: ['CCS2', 'Type2'],
            rangeKm: 154
          }
        ]
      }
    ]
  },

  // ================= 2. MAHINDRA & MAHINDRA =================
  {
    id: 'mahindra',
    name: 'Mahindra & Mahindra',
    country: 'India',
    founded: '1945',
    category: 'Passenger Cars',
    icon: '⚡',
    description: "Home of Born Electric SUVs powered by cutting-edge INGLO skateboard platform and hyper-torque motors.",
    brands: [
      {
        id: 'mahindra-born-electric',
        name: 'Mahindra Born Electric (INGLO)',
        tagline: 'Next-gen dedicated electric architecture with 175kW ultra-fast charging',
        models: [
          {
            id: 'mahindra-be-6e-59',
            brand: 'Mahindra',
            model: 'BE 6e INGLO (59 kWh)',
            batteryKwh: 59.0,
            maxDcKw: 175,
            supportedConnectors: ['CCS2', 'Type2'],
            rangeKm: 550
          },
          {
            id: 'mahindra-be-6e-79',
            brand: 'Mahindra',
            model: 'BE 6e Pack Three (79 kWh)',
            batteryKwh: 79.0,
            maxDcKw: 175,
            supportedConnectors: ['CCS2', 'Type2'],
            rangeKm: 682
          },
          {
            id: 'mahindra-xev-9e-59',
            brand: 'Mahindra',
            model: 'XEV 9e Luxury Coupe (59 kWh)',
            batteryKwh: 59.0,
            maxDcKw: 175,
            supportedConnectors: ['CCS2', 'Type2'],
            rangeKm: 535
          },
          {
            id: 'mahindra-xev-9e-79',
            brand: 'Mahindra',
            model: 'XEV 9e Flagship (79 kWh)',
            batteryKwh: 79.0,
            maxDcKw: 175,
            supportedConnectors: ['CCS2', 'Type2'],
            rangeKm: 656
          },
          {
            id: 'mahindra-xev-9s-59',
            brand: 'Mahindra',
            model: 'XEV 9s Premium (59 kWh)',
            batteryKwh: 59.0,
            maxDcKw: 175,
            supportedConnectors: ['CCS2', 'Type2'],
            rangeKm: 545
          },
          {
            id: 'mahindra-xev-9s-79',
            brand: 'Mahindra',
            model: 'XEV 9s Flagship (79 kWh)',
            batteryKwh: 79.0,
            maxDcKw: 175,
            supportedConnectors: ['CCS2', 'Type2'],
            rangeKm: 665
          }
        ]
      },
      {
        id: 'mahindra-suv-electric',
        name: 'Mahindra Electric SUV Line',
        tagline: 'Versatile electric family SUVs and urban commuters',
        models: [
          {
            id: 'mahindra-xuv400-el-pro',
            brand: 'Mahindra',
            model: 'XUV400 EL Pro (39.4 kWh)',
            batteryKwh: 39.4,
            maxDcKw: 50,
            supportedConnectors: ['CCS2', 'Type2'],
            rangeKm: 456
          },
          {
            id: 'mahindra-xuv400-ec',
            brand: 'Mahindra',
            model: 'XUV400 EC (34.5 kWh)',
            batteryKwh: 34.5,
            maxDcKw: 50,
            supportedConnectors: ['CCS2', 'Type2'],
            rangeKm: 375
          },
          {
            id: 'mahindra-xuv-e8',
            brand: 'Mahindra',
            model: 'XUV.e8 Born Electric Flagship (80 kWh)',
            batteryKwh: 80.0,
            maxDcKw: 175,
            supportedConnectors: ['CCS2', 'Type2'],
            rangeKm: 500
          },
          {
            id: 'mahindra-thar-e',
            brand: 'Mahindra',
            model: 'THAR.e 4x4 Off-Road Electric (INGLO)',
            batteryKwh: 75.0,
            maxDcKw: 150,
            supportedConnectors: ['CCS2', 'Type2'],
            rangeKm: 480
          }
        ]
      }
    ]
  },

  // ================= 3. JSW MG MOTOR INDIA =================
  {
    id: 'mg-motor',
    name: 'JSW MG Motor India',
    country: 'United Kingdom / India',
    founded: '1924',
    category: 'Passenger Cars',
    icon: '🇬🇧',
    description: 'Pioneering smart connected electric cars with Battery-as-a-Service (BaaS) and lounge interiors.',
    brands: [
      {
        id: 'mg-passenger-ev',
        name: 'MG Electric Lineup',
        tagline: 'Connected electric mobility from city compacts to family crossovers',
        models: [
          {
            id: 'mg-windsor-essence',
            brand: 'MG Motor',
            model: 'Windsor EV Essence (Aero Lounge)',
            batteryKwh: 38.0,
            maxDcKw: 45,
            supportedConnectors: ['CCS2', 'Type2'],
            rangeKm: 331
          },
          {
            id: 'mg-zs-ev-exclusive',
            brand: 'MG Motor',
            model: 'ZS EV Exclusive Plus (50.3 kWh)',
            batteryKwh: 50.3,
            maxDcKw: 75,
            supportedConnectors: ['CCS2', 'Type2'],
            rangeKm: 461
          },
          {
            id: 'mg-comet-ev',
            brand: 'MG Motor',
            model: 'Comet EV Pace / Play (GSEV)',
            batteryKwh: 17.3,
            maxDcKw: 3.3,
            supportedConnectors: ['Type2'],
            rangeKm: 230
          },
          {
            id: 'mg-cyberster',
            brand: 'MG Motor',
            model: 'Cyberster Electric Roadster AWD',
            batteryKwh: 77.0,
            maxDcKw: 150,
            supportedConnectors: ['CCS2', 'Type2'],
            rangeKm: 510
          }
        ]
      }
    ]
  },

  // ================= 4. HYUNDAI MOTOR GROUP =================
  {
    id: 'hyundai-group',
    name: 'Hyundai Motor Group',
    country: 'South Korea',
    founded: '1967',
    category: 'Passenger Cars',
    icon: '🇰🇷',
    description: 'Global benchmark for ultra-fast 800V E-GMP multi-charging architectures and mass-market EVs.',
    brands: [
      {
        id: 'hyundai-india',
        name: 'Hyundai India',
        tagline: 'Progress for Humanity with World Car of the Year winners',
        models: [
          {
            id: 'hyundai-ioniq-5-awd',
            brand: 'Hyundai',
            model: 'Ioniq 5 AWD (800V Ultra-Fast)',
            batteryKwh: 72.6,
            maxDcKw: 350,
            supportedConnectors: ['CCS2', 'Type2'],
            rangeKm: 631
          },
          {
            id: 'hyundai-creta-ev',
            brand: 'Hyundai',
            model: 'Creta EV Long Range (45 kWh)',
            batteryKwh: 45.0,
            maxDcKw: 60,
            supportedConnectors: ['CCS2', 'Type2'],
            rangeKm: 452
          },
          {
            id: 'hyundai-kona-ev',
            brand: 'Hyundai',
            model: 'Kona Electric Premium',
            batteryKwh: 39.2,
            maxDcKw: 50,
            supportedConnectors: ['CCS2', 'Type2'],
            rangeKm: 452
          },
          {
            id: 'hyundai-ioniq-6',
            brand: 'Hyundai',
            model: 'Ioniq 6 Streamliner (77.4 kWh)',
            batteryKwh: 77.4,
            maxDcKw: 350,
            supportedConnectors: ['CCS2', 'Type2'],
            rangeKm: 614
          }
        ]
      },
      {
        id: 'kia-india',
        name: 'Kia India',
        tagline: 'Movement that inspires with performance electric crossovers',
        models: [
          {
            id: 'kia-ev6-gt-line',
            brand: 'Kia',
            model: 'EV6 GT-Line AWD (800V)',
            batteryKwh: 77.4,
            maxDcKw: 350,
            supportedConnectors: ['CCS2', 'Type2'],
            rangeKm: 708
          },
          {
            id: 'kia-ev9-luxury-gt',
            brand: 'Kia',
            model: 'EV9 Luxury 3-Row SUV (99.8 kWh)',
            batteryKwh: 99.8,
            maxDcKw: 350,
            supportedConnectors: ['CCS2', 'Type2'],
            rangeKm: 561
          },
          {
            id: 'kia-ev3',
            brand: 'Kia',
            model: 'EV3 Compact Crossover (81.4 kWh)',
            batteryKwh: 81.4,
            maxDcKw: 128,
            supportedConnectors: ['CCS2', 'Type2'],
            rangeKm: 605
          }
        ]
      }
    ]
  },

  // ================= 5. BYD (BUILD YOUR DREAMS) =================
  {
    id: 'byd-auto',
    name: 'BYD (Build Your Dreams)',
    country: 'China',
    founded: '1995',
    category: 'Passenger Cars',
    icon: '🔋',
    description: "World leader in EV battery manufacturing featuring ultra-safe cobalt-free Blade Battery technology.",
    brands: [
      {
        id: 'byd-passenger',
        name: 'BYD Passenger Vehicles',
        tagline: 'Blade Battery powered Ocean & Dynasty series',
        models: [
          {
            id: 'byd-seal-awd',
            brand: 'BYD',
            model: 'Seal Performance AWD (3.8s 0-100)',
            batteryKwh: 82.5,
            maxDcKw: 150,
            supportedConnectors: ['CCS2', 'Type2'],
            rangeKm: 580
          },
          {
            id: 'byd-seal-dynamic',
            brand: 'BYD',
            model: 'Seal Dynamic RWD (61.4 kWh)',
            batteryKwh: 61.4,
            maxDcKw: 110,
            supportedConnectors: ['CCS2', 'Type2'],
            rangeKm: 510
          },
          {
            id: 'byd-atto3-extended',
            brand: 'BYD',
            model: 'Atto 3 Extended Range (60.5 kWh)',
            batteryKwh: 60.5,
            maxDcKw: 80,
            supportedConnectors: ['CCS2', 'Type2'],
            rangeKm: 521
          },
          {
            id: 'byd-atto3-standard',
            brand: 'BYD',
            model: 'Atto 3 Dynamic (49.9 kWh)',
            batteryKwh: 49.9,
            maxDcKw: 70,
            supportedConnectors: ['CCS2', 'Type2'],
            rangeKm: 468
          },
          {
            id: 'byd-emax7-superior',
            brand: 'BYD',
            model: 'eMAX 7 Superior MPV (71.8 kWh)',
            batteryKwh: 71.8,
            maxDcKw: 115,
            supportedConnectors: ['CCS2', 'Type2'],
            rangeKm: 530
          },
          {
            id: 'byd-e6-mpv',
            brand: 'BYD',
            model: 'e6 MPV Premium (71.7 kWh)',
            batteryKwh: 71.7,
            maxDcKw: 60,
            supportedConnectors: ['CCS2', 'Type2'],
            rangeKm: 520
          }
        ]
      }
    ]
  },

  // ================= 6. BMW GROUP =================
  {
    id: 'bmw-group',
    name: 'BMW Group',
    country: 'Germany',
    founded: '1916',
    category: 'Luxury & Performance',
    icon: '🇩🇪',
    description: 'Ultimate electric driving machines with fifth-generation eDrive powertrains and luxury design.',
    brands: [
      {
        id: 'bmw-brand',
        name: 'BMW i Series',
        tagline: 'Born Electric luxury sedans, gran coupes, and SAVs',
        models: [
          {
            id: 'bmw-ix1-xdrive30',
            brand: 'BMW',
            model: 'iX1 xDrive30 M Sport',
            batteryKwh: 66.5,
            maxDcKw: 130,
            supportedConnectors: ['CCS2', 'Type2'],
            rangeKm: 440
          },
          {
            id: 'bmw-i4-edrive40',
            brand: 'BMW',
            model: 'i4 eDrive40 Gran Coupe',
            batteryKwh: 83.9,
            maxDcKw: 205,
            supportedConnectors: ['CCS2', 'Type2'],
            rangeKm: 590
          },
          {
            id: 'bmw-ix-xdrive50',
            brand: 'BMW',
            model: 'iX xDrive50 Sports Activity',
            batteryKwh: 111.5,
            maxDcKw: 195,
            supportedConnectors: ['CCS2', 'Type2'],
            rangeKm: 630
          },
          {
            id: 'bmw-i7-xdrive60',
            brand: 'BMW',
            model: 'i7 xDrive60 Luxury Flagship',
            batteryKwh: 101.7,
            maxDcKw: 195,
            supportedConnectors: ['CCS2', 'Type2'],
            rangeKm: 625
          },
          {
            id: 'bmw-i5-m60',
            brand: 'BMW',
            model: 'i5 M60 xDrive Performance',
            batteryKwh: 81.2,
            maxDcKw: 205,
            supportedConnectors: ['CCS2', 'Type2'],
            rangeKm: 516
          }
        ]
      },
      {
        id: 'mini-brand',
        name: 'MINI Electric',
        tagline: 'Electric go-kart feeling for the urban streets',
        models: [
          {
            id: 'mini-cooper-se',
            brand: 'BMW',
            model: 'MINI Cooper SE 3-Door',
            batteryKwh: 54.2,
            maxDcKw: 95,
            supportedConnectors: ['CCS2', 'Type2'],
            rangeKm: 402
          },
          {
            id: 'mini-countryman-e',
            brand: 'BMW',
            model: 'MINI Countryman Electric',
            batteryKwh: 66.5,
            maxDcKw: 130,
            supportedConnectors: ['CCS2', 'Type2'],
            rangeKm: 462
          }
        ]
      }
    ]
  },

  // ================= 7. MERCEDES-BENZ GROUP =================
  {
    id: 'mercedes-benz',
    name: 'Mercedes-Benz Group',
    country: 'Germany',
    founded: '1926',
    category: 'Luxury & Performance',
    icon: '⭐',
    description: 'Electric intelligence with MBUX Hyperscreen, progressive luxury, and long-range grand touring.',
    brands: [
      {
        id: 'mercedes-eq',
        name: 'Mercedes-EQ',
        tagline: 'Progressive luxury and executive electric sedans & SUVs',
        models: [
          {
            id: 'mercedes-eqa-250',
            brand: 'Mercedes-Benz',
            model: 'EQA 250+ Electric SUV',
            batteryKwh: 70.5,
            maxDcKw: 100,
            supportedConnectors: ['CCS2', 'Type2'],
            rangeKm: 560
          },
          {
            id: 'mercedes-eqb-350',
            brand: 'Mercedes-Benz',
            model: 'EQB 350 4MATIC (7-Seater)',
            batteryKwh: 66.5,
            maxDcKw: 100,
            supportedConnectors: ['CCS2', 'Type2'],
            rangeKm: 423
          },
          {
            id: 'mercedes-eqe-350-suv',
            brand: 'Mercedes-Benz',
            model: 'EQE 350+ SUV Luxury',
            batteryKwh: 90.6,
            maxDcKw: 170,
            supportedConnectors: ['CCS2', 'Type2'],
            rangeKm: 590
          },
          {
            id: 'mercedes-eqs-580',
            brand: 'Mercedes-Benz',
            model: 'EQS 580 4MATIC Sedan (Made in India)',
            batteryKwh: 107.8,
            maxDcKw: 200,
            supportedConnectors: ['CCS2', 'Type2'],
            rangeKm: 857
          },
          {
            id: 'mercedes-maybach-eqs-680',
            brand: 'Mercedes-Benz',
            model: 'Maybach EQS 680 Ultra-Luxury SUV',
            batteryKwh: 118.0,
            maxDcKw: 200,
            supportedConnectors: ['CCS2', 'Type2'],
            rangeKm: 600
          },
          {
            id: 'mercedes-g580-eq',
            brand: 'Mercedes-Benz',
            model: 'G 580 with EQ Technology (Electric G-Class 4-Motor)',
            batteryKwh: 116.0,
            maxDcKw: 200,
            supportedConnectors: ['CCS2', 'Type2'],
            rangeKm: 473
          },
          {
            id: 'mercedes-eqe-500-sedan',
            brand: 'Mercedes-Benz',
            model: 'EQE 500 4MATIC Luxury Sedan',
            batteryKwh: 90.6,
            maxDcKw: 170,
            supportedConnectors: ['CCS2', 'Type2'],
            rangeKm: 550
          }
        ]
      }
    ]
  },

  // ================= 8. VOLKSWAGEN / AUDI / PORSCHE GROUP =================
  {
    id: 'vw-group',
    name: 'Volkswagen Group (Audi & Porsche)',
    country: 'Germany',
    founded: '1937',
    category: 'Luxury & Performance',
    icon: '🏎️',
    description: 'Engineering masterpieces from Audi e-tron quattro to track-tuned Porsche Taycan sports cars.',
    brands: [
      {
        id: 'audi-brand',
        name: 'Audi e-tron',
        tagline: 'Vorsprung durch Technik with quattro all-wheel drive',
        models: [
          {
            id: 'audi-q8-55-etron',
            brand: 'Audi',
            model: 'Q8 55 e-tron quattro (114 kWh)',
            batteryKwh: 114.0,
            maxDcKw: 170,
            supportedConnectors: ['CCS2', 'Type2'],
            rangeKm: 600
          },
          {
            id: 'audi-etron-gt',
            brand: 'Audi',
            model: 'e-tron GT quattro (800V)',
            batteryKwh: 93.4,
            maxDcKw: 270,
            supportedConnectors: ['CCS2', 'Type2'],
            rangeKm: 500
          },
          {
            id: 'audi-rs-etron-gt',
            brand: 'Audi',
            model: 'RS e-tron GT Supercar (637 hp)',
            batteryKwh: 93.4,
            maxDcKw: 270,
            supportedConnectors: ['CCS2', 'Type2'],
            rangeKm: 488
          }
        ]
      },
      {
        id: 'porsche-brand',
        name: 'Porsche Taycan & Macan EV',
        tagline: 'Soul, electrified - true Porsche sports car DNA',
        models: [
          {
            id: 'porsche-taycan-4s',
            brand: 'Porsche',
            model: 'Taycan 4S Performance Plus (105 kWh)',
            batteryKwh: 105.0,
            maxDcKw: 320,
            supportedConnectors: ['CCS2', 'Type2'],
            rangeKm: 678
          },
          {
            id: 'porsche-macan-ev',
            brand: 'Porsche',
            model: 'Macan 4 Electric SUV (100 kWh)',
            batteryKwh: 100.0,
            maxDcKw: 270,
            supportedConnectors: ['CCS2', 'Type2'],
            rangeKm: 613
          }
        ]
      }
    ]
  },

  // ================= 9. VOLVO CARS =================
  {
    id: 'volvo-cars',
    name: 'Volvo Cars',
    country: 'Sweden',
    founded: '1927',
    category: 'Passenger Cars',
    icon: '🇸🇪',
    description: 'Scandinavian safety and sustainable luxury with twin-motor all-wheel drive performance.',
    brands: [
      {
        id: 'volvo-recharge',
        name: 'Volvo EX / Recharge',
        tagline: 'Pure electric luxury with Scandinavian craftsmanship',
        models: [
          {
            id: 'volvo-ex40-twin',
            brand: 'Volvo',
            model: 'EX40 Recharge Twin AWD (408 hp)',
            batteryKwh: 78.0,
            maxDcKw: 150,
            supportedConnectors: ['CCS2', 'Type2'],
            rangeKm: 534
          },
          {
            id: 'volvo-ec40-crossover',
            brand: 'Volvo',
            model: 'EC40 Recharge Coupe Crossover',
            batteryKwh: 78.0,
            maxDcKw: 150,
            supportedConnectors: ['CCS2', 'Type2'],
            rangeKm: 530
          },
          {
            id: 'volvo-ex30-twin',
            brand: 'Volvo',
            model: 'EX30 Twin Motor Performance (3.6s)',
            batteryKwh: 69.0,
            maxDcKw: 153,
            supportedConnectors: ['CCS2', 'Type2'],
            rangeKm: 480
          }
        ]
      }
    ]
  },

  // ================= 10. CITROËN / STELLANTIS =================
  {
    id: 'citroen-stellantis',
    name: 'Citroën (Stellantis)',
    country: 'France',
    founded: '1919',
    category: 'Passenger Cars',
    icon: '🇫🇷',
    description: 'French comfort and accessible electric mobility tailored for Indian roads.',
    brands: [
      {
        id: 'citroen-ec3-brand',
        name: 'Citroën ë-Series',
        tagline: 'Advanced Comfort suspension and practical urban range',
        models: [
          {
            id: 'citroen-ec3-shine',
            brand: 'Citroën',
            model: 'ë-C3 Shine (29.2 kWh)',
            batteryKwh: 29.2,
            maxDcKw: 30,
            supportedConnectors: ['CCS2', 'Type2'],
            rangeKm: 320
          }
        ]
      }
    ]
  },

  // ================= 11. ATHER ENERGY (TWO-WHEELER) =================
  {
    id: 'ather-energy',
    name: 'Ather Energy',
    country: 'India',
    founded: '2013',
    category: 'Two-Wheelers',
    icon: '⚡',
    description: "India's premier smart electric scooter brand with warp mode and proprietary fast-charging grid.",
    brands: [
      {
        id: 'ather-scooters',
        name: 'Ather 450 & Rizta Series',
        tagline: 'High-performance performance scooters and family EV 2-wheelers',
        models: [
          {
            id: 'ather-450x-gen3',
            brand: 'Ather Energy',
            model: 'Ather 450X Gen 3 (3.7 kWh)',
            batteryKwh: 3.7,
            maxDcKw: 3.3,
            supportedConnectors: ['Type2'],
            rangeKm: 150
          },
          {
            id: 'ather-rizta-z',
            brand: 'Ather Energy',
            model: 'Ather Rizta Z (Family Scooter 3.7 kWh)',
            batteryKwh: 3.7,
            maxDcKw: 3.3,
            supportedConnectors: ['Type2'],
            rangeKm: 160
          },
          {
            id: 'ather-450s',
            brand: 'Ather Energy',
            model: 'Ather 450S (2.9 kWh)',
            batteryKwh: 2.9,
            maxDcKw: 3.3,
            supportedConnectors: ['Type2'],
            rangeKm: 115
          }
        ]
      }
    ]
  },

  // ================= 12. OLA ELECTRIC (TWO-WHEELER) =================
  {
    id: 'ola-electric',
    name: 'Ola Electric',
    country: 'India',
    founded: '2017',
    category: 'Two-Wheelers',
    icon: '🛵',
    description: "India's highest-volume electric scooter manufacturer backed by the Futurefactory.",
    brands: [
      {
        id: 'ola-s1-series',
        name: 'Ola S1 Series',
        tagline: 'Hyperdrive scooters with MoveOS and class-leading battery capacity',
        models: [
          {
            id: 'ola-s1-pro-gen2',
            brand: 'Ola Electric',
            model: 'Ola S1 Pro Gen 2 (4.0 kWh)',
            batteryKwh: 4.0,
            maxDcKw: 3.3,
            supportedConnectors: ['Type2'],
            rangeKm: 195
          },
          {
            id: 'ola-s1-air',
            brand: 'Ola Electric',
            model: 'Ola S1 Air (3.0 kWh)',
            batteryKwh: 3.0,
            maxDcKw: 3.3,
            supportedConnectors: ['Type2'],
            rangeKm: 151
          },
          {
            id: 'ola-s1-x',
            brand: 'Ola Electric',
            model: 'Ola S1 X+ (3.0 kWh)',
            batteryKwh: 3.0,
            maxDcKw: 3.3,
            supportedConnectors: ['Type2'],
            rangeKm: 151
          },
          {
            id: 'ola-roadster-pro',
            brand: 'Ola Electric',
            model: 'Ola Roadster Pro Electric Motorcycle (16 kWh)',
            batteryKwh: 16.0,
            maxDcKw: 15,
            supportedConnectors: ['Type2', 'CCS2'],
            rangeKm: 579
          }
        ]
      }
    ]
  },

  // ================= 13. TVS MOTOR COMPANY =================
  {
    id: 'tvs-motor',
    name: 'TVS Motor Company',
    country: 'India',
    founded: '1978',
    category: 'Two-Wheelers',
    icon: '🏍️',
    description: 'Trusted Indian motorcycle brand delivering practical and premium connected electric rides.',
    brands: [
      {
        id: 'tvs-iqube-series',
        name: 'TVS iQube & X Series',
        tagline: 'Silent, reliable, and high-tech electric commuting',
        models: [
          {
            id: 'tvs-iqube-st-51',
            brand: 'TVS Motor',
            model: 'TVS iQube ST (5.1 kWh Long Range)',
            batteryKwh: 5.1,
            maxDcKw: 3.3,
            supportedConnectors: ['Type2'],
            rangeKm: 150
          },
          {
            id: 'tvs-iqube-s-34',
            brand: 'TVS Motor',
            model: 'TVS iQube S (3.4 kWh)',
            batteryKwh: 3.4,
            maxDcKw: 3.3,
            supportedConnectors: ['Type2'],
            rangeKm: 100
          },
          {
            id: 'tvs-x-performance',
            brand: 'TVS Motor',
            model: 'TVS X Performance Maxi-Scooter (4.4 kWh)',
            batteryKwh: 4.4,
            maxDcKw: 3.3,
            supportedConnectors: ['Type2'],
            rangeKm: 140
          }
        ]
      }
    ]
  },

  // ================= 14. BAJAJ AUTO =================
  {
    id: 'bajaj-auto',
    name: 'Bajaj Auto',
    country: 'India',
    founded: '1945',
    category: 'Two-Wheelers',
    icon: '🛵',
    description: 'Iconic Chetak reborn in full steel body and IP67 water-resistant electric powertrain.',
    brands: [
      {
        id: 'bajaj-chetak-brand',
        name: 'Bajaj Chetak Electric',
        tagline: 'Timeless all-metal elegance built for durability',
        models: [
          {
            id: 'bajaj-chetak-premium',
            brand: 'Bajaj Auto',
            model: 'Chetak Premium 3201 (3.2 kWh)',
            batteryKwh: 3.2,
            maxDcKw: 3.3,
            supportedConnectors: ['Type2'],
            rangeKm: 126
          },
          {
            id: 'bajaj-chetak-urbane',
            brand: 'Bajaj Auto',
            model: 'Chetak Urbane (2.9 kWh)',
            batteryKwh: 2.9,
            maxDcKw: 3.3,
            supportedConnectors: ['Type2'],
            rangeKm: 113
          }
        ]
      }
    ]
  },

  // ================= 15. ULTRAVIOLETTE AUTOMOTIVE =================
  {
    id: 'ultraviolette',
    name: 'Ultraviolette Automotive',
    country: 'India',
    founded: '2016',
    category: 'Two-Wheelers',
    icon: '⚡',
    description: "Aviation-inspired high-speed performance electric motorcycles designed & manufactured in Bengaluru.",
    brands: [
      {
        id: 'ultraviolette-f77-brand',
        name: 'Ultraviolette F77 Series',
        tagline: "India's fastest production electric motorcycle (155 km/h)",
        models: [
          {
            id: 'uv-f77-mach-2-recon',
            brand: 'Ultraviolette',
            model: 'F77 Mach 2 Recon (10.3 kWh Battery)',
            batteryKwh: 10.3,
            maxDcKw: 3.3,
            supportedConnectors: ['Type2'],
            rangeKm: 323
          },
          {
            id: 'uv-f77-original',
            brand: 'Ultraviolette',
            model: 'F77 Original (7.1 kWh)',
            batteryKwh: 7.1,
            maxDcKw: 3.3,
            supportedConnectors: ['Type2'],
            rangeKm: 211
          }
        ]
      }
    ]
  },

  // ================= 16. HERO MOTOCORP (VIDA) =================
  {
    id: 'hero-vida',
    name: 'Hero MotoCorp (Vida)',
    country: 'India',
    founded: '1984',
    category: 'Two-Wheelers',
    icon: '🛵',
    description: 'Removable dual-battery electric mobility supported by Bharat Petroleum charging network.',
    brands: [
      {
        id: 'hero-vida-brand',
        name: 'Vida by Hero MotoCorp',
        tagline: 'Swappable dual-battery electric scooters with custom riding modes',
        models: [
          {
            id: 'vida-v1-pro',
            brand: 'Hero MotoCorp',
            model: 'Vida V1 Pro (3.94 kWh Dual Battery)',
            batteryKwh: 3.94,
            maxDcKw: 3.3,
            supportedConnectors: ['Type2'],
            rangeKm: 165
          },
          {
            id: 'vida-v1-plus',
            brand: 'Hero MotoCorp',
            model: 'Vida V1 Plus (3.44 kWh Dual Battery)',
            batteryKwh: 3.44,
            maxDcKw: 3.3,
            supportedConnectors: ['Type2'],
            rangeKm: 143
          }
        ]
      }
    ]
  },

  // ================= 17. MARUTI SUZUKI INDIA =================
  {
    id: 'maruti-suzuki',
    name: 'Maruti Suzuki India',
    country: 'India / Japan',
    founded: '1981',
    category: 'Passenger Cars',
    icon: '🇯🇵',
    description: "India's largest automobile manufacturer entering electric mobility with e-Vitara and global HEARTECT-e architecture.",
    brands: [
      {
        id: 'maruti-nexa-ev',
        name: 'Maruti Suzuki NEXA EV',
        tagline: 'Premium electric SUVs with AllGrip-e electronic 4WD',
        models: [
          {
            id: 'maruti-e-vitara-61',
            brand: 'Maruti Suzuki',
            model: 'e-Vitara 61 AllGrip-e AWD (184 hp)',
            batteryKwh: 61.0,
            maxDcKw: 150,
            supportedConnectors: ['CCS2', 'Type2'],
            rangeKm: 500
          },
          {
            id: 'maruti-e-vitara-49',
            brand: 'Maruti Suzuki',
            model: 'e-Vitara 49 FWD (144 hp)',
            batteryKwh: 49.0,
            maxDcKw: 150,
            supportedConnectors: ['CCS2', 'Type2'],
            rangeKm: 400
          },
          {
            id: 'maruti-evx-concept',
            brand: 'Maruti Suzuki',
            model: 'eVX Flagship Electric Crossover',
            batteryKwh: 60.0,
            maxDcKw: 150,
            supportedConnectors: ['CCS2', 'Type2'],
            rangeKm: 550
          }
        ]
      }
    ]
  },

  // ================= 18. TOYOTA KIRLOSKAR MOTOR =================
  {
    id: 'toyota-india',
    name: 'Toyota Kirloskar Motor',
    country: 'Japan / India',
    founded: '1937',
    category: 'Passenger Cars',
    icon: '🇯🇵',
    description: 'Pioneers of electrification and bulletproof reliability with dedicated e-TNGA BEV platforms.',
    brands: [
      {
        id: 'toyota-electric-line',
        name: 'Toyota Electric Lineup',
        tagline: 'Multi-pathway carbon neutral electric SUVs',
        models: [
          {
            id: 'toyota-urban-cruiser-ev',
            brand: 'Toyota',
            model: 'Urban Cruiser EV (61 kWh All-Wheel Drive)',
            batteryKwh: 61.0,
            maxDcKw: 150,
            supportedConnectors: ['CCS2', 'Type2'],
            rangeKm: 500
          },
          {
            id: 'toyota-bz4x-awd',
            brand: 'Toyota',
            model: 'bZ4X Electric SUV AWD (71.4 kWh)',
            batteryKwh: 71.4,
            maxDcKw: 150,
            supportedConnectors: ['CCS2', 'Type2'],
            rangeKm: 516
          }
        ]
      }
    ]
  },

  // ================= 19. TESLA, INC. =================
  {
    id: 'tesla-motors',
    name: 'Tesla, Inc.',
    country: 'United States',
    founded: '2003',
    category: 'Passenger Cars',
    icon: '🇺🇸',
    description: 'Global benchmark in electric range, Autopilot driver-assist, and ultra-high efficiency powertrains.',
    brands: [
      {
        id: 'tesla-s3xy',
        name: 'Tesla S3XY Lineup',
        tagline: 'World-leading range and high-performance electric sedans & SUVs',
        models: [
          {
            id: 'tesla-model-y-long-range',
            brand: 'Tesla',
            model: 'Model Y Long Range AWD (78 kWh)',
            batteryKwh: 78.1,
            maxDcKw: 250,
            supportedConnectors: ['CCS2', 'Type2'],
            rangeKm: 533
          },
          {
            id: 'tesla-model-y-performance',
            brand: 'Tesla',
            model: 'Model Y Performance (0-100 in 3.5s)',
            batteryKwh: 78.1,
            maxDcKw: 250,
            supportedConnectors: ['CCS2', 'Type2'],
            rangeKm: 514
          },
          {
            id: 'tesla-model-3-long-range',
            brand: 'Tesla',
            model: 'Model 3 Long Range (Highland 629 km)',
            batteryKwh: 78.1,
            maxDcKw: 250,
            supportedConnectors: ['CCS2', 'Type2'],
            rangeKm: 629
          },
          {
            id: 'tesla-model-3-rwd',
            brand: 'Tesla',
            model: 'Model 3 Standard Range RWD',
            batteryKwh: 60.0,
            maxDcKw: 170,
            supportedConnectors: ['CCS2', 'Type2'],
            rangeKm: 513
          }
        ]
      }
    ]
  },

  // ================= 20. JAGUAR LAND ROVER (JLR) =================
  {
    id: 'jlr-group',
    name: 'Jaguar Land Rover (JLR)',
    country: 'United Kingdom',
    founded: '1922',
    category: 'Luxury & Performance',
    icon: '🇬🇧',
    description: 'British modern luxury with world-class off-road wading and sports-car electric dynamics.',
    brands: [
      {
        id: 'jaguar-brand',
        name: 'Jaguar Electric',
        tagline: 'Dramatic design and zero-emissions sports luxury',
        models: [
          {
            id: 'jaguar-ipace-hse',
            brand: 'Jaguar',
            model: 'I-PACE EV400 HSE Black (90 kWh AWD)',
            batteryKwh: 90.0,
            maxDcKw: 100,
            supportedConnectors: ['CCS2', 'Type2'],
            rangeKm: 470
          }
        ]
      },
      {
        id: 'range-rover-brand',
        name: 'Range Rover Electric',
        tagline: 'Peerless all-terrain capability and whisper-quiet 800V luxury',
        models: [
          {
            id: 'range-rover-electric-800v',
            brand: 'Land Rover',
            model: 'Range Rover Electric 800V Flagship (100 kWh)',
            batteryKwh: 100.0,
            maxDcKw: 350,
            supportedConnectors: ['CCS2', 'Type2'],
            rangeKm: 500
          }
        ]
      }
    ]
  },

  // ================= 21. LOTUS CARS =================
  {
    id: 'lotus-cars',
    name: 'Lotus Cars',
    country: 'United Kingdom',
    founded: '1948',
    category: 'Luxury & Performance',
    icon: '🇬🇧',
    description: "Track-born British hypercar pedigree with 905 hp dual-motor setups and 800V charging.",
    brands: [
      {
        id: 'lotus-hyper-ev',
        name: 'Lotus Hyper-EVs',
        tagline: 'Pure electric hyper-SUVs and aerodynamic grand tourers',
        models: [
          {
            id: 'lotus-eletre-r',
            brand: 'Lotus',
            model: 'Eletre R Hyper-SUV (905 hp • 112 kWh)',
            batteryKwh: 112.0,
            maxDcKw: 350,
            supportedConnectors: ['CCS2', 'Type2'],
            rangeKm: 600
          },
          {
            id: 'lotus-emeya-gt',
            brand: 'Lotus',
            model: 'Emeya Electric Hyper-GT (102 kWh)',
            batteryKwh: 102.0,
            maxDcKw: 350,
            supportedConnectors: ['CCS2', 'Type2'],
            rangeKm: 610
          }
        ]
      }
    ]
  },

  // ================= 22. ROLLS-ROYCE MOTOR CARS =================
  {
    id: 'rolls-royce',
    name: 'Rolls-Royce Motor Cars',
    country: 'United Kingdom',
    founded: '1906',
    category: 'Luxury & Performance',
    icon: '👑',
    description: 'The pinnacle of bespoke ultra-luxury motoring delivering the magic carpet ride in near-total silence.',
    brands: [
      {
        id: 'rolls-royce-spectre-brand',
        name: 'Rolls-Royce Spectre',
        tagline: 'Ultra-luxury electric super coupe handcrafted in Goodwood',
        models: [
          {
            id: 'rolls-royce-spectre',
            brand: 'Rolls-Royce',
            model: 'Spectre Ultra-Luxury Electric Super Coupe (102 kWh)',
            batteryKwh: 102.0,
            maxDcKw: 195,
            supportedConnectors: ['CCS2', 'Type2'],
            rangeKm: 530
          }
        ]
      }
    ]
  },

  // ================= 23. ŠKODA AUTO =================
  {
    id: 'skoda-auto',
    name: 'Škoda Auto India',
    country: 'Czech Republic',
    founded: '1895',
    category: 'Passenger Cars',
    icon: '🇨🇿',
    description: 'Simply Clever European engineering built on Volkswagen Group MEB modular electric drive matrix.',
    brands: [
      {
        id: 'skoda-electric',
        name: 'Škoda Electric (MEB)',
        tagline: 'Spacious electric crossovers with generous family comfort',
        models: [
          {
            id: 'skoda-enyaq-iv-80',
            brand: 'Škoda',
            model: 'Enyaq iV 80 (77 kWh MEB Platform)',
            batteryKwh: 77.0,
            maxDcKw: 135,
            supportedConnectors: ['CCS2', 'Type2'],
            rangeKm: 545
          },
          {
            id: 'skoda-elroq-85',
            brand: 'Škoda',
            model: 'Elroq 85 Compact SUV (82 kWh)',
            batteryKwh: 82.0,
            maxDcKw: 175,
            supportedConnectors: ['CCS2', 'Type2'],
            rangeKm: 560
          }
        ]
      }
    ]
  },

  // ================= 24. VOLKSWAGEN INDIA =================
  {
    id: 'volkswagen-india',
    name: 'Volkswagen India',
    country: 'Germany',
    founded: '1937',
    category: 'Passenger Cars',
    icon: '🇩🇪',
    description: 'Precision German dynamics and class-leading highway stability with the ID. family.',
    brands: [
      {
        id: 'volkswagen-id-series',
        name: 'Volkswagen ID. Family',
        tagline: 'Intuitive zero-emission crossovers with IQ.Drive',
        models: [
          {
            id: 'vw-id4-pro-perf',
            brand: 'Volkswagen',
            model: 'ID.4 Pro Performance (77 kWh)',
            batteryKwh: 77.0,
            maxDcKw: 135,
            supportedConnectors: ['CCS2', 'Type2'],
            rangeKm: 520
          },
          {
            id: 'vw-id-buzz',
            brand: 'Volkswagen',
            model: 'ID. Buzz Electric MPV Microbus (77 kWh)',
            batteryKwh: 77.0,
            maxDcKw: 170,
            supportedConnectors: ['CCS2', 'Type2'],
            rangeKm: 423
          }
        ]
      }
    ]
  },

  // ================= 25. VINFAST AUTO =================
  {
    id: 'vinfast-auto',
    name: 'VinFast Auto India',
    country: 'Vietnam',
    founded: '2017',
    category: 'Passenger Cars',
    icon: '🇻🇳',
    description: 'Rapidly growing global EV powerhouse with an integrated manufacturing facility in Thoothukudi, Tamil Nadu.',
    brands: [
      {
        id: 'vinfast-smart-ev',
        name: 'VinFast Smart Electric SUVs',
        tagline: 'Pininfarina & Torino-designed electric crossovers',
        models: [
          {
            id: 'vinfast-vf6-plus',
            brand: 'VinFast',
            model: 'VF6 Plus Compact SUV (59.6 kWh)',
            batteryKwh: 59.6,
            maxDcKw: 120,
            supportedConnectors: ['CCS2', 'Type2'],
            rangeKm: 399
          },
          {
            id: 'vinfast-vf7-awd',
            brand: 'VinFast',
            model: 'VF7 Performance Dual-Motor AWD (75.3 kWh)',
            batteryKwh: 75.3,
            maxDcKw: 150,
            supportedConnectors: ['CCS2', 'Type2'],
            rangeKm: 431
          },
          {
            id: 'vinfast-vf-e34',
            brand: 'VinFast',
            model: 'VF e34 Urban Electric SUV (42 kWh)',
            batteryKwh: 42.0,
            maxDcKw: 75,
            supportedConnectors: ['CCS2', 'Type2'],
            rangeKm: 318
          }
        ]
      }
    ]
  },

  // ================= 26. RENAULT INDIA =================
  {
    id: 'renault-india',
    name: 'Renault India',
    country: 'France',
    founded: '1899',
    category: 'Passenger Cars',
    icon: '🇫🇷',
    description: 'European EV pioneers featuring the CMF-EV platform and ultra-compact city electric solutions.',
    brands: [
      {
        id: 'renault-etech-brand',
        name: 'Renault E-Tech 100% Electric',
        tagline: 'High-efficiency aerodynamics and openR link infotainment',
        models: [
          {
            id: 'renault-megane-etech',
            brand: 'Renault',
            model: 'Megane E-Tech Electric (60 kWh)',
            batteryKwh: 60.0,
            maxDcKw: 130,
            supportedConnectors: ['CCS2', 'Type2'],
            rangeKm: 450
          },
          {
            id: 'renault-kwid-ev',
            brand: 'Renault',
            model: 'Kwid E-Tech Electric Urban (26.8 kWh)',
            batteryKwh: 26.8,
            maxDcKw: 30,
            supportedConnectors: ['CCS2', 'Type2'],
            rangeKm: 230
          }
        ]
      }
    ]
  },

  // ================= 27. FISKER INC. =================
  {
    id: 'fisker-inc',
    name: 'Fisker Inc.',
    country: 'United States',
    founded: '2016',
    category: 'Passenger Cars',
    icon: '🇺🇸',
    description: 'Sustainable luxury electric vehicles featuring California Mode and SolarSky photovoltaic roofs.',
    brands: [
      {
        id: 'fisker-ocean-brand',
        name: 'Fisker Ocean Lineup',
        tagline: 'Cleanest electric SUV made from recycled ocean plastics',
        models: [
          {
            id: 'fisker-ocean-extreme',
            brand: 'Fisker',
            model: 'Ocean Extreme AWD (106 kWh SolarSky)',
            batteryKwh: 106.0,
            maxDcKw: 200,
            supportedConnectors: ['CCS2', 'Type2'],
            rangeKm: 563
          }
        ]
      }
    ]
  },

  // ================= 28. RIVER (TWO-WHEELERS) =================
  {
    id: 'river-mobility',
    name: 'River Mobility',
    country: 'India',
    founded: '2020',
    category: 'Two-Wheelers',
    icon: '🛵',
    description: 'Bengaluru-based EV creator of the Indie - the rugged "SUV of Scooters" with massive 43L storage.',
    brands: [
      {
        id: 'river-indie-series',
        name: 'River Indie',
        tagline: 'The SUV of scooters with dual pannier mounts & crash bars',
        models: [
          {
            id: 'river-indie-4kwh',
            brand: 'River',
            model: 'River Indie (4.0 kWh Rugged Utility)',
            batteryKwh: 4.0,
            maxDcKw: 3.3,
            supportedConnectors: ['Type2'],
            rangeKm: 120
          }
        ]
      }
    ]
  },

  // ================= 29. SIMPLE ENERGY =================
  {
    id: 'simple-energy',
    name: 'Simple Energy',
    country: 'India',
    founded: '2019',
    category: 'Two-Wheelers',
    icon: '⚡',
    description: 'Long-range electric scooters engineered with dual portable and fixed battery setups in Tamil Nadu.',
    brands: [
      {
        id: 'simple-one-series',
        name: 'Simple One & Dot One',
        tagline: 'Longest range electric scooters in India (212 km IDC)',
        models: [
          {
            id: 'simple-one-5kwh',
            brand: 'Simple Energy',
            model: 'Simple One Dual Battery (5.0 kWh)',
            batteryKwh: 5.0,
            maxDcKw: 3.3,
            supportedConnectors: ['Type2'],
            rangeKm: 212
          },
          {
            id: 'simple-dot-one',
            brand: 'Simple Energy',
            model: 'Simple Dot One (3.7 kWh City Edition)',
            batteryKwh: 3.7,
            maxDcKw: 3.3,
            supportedConnectors: ['Type2'],
            rangeKm: 151
          }
        ]
      }
    ]
  },

  // ================= 30. REVOLT MOTORS =================
  {
    id: 'revolt-motors',
    name: 'Revolt Motors',
    country: 'India',
    founded: '2017',
    category: 'Two-Wheelers',
    icon: '🏍️',
    description: "India's first AI-enabled electric motorcycle maker with artificial exhaust notes and swappable packs.",
    brands: [
      {
        id: 'revolt-rv-series',
        name: 'Revolt RV Series',
        tagline: 'Connected electric commuter motorcycles with 4G connectivity',
        models: [
          {
            id: 'revolt-rv400-brz',
            brand: 'Revolt Motors',
            model: 'Revolt RV400 / BRZ (3.24 kWh AI Motorcycle)',
            batteryKwh: 3.24,
            maxDcKw: 3.3,
            supportedConnectors: ['Type2'],
            rangeKm: 150
          }
        ]
      }
    ]
  },

  // ================= 31. MATTER MOTORS =================
  {
    id: 'matter-motors',
    name: 'Matter Motors',
    country: 'India',
    founded: '2019',
    category: 'Two-Wheelers',
    icon: '⚡',
    description: 'Ahmedabad-based innovation lab that created the first geared electric motorcycle with active liquid cooling.',
    brands: [
      {
        id: 'matter-aera-brand',
        name: 'Matter Aera Series',
        tagline: '4-speed manual hyper-shift electric motorcycle',
        models: [
          {
            id: 'matter-aera-5000-plus',
            brand: 'Matter',
            model: 'Matter Aera 5000+ (5.0 kWh Liquid-Cooled 4-Speed)',
            batteryKwh: 5.0,
            maxDcKw: 3.3,
            supportedConnectors: ['Type2'],
            rangeKm: 125
          }
        ]
      }
    ]
  },

  // ================= 32. TORK MOTORS =================
  {
    id: 'tork-motors',
    name: 'Tork Motors (Bharat Forge)',
    country: 'India',
    founded: '2009',
    category: 'Two-Wheelers',
    icon: '🏍️',
    description: 'Pune-based Isle of Man TT electric racing veterans producing high-performance streetfighter EVs.',
    brands: [
      {
        id: 'tork-kratos-brand',
        name: 'Tork Kratos Series',
        tagline: 'Indigenous axial flux electric motor engineering',
        models: [
          {
            id: 'tork-kratos-r',
            brand: 'Tork Motors',
            model: 'Kratos R Urban Streetfighter (4.0 kWh Axial Flux)',
            batteryKwh: 4.0,
            maxDcKw: 3.3,
            supportedConnectors: ['Type2'],
            rangeKm: 180
          }
        ]
      }
    ]
  }
];

/**
 * Returns flat list of all EV models across all brands and companies.
 */
export function getAllCatalogEVModels(): EVProfile[] {
  const all: EVProfile[] = [];
  EV_COMPANIES_CATALOG.forEach(company => {
    company.brands.forEach(brand => {
      all.push(...brand.models);
    });
  });
  return all;
}

/**
 * Finds a specific EV model by ID across all companies.
 */
export function findEVModelById(modelId: string): EVProfile | undefined {
  for (const company of EV_COMPANIES_CATALOG) {
    for (const brand of company.brands) {
      const found = brand.models.find(m => m.id === modelId);
      if (found) return found;
    }
  }
  return undefined;
}

/**
 * Searches companies, brands, or EV models matching search query.
 */
export function searchEVHierarchy(query: string): {
  company: EVCompany;
  brand: EVBrand;
  model: EVProfile;
}[] {
  const clean = query.trim().toLowerCase();
  if (!clean) return [];

  const results: { company: EVCompany; brand: EVBrand; model: EVProfile }[] = [];

  EV_COMPANIES_CATALOG.forEach(company => {
    company.brands.forEach(brand => {
      brand.models.forEach(model => {
        if (
          model.model.toLowerCase().includes(clean) ||
          model.brand.toLowerCase().includes(clean) ||
          company.name.toLowerCase().includes(clean) ||
          brand.name.toLowerCase().includes(clean)
        ) {
          results.push({ company, brand, model });
        }
      });
    });
  });

  return results;
}
