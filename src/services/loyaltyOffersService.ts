import { LoyaltyOffer, Booking } from '../types';

export const CLUB_10_MILESTONE = 10;

export const LOYALTY_OFFERS: LoyaltyOffer[] = [
  {
    id: 'offer-club10-150',
    code: 'CLUB10EV',
    title: '₹150 Supercharge Credit',
    description: 'Flat ₹150 off your EV charging session & deposit. Reserved exclusively for 10+ monthly drivers.',
    minMonthlyUses: 10,
    discountType: 'FLAT',
    discountValue: 100, // covers ₹100 deposit + tariff discount
    badge: '⭐ Club 10+ Elite',
    partner: 'ChargeMate Universal',
    terms: 'Valid on any network (Tata Power, Jio-bp, ChargeZone, Zeon) for members with ≥10 charges this month.'
  },
  {
    id: 'offer-zero-fee',
    code: 'ZEROFEES',
    title: '100% Hold Deposit Waiver',
    description: 'Zero convenience & slot lock deposit. Instant one-click bay reservation without advance hold fee.',
    minMonthlyUses: 10,
    discountType: 'WAIVE_FEE',
    discountValue: 100,
    badge: '⚡ Priority Access',
    partner: 'All CPO Hubs',
    terms: 'Instant bypass of ₹100 hold deposit. Unlimited use for active Club 10+ drivers.'
  },
  {
    id: 'offer-highway-20',
    code: 'EXPRESS20',
    title: '20% Highway Tariff CashBack',
    description: 'Save 20% on kWh charging rates across 60kW, 120kW & 240kW DC fast corridors.',
    minMonthlyUses: 10,
    discountType: 'PERCENT',
    discountValue: 20,
    badge: '🛣️ Express Corridor',
    partner: 'Tata Power & ChargeZone',
    terms: 'Applies automatically to final metered energy cost.'
  },
  {
    id: 'offer-noshow-protection',
    code: 'NOSHOWSHIELD',
    title: 'No-Show Penalty Waiver Pass',
    description: '1 Free no-show forgiveness per month: If you get delayed in traffic, the ₹50 unused bay fee is 100% waived.',
    minMonthlyUses: 10,
    discountType: 'WAIVE_FEE',
    discountValue: 50,
    badge: '🛡️ Trip Shield',
    partner: 'ChargeMate Protection',
    terms: 'Automatically protects your deposit if your arrival window expires.'
  },
  {
    id: 'offer-lounge-coffee',
    code: 'COFFEEPASS',
    title: 'Free Highway Lounge & Coffee',
    description: 'Free artisan coffee and premium AC lounge access while your EV fast charges at expressway plazas.',
    minMonthlyUses: 10,
    discountType: 'FLAT',
    discountValue: 0,
    badge: '☕ Driver Perk',
    partner: 'Cafe Coffee Day / Highway Plazas',
    terms: 'Show digital voucher at partner food court while vehicle is actively charging.'
  }
];

// Helper to retrieve monthly session usage
export function getStoredMonthlyUsage(): number {
  try {
    const saved = localStorage.getItem('chargemate_monthly_uses');
    if (saved !== null) {
      const parsed = parseInt(saved, 10);
      return isNaN(parsed) ? 10 : parsed;
    }
    // Default to 10 so user can immediately experience the requested 10+ offers
    return 10;
  } catch {
    return 10;
  }
}

export function saveMonthlyUsage(count: number): void {
  try {
    localStorage.setItem('chargemate_monthly_uses', count.toString());
  } catch {
    // ignore
  }
}

export function isClub10Eligible(usageCount: number): boolean {
  return usageCount >= CLUB_10_MILESTONE;
}

/**
 * Refund Policy Evaluation:
 * 1. Active / Confirmed Cancellation prior to expiry:
 *    - 100% Full Refund of the amount paid (e.g., ₹100).
 *    - Zero penalty deducted.
 *    - Instant reversal to original payment method (Razorpay UPI/Card/NetBanking).
 * 
 * 2. Unused / No-Show Expiration (Driver reserved socket but never checked in within 45 min):
 *    - Deduct ₹50 Idle Bay Block Fee to compensate the charging point operator for the blocked plug.
 *    - Refund remaining balance (₹50) to the driver's original payment method.
 */
export function calculateCancellationRefund(booking: Booking): {
  isEligibleFullRefund: boolean;
  refundAmount: number;
  penaltyAmount: number;
  policySummary: string;
  refundId: string;
} {
  const amountPaid = booking.amountPaid || 100;
  const isExpired = Date.now() > booking.expiryEpoch;

  if (isExpired) {
    // No-Show fee applies
    const penaltyAmount = 50;
    const refundAmount = Math.max(0, amountPaid - penaltyAmount);
    return {
      isEligibleFullRefund: false,
      refundAmount,
      penaltyAmount,
      policySummary: 'Unused Bay No-Show: ₹50 holding fee charged for blocking the socket; remaining ₹50 refunded.',
      refundId: `rfnd_noshow_${Math.random().toString(36).substring(2, 10)}`
    };
  } else {
    // Normal timely cancellation
    return {
      isEligibleFullRefund: true,
      refundAmount: amountPaid,
      penaltyAmount: 0,
      policySummary: '100% Instant Refund: Released within hold window. Full deposit returned to original payment source.',
      refundId: `rfnd_live_${Math.random().toString(36).substring(2, 10)}`
    };
  }
}

export function applyOfferCode(code: string, monthlyUses: number, baseDeposit: number = 100): {
  isValid: boolean;
  offer?: LoyaltyOffer;
  discount: number;
  finalAmount: number;
  error?: string;
} {
  const normalized = code.trim().toUpperCase();
  const offer = LOYALTY_OFFERS.find(o => o.code === normalized);

  if (!offer) {
    return {
      isValid: false,
      discount: 0,
      finalAmount: baseDeposit,
      error: 'Invalid voucher or promo code.'
    };
  }

  if (offer.minMonthlyUses > monthlyUses) {
    return {
      isValid: false,
      discount: 0,
      finalAmount: baseDeposit,
      error: `Unlocked at ${offer.minMonthlyUses} monthly uses. You currently have ${monthlyUses}/10 sessions this month.`
    };
  }

  let discount = 0;
  if (offer.discountType === 'WAIVE_FEE') {
    discount = baseDeposit;
  } else if (offer.discountType === 'FLAT') {
    discount = Math.min(baseDeposit, offer.discountValue);
  } else if (offer.discountType === 'PERCENT') {
    discount = Math.round((baseDeposit * offer.discountValue) / 100);
  }

  return {
    isValid: true,
    offer,
    discount,
    finalAmount: Math.max(0, baseDeposit - discount)
  };
}
