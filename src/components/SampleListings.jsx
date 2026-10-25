import React from 'react';
import { Truck, MapPin, Calendar, AlertTriangle, ArrowRight, Package, Gauge, Sparkles } from 'lucide-react';
import { SAMPLE_LISTINGS } from '../data/sampleData';
import { useScrollReveal } from '../hooks/useScrollReveal';

export default function SampleListings({ onExpressInterest }) {
  const [sectionRef, isRevealed] = useScrollReveal();

  return (
    <section id="listings-section" className="py-16 sm:py-24 bg-[#091827] relative border-t border-[#1E3D60]/50 scroll-mt-16">
      <div
        ref={sectionRef}
        className={`max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 w-full reveal-on-scroll ${
          isRevealed ? 'is-revealed' : ''
        }`}
      >
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center space-x-2 bg-[#0F2A44] border border-[#1E3D60] px-3.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider text-[#F59E0B] mb-3">
            <span>Available Loads Preview</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Sample Route Loads &amp; Vehicles
          </h2>
          <p className="mt-3 text-base sm:text-lg text-slate-300">
            See how shared loads and return trips appear on LoadMitra.
          </p>
        </div>

        {/* Prominent Mandatory Compliance Disclaimer */}
        <div className="mb-6 p-4 bg-[#11253B] border border-amber-500/40 rounded-xl max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="w-5 h-5 text-[#F59E0B] shrink-0" />
            <p className="text-xs sm:text-sm text-amber-200/90 leading-relaxed font-medium">
              <strong className="font-bold text-white uppercase tracking-wider mr-1">
                SAMPLE PREVIEW:
              </strong>
              These are example loads to show how the system works. Looking for active, verified loads?
            </p>
          </div>
          <a
            href="/listings"
            className="px-4 py-2 bg-[#F59E0B] hover:bg-[#D97706] text-[#091827] text-xs font-bold rounded-xl shrink-0 inline-flex items-center space-x-1.5 transition-all shadow"
          >
            <Truck className="w-4 h-4" />
            <span>View All Available Loads &rarr;</span>
          </a>
        </div>

        {/* 3 Sample Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {SAMPLE_LISTINGS.map((listing) => {
            const isShared = listing.badgeVariant === 'amber';
            return (
              <div
                key={listing.id}
                className="bg-[#0F2A44]/70 border border-[#1E3D60] hover:border-[#2A4F78] rounded-2xl p-6 flex flex-col justify-between transition-all duration-300 shadow-xl relative group hover:-translate-y-1"
              >
                {/* Top Strip with Disclaimer Tag & Badge */}
                <div>
                  <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-[#1E3D60]/60 text-xs">
                    <span className="font-mono text-slate-400 font-semibold">{listing.id}</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded">
                      SAMPLE LOAD
                    </span>
                  </div>

                  {/* Route: Origin & Destination */}
                  <div className="space-y-3 mb-5">
                    <div className="flex items-start space-x-2.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#38BDF8] mt-1.5 shrink-0" />
                      <div>
                        <p className="text-xs text-slate-400 font-medium">Pickup Location</p>
                        <p className="text-sm sm:text-base font-bold text-white">{listing.origin}</p>
                      </div>
                    </div>

                    {/* Connecting line */}
                    <div className="ml-1 pl-3 border-l-2 border-dashed border-[#1E3D60] py-1 text-[11px] text-slate-400">
                      {listing.routeDistance}
                    </div>

                    <div className="flex items-start space-x-2.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#F59E0B] mt-1.5 shrink-0" />
                      <div>
                        <p className="text-xs text-slate-400 font-medium">Delivery Location</p>
                        <p className="text-sm sm:text-base font-bold text-white">{listing.destination}</p>
                      </div>
                    </div>
                  </div>

                  {/* Trip Details Grid */}
                  <div className="bg-[#091827]/80 rounded-xl p-3.5 border border-[#1E3D60] space-y-2.5 text-xs text-slate-300 mb-5">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 flex items-center">
                        <Truck className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                        Vehicle Type
                      </span>
                      <span className="font-semibold text-white text-right">{listing.vehicleType}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 flex items-center">
                        <Package className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                        Type of Goods
                      </span>
                      <span className="font-semibold text-white text-right">{listing.cargoCategory}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 flex items-center">
                        <Calendar className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                        Pickup Date
                      </span>
                      <span className="font-semibold text-slate-200 text-right">{listing.departureWindow}</span>
                    </div>

                    <div className="pt-2 border-t border-[#1E3D60]/70 flex items-center justify-between">
                      <span className="text-slate-400 flex items-center">
                        <Gauge className="w-3.5 h-3.5 mr-1.5 text-[#F59E0B]" />
                        Available Space
                      </span>
                      <span className="font-bold text-[#F59E0B] text-right">{listing.availableCapacity}</span>
                    </div>
                  </div>

                  {/* Indicative Rate Note */}
                  <div className="mb-4 px-3 py-2 bg-[#11253B] rounded-lg border border-[#1E3D60] text-center">
                    <p className="text-[11px] text-slate-400">Estimated Price</p>
                    <p className="text-xs font-semibold text-white">{listing.indicativeRange}</p>
                  </div>

                  {/* Per-card disclaimer note */}
                  <div className="mb-4 text-[10px] text-amber-200/80 bg-amber-500/5 border border-amber-500/20 p-2 rounded text-center leading-tight">
                    {listing.disclaimer}
                  </div>
                </div>

                {/* Bottom Action */}
                <div>
                  <button
                    type="button"
                    onClick={() => {
                      if (onExpressInterest) onExpressInterest(listing);
                    }}
                    className="w-full inline-flex items-center justify-center px-4 py-2.5 text-xs font-bold text-[#091827] bg-[#F59E0B] hover:bg-[#D97706] rounded-xl transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-white group"
                  >
                    <span>Ask About This Load</span>
                    <ArrowRight className="w-3.5 h-3.5 ml-1.5 transition-transform duration-200 group-hover:translate-x-1" />
                  </button>
                  <p className="text-[10px] text-center text-slate-500 mt-2">
                    Connects with our transport team
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
