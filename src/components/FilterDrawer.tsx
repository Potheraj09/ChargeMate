import React from 'react';
import { X, RotateCcw, Zap, Sliders, Check } from 'lucide-react';
import { ConnectorType, FilterState } from '../types';
import { OPERATOR_PROFILES } from '../services/mockAdapter';

interface FilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  totalMatches: number;
}

export const FilterDrawer: React.FC<FilterDrawerProps> = ({
  isOpen,
  onClose,
  filters,
  setFilters,
  totalMatches
}) => {
  if (!isOpen) return null;

  const handleReset = () => {
    setFilters({
      searchQuery: '',
      minPowerKw: 0,
      connectorTypes: [],
      availableOnly: false,
      maxDistanceKm: 35,
      operators: [],
      maxPricePerKwh: 35
    });
  };

  const toggleConnector = (type: ConnectorType) => {
    setFilters(prev => {
      const exists = prev.connectorTypes.includes(type);
      return {
        ...prev,
        connectorTypes: exists
          ? prev.connectorTypes.filter(t => t !== type)
          : [...prev.connectorTypes, type]
      };
    });
  };

  const toggleOperator = (opName: string) => {
    setFilters(prev => {
      const exists = prev.operators.includes(opName);
      return {
        ...prev,
        operators: exists
          ? prev.operators.filter(o => o !== opName)
          : [...prev.operators, opName]
      };
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-sm bg-slate-900 border-l border-slate-800 h-full flex flex-col shadow-2xl">
        {/* Top Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">Station Filters</h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleReset}
              className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 transition"
            >
              <RotateCcw className="w-3 h-3" /> Reset
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Filters */}
        <div className="p-4 overflow-y-auto space-y-5 text-xs flex-1">
          {/* Availability Toggle */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
            <div>
              <span className="font-bold text-white block">Available Now Only</span>
              <span className="text-[10px] text-slate-400">Exclude fully occupied hubs</span>
            </div>
            <input
              type="checkbox"
              checked={filters.availableOnly}
              onChange={(e) => setFilters(f => ({ ...f, availableOnly: e.target.checked }))}
              className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
            />
          </div>

          {/* Speed Presets */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[11px] font-bold text-slate-300">
                Minimum Charging Speed (3 kW - 240 kW)
              </label>
              <span className="text-[11px] font-mono font-bold text-emerald-400">
                {filters.minPowerKw === 0 ? 'All (3-240kW)' : `${filters.minPowerKw} kW+`}
              </span>
            </div>

            {/* Slider */}
            <div className="mb-2 px-1">
              <input
                type="range"
                min="0"
                max="240"
                step="5"
                value={filters.minPowerKw}
                onChange={(e) => setFilters(f => ({ ...f, minPowerKw: Number(e.target.value) }))}
                className="w-full accent-emerald-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[9px] text-slate-500 font-mono mt-1">
                <span>3 kW (Slow)</span>
                <span>22 kW</span>
                <span>60 kW</span>
                <span>120 kW</span>
                <span>240 kW (Hyper)</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              {[
                { kw: 0, label: 'Any (3-240kW)', sub: 'All power tiers' },
                { kw: 3, label: '3 kW+ AC', sub: '2-Wheeler / Slow' },
                { kw: 22, label: '22 kW+ AC', sub: 'Fast destination' },
                { kw: 60, label: '60 kW+ DC', sub: 'Highway standard' },
                { kw: 120, label: '120 kW+ DC', sub: 'High speed rapid' },
                { kw: 240, label: '240 kW Hyper', sub: 'ChargeZone dual-gun' }
              ].map(item => (
                <button
                  key={item.kw}
                  type="button"
                  onClick={() => setFilters(f => ({ ...f, minPowerKw: item.kw }))}
                  className={`p-2 rounded-xl border text-left transition ${
                    filters.minPowerKw === item.kw
                      ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300 font-bold'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <span className="block font-semibold text-[11px]">{item.label}</span>
                  <span className="text-[9px] text-slate-500">{item.sub}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Connector Types */}
          <div>
            <label className="text-[11px] font-bold text-slate-300 block mb-2">
              Connector Plug Compatibility
            </label>
            <div className="flex flex-wrap gap-2">
              {(['CCS2', 'Type2', 'CHAdeMO'] as ConnectorType[]).map(type => {
                const isSelected = filters.connectorTypes.includes(type);
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => toggleConnector(type)}
                    className={`px-3 py-1.5 rounded-xl border font-bold text-xs transition flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5" />}
                    <span>{type}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Distance Radius */}
          <div>
            <div className="flex justify-between text-[11px] font-bold text-slate-300 mb-1.5">
              <span>Maximum Radius (City & Metropolitan Region)</span>
              <span className="text-emerald-400 font-mono">{filters.maxDistanceKm} km</span>
            </div>
            <input
              type="range"
              min="5"
              max="75"
              step="5"
              value={filters.maxDistanceKm}
              onChange={(e) => setFilters(f => ({ ...f, maxDistanceKm: Number(e.target.value) }))}
              className="w-full accent-emerald-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-1">
              <span>5 km (Local)</span>
              <span>35 km</span>
              <span>75 km (Entire City & Suburbs)</span>
            </div>
          </div>

          {/* Max Tariff Slider */}
          <div>
            <div className="flex justify-between text-[11px] font-bold text-slate-300 mb-1.5">
              <span>Max Tariff (₹/kWh)</span>
              <span className="text-emerald-400 font-mono">₹{filters.maxPricePerKwh} / kWh</span>
            </div>
            <input
              type="range"
              min="15"
              max="35"
              step="1"
              value={filters.maxPricePerKwh}
              onChange={(e) => setFilters(f => ({ ...f, maxPricePerKwh: Number(e.target.value) }))}
              className="w-full accent-emerald-500 cursor-pointer"
            />
          </div>

          {/* Charging Networks Filter */}
          <div>
            <label className="text-[11px] font-bold text-slate-300 block mb-2">
              Operator Networks
            </label>
            <div className="space-y-1.5">
              {OPERATOR_PROFILES.map(op => {
                const isSelected = filters.operators.includes(op.name);
                return (
                  <label
                    key={op.name}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer hover:border-slate-700 transition"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: op.color }}
                      ></span>
                      <span className="text-slate-200 text-xs font-semibold">{op.name}</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleOperator(op.name)}
                      className="accent-emerald-500 rounded cursor-pointer"
                    />
                  </label>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900">
          <button
            onClick={onClose}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/25 transition"
          >
            Show {totalMatches} Stations
          </button>
        </div>
      </div>
    </div>
  );
};
