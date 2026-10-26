import React from 'react';
import { X, Lock, ArrowRight, ShieldCheck, Truck, Package } from 'lucide-react';

export default function SignInModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Sign In to LoadMitra Portals"
    >
      <div
        className="bg-[#171717] border border-[#2D2D2D] rounded-lg max-w-md w-full p-6 sm:p-8 shadow-2xl relative text-[#F5F0E6]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-[#A3A3A3] hover:text-white hover:bg-[#262626] rounded transition-colors focus:outline-none focus:ring-2 focus:ring-[#F28C28]"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Content */}
        <div className="space-y-6">
          <div className="flex items-center space-x-3 pb-4 border-b border-[#2D2D2D]">
            <div className="w-10 h-10 rounded bg-[#262626] border border-[#3D3D3D] flex items-center justify-center text-[#F28C28]">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#F28C28] font-bold block">
                OPERATIONAL ACCESS
              </span>
              <h2 className="text-lg font-extrabold text-white tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                Select Network Portal
              </h2>
            </div>
          </div>

          <p className="text-xs text-[#A3A3A3] leading-relaxed">
            Choose your designated role to enter the LoadMitra operational freight network:
          </p>

          {/* Portal Choices */}
          <div className="space-y-2.5">
            <a
              href="/listings"
              className="w-full flex items-center justify-between p-3.5 bg-[#1F1F1F] hover:bg-[#262626] border border-[#2D2D2D] hover:border-[#F28C28] rounded transition-all group"
            >
              <div className="flex items-start space-x-3 text-left">
                <div className="p-2 rounded bg-[#171717] text-[#F28C28] border border-[#333333] shrink-0 mt-0.5">
                  <Package className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-white text-xs uppercase tracking-wider block group-hover:text-[#F28C28]">
                    Goods Owner Portal
                  </span>
                  <span className="text-[11px] text-[#A3A3A3] block mt-0.5">
                    Post loads, manage shipments, review transporter bids
                  </span>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-[#F28C28] shrink-0 transition-transform group-hover:translate-x-1 ml-2" />
            </a>

            <a
              href="/transporter"
              className="w-full flex items-center justify-between p-3.5 bg-[#1F1F1F] hover:bg-[#262626] border border-[#2D2D2D] hover:border-emerald-500 rounded transition-all group"
            >
              <div className="flex items-start space-x-3 text-left">
                <div className="p-2 rounded bg-[#171717] text-emerald-400 border border-[#333333] shrink-0 mt-0.5">
                  <Truck className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-white text-xs uppercase tracking-wider block group-hover:text-emerald-400">
                    Transporter Workspace
                  </span>
                  <span className="text-[11px] text-[#A3A3A3] block mt-0.5">
                    Find corridor loads, offer pricing, manage fleet
                  </span>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-emerald-400 shrink-0 transition-transform group-hover:translate-x-1 ml-2" />
            </a>

            <a
              href="/admin"
              className="w-full flex items-center justify-between p-3.5 bg-[#1F1F1F] hover:bg-[#262626] border border-[#2D2D2D] hover:border-amber-400 rounded transition-all group"
            >
              <div className="flex items-start space-x-3 text-left">
                <div className="p-2 rounded bg-[#171717] text-amber-400 border border-[#333333] shrink-0 mt-0.5">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-white text-xs uppercase tracking-wider block group-hover:text-amber-400">
                    Admin & Operations Console
                  </span>
                  <span className="text-[11px] text-[#A3A3A3] block mt-0.5">
                    Review registrations, approve verifications, monitor network
                  </span>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-amber-400 shrink-0 transition-transform group-hover:translate-x-1 ml-2" />
            </a>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-full py-2 text-xs font-semibold uppercase tracking-wider text-[#A3A3A3] hover:text-white hover:bg-[#262626] border border-[#2D2D2D] rounded transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
