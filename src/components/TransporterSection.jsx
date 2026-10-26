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
    <section id="for-transporters" className="py-16 sm:py-24 bg-[#F5F0E6] relative border-b border-[#E2DBD0] scroll-mt-16">
      <div
        ref={sectionRef}
        className={`max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 w-full reveal-on-scroll ${
          isRevealed ? 'is-revealed' : ''
        }`}
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: Copy & Value Proposition */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center space-x-2 bg-[#171717] border border-[#2D2D2D] px-3 py-1 rounded text-white">
              <span className="w-1.5 h-1.5 rounded-full bg-[#F28C28]" />
              <span className="text-[10px] font-mono font-bold uppercase tracking-[0.14em] text-[#F5F0E6]">
                FOR CARRIERS & FLEET PARTNERS
              </span>
            </div>

            <h2 
              className="text-3xl sm:text-4xl font-black text-[#171717] tracking-tight"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              Operate Commercial Vehicles?
            </h2>

            <p className="text-base text-[#525252] leading-relaxed">
              Discover real loads across your primary transit corridors and eliminate unpaid return kilometers.
            </p>

            {/* Feature List */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
              {transporterPoints.map((pt) => {
                const Icon = pt.icon;
                return (
                  <div
                    key={pt.title}
                    className="bg-[#FAF7F0] border border-[#D4CBBC] rounded p-4 hover:border-[#F28C28] transition-colors shadow-xs"
                  >
                    <div className="flex items-center space-x-2.5 mb-1.5">
                      <div className="w-7 h-7 rounded bg-[#171717] flex items-center justify-center text-[#F28C28] shrink-0">
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-[#171717]">{pt.title}</h3>
                    </div>
                    <p className="text-xs text-[#525252] leading-relaxed pl-9">
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
                className="inline-flex items-center justify-center px-5 py-2.5 text-xs font-mono font-bold uppercase tracking-wider text-[#171717] bg-[#F28C28] hover:bg-[#DE7919] rounded transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-[#171717] group"
              >
                <span>Find Available Corridor Loads</span>
                <ArrowRight className="w-3.5 h-3.5 ml-2 transition-transform duration-150 group-hover:translate-x-0.5" />
              </button>
            </div>
          </div>

          {/* Right Column: Freight Fleet Photo */}
          <div className="lg:col-span-5">
            <div className="relative rounded-lg overflow-hidden border border-[#2D2D2D] shadow-xl bg-[#171717] group">
              <div className="h-72 sm:h-88 w-full relative">
                <ImageWithFallback
                  src="https://images.unsplash.com/photo-1519003722824-194d4455a60c?auto=format&fit=crop&w=1000&q=80"
                  alt="Commercial transport freight trucks and highway logistics fleet"
                  type="fleet"
                  className="w-full h-full object-cover"
                  overlayClassName="absolute inset-0 bg-gradient-to-t from-[#171717] via-transparent to-transparent opacity-80"
                />

                {/* Floating pill badge */}
                <div className="absolute top-3.5 left-3.5 bg-[#171717]/95 border border-[#3D3D3D] px-2.5 py-1 rounded flex items-center space-x-2">
                  <Fuel className="w-3.5 h-3.5 text-[#F28C28]" />
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-white">
                    ZERO DEADHEAD OPERATION
                  </span>
                </div>

                {/* Bottom stats pill */}
                <div className="absolute bottom-3.5 left-3.5 right-3.5 bg-[#171717]/95 border border-[#2D2D2D] p-3 rounded flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-white">Fleet Classifications</p>
                    <p className="text-[10px] font-mono text-[#A3A3A3]">LCV, 24ft, 32ft Containers &amp; Trailers</p>
                  </div>
                  <span className="text-[10px] font-mono font-bold uppercase text-[#F28C28] bg-[#F28C28]/10 px-2 py-0.5 rounded border border-[#F28C28]/30">
                    FLEET READY
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
