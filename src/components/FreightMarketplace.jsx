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
  Clock,
  Phone,
  Mail,
  Building2,
  X,
  Edit3,
  Trash2,
  ChevronLeft,
  ChevronRight,
  User,
  LogOut,
  Sparkles,
  Bell,
  ShieldCheck,
  FileCheck,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import Logo from './Logo';
import NotificationDrawer from './NotificationDrawer';

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
  '24ft Closed Container (9 - 10 Ton)',
  '32ft Single-Axle Container (7 - 9 Ton)',
  '32ft Multi-Axle Container (14 - 18 Ton)',
  '40ft Trailer / Flatbed (25 - 32 Ton)',
  'Other / Custom Fleet',
];

const STATUS_CONFIG = {
  OPEN: {
    label: 'Open for Booking',
    badge: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    dot: 'bg-emerald-400',
  },
  IN_NEGOTIATION: {
    label: 'In Negotiation',
    badge: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    dot: 'bg-amber-400',
  },
  ASSIGNED: {
    label: 'Truck Assigned',
    badge: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
    dot: 'bg-sky-400',
  },
  IN_TRANSIT: {
    label: 'In Transit',
    badge: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
    dot: 'bg-indigo-400',
  },
  COMPLETED: {
    label: 'Delivered',
    badge: 'bg-slate-500/15 text-slate-300 border-slate-500/30',
    dot: 'bg-slate-400',
  },
  CANCELLED: {
    label: 'Cancelled',
    badge: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
    dot: 'bg-rose-400',
  },
};

const BOOKING_STATUS_CONFIG = {
  CONFIRMED: {
    label: 'Assigned & Confirmed',
    badge: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
    dot: 'bg-sky-400',
  },
  PICKED_UP: {
    label: 'Cargo Picked Up',
    badge: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    dot: 'bg-amber-400',
  },
  IN_TRANSIT: {
    label: 'In Transit',
    badge: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
    dot: 'bg-indigo-400',
  },
  DELIVERED: {
    label: 'Delivered (Awaiting Confirmation)',
    badge: 'bg-teal-500/15 text-teal-300 border-teal-500/30',
    dot: 'bg-teal-400',
  },
  COMPLETED: {
    label: 'Delivered & Closed',
    badge: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    dot: 'bg-emerald-400',
  },
  CANCELLED: {
    label: 'Cancelled',
    badge: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
    dot: 'bg-rose-400',
  },
};

