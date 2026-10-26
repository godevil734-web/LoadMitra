import React from 'react';

export default function RouteAnimation() {
  return (
    <div className="w-full bg-[#1A1A1A] border border-[#2D2D2D] rounded p-3 sm:p-4 shadow-md">
      <div className="flex items-center justify-between mb-2 pb-2 border-b border-[#2D2D2D]">
        <div className="flex items-center space-x-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#F28C28] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#F28C28]"></span>
          </span>
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#F5F0E6]">
            CORRIDOR NH27 • ROUTE SPECIFICATION
          </span>
        </div>
        <span className="text-[9px] font-mono uppercase text-[#F28C28] bg-[#F28C28]/10 px-2 py-0.5 rounded border border-[#F28C28]/30">
          ILLUSTRATIVE FREIGHT PATH
        </span>
      </div>

      {/* SVG Path with Animated Truck */}
      <div className="relative py-1 px-1">
        <svg
          viewBox="0 0 460 70"
          className="w-full h-auto overflow-visible"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-label="Illustrative corridor route from Gorakhpur to Lucknow"
        >
          {/* Base track */}
          <path
            d="M 30 35 Q 150 12, 240 35 T 430 35"
            stroke="#2E2E2E"
            strokeWidth="3.5"
            strokeLinecap="round"
          />

          {/* Dotted active route path */}
          <path
            id="heroRouteTrack"
            d="M 30 35 Q 150 12, 240 35 T 430 35"
            stroke="#F28C28"
            strokeWidth="2.5"
            strokeDasharray="6 4"
            strokeLinecap="round"
            className="opacity-90"
          />

          {/* Origin Node: Gorakhpur */}
          <circle cx="30" cy="35" r="6" fill="#171717" stroke="#F5F0E6" strokeWidth="2" />
          <circle cx="30" cy="35" r="2.5" fill="#F5F0E6" />

          {/* Midpoint Corridor waypoint: Ayodhya bypass */}
          <circle cx="240" cy="35" r="4.5" fill="#171717" stroke="#737373" strokeWidth="1.75" />
          <circle cx="240" cy="35" r="2" fill="#A3A3A3" />

          {/* Destination Node: Lucknow */}
          <circle cx="430" cy="35" r="6" fill="#171717" stroke="#F28C28" strokeWidth="2" />
          <circle cx="430" cy="35" r="2.5" fill="#F28C28" />

          {/* Animated Truck Icon traveling on path */}
          <g>
            <animateMotion
              dur="9s"
              repeatCount="indefinite"
              rotate="auto"
              path="M 30 35 Q 150 12, 240 35 T 430 35"
            />
            <g transform="translate(-11, -11)">
              <circle cx="11" cy="11" r="10" fill="#F28C28" opacity="0.2" />
              <rect x="2" y="2" width="18" height="18" rx="3" fill="#171717" stroke="#F28C28" strokeWidth="1.5" />
              <path
                d="M 5 13 L 7 13 M 15 13 L 17 13 M 5 7 L 11 7 L 13 9.5 L 17 9.5 L 17 13 L 5 13 Z M 11 7 L 11 11 L 16 11"
                stroke="#F28C28"
                strokeWidth="1.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </g>
          </g>
        </svg>

        {/* Labels underneath */}
        <div className="flex items-center justify-between text-xs mt-1 text-[#A3A3A3]">
          <div className="flex items-start space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-[#F5F0E6] mt-1 shrink-0"></span>
            <div>
              <p className="font-bold text-white text-[11px] sm:text-xs">Gorakhpur</p>
              <p className="text-[10px] font-mono text-[#737373]">GIDA Terminal</p>
            </div>
          </div>

          <div className="text-center text-[10px]">
            <span className="font-mono text-[#A3A3A3]">272 KM CORRIDOR</span>
            <span className="block text-[#F28C28] font-mono text-[9px] font-semibold">
              VIA AYODHYA BYPASS
            </span>
          </div>

          <div className="flex items-start space-x-1.5 text-right">
            <div>
              <p className="font-bold text-white text-[11px] sm:text-xs">Lucknow</p>
              <p className="text-[10px] font-mono text-[#737373]">Transport Nagar</p>
            </div>
            <span className="w-2 h-2 rounded-full bg-[#F28C28] mt-1 shrink-0"></span>
          </div>
        </div>
      </div>
    </div>
  );
}
