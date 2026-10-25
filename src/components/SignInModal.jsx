import React from 'react';
import { X, Lock, Info, ArrowRight } from 'lucide-react';

export default function SignInModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Sign In — Coming Soon"
    >
      <div
        className="bg-[#0F2A44] border border-[#1E3D60] rounded-2xl max-w-md w-full p-8 shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white hover:bg-[#152E4A] rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-[#F59E0B]"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Content */}
        <div className="text-center space-y-5">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-[#152E4A] border border-[#1E3D60] flex items-center justify-center text-[#F59E0B]">
            <Lock className="w-7 h-7" />
          </div>

          <div>
            <h2 className="text-xl font-extrabold text-white tracking-tight">
              RouteWise Portal Sign In
            </h2>
            <p className="mt-2 text-sm text-slate-300 leading-relaxed">
              Choose your role to access RouteWise freight operations, post loads, or manage platform registrations.
            </p>
          </div>

          {/* Portal Choices */}
          <div className="pt-2 space-y-3">
            <a
              href="/listings"
              className="w-full inline-flex items-center justify-between p-3.5 bg-[#091827] hover:bg-[#152E4A] border border-[#1E3D60] hover:border-[#F59E0B] rounded-xl transition-all group"
            >
              <div className="text-left">
                <span className="font-bold text-white text-sm block group-hover:text-[#F59E0B]">
                  Shipper & Freight Marketplace Portal
                </span>
                <span className="text-xs text-slate-400">
                  Post freight demands, manage shipments & review incoming bids
                </span>
              </div>
              <ArrowRight className="w-5 h-5 text-[#F59E0B] transition-transform group-hover:translate-x-1" />
            </a>

            <a
              href="/transporter"
              className="w-full inline-flex items-center justify-between p-3.5 bg-[#091827] hover:bg-[#152E4A] border border-[#1E3D60] hover:border-emerald-400 rounded-xl transition-all group"
            >
              <div className="text-left">
                <span className="font-bold text-white text-sm block group-hover:text-emerald-300">
                  Transporter Control Center & Fleet Portal
                </span>
                <span className="text-xs text-slate-400">
                  Browse loads, quote rates & post return vehicle availability
                </span>
              </div>
              <ArrowRight className="w-5 h-5 text-emerald-400 transition-transform group-hover:translate-x-1" />
            </a>

            <a
              href="/admin"
              className="w-full inline-flex items-center justify-between p-3.5 bg-[#091827] hover:bg-[#152E4A] border border-[#1E3D60] hover:border-amber-400 rounded-xl transition-all group"
            >
              <div className="text-left">
                <span className="font-bold text-white text-sm block group-hover:text-amber-300">
                  RouteWise Operations & Admin Portal
                </span>
                <span className="text-xs text-slate-400">
                  Manage pilot registrations, metrics & administrator team
                </span>
              </div>
              <ArrowRight className="w-5 h-5 text-amber-400 transition-transform group-hover:translate-x-1" />
            </a>

            <button
              type="button"
              onClick={onClose}
              className="w-full px-5 py-2.5 text-xs font-semibold text-slate-300 hover:text-white hover:bg-[#152E4A] border border-[#1E3D60] rounded-xl transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
