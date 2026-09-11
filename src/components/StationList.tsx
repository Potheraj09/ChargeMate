import React from 'react';
import { Zap, Bookmark, Star, ChevronRight, Navigation, Clock, Shield } from 'lucide-react';
import { ChargingStation } from '../types';

interface StationListProps {
  stations: ChargingStation[];
  favorites: string[];
  onToggleFavorite: (id: string) => void;
  onSelectStation: (station: ChargingStation) => void;
  onQuickBook: (station: ChargingStation) => void;
}

export const StationList: React.FC<StationListProps> = ({
  stations,
  favorites,
  onToggleFavorite,
  onSelectStation,
  onQuickBook
}) => {
  if (stations.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center text-slate-400">
        <Zap className="w-12 h-12 text-slate-600 mb-3" />
        <h3 className="text-sm font-bold text-slate-200">No stations match your criteria</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-xs">
          Try loosening your speed, distance, or connector filters to view more nearby hubs.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-3.5 sm:p-5 pb-24 space-y-3">
      <div className="flex items-center justify-between mb-1 px-0.5">
        <div>
          <h2 className="text-sm font-bold text-white">
            {stations.length} Charging Locations Nearby
          </h2>
          <p className="text-[11px] text-slate-400">
            Ranked by live haversine distance from your GPS position
          </p>
        </div>
      </div>

      {stations.map(station => {
        const availCount = station.connectors.filter(c => c.status === 'AVAILABLE').length;
        const totalCount = station.connectors.length;
        const maxKw = Math.max(...station.connectors.map(c => c.powerKw));
        const isFav = favorites.includes(station.id);
        const minPrice = Math.min(...station.connectors.map(c => c.pricePerKwh));

        return (
          <div
            key={station.id}
            onClick={() => onSelectStation(station)}
            className="bg-slate-900/90 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 transition cursor-pointer shadow-lg relative group"
          >
            {/* Top Bar: Operator Badge & Rating */}
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded-md border"
                  style={{
                    backgroundColor: `${station.operatorLogoColor}18`,
                    color: station.operatorLogoColor,
                    borderColor: `${station.operatorLogoColor}40`
                  }}
                >
                  {station.operator}
                </span>

                <span className="text-[11px] text-amber-400 font-bold flex items-center gap-0.5">
                  <Star className="w-3 h-3 fill-amber-400" />
                  {station.rating}
                  <span className="text-slate-500 font-normal">({station.reviewCount})</span>
                </span>

                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                  <Clock className="w-2.5 h-2.5" />
                  {station.openHours.includes('24') ? '24/7' : 'Daytime'}
                </span>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleFavorite(station.id);
                  }}
                  className="p-1.5 text-slate-400 hover:text-rose-400 transition"
                  title="Bookmark station"
                >
                  <Bookmark className={`w-4 h-4 ${isFav ? 'fill-rose-500 text-rose-500' : ''}`} />
                </button>
              </div>
            </div>

            {/* Title & Address */}
            <div className="mb-2.5">
              <h3 className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors">
                {station.name}
              </h3>
              <p className="text-xs text-slate-400 truncate mt-0.5">{station.address}</p>
            </div>

            {/* Connectors Pills */}
            <div className="flex flex-wrap gap-1.5 mb-3">
              {station.connectors.map(c => {
                const isAvail = c.status === 'AVAILABLE';
                return (
                  <span
                    key={c.id}
                    className={`text-[10px] px-2 py-1 rounded-lg font-medium flex items-center gap-1.5 border ${
                      isAvail
                        ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                        : c.status === 'OCCUPIED'
                        ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    <Zap className="w-2.5 h-2.5" />
                    <span>{c.type}</span>
                    <span className="font-mono font-bold">{c.powerKw}kW</span>
                    <span className="text-[9px] opacity-75 uppercase">({c.status.toLowerCase()})</span>
                  </span>
                );
              })}
            </div>

            {/* Metrics & Action Bar */}
            <div className="flex items-center justify-between pt-2.5 border-t border-slate-800/80 text-xs text-slate-300">
              <div className="flex items-center gap-3">
                <span className="font-bold text-white">{station.distanceKm} km away</span>
                <span className={availCount > 0 ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold'}>
                  {availCount} of {totalCount} free
                </span>
                <span className="font-semibold text-slate-400">
                  from <span className="text-white font-bold">₹{minPrice}</span>/kWh
                </span>
              </div>

              <div className="flex items-center gap-2">
                {availCount > 0 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onQuickBook(station);
                    }}
                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] rounded-lg transition shadow-sm"
                  >
                    Book
                  </button>
                )}
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
