import React from 'react';
import { Warehouse, ArrowRight, TrendingDown, Layers, Calculator, FileCheck2 } from 'lucide-react';
import ImageWithFallback from './ImageWithFallback';
import { useScrollReveal } from '../hooks/useScrollReveal';

export default function BusinessSection({ onFindTransport }) {
  const [sectionRef, isRevealed] = useScrollReveal();

  const businessPoints = [
    {
      title: 'Find Suitable Transport Options',
      description: 'Access commercial vehicle categories suited for FTL (Full Truckload) and PTL (Part Truckload) needs across major industrial corridors.',
      icon: Layers
    },
    {
      title: 'Explore Compatible Shared Loads',
      description: 'Consolidate shipments with non-competing, compatible goods traveling the same highway route to optimize trip expenses.',
      icon: TrendingDown
    },
    {
      title: 'Compare Estimated Costs',
      description: 'Gain transparency into prevailing corridor freight costs without opaque intermediary commissions or unexpected surcharges.',
      icon: Calculator
    },
    {
      title: 'Manage Shipment Requests',
      description: 'Keep documentation, loading appointments, and dispatch communications organized in one centralized workflow.',
      icon: FileCheck2
    }
  ];

  return (
    <section id="for-businesses" className="py-16 sm:py-24 bg-[#091827] relative border-t border-[#1E3D60]/50 scroll-mt-16">
      <div
        ref={sectionRef}
        className={`max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 w-full reveal-on-scroll ${
          isRevealed ? 'is-revealed' : ''
        }`}
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          {/* Left Column: Warehouse & Cargo Photo */}
          <div className="lg:col-span-5 order-2 lg:order-1">
            <div className="relative rounded-2xl overflow-hidden border border-[#1E3D60] shadow-2xl bg-[#0F2A44] group">
              <div className="h-80 sm:h-96 w-full relative">
                <ImageWithFallback
                  src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1000&q=80"
                  alt="Modern logistics distribution warehouse with organized cargo pallets"
                  type="warehouse"
                  className="w-full h-full"
                  overlayClassName="absolute inset-0 bg-gradient-to-t from-[#091827] via-transparent to-transparent opacity-80"
                />
                {/* Floating pill badge */}
                <div className="absolute top-4 left-4 bg-[#091827]/90 backdrop-blur-md border border-[#1E3D60] px-3 py-1.5 rounded-lg flex items-center space-x-2">
                  <Warehouse className="w-4 h-4 text-[#F59E0B]" />
                  <span className="text-xs font-semibold text-white">Shippers &amp; Manufacturers</span>
                </div>

                {/* Bottom stats pill */}
                <div className="absolute bottom-4 left-4 right-4 bg-[#0F2A44]/95 backdrop-blur-md border border-[#1E3D60] p-3 rounded-xl flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-white">Small &amp; Medium Enterprises</p>
                    <p className="text-[11px] text-slate-400">Agricultural Traders, Wholesalers, OEMs</p>
                  </div>
                  <span className="text-xs font-bold text-[#F59E0B] bg-[#F59E0B]/10 px-2.5 py-1 rounded border border-[#F59E0B]/30">
                    B2B Ready
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Copy & Value Proposition */}
          <div className="lg:col-span-7 order-1 lg:order-2 space-y-6">
            <div className="inline-flex items-center space-x-2 bg-[#0F2A44] border border-[#1E3D60] px-3.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider text-[#F59E0B]">
              <span>For Shippers &amp; Businesses</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Ship Smarter. Spend Less.
            </h2>

            <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
              Whether you are shipping full truckloads or periodic partial consignments, RouteWise helps you tap into available vehicle space on active commercial corridors.
            </p>

            {/* Feature List */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {businessPoints.map((pt) => {
                const Icon = pt.icon;
                return (
                  <div
                    key={pt.title}
                    className="bg-[#0F2A44]/50 border border-[#1E3D60] rounded-xl p-4 hover:border-[#2A4F78] transition-colors"
                  >
                    <div className="flex items-center space-x-2.5 mb-1.5">
                      <div className="w-7 h-7 rounded-lg bg-[#152E4A] flex items-center justify-center text-[#F59E0B] border border-[#1E3D60]">
                        <Icon className="w-4 h-4" />
                      </div>
                      <h3 className="text-sm font-bold text-white">{pt.title}</h3>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed pl-9">
                      {pt.description}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* CTA */}
            <div className="pt-2">
              <button
                type="button"
                onClick={onFindTransport}
                className="inline-flex items-center justify-center px-6 py-3 text-sm font-bold text-[#091827] bg-[#F59E0B] hover:bg-[#D97706] rounded-xl transition-all shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-white group"
              >
                <span>Find Transport</span>
                <ArrowRight className="w-4 h-4 ml-2 transition-transform duration-200 group-hover:translate-x-1" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
