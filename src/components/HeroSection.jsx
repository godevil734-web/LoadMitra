import React from 'react';
import { ArrowRight, Search, Share2, Truck, Check, Package, RotateCcw, Layers } from 'lucide-react';
import RouteAnimation from './RouteAnimation';
import ImageWithFallback from './ImageWithFallback';

export default function HeroSection({ onFindTransport, onShareShipment }) {
  return (
    <section className="relative pt-28 pb-12 sm:pt-34 sm:pb-16 overflow-hidden">
      {/* Background ambient lighting subtle gradients */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-[#0F2A44]/60 blur-[130px] -z-10 pointer-events-none rounded-full" />
      <div className="absolute top-10 right-10 w-[350px] h-[350px] bg-[#F59E0B]/5 blur-[120px] -z-10 pointer-events-none rounded-full" />

      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 xl:gap-16 2xl:gap-20 items-center">
          {/* Left Column: Headlines & Action CTAs */}
          <div className="lg:col-span-6 flex flex-col justify-center space-y-6">
            {/* Pill Badge */}
            <div className="inline-flex items-center space-x-2 bg-[#0F2A44] border border-[#1E3D60] px-3.5 py-1.5 rounded-full w-fit">
              <span className="w-2 h-2 rounded-full bg-[#F59E0B] animate-pulse"></span>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Logistics Marketplace • Early Pilot
              </span>
            </div>

            {/* Main Headline (Mandatory wording strictly preserved) */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.12]">
              Better loads. <br />
              Lower shipping costs. <br />
              <span className="text-[#F59E0B] inline-block relative">
                Fewer empty trips.
                <span className="absolute left-0 bottom-1 w-full h-[3px] bg-[#F59E0B]/30 rounded-full" />
              </span>
            </h1>

            {/* Supporting Copy */}
            <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-xl xl:max-w-2xl 2xl:max-w-3xl">
              Connect your goods with available transport vehicles. Find shared loads and return trips easily without paying for empty space.
            </p>

            {/* Prominent Action Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 pt-1">
              <button
                type="button"
                onClick={onFindTransport}
                className="inline-flex items-center justify-center px-6 py-3.5 text-base font-bold text-[#091827] bg-[#F59E0B] hover:bg-[#D97706] rounded-xl shadow-lg shadow-amber-500/10 hover:shadow-xl transition-all duration-200 group focus:outline-none focus:ring-2 focus:ring-white"
              >
                <Search className="w-5 h-5 mr-2 text-[#091827]" />
                <span>Find Loads</span>
                <ArrowRight className="w-4 h-4 ml-2 transition-transform duration-200 group-hover:translate-x-1" />
              </button>

              <button
                type="button"
                onClick={onShareShipment}
                className="inline-flex items-center justify-center px-6 py-3.5 text-base font-bold text-white bg-[#0F2A44] hover:bg-[#152E4A] border border-[#1E3D60] hover:border-[#2A4F78] rounded-xl shadow-sm transition-all duration-200 group focus:outline-none focus:ring-2 focus:ring-[#F59E0B]"
              >
                <Share2 className="w-4 h-4 mr-2 text-[#38BDF8]" />
                <span>Post a Load</span>
              </button>
            </div>

            {/* Quick Value Pillars Strip */}
            <div className="pt-4 border-t border-[#1E3D60]/60 grid grid-cols-3 gap-3 text-slate-400 text-xs">
              <div className="flex items-center space-x-1.5">
                <Check className="w-4 h-4 text-[#F59E0B] shrink-0" />
                <span className="font-medium text-slate-300">Shared Loads</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <Check className="w-4 h-4 text-[#F59E0B] shrink-0" />
                <span className="font-medium text-slate-300">Return Corridors</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <Check className="w-4 h-4 text-[#F59E0B] shrink-0" />
                <span className="font-medium text-slate-300">Direct Coordination</span>
              </div>
            </div>
          </div>

          {/* Right Column: Unified Visual Composition with Photo + Embedded Route + Match Preview */}
          <div className="lg:col-span-6 relative">
            <div className="relative rounded-2xl overflow-hidden border border-[#1E3D60] shadow-2xl bg-[#0F2A44]">
              {/* Primary Realistic Freight Photography */}
              <div className="h-72 sm:h-80 w-full relative">
                <ImageWithFallback
                  src="https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=1200&q=80"
                  alt="Modern commercial heavy freight transport truck operating on national highway corridor"
                  type="truck"
                  className="w-full h-full"
                  overlayClassName="absolute inset-0 bg-gradient-to-t from-[#091827] via-[#091827]/40 to-transparent"
                />

                {/* Floating Top Badge */}
                <div className="absolute top-4 left-4 bg-[#091827]/90 backdrop-blur-md border border-[#1E3D60] px-3 py-1.5 rounded-lg flex items-center space-x-2">
                  <Truck className="w-4 h-4 text-[#F59E0B]" />
                  <span className="text-xs font-semibold text-white tracking-wide">
                    Intercity Heavy Freight Network
                  </span>
                </div>

                <div className="absolute top-4 right-4 bg-[#091827]/90 backdrop-blur-md border border-[#1E3D60] px-2.5 py-1 rounded-md text-[11px] font-medium text-amber-300">
                  Illustrative UP Corridor
                </div>
              </div>

              {/* Seamlessly Integrated Route Corridor + Match Preview Block */}
              <div className="p-4 sm:p-5 bg-gradient-to-b from-[#091827] to-[#0F2A44] border-t border-[#1E3D60] space-y-4">
                {/* 1. Compact Animated Route Map */}
                <RouteAnimation compact={true} />

                {/* 2. Illustrative Matching Preview with Cargo & Capacity */}
                <div className="bg-[#091827]/90 border border-[#1E3D60] rounded-xl p-3.5 space-y-3">
                  <div className="flex items-center justify-between text-xs pb-2 border-b border-[#1E3D60]/60">
                    <div className="flex items-center space-x-2">
                      <Layers className="w-3.5 h-3.5 text-[#38BDF8]" />
                      <span className="font-bold text-white uppercase tracking-wider text-[11px]">
                        Illustrative Match Preview
                      </span>
                    </div>
                    <span className="text-[10px] text-amber-300/90 font-mono bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                      Demo Data
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    {/* Cargo & Weight */}
                    <div className="space-y-1">
                      <span className="text-[11px] text-slate-400 flex items-center">
                        <Package className="w-3 h-3 mr-1 text-slate-400" />
                        Sample Consignment
                      </span>
                      <p className="font-semibold text-white text-xs">
                        2.4 Tons Agri-Hardware
                      </p>
                      <p className="text-[10px] text-slate-400">Gorakhpur ➔ Lucknow</p>
                    </div>

                    {/* Available Vehicle Capacity */}
                    <div className="space-y-1">
                      <span className="text-[11px] text-slate-400 flex items-center">
                        <Truck className="w-3 h-3 mr-1 text-[#F59E0B]" />
                        Available Capacity
                      </span>
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-[#F59E0B]">4.8 Tons Free</span>
                        <span className="text-[10px] text-slate-400">38% Space</span>
                      </div>
                      {/* Capacity Meter Bar (Inspired by Ref 2) */}
                      <div className="w-full bg-[#1E3D60] h-1.5 rounded-full overflow-hidden">
                        <div className="bg-gradient-to-r from-sky-400 to-[#F59E0B] h-full w-[62%] rounded-full" />
                      </div>
                    </div>
                  </div>

                  {/* Route Compatibility & Indicative Shared Rate */}
                  <div className="pt-2 border-t border-[#1E3D60]/50 grid grid-cols-2 gap-2 text-[11px] text-slate-300">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Route Compatibility</span>
                      <span className="font-semibold text-emerald-400">NH27 Corridor • 0 km Detour</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Indicative Shared Rate</span>
                      <span className="font-semibold text-amber-300">~₹1,750 / Ton (Indicative)</span>
                    </div>
                  </div>

                  {/* Return Load Opportunity Pill */}
                  <div className="pt-2 border-t border-[#1E3D60]/50 flex items-center justify-between text-[11px] text-slate-300">
                    <span className="flex items-center text-amber-300">
                      <RotateCcw className="w-3 h-3 mr-1.5 text-[#F59E0B]" />
                      Return-Load Opportunity:
                    </span>
                    <span className="font-medium text-slate-200">
                      Lucknow ➔ Gorakhpur / Kanpur inquiry
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
