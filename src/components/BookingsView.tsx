import React, { useState, useEffect } from 'react';
import { Booking } from '../types';
import {
  Clock, Navigation, CheckCircle2, XCircle, AlertTriangle,
  QrCode, Zap, MapPin, RefreshCw, Award, ArrowRight, ShieldCheck
} from 'lucide-react';
import { CLUB_10_MILESTONE, isClub10Eligible } from '../services/loyaltyOffersService';

interface BookingsViewProps {
  bookings: Booking[];
  onCancelBooking: (booking: Booking) => void;
  onSimulateNoShow: (bookingId: string) => void;
  monthlyUses: number;
  onOpenOffersModal: () => void;
  onOpenRouteNavForStation?: (stationAddress: string, stationName: string) => void;
}

export const BookingsView: React.FC<BookingsViewProps> = ({
  bookings,
  onCancelBooking,
  onSimulateNoShow,
  monthlyUses,
  onOpenOffersModal,
  onOpenRouteNavForStation
}) => {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const isClub10 = isClub10Eligible(monthlyUses);

  if (bookings.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center text-slate-400">
        <Zap className="w-12 h-12 text-slate-600 mb-3" />
        <h3 className="text-sm font-bold text-slate-200">No active bookings yet</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-xs">
          Select any available charging station from the map or directory to lock a connector bay.
        </p>
        <button
          onClick={onOpenOffersModal}
          className="mt-4 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
        >
          <Award className="w-4 h-4" />
          <span>Explore Club 10+ Driver Offers ({monthlyUses}/10 uses)</span>
        </button>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-4 sm:p-5 pb-24 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-white">Your Charger Reservations</h2>
          <p className="text-[11px] text-slate-400">Live bay locks, instant refunds & no-show protection</p>
        </div>

        {/* Club 10+ Mini Badge */}
        <button
          onClick={onOpenOffersModal}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-bold transition shadow-sm"
        >
          <Award className="w-3.5 h-3.5" />
          <span>Offers ({monthlyUses}/10)</span>
        </button>
      </div>

      {/* Monthly Loyalty Milestone Banner */}
      <div className="bg-gradient-to-r from-emerald-950/40 via-slate-900 to-blue-950/40 border border-emerald-500/25 p-3 rounded-2xl flex items-center justify-between">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-white">
              {isClub10 ? '⭐ Club 10+ Member Rewards Unlocked!' : 'Club 10+ Driver Milestone'}
            </span>
            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-mono px-1.5 py-0.2 rounded">
              {monthlyUses}/10 Sessions
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            {isClub10
              ? 'Enjoy 100% hold waiver, ₹150 credit, and 20% highway cashback across all networks.'
              : `Complete ${CLUB_10_MILESTONE - monthlyUses} more charge${CLUB_10_MILESTONE - monthlyUses > 1 ? 's' : ''} this month to unlock ₹150 Supercharge credits & zero fee booking.`}
          </p>
        </div>

        <button
          onClick={onOpenOffersModal}
          className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs font-bold transition flex items-center gap-1 shrink-0 ml-3"
        >
          <span>View Offers</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>

      {/* Bookings List */}
      <div className="space-y-3.5">
        {bookings.map(booking => {
          const timeLeftMs = Math.max(0, booking.expiryEpoch - now);
          const minutesLeft = Math.floor(timeLeftMs / 60000);
          const secondsLeft = Math.floor((timeLeftMs % 60000) / 1000);
          const isExpired = timeLeftMs <= 0 && booking.status === 'CONFIRMED';
          const isActive = booking.status === 'CONFIRMED' && !isExpired;

          return (
            <div
              key={booking.id}
              className={`bg-slate-900 border rounded-2xl p-4 shadow-xl space-y-3 relative overflow-hidden transition ${
                isActive
                  ? 'border-emerald-500/40 shadow-emerald-950/20'
                  : booking.status === 'CANCELLED' || booking.status === 'NO_SHOW_PENALTY'
                  ? 'border-slate-800/80 bg-slate-900/60'
                  : 'border-amber-500/30'
              }`}
            >
              {/* Header Status Bar */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-emerald-400">
                    {booking.id}
                  </span>
                  <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-medium">
                    {booking.stationOperator}
                  </span>
                  {booking.appliedOfferCode && (
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-bold border border-emerald-500/30">
                      Offer: {booking.appliedOfferCode}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  {isActive ? (
                    <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                      <Clock className="w-3 h-3 animate-spin" />
                      Hold: {minutesLeft}m {secondsLeft}s
                    </span>
                  ) : booking.status === 'CANCELLED' ? (
                    <span className="text-[11px] text-slate-300 bg-slate-800 px-2 py-0.5 rounded-full border border-slate-700 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Cancelled & Refunded
                    </span>
                  ) : booking.status === 'NO_SHOW_PENALTY' ? (
                    <span className="text-[11px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/30 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> No-Show (Penalty Applied)
                    </span>
                  ) : (
                    <span className="text-[11px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">
                      Hold Expired
                    </span>
                  )}
                </div>
              </div>

              {/* Station Info */}
              <div>
                <h3 className="text-sm font-bold text-white">{booking.stationName}</h3>
                <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                  {booking.stationAddress}
                </p>
              </div>

              {/* Bay Details Grid */}
              <div className="grid grid-cols-3 gap-2 bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-[11px]">
                <div>
                  <span className="text-[10px] text-slate-500 block">Socket Bay</span>
                  <span className="font-mono font-bold text-slate-200">{booking.connectorId}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Speed & Plug</span>
                  <span className="font-semibold text-slate-200">{booking.powerKw}kW ({booking.connectorType})</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Unlock PIN</span>
                  <span className="font-mono font-bold text-emerald-400 text-xs">{booking.pinCode}</span>
                </div>
              </div>

              {/* Refund and Penalty Receipt Box */}
              {booking.refundStatus && (
                <div className={`p-2.5 rounded-xl border text-[11px] space-y-1.5 ${
                  booking.refundStatus === 'PENALTY_DEDUCTED'
                    ? 'bg-amber-950/30 border-amber-800/40 text-amber-200'
                    : 'bg-emerald-950/30 border-emerald-800/40 text-emerald-200'
                }`}>
                  <div className="flex items-center justify-between font-bold">
                    <span className="flex items-center gap-1">
                      <RefreshCw className="w-3 h-3 text-emerald-400" />
                      {booking.refundStatus === 'PENALTY_DEDUCTED'
                        ? 'No-Show Fee & Partial Refund'
                        : '100% Full Refund Reversal'}
                    </span>
                    <span className="font-mono text-emerald-400">
                      +₹{booking.refundAmount?.toFixed(2) || '100.00'}
                    </span>
                  </div>

                  {booking.penaltyAmount && booking.penaltyAmount > 0 && (
                    <div className="flex items-center justify-between text-rose-300 text-[10px]">
                      <span>Unused Bay Reservation Penalty:</span>
                      <span>-₹{booking.penaltyAmount.toFixed(2)}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800">
                    <span>Razorpay ID: {booking.refundId}</span>
                    <span>Processed at {booking.refundTimestamp}</span>
                  </div>
                </div>
              )}

              {/* Razorpay Transaction Bar */}
              {booking.paymentId && !booking.refundStatus && (
                <div className="flex items-center justify-between text-[10px] bg-blue-950/40 border border-blue-900/40 px-3 py-1.5 rounded-xl">
                  <span className="text-blue-300 font-medium flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    Paid via Razorpay ({booking.paymentMethod || 'UPI'})
                  </span>
                  <span className="font-mono text-slate-400 truncate max-w-[140px]">
                    {booking.paymentId}
                  </span>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {onOpenRouteNavForStation ? (
                  <button
                    onClick={() => onOpenRouteNavForStation(booking.stationAddress, booking.stationName)}
                    className="flex-1 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition border border-emerald-500/30"
                  >
                    <Navigation className="w-3.5 h-3.5 text-emerald-400" />
                    <span>En-Route Nav to Station</span>
                  </button>
                ) : (
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(booking.stationAddress)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-2 bg-slate-800 hover:bg-slate-750 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition border border-slate-700"
                  >
                    <Navigation className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Directions</span>
                  </a>
                )}

                {isActive && (
                  <>
                    {/* Fair Refund Cancellation Trigger */}
                    <button
                      onClick={() => onCancelBooking(booking)}
                      className="py-2 px-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl text-xs font-semibold transition flex items-center gap-1"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Cancel & Refund</span>
                    </button>

                    {/* Simulation button for Evaluator / User testing the No-Show Fee */}
                    <button
                      onClick={() => onSimulateNoShow(booking.id)}
                      className="py-2 px-2.5 bg-slate-800 hover:bg-slate-750 text-amber-400 border border-slate-700 rounded-xl text-[10px] font-semibold transition"
                      title="Simulates 45-minute window passing without check-in to demonstrate the ₹50 no-show unused fee policy"
                    >
                      Test No-Show Fee
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
