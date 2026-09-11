import React from 'react';
import {
  X, Zap, Navigation, Clock, Phone, MapPin, ShieldCheck,
  CreditCard, ExternalLink, BatteryCharging, Check, Star, Info
} from 'lucide-react';
import { ChargingStation, Connector, EVProfile } from '../types';

interface StationDetailModalProps {
  station: ChargingStation;
  onClose: () => void;
  onBookSlot: (station: ChargingStation, connector?: Connector) => void;
  selectedProfile: EVProfile;
  onOpenEnRouteNav?: (station: ChargingStation) => void;
}

export const StationDetailModal: React.FC<StationDetailModalProps> = ({
  station,
  onClose,
  onBookSlot,
  selectedProfile,
  onOpenEnRouteNav
}) => {
  const freeConnectors = station.connectors.filter(c => c.status === 'AVAILABLE');
  const baseRate = station.connectors[0]?.pricePerKwh || 18.0;

  // Compute 20% -> 80% charge replenishment (60% delta) for selected EV
  const energyKwhNeeded = Math.round((selectedProfile.batteryKwh * 0.6) * 10) / 10;
  const energyCost = Math.round(energyKwhNeeded * baseRate);
  const platformFee = 15;
  const subtotal = energyCost + platformFee;
  const gstTax = Math.round(subtotal * 0.18);
  const totalEst = subtotal + gstTax;

  // Google Maps navigation deep link
  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${station.latitude},${station.longitude}`;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/65 backdrop-blur-sm animate-fade-in p-0 sm:p-4">
      <div className="w-full max-w-lg max-h-[90vh] bg-slate-900 border border-slate-800 rounded-t-2xl sm:rounded-2xl flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md flex items-start justify-between shrink-0">
          <div className="min-w-0 pr-3">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded-md border"
                style={{
                  backgroundColor: `${station.operatorLogoColor}20`,
                  color: station.operatorLogoColor,
                  borderColor: `${station.operatorLogoColor}40`
                }}
              >
                {station.operator}
              </span>
              <span className="text-[11px] text-amber-400 font-bold flex items-center gap-0.5">
                <Star className="w-3 h-3 fill-amber-400" />
                {station.rating} ({station.reviewCount} reviews)
              </span>
              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-400" />
                {station.openHours}
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-white truncate">{station.name}</h2>
            <p className="text-xs text-slate-400 truncate mt-0.5 flex items-center gap-1">
              <MapPin className="w-3 h-3 shrink-0 text-slate-500" />
              {station.address}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition shrink-0"
            aria-label="Close station modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-4 overflow-y-auto space-y-4 text-xs">
          {/* Key Metrics */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-center">
              <span className="text-[10px] text-slate-400 block">Distance</span>
              <span className="font-bold text-sm text-white">{station.distanceKm} km</span>
            </div>
            <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-center">
              <span className="text-[10px] text-slate-400 block">Available</span>
              <span className={`font-bold text-sm ${freeConnectors.length > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {freeConnectors.length} / {station.connectors.length} Free
              </span>
            </div>
            <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-center">
              <span className="text-[10px] text-slate-400 block">Base Tariff</span>
              <span className="font-bold text-sm text-emerald-400">₹{baseRate}/kWh</span>
            </div>
          </div>

          {/* Connector-by-Connector Status */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold text-slate-200">Connectors & Live Status</h3>
              <span className="text-[10px] text-slate-400">Lock guaranteed for 45 min</span>
            </div>

            <div className="space-y-2">
              {station.connectors.map(c => {
                const isAvail = c.status === 'AVAILABLE';
                return (
                  <div
                    key={c.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${isAvail ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>
                        <Zap className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-xs">{c.type}</span>
                          <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded font-mono font-bold">
                            {c.powerKw} kW
                          </span>
                          <span className="text-[11px] text-slate-400 font-mono">₹{c.pricePerKwh}/u</span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono">Socket ID: {c.id}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          isAvail
                            ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                            : c.status === 'OCCUPIED'
                            ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}
                      >
                        {c.status}
                      </span>

                      {isAvail && (
                        <button
                          onClick={() => onBookSlot(station, c)}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg transition shadow-sm"
                        >
                          Book
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Pricing Breakdown Card */}
          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-bold text-slate-200">
                <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
                <span>Session Pricing Breakdown (20% → 80%)</span>
              </div>
              <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded">
                {selectedProfile.model.split(' ')[0]} ({selectedProfile.batteryKwh} kWh)
              </span>
            </div>

            <div className="space-y-1 text-slate-400 text-[11px]">
              <div className="flex justify-between">
                <span>Energy Estimate (~{energyKwhNeeded} kWh @ ₹{baseRate}/kWh)</span>
                <span className="text-slate-200 font-mono">₹{energyCost}</span>
              </div>
              <div className="flex justify-between">
                <span>CPO Convenience & Network Fee</span>
                <span className="text-slate-200 font-mono">₹{platformFee}</span>
              </div>
              <div className="flex justify-between">
                <span>Goods & Services Tax (GST 18%)</span>
                <span className="text-slate-200 font-mono">₹{gstTax}</span>
              </div>
              <div className="flex justify-between font-bold text-white pt-1.5 border-t border-slate-800 text-xs">
                <span>Total Estimated Cost</span>
                <span className="text-emerald-400 font-mono font-bold text-sm">₹{totalEst}</span>
              </div>
              <div className="flex items-center gap-1.5 pt-1 text-[10px] text-blue-300">
                <ShieldCheck className="w-3 h-3 text-blue-400" />
                <span>Pay ₹100 hold deposit directly in-app via Razorpay (UPI, Cards, NetBanking)</span>
              </div>
            </div>
          </div>

          {/* Station Amenities */}
          <div>
            <h4 className="font-semibold text-slate-300 mb-2">Hub Amenities</h4>
            <div className="flex flex-wrap gap-1.5">
              {station.amenities.map(a => (
                <span
                  key={a}
                  className="bg-slate-800/90 border border-slate-700/60 text-slate-200 px-2.5 py-1 rounded-lg text-[11px] flex items-center gap-1.5"
                >
                  <Check className="w-3 h-3 text-emerald-400" />
                  {a}
                </span>
              ))}
            </div>
          </div>

          {/* Operator Support Contact */}
          <div className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <Phone className="w-3.5 h-3.5 text-slate-400" />
              <span>Operator Helpline:</span>
              <span className="font-mono text-slate-200 font-semibold">{station.contactPhone}</span>
            </div>
            <span className="text-[10px] text-emerald-400 font-semibold">Toll-Free</span>
          </div>
        </div>

        {/* Primary Action Buttons */}
        <div className="p-3.5 border-t border-slate-800 bg-slate-900 flex flex-col sm:flex-row items-center gap-2 shrink-0">
          {onOpenEnRouteNav ? (
            <button
              onClick={() => onOpenEnRouteNav(station)}
              className="w-full sm:flex-1 py-3 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border border-emerald-500/40 transition"
            >
              <Navigation className="w-4 h-4 text-emerald-400" />
              <span>En-Route EV Nav</span>
            </button>
          ) : (
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:flex-1 py-3 bg-slate-800 hover:bg-slate-750 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 border border-slate-700 transition"
            >
              <Navigation className="w-4 h-4 text-emerald-400" />
              Navigate (Google Maps)
            </a>
          )}

          <button
            onClick={() => onBookSlot(station)}
            disabled={freeConnectors.length === 0}
            className={`w-full sm:flex-1 py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg transition ${
              freeConnectors.length > 0
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
            }`}
          >
            <BatteryCharging className="w-4 h-4" />
            {freeConnectors.length > 0 ? 'Pay & Book (Razorpay)' : 'Currently Full'}
          </button>
        </div>
      </div>
    </div>
  );
};
