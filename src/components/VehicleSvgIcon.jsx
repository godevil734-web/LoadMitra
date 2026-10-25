import React from 'react';

/**
 * Dedicated vector truck silhouettes for each of the 12 vehicle types
 * Provides zero-latency, 100% reliable local rendering matching RouteWise palette.
 */
export default function VehicleSvgIcon({ type, className = 'w-14 h-14' }) {
  switch (type) {
    case 'mini-truck':
      // Tata Ace / Chhota Hathi silhouette
      return (
        <svg viewBox="0 0 100 60" fill="currentColor" className={className}>
          {/* Cab */}
          <path d="M10 40 L10 22 C10 18 14 15 18 15 L28 15 L36 28 L36 40 Z" opacity="0.9" />
          {/* Windshield */}
          <path d="M19 18 L27 18 L33 28 L19 28 Z" fill="#0F2A44" opacity="0.8" />
          {/* Mini Cargo Bed */}
          <rect x="38" y="20" width="46" height="20" rx="2" opacity="0.85" />
          <line x1="42" y1="24" x2="80" y2="24" stroke="#091827" strokeWidth="1" />
          <line x1="42" y1="30" x2="80" y2="30" stroke="#091827" strokeWidth="1" />
          {/* Chassis */}
          <rect x="8" y="40" width="78" height="4" fill="#091827" />
          {/* Wheels */}
          <circle cx="22" cy="44" r="7" fill="#091827" stroke="#F59E0B" strokeWidth="1.5" />
          <circle cx="22" cy="44" r="3" fill="#F59E0B" />
          <circle cx="70" cy="44" r="7" fill="#091827" stroke="#F59E0B" strokeWidth="1.5" />
          <circle cx="70" cy="44" r="3" fill="#F59E0B" />
        </svg>
      );

    case 'pickup-truck':
      // Pickup truck / Bolero Maxi
      return (
        <svg viewBox="0 0 100 60" fill="currentColor" className={className}>
          <path d="M8 40 L8 26 L18 20 L34 20 L40 28 L40 40 Z" opacity="0.9" />
          <path d="M19 22 L32 22 L37 28 L19 28 Z" fill="#0F2A44" opacity="0.8" />
          {/* Open Bed with tailgate */}
          <path d="M42 26 L86 26 L86 40 L42 40 Z" opacity="0.8" />
          <rect x="42" y="24" width="44" height="2" fill="#F59E0B" opacity="0.6" />
          <rect x="6" y="40" width="82" height="4" fill="#091827" />
          <circle cx="24" cy="44" r="7" fill="#091827" stroke="#38BDF8" strokeWidth="1.5" />
          <circle cx="24" cy="44" r="3" fill="#38BDF8" />
          <circle cx="74" cy="44" r="7" fill="#091827" stroke="#38BDF8" strokeWidth="1.5" />
          <circle cx="74" cy="44" r="3" fill="#38BDF8" />
        </svg>
      );

    case 'lcv':
      // 14ft - 17ft LCV Eicher/Tata 407
      return (
        <svg viewBox="0 0 100 60" fill="currentColor" className={className}>
          {/* Forward Control Cab */}
          <path d="M8 40 L8 16 C8 14 11 12 14 12 L24 12 L30 22 L30 40 Z" opacity="0.9" />
          <path d="M12 15 L22 15 L27 22 L12 22 Z" fill="#0F2A44" opacity="0.8" />
          {/* LCV Container Body */}
          <rect x="32" y="12" width="56" height="28" rx="2" opacity="0.85" />
          {/* Vertical Ribs */}
          <line x1="44" y1="14" x2="44" y2="38" stroke="#091827" strokeWidth="1.5" />
          <line x1="58" y1="14" x2="58" y2="38" stroke="#091827" strokeWidth="1.5" />
          <line x1="72" y1="14" x2="72" y2="38" stroke="#091827" strokeWidth="1.5" />
          <rect x="6" y="40" width="84" height="4" fill="#091827" />
          <circle cx="20" cy="44" r="7" fill="#091827" stroke="#60A5FA" strokeWidth="1.5" />
          <circle cx="20" cy="44" r="3" fill="#60A5FA" />
          <circle cx="74" cy="44" r="7" fill="#091827" stroke="#60A5FA" strokeWidth="1.5" />
          <circle cx="74" cy="44" r="3" fill="#60A5FA" />
        </svg>
      );

    case 'mcv':
      // Medium 6-Wheeler Rigid
      return (
        <svg viewBox="0 0 100 60" fill="currentColor" className={className}>
          <path d="M6 40 L6 14 C6 12 9 10 12 10 L22 10 L28 20 L28 40 Z" opacity="0.9" />
          <path d="M10 13 L20 13 L25 20 L10 20 Z" fill="#0F2A44" opacity="0.8" />
          <rect x="30" y="10" width="60" height="30" rx="2" opacity="0.85" />
          <line x1="45" y1="12" x2="45" y2="38" stroke="#091827" strokeWidth="1.5" />
          <line x1="60" y1="12" x2="60" y2="38" stroke="#091827" strokeWidth="1.5" />
          <line x1="75" y1="12" x2="75" y2="38" stroke="#091827" strokeWidth="1.5" />
          <rect x="4" y="40" width="88" height="4" fill="#091827" />
          <circle cx="18" cy="45" r="7.5" fill="#091827" stroke="#818CF8" strokeWidth="1.5" />
          <circle cx="18" cy="45" r="3" fill="#818CF8" />
          {/* Dual Rear Axle */}
          <circle cx="68" cy="45" r="7.5" fill="#091827" stroke="#818CF8" strokeWidth="1.5" />
          <circle cx="68" cy="45" r="3" fill="#818CF8" />
          <circle cx="82" cy="45" r="7.5" fill="#091827" stroke="#818CF8" strokeWidth="1.5" />
          <circle cx="82" cy="45" r="3" fill="#818CF8" />
        </svg>
      );

    case 'heavy-duty':
      // 10 to 14 wheeler heavy rigid
      return (
        <svg viewBox="0 0 100 60" fill="currentColor" className={className}>
          <path d="M5 40 L5 12 C5 9 8 8 11 8 L22 8 L27 18 L27 40 Z" opacity="0.9" />
          <path d="M9 11 L19 11 L24 18 L9 18 Z" fill="#0F2A44" opacity="0.8" />
          {/* High Heavy Body */}
          <rect x="29" y="8" width="65" height="32" rx="2" opacity="0.85" />
          <rect x="4" y="40" width="92" height="4" fill="#091827" />
          {/* Front Dual Axles */}
          <circle cx="14" cy="46" r="7" fill="#091827" stroke="#A78BFA" strokeWidth="1.5" />
          <circle cx="14" cy="46" r="2.5" fill="#A78BFA" />
          <circle cx="26" cy="46" r="7" fill="#091827" stroke="#A78BFA" strokeWidth="1.5" />
          <circle cx="26" cy="46" r="2.5" fill="#A78BFA" />
          {/* Rear Multi Axles */}
          <circle cx="66" cy="46" r="7" fill="#091827" stroke="#A78BFA" strokeWidth="1.5" />
          <circle cx="66" cy="46" r="2.5" fill="#A78BFA" />
          <circle cx="78" cy="46" r="7" fill="#091827" stroke="#A78BFA" strokeWidth="1.5" />
          <circle cx="78" cy="46" r="2.5" fill="#A78BFA" />
          <circle cx="90" cy="46" r="7" fill="#091827" stroke="#A78BFA" strokeWidth="1.5" />
          <circle cx="90" cy="46" r="2.5" fill="#A78BFA" />
        </svg>
      );

    case 'open-body':
      // Open Body with wooden/steel side drop walls and posts
      return (
        <svg viewBox="0 0 100 60" fill="currentColor" className={className}>
          <path d="M6 40 L6 14 C6 12 9 10 12 10 L22 10 L28 20 L28 40 Z" opacity="0.9" />
          <path d="M10 13 L20 13 L25 20 L10 20 Z" fill="#0F2A44" opacity="0.8" />
          {/* Open Drop-Side Body */}
          <rect x="30" y="20" width="62" height="20" rx="1" opacity="0.85" />
          {/* Vertical Stakes/Pillars */}
          <rect x="30" y="10" width="3" height="30" fill="#F59E0B" opacity="0.8" />
          <rect x="45" y="10" width="3" height="30" fill="#F59E0B" opacity="0.8" />
          <rect x="60" y="10" width="3" height="30" fill="#F59E0B" opacity="0.8" />
          <rect x="75" y="10" width="3" height="30" fill="#F59E0B" opacity="0.8" />
          <rect x="90" y="10" width="2" height="30" fill="#F59E0B" opacity="0.8" />
          <rect x="4" y="40" width="90" height="4" fill="#091827" />
          <circle cx="18" cy="45" r="7.5" fill="#091827" stroke="#34D399" strokeWidth="1.5" />
          <circle cx="18" cy="45" r="3" fill="#34D399" />
          <circle cx="72" cy="45" r="7.5" fill="#091827" stroke="#34D399" strokeWidth="1.5" />
          <circle cx="72" cy="45" r="3" fill="#34D399" />
          <circle cx="85" cy="45" r="7.5" fill="#091827" stroke="#34D399" strokeWidth="1.5" />
          <circle cx="85" cy="45" r="3" fill="#34D399" />
        </svg>
      );

    case 'closed-container':
      // Closed Corrugated Steel Container
      return (
        <svg viewBox="0 0 100 60" fill="currentColor" className={className}>
          <path d="M6 40 L6 14 C6 12 9 10 12 10 L22 10 L28 20 L28 40 Z" opacity="0.9" />
          <path d="M10 13 L20 13 L25 20 L10 20 Z" fill="#0F2A44" opacity="0.8" />
          {/* Box Container */}
          <rect x="30" y="8" width="62" height="32" rx="2" opacity="0.9" />
          {/* Steel Corrugations */}
          <line x1="36" y1="10" x2="36" y2="38" stroke="#091827" strokeWidth="1.5" />
          <line x1="42" y1="10" x2="42" y2="38" stroke="#091827" strokeWidth="1.5" />
          <line x1="48" y1="10" x2="48" y2="38" stroke="#091827" strokeWidth="1.5" />
          <line x1="54" y1="10" x2="54" y2="38" stroke="#091827" strokeWidth="1.5" />
          <line x1="60" y1="10" x2="60" y2="38" stroke="#091827" strokeWidth="1.5" />
          <line x1="66" y1="10" x2="66" y2="38" stroke="#091827" strokeWidth="1.5" />
          <line x1="72" y1="10" x2="72" y2="38" stroke="#091827" strokeWidth="1.5" />
          <line x1="78" y1="10" x2="78" y2="38" stroke="#091827" strokeWidth="1.5" />
          <line x1="84" y1="10" x2="84" y2="38" stroke="#091827" strokeWidth="1.5" />
          <rect x="4" y="40" width="90" height="4" fill="#091827" />
          <circle cx="18" cy="45" r="7.5" fill="#091827" stroke="#22D3EE" strokeWidth="1.5" />
          <circle cx="18" cy="45" r="3" fill="#22D3EE" />
          <circle cx="72" cy="45" r="7.5" fill="#091827" stroke="#22D3EE" strokeWidth="1.5" />
          <circle cx="72" cy="45" r="3" fill="#22D3EE" />
          <circle cx="85" cy="45" r="7.5" fill="#091827" stroke="#22D3EE" strokeWidth="1.5" />
          <circle cx="85" cy="45" r="3" fill="#22D3EE" />
        </svg>
      );

    case 'refrigerated':
      // Reefer with top nose cooling condenser unit
      return (
        <svg viewBox="0 0 100 60" fill="currentColor" className={className}>
          <path d="M6 40 L6 16 C6 13 9 12 12 12 L22 12 L28 22 L28 40 Z" opacity="0.9" />
          <path d="M10 15 L20 15 L25 22 L10 22 Z" fill="#0F2A44" opacity="0.8" />
          {/* Reefer Cooling Unit (Thermo King style top mount) */}
          <rect x="29" y="8" width="10" height="12" rx="2" fill="#38BDF8" opacity="0.95" />
          <line x1="31" y1="11" x2="37" y2="11" stroke="#091827" strokeWidth="1" />
          <line x1="31" y1="14" x2="37" y2="14" stroke="#091827" strokeWidth="1" />
          {/* Insulated Box */}
          <rect x="30" y="10" width="62" height="30" rx="3" opacity="0.85" />
          {/* Temperature snowflake symbol icon */}
          <circle cx="62" cy="24" r="5" fill="#38BDF8" opacity="0.4" />
          <rect x="4" y="40" width="90" height="4" fill="#091827" />
          <circle cx="18" cy="45" r="7.5" fill="#091827" stroke="#2DD4BF" strokeWidth="1.5" />
          <circle cx="18" cy="45" r="3" fill="#2DD4BF" />
          <circle cx="72" cy="45" r="7.5" fill="#091827" stroke="#2DD4BF" strokeWidth="1.5" />
          <circle cx="72" cy="45" r="3" fill="#2DD4BF" />
          <circle cx="85" cy="45" r="7.5" fill="#091827" stroke="#2DD4BF" strokeWidth="1.5" />
          <circle cx="85" cy="45" r="3" fill="#2DD4BF" />
        </svg>
      );

    case 'trailer-multi-axle':
      // Articulated Semi-Trailer with 40ft container
      return (
        <svg viewBox="0 0 100 60" fill="currentColor" className={className}>
          {/* Prime Mover Cab */}
          <path d="M4 40 L4 18 C4 15 7 14 10 14 L18 14 L23 24 L23 40 Z" opacity="0.9" />
          <path d="M8 17 L16 17 L20 24 L8 24 Z" fill="#0F2A44" opacity="0.8" />
          <rect x="23" y="32" width="7" height="8" fill="#F59E0B" />
          {/* 40ft Semi-Trailer Bed */}
          <rect x="27" y="12" width="68" height="28" rx="2" opacity="0.85" />
          <line x1="40" y1="14" x2="40" y2="38" stroke="#091827" strokeWidth="1" />
          <line x1="60" y1="14" x2="60" y2="38" stroke="#091827" strokeWidth="1" />
          <line x1="80" y1="14" x2="80" y2="38" stroke="#091827" strokeWidth="1" />
          {/* Trailer Chassis */}
          <rect x="2" y="40" width="94" height="4" fill="#091827" />
          {/* Prime mover wheels */}
          <circle cx="12" cy="45" r="6.5" fill="#091827" stroke="#F59E0B" strokeWidth="1.5" />
          <circle cx="12" cy="45" r="2.5" fill="#F59E0B" />
          <circle cx="23" cy="45" r="6.5" fill="#091827" stroke="#F59E0B" strokeWidth="1.5" />
          <circle cx="23" cy="45" r="2.5" fill="#F59E0B" />
          {/* Tri-Axle Trailer Wheels */}
          <circle cx="70" cy="45" r="6.5" fill="#091827" stroke="#F59E0B" strokeWidth="1.5" />
          <circle cx="70" cy="45" r="2.5" fill="#F59E0B" />
          <circle cx="81" cy="45" r="6.5" fill="#091827" stroke="#F59E0B" strokeWidth="1.5" />
          <circle cx="81" cy="45" r="2.5" fill="#F59E0B" />
          <circle cx="91" cy="45" r="6.5" fill="#091827" stroke="#F59E0B" strokeWidth="1.5" />
          <circle cx="91" cy="45" r="2.5" fill="#F59E0B" />
        </svg>
      );

    case 'flatbed':
      // Open flat-deck platform
      return (
        <svg viewBox="0 0 100 60" fill="currentColor" className={className}>
          <path d="M4 40 L4 18 C4 15 7 14 10 14 L18 14 L23 24 L23 40 Z" opacity="0.9" />
          <path d="M8 17 L16 17 L20 24 L8 24 Z" fill="#0F2A44" opacity="0.8" />
          {/* Flat platform floor with headboard */}
          <rect x="25" y="16" width="3" height="24" fill="#FB923C" />
          <rect x="25" y="34" width="70" height="6" rx="1" opacity="0.9" />
          {/* Cargo tie-down hooks */}
          <circle cx="35" cy="37" r="1.5" fill="#091827" />
          <circle cx="50" cy="37" r="1.5" fill="#091827" />
          <circle cx="65" cy="37" r="1.5" fill="#091827" />
          <circle cx="80" cy="37" r="1.5" fill="#091827" />
          <rect x="2" y="40" width="94" height="4" fill="#091827" />
          <circle cx="12" cy="45" r="6.5" fill="#091827" stroke="#FB923C" strokeWidth="1.5" />
          <circle cx="12" cy="45" r="2.5" fill="#FB923C" />
          <circle cx="23" cy="45" r="6.5" fill="#091827" stroke="#FB923C" strokeWidth="1.5" />
          <circle cx="23" cy="45" r="2.5" fill="#FB923C" />
          <circle cx="74" cy="45" r="6.5" fill="#091827" stroke="#FB923C" strokeWidth="1.5" />
          <circle cx="74" cy="45" r="2.5" fill="#FB923C" />
          <circle cx="86" cy="45" r="6.5" fill="#091827" stroke="#FB923C" strokeWidth="1.5" />
          <circle cx="86" cy="45" r="2.5" fill="#FB923C" />
        </svg>
      );

    case 'tanker':
      // Cylindrical Liquid Tanker
      return (
        <svg viewBox="0 0 100 60" fill="currentColor" className={className}>
          <path d="M6 40 L6 14 C6 12 9 10 12 10 L22 10 L28 20 L28 40 Z" opacity="0.9" />
          <path d="M10 13 L20 13 L25 20 L10 20 Z" fill="#0F2A44" opacity="0.8" />
          {/* Cylindrical Rounded Tank */}
          <rect x="30" y="12" width="60" height="26" rx="12" opacity="0.85" />
          {/* Tank Straps / Reinforcement Rings */}
          <line x1="45" y1="12" x2="45" y2="38" stroke="#F43F5E" strokeWidth="1.5" opacity="0.8" />
          <line x1="60" y1="12" x2="60" y2="38" stroke="#F43F5E" strokeWidth="1.5" opacity="0.8" />
          <line x1="75" y1="12" x2="75" y2="38" stroke="#F43F5E" strokeWidth="1.5" opacity="0.8" />
          {/* Top Inspection Hatches */}
          <rect x="42" y="9" width="6" height="3" rx="1" fill="#F43F5E" />
          <rect x="72" y="9" width="6" height="3" rx="1" fill="#F43F5E" />
          <rect x="4" y="40" width="88" height="4" fill="#091827" />
          <circle cx="18" cy="45" r="7.5" fill="#091827" stroke="#F43F5E" strokeWidth="1.5" />
          <circle cx="18" cy="45" r="3" fill="#F43F5E" />
          <circle cx="70" cy="45" r="7.5" fill="#091827" stroke="#F43F5E" strokeWidth="1.5" />
          <circle cx="70" cy="45" r="3" fill="#F43F5E" />
          <circle cx="83" cy="45" r="7.5" fill="#091827" stroke="#F43F5E" strokeWidth="1.5" />
          <circle cx="83" cy="45" r="3" fill="#F43F5E" />
        </svg>
      );

    case 'tipper-dumper':
      // Tipper / Dumper with raised rear bucket
      return (
        <svg viewBox="0 0 100 60" fill="currentColor" className={className}>
          <path d="M6 40 L6 14 C6 12 9 10 12 10 L22 10 L28 20 L28 40 Z" opacity="0.9" />
          <path d="M10 13 L20 13 L25 20 L10 20 Z" fill="#0F2A44" opacity="0.8" />
          {/* Cab Guard Canopy */}
          <path d="M22 10 L30 10 L30 14 Z" fill="#EAB308" />
          {/* Slanted Tipper Bucket */}
          <path d="M30 14 L90 14 L84 40 L30 40 Z" opacity="0.85" />
          <line x1="45" y1="16" x2="42" y2="38" stroke="#091827" strokeWidth="1.5" />
          <line x1="60" y1="16" x2="57" y2="38" stroke="#091827" strokeWidth="1.5" />
          <line x1="75" y1="16" x2="72" y2="38" stroke="#091827" strokeWidth="1.5" />
          <rect x="4" y="40" width="88" height="4" fill="#091827" />
          <circle cx="18" cy="45" r="7.5" fill="#091827" stroke="#EAB308" strokeWidth="1.5" />
          <circle cx="18" cy="45" r="3" fill="#EAB308" />
          <circle cx="68" cy="45" r="7.5" fill="#091827" stroke="#EAB308" strokeWidth="1.5" />
          <circle cx="68" cy="45" r="3" fill="#EAB308" />
          <circle cx="81" cy="45" r="7.5" fill="#091827" stroke="#EAB308" strokeWidth="1.5" />
          <circle cx="81" cy="45" r="3" fill="#EAB308" />
        </svg>
      );

    default:
      return (
        <svg viewBox="0 0 100 60" fill="currentColor" className={className}>
          <path d="M8 40 L8 16 L24 16 L30 24 L30 40 Z" opacity="0.9" />
          <rect x="32" y="16" width="56" height="24" rx="2" opacity="0.85" />
          <circle cx="20" cy="44" r="7" fill="#091827" stroke="#F59E0B" strokeWidth="1.5" />
          <circle cx="74" cy="44" r="7" fill="#091827" stroke="#F59E0B" strokeWidth="1.5" />
        </svg>
      );
  }
}
