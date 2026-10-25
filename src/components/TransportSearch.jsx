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
      <div className="bg-[#0F2A44] border border-[#1E3D60] rounded-2xl p-5 sm:p-7 shadow-2xl backdrop-blur-md relative overflow-hidden">
        {/* Top Notice Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-5 border-b border-[#1E3D60]/70 gap-2">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]"></span>
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
              Find Transport & Vehicles
            </h2>
          </div>
          <div className="inline-flex items-center text-xs text-amber-200/90 bg-[#F59E0B]/10 px-2.5 py-1 rounded-md border border-[#F59E0B]/30">
            <Info className="w-3.5 h-3.5 mr-1.5 shrink-0 text-[#F59E0B]" />
            <span>Interactive Demo • Search Available Routes</span>
          </div>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSearch} noValidate>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-3 sm:gap-4 items-start">
            {/* Pickup Location */}
            <div className="lg:col-span-3">
              <label htmlFor="search-pickup" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Pickup City <span className="text-[#F59E0B]">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <MapPin className="w-4 h-4 text-[#38BDF8]" />
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
                  className={`w-full pl-10 pr-3 py-2.5 bg-[#091827] text-white text-sm rounded-xl border ${
                    errors.pickup ? 'border-rose-500 focus:ring-rose-500' : 'border-[#1E3D60] focus:border-[#F59E0B]'
                  } focus:outline-none focus:ring-1 focus:ring-[#F59E0B] placeholder-slate-500 transition-colors`}
                />
              </div>
              {errors.pickup && (
                <p className="mt-1 text-xs text-rose-400 flex items-center">
                  <AlertCircle className="w-3 h-3 mr-1 shrink-0" />
                  {errors.pickup}
                </p>
              )}
            </div>

            {/* Swap Button (Desktop only inline, mobile below) */}
            <div className="hidden lg:flex lg:col-span-1 justify-center pt-7">
              <button
                type="button"
                onClick={swapLocations}
                title="Swap Pickup and Destination"
                className="p-2 text-slate-400 hover:text-white bg-[#152E4A] hover:bg-[#1E3D60] rounded-lg border border-[#1E3D60] transition-colors focus:outline-none focus:ring-1 focus:ring-[#F59E0B]"
              >
                <ArrowRightLeft className="w-4 h-4" />
              </button>
            </div>

            {/* Destination */}
            <div className="lg:col-span-3">
              <label htmlFor="search-destination" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Delivery City <span className="text-[#F59E0B]">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <MapPin className="w-4 h-4 text-[#F59E0B]" />
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
                  className={`w-full pl-10 pr-3 py-2.5 bg-[#091827] text-white text-sm rounded-xl border ${
                    errors.destination ? 'border-rose-500 focus:ring-rose-500' : 'border-[#1E3D60] focus:border-[#F59E0B]'
                  } focus:outline-none focus:ring-1 focus:ring-[#F59E0B] placeholder-slate-500 transition-colors`}
                />
              </div>
              {errors.destination && (
                <p className="mt-1 text-xs text-rose-400 flex items-center">
                  <AlertCircle className="w-3 h-3 mr-1 shrink-0" />
                  {errors.destination}
                </p>
              )}
            </div>

            {/* Departure Date */}
            <div className="lg:col-span-2">
              <label htmlFor="search-date" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Pickup Date
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Calendar className="w-4 h-4 text-slate-400" />
                </div>
                <input
                  id="search-date"
                  type="date"
                  value={departureDate}
                  onChange={(e) => setDepartureDate(e.target.value)}
                  className="w-full pl-9 pr-2 py-2.5 bg-[#091827] text-white text-sm rounded-xl border border-[#1E3D60] focus:outline-none focus:border-[#F59E0B] focus:ring-1 focus:ring-[#F59E0B] transition-colors [color-scheme:dark]"
                />
              </div>
            </div>

            {/* Cargo Type */}
            <div className="lg:col-span-3">
              <label htmlFor="search-cargo" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Type of Goods <span className="text-[#F59E0B]">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Package className="w-4 h-4 text-slate-400" />
                </div>
                <select
                  id="search-cargo"
                  value={cargoType}
                  onChange={(e) => {
                    setCargoType(e.target.value);
                    if (errors.cargoType) setErrors({ ...errors, cargoType: null });
                  }}
                  className={`w-full pl-10 pr-8 py-2.5 bg-[#091827] text-white text-sm rounded-xl border ${
                    errors.cargoType ? 'border-rose-500 focus:ring-rose-500' : 'border-[#1E3D60] focus:border-[#F59E0B]'
                  } focus:outline-none focus:ring-1 focus:ring-[#F59E0B] transition-colors appearance-none`}
                >
                  <option value="">Select Type of Goods...</option>
                  {CARGO_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
                  <svg className="fill-current h-4 w-4" viewBox="0 0 20 20">
                    <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                  </svg>
                </div>
              </div>
              {errors.cargoType && (
                <p className="mt-1 text-xs text-rose-400 flex items-center">
                  <AlertCircle className="w-3 h-3 mr-1 shrink-0" />
                  {errors.cargoType}
                </p>
              )}
            </div>
          </div>

          {/* Submit Action Bar */}
          <div className="mt-5 pt-4 border-t border-[#1E3D60]/50 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-slate-400 flex items-center">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-2"></span>
              <span>Popular Routes: Gorakhpur–Lucknow • Lucknow–Kanpur • Varanasi–Gorakhpur</span>
            </div>

            <button
              type="submit"
              className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 text-sm font-bold text-[#091827] bg-[#F59E0B] hover:bg-[#D97706] rounded-xl transition-all shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-white"
            >
              <Search className="w-4 h-4 mr-2" />
              <span>Find Available Transport</span>
            </button>
          </div>
        </form>

        {/* Search Feedback / Demo Notification State */}
        {searchSubmitted && (
          <div className="mt-5 p-4 bg-[#11253B] border border-[#F59E0B]/40 rounded-xl animate-fadeIn">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start space-x-3">
                <CheckCircle className="w-5 h-5 text-[#F59E0B] shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Showing Available Routes: {pickup} → {destination}
                  </h3>
                  <p className="text-xs text-slate-300 mt-1">
                    Below are available transport listings along this route. To book a vehicle or register your goods, you can also use our quick sign-up form.
                  </p>
                  <div className="mt-2.5 flex flex-wrap items-center gap-2">
                    <a
                      href="#listings-section"
                      className="inline-flex items-center text-xs font-semibold text-[#F59E0B] hover:underline"
                    >
                      View Available Loads &amp; Vehicles Below ↓
                    </a>
                    <span className="text-slate-600">•</span>
                    <a
                      href="#pilot-section"
                      onClick={(e) => {
                        e.preventDefault();
                        if (onNavigateToPilot) onNavigateToPilot('shipper');
                      }}
                      className="inline-flex items-center text-xs font-semibold text-sky-400 hover:underline"
                    >
                      Register Your Route →
                    </a>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSearchSubmitted(false)}
                className="text-xs text-slate-400 hover:text-white"
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
