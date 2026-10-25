import React, { useState } from 'react';
import { Truck, Warehouse, ShieldAlert } from 'lucide-react';

export default function ImageWithFallback({
  src,
  alt,
  type = 'truck', // 'truck' | 'warehouse' | 'fleet'
  className = '',
  overlayClassName = ''
}) {
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Fallback vector illustrations for offline or broken network
  const renderFallback = () => {
    if (type === 'warehouse') {
      return (
        <div className={`w-full h-full min-h-[300px] flex flex-col items-center justify-center bg-gradient-to-br from-[#0F2A44] to-[#091827] text-slate-400 p-8 border border-[#1E3D60] rounded-2xl ${className}`}>
          <div className="w-16 h-16 rounded-2xl bg-[#152E4A] flex items-center justify-center text-[#F59E0B] mb-4 border border-[#1E3D60]">
            <Warehouse className="w-8 h-8" />
          </div>
          <p className="text-white font-semibold text-lg text-center">B2B Cargo & Warehouse Hubs</p>
          <p className="text-xs text-slate-400 text-center mt-1 max-w-sm">
            Connecting regional distribution centers and shared freight corridors across commercial belts.
          </p>
        </div>
      );
    }

    return (
      <div className={`w-full h-full min-h-[300px] flex flex-col items-center justify-center bg-gradient-to-br from-[#0F2A44] via-[#11253B] to-[#091827] text-slate-400 p-8 border border-[#1E3D60] rounded-2xl ${className}`}>
        <div className="w-16 h-16 rounded-2xl bg-[#152E4A] flex items-center justify-center text-[#F59E0B] mb-4 border border-[#1E3D60]">
          <Truck className="w-8 h-8" />
        </div>
        <p className="text-white font-semibold text-lg text-center">Commercial Freight Transport</p>
        <p className="text-xs text-slate-400 text-center mt-1 max-w-sm">
          Optimized container and trailer capacity on major freight routes.
        </p>
      </div>
    );
  };

  if (hasError) {
    return renderFallback();
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Loading placeholder skeleton */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-[#11253B] animate-pulse flex items-center justify-center text-slate-500">
          <Truck className="w-8 h-8 opacity-40 animate-bounce" />
        </div>
      )}

      <img
        src={src}
        alt={alt}
        loading="lazy"
        onLoad={() => setIsLoaded(true)}
        onError={() => setHasError(true)}
        className={`w-full h-full object-cover transition-opacity duration-700 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* Dark overlay for text contrast */}
      {overlayClassName && <div className={overlayClassName} />}
    </div>
  );
}
