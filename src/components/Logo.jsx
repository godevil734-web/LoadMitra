import React from 'react';

export default function Logo({ size = 'default', showTagline = true, theme = 'dark', className = '' }) {
  const isSmall = size === 'small';
  const isLightMode = theme === 'light';

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* Live Freight Network Brand Mark */}
      <div className="relative flex items-center justify-center shrink-0">
        <svg
          className={`${isSmall ? 'w-8 h-8' : 'w-9 h-9'} shrink-0`}
          viewBox="0 0 40 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          {/* Carbon Black structural frame */}
          <rect
            x="1.5"
            y="1.5"
            width="37"
            height="37"
            rx="6"
            fill={isLightMode ? '#171717' : '#1F1F1F'}
            stroke={isLightMode ? '#2E2E2E' : '#333333'}
            strokeWidth="1.5"
          />
          {/* Route Grid lines */}
          <line x1="8" y1="20" x2="32" y2="20" stroke="#333333" strokeWidth="1" strokeDasharray="2 2" />
          <line x1="20" y1="8" x2="20" y2="32" stroke="#333333" strokeWidth="1" strokeDasharray="2 2" />
          {/* Highway Logistics Corridor Path */}
          <path
            d="M9 29 L18 13 L26 23 L32 11"
            stroke="#F28C28"
            strokeWidth="2.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Waypoint Nodes */}
          <circle cx="9" cy="29" r="2.5" fill="#F5F0E6" stroke="#171717" strokeWidth="1" />
          <circle cx="18" cy="13" r="2" fill="#F28C28" />
          <circle cx="26" cy="23" r="2" fill="#F5F0E6" />
          <circle cx="32" cy="11" r="2.75" fill="#F28C28" stroke="#171717" strokeWidth="1" />
          {/* Directional Terminal Indicator */}
          <path
            d="M29 11 H32.5 V14.5"
            stroke="#F28C28"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* Wordmark & Uppercase Operational Tagline */}
      <div className="flex flex-col leading-none">
        <div className="flex items-center tracking-tight">
          <span
            className={`${
              isSmall ? 'text-base' : 'text-lg'
            } font-extrabold tracking-tight ${isLightMode ? 'text-[#171717]' : 'text-[#F5F0E6]'}`}
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            LOAD
          </span>
          <span
            className={`${
              isSmall ? 'text-base' : 'text-lg'
            } font-black text-[#F28C28] tracking-tight ml-0.5`}
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            MITRA
          </span>
        </div>
        {showTagline && (
          <span
            className={`text-[9px] font-mono uppercase tracking-[0.15em] font-semibold mt-0.5 hidden sm:inline-block ${
              isLightMode ? 'text-[#737373]' : 'text-[#A3A3A3]'
            }`}
          >
            LIVE FREIGHT NETWORK
          </span>
        )}
      </div>
    </div>
  );
}
