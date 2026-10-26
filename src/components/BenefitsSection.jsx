import React from 'react';
import { Boxes, ArrowLeftRight, ShieldCheck, Gauge, CheckCircle2 } from 'lucide-react';
import { CORE_BENEFITS } from '../data/sampleData';
import { useScrollReveal } from '../hooks/useScrollReveal';

export default function BenefitsSection() {
  const [sectionRef, isRevealed] = useScrollReveal();

  const getIcon = (iconName) => {
    switch (iconName) {
      case 'Boxes':
        return <Boxes className="w-5 h-5 text-[#F28C28]" />;
      case 'ArrowLeftRight':
        return <ArrowLeftRight className="w-5 h-5 text-[#F28C28]" />;
      case 'ShieldCheck':
        return <ShieldCheck className="w-5 h-5 text-[#F28C28]" />;
      case 'Gauge':
        return <Gauge className="w-5 h-5 text-[#F28C28]" />;
      default:
        return <Boxes className="w-5 h-5 text-[#F28C28]" />;
    }
  };

  return (
    <section id="benefits-section" className="py-16 sm:py-24 bg-[#F5F0E6] relative border-b border-[#E2DBD0]">
      <div
        ref={sectionRef}
        className={`max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 w-full reveal-on-scroll ${
          isRevealed ? 'is-revealed' : ''
        }`}
      >
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <div className="inline-flex items-center space-x-2 bg-[#171717] border border-[#2D2D2D] px-3 py-1 rounded text-white mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-[#F28C28]" />
            <span className="text-[10px] font-mono font-bold uppercase tracking-[0.14em] text-[#F5F0E6]">
              NETWORK CAPABILITIES
            </span>
          </div>
          <h2 
            className="text-3xl sm:text-4xl font-black text-[#171717] tracking-tight"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            Engineered for Freight Efficiency
          </h2>
          <p className="mt-3 text-base text-[#525252] leading-relaxed">
            LoadMitra bridges fragmented cargo demand with spare vehicle capacity to address high shipping expenses and empty return hauls.
          </p>
        </div>

        {/* 4 Structured Information Modules */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {CORE_BENEFITS.map((item) => (
            <div
              key={item.id}
              className="bg-[#FAF7F0] border border-[#D4CBBC] rounded p-5 flex flex-col justify-between hover:border-[#F28C28] transition-colors shadow-xs group"
            >
              <div>
                {/* Header Tag & Icon */}
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#E2DBD0]">
                  <div className="w-9 h-9 rounded bg-[#171717] border border-[#2D2D2D] flex items-center justify-center shrink-0">
                    {getIcon(item.icon)}
                  </div>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#737373] bg-[#E8E1D5] px-2 py-0.5 rounded border border-[#D4CBBC]">
                    {item.tagline}
                  </span>
                </div>

                {/* Title & Description */}
                <h3 className="text-sm font-bold uppercase tracking-wider text-[#171717] mb-2 group-hover:text-[#DE7919] transition-colors">
                  {item.title}
                </h3>
                <p className="text-xs text-[#525252] leading-relaxed">
                  {item.description}
                </p>
              </div>

              {/* Bottom Operational Specification */}
              <div className="mt-5 pt-3 border-t border-[#E2DBD0] flex items-center text-[10px] font-mono font-semibold text-[#737373]">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#F28C28] mr-1.5 shrink-0" />
                <span>ACTIVE SPECIFICATION</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
