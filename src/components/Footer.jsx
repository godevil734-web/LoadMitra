import React from 'react';
import { ArrowUpRight, Truck } from 'lucide-react';
import Logo from './Logo';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const productLinks = [
    { label: 'Find Transport', href: '#search-section' },
    { label: 'Post a Load', href: '#pilot-section' },
    { label: 'How It Works', href: '#product-story' },
    { label: 'Available Loads', href: '#listings-section' },
  ];

  const audienceLinks = [
    { label: 'For Goods Owners', href: '#for-businesses' },
    { label: 'For Transport Partners', href: '#for-transporters' },
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
    <footer className="bg-[#171717] border-t border-[#2D2D2D] pt-14 pb-8 text-[#F5F0E6]">
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-8 pb-10 border-b border-[#2D2D2D]">
          {/* Brand Column */}
          <div className="lg:col-span-4 space-y-3.5">
            <Logo theme="dark" showTagline={true} />
            <p className="text-xs text-[#A3A3A3] leading-relaxed max-w-sm">
              LoadMitra matches cargo consignments with verified transport carriers who have available deck capacity. Reducing empty return miles and lowering freight expenses across national transit corridors.
            </p>
            <div className="flex items-center space-x-2 pt-1">
              <span className="inline-flex items-center text-[10px] font-mono font-bold uppercase tracking-wider text-[#F28C28] bg-[#F28C28]/10 border border-[#F28C28]/30 px-2.5 py-0.5 rounded">
                <span className="w-1.5 h-1.5 rounded-full bg-[#F28C28] mr-1.5 animate-pulse"></span>
                ACTIVE CORRIDORS • UP &amp; INTERCITY
              </span>
            </div>
          </div>

          {/* Product Links */}
          <div className="lg:col-span-3">
            <h4 className="text-[11px] font-mono font-bold text-white uppercase tracking-wider mb-3">
              NETWORK PRODUCT
            </h4>
            <ul className="space-y-2">
              {productLinks.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    onClick={(e) => handleSmoothScroll(e, link.href)}
                    className="text-xs text-[#A3A3A3] hover:text-[#F28C28] transition-colors flex items-center group"
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
            <h4 className="text-[11px] font-mono font-bold text-white uppercase tracking-wider mb-3">
              OPERATIONAL ROLES
            </h4>
            <ul className="space-y-2">
              {audienceLinks.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    onClick={(e) => handleSmoothScroll(e, link.href)}
                    className="text-xs text-[#A3A3A3] hover:text-[#F28C28] transition-colors flex items-center group"
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
            <h4 className="text-[11px] font-mono font-bold text-white uppercase tracking-wider mb-3">
              COORDINATION
            </h4>
            <div className="space-y-2.5 text-xs text-[#A3A3A3]">
              <p className="leading-relaxed">
                For corridor routing inquiries, enterprise fleet integration, or operational partnerships, submit an inquiry above.
              </p>
              <div className="pt-2 text-[10px] font-mono text-[#737373] space-y-1">
                <p className="flex items-center space-x-1.5">
                  <span className="font-semibold text-[#A3A3A3]">SECURITY ARCHITECTURE</span>
                  <span className="bg-[#262626] px-1.5 py-0.2 rounded border border-[#3D3D3D]">VERIFIED</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#737373] font-mono">
          <p>
            &copy; {currentYear} LoadMitra. Intercity Freight &amp; Corridor Coordination Platform.
          </p>
          <p className="flex items-center space-x-1.5 text-[#A3A3A3]">
            <Truck className="w-3.5 h-3.5 text-[#F28C28]" />
            <span>Har Load Ka Sahi Saathi.</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
