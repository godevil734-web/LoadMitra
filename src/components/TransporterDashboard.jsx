import React, { useState, useEffect, useCallback } from 'react';
import {
  Truck,
  Package,
  MapPin,
  Plus,
  Search,
  RotateCcw,
  AlertCircle,
  CheckCircle2,
  Phone,
  X,
  Edit3,
  Trash2,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Send,
  ArrowRight,
  Ban,
  Info,
  ArrowLeftRight,
  Check,
  Bell,
  ShieldCheck,
  FileCheck,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import Logo from './Logo';
import { VEHICLE_CATEGORIES } from '../data/vehicleData';
import VehicleSvgIcon from './VehicleSvgIcon';
import NotificationDrawer from './NotificationDrawer';
import TransporterVerificationSection from './TransporterVerificationSection';

const CARGO_OPTIONS = [
  'General Goods',
  'Agricultural Goods',
  'Packaged Goods',
  'Industrial Goods',
  'Automotive & Spare Parts',
  'Textiles & Garments',
  'Other',
];

const VEHICLE_OPTIONS = [
  'Mini Truck / Tata Ace',
  'Pickup Truck',
  'Light Commercial Vehicle (LCV)',
  'Medium Commercial Truck',
  'Heavy-Duty Truck',
  'Open Body Truck',
  'Closed Container Truck',
  'Refrigerated Truck',
  'Trailer / Multi-Axle Truck',
  'Flatbed Truck',
  'Tanker',
  'Tipper / Dumper',
];

const VEHICLE_STATUS_CONFIG = {
  AVAILABLE: {
    label: 'Available Now',
    badge: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    dot: 'bg-emerald-400',
  },
  MATCHED: {
    label: 'Booked',
    badge: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
    dot: 'bg-sky-400',
  },
  IN_TRANSIT: {
    label: 'On the Way',
    badge: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
    dot: 'bg-indigo-400',
  },
  COMPLETED: {
    label: 'Trip Finished',
    badge: 'bg-slate-500/15 text-slate-300 border-slate-500/30',
    dot: 'bg-slate-400',
  },
  CANCELLED: {
    label: 'Cancelled',
    badge: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
    dot: 'bg-rose-400',
  },
};

const INTEREST_STATUS_CONFIG = {
  PENDING: {
    label: 'Waiting for Goods Owner Review',
    badge: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    dot: 'bg-amber-400',
  },
  ACCEPTED: {
    label: 'Price Offer Accepted',
    badge: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    dot: 'bg-emerald-400',
  },
  REJECTED: {
    label: 'Offer Declined',
    badge: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
    dot: 'bg-rose-400',
  },
  WITHDRAWN: {
    label: 'Withdrawn',
    badge: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
    dot: 'bg-slate-400',
  },
};

const BOOKING_STATUS_CONFIG = {
  CONFIRMED: {
    label: 'Booking Confirmed',
    badge: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
    dot: 'bg-sky-400',
  },
  PICKED_UP: {
    label: 'Goods Picked Up',
    badge: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    dot: 'bg-amber-400',
  },
  IN_TRANSIT: {
    label: 'On the Way',
    badge: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
    dot: 'bg-indigo-400',
  },
  DELIVERED: {
    label: 'Delivered (Waiting for Confirmation)',
    badge: 'bg-teal-500/15 text-teal-300 border-teal-500/30',
    dot: 'bg-teal-400',
  },
  COMPLETED: {
    label: 'Delivery Completed',
    badge: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    dot: 'bg-emerald-400',
  },
  CANCELLED: {
    label: 'Cancelled',
    badge: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
    dot: 'bg-rose-400',
  },
};

export default function TransporterDashboard() {
  const [activeTab, setActiveTab] = useState('marketplace'); // 'marketplace' | 'my-vehicles' | 'my-requests' | 'my-bookings'
  const [currentTransporter, setCurrentTransporter] = useState(null);
  const [authToken, setAuthToken] = useState(() => localStorage.getItem('routewise_transporter_token') || null);

  // Notifications & Alerts Drawer
  const [toast, setToast] = useState(null);
  const [isNotificationDrawerOpen, setIsNotificationDrawerOpen] = useState(false);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);
  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4500);
  };

  // Auth modal
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'
  const [registerName, setRegisterName] = useState('');
  const [registerBusiness, setRegisterBusiness] = useState('');
  const [registerPhone, setRegisterPhone] = useState('');
  const [registerCorridor, setRegisterCorridor] = useState('');

  // 1. Available Freight Listings Feed State
  const [listings, setListings] = useState([]);
  const [listingsLoading, setListingsLoading] = useState(true);
  const [listingsPagination, setListingsPagination] = useState({ page: 1, limit: 9, totalPages: 1, totalCount: 0 });
  const [listingsPage, setListingsPage] = useState(1);
  const [search, setSearch] = useState('');
  const [originFilter, setOriginFilter] = useState('');
  const [destFilter, setDestFilter] = useState('');
  const [cargoFilter, setCargoFilter] = useState('ALL');
  const [vehicleFilter, setVehicleFilter] = useState('ALL');
  const [minWeight, setMinWeight] = useState('');
  const [maxWeight, setMaxWeight] = useState('');
  const [pickupDateFilter, setPickupDateFilter] = useState('');

  // Selected Listing for Detail view & Proposal Submission
  const [selectedListing, setSelectedListing] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isInterestModalOpen, setIsInterestModalOpen] = useState(false);
  const [proposalRate, setProposalRate] = useState('');
  const [proposalVehicle, setProposalVehicle] = useState('');
  const [proposalVehicleId, setProposalVehicleId] = useState('');
  const [proposalAvailableDate, setProposalAvailableDate] = useState('');
  const [proposalMessage, setProposalMessage] = useState('');
  const [isSubmittingProposal, setIsSubmittingProposal] = useState(false);

  // 2. Transporter Vehicle Availability State
  const [vehicles, setVehicles] = useState([]);
  const [vehiclesLoading, setVehiclesLoading] = useState(false);
  const [vehicleStatusFilter, setVehicleStatusFilter] = useState('ALL');
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [isEditingVehicle, setIsEditingVehicle] = useState(false);
  const [editingVehicleId, setEditingVehicleId] = useState(null);

  // Vehicle form fields
  const [vehType, setVehType] = useState(VEHICLE_OPTIONS[0]);
  const [vehCapacity, setVehCapacity] = useState('3.5');
  const [vehCapacityUnit, setVehCapacityUnit] = useState('Tons');
  const [vehCurrentLoc, setVehCurrentLoc] = useState('');
  const [vehDestination, setVehDestination] = useState('');
  const [vehCorridor, setVehCorridor] = useState('');
  const [vehAvailDate, setVehAvailDate] = useState('');
  const [vehIsReturnTrip, setVehIsReturnTrip] = useState(false);
  const [vehRateExpectation, setVehRateExpectation] = useState('');
  const [vehNotes, setVehNotes] = useState('');
  const [isSavingVehicle, setIsSavingVehicle] = useState(false);

  // 3. Transporter Load Requests State
  const [requests, setRequests] = useState([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [requestStatusFilter, setRequestStatusFilter] = useState('ALL');
  const [withdrawingRequestId, setWithdrawingRequestId] = useState(null);

  // 4. Confirmed Bookings State (Phase 5 & 6)
  const [bookings, setBookings] = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [activeBookingModal, setActiveBookingModal] = useState(null); // { type: 'pickup' | 'transit' | 'delivery', booking: {...} }
  const [modalInputLocation, setModalInputLocation] = useState('');
  const [modalInputNotes, setModalInputNotes] = useState('');
  const [modalInputRecipient, setModalInputRecipient] = useState('');
  const [modalInputProof, setModalInputProof] = useState('');
  const [modalDeliveryFile, setModalDeliveryFile] = useState(null);
  const [isUpdatingBooking, setIsUpdatingBooking] = useState(false);

  // Validate session on token change
  const verifySession = useCallback(async (token) => {
    if (!token) {
      setCurrentTransporter(null);
      return;
    }
    try {
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentTransporter(data.user);
      } else {
        localStorage.removeItem('routewise_transporter_token');
        setAuthToken(null);
        setCurrentTransporter(null);
      }
    } catch {
      // Retain in dev
    }
  }, []);

  useEffect(() => {
    verifySession(authToken);
  }, [authToken, verifySession]);

  // Demo Transporter Sign-in
  const loginDemoTransporter = async (index = 1) => {
    try {
      const res = await fetch('/api/auth/demo-transporter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ index }),
      });
      const data = await res.json();
      if (res.ok && data.token) {
        localStorage.setItem('routewise_transporter_token', data.token);
        setAuthToken(data.token);
        setCurrentTransporter(data.user);
        setIsAuthModalOpen(false);
        showToast('success', `Signed in as Demo Transporter ${index}: ${data.user.businessName}`);
      } else {
        showToast('error', data.message || 'Demo login failed');
      }
    } catch {
      showToast('error', 'Network error during login');
    }
  };

  const handleCustomAuth = async (e) => {
    e.preventDefault();
    if (authMode === 'login') {
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: authEmail, password: authPassword }),
        });
        const data = await res.json();
        if (res.ok && data.token) {
          localStorage.setItem('routewise_transporter_token', data.token);
          setAuthToken(data.token);
          setCurrentTransporter(data.user);
          setIsAuthModalOpen(false);
          showToast('success', `Welcome back, ${data.user.name}`);
        } else {
          showToast('error', data.message || 'Login failed. Check your credentials.');
        }
      } catch {
        showToast('error', 'Network error while attempting to sign in.');
      }
    } else {
      try {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: registerName,
            businessName: registerBusiness,
            email: authEmail,
            phone: registerPhone,
            password: authPassword,
            role: 'TRANSPORTER',
            operatingCorridor: registerCorridor,
          }),
        });
        const data = await res.json();
        if (res.ok && data.token) {
          localStorage.setItem('routewise_transporter_token', data.token);
          setAuthToken(data.token);
          setCurrentTransporter(data.user);
          setIsAuthModalOpen(false);
          showToast('success', 'Transporter account created successfully!');
        } else {
          showToast('error', data.message || 'Registration failed');
        }
      } catch {
        showToast('error', 'Network error during registration');
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('routewise_transporter_token');
    setAuthToken(null);
    setCurrentTransporter(null);
    showToast('info', 'Signed out of transporter session');
  };

  // 1. Fetch Freight Listings
  const fetchAvailableListings = useCallback(async () => {
    setListingsLoading(true);
    try {
      const params = new URLSearchParams({
        page: listingsPage.toString(),
        limit: '9',
        status: 'OPEN',
      });
      if (search.trim()) params.append('search', search.trim());
      if (originFilter.trim()) params.append('origin', originFilter.trim());
      if (destFilter.trim()) params.append('destination', destFilter.trim());
      if (cargoFilter !== 'ALL') params.append('cargo', cargoFilter);
      if (vehicleFilter !== 'ALL') params.append('vehicleType', vehicleFilter);
      if (minWeight.trim()) params.append('minWeight', minWeight.trim());
      if (maxWeight.trim()) params.append('maxWeight', maxWeight.trim());
      if (pickupDateFilter.trim()) params.append('pickupDate', pickupDateFilter.trim());

      const res = await fetch(`/api/listings?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setListings(data.data || []);
        setListingsPagination(data.pagination || { page: 1, limit: 9, totalPages: 1, totalCount: 0 });
      } else {
        showToast('error', 'Could not load available freight listings');
      }
    } catch {
      showToast('error', 'Network error fetching freight listings');
    } finally {
      setListingsLoading(false);
    }
  }, [listingsPage, search, originFilter, destFilter, cargoFilter, vehicleFilter, minWeight, maxWeight, pickupDateFilter]);

  // 2. Fetch My Vehicles
  const fetchMyVehicles = useCallback(async () => {
    if (!authToken) {
      setVehicles([]);
      return;
    }
    setVehiclesLoading(true);
    try {
      const params = new URLSearchParams();
      if (vehicleStatusFilter !== 'ALL') {
        params.append('status', vehicleStatusFilter);
      }
      const res = await fetch(`/api/vehicles/my-availability?${params.toString()}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setVehicles(data.data || []);
      }
    } catch {
      showToast('error', 'Failed to retrieve vehicle availability');
    } finally {
      setVehiclesLoading(false);
    }
  }, [authToken, vehicleStatusFilter]);

  // 3. Fetch My Requests
  const fetchMyRequests = useCallback(async () => {
    if (!authToken) {
      setRequests([]);
      return;
    }
    setRequestsLoading(true);
    try {
      const params = new URLSearchParams();
      if (requestStatusFilter !== 'ALL') {
        params.append('status', requestStatusFilter);
      }
      const res = await fetch(`/api/interests/my-requests?${params.toString()}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setRequests(data.data || []);
      }
    } catch {
      showToast('error', 'Failed to retrieve your load requests');
    } finally {
      setRequestsLoading(false);
    }
  }, [authToken, requestStatusFilter]);

  // 4. Fetch My Bookings (Phase 5)
  const fetchBookings = useCallback(async () => {
    if (!authToken) {
      setBookings([]);
      return;
    }
    setBookingsLoading(true);
    try {
      const res = await fetch('/api/bookings/my-bookings', {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setBookings(data.data || []);
      }
    } catch {
      showToast('error', 'Failed to retrieve your confirmed bookings');
    } finally {
      setBookingsLoading(false);
    }
  }, [authToken]);

  // Lifecycle Action Handlers
  const handleRecordPickup = async (bookingId, notes) => {
    setIsUpdatingBooking(true);
    try {
      const res = await fetch(`/api/bookings/${bookingId}/pickup`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ notes }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast('success', 'Pickup recorded! Load is now In Transit.');
        setActiveBookingModal(null);
        fetchBookings();
        fetchMyVehicles();
      } else {
        showToast('error', data.message || 'Failed to record pickup.');
      }
    } catch {
      showToast('error', 'Network error recording pickup.');
    } finally {
      setIsUpdatingBooking(false);
    }
  };

  const handleUpdateTransit = async (bookingId, location, notes) => {
    setIsUpdatingBooking(true);
    try {
      const res = await fetch(`/api/bookings/${bookingId}/transit`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ location, notes }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast('success', 'Live transit checkpoint updated!');
        setActiveBookingModal(null);
        fetchBookings();
      } else {
        showToast('error', data.message || 'Failed to update transit.');
      }
    } catch {
      showToast('error', 'Network error updating transit.');
    } finally {
      setIsUpdatingBooking(false);
    }
  };

  const handleReportDelivery = async (bookingId, recipientName, deliveryNotes, proofNotes, file = null) => {
    setIsUpdatingBooking(true);
    try {
      let res;
      if (file) {
        const formData = new FormData();
        formData.append('documents', file);
        formData.append('recipientName', recipientName);
        if (deliveryNotes) formData.append('deliveryNotes', deliveryNotes);
        if (proofNotes) formData.append('recipientContact', proofNotes);
        res = await fetch(`/api/bookings/${bookingId}/delivery-proof`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${authToken}` },
          body: formData,
        });
      } else {
        res = await fetch(`/api/bookings/${bookingId}/delivery`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({ recipientName, deliveryNotes, proofNotes }),
        });
      }
      const data = await res.json();
      if (res.ok) {
        showToast('success', file ? 'Delivery receipt submitted successfully!' : 'Delivery reported! Waiting for goods owner confirmation.');
        setActiveBookingModal(null);
        setModalDeliveryFile(null);
        fetchBookings();
      } else {
        showToast('error', data.message || 'Failed to report delivery.');
      }
    } catch {
      showToast('error', 'Network error reporting delivery.');
    } finally {
      setIsUpdatingBooking(false);
    }
  };

  // Trigger loads on tab switch
  useEffect(() => {
    if (activeTab === 'marketplace') {
      fetchAvailableListings();
    } else if (activeTab === 'my-vehicles') {
      fetchMyVehicles();
    } else if (activeTab === 'my-requests') {
      fetchMyRequests();
    } else if (activeTab === 'my-bookings') {
      fetchBookings();
    }
  }, [activeTab, fetchAvailableListings, fetchMyVehicles, fetchMyRequests, fetchBookings]);

  // Notifications unread count polling
  const fetchUnreadCount = useCallback(async () => {
    if (!authToken) {
      setUnreadNotifCount(0);
      return;
    }
    try {
      const res = await fetch('/api/notifications/unread-count', {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUnreadNotifCount(data.unreadCount || 0);
      }
    } catch {
      // silent
    }
  }, [authToken]);

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 25000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  // Open Express Interest Modal
  const openExpressInterest = (listing) => {
    if (!authToken) {
      setIsAuthModalOpen(true);
      showToast('info', 'Please sign in to send price offers.');
      return;
    }
    setSelectedListing(listing);
    setProposalRate(listing.offeredPrice ? String(listing.offeredPrice) : '');
    setProposalVehicle(listing.vehicleRequirements?.[0] || '10-Ton Medium Commercial Truck');
    setProposalVehicleId('');
    setProposalAvailableDate(new Date().toISOString().split('T')[0]);
    setProposalMessage(`Experienced driver available with clean vehicle. Ready to transport goods from ${listing.origin} to ${listing.destination}.`);
    setIsInterestModalOpen(true);
  };

  // Submit Interest / Bid
  const handleSubmitInterest = async (e) => {
    e.preventDefault();
    if (!selectedListing) return;

    const numRate = Number(proposalRate);
    if (isNaN(numRate) || numRate < 100) {
      showToast('error', 'Please enter a valid price offer (minimum ₹100).');
      return;
    }

    setIsSubmittingProposal(true);
    try {
      const res = await fetch('/api/interests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          listingId: selectedListing.id,
          proposedRate: numRate,
          proposedVehicle: proposalVehicle,
          vehicleAvailabilityId: proposalVehicleId || undefined,
          availableFromDate: proposalAvailableDate || null,
          message: proposalMessage,
        }),
      });

      const data = await res.json();
      if (res.status === 201) {
        showToast('success', `Price offer sent! Offered ₹${numRate.toLocaleString('en-IN')}`);
        setIsInterestModalOpen(false);
        // Switch to requests tab to see it
        setActiveTab('my-requests');
      } else if (res.status === 409) {
        showToast('error', 'You have already sent an active price offer for this load.');
      } else {
        showToast('error', data.message || 'Failed to submit price offer.');
      }
    } catch {
      showToast('error', 'Network error while submitting price offer.');
    } finally {
      setIsSubmittingProposal(false);
    }
  };

  // Withdraw Request
  const handleWithdrawRequest = async (requestId) => {
    if (!confirm('Are you sure you want to withdraw this price offer?')) {
      return;
    }

    setWithdrawingRequestId(requestId);
    try {
      const res = await fetch(`/api/interests/${requestId}/withdraw`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await res.json();
      if (res.ok) {
        showToast('success', 'Price offer withdrawn successfully.');
        fetchMyRequests();
      } else {
        showToast('error', data.message || 'Failed to withdraw price offer.');
      }
    } catch {
      showToast('error', 'Network error during withdrawal.');
    } finally {
      setWithdrawingRequestId(null);
    }
  };

  // Open Create / Edit Vehicle Modal
  const openVehicleModal = (veh = null) => {
    if (!authToken) {
      setIsAuthModalOpen(true);
      showToast('info', 'Please sign in to register vehicle availability.');
      return;
    }

    if (veh) {
      setIsEditingVehicle(true);
      setEditingVehicleId(veh.id);
      setVehType(veh.vehicleType);
      setVehCapacity(String(veh.capacity));
      setVehCapacityUnit(veh.capacityUnit || 'Tons');
      setVehCurrentLoc(veh.currentLocation);
      setVehDestination(veh.destination);
      setVehCorridor(veh.operatingCorridor || '');
      setVehAvailDate(veh.availabilityDate ? veh.availabilityDate.split('T')[0] : '');
      setVehIsReturnTrip(Boolean(veh.isReturnTrip));
      setVehRateExpectation(veh.rateExpectation ? String(veh.rateExpectation) : '');
      setVehNotes(veh.notes || '');
    } else {
      setIsEditingVehicle(false);
      setEditingVehicleId(null);
      setVehType(VEHICLE_OPTIONS[0]);
      setVehCapacity('3.5');
      setVehCapacityUnit('Tons');
      setVehCurrentLoc('Gorakhpur Transport Nagar, UP');
      setVehDestination('Lucknow Transport Nagar, UP');
      setVehCorridor('Gorakhpur to Lucknow (NH27 Corridor)');
      setVehAvailDate(new Date(Date.now() + 86400000).toISOString().split('T')[0]);
      setVehIsReturnTrip(true);
      setVehRateExpectation('8500');
      setVehNotes('Returning empty. Available for immediate backhaul load.');
    }
    setIsVehicleModalOpen(true);
  };

  // Save Vehicle Availability (Create or Update)
  const handleSaveVehicle = async (e) => {
    e.preventDefault();
    const numCap = Number(vehCapacity);
    if (isNaN(numCap) || numCap <= 0) {
      showToast('error', 'Please enter a valid capacity.');
      return;
    }
    if (!vehCurrentLoc.trim() || !vehDestination.trim()) {
      showToast('error', 'Both current location and destination are required.');
      return;
    }
    if (vehCurrentLoc.trim().toLowerCase() === vehDestination.trim().toLowerCase()) {
      showToast('error', 'Destination must differ from current location.');
      return;
    }

    setIsSavingVehicle(true);
    try {
      const payload = {
        vehicleType: vehType,
        capacity: numCap,
        capacityUnit: vehCapacityUnit,
        currentLocation: vehCurrentLoc.trim(),
        destination: vehDestination.trim(),
        operatingCorridor: vehCorridor.trim(),
        availabilityDate: vehAvailDate || new Date().toISOString(),
        isReturnTrip: vehIsReturnTrip,
        rateExpectation: vehRateExpectation ? Number(vehRateExpectation) : null,
        notes: vehNotes.trim(),
      };

      const url = isEditingVehicle ? `/api/vehicles/${editingVehicleId}` : '/api/vehicles';
      const method = isEditingVehicle ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) {
        showToast('success', isEditingVehicle ? 'Vehicle details updated!' : 'Vehicle availability published!');
        setIsVehicleModalOpen(false);
        fetchMyVehicles();
      } else {
        showToast('error', data.message || 'Failed to save vehicle availability.');
      }
    } catch {
      showToast('error', 'Network error saving vehicle.');
    } finally {
      setIsSavingVehicle(false);
    }
  };

  // Change Vehicle Status
  const handleUpdateVehicleStatus = async (vehId, newStatus) => {
    try {
      const res = await fetch(`/api/vehicles/${vehId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        showToast('success', `Status updated to ${newStatus}`);
        fetchMyVehicles();
      } else {
        const data = await res.json();
        showToast('error', data.message || 'Status update failed');
      }
    } catch {
      showToast('error', 'Network error modifying status');
    }
  };

  // Delete Vehicle
  const handleDeleteVehicle = async (vehId) => {
    if (!confirm('Are you sure you want to remove this vehicle availability listing?')) return;
    try {
      const res = await fetch(`/api/vehicles/${vehId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.ok) {
        showToast('success', 'Vehicle record deleted.');
        fetchMyVehicles();
      } else {
        const data = await res.json();
        showToast('error', data.message || 'Failed to delete vehicle');
      }
    } catch {
      showToast('error', 'Network error during deletion');
    }
  };

  // Clear Marketplace Filters
  const clearMarketplaceFilters = () => {
    setSearch('');
    setOriginFilter('');
    setDestFilter('');
    setCargoFilter('ALL');
    setVehicleFilter('ALL');
    setMinWeight('');
    setMaxWeight('');
    setPickupDateFilter('');
    setListingsPage(1);
  };

  return (
    <div className="min-h-[100dvh] w-full overflow-x-hidden bg-[#091827] text-slate-100 flex flex-col font-sans">
      {/* Toast Notification */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed bottom-6 right-6 z-50 flex items-center space-x-3 px-5 py-3 rounded-xl shadow-2xl backdrop-blur-md border animate-slideUp ${
            toast.type === 'success'
              ? 'bg-emerald-950/90 text-emerald-200 border-emerald-500/40'
              : toast.type === 'error'
              ? 'bg-rose-950/90 text-rose-200 border-rose-500/40'
              : 'bg-[#0F2A44]/90 text-slate-200 border-[#1E3D60]'
          }`}
        >
          {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />}
          {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />}
          {toast.type === 'info' && <Info className="w-5 h-5 text-sky-400 shrink-0" />}
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}

      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-[#091827]/95 backdrop-blur-md border-b border-[#1E3D60]/70 shadow-lg shadow-black/30">
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 w-full h-18 flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <Link to="/" className="flex items-center group focus:outline-none">
              <Logo />
            </Link>
            <div className="hidden md:flex items-center space-x-2 pl-4 border-l border-[#1E3D60]">
              <span className="text-xs font-bold tracking-wider uppercase bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30 px-2.5 py-0.5 rounded-full">
                Live
              </span>
              <span className="text-sm font-semibold text-slate-300">
                Transport Partner Portal
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Link
              to="/listings"
              className="hidden sm:inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-[#11253B] hover:bg-[#152E4A] border border-[#1E3D60] rounded-lg transition-colors"
            >
              <Package className="w-3.5 h-3.5 text-amber-400" />
              <span>Goods Owner Portal</span>
            </Link>

            {authToken && (
              <button
                type="button"
                onClick={() => setIsNotificationDrawerOpen(true)}
                className="relative p-2 text-slate-300 hover:text-white hover:bg-[#152E4A] border border-[#1E3D60] rounded-xl transition-colors"
                title="Notifications"
                aria-label="View notifications"
              >
                <Bell className="w-4 h-4 text-amber-400" />
                {unreadNotifCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-slate-950 shadow">
                    {unreadNotifCount > 99 ? '99+' : unreadNotifCount}
                  </span>
                )}
              </button>
            )}

            {currentTransporter ? (
              <div className="flex items-center space-x-2">
                <div className="hidden lg:flex flex-col text-right">
                  <span className="text-xs font-bold text-white leading-tight">
                    {currentTransporter.businessName}
                  </span>
                  <span className="text-[11px] text-[#F59E0B]">
                    {currentTransporter.name} (Transport Partner)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="p-2 text-slate-400 hover:text-rose-400 hover:bg-[#152E4A] border border-[#1E3D60] rounded-lg transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => loginDemoTransporter(1)}
                  className="px-3 py-1.5 text-xs font-bold bg-[#F59E0B] hover:bg-[#D97706] text-[#091827] rounded-lg shadow-sm transition-all"
                >
                  Demo Transport Partner 1
                </button>
                <button
                  type="button"
                  onClick={() => setIsAuthModalOpen(true)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-200 hover:text-white bg-[#11253B] hover:bg-[#152E4A] border border-[#1E3D60] rounded-lg transition-all"
                >
                  Sign In
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Hero Banner with Quick Stats & Tabs */}
      <section className="bg-gradient-to-b from-[#0F2A44] to-[#091827] border-b border-[#1E3D60] py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1920px] mx-auto w-full">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#11253B] border border-[#1E3D60] text-amber-400 text-xs font-semibold mb-2">
                <Truck className="w-3.5 h-3.5" />
                <span>Find Return Loads & Fill Vehicles</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Transport Partner Home
              </h1>
              <p className="text-sm text-slate-300 mt-1 max-w-2xl">
                Browse available loads from goods owners, send your price offers, avoid empty return trips, and list your available vehicles.
              </p>
            </div>

            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={() => openVehicleModal()}
                className="inline-flex items-center space-x-2 px-4 py-2.5 bg-[#F59E0B] hover:bg-[#D97706] text-[#091827] font-bold text-sm rounded-xl shadow-lg shadow-amber-500/10 hover:shadow-amber-500/20 transition-all"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>List Available Vehicle</span>
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="mt-8 flex items-center border-b border-[#1E3D60] space-x-2 overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveTab('marketplace')}
              className={`pb-3 px-4 text-sm font-bold flex items-center space-x-2 border-b-2 transition-all whitespace-nowrap ${
                activeTab === 'marketplace'
                  ? 'border-[#F59E0B] text-[#F59E0B]'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>Available Loads</span>
              <span className="ml-1.5 px-2 py-0.5 text-[11px] font-bold rounded-full bg-[#11253B] text-slate-300 border border-[#1E3D60]">
                {listingsPagination.totalCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (!authToken) {
                  setIsAuthModalOpen(true);
                  showToast('info', 'Please sign in to view your vehicles.');
                  return;
                }
                setActiveTab('my-vehicles');
              }}
              className={`pb-3 px-4 text-sm font-bold flex items-center space-x-2 border-b-2 transition-all whitespace-nowrap ${
                activeTab === 'my-vehicles'
                  ? 'border-[#F59E0B] text-[#F59E0B]'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Truck className="w-4 h-4" />
              <span>My Available Vehicles</span>
              {authToken && (
                <span className="ml-1.5 px-2 py-0.5 text-[11px] font-bold rounded-full bg-[#11253B] text-slate-300 border border-[#1E3D60]">
                  {vehicles.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                if (!authToken) {
                  setIsAuthModalOpen(true);
                  showToast('info', 'Please sign in to view your price offers.');
                  return;
                }
                setActiveTab('my-requests');
              }}
              className={`pb-3 px-4 text-sm font-bold flex items-center space-x-2 border-b-2 transition-all whitespace-nowrap ${
                activeTab === 'my-requests'
                  ? 'border-[#F59E0B] text-[#F59E0B]'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Send className="w-4 h-4" />
              <span>My Price Offers</span>
              {authToken && (
                <span className="ml-1.5 px-2 py-0.5 text-[11px] font-bold rounded-full bg-[#11253B] text-slate-300 border border-[#1E3D60]">
                  {requests.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                if (!authToken) {
                  setIsAuthModalOpen(true);
                  showToast('info', 'Please sign in to view your bookings.');
                  return;
                }
                setActiveTab('my-bookings');
                fetchBookings();
              }}
              className={`pb-3 px-4 text-sm font-bold flex items-center space-x-2 border-b-2 transition-all whitespace-nowrap ${
                activeTab === 'my-bookings'
                  ? 'border-[#F59E0B] text-[#F59E0B]'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>My Bookings</span>
              {authToken && bookings.length > 0 && (
                <span className="ml-1.5 px-2 py-0.5 text-[11px] font-bold rounded-full bg-amber-500/20 text-[#F59E0B] border border-amber-500/30">
                  {bookings.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                if (!authToken) {
                  setIsAuthModalOpen(true);
                  showToast('info', 'Please sign in to view partner verification.');
                  return;
                }
                setActiveTab('verification');
              }}
              className={`pb-3 px-4 text-sm font-bold flex items-center space-x-2 border-b-2 transition-all whitespace-nowrap ${
                activeTab === 'verification'
                  ? 'border-[#F59E0B] text-[#F59E0B]'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Partner Verification</span>
              {currentTransporter?.verificationStatus === 'APPROVED' ? (
                <span className="ml-1.5 px-2 py-0.5 text-[10px] font-extrabold rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Verified ✓
                </span>
              ) : currentTransporter?.verificationStatus === 'PENDING' ? (
                <span className="ml-1.5 px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  Waiting for Review
                </span>
              ) : null}
            </button>
          </div>
        </div>
      </section>

      {/* Main Tab Content */}
      <main className="flex-1 max-w-[1920px] mx-auto w-full px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 py-8">
        {/* TAB 1: Available Freight Listings Feed */}
        {activeTab === 'marketplace' && (
          <div className="space-y-6">
            {/* Search & Multi-Filters Panel */}
            <div className="bg-[#0F2A44] border border-[#1E3D60] rounded-2xl p-5 shadow-xl">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Text Search */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Search Load / Corridor
                  </label>
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Origin, goods, company..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-[#091827] border border-[#1E3D60] rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#F59E0B]"
                    />
                  </div>
                </div>

                {/* Origin Filter */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Origin Corridor
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Gorakhpur"
                    value={originFilter}
                    onChange={(e) => setOriginFilter(e.target.value)}
                    className="w-full px-3 py-2 bg-[#091827] border border-[#1E3D60] rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#F59E0B]"
                  />
                </div>

                {/* Destination Filter */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Destination Corridor
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Lucknow"
                    value={destFilter}
                    onChange={(e) => setDestFilter(e.target.value)}
                    className="w-full px-3 py-2 bg-[#091827] border border-[#1E3D60] rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#F59E0B]"
                  />
                </div>

                {/* Cargo Category Dropdown */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Cargo Category
                  </label>
                  <select
                    value={cargoFilter}
                    onChange={(e) => setCargoFilter(e.target.value)}
                    className="w-full px-3 py-2 bg-[#091827] border border-[#1E3D60] rounded-xl text-sm text-white focus:outline-none focus:border-[#F59E0B]"
                  >
                    <option value="ALL">All Cargo Types</option>
                    {CARGO_OPTIONS.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Vehicle Requirements Filter */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Required Vehicle
                  </label>
                  <select
                    value={vehicleFilter}
                    onChange={(e) => setVehicleFilter(e.target.value)}
                    className="w-full px-3 py-2 bg-[#091827] border border-[#1E3D60] rounded-xl text-sm text-white focus:outline-none focus:border-[#F59E0B]"
                  >
                    <option value="ALL">All Vehicle Requirements</option>
                    {VEHICLE_OPTIONS.map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Weight Min/Max */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Min Tons
                    </label>
                    <input
                      type="number"
                      placeholder="0"
                      value={minWeight}
                      onChange={(e) => setMinWeight(e.target.value)}
                      className="w-full px-2.5 py-2 bg-[#091827] border border-[#1E3D60] rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#F59E0B]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Max Tons
                    </label>
                    <input
                      type="number"
                      placeholder="50"
                      value={maxWeight}
                      onChange={(e) => setMaxWeight(e.target.value)}
                      className="w-full px-2.5 py-2 bg-[#091827] border border-[#1E3D60] rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#F59E0B]"
                    />
                  </div>
                </div>

                {/* Pickup Date Filter */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Pickup Date (From)
                  </label>
                  <input
                    type="date"
                    value={pickupDateFilter}
                    onChange={(e) => setPickupDateFilter(e.target.value)}
                    className="w-full px-3 py-2 bg-[#091827] border border-[#1E3D60] rounded-xl text-sm text-white focus:outline-none focus:border-[#F59E0B]"
                  />
                </div>

                {/* Clear / Reset Filter Button */}
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={clearMarketplaceFilters}
                    className="w-full py-2 px-3 bg-[#11253B] hover:bg-[#152E4A] border border-[#1E3D60] text-slate-300 hover:text-white rounded-xl text-sm font-semibold flex items-center justify-center space-x-1.5 transition-colors"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Reset Filters</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Listings Grid */}
            {listingsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <div
                    key={n}
                    className="bg-[#0F2A44] border border-[#1E3D60] rounded-2xl p-6 animate-pulse space-y-4"
                  >
                    <div className="h-5 bg-[#152E4A] rounded-md w-3/4"></div>
                    <div className="h-4 bg-[#152E4A] rounded-md w-1/2"></div>
                    <div className="h-10 bg-[#152E4A] rounded-xl w-full"></div>
                  </div>
                ))}
              </div>
            ) : listings.length === 0 ? (
              <div className="bg-[#0F2A44] border border-[#1E3D60] rounded-2xl p-12 text-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-[#11253B] border border-[#1E3D60] flex items-center justify-center mx-auto text-amber-400">
                  <Package className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-white">No Matching Freight Loads Found</h3>
                <p className="text-sm text-slate-400 max-w-md mx-auto">
                  Try adjusting your origin, destination, or vehicle filters, or reset all filters to view all active open shipments.
                </p>
                <button
                  type="button"
                  onClick={clearMarketplaceFilters}
                  className="px-4 py-2 bg-[#F59E0B] text-[#091827] font-bold text-xs rounded-xl"
                >
                  Clear All Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
                {listings.map((item) => (
                  <div
                    key={item.id}
                    className="bg-[#0F2A44] border border-[#1E3D60] hover:border-[#F59E0B]/50 rounded-2xl p-6 shadow-xl flex flex-col justify-between transition-all duration-200 group"
                  >
                    <div className="space-y-4">
                      {/* Header Badge */}
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center space-x-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                          <span>Open Demand</span>
                        </span>
                        <span className="text-xs text-slate-400">
                          {item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-IN') : ''}
                        </span>
                      </div>

                      {/* Route */}
                      <div>
                        <div className="flex items-start space-x-2">
                          <MapPin className="w-4 h-4 text-[#F59E0B] shrink-0 mt-1" />
                          <div>
                            <div className="font-bold text-white text-base leading-snug">
                              {item.origin}
                            </div>
                            <div className="text-slate-400 text-xs my-0.5">to</div>
                            <div className="font-bold text-white text-base leading-snug">
                              {item.destination}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Cargo & Weight */}
                      <div className="bg-[#091827] rounded-xl p-3 border border-[#1E3D60] space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-400">Cargo Category:</span>
                          <span className="font-semibold text-slate-200">{item.cargoCategory}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-400">Load Weight:</span>
                          <span className="font-bold text-amber-300">{item.weightDisplay}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-400">Pickup Date:</span>
                          <span className="font-medium text-slate-200">
                            {item.pickupDate ? new Date(item.pickupDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Flexible'}
                          </span>
                        </div>
                      </div>

                      {/* Offered Rate */}
                      <div className="flex items-center justify-between pt-1 border-t border-[#1E3D60]">
                        <div>
                          <span className="text-[11px] text-slate-400 uppercase tracking-wider block">
                            Offered Rate
                          </span>
                          <span className="text-xl font-extrabold text-[#F59E0B]">
                            {item.offeredPriceFormatted}
                          </span>
                        </div>
                        <span className="text-[11px] px-2 py-0.5 rounded bg-[#11253B] text-slate-300 border border-[#1E3D60]">
                          {item.priceType}
                        </span>
                      </div>

                      {/* Vehicle Requirements */}
                      {item.vehicleRequirements && item.vehicleRequirements.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {item.vehicleRequirements.map((v) => (
                            <span
                              key={v}
                              className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-[#11253B] text-slate-300 border border-[#1E3D60]"
                            >
                              {v}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-5 mt-4 border-t border-[#1E3D60] flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedListing(item);
                          setIsDetailModalOpen(true);
                        }}
                        className="flex-1 py-2 px-3 bg-[#11253B] hover:bg-[#152E4A] border border-[#1E3D60] text-slate-200 hover:text-white rounded-xl text-xs font-bold transition-colors"
                      >
                        Load Details
                      </button>
                      <button
                        type="button"
                        onClick={() => openExpressInterest(item)}
                        className="flex-1 py-2 px-3 bg-[#F59E0B] hover:bg-[#D97706] text-[#091827] rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 shadow-sm transition-all"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Offer Price</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination Controls */}
            {listingsPagination.totalPages > 1 && (
              <div className="flex items-center justify-between pt-6 border-t border-[#1E3D60]">
                <span className="text-xs text-slate-400">
                  Showing page {listingsPagination.page} of {listingsPagination.totalPages} ({listingsPagination.totalCount} available loads)
                </span>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    disabled={!listingsPagination.hasPrevPage}
                    onClick={() => setListingsPage((p) => Math.max(1, p - 1))}
                    className="p-2 rounded-lg bg-[#11253B] border border-[#1E3D60] text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#152E4A]"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-semibold px-3 py-1 bg-[#091827] border border-[#1E3D60] rounded-lg">
                    {listingsPagination.page}
                  </span>
                  <button
                    type="button"
                    disabled={!listingsPagination.hasNextPage}
                    onClick={() => setListingsPage((p) => p + 1)}
                    className="p-2 rounded-lg bg-[#11253B] border border-[#1E3D60] text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#152E4A]"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: My Vehicle Availability */}
        {activeTab === 'my-vehicles' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0F2A44] border border-[#1E3D60] rounded-2xl p-5">
              <div>
                <h2 className="text-lg font-bold text-white">My Available Vehicles</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  List your available vehicles and return trips so goods owners can reach out to you.
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <select
                  value={vehicleStatusFilter}
                  onChange={(e) => setVehicleStatusFilter(e.target.value)}
                  className="px-3 py-2 bg-[#091827] border border-[#1E3D60] rounded-xl text-xs text-white focus:outline-none focus:border-[#F59E0B]"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="AVAILABLE">Available</option>
                  <option value="MATCHED">Booked</option>
                  <option value="IN_TRANSIT">On the Way</option>
                  <option value="COMPLETED">Trip Finished</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
                <button
                  type="button"
                  onClick={() => openVehicleModal()}
                  className="inline-flex items-center space-x-1.5 px-4 py-2 bg-[#F59E0B] hover:bg-[#D97706] text-[#091827] font-bold text-xs rounded-xl shadow transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>List Vehicle</span>
                </button>
              </div>
            </div>

            {vehiclesLoading ? (
              <div className="text-center py-12 text-slate-400">Loading your vehicle records...</div>
            ) : vehicles.length === 0 ? (
              <div className="bg-[#0F2A44] border border-[#1E3D60] rounded-2xl p-12 text-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-[#11253B] border border-[#1E3D60] flex items-center justify-center mx-auto text-amber-400">
                  <Truck className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-white">No Available Vehicles Listed</h3>
                <p className="text-sm text-slate-400 max-w-md mx-auto">
                  You haven&apos;t listed any available vehicles yet. Add your vehicle or return trip to start receiving load requests.
                </p>
                <button
                  type="button"
                  onClick={() => openVehicleModal()}
                  className="px-4 py-2.5 bg-[#F59E0B] text-[#091827] font-bold text-xs rounded-xl"
                >
                  List Your First Vehicle
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
                {vehicles.map((veh) => {
                  const statusInfo = VEHICLE_STATUS_CONFIG[veh.status] || VEHICLE_STATUS_CONFIG.AVAILABLE;
                  const vehCat = VEHICLE_CATEGORIES.find((c) => c.name === veh.vehicleType) || { id: 'mcv' };
                  return (
                    <div
                      key={veh.id}
                      className="bg-[#0F2A44] border border-[#1E3D60] rounded-2xl p-6 shadow-xl flex flex-col justify-between space-y-4"
                    >
                      <div className="space-y-3">
                        {/* Status & Return Trip Badge */}
                        <div className="flex items-center justify-between">
                          <span
                            className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border flex items-center space-x-1.5 ${statusInfo.badge}`}
                          >
                            <span className={`w-2 h-2 rounded-full ${statusInfo.dot}`}></span>
                            <span>{statusInfo.label}</span>
                          </span>
                          {veh.isReturnTrip && (
                            <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-md flex items-center space-x-1">
                              <ArrowLeftRight className="w-3 h-3" />
                              <span>Return Trip</span>
                            </span>
                          )}
                        </div>

                        {/* Vehicle Title & Silhouette */}
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 rounded-xl bg-[#091827] border border-[#1E3D60] p-1.5 flex items-center justify-center text-amber-400 shrink-0">
                            <VehicleSvgIcon type={vehCat.id} className="w-9 h-7 text-amber-400" />
                          </div>
                          <div>
                            <div className="text-base font-extrabold text-white leading-tight">
                              {veh.vehicleType}
                            </div>
                            <div className="text-xs text-amber-400 font-semibold">
                              Capacity: {veh.capacityDisplay}
                            </div>
                          </div>
                        </div>

                        {/* Route Corridor */}
                        <div className="bg-[#091827] rounded-xl p-3 border border-[#1E3D60] space-y-1.5">
                          <div className="text-xs text-slate-400">Route:</div>
                          <div className="text-sm font-bold text-white flex items-center space-x-1.5">
                            <span>{veh.currentLocation}</span>
                            <ArrowRight className="w-3.5 h-3.5 text-[#F59E0B] shrink-0" />
                            <span>{veh.destination}</span>
                          </div>
                          {veh.operatingCorridor && (
                            <div className="text-[11px] text-slate-400 mt-1">
                              Route Details: {veh.operatingCorridor}
                            </div>
                          )}
                        </div>

                        {/* Dates & Rate */}
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="bg-[#11253B] p-2.5 rounded-lg border border-[#1E3D60]">
                            <span className="text-slate-400 block text-[10px] uppercase">Available Date</span>
                            <span className="font-semibold text-slate-200">
                              {veh.availabilityDate ? new Date(veh.availabilityDate).toLocaleDateString('en-IN') : 'Immediate'}
                            </span>
                          </div>
                          <div className="bg-[#11253B] p-2.5 rounded-lg border border-[#1E3D60]">
                            <span className="text-slate-400 block text-[10px] uppercase">Expected Price</span>
                            <span className="font-semibold text-amber-300">
                              {veh.rateExpectationFormatted || 'Negotiable'}
                            </span>
                          </div>
                        </div>

                        {veh.notes && (
                          <p className="text-xs text-slate-400 italic bg-[#091827]/60 p-2 rounded-lg border border-[#1E3D60]/50">
                            &ldquo;{veh.notes}&rdquo;
                          </p>
                        )}
                      </div>

                      {/* Footer Actions */}
                      <div className="pt-4 border-t border-[#1E3D60] flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <button
                            type="button"
                            onClick={() => openVehicleModal(veh)}
                            className="p-2 text-slate-300 hover:text-white bg-[#11253B] hover:bg-[#152E4A] border border-[#1E3D60] rounded-lg transition-colors"
                            title="Edit Vehicle"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteVehicle(veh.id)}
                            className="p-2 text-rose-400 hover:text-rose-300 bg-[#11253B] hover:bg-rose-950/40 border border-[#1E3D60] rounded-lg transition-colors"
                            title="Delete Vehicle"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Quick Status Selector */}
                        <select
                          value={veh.status}
                          onChange={(e) => handleUpdateVehicleStatus(veh.id, e.target.value)}
                          className="px-2 py-1 bg-[#091827] border border-[#1E3D60] text-xs font-semibold text-slate-200 rounded-lg focus:outline-none focus:border-[#F59E0B]"
                        >
                          <option value="AVAILABLE">Available</option>
                          <option value="MATCHED">Booked</option>
                          <option value="IN_TRANSIT">On the Way</option>
                          <option value="COMPLETED">Trip Finished</option>
                          <option value="CANCELLED">Cancelled</option>
                        </select>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: My Load Requests */}
        {activeTab === 'my-requests' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0F2A44] border border-[#1E3D60] rounded-2xl p-5">
              <div>
                <h2 className="text-lg font-bold text-white">My Price Offers</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Track price offers you sent to goods owners. Once an offer is accepted, contact details are unlocked.
                </p>
              </div>
              <div>
                <select
                  value={requestStatusFilter}
                  onChange={(e) => setRequestStatusFilter(e.target.value)}
                  className="px-3 py-2 bg-[#091827] border border-[#1E3D60] rounded-xl text-xs text-white focus:outline-none focus:border-[#F59E0B]"
                >
                  <option value="ALL">All Offer Statuses</option>
                  <option value="PENDING">Waiting for Review</option>
                  <option value="ACCEPTED">Accepted by Goods Owner</option>
                  <option value="REJECTED">Declined</option>
                  <option value="WITHDRAWN">Withdrawn</option>
                </select>
              </div>
            </div>

            {requestsLoading ? (
              <div className="text-center py-12 text-slate-400">Loading your price offers...</div>
            ) : requests.length === 0 ? (
              <div className="bg-[#0F2A44] border border-[#1E3D60] rounded-2xl p-12 text-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-[#11253B] border border-[#1E3D60] flex items-center justify-center mx-auto text-amber-400">
                  <Send className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-white">No Price Offers Sent</h3>
                <p className="text-sm text-slate-400 max-w-md mx-auto">
                  Browse available loads and send your price offers to book shipments.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab('marketplace')}
                  className="px-4 py-2.5 bg-[#F59E0B] text-[#091827] font-bold text-xs rounded-xl"
                >
                  Find Available Loads
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {requests.map((req) => {
                  const statusInfo = INTEREST_STATUS_CONFIG[req.status] || INTEREST_STATUS_CONFIG.PENDING;
                  const listing = req.listing;
                  return (
                    <div
                      key={req.id}
                      className="bg-[#0F2A44] border border-[#1E3D60] rounded-2xl p-6 shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-6"
                    >
                      <div className="space-y-3 flex-1">
                        {/* Status Badge & Timestamp */}
                        <div className="flex items-center space-x-3">
                          <span
                            className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border flex items-center space-x-1.5 ${statusInfo.badge}`}
                          >
                            <span className={`w-2 h-2 rounded-full ${statusInfo.dot}`}></span>
                            <span>{statusInfo.label}</span>
                          </span>
                          <span className="text-xs text-slate-400">
                            Submitted {req.createdAt ? new Date(req.createdAt).toLocaleString('en-IN') : ''}
                          </span>
                        </div>

                        {/* Route & Cargo Header */}
                        {listing ? (
                          <div>
                            <div className="text-base font-extrabold text-white flex items-center space-x-2">
                              <span>{listing.route}</span>
                            </div>
                            <div className="text-xs text-slate-300 mt-1 flex flex-wrap items-center gap-3">
                              <span className="font-medium text-amber-300">
                                {listing.cargoCategory} ({listing.weightDisplay})
                              </span>
                              <span>•</span>
                              <span>Goods Owner: {listing.shipperBusinessName}</span>
                              {req.status === 'ACCEPTED' && (
                                <>
                                  <span>•</span>
                                  <span className="text-emerald-400 font-bold flex items-center space-x-1">
                                    <Phone className="w-3.5 h-3.5" />
                                    <span>{listing.shipperContactPhone}</span>
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="text-sm font-semibold text-slate-300">
                            Load reference (ID: {req.listingId})
                          </div>
                        )}

                        {/* Proposal Details Box */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-[#091827] rounded-xl p-3 border border-[#1E3D60] text-xs">
                          <div>
                            <span className="text-slate-400 block text-[10px] uppercase">My Price Offer</span>
                            <span className="text-base font-extrabold text-[#F59E0B]">
                              {req.proposedRateFormatted}
                            </span>
                            {listing && (
                              <span className="text-[10px] text-slate-400 block">
                                (Goods owner target: ₹{listing.offeredPrice?.toLocaleString('en-IN')})
                              </span>
                            )}
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px] uppercase">Offered Vehicle</span>
                            <span className="font-semibold text-slate-200">
                              {req.proposedVehicle || 'Standard Fleet'}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px] uppercase">Available Date</span>
                            <span className="font-semibold text-slate-200">
                              {req.availableFromDate ? new Date(req.availableFromDate).toLocaleDateString('en-IN') : 'Flexible'}
                            </span>
                          </div>
                        </div>

                        {/* Proposal Message */}
                        {req.message && (
                          <p className="text-xs text-slate-300 bg-[#11253B]/50 p-2.5 rounded-lg border border-[#1E3D60]/50">
                            <span className="font-semibold text-slate-400">Note: </span>
                            &ldquo;{req.message}&rdquo;
                          </p>
                        )}

                        {/* Goods Owner Review Notes if reviewed */}
                        {req.reviewNotes && (
                          <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-xl p-3 text-xs text-emerald-200">
                            <span className="font-bold block text-emerald-400 mb-0.5">Goods Owner Message:</span>
                            {req.reviewNotes}
                          </div>
                        )}
                      </div>

                      {/* Action */}
                      <div className="flex flex-col sm:flex-row lg:flex-col items-stretch lg:items-end justify-center gap-2 shrink-0">
                        {req.status === 'PENDING' && (
                          <button
                            type="button"
                            disabled={withdrawingRequestId === req.id}
                            onClick={() => handleWithdrawRequest(req.id)}
                            className="px-4 py-2 bg-[#11253B] hover:bg-rose-950/60 border border-[#1E3D60] hover:border-rose-500/50 text-slate-300 hover:text-rose-200 rounded-xl text-xs font-bold transition-all disabled:opacity-50 flex items-center justify-center space-x-1.5"
                          >
                            <Ban className="w-3.5 h-3.5" />
                            <span>{withdrawingRequestId === req.id ? 'Withdrawing...' : 'Withdraw Offer'}</span>
                          </button>
                        )}

                        {req.status === 'ACCEPTED' && (
                          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs text-center font-bold">
                            ✓ Offer Accepted • Booking Confirmed
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: Confirmed Bookings (Phase 5) */}
        {activeTab === 'my-bookings' && (
          <TransporterBookingsSection
            bookings={bookings}
            isLoading={bookingsLoading}
            onOpenPickup={(b) => {
              setActiveBookingModal({ type: 'pickup', booking: b });
              setModalInputNotes('');
            }}
            onOpenTransit={(b) => {
              setActiveBookingModal({ type: 'transit', booking: b });
              setModalInputLocation(b.transitLocation || '');
              setModalInputNotes(b.transitNotes || '');
            }}
            onOpenDelivery={(b) => {
              setActiveBookingModal({ type: 'delivery', booking: b });
              setModalInputRecipient(b.recipientName || '');
              setModalInputNotes(b.deliveryNotes || '');
              setModalInputProof(b.proofNotes || '');
            }}
            onRefresh={fetchBookings}
          />
        )}

        {/* TAB 5: Compliance & Verification (Phase 6) */}
        {activeTab === 'verification' && (
          <TransporterVerificationSection />
        )}
      </main>

      {/* MODAL 1: Load Details Modal */}
      {isDetailModalOpen && selectedListing && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-[#0F2A44] border border-[#1E3D60] rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative space-y-6 max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setIsDetailModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-[#152E4A]"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                Available Load
              </span>
              <h2 className="text-xl font-extrabold text-white mt-2">
                {selectedListing.route}
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Posted by {selectedListing.businessName} • Contact: {selectedListing.contactPhone}
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 bg-[#091827] p-4 rounded-xl border border-[#1E3D60] text-xs">
              <div>
                <span className="text-slate-400 block">Type of Goods</span>
                <span className="font-bold text-white text-sm">{selectedListing.cargoCategory}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Total Weight</span>
                <span className="font-bold text-amber-300 text-sm">{selectedListing.weightDisplay}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Target Price</span>
                <span className="font-bold text-[#F59E0B] text-base">{selectedListing.offeredPriceFormatted}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Pickup Date</span>
                <span className="font-semibold text-slate-200">
                  {selectedListing.pickupDate ? new Date(selectedListing.pickupDate).toLocaleDateString('en-IN') : 'Flexible'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Delivery Date</span>
                <span className="font-semibold text-slate-200">
                  {selectedListing.deliveryDate ? new Date(selectedListing.deliveryDate).toLocaleDateString('en-IN') : 'Standard'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Price Type</span>
                <span className="font-semibold text-slate-200">{selectedListing.priceType}</span>
              </div>
            </div>

            {selectedListing.cargoDescription && (
              <div>
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Description of Goods
                </h4>
                <p className="text-xs text-slate-300 bg-[#091827] p-3 rounded-xl border border-[#1E3D60]">
                  {selectedListing.cargoDescription}
                </p>
              </div>
            )}

            {selectedListing.vehicleRequirements && selectedListing.vehicleRequirements.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Preferred Vehicle
                </h4>
                <div className="flex flex-wrap gap-2">
                  {selectedListing.vehicleRequirements.map((v) => (
                    <span
                      key={v}
                      className="px-2.5 py-1 rounded-lg bg-[#11253B] text-slate-200 border border-[#1E3D60] text-xs font-medium"
                    >
                      {v}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {selectedListing.notes && (
              <div>
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Notes from Goods Owner
                </h4>
                <p className="text-xs text-slate-300 bg-[#091827] p-3 rounded-xl border border-[#1E3D60]">
                  {selectedListing.notes}
                </p>
              </div>
            )}

            <div className="pt-4 border-t border-[#1E3D60] flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => setIsDetailModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-[#11253B] border border-[#1E3D60] rounded-xl"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsDetailModalOpen(false);
                  openExpressInterest(selectedListing);
                }}
                className="px-5 py-2 text-xs font-bold bg-[#F59E0B] hover:bg-[#D97706] text-[#091827] rounded-xl shadow flex items-center space-x-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send Price Offer</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Express Interest / Submit Quote Modal */}
      {isInterestModalOpen && selectedListing && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-[#0F2A44] border border-[#1E3D60] rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative space-y-5">
            <button
              type="button"
              onClick={() => setIsInterestModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-[#152E4A]"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">
                Offer Your Price
              </span>
              <h2 className="text-xl font-extrabold text-white mt-1.5">
                Send Price Offer for This Load
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {selectedListing.route} • {selectedListing.cargoCategory} ({selectedListing.weightDisplay})
              </p>
            </div>

            <form onSubmit={handleSubmitInterest} className="space-y-4">
              {/* Proposed Rate */}
              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1">
                  Your Price Offer (₹) *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold text-sm">₹</span>
                  <input
                    type="number"
                    min="100"
                    max="5000000"
                    required
                    value={proposalRate}
                    onChange={(e) => setProposalRate(e.target.value)}
                    placeholder="e.g. 24000"
                    className="w-full pl-8 pr-3 py-2 bg-[#091827] border border-[#1E3D60] rounded-xl text-sm font-bold text-[#F59E0B] focus:outline-none focus:border-[#F59E0B]"
                  />
                </div>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Goods owner target: {selectedListing.offeredPriceFormatted}
                </span>
              </div>

              {/* Attach Registered Fleet Availability */}
              {vehicles.filter((v) => v.status === 'AVAILABLE').length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-slate-200 mb-1">
                    Select Available Vehicle (Optional)
                  </label>
                  <select
                    value={proposalVehicleId}
                    onChange={(e) => {
                      const vId = e.target.value;
                      setProposalVehicleId(vId);
                      const match = vehicles.find((v) => v.id === vId);
                      if (match) {
                        setProposalVehicle(`${match.capacity} ${match.capacityUnit} ${match.vehicleType}`);
                        if (match.availabilityDate) {
                          setProposalAvailableDate(match.availabilityDate.split('T')[0]);
                        }
                      }
                    }}
                    className="w-full px-3 py-2 bg-[#091827] border border-[#1E3D60] rounded-xl text-xs text-white focus:outline-none focus:border-[#F59E0B]"
                  >
                    <option value="">Custom vehicle details</option>
                    {vehicles
                      .filter((v) => v.status === 'AVAILABLE')
                      .map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.vehicleType} ({v.capacityDisplay}) • {v.currentLocation} → {v.destination}
                        </option>
                      ))}
                  </select>
                </div>
              )}

              {/* Proposed Vehicle */}
              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1">
                  Vehicle Details *
                </label>
                <input
                  type="text"
                  required
                  value={proposalVehicle}
                  onChange={(e) => setProposalVehicle(e.target.value)}
                  placeholder="e.g. 10-Ton Medium Commercial Truck (UP53-AB-1234)"
                  className="w-full px-3 py-2 bg-[#091827] border border-[#1E3D60] rounded-xl text-sm text-white focus:outline-none focus:border-[#F59E0B]"
                />
              </div>

              {/* Available From Date */}
              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1">
                  Pickup Date
                </label>
                <input
                  type="date"
                  value={proposalAvailableDate}
                  onChange={(e) => setProposalAvailableDate(e.target.value)}
                  className="w-full px-3 py-2 bg-[#091827] border border-[#1E3D60] rounded-xl text-sm text-white focus:outline-none focus:border-[#F59E0B]"
                />
              </div>

              {/* Transporter Notes / Pitch */}
              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1">
                  Message to Goods Owner
                </label>
                <textarea
                  rows="3"
                  value={proposalMessage}
                  onChange={(e) => setProposalMessage(e.target.value)}
                  placeholder="Driver contact, vehicle details, waterproof cover, etc."
                  className="w-full px-3 py-2 bg-[#091827] border border-[#1E3D60] rounded-xl text-xs text-white focus:outline-none focus:border-[#F59E0B]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsInterestModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-[#11253B] border border-[#1E3D60] rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingProposal}
                  className="px-5 py-2 text-xs font-bold bg-[#F59E0B] hover:bg-[#D97706] text-[#091827] rounded-xl shadow disabled:opacity-50 flex items-center space-x-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmittingProposal ? 'Sending...' : 'Send Price Offer'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Post / Edit Vehicle Availability Modal */}
      {isVehicleModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-[#0F2A44] border border-[#1E3D60] rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative space-y-5 max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setIsVehicleModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-[#152E4A]"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                Available Vehicle
              </span>
              <h2 className="text-xl font-extrabold text-white mt-1.5">
                {isEditingVehicle ? 'Update Available Vehicle' : 'List Available Vehicle'}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                List empty return vehicles or available transport along major routes.
              </p>
            </div>

            <form onSubmit={handleSaveVehicle} className="space-y-4">
              {/* Visual Vehicle Type Selection */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-semibold text-slate-200">
                    Select Vehicle Type *
                  </label>
                  <span className="text-xs text-[#F59E0B] font-bold">
                    Selected: {vehType}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-56 overflow-y-auto p-1.5 bg-[#091827] rounded-xl border border-[#1E3D60]">
                  {VEHICLE_CATEGORIES.map((cat) => {
                    const isSelected = vehType === cat.name;
                    return (
                      <button
                        type="button"
                        key={cat.id}
                        onClick={() => {
                          setVehType(cat.name);
                          if (!isEditingVehicle) {
                            setVehCapacity(String(cat.defaultCapacity));
                          }
                        }}
                        className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all group relative cursor-pointer ${
                          isSelected
                            ? 'bg-[#152E4A] border-[#F59E0B] shadow-md shadow-amber-500/10 ring-1 ring-[#F59E0B]'
                            : 'bg-[#0F2A44] border-[#1E3D60] hover:border-slate-500'
                        }`}
                      >
                        {isSelected && (
                          <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-[#F59E0B] flex items-center justify-center text-[#091827]">
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </div>
                        )}
                        <div className="w-10 h-8 rounded-lg bg-[#091827] flex items-center justify-center text-amber-400 mb-1.5 p-1 shrink-0">
                          <VehicleSvgIcon type={cat.id} className="w-8 h-6 text-amber-400" />
                        </div>
                        <div>
                          <p className={`text-xs font-bold leading-tight ${isSelected ? 'text-white' : 'text-slate-200'}`}>
                            {cat.name}
                          </p>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            {cat.capacityRange} (Approx.)
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Capacity */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-200 mb-1">
                    Available Load Capacity *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    max="1000"
                    required
                    value={vehCapacity}
                    onChange={(e) => setVehCapacity(e.target.value)}
                    placeholder="e.g. 3.5"
                    className="w-full px-3 py-2 bg-[#091827] border border-[#1E3D60] rounded-xl text-sm text-white focus:outline-none focus:border-[#F59E0B]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-200 mb-1">
                    Unit
                  </label>
                  <select
                    value={vehCapacityUnit}
                    onChange={(e) => setVehCapacityUnit(e.target.value)}
                    className="w-full px-3 py-2 bg-[#091827] border border-[#1E3D60] rounded-xl text-sm text-white focus:outline-none focus:border-[#F59E0B]"
                  >
                    <option value="Tons">Tons</option>
                    <option value="Quintals">Quintals</option>
                    <option value="Kg">Kg</option>
                  </select>
                </div>
              </div>

              {/* Locations */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-200 mb-1">
                    Current Location *
                  </label>
                  <input
                    type="text"
                    required
                    value={vehCurrentLoc}
                    onChange={(e) => setVehCurrentLoc(e.target.value)}
                    placeholder="e.g. Gorakhpur Mandi, UP"
                    className="w-full px-3 py-2 bg-[#091827] border border-[#1E3D60] rounded-xl text-sm text-white focus:outline-none focus:border-[#F59E0B]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-200 mb-1">
                    Destination Route *
                  </label>
                  <input
                    type="text"
                    required
                    value={vehDestination}
                    onChange={(e) => setVehDestination(e.target.value)}
                    placeholder="e.g. Lucknow Dubagga, UP"
                    className="w-full px-3 py-2 bg-[#091827] border border-[#1E3D60] rounded-xl text-sm text-white focus:outline-none focus:border-[#F59E0B]"
                  />
                </div>
              </div>

              {/* Operating Corridor Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1">
                  Main Route (Optional)
                </label>
                <input
                  type="text"
                  value={vehCorridor}
                  onChange={(e) => setVehCorridor(e.target.value)}
                  placeholder="e.g. Gorakhpur to Lucknow (NH27 Route)"
                  className="w-full px-3 py-2 bg-[#091827] border border-[#1E3D60] rounded-xl text-sm text-white focus:outline-none focus:border-[#F59E0B]"
                />
              </div>

              {/* Date & Return Trip */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                <div>
                  <label className="block text-xs font-semibold text-slate-200 mb-1">
                    Availability Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={vehAvailDate}
                    onChange={(e) => setVehAvailDate(e.target.value)}
                    className="w-full px-3 py-2 bg-[#091827] border border-[#1E3D60] rounded-xl text-sm text-white focus:outline-none focus:border-[#F59E0B]"
                  />
                </div>
                <div className="pt-4">
                  <label className="flex items-center space-x-2.5 cursor-pointer bg-[#091827] p-2.5 rounded-xl border border-[#1E3D60]">
                    <input
                      type="checkbox"
                      checked={vehIsReturnTrip}
                      onChange={(e) => setVehIsReturnTrip(e.target.checked)}
                      className="w-4 h-4 text-[#F59E0B] rounded bg-[#11253B] border-[#1E3D60] focus:ring-[#F59E0B]"
                    />
                    <span className="text-xs font-semibold text-slate-200">
                      Empty Return Trip (Looking for a return load)
                    </span>
                  </label>
                </div>
              </div>

              {/* Rate Expectation */}
              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1">
                  Expected Price in ₹ (Optional)
                </label>
                <input
                  type="number"
                  min="0"
                  value={vehRateExpectation}
                  onChange={(e) => setVehRateExpectation(e.target.value)}
                  placeholder="e.g. 8500"
                  className="w-full px-3 py-2 bg-[#091827] border border-[#1E3D60] rounded-xl text-sm text-white focus:outline-none focus:border-[#F59E0B]"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1">
                  Vehicle Notes
                </label>
                <textarea
                  rows="2"
                  value={vehNotes}
                  onChange={(e) => setVehNotes(e.target.value)}
                  placeholder="Hydraulic lift, tarpaulin cover, verified driver..."
                  className="w-full px-3 py-2 bg-[#091827] border border-[#1E3D60] rounded-xl text-xs text-white focus:outline-none focus:border-[#F59E0B]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsVehicleModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-[#11253B] border border-[#1E3D60] rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingVehicle}
                  className="px-5 py-2 text-xs font-bold bg-[#F59E0B] hover:bg-[#D97706] text-[#091827] rounded-xl shadow disabled:opacity-50"
                >
                  {isSavingVehicle ? 'Saving...' : isEditingVehicle ? 'Update Vehicle' : 'List Vehicle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: Transporter Authentication & Demo Modal */}
      {isAuthModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-[#0F2A44] border border-[#1E3D60] rounded-2xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative space-y-5">
            <button
              type="button"
              onClick={() => setIsAuthModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-[#152E4A]"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">
                Transport Partner Sign In
              </span>
              <h2 className="text-xl font-extrabold text-white mt-1.5">
                {authMode === 'login' ? 'Transport Partner Sign In' : 'Create Transport Partner Account'}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Find available loads, list vehicles, and offer your price.
              </p>
            </div>

            {/* Quick Demo Sign In Box */}
            <div className="bg-[#091827] p-3.5 rounded-xl border border-[#1E3D60] space-y-2.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 block">
                ⚡ Quick Demo Sign In
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => loginDemoTransporter(1)}
                  className="p-2.5 bg-[#11253B] hover:bg-[#152E4A] border border-[#1E3D60] hover:border-[#F59E0B] rounded-lg text-left transition-colors"
                >
                  <span className="text-xs font-bold text-white block">Transport Partner 1</span>
                  <span className="text-[10px] text-slate-400 block truncate">Awadh Express Fleet</span>
                </button>
                <button
                  type="button"
                  onClick={() => loginDemoTransporter(2)}
                  className="p-2.5 bg-[#11253B] hover:bg-[#152E4A] border border-[#1E3D60] hover:border-[#F59E0B] rounded-lg text-left transition-colors"
                >
                  <span className="text-xs font-bold text-white block">Transport Partner 2</span>
                  <span className="text-[10px] text-slate-400 block truncate">Northern Return Haul</span>
                </button>
              </div>
            </div>

            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-[#1E3D60]"></div>
              <span className="flex-shrink mx-3 text-slate-500 text-xs uppercase tracking-wider">
                Or With Email & Password
              </span>
              <div className="flex-grow border-t border-[#1E3D60]"></div>
            </div>

            <form onSubmit={handleCustomAuth} className="space-y-3">
              {authMode === 'register' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={registerName}
                      onChange={(e) => setRegisterName(e.target.value)}
                      placeholder="e.g. Jaswinder Singh"
                      className="w-full px-3 py-2 bg-[#091827] border border-[#1E3D60] rounded-xl text-xs text-white focus:outline-none focus:border-[#F59E0B]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Business / Transport Company Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={registerBusiness}
                      onChange={(e) => setRegisterBusiness(e.target.value)}
                      placeholder="e.g. Purvanchal Carrier Services"
                      className="w-full px-3 py-2 bg-[#091827] border border-[#1E3D60] rounded-xl text-xs text-white focus:outline-none focus:border-[#F59E0B]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Contact Phone (10 digits) *
                    </label>
                    <input
                      type="tel"
                      required
                      value={registerPhone}
                      onChange={(e) => setRegisterPhone(e.target.value)}
                      placeholder="9811223344"
                      className="w-full px-3 py-2 bg-[#091827] border border-[#1E3D60] rounded-xl text-xs text-white focus:outline-none focus:border-[#F59E0B]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Main Route
                    </label>
                    <input
                      type="text"
                      value={registerCorridor}
                      onChange={(e) => setRegisterCorridor(e.target.value)}
                      placeholder="Gorakhpur to Lucknow (NH27 Route)"
                      className="w-full px-3 py-2 bg-[#091827] border border-[#1E3D60] rounded-xl text-xs text-white focus:outline-none focus:border-[#F59E0B]"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  placeholder="partner@example.com"
                  className="w-full px-3 py-2 bg-[#091827] border border-[#1E3D60] rounded-xl text-xs text-white focus:outline-none focus:border-[#F59E0B]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Password *
                </label>
                <input
                  type="password"
                  required
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 bg-[#091827] border border-[#1E3D60] rounded-xl text-xs text-white focus:outline-none focus:border-[#F59E0B]"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-[#F59E0B] hover:bg-[#D97706] text-[#091827] font-bold text-xs rounded-xl shadow transition-colors mt-2"
              >
                {authMode === 'login' ? 'Sign In as Transport Partner' : 'Create Transport Partner Account'}
              </button>
            </form>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setAuthMode((m) => (m === 'login' ? 'register' : 'login'))}
                className="text-xs text-amber-400 hover:underline"
              >
                {authMode === 'login'
                  ? "Don't have an account? Register as Transport Partner"
                  : 'Already registered? Sign in'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: Booking Lifecycle Operations Modal */}
      {activeBookingModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-[#0F2A44] border border-[#1E3D60] rounded-2xl max-w-md w-full p-6 shadow-2xl relative space-y-4">
            <button
              type="button"
              onClick={() => setActiveBookingModal(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-[#152E4A]"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">
                Booking #{activeBookingModal.booking.bookingNumber}
              </span>
              <h2 className="text-lg font-extrabold text-white mt-1.5">
                {activeBookingModal.type === 'pickup' && 'Confirm Goods Pickup'}
                {activeBookingModal.type === 'transit' && 'Update Trip Progress'}
                {activeBookingModal.type === 'delivery' && 'Confirm Delivery'}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {activeBookingModal.booking.origin} → {activeBookingModal.booking.destination}
              </p>
            </div>

            {activeBookingModal.type === 'pickup' && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleRecordPickup(activeBookingModal.booking.id, modalInputNotes);
                }}
                className="space-y-3"
              >
                <div>
                  <label className="block text-xs font-semibold text-slate-200 mb-1">
                    Pickup Notes (Optional)
                  </label>
                  <textarea
                    rows="3"
                    value={modalInputNotes}
                    onChange={(e) => setModalInputNotes(e.target.value)}
                    placeholder="e.g. Loaded 15T agricultural bags at Gate 2. Driver underway."
                    className="w-full px-3 py-2 bg-[#091827] border border-[#1E3D60] rounded-xl text-xs text-white focus:outline-none focus:border-[#F59E0B]"
                  />
                </div>
                <div className="pt-2 flex items-center justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setActiveBookingModal(null)}
                    className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-[#11253B] border border-[#1E3D60] rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isUpdatingBooking}
                    className="px-5 py-2 text-xs font-bold bg-[#F59E0B] hover:bg-[#D97706] text-[#091827] rounded-xl shadow disabled:opacity-50"
                  >
                    {isUpdatingBooking ? 'Updating...' : 'Confirm Pickup'}
                  </button>
                </div>
              </form>
            )}

            {activeBookingModal.type === 'transit' && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleUpdateTransit(activeBookingModal.booking.id, modalInputLocation, modalInputNotes);
                }}
                className="space-y-3"
              >
                <div>
                  <label className="block text-xs font-semibold text-slate-200 mb-1">
                    Current Location *
                  </label>
                  <input
                    type="text"
                    required
                    value={modalInputLocation}
                    onChange={(e) => setModalInputLocation(e.target.value)}
                    placeholder="e.g. Aligarh Bypass NH-91 Toll Plaza"
                    className="w-full px-3 py-2 bg-[#091827] border border-[#1E3D60] rounded-xl text-xs text-white focus:outline-none focus:border-[#F59E0B]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-200 mb-1">
                    Trip Notes (Optional)
                  </label>
                  <textarea
                    rows="2"
                    value={modalInputNotes}
                    onChange={(e) => setModalInputNotes(e.target.value)}
                    placeholder="e.g. Traffic clear, estimated arrival 4 PM."
                    className="w-full px-3 py-2 bg-[#091827] border border-[#1E3D60] rounded-xl text-xs text-white focus:outline-none focus:border-[#F59E0B]"
                  />
                </div>
                <div className="pt-2 flex items-center justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setActiveBookingModal(null)}
                    className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-[#11253B] border border-[#1E3D60] rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isUpdatingBooking}
                    className="px-5 py-2 text-xs font-bold bg-[#F59E0B] hover:bg-[#D97706] text-[#091827] rounded-xl shadow disabled:opacity-50"
                  >
                    {isUpdatingBooking ? 'Updating...' : 'Update Location'}
                  </button>
                </div>
              </form>
            )}

            {activeBookingModal.type === 'delivery' && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleReportDelivery(
                    activeBookingModal.booking.id,
                    modalInputRecipient,
                    modalInputNotes,
                    modalInputProof,
                    modalDeliveryFile
                  );
                }}
                className="space-y-3"
              >
                <div>
                  <label className="block text-xs font-semibold text-slate-200 mb-1">
                    Person Receiving the Goods *
                  </label>
                  <input
                    type="text"
                    required
                    value={modalInputRecipient}
                    onChange={(e) => setModalInputRecipient(e.target.value)}
                    placeholder="e.g. Rameshwar Lal (Warehouse Manager)"
                    className="w-full px-3 py-2 bg-[#091827] border border-[#1E3D60] rounded-xl text-xs text-white focus:outline-none focus:border-[#F59E0B]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-200 mb-1">
                    Delivery Notes (Optional)
                  </label>
                  <textarea
                    rows="2"
                    value={modalInputNotes}
                    onChange={(e) => setModalInputNotes(e.target.value)}
                    placeholder="e.g. Unloaded at Platform 3. All items intact."
                    className="w-full px-3 py-2 bg-[#091827] border border-[#1E3D60] rounded-xl text-xs text-white focus:outline-none focus:border-[#F59E0B]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-200 mb-1">
                    Delivery Receipt or Bilty Number (Optional)
                  </label>
                  <input
                    type="text"
                    value={modalInputProof}
                    onChange={(e) => setModalInputProof(e.target.value)}
                    placeholder="e.g. Signed bilty stamp serial #POD-88321"
                    className="w-full px-3 py-2 bg-[#091827] border border-[#1E3D60] rounded-xl text-xs text-white focus:outline-none focus:border-[#F59E0B]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-200 mb-1">
                    Upload Delivery Photo or Signed Receipt (Optional)
                  </label>
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp,.pdf"
                    onChange={(e) => setModalDeliveryFile(e.target.files?.[0] || null)}
                    className="w-full text-xs text-slate-300 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#1E3D60] file:text-amber-400 hover:file:bg-[#254B75] cursor-pointer"
                  />
                  {modalDeliveryFile && (
                    <p className="text-[11px] text-amber-400 mt-1 font-semibold truncate">
                      Selected: {modalDeliveryFile.name} ({(modalDeliveryFile.size / 1024).toFixed(1)} KB)
                    </p>
                  )}
                </div>
                <div className="pt-2 flex items-center justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveBookingModal(null);
                      setModalDeliveryFile(null);
                    }}
                    className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-[#11253B] border border-[#1E3D60] rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isUpdatingBooking}
                    className="px-5 py-2 text-xs font-bold bg-[#F59E0B] hover:bg-[#D97706] text-[#091827] rounded-xl shadow disabled:opacity-50"
                  >
                    {isUpdatingBooking ? 'Reporting...' : modalDeliveryFile ? 'Submit Receipt & Confirm' : 'Confirm Delivery'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Notifications Drawer */}
      <NotificationDrawer
        isOpen={isNotificationDrawerOpen}
        onClose={() => {
          setIsNotificationDrawerOpen(false);
          fetchUnreadCount();
        }}
        authToken={authToken}
      />
    </div>
  );
}

// -------------------------------------------------------------
// SUB-COMPONENT: Transporter Confirmed Bookings Section
// -------------------------------------------------------------
function TransporterBookingsSection({
  bookings,
  isLoading,
  onOpenPickup,
  onOpenTransit,
  onOpenDelivery,
  onRefresh,
}) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0F2A44] border border-[#1E3D60] rounded-2xl p-6">
        <div>
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            Current Bookings
          </span>
          <h2 className="text-xl font-extrabold text-white mt-1">Current & Past Bookings</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            View assigned loads, contact the goods owner, update trip progress, and submit delivery receipt.
          </p>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-[#11253B] border border-[#1E3D60] rounded-xl transition-all self-start sm:self-auto"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Refresh Bookings</span>
        </button>
      </div>

      {isLoading ? (
        <div className="py-16 text-center text-slate-400 text-sm">
          <Truck className="w-8 h-8 animate-pulse text-[#F59E0B] mx-auto mb-3" />
          Loading bookings...
        </div>
      ) : bookings.length === 0 ? (
        <div className="bg-[#0F2A44] border border-[#1E3D60] rounded-2xl p-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-[#11253B] border border-[#1E3D60] flex items-center justify-center mx-auto text-amber-400">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-white">No Confirmed Bookings Yet</h3>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            When a goods owner accepts your price offer, your booking will appear here with their contact details.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-6">
          {bookings.map((b) => {
            const statusCfg = BOOKING_STATUS_CONFIG[b.status] || BOOKING_STATUS_CONFIG.CONFIRMED;
            const isConfirmed = b.status === 'CONFIRMED';
            const inTransit = b.status === 'PICKED_UP' || b.status === 'IN_TRANSIT';
            const isDelivered = b.status === 'DELIVERED';
            const isCompleted = b.status === 'COMPLETED';

            return (
              <div
                key={b.id}
                className="bg-[#0F2A44] border border-[#1E3D60] hover:border-[#2A4F78] rounded-2xl p-6 flex flex-col justify-between shadow-xl transition-all relative space-y-4"
              >
                <div>
                  {/* Top Bar */}
                  <div className="flex items-center justify-between pb-3 border-b border-[#1E3D60] text-xs">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-[#F59E0B]">{b.bookingNumber}</span>
                      <span className={`inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${statusCfg.badge}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                        <span>{statusCfg.label}</span>
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400">
                      Pickup: {new Date(b.scheduledPickupDate).toLocaleDateString('en-IN', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>

                  {/* Route */}
                  <div className="mt-4 space-y-2">
                    <div className="flex items-start space-x-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#38BDF8] mt-1 shrink-0" />
                      <div>
                        <p className="text-[10px] uppercase font-bold text-slate-400">Pickup Location</p>
                        <p className="text-sm font-bold text-white">{b.origin}</p>
                      </div>
                    </div>
                    <div className="ml-1 pl-3 border-l-2 border-dashed border-[#1E3D60] py-0.5 text-[11px] text-slate-400">
                      On the Way
                    </div>
                    <div className="flex items-start space-x-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#F59E0B] mt-1 shrink-0" />
                      <div>
                        <p className="text-[10px] uppercase font-bold text-slate-400">Delivery Location</p>
                        <p className="text-sm font-bold text-white">{b.destination}</p>
                      </div>
                    </div>
                  </div>

                  {/* Commercials and Shipper Snapshot */}
                  <div className="grid grid-cols-2 gap-3 mt-4 p-3 bg-[#091827] rounded-xl border border-[#1E3D60] text-xs">
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-bold">Agreed Price</p>
                      <p className="text-sm font-extrabold text-[#F59E0B]">{b.agreedPriceFormatted}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-bold">Goods & Vehicle</p>
                      <p className="text-xs font-semibold text-white truncate">
                        {b.weight} {b.weightUnit} • {b.vehicleType}
                      </p>
                    </div>
                    <div className="col-span-2 pt-2 border-t border-[#1E3D60]">
                      <p className="text-[10px] text-slate-400 uppercase font-bold">Goods Owner Contact</p>
                      <div className="flex items-center justify-between mt-0.5">
                        <div>
                          <span className="text-xs font-bold text-white block">{b.shipper?.businessName}</span>
                          <span className="text-[11px] text-slate-400">{b.shipper?.name}</span>
                        </div>
                        {b.shipper?.phone && (
                          <span className="text-xs font-semibold text-emerald-400">
                            📞 {b.shipper.phone}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Live Tracking Progress */}
                  <div className="mt-3 p-3 bg-[#11253B] rounded-xl border border-[#1E3D60] text-xs space-y-1.5 text-slate-300">
                    <p className="text-[10px] uppercase font-bold text-[#38BDF8]">Trip Progress</p>
                    {b.actualPickupAt && (
                      <p className="text-[11px]">
                        ✓ Picked up: {new Date(b.actualPickupAt).toLocaleString('en-IN')}
                      </p>
                    )}
                    {b.transitLocation && (
                      <p className="text-[11px] text-amber-300">
                        📍 Current Location: {b.transitLocation} {b.transitNotes ? `— "${b.transitNotes}"` : ''}
                      </p>
                    )}
                    {b.deliveredAt && (
                      <p className="text-[11px] text-teal-300">
                        ✓ Delivery Reported: {new Date(b.deliveredAt).toLocaleString('en-IN')}{' '}
                        {b.recipientName ? `(Recipient: ${b.recipientName})` : ''}
                      </p>
                    )}
                    {isCompleted && (
                      <p className="text-[11px] text-emerald-400 font-semibold">
                        ✓ Delivery Confirmed by Goods Owner
                      </p>
                    )}
                  </div>
                </div>

                {/* Transporter Lifecycle Actions */}
                <div className="pt-2 border-t border-[#1E3D60] flex items-center justify-between gap-2">
                  {isConfirmed && (
                    <button
                      type="button"
                      onClick={() => onOpenPickup(b)}
                      className="w-full py-2 text-xs font-extrabold text-[#091827] bg-[#F59E0B] hover:bg-[#D97706] rounded-xl shadow-lg transition-all"
                    >
                      Confirm Goods Pickup →
                    </button>
                  )}

                  {inTransit && (
                    <div className="grid grid-cols-2 gap-2 w-full">
                      <button
                        type="button"
                        onClick={() => onOpenTransit(b)}
                        className="py-2 px-3 text-xs font-bold text-slate-200 bg-[#11253B] hover:bg-[#152E4A] border border-[#1E3D60] rounded-xl transition-all"
                      >
                        📍 Update Location
                      </button>
                      <button
                        type="button"
                        onClick={() => onOpenDelivery(b)}
                        className="py-2 px-3 text-xs font-bold text-[#091827] bg-[#F59E0B] hover:bg-[#D97706] rounded-xl transition-all"
                      >
                        ✓ Confirm Delivery
                      </button>
                    </div>
                  )}

                  {isDelivered && (
                    <span className="text-xs text-teal-300 font-semibold">
                      Delivery reported. Waiting for goods owner to confirm receipt.
                    </span>
                  )}

                  {isCompleted && (
                    <span className="text-xs text-emerald-400 font-bold flex items-center">
                      <CheckCircle2 className="w-4 h-4 mr-1" />
                      Delivery Completed
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

