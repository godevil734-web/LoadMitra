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
          ? 'bg-[#091827]/95 backdrop-blur-md border-b border-[#1E3D60]/80 shadow-lg shadow-black/30 py-3'
          : 'bg-[#091827]/80 backdrop-blur-sm border-b border-[#1E3D60]/40 py-4.5'
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
            className="flex items-center group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F59E0B] rounded-lg p-1"
            aria-label="LoadMitra Home"
          >
            <Logo />
          </a>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center space-x-1 xl:space-x-2" aria-label="Main Navigation">
            {navLinks.map((link) =>
              link.href ? (
                <Link
                  key={link.label}
                  to={link.href}
                  className="px-3 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-[#11253B] rounded-md transition-colors duration-200 flex items-center space-x-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F59E0B]"
                >
                  <span>{link.label}</span>
                  {link.isLiveBadge && (
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.2 rounded">
                      LIVE
                    </span>
                  )}
                </Link>
              ) : (
                <a
                  key={link.label}
                  href={`#${link.targetId}`}
                  onClick={(e) => handleLinkClick(e, link.targetId, link.role)}
                  className="px-3 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-[#11253B] rounded-md transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F59E0B]"
                >
                  {link.label}
                </a>
              )
            )}
          </nav>

          {/* Desktop Action Buttons */}
          <div className="hidden lg:flex items-center space-x-3">
            <button
              type="button"
              onClick={onOpenSignIn}
              className="px-4 py-2 text-sm font-semibold text-slate-200 hover:text-white hover:bg-[#152E4A] border border-[#1E3D60] rounded-lg transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F59E0B]"
            >
              Sign In
            </button>
            <a
              href="#pilot-section"
              onClick={(e) => handleLinkClick(e, 'pilot-section')}
              className="inline-flex items-center justify-center px-4.5 py-2 text-sm font-bold text-[#091827] bg-[#F59E0B] hover:bg-[#D97706] rounded-lg shadow-sm hover:shadow-md transition-all duration-200 group focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4 ml-1.5 transition-transform duration-200 group-hover:translate-x-0.5" />
            </a>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex lg:hidden items-center space-x-2">
            <button
              type="button"
              onClick={onOpenSignIn}
              className="px-3 py-1.5 text-xs font-semibold text-slate-200 border border-[#1E3D60] rounded-md hover:bg-[#152E4A]"
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-300 hover:text-white hover:bg-[#11253B] rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F59E0B]"
              aria-expanded={mobileMenuOpen}
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#091827]/98 border-b border-[#1E3D60] px-4 pt-3 pb-6 space-y-3 backdrop-blur-xl animate-fadeIn">
          <div className="flex flex-col space-y-1">
            {navLinks.map((link) =>
              link.href ? (
                <Link
                  key={link.label}
                  to={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2.5 text-base font-medium text-slate-200 hover:text-white hover:bg-[#11253B] rounded-lg transition-colors flex items-center justify-between"
                >
                  <span>{link.label}</span>
                  {link.isLiveBadge && (
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded">
                      LIVE
                    </span>
                  )}
                </Link>
              ) : (
                <a
                  key={link.label}
                  href={`#${link.targetId}`}
                  onClick={(e) => handleLinkClick(e, link.targetId, link.role)}
                  className="px-3 py-2.5 text-base font-medium text-slate-200 hover:text-white hover:bg-[#11253B] rounded-lg transition-colors"
                >
                  {link.label}
                </a>
              )
            )}
          </div>

          <div className="pt-3 border-t border-[#1E3D60] space-y-2">
            <a
              href="#pilot-section"
              onClick={(e) => handleLinkClick(e, 'pilot-section')}
              className="w-full flex items-center justify-center px-4 py-2.5 text-sm font-bold text-[#091827] bg-[#F59E0B] hover:bg-[#D97706] rounded-lg transition-colors shadow-sm"
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
