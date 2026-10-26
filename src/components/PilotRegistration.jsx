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
      errors.phone = 'Phone number is required to contact you';
    } else if (!validatePhone(shipperForm.phone)) {
      errors.phone = 'Please enter a valid 10-digit mobile number';
    }
    if (shipperForm.email.trim() && !validateEmail(shipperForm.email)) {
      errors.email = 'Please provide a valid email address';
    }
    if (!shipperForm.primaryRoute.trim()) errors.primaryRoute = 'Primary route is required';
    if (!shipperForm.cargoCategory) errors.cargoCategory = 'Please select the type of goods';
    if (!shipperForm.shipmentFrequency) errors.shipmentFrequency = 'Please select how often you send goods';
    if (!shipperForm.consent) errors.consent = 'Please agree to let us contact you';

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
      errors.phone = 'Phone number is required to contact you';
    } else if (!validatePhone(transporterForm.phone)) {
      errors.phone = 'Please enter a valid 10-digit mobile number';
    }
    if (transporterForm.email.trim() && !validateEmail(transporterForm.email)) {
      errors.email = 'Please provide a valid email address';
    }
    if (!transporterForm.vehicleType) errors.vehicleType = 'Please select primary vehicle type';
    if (!transporterForm.operatingRoutes.trim()) errors.operatingRoutes = 'Operating routes are required';
    if (!transporterForm.consent) errors.consent = 'Please agree to let us contact you';

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
    <section id="pilot-section" className="py-16 sm:py-24 bg-[#F5F0E6] relative border-b border-[#E2DBD0] scroll-mt-16">
      <div
        ref={sectionRef}
        className={`max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 w-full reveal-on-scroll ${
          isRevealed ? 'is-revealed' : ''
        }`}
      >
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-8">
          <div className="inline-flex items-center space-x-2 bg-[#171717] border border-[#2D2D2D] px-3 py-1 rounded text-white mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-[#F28C28]" />
            <span className="text-[10px] font-mono font-bold uppercase tracking-[0.14em] text-[#F5F0E6]">
              CORRIDOR REGISTRATION
            </span>
          </div>
          <h2 
            className="text-3xl sm:text-4xl font-black text-[#171717] tracking-tight"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            Register for Network Access
          </h2>
          <p className="mt-3 text-sm sm:text-base text-[#525252]">
            Connect your regular freight consignments or available truck capacity directly into our national corridor schedule.
          </p>
        </div>

        {/* Transparency & Operational Explanation Box */}
        <div className="mb-6 bg-[#FAF7F0] border border-[#D4CBBC] rounded p-4 space-y-2 shadow-xs">
          <div className="flex items-start space-x-3">
            <Info className="w-4 h-4 text-[#F28C28] shrink-0 mt-0.5" />
            <div className="text-xs text-[#525252] leading-relaxed space-y-1">
              <p>
                <strong className="text-[#171717] font-mono font-bold uppercase tracking-wider mr-1">
                  CORRIDOR COORDINATION:
                </strong>
                Submit your cargo requirements or transport fleet capacity below. Our operational team verifies corridor alignment and matches you with verified partners.
              </p>
            </div>
          </div>
        </div>

        {/* Form Container */}
        <div className="bg-[#FAF7F0] border border-[#D4CBBC] rounded shadow-sm overflow-hidden">
          {/* Tab Selection */}
          <div className="grid grid-cols-2 border-b border-[#D4CBBC] bg-[#E8E1D5]">
            <button
              type="button"
              onClick={() => {
                setCurrentTab('shipper');
                setSubmissionError(null);
                if (onTabChange) onTabChange('shipper');
              }}
              className={`py-3.5 px-4 text-center font-mono font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-2 transition-colors ${
                currentTab === 'shipper'
                  ? 'bg-[#FAF7F0] text-[#171717] border-b-2 border-[#F28C28]'
                  : 'text-[#737373] hover:text-[#171717] hover:bg-[#E2DBD0]'
              }`}
            >
              <UserCheck className="w-4 h-4 text-[#F28C28]" />
              <span>I Need to Dispatch Goods</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setCurrentTab('transporter');
                setSubmissionError(null);
                if (onTabChange) onTabChange('transporter');
              }}
              className={`py-3.5 px-4 text-center font-mono font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-2 transition-colors ${
                currentTab === 'transporter'
                  ? 'bg-[#FAF7F0] text-[#171717] border-b-2 border-[#F28C28]'
                  : 'text-[#737373] hover:text-[#171717] hover:bg-[#E2DBD0]'
              }`}
            >
              <Truck className="w-4 h-4 text-[#F28C28]" />
              <span>I Operate Commercial Fleet</span>
            </button>
          </div>

          <div className="p-6 sm:p-8">
            {/* Global submission error banner */}
            {submissionError && (
              <div className="mb-6 p-3.5 bg-red-50 border border-red-300 rounded text-xs text-red-700 flex items-start space-x-3">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="font-bold text-red-900 uppercase tracking-wider text-[11px]">Submission Error</p>
                  <p className="text-red-700">{submissionError}</p>
                </div>
              </div>
            )}

            {/* SHIPPER FORM */}
            {currentTab === 'shipper' && (
              <form onSubmit={handleShipperSubmit} noValidate className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Name */}
                  <div>
                    <label className="block text-[10px] font-mono font-bold text-[#737373] uppercase tracking-wider mb-1.5">
                      Full Name <span className="text-[#F28C28]">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Rajesh Sharma"
                      value={shipperForm.name}
                      onChange={(e) => setShipperForm({ ...shipperForm, name: e.target.value })}
                      className={`w-full px-3 py-2 bg-white text-[#171717] text-xs rounded border ${
                        shipperErrors.name ? 'border-red-500' : 'border-[#D4CBBC]'
                      } focus:outline-none focus:border-[#F28C28] focus:ring-1 focus:ring-[#F28C28]`}
                    />
                    {shipperErrors.name && (
                      <p className="mt-1 text-[11px] text-red-600">{shipperErrors.name}</p>
                    )}
                  </div>

                  {/* Business Name */}
                  <div>
                    <label className="block text-[10px] font-mono font-bold text-[#737373] uppercase tracking-wider mb-1.5">
                      Business / Trading Entity <span className="text-[#F28C28]">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Sharma Agro Traders Ltd"
                      value={shipperForm.businessName}
                      onChange={(e) => setShipperForm({ ...shipperForm, businessName: e.target.value })}
                      className={`w-full px-3 py-2 bg-white text-[#171717] text-xs rounded border ${
                        shipperErrors.businessName ? 'border-red-500' : 'border-[#D4CBBC]'
                      } focus:outline-none focus:border-[#F28C28] focus:ring-1 focus:ring-[#F28C28]`}
                    />
                    {shipperErrors.businessName && (
                      <p className="mt-1 text-[11px] text-red-600">{shipperErrors.businessName}</p>
                    )}
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-[10px] font-mono font-bold text-[#737373] uppercase tracking-wider mb-1.5">
                      Mobile Number <span className="text-[#F28C28]">*</span>
                    </label>
                    <input
                      type="tel"
                      placeholder="e.g. 9876543210"
                      value={shipperForm.phone}
                      onChange={(e) => setShipperForm({ ...shipperForm, phone: e.target.value })}
                      className={`w-full px-3 py-2 bg-white text-[#171717] text-xs rounded border ${
                        shipperErrors.phone ? 'border-red-500' : 'border-[#D4CBBC]'
                      } focus:outline-none focus:border-[#F28C28] focus:ring-1 focus:ring-[#F28C28]`}
                    />
                    {shipperErrors.phone && (
                      <p className="mt-1 text-[11px] text-red-600">{shipperErrors.phone}</p>
                    )}
                  </div>

                  {/* Email (Optional) */}
                  <div>
                    <label className="block text-[10px] font-mono font-bold text-[#737373] uppercase tracking-wider mb-1.5">
                      Email Address <span className="text-[#A3A3A3] text-[10px] font-normal">(Optional)</span>
                    </label>
                    <input
                      type="email"
                      placeholder="e.g. rajesh@sharma-agro.com"
                      value={shipperForm.email}
                      onChange={(e) => setShipperForm({ ...shipperForm, email: e.target.value })}
                      className={`w-full px-3 py-2 bg-white text-[#171717] text-xs rounded border ${
                        shipperErrors.email ? 'border-red-500' : 'border-[#D4CBBC]'
                      } focus:outline-none focus:border-[#F28C28] focus:ring-1 focus:ring-[#F28C28]`}
                    />
                    {shipperErrors.email && (
                      <p className="mt-1 text-[11px] text-red-600">{shipperErrors.email}</p>
                    )}
                  </div>
                </div>

                {/* Primary Shipping Route */}
                <div>
                  <label className="block text-[10px] font-mono font-bold text-[#737373] uppercase tracking-wider mb-1.5">
                    Primary Corridor / Highway Route <span className="text-[#F28C28]">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Gorakhpur to Lucknow, or Lucknow to Kanpur"
                    value={shipperForm.primaryRoute}
                    onChange={(e) => setShipperForm({ ...shipperForm, primaryRoute: e.target.value })}
                    className={`w-full px-3 py-2 bg-white text-[#171717] text-xs rounded border ${
                      shipperErrors.primaryRoute ? 'border-red-500' : 'border-[#D4CBBC]'
                    } focus:outline-none focus:border-[#F28C28] focus:ring-1 focus:ring-[#F28C28]`}
                  />
                  {shipperErrors.primaryRoute && (
                    <p className="mt-1 text-[11px] text-red-600">{shipperErrors.primaryRoute}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Cargo Category */}
                  <div>
                    <label className="block text-[10px] font-mono font-bold text-[#737373] uppercase tracking-wider mb-1.5">
                      Freight Classification <span className="text-[#F28C28]">*</span>
                    </label>
                    <select
                      value={shipperForm.cargoCategory}
                      onChange={(e) => setShipperForm({ ...shipperForm, cargoCategory: e.target.value })}
                      className={`w-full px-3 py-2 bg-white text-[#171717] text-xs rounded border ${
                        shipperErrors.cargoCategory ? 'border-red-500' : 'border-[#D4CBBC]'
                      } focus:outline-none focus:border-[#F28C28] focus:ring-1 focus:ring-[#F28C28]`}
                    >
                      <option value="">Select Freight Classification...</option>
                      {CARGO_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                    {shipperErrors.cargoCategory && (
                      <p className="mt-1 text-[11px] text-red-600">{shipperErrors.cargoCategory}</p>
                    )}
                  </div>

                  {/* Shipment Frequency */}
                  <div>
                    <label className="block text-[10px] font-mono font-bold text-[#737373] uppercase tracking-wider mb-1.5">
                      Dispatch Frequency <span className="text-[#F28C28]">*</span>
                    </label>
                    <select
                      value={shipperForm.shipmentFrequency}
                      onChange={(e) => setShipperForm({ ...shipperForm, shipmentFrequency: e.target.value })}
                      className={`w-full px-3 py-2 bg-white text-[#171717] text-xs rounded border ${
                        shipperErrors.shipmentFrequency ? 'border-red-500' : 'border-[#D4CBBC]'
                      } focus:outline-none focus:border-[#F28C28] focus:ring-1 focus:ring-[#F28C28]`}
                    >
                      <option value="">Select Frequency...</option>
                      {SHIPMENT_FREQUENCIES.map((freq) => (
                        <option key={freq} value={freq}>
                          {freq}
                        </option>
                      ))}
                    </select>
                    {shipperErrors.shipmentFrequency && (
                      <p className="mt-1 text-[11px] text-red-600">{shipperErrors.shipmentFrequency}</p>
                    )}
                  </div>
                </div>

                {/* Consent Checkbox */}
                <div className="pt-1">
                  <label className="flex items-start space-x-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={shipperForm.consent}
                      onChange={(e) => setShipperForm({ ...shipperForm, consent: e.target.checked })}
                      className="mt-0.5 h-4 w-4 rounded border-[#D4CBBC] text-[#F28C28] focus:ring-[#F28C28]"
                    />
                    <span className="text-xs text-[#525252] leading-normal">
                      I authorize LoadMitra to coordinate transport matching and corridor updates for my freight.
                    </span>
                  </label>
                  {shipperErrors.consent && (
                    <p className="mt-1 text-[11px] text-red-600">{shipperErrors.consent}</p>
                  )}
                </div>

                {/* Submit button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`w-full sm:w-auto inline-flex items-center justify-center px-6 py-2.5 text-xs font-mono font-bold uppercase tracking-wider text-[#171717] bg-[#F28C28] hover:bg-[#DE7919] rounded transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-[#171717] group ${
                      isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
                    }`}
                  >
                    {isSubmitting ? (
                      <>
                        <span className="w-3.5 h-3.5 mr-2 border-2 border-[#171717] border-t-transparent rounded-full animate-spin" />
                        <span>Saving Registration...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5 mr-2 transition-transform group-hover:translate-x-0.5" />
                        <span>Submit Registration</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* TRANSPORTER FORM */}
            {currentTab === 'transporter' && (
              <form onSubmit={handleTransporterSubmit} noValidate className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Name */}
                  <div>
                    <label className="block text-[10px] font-mono font-bold text-[#737373] uppercase tracking-wider mb-1.5">
                      Full Name <span className="text-[#F28C28]">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Jaswinder Singh"
                      value={transporterForm.name}
                      onChange={(e) => setTransporterForm({ ...transporterForm, name: e.target.value })}
                      className={`w-full px-3 py-2 bg-white text-[#171717] text-xs rounded border ${
                        transporterErrors.name ? 'border-red-500' : 'border-[#D4CBBC]'
                      } focus:outline-none focus:border-[#F28C28] focus:ring-1 focus:ring-[#F28C28]`}
                    />
                    {transporterErrors.name && (
                      <p className="mt-1 text-[11px] text-red-600">{transporterErrors.name}</p>
                    )}
                  </div>

                  {/* Business or Fleet Name (Optional) */}
                  <div>
                    <label className="block text-[10px] font-mono font-bold text-[#737373] uppercase tracking-wider mb-1.5">
                      Fleet / Transport Enterprise <span className="text-[#A3A3A3] text-[10px] font-normal">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Northern Freight Carriers"
                      value={transporterForm.fleetName}
                      onChange={(e) => setTransporterForm({ ...transporterForm, fleetName: e.target.value })}
                      className="w-full px-3 py-2 bg-white text-[#171717] text-xs rounded border border-[#D4CBBC] focus:outline-none focus:border-[#F28C28] focus:ring-1 focus:ring-[#F28C28]"
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-[10px] font-mono font-bold text-[#737373] uppercase tracking-wider mb-1.5">
                      Mobile Number <span className="text-[#F28C28]">*</span>
                    </label>
                    <input
                      type="tel"
                      placeholder="e.g. 9811223344"
                      value={transporterForm.phone}
                      onChange={(e) => setTransporterForm({ ...transporterForm, phone: e.target.value })}
                      className={`w-full px-3 py-2 bg-white text-[#171717] text-xs rounded border ${
                        transporterErrors.phone ? 'border-red-500' : 'border-[#D4CBBC]'
                      } focus:outline-none focus:border-[#F28C28] focus:ring-1 focus:ring-[#F28C28]`}
                    />
                    {transporterErrors.phone && (
                      <p className="mt-1 text-[11px] text-red-600">{transporterErrors.phone}</p>
                    )}
                  </div>

                  {/* Email (Optional) */}
                  <div>
                    <label className="block text-[10px] font-mono font-bold text-[#737373] uppercase tracking-wider mb-1.5">
                      Email Address <span className="text-[#A3A3A3] text-[10px] font-normal">(Optional)</span>
                    </label>
                    <input
                      type="email"
                      placeholder="e.g. dispatch@northernfreight.in"
                      value={transporterForm.email}
                      onChange={(e) => setTransporterForm({ ...transporterForm, email: e.target.value })}
                      className={`w-full px-3 py-2 bg-white text-[#171717] text-xs rounded border ${
                        transporterErrors.email ? 'border-red-500' : 'border-[#D4CBBC]'
                      } focus:outline-none focus:border-[#F28C28] focus:ring-1 focus:ring-[#F28C28]`}
                    />
                    {transporterErrors.email && (
                      <p className="mt-1 text-[11px] text-red-600">{transporterErrors.email}</p>
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
                  <label className="block text-[10px] font-mono font-bold text-[#737373] uppercase tracking-wider mb-1.5">
                    Operating Corridor / Primary Highway Routes <span className="text-[#F28C28]">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. NH27 Gorakhpur–Ayodhya–Lucknow, or Lucknow–Kanpur"
                    value={transporterForm.operatingRoutes}
                    onChange={(e) => setTransporterForm({ ...transporterForm, operatingRoutes: e.target.value })}
                    className={`w-full px-3 py-2 bg-white text-[#171717] text-xs rounded border ${
                      transporterErrors.operatingRoutes ? 'border-red-500' : 'border-[#D4CBBC]'
                    } focus:outline-none focus:border-[#F28C28] focus:ring-1 focus:ring-[#F28C28]`}
                  />
                  {transporterErrors.operatingRoutes && (
                    <p className="mt-1 text-[11px] text-red-600">{transporterErrors.operatingRoutes}</p>
                  )}
                </div>

                {/* Consent Checkbox */}
                <div className="pt-1">
                  <label className="flex items-start space-x-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={transporterForm.consent}
                      onChange={(e) => setTransporterForm({ ...transporterForm, consent: e.target.checked })}
                      className="mt-0.5 h-4 w-4 rounded border-[#D4CBBC] text-[#F28C28] focus:ring-[#F28C28]"
                    />
                    <span className="text-xs text-[#525252] leading-normal">
                      I agree to let LoadMitra contact me about available loads and backhaul opportunities.
                    </span>
                  </label>
                  {transporterErrors.consent && (
                    <p className="mt-1 text-[11px] text-red-600">{transporterErrors.consent}</p>
                  )}
                </div>

                {/* Submit button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`w-full sm:w-auto inline-flex items-center justify-center px-6 py-2.5 text-xs font-mono font-bold uppercase tracking-wider text-[#171717] bg-[#F28C28] hover:bg-[#DE7919] rounded transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-[#171717] group ${
                      isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
                    }`}
                  >
                    {isSubmitting ? (
                      <>
                        <span className="w-3.5 h-3.5 mr-2 border-2 border-[#171717] border-t-transparent rounded-full animate-spin" />
                        <span>Saving Registration...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5 mr-2 transition-transform group-hover:translate-x-0.5" />
                        <span>Submit Registration</span>
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
            <div className="bg-[#171717] border border-[#2D2D2D] rounded-lg max-w-xl w-full p-6 sm:p-7 shadow-2xl relative max-h-[90vh] overflow-y-auto text-[#F5F0E6]">
              <div className="flex items-start justify-between pb-4 border-b border-[#2D2D2D]">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded bg-[#262626] border border-[#3D3D3D] flex items-center justify-center text-emerald-400 shrink-0">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white uppercase tracking-wider">
                      Registration Recorded
                    </h3>
                    <p className="text-xs text-emerald-400 font-mono flex items-center mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block mr-1.5 animate-pulse" />
                      LIVE NETWORK ENTRY ACTIVE
                    </p>
                  </div>
                </div>
                <button
                  onClick={resetAll}
                  className="text-[#A3A3A3] hover:text-white p-1 rounded"
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>

              {/* Verified Details Card */}
              <div className="my-5 p-4 bg-[#1F1F1F] rounded border border-[#2D2D2D] text-xs text-[#A3A3A3] space-y-3">
                <p className="font-bold text-white text-sm">
                  Welcome to LoadMitra, {submittedRegistration.contactName}.
                </p>
                <p className="leading-relaxed">
                  Your details have been registered into the operational database. Corridor matching is active.
                </p>

                <div className="p-3 bg-[#171717] rounded border border-[#2D2D2D] space-y-2 text-xs font-tabular">
                  <div className="flex items-center justify-between pb-2 border-b border-[#2D2D2D]">
                    <span className="text-[#737373] font-mono uppercase text-[10px] flex items-center">
                      <Hash className="w-3.5 h-3.5 mr-1 text-[#F28C28]" />
                      REFERENCE ID
                    </span>
                    <span className="font-mono text-[#F28C28] font-bold text-xs">
                      {submittedRegistration.id}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-[#737373] font-mono uppercase text-[10px]">ACCOUNT CLASSIFICATION</span>
                    <span className="font-semibold text-white uppercase tracking-wider text-[11px]">
                      {submittedRegistration.role === 'SHIPPER' ? 'Goods Owner' : 'Carrier Partner'}
                    </span>
                  </div>

                  {submittedRegistration.businessName && (
                    <div className="flex items-center justify-between">
                      <span className="text-[#737373] font-mono uppercase text-[10px]">BUSINESS ENTITY</span>
                      <span className="text-white font-medium">
                        {submittedRegistration.businessName}
                      </span>
                    </div>
                  )}

                  {submittedRegistration.fleetName && (
                    <div className="flex items-center justify-between">
                      <span className="text-[#737373] font-mono uppercase text-[10px]">FLEET NAME</span>
                      <span className="text-white font-medium">
                        {submittedRegistration.fleetName}
                      </span>
                    </div>
                  )}

                  <div className="flex items-start justify-between">
                    <span className="text-[#737373] font-mono uppercase text-[10px] flex items-center shrink-0">
                      <MapPin className="w-3.5 h-3.5 mr-1 text-emerald-400" />
                      CORRIDOR
                    </span>
                    <span className="text-white font-medium text-right max-w-[240px]">
                      {submittedRegistration.route}
                    </span>
                  </div>

                  {submittedRegistration.cargoCategory && (
                    <div className="flex items-center justify-between">
                      <span className="text-[#737373] font-mono uppercase text-[10px]">FREIGHT TYPE</span>
                      <span className="text-[#D4CBBC]">
                        {submittedRegistration.cargoCategory}
                      </span>
                    </div>
                  )}

                  {submittedRegistration.vehicleType && (
                    <div className="flex items-center justify-between">
                      <span className="text-[#737373] font-mono uppercase text-[10px]">VEHICLE CLASS</span>
                      <span className="text-[#D4CBBC]">
                        {submittedRegistration.vehicleType}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-1 border-t border-[#2D2D2D] text-[10px] text-[#737373]">
                    <span className="flex items-center">
                      <Clock className="w-3 h-3 mr-1 text-[#737373]" />
                      TIMESTAMP
                    </span>
                    <span className="font-mono">
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
                  className="w-full sm:w-auto inline-flex items-center justify-center px-5 py-2 text-xs font-mono font-bold uppercase tracking-wider text-[#171717] bg-[#F28C28] hover:bg-[#DE7919] rounded transition-colors shadow-xs"
                >
                  <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                  <span>Register Another Corridor</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
