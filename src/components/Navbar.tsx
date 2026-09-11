import React from 'react';
import { Zap, Filter, Compass, Car, Navigation, Sparkles, Sun, Moon } from 'lucide-react';
import { EVProfile, AppTheme } from '../types';
import { FALLBACK_LOCATIONS } from '../services/geoService';

interface NavbarProps {
  secondsAgo: number;
  isFilterOpen: boolean;
  setIsFilterOpen: (open: boolean) => void;
  activeFiltersCount: number;
  selectedProfile: EVProfile;
  onOpenProfile: () => void;
  currentCity: string;
  onSelectCity: (lat: number, lng: number, name: string) => void;
  onRefreshTelemetry: () => void;
  monthlyUses: number;
  onOpenOffers: () => void;
  onOpenRouteNav: () => void;
  theme: AppTheme;
  onToggleTheme: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  secondsAgo,
  setIsFilterOpen,
  activeFiltersCount,
  selectedProfile,
  onOpenProfile,
  currentCity,
  onSelectCity,
  onRefreshTelemetry,
  monthlyUses,
  onOpenOffers,
  onOpenRouteNav,
  theme,
  onToggleTheme
}) => {
  const isDark = theme === 'dark';

  return (
    <header className={`flex items-center justify-between px-3.5 sm:px-5 py-2.5 backdrop-blur-md border-b z-30 shrink-0 transition-colors duration-200 ${
      isDark 
        ? 'bg-[#0f172a]/95 border-slate-800 text-slate-100' 
        : 'bg-white/95 border-slate-200 text-slate-800 shadow-xs'
    }`}>
      {/* Brand Identity */}
      <div className="flex items-center gap-2.5">
        <img
          src="/chargemate-icon.jpg"
          alt="ChargeMate Logo"
          className="w-8 h-8 rounded-xl object-cover shadow-sm border border-slate-700/40"
          referrerPolicy="no-referrer"
        />
        <div>
          <div className="flex items-center gap-1.5">
            <span className={`text-sm sm:text-base font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              ChargeMate
            </span>
            <span className="text-[10px] bg-teal-500/15 text-teal-400 font-mono font-semibold px-1.5 py-0.5 rounded border border-teal-500/25">
              Pan-India
            </span>
          </div>
          <p className={`text-[10px] hidden xs:block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            EV Discovery, Journey Routing & Booking
          </p>
        </div>
      </div>

      {/* Action Controls */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* En-Route EV Charger Navigation Button */}
        <button
          onClick={onOpenRouteNav}
          className="flex items-center gap-1.5 bg-teal-500/15 hover:bg-teal-500/25 border border-teal-500/35 text-teal-300 px-2.5 py-1.5 rounded-lg text-xs font-bold transition shadow-xs"
          title="Plan route navigation with EV charging stops"
        >
          <Navigation className="w-3.5 h-3.5 text-teal-400" />
          <span className="hidden sm:inline">En-Route Nav</span>
        </button>

        {/* Club 10+ Offers Button */}
        <button
          onClick={onOpenOffers}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition border ${
            isDark 
              ? 'bg-sky-500/15 hover:bg-sky-500/25 border-sky-500/30 text-sky-300' 
              : 'bg-sky-50 hover:bg-sky-100 border-sky-200 text-sky-700'
          }`}
          title="Club 10+ Monthly Offers & Loyalty"
        >
          <Sparkles className="w-3.5 h-3.5 text-sky-400" />
          <span className="hidden sm:inline">Club 10+</span>
          <span className={`text-[10px] font-mono px-1 py-0.2 rounded ${
            isDark ? 'bg-sky-500/20 text-sky-300' : 'bg-sky-100 text-sky-800'
          }`}>
            {monthlyUses}/10
          </span>
        </button>

        {/* City / Location Picker Quick Dropdown */}
        <div className="relative group">
          <select
            value={currentCity}
            onChange={(e) => {
              const loc = FALLBACK_LOCATIONS.find(l => l.name === e.target.value);
              if (loc) {
                onSelectCity(loc.lat, loc.lng, loc.name);
              }
            }}
            aria-label="Select location"
            className={`text-xs px-2.5 py-1.5 rounded-lg border focus:outline-none focus:ring-1 focus:ring-teal-500 max-w-[110px] sm:max-w-[155px] truncate cursor-pointer transition ${
              isDark 
                ? 'bg-slate-800 hover:bg-slate-750 text-slate-200 border-slate-700/80' 
                : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
            }`}
          >
            <option value="Live GPS">📍 Live GPS</option>
            {FALLBACK_LOCATIONS.map(loc => (
              <option key={loc.name} value={loc.name}>
                📍 {loc.city} ({loc.name.split(' ')[0]})
              </option>
            ))}
          </select>
        </div>

        {/* Active EV Chip */}
        <button
          onClick={onOpenProfile}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs transition ${
            isDark 
              ? 'bg-slate-800 hover:bg-slate-750 border-slate-700 text-slate-200' 
              : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800'
          }`}
          title="Selected Vehicle Profile"
        >
          <Car className="w-3.5 h-3.5 text-teal-400" />
          <span className="text-[11px] font-medium hidden md:inline">{selectedProfile.model.split(' ')[0]}</span>
        </button>

        {/* Filters Toggle Button */}
        <button
          onClick={() => setIsFilterOpen(true)}
          aria-label="Open filter settings"
          className={`relative p-2 rounded-lg border transition ${
            isDark 
              ? 'bg-slate-800 hover:bg-slate-750 border-slate-700 text-slate-200' 
              : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800'
          }`}
        >
          <Filter className="w-4 h-4" />
          {activeFiltersCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-teal-500 text-slate-950 text-[10px] font-bold rounded-full flex items-center justify-center">
              {activeFiltersCount}
            </span>
          )}
        </button>

        {/* Subtle Separator */}
        <div className={`h-5 w-px ${isDark ? 'bg-slate-800' : 'bg-slate-200'} mx-0.5`} />

        {/* Theme Comfort Mode Switcher (Moved away from En-Route Nav to avoid any overlap) */}
        <button
          onClick={onToggleTheme}
          aria-label={`Switch to ${isDark ? 'Light' : 'Dark'} theme`}
          className={`p-2 rounded-lg border transition shrink-0 ${
            isDark 
              ? 'bg-slate-800/90 hover:bg-slate-700 text-amber-300 border-slate-700' 
              : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
          }`}
          title={`Switch to ${isDark ? 'Light' : 'Dark'} mode`}
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>
    </header>
  );
};
