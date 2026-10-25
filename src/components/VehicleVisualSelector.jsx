import React, { useState, useEffect } from 'react';
import {
  Check,
  Truck,
  Plus,
  Trash2,
  Info,
  Sliders,
  ChevronDown,
  Layers,
  Sparkles,
  Weight
} from 'lucide-react';
import { VEHICLE_CATEGORIES, VEHICLE_GROUPS } from '../data/vehicleData';
import VehicleSvgIcon from './VehicleSvgIcon';

export default function VehicleVisualSelector({
  value, // string e.g. 'Mini Truck / Tata Ace'
  onChange, // (vehicleType: string, capacityStr: string, metadata: object) => void
  initialCapacity,
  error,
}) {
  const [selectedGroupId, setSelectedGroupId] = useState('All Vehicles (12)');
  const [selectedType, setSelectedType] = useState(() => value || 'Closed Container Truck');
  const [configuredCapacity, setConfiguredCapacity] = useState(() => {
    if (initialCapacity && !isNaN(parseFloat(initialCapacity))) {
      return parseFloat(initialCapacity);
    }
    const found = VEHICLE_CATEGORIES.find((v) => v.name === value);
    return found ? found.defaultCapacity : 9.5;
  });

  // Multi-vehicle fleet support
  const [isMultiFleetEnabled, setIsMultiFleetEnabled] = useState(false);
  const [additionalVehicles, setAdditionalVehicles] = useState([]);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'compact'

  // Image loading errors tracking for graceful fallback
  const [imageErrors, setImageErrors] = useState({});

  const handleImageError = (id) => {
    setImageErrors((prev) => ({ ...prev, [id]: true }));
  };

  // Find currently active vehicle object
  const activeVehicle = VEHICLE_CATEGORIES.find((v) => v.name === selectedType) || VEHICLE_CATEGORIES[6];

  // Filter cards by category tab
  const filteredVehicles = VEHICLE_CATEGORIES.filter((v) => {
    if (selectedGroupId === 'All Vehicles (12)') return true;
    return v.category === selectedGroupId;
  });

  // Notify parent of state changes
  useEffect(() => {
    if (!selectedType) return;
    const capacityText = `${configuredCapacity} Tons (Approximate, Configured)`;
    const multiCategories = [
      selectedType,
      ...additionalVehicles.map((v) => v.name),
    ];
    const fleetPayload = [
      { type: selectedType, capacity: configuredCapacity },
      ...additionalVehicles,
    ];

    if (onChange) {
      onChange(selectedType, capacityText, {
        actualCapacity: configuredCapacity,
        capacityUnit: 'Tons',
        vehicleCategories: multiCategories,
        multiVehicleFleet: fleetPayload,
      });
    }
  }, [selectedType, configuredCapacity, additionalVehicles, onChange]);

  const handleSelectPrimary = (vehicle) => {
    setSelectedType(vehicle.name);
    // Adjust default capacity if outside the target range
    if (configuredCapacity < vehicle.minCapacity || configuredCapacity > vehicle.maxCapacity) {
      setConfiguredCapacity(vehicle.defaultCapacity);
    }
  };

  const handleCapacityStep = (delta) => {
    setConfiguredCapacity((prev) => {
      const next = Math.max(0.25, Math.min(100, parseFloat((prev + delta).toFixed(2))));
      return next;
    });
  };

  const addSecondaryVehicle = (vehicle) => {
    if (additionalVehicles.some((v) => v.name === vehicle.name) || selectedType === vehicle.name) {
      return;
    }
    setAdditionalVehicles((prev) => [
      ...prev,
      {
        id: `${vehicle.id}-${Date.now()}`,
        name: vehicle.name,
        capacity: vehicle.defaultCapacity,
      },
    ]);
  };

  const removeSecondaryVehicle = (index) => {
    setAdditionalVehicles((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      {/* Selector Header & Category Filter Pills */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#1E3D60]/70">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Vehicle Type &amp; Body Specification <span className="text-[#F59E0B]">*</span>
            </span>
            <span className="text-[10px] bg-amber-500/15 text-[#F59E0B] border border-amber-500/30 px-2 py-0.5 rounded-full font-bold">
              12 Commercial Types
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Select your vehicle model to match compatible corridor demands.
          </p>
        </div>

        {/* View Switcher: Grid vs Compact */}
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setViewMode(viewMode === 'grid' ? 'compact' : 'grid')}
            className="px-2.5 py-1 text-xs text-slate-300 hover:text-white bg-[#091827] border border-[#1E3D60] rounded-lg transition-colors flex items-center space-x-1"
          >
            <Sliders className="w-3.5 h-3.5 text-[#F59E0B]" />
            <span>{viewMode === 'grid' ? 'Compact View' : 'Card View'}</span>
          </button>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap items-center gap-1.5" role="tablist">
        {VEHICLE_GROUPS.map((group) => (
          <button
            key={group}
            type="button"
            role="tab"
            aria-selected={selectedGroupId === group}
            onClick={() => setSelectedGroupId(group)}
            className={`px-3 py-1 text-xs font-medium rounded-full transition-all ${
              selectedGroupId === group
                ? 'bg-[#F59E0B] text-[#091827] font-bold shadow-sm'
                : 'bg-[#091827] text-slate-300 hover:bg-[#152E4A] hover:text-white border border-[#1E3D60]'
            }`}
          >
            {group}
          </button>
        ))}
      </div>

      {/* COMPACT DROPDOWN VIEW (Accessible Fallback) */}
      {viewMode === 'compact' && (
        <div className="bg-[#091827] p-4 rounded-xl border border-[#1E3D60] space-y-3">
          <label className="block text-xs text-slate-300 font-medium">
            Select Category from Dropdown:
          </label>
          <div className="relative">
            <select
              value={selectedType}
              onChange={(e) => {
                const found = VEHICLE_CATEGORIES.find((v) => v.name === e.target.value);
                if (found) handleSelectPrimary(found);
              }}
              className="w-full px-3.5 py-2.5 bg-[#0F2A44] text-white text-sm rounded-xl border border-[#1E3D60] focus:outline-none focus:border-[#F59E0B] appearance-none"
            >
              {VEHICLE_CATEGORIES.map((v) => (
                <option key={v.id} value={v.name}>
                  {v.name} ({v.capacityRange}) — {v.category}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 absolute right-3.5 top-3.5 text-slate-400 pointer-events-none" />
          </div>
        </div>
      )}

      {/* RESPONSIVE VISUAL IMAGE CARDS GRID (12 Vehicle Categories) */}
      {viewMode === 'grid' && (
        <div
          role="radiogroup"
          aria-label="Select Vehicle Type"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 max-h-[520px] overflow-y-auto pr-1 custom-scrollbar focus:outline-none"
        >
          {filteredVehicles.map((vehicle) => {
            const isSelected = selectedType === vehicle.name;
            const hasImgError = imageErrors[vehicle.id];

            return (
              <div
                key={vehicle.id}
                role="radio"
                tabIndex={0}
                aria-checked={isSelected}
                onClick={() => handleSelectPrimary(vehicle)}
                onKeyDown={(e) => {
                  if (e.key === ' ' || e.key === 'Enter') {
                    e.preventDefault();
                    handleSelectPrimary(vehicle);
                  }
                }}
                className={`relative rounded-xl p-3.5 flex flex-col justify-between cursor-pointer transition-all duration-200 border text-left group ${
                  isSelected
                    ? 'bg-[#152E4A] border-[#F59E0B] ring-2 ring-[#F59E0B]/50 shadow-lg shadow-amber-500/10'
                    : 'bg-[#091827]/80 hover:bg-[#0F2A44] border-[#1E3D60] hover:border-[#2A4F78]'
                }`}
              >
                {/* Selected Checkmark Badge */}
                {isSelected && (
                  <div className="absolute top-2.5 right-2.5 z-10 w-6 h-6 rounded-full bg-[#F59E0B] text-[#091827] flex items-center justify-center shadow-md animate-scaleIn">
                    <Check className="w-4 h-4 stroke-[3]" />
                  </div>
                )}

                {/* Card Top: Image / Illustration Header */}
                <div>
                  <div className="relative w-full h-28 rounded-lg overflow-hidden bg-gradient-to-br from-[#0F2A44] to-[#091827] border border-[#1E3D60]/60 mb-3 flex items-center justify-center">
                    {!hasImgError ? (
                      <img
                        src={vehicle.photoUrl}
                        alt={vehicle.name}
                        loading="lazy"
                        onError={() => handleImageError(vehicle.id)}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      /* Graceful Local SVG Fallback Silhouette */
                      <div
                        className={`w-full h-full flex flex-col items-center justify-center p-2 bg-gradient-to-br ${vehicle.fallbackColor}`}
                      >
                        <VehicleSvgIcon
                          type={vehicle.id}
                          className="w-20 h-16 text-slate-200 drop-shadow-md"
                        />
                      </div>
                    )}

                    {/* Gradient Overlay for text readability */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#091827]/90 via-transparent to-black/20 pointer-events-none" />

                    {/* Segment Pill on image */}
                    <span className="absolute bottom-2 left-2 text-[10px] font-bold uppercase tracking-wider text-white bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded border border-white/10">
                      {vehicle.badge}
                    </span>
                  </div>

                  {/* Vehicle Name & Tagline */}
                  <h4 className="text-sm font-bold text-white leading-tight group-hover:text-[#F59E0B] transition-colors">
                    {vehicle.name}
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{vehicle.tagline}</p>
                </div>

                {/* Card Bottom: Capacity Range & Common Cargo */}
                <div className="mt-3 pt-2.5 border-t border-[#1E3D60]/60 space-y-2">
                  {/* Capacity Range Indicator */}
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center">
                      <Weight className="w-3 h-3 mr-1 text-[#F59E0B]" />
                      Capacity
                    </span>
                    <span className="font-bold text-[#F59E0B] bg-[#091827] px-2 py-0.5 rounded border border-amber-500/20 text-[11px]">
                      {vehicle.capacityRange}
                    </span>
                  </div>

                  {/* Cargo Tags Preview */}
                  <div className="flex flex-wrap gap-1">
                    {vehicle.commonCargo.slice(0, 2).map((cargo, i) => (
                      <span
                        key={i}
                        className="text-[10px] text-slate-300 bg-[#0F2A44] px-1.5 py-0.5 rounded border border-[#1E3D60]"
                      >
                        {cargo}
                      </span>
                    ))}
                    {vehicle.commonCargo.length > 2 && (
                      <span className="text-[10px] text-slate-400 px-1 py-0.5">
                        +{vehicle.commonCargo.length - 2} more
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Error message */}
      {error && <p className="text-xs text-rose-400 font-medium">{error}</p>}

      {/* CONFIGURABLE CAPACITY ADJUSTMENT PANEL (Requirement 2 & 4) */}
      <div className="bg-[#091827] border border-[#1E3D60] rounded-xl p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-lg bg-[#152E4A] border border-[#1E3D60] flex items-center justify-center text-[#F59E0B]">
              <Truck className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">
                Selected: <span className="text-[#F59E0B]">{activeVehicle.name}</span>
              </p>
              <p className="text-[11px] text-slate-400">
                Typical range: {activeVehicle.capacityRange} • {activeVehicle.bodyType}
              </p>
            </div>
          </div>

          {/* Stepper + Input */}
          <div className="flex items-center space-x-2 self-start sm:self-auto">
            <span className="text-xs font-semibold text-slate-300 whitespace-nowrap">
              Configured Payload:
            </span>
            <div className="flex items-center bg-[#0F2A44] border border-[#1E3D60] rounded-lg p-1">
              <button
                type="button"
                onClick={() => handleCapacityStep(-0.5)}
                className="w-7 h-7 bg-[#152E4A] hover:bg-[#1E3D60] text-white rounded font-bold text-xs flex items-center justify-center"
                title="Decrease 0.5 Ton"
              >
                -
              </button>
              <input
                type="number"
                step="0.1"
                min="0.1"
                max="100"
                value={configuredCapacity}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  if (!isNaN(val)) setConfiguredCapacity(val);
                }}
                className="w-14 text-center bg-transparent text-white font-bold text-xs focus:outline-none"
              />
              <span className="text-[11px] font-semibold text-[#F59E0B] pr-1.5">Tons</span>
              <button
                type="button"
                onClick={() => handleCapacityStep(0.5)}
                className="w-7 h-7 bg-[#152E4A] hover:bg-[#1E3D60] text-white rounded font-bold text-xs flex items-center justify-center"
                title="Increase 0.5 Ton"
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* Informative Disclaimer */}
        <div className="flex items-start space-x-2 pt-2 border-t border-[#1E3D60]/60 text-[11px] text-slate-400">
          <Info className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
          <span>
            <strong className="text-slate-300">Approximate &amp; Configurable:</strong> Capacity shown is an estimate based on commercial chassis standards. You can configure your exact registered payload above.
          </span>
        </div>
      </div>

      {/* MULTI-VEHICLE FLEET SUPPORT (Requirement 6) */}
      <div className="pt-2">
        {!isMultiFleetEnabled ? (
          <button
            type="button"
            onClick={() => setIsMultiFleetEnabled(true)}
            className="text-xs font-semibold text-[#F59E0B] hover:text-amber-300 transition-colors inline-flex items-center space-x-1.5"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span>I operate multiple vehicle types / commercial fleet</span>
          </button>
        ) : (
          <div className="bg-[#0F2A44] border border-[#1E3D60] rounded-xl p-4 space-y-3 animate-fadeIn">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center space-x-1.5">
                <Layers className="w-4 h-4 text-[#F59E0B]" />
                <span>Multi-Vehicle Fleet Configurations</span>
              </span>
              <button
                type="button"
                onClick={() => {
                  setIsMultiFleetEnabled(false);
                  setAdditionalVehicles([]);
                }}
                className="text-xs text-slate-400 hover:text-white"
              >
                Clear Extra Vehicles
              </button>
            </div>

            {/* List of secondary vehicles */}
            {additionalVehicles.length > 0 && (
              <div className="space-y-2">
                {additionalVehicles.map((sec, idx) => (
                  <div
                    key={sec.id}
                    className="flex items-center justify-between bg-[#091827] px-3 py-2 rounded-lg border border-[#1E3D60] text-xs"
                  >
                    <span className="font-semibold text-white">
                      {sec.name} ({sec.capacity} Tons)
                    </span>
                    <button
                      type="button"
                      onClick={() => removeSecondaryVehicle(idx)}
                      className="p-1 text-slate-400 hover:text-rose-400"
                      title="Remove Vehicle"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Dropdown to add secondary vehicle */}
            <div className="flex items-center space-x-2 pt-1">
              <select
                id="add-vehicle-select"
                className="flex-1 px-3 py-2 bg-[#091827] text-white text-xs rounded-lg border border-[#1E3D60] focus:outline-none"
                defaultValue=""
                onChange={(e) => {
                  const found = VEHICLE_CATEGORIES.find((v) => v.name === e.target.value);
                  if (found) {
                    addSecondaryVehicle(found);
                    e.target.value = '';
                  }
                }}
              >
                <option value="" disabled>
                  + Add another vehicle category to your fleet...
                </option>
                {VEHICLE_CATEGORIES.filter(
                  (v) => v.name !== selectedType && !additionalVehicles.some((sec) => sec.name === v.name)
                ).map((v) => (
                  <option key={v.id} value={v.name}>
                    {v.name} ({v.capacityRange})
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
