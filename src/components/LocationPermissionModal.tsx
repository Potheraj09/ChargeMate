import React from 'react';
import { Compass, MapPin, AlertCircle, CheckCircle } from 'lucide-react';
import { FALLBACK_LOCATIONS } from '../services/geoService';

interface LocationPermissionModalProps {
  isOpen: boolean;
  onGrantPermission: () => void;
  onSelectFallbackCity: (lat: number, lng: number, name: string) => void;
  permissionError: string | null;
}

export const LocationPermissionModal: React.FC<LocationPermissionModalProps> = ({
  isOpen,
  onGrantPermission,
  onSelectFallbackCity,
  permissionError
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4 text-center">
        <img
          src="/chargemate-icon.jpg"
          alt="ChargeMate"
          className="w-14 h-14 rounded-2xl mx-auto shadow-xl shadow-emerald-500/20 border border-slate-700/60 object-cover"
          referrerPolicy="no-referrer"
        />

        <div>
          <h3 className="text-base font-bold text-white">Enable Real Device GPS</h3>
          <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
            ChargeMate requires your location to discover nearby multi-operator charging stations, calculate accurate driving distances, and optimize your EV battery routing.
          </p>
        </div>

        {permissionError && (
          <div className="bg-rose-950/60 border border-rose-800/80 p-3 rounded-xl text-[11px] text-rose-300 flex items-start gap-2 text-left">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <strong className="block font-bold">GPS Access Limited</strong>
              {permissionError}
            </div>
          </div>
        )}

        <div className="space-y-2 pt-1">
          <button
            onClick={onGrantPermission}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/25 transition flex items-center justify-center gap-2"
          >
            <Compass className="w-4 h-4" /> Allow GPS Location
          </button>

          <div className="pt-2 border-t border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-2 font-mono">
              Or explore Indian EV Corridors
            </span>
            <div className="grid grid-cols-2 gap-1.5 max-h-44 overflow-y-auto no-scrollbar">
              {FALLBACK_LOCATIONS.map(city => (
                <button
                  key={city.name}
                  onClick={() => onSelectFallbackCity(city.lat, city.lng, city.name)}
                  className="p-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-slate-700 text-left text-[11px] transition flex items-center gap-1.5"
                >
                  <MapPin className="w-3 h-3 text-emerald-400 shrink-0" />
                  <span className="truncate">{city.name.split(' ')[0]} - {city.city}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
