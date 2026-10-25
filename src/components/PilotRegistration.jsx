import React, { useState, useEffect } from 'react';
import { UserCheck, Truck, CheckCircle2, AlertCircle, Send, RotateCcw, Info, Clock, Hash, MapPin } from 'lucide-react';
import { CARGO_TYPES, SHIPMENT_FREQUENCIES } from '../data/sampleData';
import { useScrollReveal } from '../hooks/useScrollReveal';
import VehicleVisualSelector from './VehicleVisualSelector';

export default function PilotRegistration({ activeTab = 'shipper', onTabChange, prefillRoute = '' }) {
  const [sectionRef, isRevealed] = useScrollReveal();
  const [currentTab, setCurrentTab] = useState(activeTab);
  const [vehicleMetadata, setVehicleMetadata] = useState(null);

  // Shipper Form State
  const [shipperForm, setShipperForm] = useState({
    name: '',
    businessName: '',
    phone: '',
    email: '',
    primaryRoute: prefillRoute || '',
    cargoCategory: '',
    shipmentFrequency: '',
    consent: false,
  });
  const [shipperErrors, setShipperErrors] = useState({});

  // Transporter Form State
  const [transporterForm, setTransporterForm] = useState({
    name: '',
    fleetName: '',
    phone: '',
    email: '',
    vehicleType: '',
    operatingRoutes: prefillRoute || '',
    availableCapacity: '',
    consent: false,
  });
  const [transporterErrors, setTransporterErrors] = useState({});

  // Live Submission States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState(null);
  const [submittedRegistration, setSubmittedRegistration] = useState(null);

  // Sync prop changes
  useEffect(() => {
    if (activeTab) setCurrentTab(activeTab);
  }, [activeTab]);

  useEffect(() => {
    if (prefillRoute) {
      setShipperForm((prev) => ({ ...prev, primaryRoute: prefillRoute }));
      setTransporterForm((prev) => ({ ...prev, operatingRoutes: prefillRoute }));
    }
  }, [prefillRoute]);

  // Validation functions
  const validateEmail = (email) => {
    if (!email) return true; // Optional
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const validatePhone = (phone) => {
    // 10 digits Indian phone check
    const digitsOnly = phone.replace(/\D/g, '');
    return digitsOnly.length >= 10 && digitsOnly.length <= 11;
  };

  const handleShipperSubmit = async (e) => {
    e.preventDefault();
    const errors = {};

    if (!shipperForm.name.trim()) errors.name = 'Contact name is required';
    if (!shipperForm.businessName.trim()) errors.businessName = 'Business or trading name is required';
    if (!shipperForm.phone.trim()) {
      errors.phone = 'Phone number is required for pilot coordination';
    } else if (!validatePhone(shipperForm.phone)) {
      errors.phone = 'Please enter a valid 10-digit mobile number';
    }
    if (shipperForm.email.trim() && !validateEmail(shipperForm.email)) {
      errors.email = 'Please provide a valid email address';
    }
    if (!shipperForm.primaryRoute.trim()) errors.primaryRoute = 'Primary shipping corridor is required';
    if (!shipperForm.cargoCategory) errors.cargoCategory = 'Please select a cargo category';
    if (!shipperForm.shipmentFrequency) errors.shipmentFrequency = 'Please select your shipment frequency';
    if (!shipperForm.consent) errors.consent = 'Consent is required to participate in the pilot';

    if (Object.keys(errors).length > 0) {
      setShipperErrors(errors);
      return;
    }

    setShipperErrors({});
    setIsSubmitting(true);
    setSubmissionError(null);

    try {
      const response = await fetch('/api/pilot/shipper-registration', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          role: 'SHIPPER',
          contactName: shipperForm.name.trim(),
          businessName: shipperForm.businessName.trim(),
          phone: shipperForm.phone.trim(),
          email: shipperForm.email.trim() || undefined,
          primaryRoute: shipperForm.primaryRoute.trim(),
          cargoCategory: shipperForm.cargoCategory,
          shipmentFrequency: shipperForm.shipmentFrequency,
          consentGranted: shipperForm.consent,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to submit registration. Please try again.');
      }

      setSubmittedRegistration(data.data);
      setShipperForm({
        name: '',
        businessName: '',
        phone: '',
        email: '',
        primaryRoute: '',
        cargoCategory: '',
        shipmentFrequency: '',
        consent: false,
      });
    } catch (err) {
      console.error('Shipper registration submission error:', err);
      setSubmissionError(err.message || 'Unable to connect to server. Please ensure the backend is running.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTransporterSubmit = async (e) => {
    e.preventDefault();
    const errors = {};

    if (!transporterForm.name.trim()) errors.name = 'Contact name is required';
    if (!transporterForm.phone.trim()) {
      errors.phone = 'Phone number is required for trip coordination';
    } else if (!validatePhone(transporterForm.phone)) {
      errors.phone = 'Please enter a valid 10-digit mobile number';
    }
    if (transporterForm.email.trim() && !validateEmail(transporterForm.email)) {
      errors.email = 'Please provide a valid email address';
    }
    if (!transporterForm.vehicleType) errors.vehicleType = 'Please select primary vehicle type';
    if (!transporterForm.operatingRoutes.trim()) errors.operatingRoutes = 'Operating routes or regular corridors are required';
    if (!transporterForm.consent) errors.consent = 'Consent is required to participate in the pilot';

    if (Object.keys(errors).length > 0) {
      setTransporterErrors(errors);
      return;
    }

    setTransporterErrors({});
    setIsSubmitting(true);
    setSubmissionError(null);

    try {
      const response = await fetch('/api/pilot/transporter-registration', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          role: 'TRANSPORTER',
          contactName: transporterForm.name.trim(),
          fleetName: transporterForm.fleetName.trim() || undefined,
          phone: transporterForm.phone.trim(),
          email: transporterForm.email.trim() || undefined,
          vehicleType: transporterForm.vehicleType,
          operatingRoutes: transporterForm.operatingRoutes.trim(),
          availableCapacity: transporterForm.availableCapacity.trim() || undefined,
          actualCapacity: vehicleMetadata?.actualCapacity,
          capacityUnit: vehicleMetadata?.capacityUnit || 'Tons',
          vehicleCategories: vehicleMetadata?.vehicleCategories || [transporterForm.vehicleType],
          multiVehicleFleet: vehicleMetadata?.multiVehicleFleet || [],
          consentGranted: transporterForm.consent,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to submit registration. Please try again.');
      }

      setSubmittedRegistration(data.data);
      setTransporterForm({
        name: '',
        fleetName: '',
        phone: '',
        email: '',
        vehicleType: '',
        operatingRoutes: '',
        availableCapacity: '',
        consent: false,
      });
    } catch (err) {
      console.error('Transporter registration submission error:', err);
      setSubmissionError(err.message || 'Unable to connect to server. Please ensure the backend is running.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetAll = () => {
    setSubmittedRegistration(null);
    setSubmissionError(null);
  };

  return (
    <section id="pilot-section" className="py-16 sm:py-24 bg-[#0F2A44]/30 relative border-t border-[#1E3D60]/50 scroll-mt-16">
      <div
        ref={sectionRef}
        className={`max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 w-full reveal-on-scroll ${
          isRevealed ? 'is-revealed' : ''
        }`}
      >
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-8">
          <div className="inline-flex items-center space-x-2 bg-[#0F2A44] border border-[#1E3D60] px-3.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider text-[#F59E0B] mb-3">
            <span>Incubation Pilot Access</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Join the RouteWise Early Access Pilot
          </h2>
          <p className="mt-3 text-sm sm:text-base text-slate-300">
            Be part of our initial trial corridors between major commercial hubs. Share your freight parameters or vehicle availability.
          </p>
        </div>

        {/* Transparency & Data Usage Explanation Box */}
        <div className="mb-8 bg-[#11253B] border border-amber-500/40 rounded-xl p-5 space-y-3">
          <div className="flex items-start space-x-3">
            <Info className="w-5 h-5 text-[#F59E0B] shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm text-slate-300 leading-relaxed space-y-2">
              <p>
                <strong className="text-amber-300 uppercase tracking-wide font-bold mr-1">
                  Active Pilot Intake:
                </strong>
                Submit your freight parameters or vehicle capacity below. Your registration will be recorded securely in our pilot database and reviewed by our logistics dispatch coordinators.
              </p>
              <div className="pt-2 border-t border-[#1E3D60] grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300">
                <div className="flex items-center space-x-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]" />
                  <span><strong>What we request:</strong> Name, contact phone, corridor &amp; cargo/vehicle type.</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span><strong>How it is used:</strong> Exclusively for pilot scheduling and capacity matching.</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Form Container */}
        <div className="bg-[#0F2A44] border border-[#1E3D60] rounded-2xl shadow-2xl overflow-hidden">
          {/* Tab Selection */}
          <div className="grid grid-cols-2 border-b border-[#1E3D60]">
            <button
              type="button"
              onClick={() => {
                setCurrentTab('shipper');
                setSubmissionError(null);
                if (onTabChange) onTabChange('shipper');
              }}
              className={`py-4 px-4 text-center font-bold text-sm sm:text-base flex items-center justify-center space-x-2 transition-colors ${
                currentTab === 'shipper'
                  ? 'bg-[#152E4A] text-[#F59E0B] border-b-2 border-[#F59E0B]'
                  : 'text-slate-400 hover:text-white hover:bg-[#11253B]'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              <span>I am a Shipper</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setCurrentTab('transporter');
                setSubmissionError(null);
                if (onTabChange) onTabChange('transporter');
              }}
              className={`py-4 px-4 text-center font-bold text-sm sm:text-base flex items-center justify-center space-x-2 transition-colors ${
                currentTab === 'transporter'
                  ? 'bg-[#152E4A] text-[#F59E0B] border-b-2 border-[#F59E0B]'
                  : 'text-slate-400 hover:text-white hover:bg-[#11253B]'
              }`}
            >
              <Truck className="w-4 h-4" />
              <span>I am a Transporter</span>
            </button>
          </div>

          <div className="p-6 sm:p-8">
            {/* Global submission error banner */}
            {submissionError && (
              <div className="mb-6 p-4 bg-rose-950/60 border border-rose-500/50 rounded-xl text-xs sm:text-sm text-rose-200 flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold text-rose-100">Unable to submit registration</p>
                  <p className="text-rose-200 leading-relaxed">{submissionError}</p>
                </div>
              </div>
            )}

            {/* SHIPPER FORM */}
            {currentTab === 'shipper' && (
              <form onSubmit={handleShipperSubmit} noValidate className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Name */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      Your Full Name <span className="text-[#F59E0B]">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Rajesh Sharma"
                      value={shipperForm.name}
                      onChange={(e) => setShipperForm({ ...shipperForm, name: e.target.value })}
                      className={`w-full px-3.5 py-2.5 bg-[#091827] text-white text-sm rounded-xl border ${
                        shipperErrors.name ? 'border-rose-500' : 'border-[#1E3D60]'
                      } focus:outline-none focus:border-[#F59E0B] focus:ring-1 focus:ring-[#F59E0B]`}
                    />
                    {shipperErrors.name && (
                      <p className="mt-1 text-xs text-rose-400">{shipperErrors.name}</p>
                    )}
                  </div>

                  {/* Business Name */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      Business / Trading Name <span className="text-[#F59E0B]">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Sharma Agro Traders Ltd"
                      value={shipperForm.businessName}
                      onChange={(e) => setShipperForm({ ...shipperForm, businessName: e.target.value })}
                      className={`w-full px-3.5 py-2.5 bg-[#091827] text-white text-sm rounded-xl border ${
                        shipperErrors.businessName ? 'border-rose-500' : 'border-[#1E3D60]'
                      } focus:outline-none focus:border-[#F59E0B] focus:ring-1 focus:ring-[#F59E0B]`}
                    />
                    {shipperErrors.businessName && (
                      <p className="mt-1 text-xs text-rose-400">{shipperErrors.businessName}</p>
                    )}
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      Phone Number <span className="text-[#F59E0B]">*</span>
                    </label>
                    <input
                      type="tel"
                      placeholder="e.g. 9876543210"
                      value={shipperForm.phone}
                      onChange={(e) => setShipperForm({ ...shipperForm, phone: e.target.value })}
                      className={`w-full px-3.5 py-2.5 bg-[#091827] text-white text-sm rounded-xl border ${
                        shipperErrors.phone ? 'border-rose-500' : 'border-[#1E3D60]'
                      } focus:outline-none focus:border-[#F59E0B] focus:ring-1 focus:ring-[#F59E0B]`}
                    />
                    {shipperErrors.phone && (
                      <p className="mt-1 text-xs text-rose-400">{shipperErrors.phone}</p>
                    )}
                  </div>

                  {/* Email (Optional) */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      Email Address <span className="text-slate-500 text-[11px]">(Optional)</span>
                    </label>
                    <input
                      type="email"
                      placeholder="e.g. rajesh@sharma-agro.com"
                      value={shipperForm.email}
                      onChange={(e) => setShipperForm({ ...shipperForm, email: e.target.value })}
                      className={`w-full px-3.5 py-2.5 bg-[#091827] text-white text-sm rounded-xl border ${
                        shipperErrors.email ? 'border-rose-500' : 'border-[#1E3D60]'
                      } focus:outline-none focus:border-[#F59E0B] focus:ring-1 focus:ring-[#F59E0B]`}
                    />
                    {shipperErrors.email && (
                      <p className="mt-1 text-xs text-rose-400">{shipperErrors.email}</p>
                    )}
                  </div>
                </div>

                {/* Primary Shipping Route */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Primary Shipping Route <span className="text-[#F59E0B]">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Gorakhpur to Lucknow, or Lucknow to Kanpur"
                    value={shipperForm.primaryRoute}
                    onChange={(e) => setShipperForm({ ...shipperForm, primaryRoute: e.target.value })}
                    className={`w-full px-3.5 py-2.5 bg-[#091827] text-white text-sm rounded-xl border ${
                      shipperErrors.primaryRoute ? 'border-rose-500' : 'border-[#1E3D60]'
                    } focus:outline-none focus:border-[#F59E0B] focus:ring-1 focus:ring-[#F59E0B]`}
                  />
                  {shipperErrors.primaryRoute && (
                    <p className="mt-1 text-xs text-rose-400">{shipperErrors.primaryRoute}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Cargo Category */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      Cargo Category <span className="text-[#F59E0B]">*</span>
                    </label>
                    <select
                      value={shipperForm.cargoCategory}
                      onChange={(e) => setShipperForm({ ...shipperForm, cargoCategory: e.target.value })}
                      className={`w-full px-3.5 py-2.5 bg-[#091827] text-white text-sm rounded-xl border ${
                        shipperErrors.cargoCategory ? 'border-rose-500' : 'border-[#1E3D60]'
                      } focus:outline-none focus:border-[#F59E0B] focus:ring-1 focus:ring-[#F59E0B]`}
                    >
                      <option value="">Select Cargo Category...</option>
                      {CARGO_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                    {shipperErrors.cargoCategory && (
                      <p className="mt-1 text-xs text-rose-400">{shipperErrors.cargoCategory}</p>
                    )}
                  </div>

                  {/* Shipment Frequency */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      Shipment Frequency <span className="text-[#F59E0B]">*</span>
                    </label>
                    <select
                      value={shipperForm.shipmentFrequency}
                      onChange={(e) => setShipperForm({ ...shipperForm, shipmentFrequency: e.target.value })}
                      className={`w-full px-3.5 py-2.5 bg-[#091827] text-white text-sm rounded-xl border ${
                        shipperErrors.shipmentFrequency ? 'border-rose-500' : 'border-[#1E3D60]'
                      } focus:outline-none focus:border-[#F59E0B] focus:ring-1 focus:ring-[#F59E0B]`}
                    >
                      <option value="">Select Frequency...</option>
                      {SHIPMENT_FREQUENCIES.map((freq) => (
                        <option key={freq} value={freq}>
                          {freq}
                        </option>
                      ))}
                    </select>
                    {shipperErrors.shipmentFrequency && (
                      <p className="mt-1 text-xs text-rose-400">{shipperErrors.shipmentFrequency}</p>
                    )}
                  </div>
                </div>

                {/* Consent Checkbox */}
                <div className="pt-2">
                  <label className="flex items-start space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={shipperForm.consent}
                      onChange={(e) => setShipperForm({ ...shipperForm, consent: e.target.checked })}
                      className="mt-1 h-4 w-4 rounded border-slate-700 bg-[#091827] text-[#F59E0B] focus:ring-[#F59E0B]"
                    />
                    <span className="text-xs text-slate-300 leading-normal">
                      I agree to let RouteWise contact me regarding the pilot program, compatible freight matches, and pilot route scheduling.
                    </span>
                  </label>
                  {shipperErrors.consent && (
                    <p className="mt-1 text-xs text-rose-400">{shipperErrors.consent}</p>
                  )}
                </div>

                {/* Submit button */}
                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`w-full sm:w-auto inline-flex items-center justify-center px-8 py-3.5 text-sm font-bold text-[#091827] bg-[#F59E0B] hover:bg-[#D97706] rounded-xl transition-all shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-white group ${
                      isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
                    }`}
                  >
                    {isSubmitting ? (
                      <>
                        <span className="w-4 h-4 mr-2 border-2 border-[#091827] border-t-transparent rounded-full animate-spin" />
                        <span>Saving Registration...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2 transition-transform group-hover:translate-x-0.5" />
                        <span>Request Early Access</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* TRANSPORTER FORM */}
            {currentTab === 'transporter' && (
              <form onSubmit={handleTransporterSubmit} noValidate className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Name */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      Your Full Name <span className="text-[#F59E0B]">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Jaswinder Singh"
                      value={transporterForm.name}
                      onChange={(e) => setTransporterForm({ ...transporterForm, name: e.target.value })}
                      className={`w-full px-3.5 py-2.5 bg-[#091827] text-white text-sm rounded-xl border ${
                        transporterErrors.name ? 'border-rose-500' : 'border-[#1E3D60]'
                      } focus:outline-none focus:border-[#F59E0B] focus:ring-1 focus:ring-[#F59E0B]`}
                    />
                    {transporterErrors.name && (
                      <p className="mt-1 text-xs text-rose-400">{transporterErrors.name}</p>
                    )}
                  </div>

                  {/* Business or Fleet Name (Optional) */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      Fleet / Transport Name <span className="text-slate-500 text-[11px]">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Northern Freight Carriers"
                      value={transporterForm.fleetName}
                      onChange={(e) => setTransporterForm({ ...transporterForm, fleetName: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-[#091827] text-white text-sm rounded-xl border border-[#1E3D60] focus:outline-none focus:border-[#F59E0B] focus:ring-1 focus:ring-[#F59E0B]"
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      Phone Number <span className="text-[#F59E0B]">*</span>
                    </label>
                    <input
                      type="tel"
                      placeholder="e.g. 9811223344"
                      value={transporterForm.phone}
                      onChange={(e) => setTransporterForm({ ...transporterForm, phone: e.target.value })}
                      className={`w-full px-3.5 py-2.5 bg-[#091827] text-white text-sm rounded-xl border ${
                        transporterErrors.phone ? 'border-rose-500' : 'border-[#1E3D60]'
                      } focus:outline-none focus:border-[#F59E0B] focus:ring-1 focus:ring-[#F59E0B]`}
                    />
                    {transporterErrors.phone && (
                      <p className="mt-1 text-xs text-rose-400">{transporterErrors.phone}</p>
                    )}
                  </div>

                  {/* Email (Optional) */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      Email Address <span className="text-slate-500 text-[11px]">(Optional)</span>
                    </label>
                    <input
                      type="email"
                      placeholder="e.g. dispatch@northernfreight.in"
                      value={transporterForm.email}
                      onChange={(e) => setTransporterForm({ ...transporterForm, email: e.target.value })}
                      className={`w-full px-3.5 py-2.5 bg-[#091827] text-white text-sm rounded-xl border ${
                        transporterErrors.email ? 'border-rose-500' : 'border-[#1E3D60]'
                      } focus:outline-none focus:border-[#F59E0B] focus:ring-1 focus:ring-[#F59E0B]`}
                    />
                    {transporterErrors.email && (
                      <p className="mt-1 text-xs text-rose-400">{transporterErrors.email}</p>
                    )}
                  </div>
                </div>

                {/* Visual Vehicle Selector Experience */}
                <div className="pt-1">
                  <VehicleVisualSelector
                    value={transporterForm.vehicleType}
                    initialCapacity={transporterForm.availableCapacity}
                    error={transporterErrors.vehicleType}
                    onChange={(selectedType, capacityText, metadata) => {
                      setTransporterForm((prev) => ({
                        ...prev,
                        vehicleType: selectedType,
                        availableCapacity: capacityText,
                      }));
                      setVehicleMetadata(metadata);
                      if (transporterErrors.vehicleType) {
                        setTransporterErrors((prev) => ({ ...prev, vehicleType: null }));
                      }
                    }}
                  />
                </div>

                {/* Operating Routes */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Operating Corridors / Highway Routes <span className="text-[#F59E0B]">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. NH27 Gorakhpur–Ayodhya–Lucknow, or Lucknow–Kanpur"
                    value={transporterForm.operatingRoutes}
                    onChange={(e) => setTransporterForm({ ...transporterForm, operatingRoutes: e.target.value })}
                    className={`w-full px-3.5 py-2.5 bg-[#091827] text-white text-sm rounded-xl border ${
                      transporterErrors.operatingRoutes ? 'border-rose-500' : 'border-[#1E3D60]'
                    } focus:outline-none focus:border-[#F59E0B] focus:ring-1 focus:ring-[#F59E0B]`}
                  />
                  {transporterErrors.operatingRoutes && (
                    <p className="mt-1 text-xs text-rose-400">{transporterErrors.operatingRoutes}</p>
                  )}
                </div>

                {/* Consent Checkbox */}
                <div className="pt-2">
                  <label className="flex items-start space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={transporterForm.consent}
                      onChange={(e) => setTransporterForm({ ...transporterForm, consent: e.target.checked })}
                      className="mt-1 h-4 w-4 rounded border-slate-700 bg-[#091827] text-[#F59E0B] focus:ring-[#F59E0B]"
                    />
                    <span className="text-xs text-slate-300 leading-normal">
                      I agree to let RouteWise contact me about available return loads and pilot load-matching opportunities.
                    </span>
                  </label>
                  {transporterErrors.consent && (
                    <p className="mt-1 text-xs text-rose-400">{transporterErrors.consent}</p>
                  )}
                </div>

                {/* Submit button */}
                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`w-full sm:w-auto inline-flex items-center justify-center px-8 py-3.5 text-sm font-bold text-[#091827] bg-[#F59E0B] hover:bg-[#D97706] rounded-xl transition-all shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-white group ${
                      isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
                    }`}
                  >
                    {isSubmitting ? (
                      <>
                        <span className="w-4 h-4 mr-2 border-2 border-[#091827] border-t-transparent rounded-full animate-spin" />
                        <span>Saving Registration...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2 transition-transform group-hover:translate-x-0.5" />
                        <span>Request Early Access</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* VERIFIED SUCCESS CONFIRMATION MODAL */}
        {submittedRegistration && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
            <div className="bg-[#0F2A44] border-2 border-[#F59E0B] rounded-2xl max-w-xl w-full p-6 sm:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
              <div className="flex items-start justify-between pb-4 border-b border-[#1E3D60]">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">
                      Pilot Registration Confirmed
                    </h3>
                    <p className="text-xs text-emerald-400 font-medium flex items-center mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block mr-1.5 animate-pulse" />
                      Saved to RouteWise Pilot Database
                    </p>
                  </div>
                </div>
                <button
                  onClick={resetAll}
                  className="text-slate-400 hover:text-white p-1 rounded-lg"
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>

              {/* Verified Details Card */}
              <div className="my-5 p-4 bg-[#11253B] rounded-xl border border-amber-500/40 text-xs text-slate-300 space-y-3">
                <p className="font-bold text-white text-sm">
                  Thank you, {submittedRegistration.contactName}!
                </p>
                <p className="leading-relaxed">
                  Your early access registration has been officially recorded. Our logistics team will review your corridor specifications and get in touch with you shortly.
                </p>

                <div className="p-3.5 bg-[#091827] rounded-xl border border-[#1E3D60] space-y-2 text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-[#1E3D60]/60">
                    <span className="text-slate-400 flex items-center">
                      <Hash className="w-3.5 h-3.5 mr-1 text-[#F59E0B]" />
                      Reference ID:
                    </span>
                    <span className="font-mono text-[#F59E0B] font-semibold text-[11px]">
                      {submittedRegistration.id}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Account Type:</span>
                    <span className="font-semibold text-white uppercase tracking-wider text-[11px]">
                      {submittedRegistration.role}
                    </span>
                  </div>

                  {submittedRegistration.businessName && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Business / Entity:</span>
                      <span className="text-white font-medium">
                        {submittedRegistration.businessName}
                      </span>
                    </div>
                  )}

                  {submittedRegistration.fleetName && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Fleet Name:</span>
                      <span className="text-white font-medium">
                        {submittedRegistration.fleetName}
                      </span>
                    </div>
                  )}

                  <div className="flex items-start justify-between">
                    <span className="text-slate-400 flex items-center shrink-0">
                      <MapPin className="w-3.5 h-3.5 mr-1 text-emerald-400" />
                      Corridor:
                    </span>
                    <span className="text-white font-medium text-right max-w-[240px]">
                      {submittedRegistration.route}
                    </span>
                  </div>

                  {submittedRegistration.cargoCategory && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Cargo Type:</span>
                      <span className="text-slate-200">
                        {submittedRegistration.cargoCategory}
                      </span>
                    </div>
                  )}

                  {submittedRegistration.vehicleType && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Vehicle Type:</span>
                      <span className="text-slate-200">
                        {submittedRegistration.vehicleType}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-1 border-t border-[#1E3D60]/60 text-[11px]">
                    <span className="text-slate-400 flex items-center">
                      <Clock className="w-3 h-3 mr-1 text-slate-500" />
                      Recorded:
                    </span>
                    <span className="text-slate-400 font-mono">
                      {new Date(submittedRegistration.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={resetAll}
                  className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-2.5 text-xs font-bold text-[#091827] bg-[#F59E0B] hover:bg-[#D97706] rounded-xl transition-colors shadow-sm"
                >
                  <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                  <span>Register Another Shipment / Fleet</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
