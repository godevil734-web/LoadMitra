import React, { useState } from 'react';
import { 
  Truck, 
  RotateCcw, 
  Package, 
  Clock, 
  ShieldCheck, 
  AlertCircle, 
  Compass, 
  Banknote, 
  Check, 
  ArrowRight,
  TrendingDown,
  Layers
} from 'lucide-react';
import { useScrollReveal } from '../hooks/useScrollReveal';

export default function ProductStorytelling() {
  const [sectionRef, isRevealed] = useScrollReveal();
  const [activeWorkflow, setActiveWorkflow] = useState('shipper'); // 'shipper' | 'transporter'

  return (
    <section 
      id="product-story" 
      className="py-20 sm:py-28 bg-[#FAFAF7] text-[#091827] border-y border-stone-200/80 scroll-mt-16 transition-colors"
    >
      <div
        ref={sectionRef}
        className={`max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 w-full reveal-on-scroll ${
          isRevealed ? 'is-revealed' : ''
        }`}
      >
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14 sm:mb-18">
          <div className="inline-flex items-center space-x-2 bg-amber-500/10 border border-amber-500/30 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-amber-800 mb-3">
            <span>Visual Product Architecture</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#091827] tracking-tight">
            How RouteWise Coordinates Freight
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed">
            A visual walkthrough of our matching logic: verifying payload weight, spare vehicle capacity, direct route alignment, and shared-cost economics without deadhead waste.
          </p>

          {/* Interactive Switcher */}
          <div className="mt-8 inline-flex p-1.5 bg-stone-200/70 rounded-xl border border-stone-300 shadow-inner">
            <button
              type="button"
              onClick={() => setActiveWorkflow('shipper')}
              className={`px-5 py-2.5 rounded-lg text-xs sm:text-sm font-bold transition-all flex items-center space-x-2 ${
                activeWorkflow === 'shipper'
                  ? 'bg-[#091827] text-white shadow-md'
                  : 'text-slate-600 hover:text-[#091827]'
              }`}
            >
              <Package className="w-4 h-4 text-[#F59E0B]" />
              <span>Shipper Walkthrough: Shared Load Matching</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveWorkflow('transporter')}
              className={`px-5 py-2.5 rounded-lg text-xs sm:text-sm font-bold transition-all flex items-center space-x-2 ${
                activeWorkflow === 'transporter'
                  ? 'bg-[#091827] text-white shadow-md'
                  : 'text-slate-600 hover:text-[#091827]'
              }`}
            >
              <RotateCcw className="w-4 h-4 text-[#38BDF8]" />
              <span>Transporter Walkthrough: Return-Load Discovery</span>
            </button>
          </div>
        </div>

        {/* SHIPPER JOURNEY: 5-STAGE MATCHING DEMONSTRATION */}
        {activeWorkflow === 'shipper' && (
          <div className="space-y-8 animate-fadeIn">
            {/* 5-Step Process Track Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {[
                { step: '01', title: 'Post Cargo', desc: 'Specify weight & route' },
                { step: '02', title: 'Identify Trip', desc: 'Scan matching vehicle' },
                { step: '03', title: 'Capacity Check', desc: 'Verify payload & volume' },
                { step: '04', title: 'Cost Estimate', desc: 'Review shared pricing' },
                { step: '05', title: 'Request Booking', desc: 'Direct coordination' },
              ].map((item) => (
                <div 
                  key={item.step} 
                  className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm flex items-center space-x-3"
                >
                  <div className="w-8 h-8 rounded-lg bg-[#0F2A44] text-[#F59E0B] font-bold text-xs flex items-center justify-center shrink-0">
                    {item.step}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#091827]">{item.title}</h4>
                    <p className="text-[11px] text-slate-500 leading-tight">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Main Interactive Matching Dashboard Preview Card */}
            <div className="bg-white border border-stone-200/90 rounded-2xl p-6 sm:p-8 shadow-xl">
              {/* Header inside card */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-stone-100 gap-3">
                <div className="flex items-center space-x-3">
                  <div className="w-11 h-11 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600 shrink-0">
                    <Truck className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-[#091827]">
                      Illustrative Matching Simulation: Gorakhpur ➔ Lucknow (NH27 Corridor)
                    </h3>
                    <p className="text-xs text-slate-500">
                      Demonstrates how shipment weight, vehicle payload capacity, route directness, and shared rates converge
                    </p>
                  </div>
                </div>
                <span className="text-[11px] font-semibold text-amber-800 bg-amber-100/80 px-3 py-1 rounded-full border border-amber-300 shrink-0">
                  Illustrative demo data — not live availability
                </span>
              </div>

              {/* 4 Core Dimensions Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 pt-6">
                {/* 1. SHIPMENT WEIGHT & SPECIFICATION */}
                <div className="bg-stone-50 border border-stone-200 rounded-xl p-5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-xs mb-3 pb-2 border-b border-stone-200">
                      <span className="font-bold text-slate-700 uppercase tracking-wide text-[10px] flex items-center">
                        <Package className="w-3.5 h-3.5 mr-1 text-[#F59E0B]" />
                        1. Shipment Weight
                      </span>
                      <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                        Shipper Cargo
                      </span>
                    </div>

                    <div className="space-y-2">
                      <div>
                        <p className="text-2xl font-black text-[#091827]">2.5 Tons</p>
                        <p className="text-xs font-semibold text-slate-700">Agri-Hardware & Tools</p>
                      </div>
                      <div className="text-[11px] text-slate-500 space-y-1 pt-1">
                        <p className="flex justify-between">
                          <span>Packaging:</span>
                          <span className="font-medium text-slate-700">Standard Pallets (4 Units)</span>
                        </p>
                        <p className="flex justify-between">
                          <span>Volume:</span>
                          <span className="font-medium text-slate-700">~6.8 m³ Volume</span>
                        </p>
                        <p className="flex justify-between">
                          <span>Pickup Window:</span>
                          <span className="font-medium text-slate-700">Morning Dispatch</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-2.5 border-t border-stone-200 text-[10px] text-slate-500 flex items-center text-emerald-700 font-semibold">
                    <Check className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                    Weight within PTL threshold
                  </div>
                </div>

                {/* 2. AVAILABLE TRUCK CAPACITY */}
                <div className="bg-stone-50 border border-stone-200 rounded-xl p-5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-xs mb-3 pb-2 border-b border-stone-200">
                      <span className="font-bold text-slate-700 uppercase tracking-wide text-[10px] flex items-center">
                        <Truck className="w-3.5 h-3.5 mr-1 text-sky-600" />
                        2. Available Capacity
                      </span>
                      <span className="text-[10px] font-mono text-sky-800 bg-sky-100 px-2 py-0.5 rounded">
                        TRC-UP-104
                      </span>
                    </div>

                    <div>
                      <div className="flex items-baseline justify-between">
                        <span className="text-2xl font-black text-sky-700">5.8 Tons</span>
                        <span className="text-xs font-bold text-slate-500">Spare Payload</span>
                      </div>
                      <p className="text-xs text-slate-600">32ft Multi-Axle (14T Gross Max)</p>
                    </div>

                    {/* Capacity Progress Bar */}
                    <div className="my-3 space-y-1">
                      <div className="flex justify-between text-[11px] text-slate-600">
                        <span>Load Distribution</span>
                        <span className="font-bold text-[#091827]">58% Allocated</span>
                      </div>
                      <div className="w-full bg-stone-200 h-2.5 rounded-full overflow-hidden flex">
                        <div className="bg-[#0F2A44] h-full w-[58%]" title="Existing Primary Consignment (8.2T)" />
                        <div className="bg-[#F59E0B] h-full w-[18%]" title="Matched Shipment (2.5T)" />
                        <div className="bg-stone-300 h-full w-[24%]" title="Spare Payload (3.3T)" />
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-400">
                        <span>8.2T Booked</span>
                        <span className="text-amber-700 font-bold">+2.5T Fits</span>
                        <span>3.3T Open</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-2 pt-2.5 border-t border-stone-200 text-[10px] text-slate-500 flex items-center text-emerald-700 font-semibold">
                    <Check className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                    Weight &amp; cubic dimensions verified
                  </div>
                </div>

                {/* 3. ROUTE COMPATIBILITY */}
                <div className="bg-stone-50 border border-stone-200 rounded-xl p-5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-xs mb-3 pb-2 border-b border-stone-200">
                      <span className="font-bold text-slate-700 uppercase tracking-wide text-[10px] flex items-center">
                        <Compass className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                        3. Route Compatibility
                      </span>
                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                        100% Match
                      </span>
                    </div>

                    <div>
                      <p className="text-2xl font-black text-emerald-700">0 km</p>
                      <p className="text-xs font-semibold text-slate-700">No Detour Required</p>
                    </div>

                    <div className="mt-3 text-[11px] text-slate-600 space-y-1.5">
                      <div className="flex items-start space-x-1.5">
                        <span className="w-2 h-2 rounded-full bg-sky-500 mt-1 shrink-0" />
                        <div>
                          <strong className="text-[#091827]">Origin:</strong> Gorakhpur (GIDA)
                        </div>
                      </div>
                      <div className="pl-3.5 border-l border-dashed border-stone-300 text-[10px] text-slate-400">
                        NH27 Direct Arterial (272 km)
                      </div>
                      <div className="flex items-start space-x-1.5">
                        <span className="w-2 h-2 rounded-full bg-amber-500 mt-1 shrink-0" />
                        <div>
                          <strong className="text-[#091827]">Destination:</strong> Lucknow (Transport Nagar)
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-2.5 border-t border-stone-200 text-[10px] text-slate-500 flex items-center text-emerald-700 font-semibold">
                    <Check className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                    Transit schedule aligns within 45 mins
                  </div>
                </div>

                {/* 4. INDICATIVE SHARED-COST ESTIMATE */}
                <div className="bg-[#091827] text-white rounded-xl p-5 flex flex-col justify-between shadow-lg">
                  <div>
                    <div className="flex items-center justify-between text-xs mb-3 pb-2 border-b border-[#1E3D60]">
                      <span className="font-bold text-amber-400 uppercase tracking-wide text-[10px] flex items-center">
                        <Banknote className="w-3.5 h-3.5 mr-1 text-[#F59E0B]" />
                        4. Indicative Cost
                      </span>
                      <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                        Estimate
                      </span>
                    </div>

                    <div>
                      <p className="text-xs text-slate-400 uppercase font-semibold">Indicative Shared Rate</p>
                      <p className="text-3xl font-black text-white mt-0.5">
                        ₹1,750 <span className="text-xs font-normal text-slate-400">/ Ton</span>
                      </p>
                      <p className="text-xs text-amber-300 font-semibold mt-1">
                        Est. Shipment Total: ₹4,375
                      </p>
                    </div>

                    <div className="mt-3 p-2.5 bg-[#11253B] rounded-lg border border-[#1E3D60] text-[11px] text-slate-300 space-y-1">
                      <div className="flex items-center text-emerald-400">
                        <TrendingDown className="w-3 h-3 mr-1 shrink-0" />
                        <span className="font-semibold">Shared Consolidation</span>
                      </div>
                      <p className="text-[10px] text-slate-400 leading-snug">
                        Avoids paying for a full 14-ton charter when moving a 2.5-ton partial consignment.
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 pt-2.5 border-t border-[#1E3D60] text-[10px] text-slate-400">
                    Direct coordination initiated upon booking request
                  </div>
                </div>
              </div>

              {/* Bottom Clarification Bar */}
              <div className="mt-6 pt-5 border-t border-stone-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-slate-500">
                <p>
                  <strong>Notice:</strong> Rates and schedules shown are illustrative trip models for demonstration, not live availability or guaranteed savings.
                </p>
                <div className="flex items-center space-x-2 text-xs font-semibold text-[#091827]">
                  <Layers className="w-4 h-4 text-[#F59E0B]" />
                  <span>Phase 1 Demonstration Model</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TRANSPORTER JOURNEY: RETURN-LOAD DISCOVERY WALKTHROUGH */}
        {activeWorkflow === 'transporter' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="bg-white border border-stone-200/90 rounded-2xl p-6 sm:p-8 shadow-xl">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-stone-100 gap-3">
                <div className="flex items-center space-x-3">
                  <div className="w-11 h-11 rounded-xl bg-sky-500/10 flex items-center justify-center text-sky-600 shrink-0">
                    <RotateCcw className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-[#091827]">
                      How Transporters Discover Return Loads &amp; Eliminate Deadheading
                    </h3>
                    <p className="text-xs text-slate-500">
                      Transforming empty return trips into revenue-generating return hauls
                    </p>
                  </div>
                </div>
                <span className="text-[11px] font-semibold text-sky-800 bg-sky-100/80 px-3 py-1 rounded-full border border-sky-300 shrink-0">
                  Transporter Utilization Framework
                </span>
              </div>

              {/* Comparative Cards: The Dilemma vs The RouteWise Corridor */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
                {/* Traditional Dilemma */}
                <div className="bg-rose-50/70 border border-rose-200 rounded-xl p-5 space-y-3">
                  <div className="flex items-center space-x-2 text-rose-800 text-xs font-bold uppercase tracking-wide">
                    <AlertCircle className="w-4 h-4 text-rose-600" />
                    <span>The Industry Problem: Empty Return Miles ("Deadhead")</span>
                  </div>
                  <div className="space-y-2 text-xs text-slate-700 leading-relaxed">
                    <p>
                      <strong>1. Outbound trip completed:</strong> A transporter carries goods from Gorakhpur to Lucknow.
                    </p>
                    <p>
                      <strong>2. No return freight:</strong> The truck must return to home base with an empty cargo bed.
                    </p>
                    <p>
                      <strong>3. Pure overhead on return leg:</strong> Fuel, toll taxes, and driver time are spent with zero revenue.
                    </p>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-rose-200 text-xs text-rose-900 font-medium">
                    Uncompensated fuel and vehicle depreciation on empty return legs severely depress fleet profitability.
                  </div>
                </div>

                {/* RouteWise Solution */}
                <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-5 space-y-3">
                  <div className="flex items-center space-x-2 text-emerald-800 text-xs font-bold uppercase tracking-wide">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>The RouteWise Solution: Return Corridor Alerts</span>
                  </div>
                  <div className="space-y-2 text-xs text-slate-700 leading-relaxed">
                    <p>
                      <strong>1. Transporter publishes return route:</strong> "Unloading in Lucknow/Kanpur, returning toward East UP".
                    </p>
                    <p>
                      <strong>2. RouteWise alerts matching shippers:</strong> Regional shippers requiring dispatch along the return corridor are identified.
                    </p>
                    <p>
                      <strong>3. Return payload secured:</strong> The transporter takes on cargo for the return leg rather than driving empty.
                    </p>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-emerald-200 text-xs text-emerald-900 font-medium">
                    Fleet owners earn revenue on return kilometers while shippers benefit from competitive shared return tariffs.
                  </div>
                </div>
              </div>

              {/* 3-Step Return Haul Flow */}
              <div className="mt-6 pt-6 border-t border-stone-100 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 text-xs">
                  <span className="font-bold text-[#F59E0B] text-[11px] block mb-1">STAGE 1</span>
                  <h4 className="font-bold text-[#091827]">Deliver Primary Outbound Cargo</h4>
                  <p className="text-slate-600 mt-1 text-[11px] leading-relaxed">
                    Unload consignment at terminal (e.g. Lucknow / Kanpur Industrial Belt).
                  </p>
                </div>

                <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 text-xs">
                  <span className="font-bold text-sky-600 text-[11px] block mb-1">STAGE 2</span>
                  <h4 className="font-bold text-[#091827]">Query Return Freight Corridor</h4>
                  <p className="text-slate-600 mt-1 text-[11px] leading-relaxed">
                    RouteWise identifies compatible shipments headed back toward home hub.
                  </p>
                </div>

                <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 text-xs">
                  <span className="font-bold text-emerald-600 text-[11px] block mb-1">STAGE 3</span>
                  <h4 className="font-bold text-[#091827]">Complete Profitable Round-Trip</h4>
                  <p className="text-slate-600 mt-1 text-[11px] leading-relaxed">
                    Return journey generates revenue, optimizing total vehicle yield per kilometer.
                  </p>
                </div>
              </div>

              {/* Disclaimer */}
              <p className="mt-4 text-[11px] text-center text-slate-500 italic">
                Illustrative data models for conceptual demonstration — not an assurance of immediate return cargo or fixed earnings.
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