export default function FreightMarketplace() {
  const [activeTab, setActiveTab] = useState('marketplace'); // 'marketplace' | 'my-listings'
  const [listings, setListings] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 9, totalPages: 1, totalCount: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters state
  const [search, setSearch] = useState('');
  const [originFilter, setOriginFilter] = useState('');
  const [destFilter, setDestFilter] = useState('');
  const [cargoFilter, setCargoFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('OPEN');
  const [currentPage, setCurrentPage] = useState(1);

  // Modals state
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedListing, setSelectedListing] = useState(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Transporter Quotes / Bids Review Modal State
  const [isBidsModalOpen, setIsBidsModalOpen] = useState(false);
  const [bidsListing, setBidsListing] = useState(null);
  const [bidsList, setBidsList] = useState([]);
  const [bidsLoading, setBidsLoading] = useState(false);
  const [reviewingBidId, setReviewingBidId] = useState(null);

  // Notification Toast
  const [toast, setToast] = useState(null);

  // Confirmed Bookings State (Phase 5)
  const [bookings, setBookings] = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [completingBookingId, setCompletingBookingId] = useState(null);
  const [cancellingBookingId, setCancellingBookingId] = useState(null);

  // Authenticated Shipper state
  const [currentShipper, setCurrentShipper] = useState(null);
  const [authToken, setAuthToken] = useState(() => localStorage.getItem('routewise_shipper_token') || null);

  // Notifications Drawer & Unread Count (Phase 6)
  const [isNotificationDrawerOpen, setIsNotificationDrawerOpen] = useState(false);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);

  // Delivery Dispute Modal State (Phase 6)
  const [disputeBookingModal, setDisputeBookingModal] = useState(null);
  const [disputeReasonInput, setDisputeReasonInput] = useState('');
  const [isSubmittingDispute, setIsSubmittingDispute] = useState(false);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4500);
  };

  const fetchBookings = useCallback(async () => {
    if (!authToken) return;
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
      showToast('error', 'Failed to retrieve bookings.');
    } finally {
      setBookingsLoading(false);
    }
  }, [authToken]);

  const openBidsModal = async (listing) => {
    setBidsListing(listing);
    setIsBidsModalOpen(true);
    setBidsLoading(true);
    try {
      const res = await fetch(`/api/interests/listing/${listing.id}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setBidsList(data.data || []);
      } else {
        const data = await res.json();
        showToast('error', data.message || 'Could not load quotes for this listing');
      }
    } catch {
      showToast('error', 'Network error fetching quotes');
    } finally {
      setBidsLoading(false);
    }
  };

  const handleReviewBid = async (bidId, action) => {
    setReviewingBidId(bidId);
    try {
      const notes =
        action === 'ACCEPTED'
          ? 'Quote accepted and load assigned. Transporter vehicle reserved.'
          : 'Quote declined.';
      const res = await fetch(`/api/interests/${bidId}/review`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ action, reviewNotes: notes, assign: true }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(
          'success',
          action === 'ACCEPTED'
            ? 'Quote accepted! Load atomically assigned & booking confirmed.'
            : 'Quote declined.'
        );
        fetchListings();
        fetchBookings();
        if (bidsListing) {
          const fresh = await fetch(`/api/interests/listing/${bidsListing.id}`, {
            headers: { Authorization: `Bearer ${authToken}` },
          });
          if (fresh.ok) {
            const d = await fresh.json();
            setBidsList(d.data || []);
          }
        }
      } else {
        showToast('error', data.message || 'Failed to update bid status');
      }
    } catch {
      showToast('error', 'Network error reviewing bid');
    } finally {
      setReviewingBidId(null);
    }
  };

  const handleCompleteBooking = async (bookingId) => {
    setCompletingBookingId(bookingId);
    try {
      const res = await fetch(`/api/bookings/${bookingId}/complete`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          completionNotes: 'Shipper confirmed receipt of shipment in good condition.',
        }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast('success', 'Booking completed and closed successfully!');
        fetchBookings();
        fetchListings();
      } else {
        showToast('error', data.message || 'Failed to complete booking.');
      }
    } catch {
      showToast('error', 'Network error completing booking.');
    } finally {
      setCompletingBookingId(null);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking? The vehicle and freight load will be released.')) {
      return;
    }
    setCancellingBookingId(bookingId);
    try {
      const res = await fetch(`/api/bookings/${bookingId}/cancel`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ reason: 'Cancelled by shipper prior to load pickup.' }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast('success', 'Booking cancelled and resources released.');
        fetchBookings();
        fetchListings();
      } else {
        showToast('error', data.message || 'Failed to cancel booking.');
      }
    } catch {
      showToast('error', 'Network error cancelling booking.');
    } finally {
      setCancellingBookingId(null);
    }
  };

  // Notification unread count polling
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

  // Secure document proof download (Phase 6)
  const handleDownloadProofDoc = async (bookingId, docId, originalName) => {
    try {
      const res = await fetch(`/api/bookings/${bookingId}/proof/${docId}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        showToast('error', d.message || 'Failed to download document');
        return;
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = originalName || 'delivery-proof';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      showToast('error', 'Network error retrieving document');
    }
  };

  // Delivery dispute submission (Phase 6)
  const handleOpenDispute = (booking) => {
    setDisputeBookingModal(booking);
    setDisputeReasonInput('');
  };

  const handleSubmitDispute = async (e) => {
    e.preventDefault();
    if (!disputeBookingModal || !disputeReasonInput.trim()) return;
    setIsSubmittingDispute(true);
    try {
      const res = await fetch(`/api/bookings/${disputeBookingModal.id}/dispute`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ reason: disputeReasonInput.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast('success', 'Delivery dispute recorded. RouteWise operations team will mediate.');
        setDisputeBookingModal(null);
        fetchBookings();
        fetchUnreadCount();
      } else {
        showToast('error', data.message || 'Failed to submit dispute');
      }
    } catch {
      showToast('error', 'Network error submitting dispute');
    } finally {
      setIsSubmittingDispute(false);
    }
  };

  // Authenticate session on mount or token change
  const verifyCurrentSession = useCallback(async (token) => {
    if (!token) {
      setCurrentShipper(null);
      return;
    }
    try {
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentShipper(data.user);
      } else {
        localStorage.removeItem('routewise_shipper_token');
        setAuthToken(null);
        setCurrentShipper(null);
      }
    } catch {
      // In offline/dev fallback, retain local token
    }
  }, []);

  useEffect(() => {
    verifyCurrentSession(authToken);
  }, [authToken, verifyCurrentSession]);

  // Quick Demo Login Helper for seamless testing
  const loginDemoShipper = async (index = 1) => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/auth/demo-shipper', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ index }),
      });
      const data = await res.json();
      if (res.ok && data.token) {
        localStorage.setItem('routewise_shipper_token', data.token);
        setAuthToken(data.token);
        setCurrentShipper(data.user);
        setIsAuthModalOpen(false);
        showToast('success', `Signed in as ${data.user.businessName}`);
      } else {
        showToast('error', data.message || 'Demo login failed');
      }
    } catch (err) {
      showToast('error', 'Network error during login');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('routewise_shipper_token');
    setAuthToken(null);
    setCurrentShipper(null);
    if (activeTab === 'my-listings') {
      setActiveTab('marketplace');
    }
    showToast('info', 'Signed out of shipper session');
  };

  // Fetch listings from MongoDB Atlas backend
  const fetchListings = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      let url = '';
      const headers = {};

      if (activeTab === 'my-listings') {
        if (!authToken) {
          setIsLoading(false);
          setListings([]);
          return;
        }
        url = `/api/listings/my-listings?page=${currentPage}&limit=9&status=${statusFilter}`;
        headers.Authorization = `Bearer ${authToken}`;
      } else {
        const params = new URLSearchParams({
          page: currentPage,
          limit: 9,
          status: statusFilter,
        });
        if (search.trim()) params.append('search', search.trim());
        if (originFilter.trim()) params.append('origin', originFilter.trim());
        if (destFilter.trim()) params.append('destination', destFilter.trim());
        if (cargoFilter !== 'ALL') params.append('cargo', cargoFilter);

        url = `/api/listings?${params.toString()}`;
      }

      const res = await fetch(url, { headers });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to retrieve listings');
      }

      setListings(data.data || []);
      if (data.pagination) {
        setPagination(data.pagination);
      }
    } catch (err) {
      setError(err.message || 'An error occurred while loading freight listings');
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, authToken, currentPage, statusFilter, search, originFilter, destFilter, cargoFilter]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  const handleResetFilters = () => {
    setSearch('');
    setOriginFilter('');
    setDestFilter('');
    setCargoFilter('ALL');
    setStatusFilter(activeTab === 'marketplace' ? 'OPEN' : 'ALL');
    setCurrentPage(1);
  };

  return (
    <div className="min-h-[100dvh] w-full overflow-x-hidden bg-[#091827] text-slate-100 flex flex-col font-sans">
      {/* Top Navigation Header */}
      <header className="sticky top-0 z-40 bg-[#091827]/95 backdrop-blur-md border-b border-[#1E3D60]/80 shadow-lg">
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 w-full">
          <div className="flex items-center justify-between h-18">
            <div className="flex items-center space-x-6">
              <Link to="/" className="flex items-center group">
                <Logo />
              </Link>
              <div className="hidden sm:flex items-center space-x-2 pl-4 border-l border-[#1E3D60]">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                  Live Freight Marketplace
                </span>
                <span className="text-[10px] text-slate-400 bg-[#0F2A44] px-2 py-0.5 rounded border border-[#1E3D60]">
                  Phase 3
                </span>
              </div>
            </div>

            {/* Shipper Session & Action Center */}
            <div className="flex items-center space-x-3">
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

              {currentShipper ? (
                <div className="flex items-center space-x-3">
                  <div className="hidden md:flex flex-col text-right">
                    <span className="text-xs font-bold text-white leading-tight">
                      {currentShipper.businessName}
                    </span>
                    <span className="text-[11px] text-[#F59E0B]">
                      {currentShipper.name} (Shipper)
                    </span>
                  </div>

                  {/* Switch Demo Shipper Dropdown */}
                  <div className="relative group">
                    <button
                      type="button"
                      className="px-2.5 py-1.5 text-xs bg-[#0F2A44] hover:bg-[#152E4A] border border-[#1E3D60] rounded-lg text-slate-300 flex items-center space-x-1.5 transition-colors"
                      title="Switch demo shipper account"
                    >
                      <User className="w-3.5 h-3.5 text-[#F59E0B]" />
                      <span className="hidden sm:inline">Switch Account</span>
                    </button>
                    <div className="absolute right-0 mt-1 w-56 bg-[#0F2A44] border border-[#1E3D60] rounded-xl shadow-2xl p-1.5 hidden group-hover:block z-50">
                      <p className="text-[10px] uppercase font-bold text-slate-400 px-2 py-1">
                        Test Role Authorization:
                      </p>
                      <button
                        type="button"
                        onClick={() => loginDemoShipper(1)}
                        className={`w-full text-left px-2.5 py-2 text-xs rounded-lg flex flex-col ${
                          currentShipper.email === 'shipper@routewise.in'
                            ? 'bg-[#152E4A] text-[#F59E0B] font-bold'
                            : 'text-slate-300 hover:bg-[#152E4A] hover:text-white'
                        }`}
                      >
                        <span>Purvanchal Agro (Shipper A)</span>
                        <span className="text-[10px] text-slate-400">shipper@routewise.in</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => loginDemoShipper(2)}
                        className={`w-full text-left px-2.5 py-2 text-xs rounded-lg flex flex-col mt-1 ${
                          currentShipper.email === 'shipper2@routewise.in'
                            ? 'bg-[#152E4A] text-[#F59E0B] font-bold'
                            : 'text-slate-300 hover:bg-[#152E4A] hover:text-white'
                        }`}
                      >
                        <span>Avadh Steel (Shipper B)</span>
                        <span className="text-[10px] text-slate-400">shipper2@routewise.in</span>
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="p-2 text-slate-400 hover:text-rose-400 bg-[#0F2A44] border border-[#1E3D60] rounded-lg transition-colors"
                    title="Sign Out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsAuthModalOpen(true)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-200 hover:text-white bg-[#0F2A44] border border-[#1E3D60] rounded-lg transition-colors"
                >
                  Shipper Sign In
                </button>
              )}

              <Link
                to="/transporter"
                className="hidden sm:inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-[#0F2A44] hover:bg-[#152E4A] border border-[#1E3D60] rounded-lg transition-colors"
              >
                <Truck className="w-3.5 h-3.5 text-[#F59E0B]" />
                <span>Transporter Hub</span>
              </Link>

              <button
                type="button"
                onClick={() => {
                  if (!currentShipper) {
                    setIsAuthModalOpen(true);
                  } else {
                    setIsPostModalOpen(true);
                  }
                }}
                className="inline-flex items-center space-x-1.5 px-4 py-2 bg-[#F59E0B] hover:bg-[#D97706] text-[#091827] text-xs sm:text-sm font-bold rounded-xl shadow-md hover:shadow-lg transition-all"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Post Freight</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Banner with Stats */}
      <section className="bg-gradient-to-b from-[#0F2A44] to-[#091827] border-b border-[#1E3D60]/60 py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1920px] mx-auto w-full">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="inline-flex items-center space-x-2 bg-[#11253B] border border-amber-500/30 px-3 py-1 rounded-full text-xs font-semibold text-[#F59E0B] mb-3">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Verified Direct Freight Demand</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
                Live Regional Freight Marketplace
              </h1>
              <p className="mt-2 text-sm sm:text-base text-slate-300 max-w-2xl">
                Direct freight loads posted by verified businesses across Eastern UP and connected return corridors. Real-time capacity matching without intermediary markups.
              </p>
            </div>

            {/* Quick Metrics Badges */}
            <div className="flex items-center space-x-4 bg-[#091827]/80 p-3 rounded-2xl border border-[#1E3D60]">
              <div className="px-3 border-r border-[#1E3D60]">
                <p className="text-[10px] uppercase font-bold text-slate-400">Total Live Loads</p>
                <p className="text-xl font-extrabold text-white">{pagination.totalCount}</p>
              </div>
              <div className="px-3 border-r border-[#1E3D60]">
                <p className="text-[10px] uppercase font-bold text-slate-400">Primary Corridor</p>
                <p className="text-xs font-bold text-[#F59E0B]">NH27 (Gorakhpur - LKO)</p>
              </div>
              <div className="px-3">
                <p className="text-[10px] uppercase font-bold text-slate-400">Storage Backing</p>
                <p className="text-xs font-bold text-emerald-400 flex items-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5" />
                  MongoDB Atlas
                </p>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center space-x-2 mt-8 border-b border-[#1E3D60]">
            <button
              type="button"
              onClick={() => {
                setActiveTab('marketplace');
                setCurrentPage(1);
              }}
              className={`px-4 py-2.5 text-sm font-bold border-b-2 transition-all flex items-center space-x-2 ${
                activeTab === 'marketplace'
                  ? 'border-[#F59E0B] text-[#F59E0B]'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Truck className="w-4 h-4" />
              <span>Explore Marketplace</span>
            </button>
            <button
              type="button"
              onClick={() => {
                if (!currentShipper) {
                  setIsAuthModalOpen(true);
                } else {
                  setActiveTab('my-listings');
                  setCurrentPage(1);
                  setStatusFilter('ALL');
                }
              }}
              className={`px-4 py-2.5 text-sm font-bold border-b-2 transition-all flex items-center space-x-2 ${
                activeTab === 'my-listings'
                  ? 'border-[#F59E0B] text-[#F59E0B]'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>My Freight Postings</span>
              {currentShipper && (
                <span className="text-[10px] bg-[#152E4A] px-2 py-0.5 rounded-full text-amber-300 border border-[#1E3D60]">
                  Shipper Dashboard
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => {
                if (!currentShipper) {
                  setIsAuthModalOpen(true);
                } else {
                  setActiveTab('bookings');
                  fetchBookings();
                }
              }}
              className={`px-4 py-2.5 text-sm font-bold border-b-2 transition-all flex items-center space-x-2 ${
                activeTab === 'bookings'
                  ? 'border-[#F59E0B] text-[#F59E0B]'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Confirmed Bookings</span>
              {currentShipper && bookings.length > 0 && (
                <span className="text-[10px] bg-amber-500/20 px-2 py-0.5 rounded-full text-[#F59E0B] border border-amber-500/30">
                  {bookings.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 py-8 flex-1 w-full">
        {/* Toast Notification */}
        {toast && (
          <div
            className={`fixed bottom-6 right-6 z-50 flex items-center space-x-3 px-4 py-3 rounded-xl border shadow-2xl transition-all ${
              toast.type === 'success'
                ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-200'
                : toast.type === 'error'
                ? 'bg-rose-950/90 border-rose-500/50 text-rose-200'
                : 'bg-[#0F2A44] border-sky-500/50 text-sky-200'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            )}
            <span className="text-sm font-medium">{toast.message}</span>
            <button
              type="button"
              onClick={() => setToast(null)}
              className="text-slate-400 hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {activeTab === 'bookings' ? (
          <ShipperBookingsSection
            bookings={bookings}
            isLoading={bookingsLoading}
            completingBookingId={completingBookingId}
            cancellingBookingId={cancellingBookingId}
            onComplete={handleCompleteBooking}
            onCancel={handleCancelBooking}
            onDispute={handleOpenDispute}
            onDownloadProofDoc={handleDownloadProofDoc}
            onRefresh={fetchBookings}
          />
        ) : (
          <>
            {/* Filter and Search Bar */}
            <div className="bg-[#0F2A44] border border-[#1E3D60] rounded-2xl p-4 sm:p-5 mb-8 shadow-xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
            {/* General Search */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search commodity, business..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-[#091827] border border-[#1E3D60] rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-[#F59E0B]"
              />
            </div>

            {/* Origin Corridor */}
            <div className="relative">
              <MapPin className="w-4 h-4 absolute left-3 top-3 text-[#38BDF8]" />
              <input
                type="text"
                placeholder="Origin (e.g. Gorakhpur)"
                value={originFilter}
                onChange={(e) => setOriginFilter(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-[#091827] border border-[#1E3D60] rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-[#F59E0B]"
              />
            </div>

            {/* Destination Corridor */}
            <div className="relative">
              <MapPin className="w-4 h-4 absolute left-3 top-3 text-[#F59E0B]" />
              <input
                type="text"
                placeholder="Destination (e.g. Lucknow)"
                value={destFilter}
                onChange={(e) => setDestFilter(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-[#091827] border border-[#1E3D60] rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-[#F59E0B]"
              />
            </div>

            {/* Cargo Category Dropdown */}
            <div>
              <select
                value={cargoFilter}
                onChange={(e) => setCargoFilter(e.target.value)}
                className="w-full px-3 py-2 bg-[#091827] border border-[#1E3D60] rounded-xl text-xs text-white focus:outline-none focus:border-[#F59E0B]"
              >
                <option value="ALL">All Cargo Categories</option>
                {CARGO_OPTIONS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Dropdown */}
            <div className="flex items-center space-x-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 bg-[#091827] border border-[#1E3D60] rounded-xl text-xs text-white focus:outline-none focus:border-[#F59E0B]"
              >
                {activeTab === 'my-listings' && <option value="ALL">All Statuses</option>}
                <option value="OPEN">Open Loads</option>
                <option value="IN_NEGOTIATION">In Negotiation</option>
                <option value="ASSIGNED">Truck Assigned</option>
                <option value="COMPLETED">Delivered</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
              <button
                type="button"
                onClick={handleResetFilters}
                className="p-2 text-slate-400 hover:text-white bg-[#091827] border border-[#1E3D60] rounded-xl transition-colors shrink-0"
                title="Reset Filters"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Not Authenticated Warning for My-Listings Tab */}
        {activeTab === 'my-listings' && !currentShipper && (
          <div className="bg-[#11253B] border border-amber-500/40 rounded-2xl p-8 text-center max-w-xl mx-auto my-12">
            <Building2 className="w-12 h-12 text-[#F59E0B] mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white">Shipper Authentication Required</h3>
            <p className="mt-2 text-sm text-slate-300">
              Sign in with your verified shipper account to create, manage, and modify your private freight postings.
            </p>
            <div className="mt-6 flex justify-center space-x-3">
              <button
                type="button"
                onClick={() => loginDemoShipper(1)}
                className="px-4 py-2 bg-[#F59E0B] text-[#091827] font-bold text-xs rounded-xl shadow"
              >
                Sign In as Demo Shipper A
              </button>
              <button
                type="button"
                onClick={() => loginDemoShipper(2)}
                className="px-4 py-2 bg-[#152E4A] border border-[#1E3D60] text-slate-200 font-bold text-xs rounded-xl"
              >
                Sign In as Demo Shipper B
              </button>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-rose-950/40 border border-rose-500/50 rounded-2xl p-6 text-center max-w-xl mx-auto my-8">
            <AlertCircle className="w-10 h-10 text-rose-400 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-white">Unable to Load Listings</h3>
            <p className="mt-1 text-sm text-rose-300">{error}</p>
            <button
              type="button"
              onClick={fetchListings}
              className="mt-4 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {/* Loading Skeleton */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="bg-[#0F2A44]/60 border border-[#1E3D60] rounded-2xl p-6 animate-pulse space-y-4"
              >
                <div className="flex justify-between items-center pb-3 border-b border-[#1E3D60]/50">
                  <div className="h-4 w-24 bg-[#152E4A] rounded" />
                  <div className="h-4 w-28 bg-[#152E4A] rounded" />
                </div>
                <div className="space-y-2">
                  <div className="h-4 w-4/5 bg-[#152E4A] rounded" />
                  <div className="h-4 w-3/5 bg-[#152E4A] rounded" />
                </div>
                <div className="h-20 bg-[#091827] rounded-xl" />
                <div className="h-8 bg-[#152E4A] rounded-xl" />
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && listings.length === 0 && (
          <div className="bg-[#0F2A44]/50 border border-dashed border-[#1E3D60] rounded-3xl p-12 text-center max-w-lg mx-auto my-12">
            <Truck className="w-12 h-12 text-slate-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white">No Freight Listings Found</h3>
            <p className="mt-2 text-sm text-slate-300">
              {activeTab === 'my-listings'
                ? "You haven't posted any freight listings yet. Post your first load to get bids from verified transporters."
                : 'No open listings currently match your selected corridor and cargo filters.'}
            </p>
            <div className="mt-6 flex justify-center space-x-3">
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-4 py-2 bg-[#152E4A] hover:bg-[#1E3D60] text-slate-200 text-xs font-semibold rounded-xl border border-[#1E3D60] transition-colors"
              >
                Clear Filters
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!currentShipper) setIsAuthModalOpen(true);
                  else setIsPostModalOpen(true);
                }}
                className="px-4 py-2 bg-[#F59E0B] hover:bg-[#D97706] text-[#091827] text-xs font-bold rounded-xl transition-all"
              >
                + Post a Freight Listing
              </button>
            </div>
          </div>
        )}

        {/* Real Freight Listings Cards Grid */}
        {!isLoading && !error && listings.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
            {listings.map((item) => {
              const statusCfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.OPEN;
              const isOwner = currentShipper && currentShipper.id === item.shipperId;

              return (
                <div
                  key={item.id}
                  className="bg-[#0F2A44] border border-[#1E3D60] hover:border-[#2A4F78] rounded-2xl p-6 flex flex-col justify-between transition-all duration-300 shadow-xl group hover:-translate-y-1 relative"
                >
                  {/* Top Status & Timestamp Header */}
                  <div>
                    <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#1E3D60]/60 text-xs">
                      <span
                        className={`inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${statusCfg.badge}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                        <span>{statusCfg.label}</span>
                      </span>

                      <span className="text-[11px] text-slate-400 flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        {new Date(item.pickupDate).toLocaleDateString('en-IN', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>

                    {/* Route Corridor Indicator */}
                    <div className="space-y-2 mb-4">
                      <div className="flex items-start space-x-2.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-[#38BDF8] mt-1 shrink-0" />
                        <div>
                          <p className="text-[10px] uppercase font-bold text-slate-400">Origin</p>
                          <p className="text-sm font-bold text-white line-clamp-1">{item.origin}</p>
                        </div>
                      </div>

                      <div className="ml-1 pl-3 border-l-2 border-dashed border-[#1E3D60] py-0.5 text-[11px] text-slate-400">
                        Direct Corridor
                      </div>

                      <div className="flex items-start space-x-2.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-[#F59E0B] mt-1 shrink-0" />
                        <div>
                          <p className="text-[10px] uppercase font-bold text-slate-400">Destination</p>
                          <p className="text-sm font-bold text-white line-clamp-1">{item.destination}</p>
                        </div>
                      </div>
                    </div>

                    {/* Commodity & Weight Specs */}
                    <div className="bg-[#091827]/80 rounded-xl p-3 border border-[#1E3D60] space-y-2 text-xs mb-4">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 flex items-center">
                          <Package className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                          Cargo Type
                        </span>
                        <span className="font-semibold text-white">{item.cargoCategory}</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 flex items-center">
                          <Truck className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                          Capacity
                        </span>
                        <span className="font-bold text-[#F59E0B]">{item.weightDisplay}</span>
                      </div>

                      {item.cargoDescription && (
                        <p className="text-[11px] text-slate-300 italic line-clamp-2 pt-1 border-t border-[#1E3D60]/50">
                          "{item.cargoDescription}"
                        </p>
                      )}
                    </div>

                    {/* Shipper Business Card */}
                    <div className="flex items-center space-x-2.5 text-xs text-slate-300 mb-5">
                      <div className="w-7 h-7 rounded-lg bg-[#152E4A] border border-[#1E3D60] flex items-center justify-center text-[#F59E0B] font-bold shrink-0">
                        {item.businessName ? item.businessName[0] : 'S'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-white truncate">{item.businessName}</p>
                        <p className="text-[10px] text-slate-400 truncate">Contact: {item.shipperName}</p>
                      </div>
                    </div>
                  </div>

                  {/* Pricing and Action Footer */}
                  <div className="pt-3 border-t border-[#1E3D60]/60">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-[10px] uppercase font-bold text-slate-400">Offered Rate</p>
                        <p className="text-lg font-extrabold text-white">{item.offeredPriceFormatted}</p>
                      </div>
                      <span className="text-[11px] font-semibold text-slate-400 bg-[#091827] px-2 py-0.5 rounded border border-[#1E3D60]">
                        {item.priceType}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedListing(item);
                          setIsDetailModalOpen(true);
                        }}
                        className="flex-1 py-2 text-xs font-bold text-center text-slate-200 hover:text-white bg-[#152E4A] hover:bg-[#1E3D60] border border-[#1E3D60] rounded-xl transition-colors"
                      >
                        Details
                      </button>

                      {/* Owner Specific Controls */}
                      {isOwner && (
                        <>
                          <button
                            type="button"
                            onClick={() => openBidsModal(item)}
                            className="px-2.5 py-1.5 text-xs font-bold text-amber-300 hover:text-white bg-[#152E4A] hover:bg-amber-950/40 border border-amber-500/30 rounded-xl transition-colors"
                            title="Review Transporter Quotes & Bids"
                          >
                            Bids
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedListing(item);
                              setIsEditModalOpen(true);
                            }}
                            className="p-2 text-slate-300 hover:text-[#F59E0B] bg-[#152E4A] hover:bg-[#1E3D60] border border-[#1E3D60] rounded-xl transition-colors"
                            title="Edit Freight Listing"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              if (confirm('Are you sure you want to delete this freight listing?')) {
                                try {
                                  const res = await fetch(`/api/listings/${item.id}`, {
                                    method: 'DELETE',
                                    headers: { Authorization: `Bearer ${authToken}` },
                                  });
                                  const d = await res.json();
                                  if (res.ok) {
                                    showToast('success', 'Listing deleted');
                                    fetchListings();
                                  } else {
                                    showToast('error', d.message || 'Delete failed');
                                  }
                                } catch {
                                  showToast('error', 'Network error');
                                }
                              }
                            }}
                            className="p-2 text-slate-300 hover:text-rose-400 bg-[#152E4A] hover:bg-[#1E3D60] border border-[#1E3D60] rounded-xl transition-colors"
                            title="Delete Freight Listing"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}

                      {!isOwner && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedListing(item);
                            setIsDetailModalOpen(true);
                          }}
                          className="px-3 py-2 text-xs font-bold text-[#091827] bg-[#F59E0B] hover:bg-[#D97706] rounded-xl transition-all"
                        >
                          Book Load
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination Controls */}
        {!isLoading && !error && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between mt-10 pt-6 border-t border-[#1E3D60]">
            <p className="text-xs text-slate-400">
              Showing page <strong className="text-white">{pagination.page}</strong> of{' '}
              <strong className="text-white">{pagination.totalPages}</strong> ({pagination.totalCount} total listings)
            </p>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                disabled={!pagination.hasPrevPage}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 text-xs font-semibold text-slate-300 bg-[#0F2A44] border border-[#1E3D60] rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#152E4A]"
              >
                <ChevronLeft className="w-4 h-4 inline mr-1" />
                Previous
              </button>
              <button
                type="button"
                disabled={!pagination.hasNextPage}
                onClick={() => setCurrentPage((p) => p + 1)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-300 bg-[#0F2A44] border border-[#1E3D60] rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#152E4A]"
              >
                Next
                <ChevronRight className="w-4 h-4 inline ml-1" />
              </button>
            </div>
          </div>
        )}
          </>
        )}
      </main>

      {/* MODAL 1: Create Freight Listing */}
      {isPostModalOpen && (
        <CreateListingModal
          onClose={() => setIsPostModalOpen(false)}
          onSuccess={(msg) => {
            setIsPostModalOpen(false);
            showToast('success', msg);
            fetchListings();
          }}
          authToken={authToken}
          currentShipper={currentShipper}
        />
      )}

      {/* MODAL 2: View Full Listing Details */}
      {isDetailModalOpen && selectedListing && (
        <ListingDetailModal
          listing={selectedListing}
          onClose={() => {
            setIsDetailModalOpen(false);
            setSelectedListing(null);
          }}
          currentShipper={currentShipper}
          authToken={authToken}
          onUpdateStatus={async (newStatus) => {
            try {
              const res = await fetch(`/api/listings/${selectedListing.id}/status`, {
                method: 'PATCH',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${authToken}`,
                },
                body: JSON.stringify({ status: newStatus }),
              });
              const d = await res.json();
              if (res.ok) {
                showToast('success', `Status updated to ${newStatus}`);
                setIsDetailModalOpen(false);
                fetchListings();
              } else {
                showToast('error', d.message || 'Status update failed');
              }
            } catch {
              showToast('error', 'Network error');
            }
          }}
        />
      )}

      {/* MODAL 3: Edit Freight Listing (Owner protected) */}
      {isEditModalOpen && selectedListing && (
        <EditListingModal
          listing={selectedListing}
          authToken={authToken}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedListing(null);
          }}
          onSuccess={(msg) => {
            setIsEditModalOpen(false);
            setSelectedListing(null);
            showToast('success', msg);
            fetchListings();
          }}
        />
      )}

      {/* MODAL 4: Shipper Quick Authentication */}
      {isAuthModalOpen && (
        <ShipperAuthModal
          onClose={() => setIsAuthModalOpen(false)}
          onDemoSelect={(idx) => loginDemoShipper(idx)}
        />
      )}

      {/* MODAL 5: Transporter Bids Review Modal for Owning Shipper */}
      {isBidsModalOpen && bidsListing && (
        <ShipperBidsReviewModal
          listing={bidsListing}
          bids={bidsList}
          isLoading={bidsLoading}
          reviewingBidId={reviewingBidId}
          onReview={handleReviewBid}
          onClose={() => {
            setIsBidsModalOpen(false);
            setBidsListing(null);
          }}
        />
      )}

      {/* Notifications Drawer (Phase 6) */}
      <NotificationDrawer
        isOpen={isNotificationDrawerOpen}
        onClose={() => {
          setIsNotificationDrawerOpen(false);
          fetchUnreadCount();
        }}
        authToken={authToken}
      />

      {/* MODAL 6: Delivery Dispute Modal (Phase 6) */}
      {disputeBookingModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-[#0F2A44] border border-[#1E3D60] rounded-2xl max-w-md w-full p-6 shadow-2xl relative space-y-4">
            <button
              type="button"
              onClick={() => setDisputeBookingModal(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-[#152E4A]"
            >
              <X className="w-5 h-5" />
            </button>
            <div>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/30">
                Booking #{disputeBookingModal.bookingNumber}
              </span>
              <h2 className="text-lg font-extrabold text-white mt-1.5">
                Report Delivery Issue / Open Dispute
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                If the cargo was damaged, short-delivered, or proof is invalid, state the specific reason. RouteWise operations will mediate.
              </p>
            </div>
            <form onSubmit={handleSubmitDispute} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1">
                  Dispute Reason / Issue Description *
                </label>
                <textarea
                  rows="3"
                  required
                  value={disputeReasonInput}
                  onChange={(e) => setDisputeReasonInput(e.target.value)}
                  placeholder="e.g. 5 bags damaged due to water ingress; signed receiver name does not match warehouse gate staff."
                  className="w-full px-3 py-2 bg-[#091827] border border-[#1E3D60] rounded-xl text-xs text-white focus:outline-none focus:border-rose-400"
                />
              </div>
              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setDisputeBookingModal(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-[#11253B] border border-[#1E3D60] rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingDispute}
                  className="px-5 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white rounded-xl shadow disabled:opacity-50"
                >
                  {isSubmittingDispute ? 'Submitting...' : 'Submit Dispute'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// -------------------------------------------------------------
// SUB-COMPONENT: Create Listing Modal
// -------------------------------------------------------------
function CreateListingModal({ onClose, onSuccess, authToken, currentShipper }) {
  const [formData, setFormData] = useState(() => ({
    origin: '',
    destination: '',
    cargoCategory: 'Agricultural Goods',
    cargoDescription: '',
    weight: '',
    weightUnit: 'Tons',
    pickupDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    deliveryDate: '',
    offeredPrice: '',
    priceType: 'FIXED',
    vehicleRequirements: ['24ft Closed Container (9 - 10 Ton)'],
    notes: '',
  }));

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/listings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          ...formData,
          weight: parseFloat(formData.weight),
          offeredPrice: parseFloat(formData.offeredPrice),
        }),
      });

      const data = await res.json();
      if (res.ok) {
        onSuccess(data.message || 'Listing published successfully');
      } else {
        if (data.errors) setErrors(data.errors);
        else alert(data.message || 'Failed to create listing');
      }
    } catch {
      alert('Network error while creating listing.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-[#0F2A44] border border-[#1E3D60] rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative my-8">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-[#152E4A]"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-[#152E4A] border border-[#1E3D60] flex items-center justify-center text-[#F59E0B]">
            <Plus className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Post New Freight Demand</h2>
            <p className="text-xs text-slate-400">
              Publish directly to verified transporters as{' '}
              <strong className="text-white">{currentShipper?.businessName}</strong>
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Origin & Destination */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Origin City / Logistics Hub *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Gorakhpur Wholesale Grain Mandi, UP"
                value={formData.origin}
                onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                className="w-full px-3 py-2.5 bg-[#091827] border border-[#1E3D60] rounded-xl text-white focus:outline-none focus:border-[#F59E0B]"
              />
              {errors.origin && <p className="text-rose-400 text-[11px] mt-1">{errors.origin}</p>}
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Destination City / Hub *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Lucknow Transport Nagar, UP"
                value={formData.destination}
                onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                className="w-full px-3 py-2.5 bg-[#091827] border border-[#1E3D60] rounded-xl text-white focus:outline-none focus:border-[#F59E0B]"
              />
              {errors.destination && (
                <p className="text-rose-400 text-[11px] mt-1">{errors.destination}</p>
              )}
            </div>
          </div>

          {/* Cargo Category & Description */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Cargo Category *</label>
              <select
                value={formData.cargoCategory}
                onChange={(e) => setFormData({ ...formData, cargoCategory: e.target.value })}
                className="w-full px-3 py-2.5 bg-[#091827] border border-[#1E3D60] rounded-xl text-white focus:outline-none focus:border-[#F59E0B]"
              >
                {CARGO_OPTIONS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Weight / Capacity *
              </label>
              <div className="flex space-x-2">
                <input
                  type="number"
                  step="0.1"
                  required
                  placeholder="e.g. 10.5"
                  value={formData.weight}
                  onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                  className="w-full px-3 py-2.5 bg-[#091827] border border-[#1E3D60] rounded-xl text-white focus:outline-none focus:border-[#F59E0B]"
                />
                <select
                  value={formData.weightUnit}
                  onChange={(e) => setFormData({ ...formData, weightUnit: e.target.value })}
                  className="w-24 px-2 py-2.5 bg-[#091827] border border-[#1E3D60] rounded-xl text-white focus:outline-none focus:border-[#F59E0B]"
                >
                  <option value="Tons">Tons</option>
                  <option value="Quintals">Quintals</option>
                  <option value="Kg">Kg</option>
                </select>
              </div>
              {errors.weight && <p className="text-rose-400 text-[11px] mt-1">{errors.weight}</p>}
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Cargo Details / Commodity</label>
            <input
              type="text"
              placeholder="e.g. 200 bags of processed grain, palletized"
              value={formData.cargoDescription}
              onChange={(e) => setFormData({ ...formData, cargoDescription: e.target.value })}
              className="w-full px-3 py-2.5 bg-[#091827] border border-[#1E3D60] rounded-xl text-white focus:outline-none focus:border-[#F59E0B]"
            />
          </div>

          {/* Pricing & Pickup Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Offered Price (INR) *</label>
              <div className="flex space-x-2">
                <input
                  type="number"
                  required
                  placeholder="e.g. 22000"
                  value={formData.offeredPrice}
                  onChange={(e) => setFormData({ ...formData, offeredPrice: e.target.value })}
                  className="w-full px-3 py-2.5 bg-[#091827] border border-[#1E3D60] rounded-xl text-white focus:outline-none focus:border-[#F59E0B]"
                />
                <select
                  value={formData.priceType}
                  onChange={(e) => setFormData({ ...formData, priceType: e.target.value })}
                  className="w-28 px-2 py-2.5 bg-[#091827] border border-[#1E3D60] rounded-xl text-white focus:outline-none focus:border-[#F59E0B]"
                >
                  <option value="FIXED">Fixed</option>
                  <option value="NEGOTIABLE">Negotiable</option>
                  <option value="PER_TON">Per Ton</option>
                </select>
              </div>
              {errors.offeredPrice && (
                <p className="text-rose-400 text-[11px] mt-1">{errors.offeredPrice}</p>
              )}
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Pickup Date *</label>
              <input
                type="date"
                required
                value={formData.pickupDate}
                onChange={(e) => setFormData({ ...formData, pickupDate: e.target.value })}
                className="w-full px-3 py-2.5 bg-[#091827] border border-[#1E3D60] rounded-xl text-white focus:outline-none focus:border-[#F59E0B]"
              />
              {errors.pickupDate && (
                <p className="text-rose-400 text-[11px] mt-1">{errors.pickupDate}</p>
              )}
            </div>
          </div>

          {/* Vehicle Requirements */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Vehicle Body Requirement
            </label>
            <select
              value={formData.vehicleRequirements[0] || VEHICLE_OPTIONS[0]}
              onChange={(e) => setFormData({ ...formData, vehicleRequirements: [e.target.value] })}
              className="w-full px-3 py-2.5 bg-[#091827] border border-[#1E3D60] rounded-xl text-white focus:outline-none focus:border-[#F59E0B]"
            >
              {VEHICLE_OPTIONS.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>

          {/* Dock Notes */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Loading Dock / Dispatch Notes
            </label>
            <textarea
              rows={2}
              placeholder="Forklift loading available, dock operating hours 8 AM - 6 PM..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 bg-[#091827] border border-[#1E3D60] rounded-xl text-white focus:outline-none focus:border-[#F59E0B]"
            />
          </div>

          <div className="pt-4 flex items-center justify-end space-x-3 border-t border-[#1E3D60]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-slate-300 hover:text-white bg-[#152E4A] rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-[#F59E0B] hover:bg-[#D97706] text-[#091827] font-bold rounded-xl shadow-lg transition-all disabled:opacity-50"
            >
              {isSubmitting ? 'Publishing...' : 'Publish to Marketplace'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// SUB-COMPONENT: Edit Listing Modal
// -------------------------------------------------------------
function EditListingModal({ listing, authToken, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    origin: listing.origin,
    destination: listing.destination,
    cargoCategory: listing.cargoCategory,
    cargoDescription: listing.cargoDescription || '',
    weight: listing.weight,
    weightUnit: listing.weightUnit,
    offeredPrice: listing.offeredPrice,
    priceType: listing.priceType,
    notes: listing.notes || '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch(`/api/listings/${listing.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          ...formData,
          weight: parseFloat(formData.weight),
          offeredPrice: parseFloat(formData.offeredPrice),
        }),
      });

      const data = await res.json();
      if (res.ok) {
        onSuccess('Freight listing updated successfully');
      } else {
        setErrorMsg(data.message || 'Update failed');
      }
    } catch {
      setErrorMsg('Network error while updating listing');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-[#0F2A44] border border-[#1E3D60] rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl relative my-8">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-[#152E4A]"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-xl font-bold text-white mb-2">Edit Freight Listing</h2>
        <p className="text-xs text-slate-400 mb-6">
          Modify route, offered price, and commodity specifications.
        </p>

        {errorMsg && (
          <div className="bg-rose-950/50 border border-rose-500/50 p-3 rounded-xl text-rose-300 text-xs mb-4">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleUpdate} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Origin</label>
              <input
                type="text"
                required
                value={formData.origin}
                onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                className="w-full px-3 py-2 bg-[#091827] border border-[#1E3D60] rounded-xl text-white"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Destination</label>
              <input
                type="text"
                required
                value={formData.destination}
                onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                className="w-full px-3 py-2 bg-[#091827] border border-[#1E3D60] rounded-xl text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Offered Price (INR)</label>
              <input
                type="number"
                required
                value={formData.offeredPrice}
                onChange={(e) => setFormData({ ...formData, offeredPrice: e.target.value })}
                className="w-full px-3 py-2 bg-[#091827] border border-[#1E3D60] rounded-xl text-white"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Price Structure</label>
              <select
                value={formData.priceType}
                onChange={(e) => setFormData({ ...formData, priceType: e.target.value })}
                className="w-full px-3 py-2 bg-[#091827] border border-[#1E3D60] rounded-xl text-white"
              >
                <option value="FIXED">Fixed</option>
                <option value="NEGOTIABLE">Negotiable</option>
                <option value="PER_TON">Per Ton</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Cargo Description</label>
            <input
              type="text"
              value={formData.cargoDescription}
              onChange={(e) => setFormData({ ...formData, cargoDescription: e.target.value })}
              className="w-full px-3 py-2 bg-[#091827] border border-[#1E3D60] rounded-xl text-white"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Special Notes</label>
            <textarea
              rows={2}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 bg-[#091827] border border-[#1E3D60] rounded-xl text-white"
            />
          </div>

          <div className="pt-4 flex items-center justify-end space-x-3 border-t border-[#1E3D60]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-300 hover:text-white bg-[#152E4A] rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-[#F59E0B] hover:bg-[#D97706] text-[#091827] font-bold rounded-xl disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// SUB-COMPONENT: Listing Detail Modal
// -------------------------------------------------------------
function ListingDetailModal({ listing, onClose, currentShipper, onUpdateStatus }) {
  const isOwner = currentShipper && currentShipper.id === listing.shipperId;
  const statusCfg = STATUS_CONFIG[listing.status] || STATUS_CONFIG.OPEN;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-[#0F2A44] border border-[#1E3D60] rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl relative my-8">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-[#152E4A]"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center space-x-3 mb-6">
          <span
            className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${statusCfg.badge}`}
          >
            <span className={`w-2 h-2 rounded-full ${statusCfg.dot}`} />
            <span>{statusCfg.label}</span>
          </span>
          <span className="text-xs text-slate-400">ID: {listing.id.slice(-8)}</span>
        </div>

        {/* Route Details */}
        <div className="bg-[#091827] rounded-2xl p-4 border border-[#1E3D60] mb-6 space-y-3">
          <div className="flex items-start space-x-3">
            <div className="w-3 h-3 rounded-full bg-[#38BDF8] mt-1 shrink-0" />
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400">Dispatch Location</p>
              <p className="text-sm font-bold text-white">{listing.origin}</p>
            </div>
          </div>
          <div className="ml-1 pl-4 border-l-2 border-dashed border-[#1E3D60] py-1 text-xs text-slate-400">
            Regional Freight Corridor
          </div>
          <div className="flex items-start space-x-3">
            <div className="w-3 h-3 rounded-full bg-[#F59E0B] mt-1 shrink-0" />
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400">Delivery Destination</p>
              <p className="text-sm font-bold text-white">{listing.destination}</p>
            </div>
          </div>
        </div>

        {/* Specs Table */}
        <div className="grid grid-cols-2 gap-3 mb-6 text-xs">
          <div className="bg-[#091827] p-3 rounded-xl border border-[#1E3D60]">
            <p className="text-slate-400 text-[11px]">Commodity</p>
            <p className="font-bold text-white mt-0.5">{listing.cargoCategory}</p>
          </div>
          <div className="bg-[#091827] p-3 rounded-xl border border-[#1E3D60]">
            <p className="text-slate-400 text-[11px]">Weight / Load</p>
            <p className="font-bold text-[#F59E0B] mt-0.5">{listing.weightDisplay}</p>
          </div>
          <div className="bg-[#091827] p-3 rounded-xl border border-[#1E3D60]">
            <p className="text-slate-400 text-[11px]">Offered Price</p>
            <p className="font-bold text-white mt-0.5">
              {listing.offeredPriceFormatted}{' '}
              <span className="text-[10px] text-slate-400">({listing.priceType})</span>
            </p>
          </div>
          <div className="bg-[#091827] p-3 rounded-xl border border-[#1E3D60]">
            <p className="text-slate-400 text-[11px]">Pickup Window</p>
            <p className="font-bold text-white mt-0.5">
              {new Date(listing.pickupDate).toLocaleDateString('en-IN', {
                dateStyle: 'medium',
              })}
            </p>
          </div>
        </div>

        {/* Vehicle Requirements */}
        {listing.vehicleRequirements && listing.vehicleRequirements.length > 0 && (
          <div className="mb-6">
            <p className="text-xs font-semibold text-slate-400 mb-2">Vehicle Specifications</p>
            <div className="flex flex-wrap gap-2">
              {listing.vehicleRequirements.map((v) => (
                <span
                  key={v}
                  className="px-2.5 py-1 text-xs bg-[#152E4A] border border-[#1E3D60] text-slate-200 rounded-lg"
                >
                  {v}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Loading Dock Notes */}
        {listing.notes && (
          <div className="bg-[#11253B] border border-[#1E3D60] rounded-xl p-3 mb-6 text-xs text-slate-300">
            <span className="font-bold text-amber-300 mr-1">Instructions:</span>
            {listing.notes}
          </div>
        )}

        {/* Shipper Contact Card */}
        <div className="bg-[#091827] rounded-xl p-4 border border-[#1E3D60] mb-6 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-[#152E4A] flex items-center justify-center text-[#F59E0B] font-bold">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">{listing.businessName}</p>
              <p className="text-xs text-slate-400">Contact: {listing.shipperName}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <a
              href={`tel:${listing.contactPhone}`}
              className="p-2.5 bg-[#152E4A] hover:bg-[#1E3D60] text-emerald-400 rounded-xl border border-[#1E3D60]"
              title="Call Shipper"
            >
              <Phone className="w-4 h-4" />
            </a>
            {listing.contactEmail && (
              <a
                href={`mailto:${listing.contactEmail}`}
                className="p-2.5 bg-[#152E4A] hover:bg-[#1E3D60] text-[#38BDF8] rounded-xl border border-[#1E3D60]"
                title="Email Shipper"
              >
                <Mail className="w-4 h-4" />
              </a>
            )}
          </div>
        </div>

        {/* Owner Status Management Bar */}
        {isOwner && (
          <div className="pt-4 border-t border-[#1E3D60] flex items-center justify-between">
            <span className="text-xs text-slate-400">Update Status:</span>
            <div className="flex items-center space-x-2">
              {listing.status !== 'ASSIGNED' && (
                <button
                  type="button"
                  onClick={() => onUpdateStatus('ASSIGNED')}
                  className="px-3 py-1.5 text-xs font-semibold bg-sky-500/20 text-sky-300 border border-sky-500/30 rounded-lg hover:bg-sky-500/30"
                >
                  Mark Assigned
                </button>
              )}
              {listing.status !== 'COMPLETED' && (
                <button
                  type="button"
                  onClick={() => onUpdateStatus('COMPLETED')}
                  className="px-3 py-1.5 text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-lg hover:bg-emerald-500/30"
                >
                  Mark Completed
                </button>
              )}
              {listing.status !== 'CANCELLED' && (
                <button
                  type="button"
                  onClick={() => onUpdateStatus('CANCELLED')}
                  className="px-3 py-1.5 text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-lg hover:bg-rose-500/30"
                >
                  Cancel Load
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// SUB-COMPONENT: Quick Shipper Authentication Modal
// -------------------------------------------------------------
function ShipperAuthModal({ onClose, onDemoSelect }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#0F2A44] border border-[#1E3D60] rounded-3xl max-w-md w-full p-8 shadow-2xl relative">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-[#152E4A]"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-[#152E4A] border border-[#1E3D60] flex items-center justify-center text-[#F59E0B] mx-auto mb-3">
            <Building2 className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-white">Shipper Portal Access</h2>
          <p className="mt-1 text-xs text-slate-300">
            Sign in with a verified business profile to create freight demands and manage shipments.
          </p>
        </div>

        <div className="space-y-3">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 text-center">
            Instant Test Sessions:
          </p>

          <button
            type="button"
            onClick={() => onDemoSelect(1)}
            className="w-full p-3.5 bg-[#091827] hover:bg-[#152E4A] border border-[#1E3D60] hover:border-[#F59E0B] rounded-xl text-left transition-all group"
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-white text-xs group-hover:text-[#F59E0B]">
                Purvanchal Agro Commodities Ltd.
              </span>
              <span className="text-[10px] bg-amber-500/20 text-[#F59E0B] px-2 py-0.5 rounded font-mono">
                Shipper A
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Rajesh Verma • Gorakhpur to Lucknow Corridor
            </p>
          </button>

          <button
            type="button"
            onClick={() => onDemoSelect(2)}
            className="w-full p-3.5 bg-[#091827] hover:bg-[#152E4A] border border-[#1E3D60] hover:border-[#F59E0B] rounded-xl text-left transition-all group"
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-white text-xs group-hover:text-[#F59E0B]">
                Avadh Steel & Hardware Trading
              </span>
              <span className="text-[10px] bg-sky-500/20 text-sky-400 px-2 py-0.5 rounded font-mono">
                Shipper B
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Sunil Jaiswal • Kanpur to Varanasi Corridor
            </p>
          </button>
        </div>

        <div className="mt-6 pt-4 border-t border-[#1E3D60] text-center">
          <Link
            to="/admin"
            className="text-xs font-semibold text-[#F59E0B] hover:text-amber-300 transition-colors"
          >
            RouteWise Admin Operations Portal &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// SUB-COMPONENT: Shipper Review Transporter Quotes / Bids Modal
// -------------------------------------------------------------
function ShipperBidsReviewModal({ listing, bids, isLoading, reviewingBidId, onReview, onClose }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-[#0F2A44] border border-[#1E3D60] rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto space-y-6">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-[#152E4A]"
        >
          <X className="w-5 h-5" />
        </button>

        <div>
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">
            Shipper Load Management
          </span>
          <h2 className="text-xl font-extrabold text-white mt-1.5">
            Review Transporter Quotes & Bids
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {listing.route} • {listing.cargoCategory} ({listing.weightDisplay}) • Listed Rate: {listing.offeredPriceFormatted}
          </p>
        </div>

        {isLoading ? (
          <div className="py-12 text-center text-slate-400 text-sm">Loading quotes from verified transporters...</div>
        ) : bids.length === 0 ? (
          <div className="bg-[#091827] border border-[#1E3D60] rounded-2xl p-8 text-center space-y-3">
            <Truck className="w-10 h-10 text-slate-500 mx-auto" />
            <h4 className="text-sm font-bold text-white">No Quotes Submitted Yet</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Transporters browsing the regional corridor will submit bids directly. You will be able to review their quotes and accept bids here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {bids.map((bid) => {
              const isPending = bid.status === 'PENDING';
              const isAccepted = bid.status === 'ACCEPTED';
              const isRejected = bid.status === 'REJECTED';
              const isWithdrawn = bid.status === 'WITHDRAWN';

              return (
                <div
                  key={bid.id}
                  className="bg-[#091827] border border-[#1E3D60] rounded-2xl p-4.5 space-y-3"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-white text-sm">{bid.fleetName}</span>
                        <span className="text-xs text-slate-400">({bid.transporterName})</span>
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5 flex items-center space-x-3">
                        <span className="text-emerald-400 font-semibold">{bid.transporterPhone}</span>
                        {bid.transporterEmail && <span>• {bid.transporterEmail}</span>}
                      </div>

                      {/* Transporter Trust & Verification Indicators (Phase 6) */}
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        {bid.transporterVerificationStatus === 'APPROVED' ? (
                          <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Verified Transporter
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                            Unverified Transporter
                          </span>
                        )}
                        <span className="text-[11px] text-slate-400">
                          <strong className="text-white">{bid.transporterCompletedBookings || 0}</strong> verified {bid.transporterCompletedBookings === 1 ? 'trip completed' : 'trips completed'}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-base font-extrabold text-[#F59E0B]">
                        {bid.proposedRateFormatted}
                      </span>
                      <span
                        className={`block text-[10px] font-bold uppercase mt-0.5 px-2 py-0.5 rounded-full border text-center ${
                          isAccepted
                            ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                            : isRejected
                            ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                            : isWithdrawn
                            ? 'bg-slate-500/15 text-slate-400 border-slate-500/30'
                            : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                        }`}
                      >
                        {bid.status}
                      </span>
                    </div>
                  </div>

                  <div className="bg-[#11253B] rounded-xl p-3 text-xs space-y-1 text-slate-300 border border-[#1E3D60]">
                    <div>
                      <span className="text-slate-400 font-semibold">Vehicle Quoted: </span>
                      <span>{bid.proposedVehicle || 'Standard Fleet'}</span>
                    </div>
                    {bid.availableFromDate && (
                      <div>
                        <span className="text-slate-400 font-semibold">Available Date: </span>
                        <span>{new Date(bid.availableFromDate).toLocaleDateString('en-IN')}</span>
                      </div>
                    )}
                    {bid.message && (
                      <div className="pt-1 text-slate-300 italic">
                        &ldquo;{bid.message}&rdquo;
                      </div>
                    )}
                  </div>

                  {isPending && (
                    <div className="flex items-center justify-end space-x-2 pt-1">
                      <button
                        type="button"
                        disabled={reviewingBidId === bid.id}
                        onClick={() => onReview(bid.id, 'REJECTED')}
                        className="px-3.5 py-1.5 text-xs font-semibold text-rose-300 hover:text-white bg-[#152E4A] hover:bg-rose-950/60 border border-rose-500/30 rounded-xl transition-all disabled:opacity-50"
                      >
                        Decline Quote
                      </button>
                      <button
                        type="button"
                        disabled={reviewingBidId === bid.id}
                        onClick={() => onReview(bid.id, 'ACCEPTED')}
                        className="px-4 py-1.5 text-xs font-bold text-[#091827] bg-[#F59E0B] hover:bg-[#D97706] rounded-xl shadow transition-all disabled:opacity-50"
                      >
                        {reviewingBidId === bid.id ? 'Processing...' : 'Accept Bid'}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="pt-3 border-t border-[#1E3D60] text-right">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-[#11253B] border border-[#1E3D60] rounded-xl"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// SUB-COMPONENT: Shipper Confirmed Bookings Section (Phase 5)
// -------------------------------------------------------------
function ShipperBookingsSection({
  bookings,
  isLoading,
  completingBookingId,
  cancellingBookingId,
  onComplete,
  onCancel,
  onDispute,
  onDownloadProofDoc,
  onRefresh,
}) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0F2A44] border border-[#1E3D60] rounded-2xl p-6">
        <div>
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            Phase 6 Verified Delivery & Trust
          </span>
          <h2 className="text-xl font-extrabold text-white mt-1">Confirmed Shipper Bookings</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Track confirmed loads, inspect uploaded proof-of-delivery documents, confirm receipt, or file mediation disputes.
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
          Loading confirmed booking records from MongoDB Atlas...
        </div>
      ) : bookings.length === 0 ? (
        <div className="bg-[#0F2A44]/50 border border-dashed border-[#1E3D60] rounded-3xl p-12 text-center max-w-lg mx-auto my-8">
          <Truck className="w-12 h-12 text-slate-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white">No Active Bookings Yet</h3>
          <p className="mt-2 text-sm text-slate-300">
            When you accept a transporter quote from your listings, the load is atomically assigned and confirmed here with live lifecycle tracking.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-6">
          {bookings.map((b) => {
            const statusCfg = BOOKING_STATUS_CONFIG[b.status] || BOOKING_STATUS_CONFIG.CONFIRMED;
            const isDelivered = b.status === 'DELIVERED';
            const isConfirmed = b.status === 'CONFIRMED';
            const isCompleted = b.status === 'COMPLETED';
            const isCancelled = b.status === 'CANCELLED';
            const evidenceStatus = b.deliveryProof?.evidenceStatus || (isDelivered ? 'SUBMITTED' : 'NONE');
            const isDisputed = evidenceStatus === 'DISPUTED';

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
                      {new Date(b.scheduledPickupDate).toLocaleDateString('en-IN', {
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
                        <p className="text-[10px] uppercase font-bold text-slate-400">Origin</p>
                        <p className="text-sm font-bold text-white">{b.origin}</p>
                      </div>
                    </div>
                    <div className="ml-1 pl-3 border-l-2 border-dashed border-[#1E3D60] py-0.5 text-[11px] text-slate-400">
                      Corridor Transit
                    </div>
                    <div className="flex items-start space-x-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#F59E0B] mt-1 shrink-0" />
                      <div>
                        <p className="text-[10px] uppercase font-bold text-slate-400">Destination</p>
                        <p className="text-sm font-bold text-white">{b.destination}</p>
                      </div>
                    </div>
                  </div>

                  {/* Commercials and Transporter Snapshot */}
                  <div className="grid grid-cols-2 gap-3 mt-4 p-3 bg-[#091827] rounded-xl border border-[#1E3D60] text-xs">
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-bold">Agreed Rate</p>
                      <p className="text-sm font-extrabold text-[#F59E0B]">{b.agreedPriceFormatted}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-bold">Cargo & Vehicle</p>
                      <p className="text-xs font-semibold text-white truncate">
                        {b.weight} {b.weightUnit} • {b.vehicleType}
                      </p>
                    </div>
                    <div className="col-span-2 pt-2 border-t border-[#1E3D60]">
                      <p className="text-[10px] text-slate-400 uppercase font-bold">Assigned Transporter</p>
                      <div className="flex items-center justify-between mt-0.5">
                        <span className="text-xs font-bold text-white">{b.transporter?.fleetName}</span>
                        {b.transporter?.phone && (
                          <span className="text-xs font-semibold text-emerald-400">
                            📞 {b.transporter.phone}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Live Tracking Progress */}
                  <div className="mt-3 p-3 bg-[#11253B] rounded-xl border border-[#1E3D60] text-xs space-y-1.5 text-slate-300">
                    <p className="text-[10px] uppercase font-bold text-[#38BDF8]">Live Transit Status</p>
                    {b.actualPickupAt && (
                      <p className="text-[11px]">
                        ✓ Picked up: {new Date(b.actualPickupAt).toLocaleString('en-IN')}
                      </p>
                    )}
                    {b.transitLocation && (
                      <p className="text-[11px] text-amber-300">
                        📍 Checkpoint: {b.transitLocation} {b.transitNotes ? `— "${b.transitNotes}"` : ''}
                      </p>
                    )}
                    {b.deliveredAt && (
                      <p className="text-[11px] text-teal-300">
                        ✓ Delivery Reported: {new Date(b.deliveredAt).toLocaleString('en-IN')}{' '}
                        {b.recipientName ? `(Recipient: ${b.recipientName})` : ''}
                      </p>
                    )}
                    {isCompleted && b.completedAt && (
                      <p className="text-[11px] text-emerald-400 font-semibold">
                        ✓ Receipt Verified & Closed: {new Date(b.completedAt).toLocaleString('en-IN')}
                      </p>
                    )}
                    {isCancelled && (
                      <p className="text-[11px] text-rose-400">
                        ✕ Cancelled: {b.cancellationReason || 'Prior to pickup'}
                      </p>
                    )}
                  </div>

                  {/* Proof of Delivery Details (Phase 6) */}
                  {(isDelivered || isCompleted || b.deliveryProof) && (
                    <div className="mt-3 p-3 bg-[#091827] rounded-xl border border-[#1E3D60] text-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-bold text-amber-400 flex items-center">
                          <FileCheck className="w-3.5 h-3.5 mr-1" />
                          Proof of Delivery (POD)
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            isDisputed
                              ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                              : isCompleted || evidenceStatus === 'VERIFIED'
                              ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                              : 'bg-teal-500/15 text-teal-300 border-teal-500/30'
                          }`}
                        >
                          {isDisputed ? 'DISPUTED' : isCompleted ? 'VERIFIED' : evidenceStatus}
                        </span>
                      </div>

                      {b.proofNotes && (
                        <p className="text-[11px] text-slate-300">
                          <span className="text-slate-400 font-semibold">POD Ref: </span>
                          {b.proofNotes}
                        </p>
                      )}

                      {b.deliveryProof?.deliveryNotes && (
                        <p className="text-[11px] text-slate-300 italic">
                          &ldquo;{b.deliveryProof.deliveryNotes}&rdquo;
                        </p>
                      )}

                      {b.deliveryProof?.disputeReason && (
                        <div className="p-2 bg-rose-950/40 border border-rose-500/30 rounded-lg text-rose-300 text-[11px]">
                          <strong className="block font-bold">Dispute Note:</strong>
                          {b.deliveryProof.disputeReason}
                        </div>
                      )}

                      {b.deliveryProof?.documents && b.deliveryProof.documents.length > 0 && (
                        <div className="space-y-1.5 pt-1">
                          <p className="text-[10px] text-slate-400 font-semibold">Attached Evidence Files:</p>
                          {b.deliveryProof.documents.map((doc) => (
                            <button
                              key={doc.id}
                              type="button"
                              onClick={() => onDownloadProofDoc?.(b.id, doc.id, doc.originalName)}
                              className="flex items-center justify-between w-full p-2 rounded-lg bg-[#11253B] hover:bg-[#152E4A] border border-[#1E3D60] text-slate-200 text-xs transition-colors"
                            >
                              <span className="flex items-center space-x-2 truncate">
                                <FileCheck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                <span className="truncate">{doc.originalName}</span>
                              </span>
                              <span className="text-[10px] text-amber-400 ml-2 shrink-0 font-bold">
                                View / Download ↗
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Shipper Actions */}
                <div className="pt-2 border-t border-[#1E3D60] flex items-center justify-between">
                  {isConfirmed && (
                    <button
                      type="button"
                      disabled={cancellingBookingId === b.id}
                      onClick={() => onCancel(b.id)}
                      className="px-3 py-1.5 text-xs font-semibold text-rose-300 hover:text-white bg-[#152E4A] hover:bg-rose-950/60 border border-rose-500/30 rounded-xl transition-all disabled:opacity-50"
                    >
                      {cancellingBookingId === b.id ? 'Releasing...' : 'Cancel Booking'}
                    </button>
                  )}

                  {isDelivered && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full">
                      <button
                        type="button"
                        onClick={() => onDispute(b)}
                        className="py-2 px-3 text-xs font-semibold text-rose-300 hover:text-white bg-[#152E4A] hover:bg-rose-950/60 border border-rose-500/30 rounded-xl transition-all"
                      >
                        ⚠️ Report Delivery Issue
                      </button>
                      <button
                        type="button"
                        disabled={completingBookingId === b.id}
                        onClick={() => onComplete(b.id)}
                        className="py-2 px-3 text-xs font-extrabold text-[#091827] bg-[#F59E0B] hover:bg-[#D97706] rounded-xl shadow-lg transition-all disabled:opacity-50"
                      >
                        {completingBookingId === b.id ? 'Confirming...' : '✓ Confirm Receipt & Close'}
                      </button>
                    </div>
                  )}

                  {isCompleted && (
                    <span className="text-xs text-emerald-400 font-bold flex items-center">
                      <CheckCircle2 className="w-4 h-4 mr-1" />
                      Booking Completed & Verified
                    </span>
                  )}

                  {isCancelled && (
                    <span className="text-xs text-rose-400 font-semibold">
                      Booking Cancelled & Vehicle Released
                    </span>
                  )}

                  {!isConfirmed && !isDelivered && !isCompleted && !isCancelled && (
                    <span className="text-xs text-indigo-300 font-medium">
                      Truck in transit • Live tracking active
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

