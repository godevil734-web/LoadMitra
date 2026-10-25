import React from 'react';
import { Boxes, ArrowLeftRight, ShieldCheck, Gauge, CheckCircle2 } from 'lucide-react';
import { CORE_BENEFITS } from '../data/sampleData';
import { useScrollReveal } from '../hooks/useScrollReveal';

export default function BenefitsSection() {
  const [sectionRef, isRevealed] = useScrollReveal();

  const getIcon = (iconName) => {
    switch (iconName) {
      case 'Boxes':
        return <Boxes className="w-7 h-7" />;
      case 'ArrowLeftRight':
        return <ArrowLeftRight className="w-7 h-7" />;
      case 'ShieldCheck':
        return <ShieldCheck className="w-7 h-7" />;
      case 'Gauge':
        return <Gauge className="w-7 h-7" />;
      default:
        return <Boxes className="w-7 h-7" />;
    }
  };

  return (
    <section id="benefits-section" className="py-16 sm:py-24 bg-[#091827] relative border-t border-[#1E3D60]/50">
      <div
        ref={sectionRef}
        className={`max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 w-full reveal-on-scroll ${
          isRevealed ? 'is-revealed' : ''
        }`}
      >
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <div className="inline-flex items-center space-x-2 bg-[#0F2A44] border border-[#1E3D60] px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider text-[#F59E0B] mb-3">
            <span>Marketplace Architecture</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Designed for Modern Freight Efficiency
          </h2>
          <p className="mt-3 text-base sm:text-lg text-slate-300">
            LoadMitra connects fragmented cargo demand with spare vehicle capacity to address the twin challenges of high shipping expenses and empty return hauls.
          </p>
        </div>

        {/* 4 Core Benefit Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {CORE_BENEFITS.map((item, idx) => {
            const isFeatured = item.accentColor === 'amber';
            return (
              <div
                key={item.id}
                className={`relative rounded-2xl p-6 transition-all duration-300 group flex flex-col justify-between ${
                  isFeatured
                    ? 'bg-gradient-to-b from-[#152E4A] to-[#0F2A44] border-2 border-[#F59E0B]/60 shadow-xl shadow-[#F59E0B]/5 hover:-translate-y-1'
                    : 'bg-[#0F2A44]/60 hover:bg-[#0F2A44] border border-[#1E3D60] hover:border-[#2A4F78] shadow-lg hover:-translate-y-1'
                }`}
              >
                {/* Top Badge */}
                <div className="flex items-center justify-between mb-4">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                      isFeatured
                        ? 'bg-[#F59E0B] text-[#091827]'
                        : 'bg-[#152E4A] text-[#38BDF8] group-hover:text-white border border-[#1E3D60]'
                    }`}
                  >
                    {getIcon(item.icon)}
                  </div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 bg-[#091827]/60 px-2 py-0.5 rounded border border-[#1E3D60]/50">
                    {item.tagline}
                  </span>
                </div>

                {/* Content */}
                <div>
                  <h3 className="text-xl font-bold text-white mb-2 tracking-tight group-hover:text-[#F59E0B] transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                {/* Bottom Highlight Indicator */}
                <div className="mt-6 pt-3 border-t border-[#1E3D60]/40 flex items-center text-xs text-slate-400">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#F59E0B] mr-1.5" />
                  <span>Early Pilot Feature</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
