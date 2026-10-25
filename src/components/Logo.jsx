import React from 'react';

export default function Logo({ size = 'default', showTagline = true, className = '' }) {
  const isSmall = size === 'small';

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Brand Icon Mark */}
      <div className="relative flex items-center justify-center">
        <svg
          className={`${isSmall ? 'w-8 h-8' : 'w-10 h-10'} shrink-0`}
          viewBox="0 0 44 44"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          {/* Rounded Hexagonal / Shield Base */}
          <rect
            x="2"
            y="2"
            width="40"
            height="40"
            rx="10"
            fill="#0F2A44"
            stroke="#1E3D60"
            strokeWidth="1.5"
          />
          {/* Converging Highway Logistics Lines */}
          <path
            d="M10 32 L20 14 L28 24 L34 12"
            stroke="#F59E0B"
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Waypoint Nodes */}
          <circle cx="10" cy="32" r="2.8" fill="#FAFAF7" />
          <circle cx="20" cy="14" r="2.2" fill="#38BDF8" />
          <circle cx="28" cy="24" r="2.2" fill="#38BDF8" />
          <circle cx="34" cy="12" r="3" fill="#F59E0B" />
          {/* Small directional arrowhead */}
          <path
            d="M31 11.5 L34.5 11.5 L34.5 15"
            stroke="#F59E0B"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* Wordmark & Optional Tagline */}
      <div className="flex flex-col leading-tight">
        <div className="flex items-center font-extrabold tracking-tight text-white">
          <span className={`${isSmall ? 'text-lg' : 'text-xl'} font-bold text-white tracking-tight`}>
            Route
          </span>
          <span className={`${isSmall ? 'text-lg' : 'text-xl'} font-extrabold text-[#F59E0B] tracking-tight`}>
            Wise
          </span>
        </div>
        {showTagline && (
          <span className="text-[11px] font-medium text-slate-400 tracking-wide hidden sm:inline-block">
            Smart Logistics. Better Journeys.
          </span>
        )}
      </div>
    </div>
  );
}
