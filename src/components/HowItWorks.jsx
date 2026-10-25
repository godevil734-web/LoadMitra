import React from 'react';
import { FileText, Search, CheckCircle2, Truck, ArrowRight } from 'lucide-react';
import { WORKFLOW_STEPS } from '../data/sampleData';
import { useScrollReveal } from '../hooks/useScrollReveal';

export default function HowItWorks() {
  const [sectionRef, isRevealed] = useScrollReveal();

  const getStepIcon = (iconName) => {
    switch (iconName) {
      case 'FileText':
        return <FileText className="w-6 h-6" />;
      case 'Search':
        return <Search className="w-6 h-6" />;
      case 'CheckCircle2':
        return <CheckCircle2 className="w-6 h-6" />;
      case 'Truck':
        return <Truck className="w-6 h-6" />;
      default:
        return <Truck className="w-6 h-6" />;
    }
  };

  return (
    <section id="how-it-works" className="py-16 sm:py-24 bg-[#0F2A44]/40 relative border-t border-[#1E3D60]/50 scroll-mt-16">
      <div
        ref={sectionRef}
        className={`max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 w-full reveal-on-scroll ${
          isRevealed ? 'is-revealed' : ''
        }`}
      >
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center space-x-2 bg-[#0F2A44] border border-[#1E3D60] px-3.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider text-[#F59E0B] mb-3">
            <span>Simple Process</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            How LoadMitra Works
          </h2>
          <p className="mt-3 text-base sm:text-lg text-slate-300">
            Four simple steps to send goods or book transport.
          </p>
        </div>

        {/* 4-Step Process Grid */}
        <div className="relative">
          {/* Subtle Desktop Connecting Dotted Line */}
          <div className="hidden lg:block absolute top-1/2 left-8 right-8 -translate-y-8 h-0.5 border-t-2 border-dashed border-[#1E3D60] -z-0" />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative z-10">
            {WORKFLOW_STEPS.map((step, idx) => (
              <div
                key={step.step}
                className="bg-[#091827] border border-[#1E3D60] rounded-2xl p-6 flex flex-col justify-between hover:border-[#F59E0B]/50 transition-all duration-300 shadow-xl group hover:-translate-y-1"
              >
                <div>
                  {/* Step Header with Badge and Icon */}
                  <div className="flex items-center justify-between mb-5">
                    <span className="text-xs font-extrabold tracking-wider text-[#F59E0B] bg-[#F59E0B]/10 border border-[#F59E0B]/30 px-3 py-1 rounded-lg font-mono">
                      STEP {step.step}
                    </span>
                    <div className="w-11 h-11 rounded-xl bg-[#11253B] group-hover:bg-[#152E4A] text-[#38BDF8] group-hover:text-white flex items-center justify-center border border-[#1E3D60] transition-colors">
                      {getStepIcon(step.icon)}
                    </div>
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-lg font-bold text-white mb-2 tracking-tight group-hover:text-[#F59E0B] transition-colors">
                    {step.title}
                  </h3>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    {step.description}
                  </p>
                </div>

                {/* Footer hint */}
                <div className="mt-6 pt-3 border-t border-[#1E3D60]/50 text-xs text-slate-400 flex items-center justify-between">
                  <span>Clear &amp; Direct</span>
                  {idx < WORKFLOW_STEPS.length - 1 && (
                    <ArrowRight className="w-3.5 h-3.5 text-slate-500 lg:hidden" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
