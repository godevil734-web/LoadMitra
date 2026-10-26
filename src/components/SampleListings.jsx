import React from 'react';
import { Truck, MapPin, Calendar, AlertTriangle, ArrowRight, Package, Gauge, Sparkles } from 'lucide-react';
import { SAMPLE_LISTINGS } from '../data/sampleData';
import { useScrollReveal } from '../hooks/useScrollReveal';

export default function SampleListings({ onExpressInterest }) {
  const [sectionRef, isRevealed] = useScrollReveal();

  return (
    <section id="listings-section" className="py-16 sm:py-24 bg-[#F5F0E6] relative border-b border-[#E2DBD0] scroll-mt-16">
      <div
        ref={sectionRef}
        className={`max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 w-full reveal-on-scroll ${
          isRevealed ? 'is-revealed' : ''
        }`}
      >
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center space-x-2 bg-[#171717] border border-[#2D2D2D] px-3 py-1 rounded text-white mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-[#F28C28]" />
            <span className="text-[10px] font-mono font-bold uppercase tracking-[0.14em] text-[#F5F0E6]">
              CORRIDOR MANIFEST PREVIEW
            </span>
          </div>
          <h2 
            className="text-3xl sm:text-4xl font-black text-[#171717] tracking-tight"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            Sample Route Loads &amp; Vehicles
          </h2>
          <p className="mt-3 text-base text-[#525252]">
            Representative freight manifests across active intercity corridors illustrating shared space and backhaul coordination.
          </p>
        </div>

        {/* Operational Compliance Disclaimer Banner */}
        <div className="mb-6 p-4 bg-[#FAF7F0] border border-[#D4CBBC] rounded max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="w-5 h-5 text-[#F28C28] shrink-0" />
            <p className="text-xs text-[#525252] leading-relaxed">
              <strong className="font-mono font-bold text-[#171717] uppercase tracking-wider mr-1">
                SAMPLE PREVIEW:
              </strong>
              These are illustrative consignments to demonstrate network matching. Looking for active live loads?
            </p>
          </div>
          <a
            href="/listings"
            className="px-4 py-2 bg-[#F28C28] hover:bg-[#DE7919] text-[#171717] text-xs font-mono font-bold uppercase tracking-wider rounded shrink-0 inline-flex items-center space-x-1.5 transition-all shadow-xs"
          >
            <Truck className="w-3.5 h-3.5" />
            <span>Open Live Marketplace &rarr;</span>
          </a>
        </div>

        {/* Structured Horizontal Freight Rows */}
        <div className="space-y-3">
          {SAMPLE_LISTINGS.map((listing) => (
            <div
              key={listing.id}
              className="bg-[#FAF7F0] border border-[#D4CBBC] hover:border-[#F28C28] rounded p-4 sm:p-5 transition-all duration-150 shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 group"
            >
              {/* Left Segment: ID + Route Connector */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 lg:gap-6 min-w-0 lg:w-[42%]">
                <div className="shrink-0">
                  <span className="font-mono text-xs font-bold text-[#171717] bg-[#E8E1D5] px-2.5 py-1 rounded border border-[#D4CBBC]">
                    {listing.id}
                  </span>
                  <span className="ml-2 text-[9px] font-mono font-bold uppercase tracking-wider text-[#737373]">
                    SAMPLE
                  </span>
                </div>

                {/* Route Visualizer */}
                <div className="flex items-center space-x-3">
                  <div className="text-left">
                    <p className="text-[10px] font-mono uppercase text-[#737373]">ORIGIN</p>
                    <p className="text-sm font-bold text-[#171717]">{listing.origin}</p>
                  </div>

                  <div className="flex flex-col items-center px-2">
                    <span className="text-[10px] font-mono text-[#F28C28] font-semibold">{listing.routeDistance}</span>
                    <div className="flex items-center space-x-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#171717]" />
                      <div className="w-10 sm:w-16 h-0.5 border-t border-dashed border-[#171717]" />
                      <ArrowRight className="w-3 h-3 text-[#F28C28]" />
                    </div>
                  </div>

                  <div className="text-left">
                    <p className="text-[10px] font-mono uppercase text-[#737373]">DESTINATION</p>
                    <p className="text-sm font-bold text-[#171717]">{listing.destination}</p>
                  </div>
                </div>
              </div>

              {/* Middle Segment: Vehicle, Cargo & Capacity in Tabular Numerals */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs lg:w-[38%] border-t lg:border-t-0 border-[#E2DBD0] pt-3 lg:pt-0">
                <div>
                  <span className="text-[10px] font-mono uppercase text-[#737373] block">VEHICLE CLASS</span>
                  <span className="font-semibold text-[#171717] block truncate">{listing.vehicleType}</span>
                  <span className="text-[11px] text-[#737373]">{listing.cargoCategory}</span>
                </div>

                <div>
                  <span className="text-[10px] font-mono uppercase text-[#737373] block">AVAILABLE DECK</span>
                  <span className="font-mono font-bold text-[#F28C28] block">{listing.availableCapacity}</span>
                  <span className="text-[10px] text-[#737373]">{listing.departureWindow}</span>
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <span className="text-[10px] font-mono uppercase text-[#737373] block">EST. RATE</span>
                  <span className="font-mono font-bold text-[#171717] block">{listing.indicativeRange}</span>
                  <span className="text-[9px] font-mono text-emerald-600 font-semibold">SHARED PRICING</span>
                </div>
              </div>

              {/* Right Segment: Action */}
              <div className="shrink-0 w-full lg:w-auto pt-2 lg:pt-0 border-t lg:border-t-0 border-[#E2DBD0]">
                <button
                  type="button"
                  onClick={() => {
                    if (onExpressInterest) onExpressInterest(listing);
                  }}
                  className="w-full lg:w-auto inline-flex items-center justify-center px-4 py-2 text-xs font-mono font-bold uppercase tracking-wider text-[#171717] bg-[#E8E1D5] hover:bg-[#F28C28] hover:text-[#171717] border border-[#D4CBBC] hover:border-[#F28C28] rounded transition-all shadow-xs"
                >
                  <span>Inquire Corridor</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
