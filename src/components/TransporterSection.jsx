import React from 'react';
import { Truck, RotateCcw, CalendarCheck, ArrowRight, ShieldCheck, Fuel } from 'lucide-react';
import ImageWithFallback from './ImageWithFallback';
import { useScrollReveal } from '../hooks/useScrollReveal';

export default function TransporterSection({ onJoinTransporter }) {
  const [sectionRef, isRevealed] = useScrollReveal();

  const transporterPoints = [
    {
      title: 'List Available Vehicles',
      description: 'List your vehicles and extra space with your routes and departure dates.',
      icon: Truck
    },
    {
      title: 'Find Available Loads',
      description: 'Get matched with goods owners who need transport along your travel route.',
      icon: CalendarCheck
    },
    {
      title: 'Avoid Empty Return Trips',
      description: 'Find loads for your return journey so your vehicle never travels back empty.',
      icon: RotateCcw
    },
    {
      title: 'Track Bookings & Receipts',
      description: 'Manage your bookings, update trip progress, and share delivery receipts easily.',
      icon: ShieldCheck
    }
  ];

  return (
    <section id="for-transporters" className="py-16 sm:py-24 bg-[#0F2A44]/30 relative border-t border-[#1E3D60]/50 scroll-mt-16">
      <div
        ref={sectionRef}
        className={`max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 w-full reveal-on-scroll ${
          isRevealed ? 'is-revealed' : ''
        }`}
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          {/* Left Column: Copy & Value Proposition */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center space-x-2 bg-[#0F2A44] border border-[#1E3D60] px-3.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider text-[#F59E0B]">
              <span>For Transport Partners &amp; Fleet Operators</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Have a Vehicle or Arrange Transport?
            </h2>

            <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
              Find available loads and offer your price.
            </p>

            {/* Feature List */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {transporterPoints.map((pt) => {
                const Icon = pt.icon;
                return (
                  <div
                    key={pt.title}
                    className="bg-[#091827]/80 border border-[#1E3D60] rounded-xl p-4 hover:border-[#2A4F78] transition-colors"
                  >
                    <div className="flex items-center space-x-2.5 mb-1.5">
                      <div className="w-7 h-7 rounded-lg bg-[#152E4A] flex items-center justify-center text-[#38BDF8] border border-[#1E3D60]">
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
                onClick={onJoinTransporter}
                className="inline-flex items-center justify-center px-6 py-3 text-sm font-bold text-[#091827] bg-[#F59E0B] hover:bg-[#D97706] rounded-xl transition-all shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-white group"
              >
                <span>Find Loads</span>
                <ArrowRight className="w-4 h-4 ml-2 transition-transform duration-200 group-hover:translate-x-1" />
              </button>
            </div>
          </div>

          {/* Right Column: Freight Fleet Photo */}
          <div className="lg:col-span-5">
            <div className="relative rounded-2xl overflow-hidden border border-[#1E3D60] shadow-2xl bg-[#0F2A44] group">
              <div className="h-80 sm:h-96 w-full relative">
                <ImageWithFallback
                  src="https://images.unsplash.com/photo-1519003722824-194d4455a60c?auto=format&fit=crop&w=1000&q=80"
                  alt="Commercial transport freight trucks and highway logistics fleet"
                  type="fleet"
                  className="w-full h-full"
                  overlayClassName="absolute inset-0 bg-gradient-to-t from-[#091827] via-transparent to-transparent opacity-80"
                />

                {/* Floating pill badge */}
                <div className="absolute top-4 left-4 bg-[#091827]/90 backdrop-blur-md border border-[#1E3D60] px-3 py-1.5 rounded-lg flex items-center space-x-2">
                  <Fuel className="w-4 h-4 text-[#F59E0B]" />
                  <span className="text-xs font-semibold text-white">Cut Empty Return Kilometers</span>
                </div>

                {/* Bottom stats pill */}
                <div className="absolute bottom-4 left-4 right-4 bg-[#0F2A44]/95 backdrop-blur-md border border-[#1E3D60] p-3 rounded-xl flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-white">Vehicle Fleet Categories</p>
                    <p className="text-[11px] text-slate-400">20ft, 24ft, 32ft Containers &amp; Multi-Axle</p>
                  </div>
                  <span className="text-xs font-bold text-[#38BDF8] bg-[#38BDF8]/10 px-2.5 py-1 rounded border border-[#38BDF8]/30">
                    Fleet Ready
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
