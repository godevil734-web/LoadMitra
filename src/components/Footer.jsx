import React from 'react';
import { ArrowUpRight, Truck } from 'lucide-react';
import Logo from './Logo';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const productLinks = [
    { label: 'Find Transport', href: '#search-section' },
    { label: 'Share a Shipment', href: '#pilot-section' },
    { label: 'How It Works', href: '#product-story' },
    { label: 'Sample Listings', href: '#listings-section' },
  ];

  const audienceLinks = [
    { label: 'For Businesses', href: '#for-businesses' },
    { label: 'For Transporters', href: '#for-transporters' },
    { label: 'Early Access Pilot', href: '#pilot-section' },
    { label: 'Admin Operations', href: '/admin' },
  ];

  const handleSmoothScroll = (e, href) => {
    if (href.startsWith('#')) {
      e.preventDefault();
      const el = document.querySelector(href);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <footer className="bg-[#060F1A] border-t border-[#1E3D60]/60 pt-16 pb-8">
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8 pb-12 border-b border-[#1E3D60]/40">
          {/* Brand Column */}
          <div className="lg:col-span-4 space-y-4">
            <Logo showTagline={true} />
            <p className="text-sm text-slate-400 leading-relaxed max-w-sm">
              RouteWise is a logistics marketplace connecting businesses that need to ship goods with transporters who have available vehicle capacity. We aim to reduce freight costs through shared loads and help eliminate empty return trips.
            </p>
            <div className="flex items-center space-x-2 pt-1">
              <span className="inline-flex items-center text-xs font-bold text-[#F59E0B] bg-[#F59E0B]/10 border border-[#F59E0B]/30 px-2.5 py-1 rounded-md">
                <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B] mr-1.5 animate-pulse"></span>
                Early Pilot Phase
              </span>
            </div>
          </div>

          {/* Product Links */}
          <div className="lg:col-span-3">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
              Product
            </h4>
            <ul className="space-y-2.5">
              {productLinks.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    onClick={(e) => handleSmoothScroll(e, link.href)}
                    className="text-sm text-slate-400 hover:text-white transition-colors duration-200 flex items-center group"
                  >
                    <span>{link.label}</span>
                    <ArrowUpRight className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Audience Links */}
          <div className="lg:col-span-2">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
              Audience
            </h4>
            <ul className="space-y-2.5">
              {audienceLinks.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    onClick={(e) => handleSmoothScroll(e, link.href)}
                    className="text-sm text-slate-400 hover:text-white transition-colors duration-200 flex items-center group"
                  >
                    <span>{link.label}</span>
                    <ArrowUpRight className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Column */}
          <div className="lg:col-span-3">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
              Contact
            </h4>
            <div className="space-y-3 text-sm text-slate-400">
              <p className="leading-relaxed">
                For pilot programme queries, partnership opportunities, or investor conversations, please use the early access form above.
              </p>
              <div className="pt-2 text-xs text-slate-500 space-y-1.5">
                <p className="flex items-center space-x-1.5">
                  <span className="font-semibold text-slate-400">Privacy Policy</span>
                  <span className="text-[10px] bg-[#152E4A] px-1.5 py-0.5 rounded border border-[#1E3D60]">Forthcoming</span>
                </p>
                <p className="flex items-center space-x-1.5">
                  <span className="font-semibold text-slate-400">Terms of Service</span>
                  <span className="text-[10px] bg-[#152E4A] px-1.5 py-0.5 rounded border border-[#1E3D60]">Forthcoming</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>
            &copy; {currentYear} RouteWise. All rights reserved. Regional Freight Optimization Platform.
          </p>
          <p className="flex items-center space-x-1.5">
            <Truck className="w-3.5 h-3.5 text-slate-600" />
            <span>Smart Logistics. Better Journeys.</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
