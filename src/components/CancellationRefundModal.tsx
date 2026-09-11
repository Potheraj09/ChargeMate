import React, { useState } from 'react';
import { X, AlertTriangle, ShieldCheck, RefreshCw, CheckCircle2, CreditCard, ArrowRight, Zap } from 'lucide-react';
import { Booking } from '../types';
import { calculateCancellationRefund } from '../services/loyaltyOffersService';

interface CancellationRefundModalProps {
  booking: Booking;
  onClose: () => void;
  onConfirmCancellation: (updatedBooking: Booking) => void;
}

export const CancellationRefundModal: React.FC<CancellationRefundModalProps> = ({
  booking,
  onClose,
  onConfirmCancellation
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [completedRefund, setCompletedRefund] = useState<{
    refundId: string;
    amount: number;
    penalty: number;
    mode: string;
  } | null>(null);

  const refundCalc = calculateCancellationRefund(booking);
  const amountPaid = booking.amountPaid || 100;

  const handleExecuteRefund = () => {
    setIsProcessing(true);

    setTimeout(() => {
      const updated: Booking = {
        ...booking,
        status: refundCalc.penaltyAmount > 0 ? 'NO_SHOW_PENALTY' : 'CANCELLED',
        refundStatus: refundCalc.penaltyAmount > 0 ? 'PENALTY_DEDUCTED' : 'FULL_REFUNDED',
        refundAmount: refundCalc.refundAmount,
        penaltyAmount: refundCalc.penaltyAmount,
        refundId: refundCalc.refundId,
        refundReason: refundCalc.policySummary,
        refundTimestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setCompletedRefund({
        refundId: refundCalc.refundId,
        amount: refundCalc.refundAmount,
        penalty: refundCalc.penaltyAmount,
        mode: booking.paymentMethod || 'Razorpay UPI'
      });

      setIsProcessing(false);
      onConfirmCancellation(updated);
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/95 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold text-xs border border-rose-500/30">
              <RefreshCw className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Cancellation & Refund Policy</h3>
              <p className="text-[10px] text-slate-400">Order Ref: {booking.id}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3.5 text-xs">
          {completedRefund ? (
            /* Refund Success Screen */
            <div className="space-y-4 py-2 text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>

              <div>
                <h4 className="text-base font-bold text-white">Refund Successfully Issued</h4>
                <p className="text-xs text-slate-400 mt-1">
                  Razorpay reversal initiated for <strong className="text-emerald-400">₹{completedRefund.amount.toFixed(2)}</strong>
                </p>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-left space-y-2 text-[11px]">
                <div className="flex justify-between text-slate-400">
                  <span>Razorpay Refund ID:</span>
                  <span className="font-mono text-emerald-400 font-bold">{completedRefund.refundId}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Refunded To:</span>
                  <span className="text-slate-200 font-medium">{completedRefund.mode}</span>
                </div>
                {completedRefund.penalty > 0 && (
                  <div className="flex justify-between text-rose-400">
                    <span>Unused Bay Fee Deducted:</span>
                    <span>-₹{completedRefund.penalty.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-400 border-t border-slate-800 pt-2 font-bold text-white">
                  <span>Net Amount Refunded:</span>
                  <span className="text-emerald-400">₹{completedRefund.amount.toFixed(2)}</span>
                </div>
              </div>

              <p className="text-[10px] text-slate-500">
                Amount usually reflects in your UPI/Bank account within 5 to 15 minutes.
              </p>

              <button
                onClick={onClose}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition"
              >
                Close Receipt
              </button>
            </div>
          ) : (
            /* Review & Policy Confirmation Screen */
            <>
              {/* Station summary */}
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-[10px]">Charging Hub:</span>
                  <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded font-mono">
                    Bay {booking.connectorId} ({booking.powerKw}kW)
                  </span>
                </div>
                <h4 className="font-bold text-white text-xs">{booking.stationName}</h4>
                <p className="text-[11px] text-slate-400 truncate">{booking.stationAddress}</p>
              </div>

              {/* Policy Terms Box */}
              <div className="bg-blue-950/30 border border-blue-900/50 p-3 rounded-xl space-y-2 text-[11px]">
                <div className="flex items-center gap-1.5 text-blue-300 font-semibold">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Fair Refund & Bay Usage Policy</span>
                </div>
                <p className="text-slate-300 leading-relaxed text-[11px]">
                  {refundCalc.policySummary}
                </p>
                <div className="text-[10px] text-slate-400 bg-slate-900/80 p-2 rounded-lg border border-slate-800 space-y-1">
                  <div className="flex justify-between">
                    <span>• Timely Cancellation (Within hold window):</span>
                    <strong className="text-emerald-400">100% Full Refund</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>• Reserved & Not Used (No-Show after 45m):</span>
                    <strong className="text-amber-400">₹50 Bay Fee, ₹50 Refund</strong>
                  </div>
                </div>
              </div>

              {/* Refund Breakdown Table */}
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2 text-[11px]">
                <div className="flex justify-between text-slate-400">
                  <span>Slot Hold Deposit Paid:</span>
                  <span className="font-mono text-slate-200">₹{amountPaid.toFixed(2)}</span>
                </div>

                {refundCalc.penaltyAmount > 0 ? (
                  <div className="flex justify-between text-rose-400 font-medium">
                    <span>Unused Bay Holding Fee:</span>
                    <span>-₹{refundCalc.penaltyAmount.toFixed(2)}</span>
                  </div>
                ) : (
                  <div className="flex justify-between text-emerald-400 font-medium">
                    <span>Cancellation Fee:</span>
                    <span>₹0.00 (Zero Penalty)</span>
                  </div>
                )}

                <div className="flex justify-between text-slate-400 pt-1.5 border-t border-slate-800 text-xs font-bold">
                  <span className="text-white">Eligible Refund to Account:</span>
                  <span className="text-emerald-400 font-mono text-sm">
                    ₹{refundCalc.refundAmount.toFixed(2)}
                  </span>
                </div>

                <div className="text-[10px] text-slate-500 pt-1">
                  Destination: Original {booking.paymentMethod || 'Razorpay UPI'} source
                </div>
              </div>

              {/* Buttons */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isProcessing}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-xl text-xs font-semibold border border-slate-700 transition"
                >
                  Keep Reservation
                </button>

                <button
                  type="button"
                  onClick={handleExecuteRefund}
                  disabled={isProcessing}
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-rose-600/25 transition flex items-center justify-center gap-1.5"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Refunding...</span>
                    </>
                  ) : (
                    <>
                      <span>Confirm & Refund</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
