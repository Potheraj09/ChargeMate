import React, { useState } from 'react';
import { X, Award, Zap, Check, Copy, Gift, Sparkles, Shield, Coffee, Percent, ArrowRight, RotateCcw } from 'lucide-react';
import { LoyaltyOffer } from '../types';
import { LOYALTY_OFFERS, CLUB_10_MILESTONE, isClub10Eligible } from '../services/loyaltyOffersService';

interface LoyaltyOffersModalProps {
  isOpen: boolean;
  onClose: () => void;
  monthlyUses: number;
  onUpdateMonthlyUses: (newCount: number) => void;
  onApplyOfferToBooking?: (offerCode: string) => void;
}

export const LoyaltyOffersModal: React.FC<LoyaltyOffersModalProps> = ({
  isOpen,
  onClose,
  monthlyUses,
  onUpdateMonthlyUses,
  onApplyOfferToBooking
}) => {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  if (!isOpen) return null;
  const isUnlocked = isClub10Eligible(monthlyUses);
  const progressPercent = Math.min(100, Math.round((monthlyUses / CLUB_10_MILESTONE) * 100));

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-emerald-950/60 via-slate-900 to-cyan-950/60 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm border border-emerald-500/40 shadow-lg shadow-emerald-500/20">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-bold text-white">Club 10+ Driver Rewards</h3>
                <span className="text-[9px] bg-emerald-500/20 text-emerald-400 font-bold px-1.5 py-0.2 rounded border border-emerald-500/30">
                  Monthly Milestone
                </span>
              </div>
              <p className="text-[10px] text-slate-400">
                Exclusive offers for drivers with 10 or more charges in a month
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Milestone Tracker Banner */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 block uppercase tracking-wider font-semibold">
                Your Monthly Usage Progress
              </span>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-xl font-bold font-mono text-white">{monthlyUses}</span>
                <span className="text-xs text-slate-400">/ {CLUB_10_MILESTONE} Sessions this Month</span>
              </div>
            </div>

            {isUnlocked ? (
              <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/15 px-2.5 py-1 rounded-full border border-emerald-500/30 shadow-sm">
                <Award className="w-3.5 h-3.5" />
                Club 10+ Member Active
              </span>
            ) : (
              <span className="text-[11px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/30">
                {CLUB_10_MILESTONE - monthlyUses} more needed to unlock
              </span>
            )}
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden relative">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                isUnlocked ? 'bg-gradient-to-r from-emerald-500 to-cyan-400' : 'bg-amber-500'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Quick interactive test controls */}
          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
            <span>Test usage threshold:</span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => onUpdateMonthlyUses(Math.max(0, monthlyUses - 1))}
                className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[10px] transition"
              >
                -1
              </button>
              <button
                onClick={() => onUpdateMonthlyUses(monthlyUses + 1)}
                className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[10px] transition"
              >
                +1 Charge
              </button>
              <button
                onClick={() => onUpdateMonthlyUses(10)}
                className="px-2 py-0.5 bg-emerald-900/50 hover:bg-emerald-800/50 text-emerald-300 border border-emerald-700/50 rounded text-[10px] transition"
              >
                Set to 10 (Unlock)
              </button>
              <button
                onClick={() => onUpdateMonthlyUses(5)}
                className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded text-[10px] transition"
                title="Reset to 5 to view locked state"
              >
                <RotateCcw className="w-2.5 h-2.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Offers List */}
        <div className="p-4 space-y-3 overflow-y-auto flex-1">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-white">Monthly Unlocked Offers (≥ 10 uses)</span>
            <span className="text-[11px] text-slate-400">{LOYALTY_OFFERS.length} Benefits Available</span>
          </div>

          {LOYALTY_OFFERS.map(offer => {
            const isOfferEligible = monthlyUses >= offer.minMonthlyUses;

            return (
              <div
                key={offer.id}
                className={`border rounded-2xl p-3.5 transition space-y-2.5 relative ${
                  isOfferEligible
                    ? 'bg-slate-900/90 border-slate-750 hover:border-emerald-500/50 shadow-lg'
                    : 'bg-slate-950/60 border-slate-800/60 opacity-60'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-slate-800 text-slate-200 border border-slate-700">
                      {offer.badge}
                    </span>
                    <span className="text-[10px] text-slate-400">{offer.partner}</span>
                  </div>

                  {isOfferEligible ? (
                    <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                      <Check className="w-3 h-3" /> Unlocked
                    </span>
                  ) : (
                    <span className="text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">
                      Requires 10+ uses
                    </span>
                  )}
                </div>

                <div>
                  <h4 className="text-xs font-bold text-white">{offer.title}</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                    {offer.description}
                  </p>
                </div>

                {/* Promo Code & Apply Row */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-800/80">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-slate-500">Code:</span>
                    <span className="font-mono text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      {offer.code}
                    </span>
                    <button
                      onClick={() => handleCopyCode(offer.code)}
                      disabled={!isOfferEligible}
                      className="p-1 text-slate-400 hover:text-white transition"
                      title="Copy promo code"
                    >
                      {copiedCode === offer.code ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>

                  {onApplyOfferToBooking && isOfferEligible && (
                    <button
                      onClick={() => {
                        onApplyOfferToBooking(offer.code);
                        onClose();
                      }}
                      className="px-2.5 py-1 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 rounded-lg text-[10px] font-bold transition flex items-center gap-1"
                    >
                      <span>Apply Code</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>

                <p className="text-[9px] text-slate-500 italic">
                  Terms: {offer.terms}
                </p>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-900/95 flex items-center justify-between text-xs text-slate-400 shrink-0">
          <span>Charges reset automatically at the end of each calendar month.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
