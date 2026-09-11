/**
 * RAZORPAY INTEGRATION SERVICE
 * Unified Payment Gateway for ChargeMate EV Slot Reservations & Charging Sessions.
 */

declare global {
  interface Window {
    Razorpay?: any;
  }
}

export interface RazorpayPaymentSuccessResponse {
  razorpay_payment_id: string;
  razorpay_order_id?: string;
  razorpay_signature?: string;
  method: 'upi' | 'card' | 'netbanking' | 'wallet';
  amountInr: number;
  timestamp: string;
}

export interface RazorpayCheckoutOptions {
  amountInr: number;
  stationName: string;
  operatorName: string;
  connectorId: string;
  powerKw: number;
  connectorType: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  onSuccess: (response: RazorpayPaymentSuccessResponse) => void;
  onDismiss?: () => void;
  onError?: (error: string) => void;
}

const DEFAULT_RAZORPAY_KEY =
  ((import.meta as any).env?.VITE_RAZORPAY_KEY_ID as string) || 'rzp_test_chargemate_live';

/**
 * Check if the Razorpay SDK is loaded in the window.
 */
export function isRazorpayLoaded(): boolean {
  return typeof window !== 'undefined' && typeof window.Razorpay === 'function';
}

/**
 * Generates a mock/test Razorpay payment reference ID matching standard Razorpay format:
 * e.g. pay_Nabc123XYZ456
 */
export function generateRazorpayPaymentId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let rand = '';
  for (let i = 0; i < 14; i++) {
    rand += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `pay_${rand}`;
}

/**
 * Generates a mock Razorpay Order ID (e.g. order_Oxyz789ABC)
 */
export function generateRazorpayOrderId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let rand = '';
  for (let i = 0; i < 14; i++) {
    rand += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `order_${rand}`;
}

/**
 * Triggers standard Razorpay Checkout Modal if available, or falls back to in-app simulation.
 */
export function openRazorpayStandardCheckout(options: RazorpayCheckoutOptions): boolean {
  if (!isRazorpayLoaded()) {
    return false;
  }

  try {
    const amountInPaise = Math.round(options.amountInr * 100);
    const orderId = generateRazorpayOrderId();

    const rzpOptions = {
      key: DEFAULT_RAZORPAY_KEY,
      amount: amountInPaise,
      currency: 'INR',
      name: 'ChargeMate EV Networks',
      description: `Hold Bay ${options.connectorId} (${options.powerKw}kW) - ${options.stationName}`,
      image: '/chargemate-icon.jpg',
      order_id: orderId,
      prefill: {
        name: options.customerName || 'EV Driver',
        email: options.customerEmail || 'driver@chargemate.in',
        contact: options.customerPhone || '9876543210'
      },
      notes: {
        station: options.stationName,
        operator: options.operatorName,
        connector: options.connectorId,
        powerKw: `${options.powerKw} kW`
      },
      theme: {
        color: '#059669' // Emerald
      },
      modal: {
        ondismiss: () => {
          if (options.onDismiss) options.onDismiss();
        }
      },
      handler: (response: any) => {
        options.onSuccess({
          razorpay_payment_id: response.razorpay_payment_id || generateRazorpayPaymentId(),
          razorpay_order_id: response.razorpay_order_id || orderId,
          razorpay_signature: response.razorpay_signature || 'sig_verified_rzp',
          method: 'upi',
          amountInr: options.amountInr,
          timestamp: new Date().toISOString()
        });
      }
    };

    const rzpInstance = new window.Razorpay(rzpOptions);
    rzpInstance.open();
    return true;
  } catch (err: any) {
    console.warn('Standard Razorpay popup trigger bypassed, using integrated in-app Razorpay UI', err);
    return false;
  }
}
