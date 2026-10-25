import React from 'react';

export default function RouteAnimation() {
  return (
    <div className="w-full bg-[#091827]/85 border border-[#1E3D60]/90 rounded-xl p-3.5 sm:p-4 backdrop-blur-md shadow-lg">
      <div className="flex items-center justify-between mb-2 pb-2 border-b border-[#1E3D60]/60">
        <div className="flex items-center space-x-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#F59E0B] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#F59E0B]"></span>
          </span>
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-200">
            Active Corridor Route • NH27
          </span>
        </div>
        <span className="text-[10px] font-medium text-amber-300/90 bg-[#152E4A] px-2 py-0.5 rounded border border-[#1E3D60]">
          Illustrative Example • Not Live GPS
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
            stroke="#1E3D60"
            strokeWidth="4"
            strokeLinecap="round"
          />

          {/* Dotted active route path */}
          <path
            id="heroRouteTrack"
            d="M 30 35 Q 150 12, 240 35 T 430 35"
            stroke="#F59E0B"
            strokeWidth="2.5"
            strokeDasharray="5 5"
            strokeLinecap="round"
            className="opacity-85"
          />

          {/* Origin Node: Gorakhpur */}
          <circle cx="30" cy="35" r="7" fill="#091827" stroke="#38BDF8" strokeWidth="2.5" />
          <circle cx="30" cy="35" r="3" fill="#38BDF8" />

          {/* Midpoint Corridor waypoint: Ayodhya bypass */}
          <circle cx="240" cy="35" r="4.5" fill="#091827" stroke="#64748B" strokeWidth="2" />
          <circle cx="240" cy="35" r="2" fill="#94A3B8" />

          {/* Destination Node: Lucknow */}
          <circle cx="430" cy="35" r="7" fill="#091827" stroke="#F59E0B" strokeWidth="2.5" />
          <circle cx="430" cy="35" r="3" fill="#F59E0B" />

          {/* Animated Truck Icon traveling on path */}
          <g>
            <animateMotion
              dur="10s"
              repeatCount="indefinite"
              rotate="auto"
              path="M 30 35 Q 150 12, 240 35 T 430 35"
            />
            <g transform="translate(-11, -11)">
              <circle cx="11" cy="11" r="11" fill="#F59E0B" opacity="0.25" />
              <rect x="2" y="2" width="18" height="18" rx="5" fill="#091827" stroke="#F59E0B" strokeWidth="1.5" />
              <path
                d="M 5 13 L 7 13 M 15 13 L 17 13 M 5 7 L 11 7 L 13 9.5 L 17 9.5 L 17 13 L 5 13 Z M 11 7 L 11 11 L 16 11"
                stroke="#F59E0B"
                strokeWidth="1.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </g>
          </g>
        </svg>

        {/* Labels underneath */}
        <div className="flex items-center justify-between text-xs mt-1 text-slate-300">
          <div className="flex items-start space-x-1">
            <span className="w-2 h-2 rounded-full bg-[#38BDF8] mt-1 shrink-0"></span>
            <div>
              <p className="font-semibold text-white text-[11px] sm:text-xs">Gorakhpur</p>
              <p className="text-[10px] text-slate-400">GIDA Origin</p>
            </div>
          </div>

          <div className="text-center text-[10px] text-slate-400">
            <span className="font-medium text-slate-300">NH27 Corridor (272 km)</span>
            <span className="block text-[#F59E0B] font-semibold text-[9px] sm:text-[10px]">
              Midpoint: Ayodhya Bypass
            </span>
          </div>

          <div className="flex items-start space-x-1 text-right">
            <div>
              <p className="font-semibold text-white text-[11px] sm:text-xs">Lucknow</p>
              <p className="text-[10px] text-slate-400">Transport Nagar</p>
            </div>
            <span className="w-2 h-2 rounded-full bg-[#F59E0B] mt-1 shrink-0"></span>
          </div>
        </div>
      </div>
    </div>
  );
}
