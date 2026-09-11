import React, { useState, useMemo } from 'react';
import { EVProfile, ChargingStation } from '../types';
import { EV_COMPANIES_CATALOG, EVCompany, EVBrand, searchEVHierarchy, getAllCatalogEVModels } from '../services/evCatalog';
import { 
  Car, Zap, Battery, Gauge, Compass, MapPin, ArrowRight, 
  Check, ChevronRight, ChevronLeft, Building2, Search, Sparkles 
} from 'lucide-react';

interface VehicleProfileViewProps {
  selectedProfile: EVProfile;
  onSelectProfile: (profile: EVProfile) => void;
  stations: ChargingStation[];
  onSelectStation: (station: ChargingStation) => void;
  onOpenEnRouteNavModal?: (destName?: string) => void;
}

export const VehicleProfileView: React.FC<VehicleProfileViewProps> = ({
  selectedProfile,
  onSelectProfile,
  stations,
  onSelectStation,
  onOpenEnRouteNavModal
}) => {
  // Navigation Hierarchy State
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [selectedBrandId, setSelectedBrandId] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Trip planner state
  const [tripOrigin, setTripOrigin] = useState('Chennai (Guindy Hub)');
  const [tripDestination, setTripDestination] = useState('Bengaluru (Electronic City)');
  const [tripDistanceKm, setTripDistanceKm] = useState(350);
  const [isCalculated, setIsCalculated] = useState(false);

  const categories = ['All', 'Passenger Cars', 'Luxury & Performance', 'Two-Wheelers'];

  // Current active selections in hierarchy
  const activeCompany = useMemo(() => {
    return EV_COMPANIES_CATALOG.find(c => c.id === selectedCompanyId) || null;
  }, [selectedCompanyId]);

  const activeBrand = useMemo(() => {
    if (!activeCompany) return null;
    return activeCompany.brands.find(b => b.id === selectedBrandId) || activeCompany.brands[0] || null;
  }, [activeCompany, selectedBrandId]);

  // Global search across all companies, brands, and models
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return searchEVHierarchy(searchQuery);
  }, [searchQuery]);

  // Filtered companies by category
  const filteredCompanies = useMemo(() => {
    return EV_COMPANIES_CATALOG.filter(c => {
      if (categoryFilter === 'All') return true;
      return c.category === categoryFilter;
    });
  }, [categoryFilter]);

  // Trip planner computations
  const stopsNeeded = Math.max(0, Math.ceil(tripDistanceKm / (selectedProfile.rangeKm * 0.75)) - 1);
  const recommendedStopStation = stations.find(s => s.connectors.some(c => c.powerKw >= 50)) || stations[0];

  const quickRoutes = [
    { name: 'Chennai → Bengaluru', origin: 'Chennai (Guindy)', dest: 'Bengaluru (E-City)', dist: 350 },
    { name: 'Chennai → Coimbatore', origin: 'Chennai (OMR)', dest: 'Coimbatore (Avinashi)', dist: 500 },
    { name: 'Mumbai → Pune Expressway', origin: 'Mumbai (BKC)', dest: 'Pune (Hinjawadi)', dist: 155 },
    { name: 'Delhi → Jaipur NH48', origin: 'Delhi (CP)', dest: 'Jaipur (Bypass)', dist: 280 }
  ];

  const handleSelectModel = (model: EVProfile) => {
    onSelectProfile(model);
  };

  const totalCatalogModelsCount = useMemo(() => {
    return getAllCatalogEVModels().length;
  }, []);

  return (
    <div className="h-full overflow-y-auto p-4 sm:p-5 pb-24 space-y-6">
      {/* Active Vehicle Status Card */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-750 p-4 rounded-2xl shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-teal-400 font-bold shrink-0">
              <Car className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-semibold tracking-wider text-teal-400 uppercase bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/20">
                  Active Vehicle Profile
                </span>
                <span className="text-[11px] text-slate-400 font-medium">
                  {selectedProfile.brand}
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-100 tracking-tight mt-0.5">
                {selectedProfile.model}
              </h3>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:gap-3 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
            <div className="text-center px-2">
              <div className="flex items-center justify-center gap-1 text-[11px] text-slate-400">
                <Battery className="w-3 h-3 text-teal-400" />
                <span>Battery</span>
              </div>
              <p className="text-xs font-bold text-slate-100 mt-0.5 font-mono">
                {selectedProfile.batteryKwh} kWh
              </p>
            </div>
            <div className="text-center px-2 border-x border-slate-800">
              <div className="flex items-center justify-center gap-1 text-[11px] text-slate-400">
                <Zap className="w-3 h-3 text-amber-400" />
                <span>Max DC</span>
              </div>
              <p className="text-xs font-bold text-slate-100 mt-0.5 font-mono">
                {selectedProfile.maxDcKw} kW
              </p>
            </div>
            <div className="text-center px-2">
              <div className="flex items-center justify-center gap-1 text-[11px] text-slate-400">
                <Gauge className="w-3 h-3 text-sky-400" />
                <span>Range</span>
              </div>
              <p className="text-xs font-bold text-slate-100 mt-0.5 font-mono">
                {selectedProfile.rangeKm} km
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Hierarchical EV Selector */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <span>All EV Vehicles in India</span>
              <span className="text-xs bg-slate-800 text-teal-400 font-mono px-2 py-0.5 rounded-full border border-slate-700">
                {totalCatalogModelsCount} models
              </span>
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Select Company → Select Brand/Division → Choose your EV model
            </p>
          </div>

          {/* Quick Search */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search any car, brand, or OEM..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-750 text-slate-200 text-xs pl-8 pr-3 py-1.5 rounded-xl focus:ring-1 focus:ring-teal-500 focus:border-teal-500 outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 hover:text-white"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Global Search Results Overlay (if searching) */}
        {searchQuery.trim() ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400 pb-1">
              <span>Search results for &ldquo;{searchQuery}&rdquo; ({searchResults.length} matches)</span>
              <button
                onClick={() => setSearchQuery('')}
                className="text-teal-400 hover:underline text-xs"
              >
                Back to catalog
              </button>
            </div>
            {searchResults.length === 0 ? (
              <div className="p-8 text-center bg-slate-900/60 rounded-xl border border-slate-800 text-slate-400 text-xs">
                No EV models found matching &ldquo;{searchQuery}&rdquo;. Try Tata, Mahindra, MG, Ioniq, or Ola.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[360px] overflow-y-auto pr-1">
                {searchResults.map(({ company, brand, model }) => {
                  const isSelected = selectedProfile.id === model.id;
                  return (
                    <div
                      key={model.id}
                      onClick={() => handleSelectModel(model)}
                      className={`p-3 rounded-xl border transition cursor-pointer ${
                        isSelected
                          ? 'bg-teal-500/10 border-teal-500/60 ring-1 ring-teal-500'
                          : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:bg-slate-850'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs">{company.icon}</span>
                            <span className="text-[11px] font-semibold text-teal-400">
                              {company.name} • {brand.name}
                            </span>
                          </div>
                          <h4 className="text-xs font-bold text-slate-100 mt-0.5">{model.model}</h4>
                        </div>
                        {isSelected && (
                          <span className="text-[10px] bg-teal-500/20 text-teal-300 font-bold px-1.5 py-0.5 rounded border border-teal-500/40 flex items-center gap-1">
                            <Check className="w-3 h-3" /> Active
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-slate-400 pt-1.5 border-t border-slate-800 mt-1.5">
                        <span>🔋 {model.batteryKwh} kWh</span>
                        <span>⚡ Up to {model.maxDcKw} kW DC</span>
                        <span>🛣️ {model.rangeKm} km</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          /* Hierarchical 3-Level Flow */
          <div className="space-y-3">
            {/* Step Breadcrumbs */}
            <div className="flex items-center gap-2 text-xs bg-slate-900/60 px-3 py-2 rounded-xl border border-slate-800 text-slate-300">
              <button
                onClick={() => {
                  setSelectedCompanyId(null);
                  setSelectedBrandId(null);
                }}
                className={`font-semibold transition ${
                  !selectedCompanyId ? 'text-teal-400 font-bold' : 'hover:text-white'
                }`}
              >
                1. All Companies
              </button>

              {activeCompany && (
                <>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                  <button
                    onClick={() => setSelectedBrandId(null)}
                    className={`font-semibold transition ${
                      !selectedBrandId ? 'text-teal-400 font-bold' : 'hover:text-white'
                    }`}
                  >
                    2. {activeCompany.name}
                  </button>
                </>
              )}

              {activeBrand && selectedBrandId && (
                <>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                  <span className="text-teal-400 font-bold">
                    3. {activeBrand.name} ({activeBrand.models.length} Models)
                  </span>
                </>
              )}
            </div>

            {/* LEVEL 1: Select Company */}
            {!selectedCompanyId && (
              <div className="space-y-3">
                {/* Category filters */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                  {categories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setCategoryFilter(cat)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap transition ${
                        categoryFilter === cat
                          ? 'bg-teal-600 text-white font-bold'
                          : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {filteredCompanies.map(company => {
                    const totalModels = company.brands.reduce((sum, b) => sum + b.models.length, 0);
                    const isCurrentMake = selectedProfile.brand.toLowerCase().includes(company.name.toLowerCase().split(' ')[0]);

                    return (
                      <div
                        key={company.id}
                        onClick={() => {
                          setSelectedCompanyId(company.id);
                          setSelectedBrandId(company.brands[0]?.id || null);
                        }}
                        className={`p-3.5 rounded-xl border transition cursor-pointer group flex flex-col justify-between ${
                          isCurrentMake
                            ? 'bg-slate-850 border-teal-500/40 ring-1 ring-teal-500/30'
                            : 'bg-slate-900/90 border-slate-800 hover:border-slate-700 hover:bg-slate-850'
                        }`}
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2 mb-1.5">
                            <div className="flex items-center gap-2">
                              <span className="text-xl">{company.icon}</span>
                              <div>
                                <h4 className="text-xs font-bold text-slate-100 group-hover:text-teal-300 transition">
                                  {company.name}
                                </h4>
                                <span className="text-[10px] text-slate-400">
                                  {company.country} • {company.brands.length} {company.brands.length === 1 ? 'brand' : 'divisions'}
                                </span>
                              </div>
                            </div>
                            <span className="text-[10px] bg-slate-800 text-teal-400 font-mono font-semibold px-2 py-0.5 rounded border border-slate-700 shrink-0">
                              {totalModels} EVs
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 line-clamp-2 mt-1">
                            {company.description}
                          </p>
                        </div>

                        <div className="flex items-center justify-between pt-2.5 mt-2.5 border-t border-slate-800/80 text-[11px]">
                          <span className="text-slate-400">{company.category}</span>
                          <span className="text-teal-400 font-semibold flex items-center gap-1 group-hover:translate-x-0.5 transition">
                            View Models <ChevronRight className="w-3.5 h-3.5" />
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* LEVEL 2 & 3: Select Brand/Division & Choose Car Model */}
            {activeCompany && (
              <div className="space-y-4">
                {/* Brand Tabs within Company */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                    {activeCompany.brands.map(brand => (
                      <button
                        key={brand.id}
                        onClick={() => setSelectedBrandId(brand.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition flex items-center gap-1.5 ${
                          activeBrand?.id === brand.id
                            ? 'bg-teal-600 text-white font-bold shadow-sm'
                            : 'bg-slate-850 text-slate-300 hover:text-white border border-slate-800'
                        }`}
                      >
                        <span>{brand.name}</span>
                        <span className="text-[10px] opacity-80 font-mono">
                          ({brand.models.length})
                        </span>
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => {
                      setSelectedCompanyId(null);
                      setSelectedBrandId(null);
                    }}
                    className="text-xs text-slate-400 hover:text-teal-400 flex items-center gap-1 shrink-0 ml-2"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" /> Change Company
                  </button>
                </div>

                {/* Models List for the Active Brand */}
                {activeBrand && (
                  <div className="space-y-2">
                    <p className="text-[11px] text-slate-400 italic">
                      {activeBrand.tagline}
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[380px] overflow-y-auto pr-1">
                      {activeBrand.models.map(model => {
                        const isSelected = selectedProfile.id === model.id;
                        return (
                          <div
                            key={model.id}
                            onClick={() => handleSelectModel(model)}
                            className={`p-3.5 rounded-xl border transition cursor-pointer ${
                              isSelected
                                ? 'bg-teal-500/10 border-teal-500/70 ring-1 ring-teal-500'
                                : 'bg-slate-900/90 border-slate-800 hover:border-slate-700 hover:bg-slate-850'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div>
                                <span className="text-[10px] text-slate-400 font-semibold uppercase">
                                  {model.brand}
                                </span>
                                <h4 className="text-xs sm:text-sm font-bold text-slate-100">
                                  {model.model}
                                </h4>
                              </div>
                              {isSelected ? (
                                <span className="text-[10px] bg-teal-500 text-slate-950 font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                                  <Check className="w-3 h-3 stroke-[3]" /> Selected
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  className="text-[10px] bg-slate-800 hover:bg-teal-600 hover:text-white text-slate-300 font-semibold px-2 py-0.5 rounded border border-slate-700 transition"
                                >
                                  Select This EV
                                </button>
                              )}
                            </div>

                            <div className="grid grid-cols-3 gap-1.5 text-center bg-slate-950/70 p-2 rounded-lg border border-slate-800/80 mb-2">
                              <div>
                                <span className="text-[9px] text-slate-500 block">Battery</span>
                                <span className="text-xs font-bold text-slate-200 font-mono">
                                  {model.batteryKwh} kWh
                                </span>
                              </div>
                              <div className="border-x border-slate-800/80">
                                <span className="text-[9px] text-slate-500 block">DC Max</span>
                                <span className="text-xs font-bold text-teal-400 font-mono">
                                  {model.maxDcKw} kW
                                </span>
                              </div>
                              <div>
                                <span className="text-[9px] text-slate-500 block">Range</span>
                                <span className="text-xs font-bold text-sky-400 font-mono">
                                  {model.rangeKm} km
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                              <span className="truncate">Plugs: {model.supportedConnectors.join(', ')}</span>
                              <span className="text-slate-500 font-mono text-[10px]">
                                10-80% in ~{Math.round((model.batteryKwh * 0.7 / (model.maxDcKw || 30)) * 60)}m
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Highway EV Journey Planner */}
      <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-teal-400" />
            <h3 className="text-xs font-bold text-slate-100">
              Highway Journey Stopover Planner
            </h3>
          </div>
          <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
            Based on {selectedProfile.model}
          </span>
        </div>

        {/* Quick Corridor Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {quickRoutes.map(qr => (
            <button
              key={qr.name}
              onClick={() => {
                setTripOrigin(qr.origin);
                setTripDestination(qr.dest);
                setTripDistanceKm(qr.dist);
                setIsCalculated(true);
              }}
              className="text-left p-2 rounded-xl bg-slate-950/70 hover:bg-slate-800/80 border border-slate-800 transition text-[11px]"
            >
              <p className="font-bold text-slate-200 truncate">{qr.name}</p>
              <p className="text-[10px] text-teal-400 font-mono">{qr.dist} km</p>
            </button>
          ))}
        </div>

        {/* Origin & Destination Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
          <div>
            <label className="text-[10px] font-semibold text-slate-400 block mb-1">
              Start Location
            </label>
            <input
              type="text"
              value={tripOrigin}
              onChange={(e) => setTripOrigin(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs px-3 py-1.5 rounded-xl focus:ring-1 focus:ring-teal-500 outline-none"
            />
          </div>
          <div>
            <label className="text-[10px] font-semibold text-slate-400 block mb-1">
              Destination City / Highway
            </label>
            <input
              type="text"
              value={tripDestination}
              onChange={(e) => setTripDestination(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs px-3 py-1.5 rounded-xl focus:ring-1 focus:ring-teal-500 outline-none"
            />
          </div>
        </div>

        {/* Live Corridor Navigation Launch Button */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-950/50 p-3 rounded-xl border border-slate-800/80">
          <div>
            <span className="text-xs font-bold text-slate-200 block">
              Estimated Driving Distance: {tripDistanceKm} km
            </span>
            <p className="text-[10px] text-slate-400">
              Your {selectedProfile.model} requires{' '}
              <strong className="text-teal-400">{stopsNeeded} charging stop{stopsNeeded === 1 ? '' : 's'}</strong> on this route.
            </p>
          </div>

          <button
            onClick={() => onOpenEnRouteNavModal && onOpenEnRouteNavModal(tripDestination)}
            className="w-full sm:w-auto flex items-center justify-center gap-1.5 bg-teal-600 hover:bg-teal-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm"
          >
            <span>Plot Journey on Live Map</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
