import React, { useState } from 'react';
import { MapPin, ArrowRightLeft, Calendar, Package, Search, AlertCircle, CheckCircle, Info } from 'lucide-react';
import { CARGO_TYPES } from '../data/sampleData';

export default function TransportSearch({ onSearchResults, onNavigateToPilot }) {
  const [pickup, setPickup] = useState('');
  const [destination, setDestination] = useState('');
  const [departureDate, setDepartureDate] = useState('');
  const [cargoType, setCargoType] = useState('');
  const [errors, setErrors] = useState({});
  const [searchSubmitted, setSearchSubmitted] = useState(false);

  const swapLocations = () => {
    const temp = pickup;
    setPickup(destination);
    setDestination(temp);
    if (errors.pickup || errors.destination) {
      setErrors({ ...errors, pickup: null, destination: null });
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!pickup.trim()) newErrors.pickup = 'Please enter a pickup location';
    if (!destination.trim()) newErrors.destination = 'Please enter a destination';
    if (pickup.trim() && destination.trim() && pickup.trim().toLowerCase() === destination.trim().toLowerCase()) {
      newErrors.destination = 'Destination cannot be identical to pickup';
    }
    if (!cargoType) newErrors.cargoType = 'Please select the type of goods';
    return newErrors;
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const validationErrors = validate();

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setSearchSubmitted(false);
      return;
    }

    setErrors({});
    setSearchSubmitted(true);

    if (onSearchResults) {
      onSearchResults({
        pickup: pickup.trim(),
        destination: destination.trim(),
        departureDate,
        cargoType
      });
    }
  };

  return (
    <div id="search-section" className="w-full scroll-mt-24">
      <div className="bg-[#171717] border border-[#2D2D2D] rounded-lg p-5 sm:p-6 shadow-xl relative overflow-hidden">
        {/* Top Notice Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-[#2D2D2D] gap-2">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-[#F28C28]"></span>
            <h2 className="text-sm sm:text-base font-mono font-bold uppercase tracking-wider text-white">
              CORRIDOR DISCOVERY • SEARCH NETWORK
            </h2>
          </div>
          <div className="inline-flex items-center text-[10px] font-mono uppercase tracking-wider text-[#F28C28] bg-[#F28C28]/10 px-2.5 py-1 rounded border border-[#F28C28]/30">
            <Info className="w-3.5 h-3.5 mr-1.5 shrink-0 text-[#F28C28]" />
            <span>DIRECT NETWORK INQUIRY • REAL-TIME DISCOVERY</span>
          </div>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSearch} noValidate>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-3 sm:gap-4 items-start">
            {/* Pickup Location */}
            <div className="lg:col-span-3">
              <label htmlFor="search-pickup" className="block text-[10px] font-mono font-bold text-[#A3A3A3] uppercase tracking-wider mb-1.5">
                ORIGIN / PICKUP CITY <span className="text-[#F28C28]">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#737373]">
                  <MapPin className="w-4 h-4 text-[#F5F0E6]" />
                </div>
                <input
                  id="search-pickup"
                  type="text"
                  placeholder="e.g. Gorakhpur, Lucknow, Kanpur"
                  value={pickup}
                  onChange={(e) => {
                    setPickup(e.target.value);
                    if (errors.pickup) setErrors({ ...errors, pickup: null });
                  }}
                  className={`w-full pl-9 pr-3 py-2 bg-[#1F1F1F] text-white text-xs rounded border ${
                    errors.pickup ? 'border-red-500 focus:ring-red-500' : 'border-[#2D2D2D] focus:border-[#F28C28]'
                  } focus:outline-none focus:ring-1 focus:ring-[#F28C28] placeholder-[#737373] transition-colors`}
                />
              </div>
              {errors.pickup && (
                <p className="mt-1 text-xs text-red-400 flex items-center">
                  <AlertCircle className="w-3 h-3 mr-1 shrink-0" />
                  {errors.pickup}
                </p>
              )}
            </div>

            {/* Swap Button (Desktop only inline, mobile below) */}
            <div className="hidden lg:flex lg:col-span-1 justify-center pt-6">
              <button
                type="button"
                onClick={swapLocations}
                title="Swap Pickup and Destination"
                className="p-2 text-[#A3A3A3] hover:text-white bg-[#1F1F1F] hover:bg-[#262626] rounded border border-[#2D2D2D] transition-colors focus:outline-none focus:ring-1 focus:ring-[#F28C28]"
              >
                <ArrowRightLeft className="w-3.5 h-3.5 text-[#F28C28]" />
              </button>
            </div>

            {/* Destination */}
            <div className="lg:col-span-3">
              <label htmlFor="search-destination" className="block text-[10px] font-mono font-bold text-[#A3A3A3] uppercase tracking-wider mb-1.5">
                DESTINATION CITY <span className="text-[#F28C28]">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#737373]">
                  <MapPin className="w-4 h-4 text-[#F28C28]" />
                </div>
                <input
                  id="search-destination"
                  type="text"
                  placeholder="e.g. Lucknow, Kanpur, Varanasi"
                  value={destination}
                  onChange={(e) => {
                    setDestination(e.target.value);
                    if (errors.destination) setErrors({ ...errors, destination: null });
                  }}
                  className={`w-full pl-9 pr-3 py-2 bg-[#1F1F1F] text-white text-xs rounded border ${
                    errors.destination ? 'border-red-500 focus:ring-red-500' : 'border-[#2D2D2D] focus:border-[#F28C28]'
                  } focus:outline-none focus:ring-1 focus:ring-[#F28C28] placeholder-[#737373] transition-colors`}
                />
              </div>
              {errors.destination && (
                <p className="mt-1 text-xs text-red-400 flex items-center">
                  <AlertCircle className="w-3 h-3 mr-1 shrink-0" />
                  {errors.destination}
                </p>
              )}
            </div>

            {/* Departure Date */}
            <div className="lg:col-span-2">
              <label htmlFor="search-date" className="block text-[10px] font-mono font-bold text-[#A3A3A3] uppercase tracking-wider mb-1.5">
                DISPATCH DATE
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#737373]">
                  <Calendar className="w-4 h-4 text-[#737373]" />
                </div>
                <input
                  id="search-date"
                  type="date"
                  value={departureDate}
                  onChange={(e) => setDepartureDate(e.target.value)}
                  className="w-full pl-9 pr-2 py-2 bg-[#1F1F1F] text-white text-xs rounded border border-[#2D2D2D] focus:outline-none focus:border-[#F28C28] focus:ring-1 focus:ring-[#F28C28] transition-colors [color-scheme:dark]"
                />
              </div>
            </div>

            {/* Cargo Type */}
            <div className="lg:col-span-3">
              <label htmlFor="search-cargo" className="block text-[10px] font-mono font-bold text-[#A3A3A3] uppercase tracking-wider mb-1.5">
                FREIGHT TYPE <span className="text-[#F28C28]">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#737373]">
                  <Package className="w-4 h-4 text-[#737373]" />
                </div>
                <select
                  id="search-cargo"
                  value={cargoType}
                  onChange={(e) => {
                    setCargoType(e.target.value);
                    if (errors.cargoType) setErrors({ ...errors, cargoType: null });
                  }}
                  className={`w-full pl-9 pr-8 py-2 bg-[#1F1F1F] text-white text-xs rounded border ${
                    errors.cargoType ? 'border-red-500 focus:ring-red-500' : 'border-[#2D2D2D] focus:border-[#F28C28]'
                  } focus:outline-none focus:ring-1 focus:ring-[#F28C28] transition-colors appearance-none`}
                >
                  <option value="">Select Freight Classification...</option>
                  {CARGO_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-[#737373]">
                  <svg className="fill-current h-3.5 w-3.5" viewBox="0 0 20 20">
                    <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                  </svg>
                </div>
              </div>
              {errors.cargoType && (
                <p className="mt-1 text-xs text-red-400 flex items-center">
                  <AlertCircle className="w-3 h-3 mr-1 shrink-0" />
                  {errors.cargoType}
                </p>
              )}
            </div>
          </div>

          {/* Submit Action Bar */}
          <div className="mt-4 pt-3.5 border-t border-[#2D2D2D] flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-[11px] font-mono text-[#737373] flex items-center">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-2"></span>
              <span>CORRIDORS: Gorakhpur–Lucknow (NH27) • Lucknow–Kanpur (NH27) • Varanasi–Gorakhpur</span>
            </div>

            <button
              type="submit"
              className="w-full sm:w-auto inline-flex items-center justify-center px-5 py-2 text-xs font-mono font-bold uppercase tracking-wider text-[#171717] bg-[#F28C28] hover:bg-[#DE7919] rounded transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-white"
            >
              <Search className="w-3.5 h-3.5 mr-2" />
              <span>SEARCH MATCHING CAPACITY</span>
            </button>
          </div>
        </form>

        {/* Search Feedback / Demo Notification State */}
        {searchSubmitted && (
          <div className="mt-4 p-3.5 bg-[#1F1F1F] border border-[#F28C28]/40 rounded animate-fadeIn">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start space-x-3">
                <CheckCircle className="w-4 h-4 text-[#F28C28] shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                    CORRIDOR MATCH AVAILABLE: {pickup} ➔ {destination}
                  </h3>
                  <p className="text-xs text-[#A3A3A3] mt-1">
                    Active freight corridors detected for this route with available backhaul and shared-space vehicles.
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs">
                    <a
                      href="#listings-section"
                      className="inline-flex items-center font-mono text-[11px] font-bold uppercase text-[#F28C28] hover:underline"
                    >
                      View Corridor Listings Below ↓
                    </a>
                    <span className="text-[#3D3D3D]">•</span>
                    <a
                      href="#pilot-section"
                      onClick={(e) => {
                        e.preventDefault();
                        if (onNavigateToPilot) onNavigateToPilot('shipper');
                      }}
                      className="inline-flex items-center font-mono text-[11px] font-bold uppercase text-[#F5F0E6] hover:underline"
                    >
                      Post This Consignment →
                    </a>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSearchSubmitted(false)}
                className="text-xs text-[#737373] hover:text-white"
                aria-label="Dismiss message"
              >
                ✕
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
