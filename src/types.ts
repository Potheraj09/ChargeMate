export type ConnectorType = 'CCS2' | 'Type2' | 'CHAdeMO';
export type ConnectorStatus = 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' | 'OUT_OF_SERVICE';

export interface Connector {
  id: string;
  type: ConnectorType;
  powerKw: number;
  status: ConnectorStatus;
  pricePerKwh: number;
}

export type OperatorName = 
  | 'ChargeZone'
  | 'Tata Power EZ Charge' 
  | 'Zeon Charging' 
  | 'Relux Electric'
  | 'Jio-bp pulse' 
  | 'Statiq' 
  | 'Ather Grid'
  | 'Shell Recharge';

export interface ChargingStation {
  id: string;
  name: string;
  operator: OperatorName;
  operatorLogoColor: string;
  latitude: number;
  longitude: number;
  distanceKm: number;
  connectors: Connector[];
  address: string;
  city: string;
  amenities: ('Cafe' | 'Restroom' | 'WiFi' | '24/7' | 'Security' | 'Shopping' | 'Dining')[];
  rating: number;
  reviewCount: number;
  openHours: string;
  contactPhone: string;
  lastUpdatedEpoch: number;
}

export interface EVProfile {
  id: string;
  brand: string;
  model: string;
  batteryKwh: number;
  maxDcKw: number;
  supportedConnectors: ConnectorType[];
  rangeKm: number;
}

export interface Booking {
  id: string;
  stationId: string;
  stationName: string;
  stationAddress: string;
  stationOperator: string;
  connectorId: string;
  connectorType: ConnectorType;
  powerKw: number;
  timeSlot: string;
  date: string;
  estCost: number;
  status: 'CONFIRMED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW_PENALTY';
  createdAt: string;
  expiryEpoch: number;
  pinCode: string;
  paymentId?: string;
  paymentMethod?: string;
  razorpayOrderId?: string;
  amountPaid?: number;
  refundStatus?: 'NONE' | 'FULL_REFUNDED' | 'PARTIAL_REFUNDED' | 'PENALTY_DEDUCTED';
  refundAmount?: number;
  penaltyAmount?: number;
  refundId?: string;
  refundReason?: string;
  refundTimestamp?: string;
  appliedOfferCode?: string;
  discountAmount?: number;
}

export interface LoyaltyOffer {
  id: string;
  code: string;
  title: string;
  description: string;
  minMonthlyUses: number;
  discountType: 'PERCENT' | 'FLAT' | 'WAIVE_FEE';
  discountValue: number;
  badge: string;
  partner?: string;
  terms: string;
}

export interface EnRouteStop {
  station: ChargingStation;
  distanceFromStartKm: number;
  detourKm: number;
  estimatedArrivalMins: number;
  isSuggestedStop?: boolean;
}

export interface FilterState {
  searchQuery: string;
  minPowerKw: number;
  connectorTypes: ConnectorType[];
  availableOnly: boolean;
  maxDistanceKm: number;
  operators: string[];
  maxPricePerKwh: number;
}

export interface RecommendationResult {
  station: ChargingStation;
  score: number;
  reason: string;
  recommendedConnector: Connector;
}

export type AppTheme = 'dark' | 'light';
