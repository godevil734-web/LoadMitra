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
    <section id="how-it-works" className="py-16 sm:py-24 bg-[#F5F0E6] relative border-b border-[#E2DBD0] scroll-mt-16">
      <div
        ref={sectionRef}
        className={`max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 w-full reveal-on-scroll ${
          isRevealed ? 'is-revealed' : ''
        }`}
      >
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center space-x-2 bg-[#171717] border border-[#2D2D2D] px-3 py-1 rounded text-white mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-[#F28C28]" />
            <span className="text-[10px] font-mono font-bold uppercase tracking-[0.14em] text-[#F5F0E6]">
              OPERATIONAL WORKFLOW
            </span>
          </div>
          <h2 
            className="text-3xl sm:text-4xl font-black text-[#171717] tracking-tight"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            How LoadMitra Works
          </h2>
          <p className="mt-3 text-base text-[#525252]">
            A transparent 4-stage operational sequence from initial load specification to direct terminal delivery.
          </p>
        </div>

        {/* 4-Step Process Grid */}
        <div className="relative">
          {/* Connecting highway corridor dotted line */}
          <div className="hidden lg:block absolute top-1/2 left-8 right-8 -translate-y-8 h-0.5 border-t-2 border-dashed border-[#D4CBBC] -z-0" />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 relative z-10">
            {WORKFLOW_STEPS.map((step, idx) => (
              <div
                key={step.step}
                className="bg-[#FAF7F0] border border-[#D4CBBC] rounded p-5 flex flex-col justify-between hover:border-[#F28C28] transition-colors shadow-xs group"
              >
                <div>
                  {/* Step Header with Monospace Step Badge and Icon */}
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#E2DBD0]">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#171717] bg-[#E8E1D5] border border-[#D4CBBC] px-2.5 py-0.5 rounded">
                      WAYPOINT {step.step}
                    </span>
                    <div className="w-9 h-9 rounded bg-[#171717] border border-[#2D2D2D] text-[#F28C28] flex items-center justify-center transition-colors">
                      {getStepIcon(step.icon)}
                    </div>
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-sm font-bold uppercase tracking-wider text-[#171717] mb-2 group-hover:text-[#DE7919] transition-colors">
                    {step.title}
                  </h3>
                  <p className="text-xs text-[#525252] leading-relaxed">
                    {step.description}
                  </p>
                </div>

                {/* Footer hint */}
                <div className="mt-5 pt-3 border-t border-[#E2DBD0] text-[10px] font-mono text-[#737373] flex items-center justify-between">
                  <span>STAGE {step.step} OF 4</span>
                  {idx < WORKFLOW_STEPS.length - 1 && (
                    <ArrowRight className="w-3.5 h-3.5 text-[#F28C28] lg:hidden" />
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
