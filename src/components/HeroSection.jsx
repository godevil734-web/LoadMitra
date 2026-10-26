import React from 'react';
import { ArrowRight, Search, Share2, Truck, Check, Package, RotateCcw, Layers } from 'lucide-react';
import RouteAnimation from './RouteAnimation';
import ImageWithFallback from './ImageWithFallback';

export default function HeroSection({ onFindTransport, onShareShipment }) {
  return (
    <section className="relative pt-24 pb-12 sm:pt-32 sm:pb-16 bg-[#F5F0E6] text-[#171717] overflow-hidden border-b border-[#E2DBD0]">
      {/* Background structural grid watermark */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(#171717 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 w-full relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 xl:gap-16 items-center">
          {/* Left Column: Bold Editorial Headlines & Action CTAs */}
          <div className="lg:col-span-6 flex flex-col justify-center space-y-6">
            {/* Operational Network Badge */}
            <div className="inline-flex items-center space-x-2 bg-[#171717] border border-[#2D2D2D] px-3 py-1 rounded text-white w-fit shadow-xs">
              <span className="w-2 h-2 rounded-full bg-[#F28C28] animate-pulse" />
              <span className="text-[10px] font-mono font-bold uppercase tracking-[0.14em] text-[#F5F0E6]">
                LIVE FREIGHT NETWORK • INTERCITY CORRIDORS
              </span>
            </div>

            {/* Editorial Headline */}
            <h1 
              className="text-4xl sm:text-5xl lg:text-6xl font-black text-[#171717] tracking-tight leading-[1.08]"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              Better loads.{' '}
              <span className="block text-[#171717]">
                Fewer{' '}
                <span className="text-[#F28C28] inline-block relative underline decoration-[#F28C28]/40 decoration-4 underline-offset-4">
                  empty miles.
                </span>
              </span>
            </h1>

            {/* Supporting Copy */}
            <p className="text-base sm:text-lg text-[#525252] leading-relaxed max-w-xl font-normal">
              Connect your freight demand with available transport capacity. Coordinate shared loads and return trips directly without paying for empty space on national highway corridors.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-3.5 pt-1">
              <button
                type="button"
                onClick={onFindTransport}
                className="inline-flex items-center justify-center px-6 py-3.5 text-xs font-extrabold uppercase tracking-wider text-[#171717] bg-[#F28C28] hover:bg-[#DE7919] rounded shadow-md transition-all duration-150 group focus:outline-none focus:ring-2 focus:ring-[#171717]"
              >
                <Search className="w-4 h-4 mr-2 text-[#171717]" />
                <span>Search Available Loads</span>
                <ArrowRight className="w-3.5 h-3.5 ml-2 transition-transform duration-150 group-hover:translate-x-0.5" />
              </button>

              <button
                type="button"
                onClick={onShareShipment}
                className="inline-flex items-center justify-center px-6 py-3.5 text-xs font-extrabold uppercase tracking-wider text-white bg-[#171717] hover:bg-[#262626] border border-[#2D2D2D] rounded shadow-sm transition-all duration-150 group focus:outline-none focus:ring-2 focus:ring-[#F28C28]"
              >
                <Share2 className="w-4 h-4 mr-2 text-[#F28C28]" />
                <span>Post Freight Load</span>
              </button>
            </div>

            {/* Quick Value Pillars Strip */}
            <div className="pt-4 border-t border-[#E2DBD0] grid grid-cols-3 gap-3 text-[#737373] text-xs">
              <div className="flex items-center space-x-1.5">
                <Check className="w-4 h-4 text-[#F28C28] shrink-0" />
                <span className="font-semibold text-[#171717]">Shared Consignments</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <Check className="w-4 h-4 text-[#F28C28] shrink-0" />
                <span className="font-semibold text-[#171717]">Return Corridors</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <Check className="w-4 h-4 text-[#F28C28] shrink-0" />
                <span className="font-semibold text-[#171717]">Direct Coordination</span>
              </div>
            </div>
          </div>

          {/* Right Column: Unified Visual Composition with Truck + Route + Match Preview */}
          <div className="lg:col-span-6 relative">
            <div className="relative rounded-lg overflow-hidden border border-[#2D2D2D] shadow-xl bg-[#171717]">
              {/* Primary Freight Photography */}
              <div className="h-64 sm:h-72 w-full relative">
                <ImageWithFallback
                  src="https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=1200&q=80"
                  alt="Modern commercial heavy freight transport truck operating on national highway corridor"
                  type="truck"
                  className="w-full h-full object-cover"
                  overlayClassName="absolute inset-0 bg-gradient-to-t from-[#171717] via-[#171717]/40 to-transparent"
                />

                {/* Floating Top Badge */}
                <div className="absolute top-3.5 left-3.5 bg-[#171717]/95 border border-[#3D3D3D] px-2.5 py-1 rounded flex items-center space-x-2">
                  <Truck className="w-3.5 h-3.5 text-[#F28C28]" />
                  <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-white">
                    HEAVY FREIGHT CORRIDOR
                  </span>
                </div>

                <div className="absolute top-3.5 right-3.5 bg-[#171717]/95 border border-[#3D3D3D] px-2 py-0.5 rounded text-[10px] font-mono text-[#F28C28]">
                  NH27 HIGHWAY FLEET
                </div>
              </div>

              {/* Seamlessly Integrated Route Corridor + Match Preview Block */}
              <div className="p-4 sm:p-5 bg-[#171717] border-t border-[#2D2D2D] space-y-4">
                {/* 1. Route Animation */}
                <RouteAnimation />

                {/* 2. Illustrative Matching Preview with Cargo & Capacity */}
                <div className="bg-[#1F1F1F] border border-[#2D2D2D] rounded p-3.5 space-y-3">
                  <div className="flex items-center justify-between text-xs pb-2 border-b border-[#2D2D2D]">
                    <div className="flex items-center space-x-2">
                      <Layers className="w-3.5 h-3.5 text-[#F28C28]" />
                      <span className="font-mono font-bold text-white uppercase tracking-wider text-[11px]">
                        CORRIDOR MATCH SPECIFICATION
                      </span>
                    </div>
                    <span className="text-[9px] text-[#A3A3A3] font-mono bg-[#262626] px-2 py-0.5 rounded border border-[#333333]">
                      SAMPLE TELEMETRY
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    {/* Cargo & Weight */}
                    <div className="space-y-1">
                      <span className="text-[11px] font-mono uppercase text-[#A3A3A3] flex items-center">
                        <Package className="w-3 h-3 mr-1 text-[#F28C28]" />
                        Consignment Load
                      </span>
                      <p className="font-bold text-[#F5F0E6] text-xs">
                        2.4 Tons Agri-Hardware
                      </p>
                      <p className="text-[10px] font-mono text-[#737373]">Gorakhpur GIDA ➔ Lucknow</p>
                    </div>

                    {/* Available Vehicle Capacity */}
                    <div className="space-y-1">
                      <span className="text-[11px] font-mono uppercase text-[#A3A3A3] flex items-center">
                        <Truck className="w-3 h-3 mr-1 text-[#F28C28]" />
                        Available Spare Deck
                      </span>
                      <div className="flex items-center justify-between text-xs font-tabular">
                        <span className="font-bold text-[#F28C28]">4.8 TONS FREE</span>
                        <span className="text-[10px] text-[#A3A3A3]">38% Space</span>
                      </div>
                      {/* Capacity Meter Bar */}
                      <div className="w-full bg-[#2E2E2E] h-1.5 rounded overflow-hidden">
                        <div className="bg-[#F28C28] h-full w-[62%] rounded" />
                      </div>
                    </div>
                  </div>

                  {/* Route Compatibility & Indicative Shared Rate */}
                  <div className="pt-2 border-t border-[#2D2D2D] grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-[10px] font-mono text-[#737373] block uppercase">Route Alignment</span>
                      <span className="font-semibold text-emerald-400">NH27 Direct • 0 km Detour</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-mono text-[#737373] block uppercase">Indicative Corridor Rate</span>
                      <span className="font-mono font-bold text-[#F5F0E6]">~₹1,750 / Ton</span>
                    </div>
                  </div>

                  {/* Return Load Opportunity Strip */}
                  <div className="pt-2 border-t border-[#2D2D2D] flex items-center justify-between text-[11px]">
                    <span className="flex items-center text-[#F28C28] font-mono text-[10px] uppercase font-bold">
                      <RotateCcw className="w-3 h-3 mr-1.5 text-[#F28C28]" />
                      Return-Load Opportunity:
                    </span>
                    <span className="font-mono text-[10px] text-[#D4CBBC]">
                      Lucknow ➔ Gorakhpur / Kanpur corridor
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
