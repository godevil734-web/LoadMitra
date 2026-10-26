import React, { useState, useEffect } from 'react';
import { Menu, X, ArrowRight, Truck } from 'lucide-react';
import { Link } from 'react-router-dom';
import Logo from './Logo';

export default function Navbar({ onOpenSignIn, onNavigateToSection }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'Available Loads', href: '/listings', isLiveBadge: true },
    { label: 'Transport Partners', href: '/transporter' },
    { label: 'Find Vehicles', targetId: 'search-section' },
    { label: 'Post a Load', targetId: 'pilot-section', role: 'shipper' },
    { label: 'How It Works', targetId: 'product-story' },
    { label: 'For Goods Owners', targetId: 'for-businesses' },
    { label: 'For Transport Partners', targetId: 'for-transporters' },
  ];

  const handleLinkClick = (e, targetId, role) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    if (onNavigateToSection) {
      onNavigateToSection(targetId, role);
    } else {
      const el = document.getElementById(targetId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-[#171717]/95 backdrop-blur-md border-b border-[#2D2D2D] shadow-lg shadow-black/40 py-2.5'
          : 'bg-[#171717] border-b border-[#2D2D2D] py-3.5'
      }`}
    >
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 w-full">
        <div className="flex items-center justify-between">
          {/* Logo & Tagline */}
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="flex items-center group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F28C28] rounded-md p-1"
            aria-label="LoadMitra Home"
          >
            <Logo theme="dark" />
          </a>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center space-x-1" aria-label="Main Navigation">
            {navLinks.map((link) =>
              link.href ? (
                <Link
                  key={link.label}
                  to={link.href}
                  className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-[#A3A3A3] hover:text-[#F5F0E6] hover:bg-[#262626] rounded transition-colors duration-150 flex items-center space-x-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F28C28]"
                >
                  <span>{link.label}</span>
                  {link.isLiveBadge && (
                    <span className="text-[9px] font-mono font-bold tracking-wider bg-[#16A34A]/20 text-emerald-400 border border-[#16A34A]/30 px-1 py-0.2 rounded">
                      LIVE
                    </span>
                  )}
                </Link>
              ) : (
                <a
                  key={link.label}
                  href={`#${link.targetId}`}
                  onClick={(e) => handleLinkClick(e, link.targetId, link.role)}
                  className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-[#A3A3A3] hover:text-[#F5F0E6] hover:bg-[#262626] rounded transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F28C28]"
                >
                  {link.label}
                </a>
              )
            )}
          </nav>

          {/* Desktop Action Buttons */}
          <div className="hidden lg:flex items-center space-x-2.5">
            <button
              type="button"
              onClick={onOpenSignIn}
              className="px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-[#D4CBBC] hover:text-white hover:bg-[#262626] border border-[#3D3D3D] rounded transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F28C28]"
            >
              Sign In
            </button>
            <a
              href="#pilot-section"
              onClick={(e) => handleLinkClick(e, 'pilot-section')}
              className="inline-flex items-center justify-center px-4 py-1.5 text-xs font-extrabold uppercase tracking-wider text-[#171717] bg-[#F28C28] hover:bg-[#DE7919] rounded transition-all duration-150 group focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <span>Get Started</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1.5 transition-transform duration-150 group-hover:translate-x-0.5" />
            </a>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex lg:hidden items-center space-x-2">
            <button
              type="button"
              onClick={onOpenSignIn}
              className="px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-[#D4CBBC] border border-[#3D3D3D] rounded hover:bg-[#262626]"
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 text-[#A3A3A3] hover:text-white hover:bg-[#262626] rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F28C28]"
              aria-expanded={mobileMenuOpen}
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#171717] border-b border-[#2D2D2D] px-4 pt-3 pb-6 space-y-3">
          <div className="flex flex-col space-y-1">
            {navLinks.map((link) =>
              link.href ? (
                <Link
                  key={link.label}
                  to={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 text-sm font-semibold uppercase tracking-wider text-[#A3A3A3] hover:text-white hover:bg-[#262626] rounded transition-colors flex items-center justify-between"
                >
                  <span>{link.label}</span>
                  {link.isLiveBadge && (
                    <span className="text-[9px] font-mono font-bold tracking-wider bg-[#16A34A]/20 text-emerald-400 border border-[#16A34A]/30 px-1.5 py-0.5 rounded">
                      LIVE
                    </span>
                  )}
                </Link>
              ) : (
                <a
                  key={link.label}
                  href={`#${link.targetId}`}
                  onClick={(e) => handleLinkClick(e, link.targetId, link.role)}
                  className="px-3 py-2 text-sm font-semibold uppercase tracking-wider text-[#A3A3A3] hover:text-white hover:bg-[#262626] rounded transition-colors"
                >
                  {link.label}
                </a>
              )
            )}
          </div>

          <div className="pt-3 border-t border-[#2D2D2D] space-y-2">
            <a
              href="#pilot-section"
              onClick={(e) => handleLinkClick(e, 'pilot-section')}
              className="w-full flex items-center justify-center px-4 py-2.5 text-xs font-extrabold uppercase tracking-wider text-[#171717] bg-[#F28C28] hover:bg-[#DE7919] rounded transition-colors"
            >
              <span>Join Early Pilot / Get Started</span>
              <ArrowRight className="w-4 h-4 ml-2" />
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
