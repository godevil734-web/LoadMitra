import React, { useState, useCallback } from 'react';
import Navbar from './Navbar';
import HeroSection from './HeroSection';
import TransportSearch from './TransportSearch';
import ProductStorytelling from './ProductStorytelling';
import BenefitsSection from './BenefitsSection';
import HowItWorks from './HowItWorks';
import BusinessSection from './BusinessSection';
import TransporterSection from './TransporterSection';
import SampleListings from './SampleListings';
import PilotRegistration from './PilotRegistration';
import Footer from './Footer';
import SignInModal from './SignInModal';

export default function LandingPage() {
  const [signInOpen, setSignInOpen] = useState(false);
  const [pilotTab, setPilotTab] = useState('shipper');
  const [pilotPrefillRoute, setPilotPrefillRoute] = useState('');

  // Smooth scroll helper
  const scrollTo = useCallback((id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Navbar section navigation handler
  const handleNavigateToSection = useCallback((targetId, role) => {
    if (role === 'shipper') {
      setPilotTab('shipper');
    } else if (role === 'transporter') {
      setPilotTab('transporter');
    }
    scrollTo(targetId);
  }, [scrollTo]);

  // Hero CTA: Find Transport → scrolls to search panel
  const handleFindTransport = useCallback(() => {
    scrollTo('search-section');
  }, [scrollTo]);

  // Hero CTA: Share a Shipment → scrolls to pilot form (shipper tab)
  const handleShareShipment = useCallback(() => {
    setPilotTab('shipper');
    scrollTo('pilot-section');
  }, [scrollTo]);

  // TransportSearch → after demo search, guide to pilot
  const handleSearchResults = useCallback((_searchData) => {
    // Search demo feedback is handled inside TransportSearch component
  }, []);

  // TransportSearch → navigate to pilot section
  const handleNavigateToPilot = useCallback((role) => {
    setPilotTab(role || 'shipper');
    scrollTo('pilot-section');
  }, [scrollTo]);

  // BusinessSection CTA → Find Transport
  const handleBusinessFindTransport = useCallback(() => {
    scrollTo('search-section');
  }, [scrollTo]);

  // TransporterSection CTA → Join as Transporter
  const handleJoinTransporter = useCallback(() => {
    setPilotTab('transporter');
    scrollTo('pilot-section');
  }, [scrollTo]);

  // SampleListings → Express Interest → go to pilot
  const handleExpressInterest = useCallback((listing) => {
    setPilotTab('shipper');
    setPilotPrefillRoute(`${listing.origin} → ${listing.destination}`);
    scrollTo('pilot-section');
  }, [scrollTo]);

  return (
    <div className="min-h-[100dvh] bg-[#091827] text-[#FAFAF7] flex flex-col w-full overflow-x-hidden">
      {/* Sticky Navigation */}
      <Navbar
        onOpenSignIn={() => setSignInOpen(true)}
        onNavigateToSection={handleNavigateToSection}
      />

      {/* Main Content Flow */}
      <main className="flex-1 w-full">
        {/* A. Hero Section */}
        <HeroSection
          onFindTransport={handleFindTransport}
          onShareShipment={handleShareShipment}
        />

        {/* C. Transport Search Panel */}
        <section className="py-6 sm:py-8">
          <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 w-full">
            <TransportSearch
              onSearchResults={handleSearchResults}
              onNavigateToPilot={handleNavigateToPilot}
            />
          </div>
        </section>

        {/* D. Core Product Storytelling (Shipper Match Flow & Transporter Return-Load Discovery) */}
        <ProductStorytelling />

        {/* E. Core Benefits */}
        <BenefitsSection />

        {/* E. How LoadMitra Works */}
        <HowItWorks />

        {/* F. Business-focused Section */}
        <BusinessSection onFindTransport={handleBusinessFindTransport} />

        {/* G. Transporter-focused Section */}
        <TransporterSection onJoinTransporter={handleJoinTransporter} />

        {/* H. Illustrative Transport Listings */}
        <SampleListings onExpressInterest={handleExpressInterest} />

        {/* I. Pilot Registration Forms */}
        <PilotRegistration
          activeTab={pilotTab}
          onTabChange={setPilotTab}
          prefillRoute={pilotPrefillRoute}
        />
      </main>

      {/* J. Footer */}
      <Footer />

      {/* Sign In Placeholder Modal */}
      <SignInModal
        isOpen={signInOpen}
        onClose={() => setSignInOpen(false)}
      />
    </div>
  );
}
