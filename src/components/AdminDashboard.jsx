import React, { useState, useEffect, useCallback } from 'react';
import {
  Shield,
  Lock,
  UserCheck,
  Truck,
  Search,
  RefreshCw,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  CheckCircle2,
  Clock,
  Phone,
  Mail,
  MapPin,
  X,
  AlertCircle,
  FileText,
  Save,
  RotateCcw,
  Boxes,
  Users,
  UserPlus,
  Trash2,
  ShieldCheck,
  Power,
  FileCheck,
  ExternalLink,
  AlertTriangle,
} from 'lucide-react';
import Logo from './Logo';

// Status badge styling helper
const STATUS_CONFIG = {
  SUBMITTED: {
    label: 'Submitted',
    color: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
    dot: 'bg-sky-400',
  },
  UNDER_REVIEW: {
    label: 'Under Review',
    color: 'bg-amber-500/15 text-[#F59E0B] border-amber-500/30',
    dot: 'bg-[#F59E0B]',
  },
  CONTACTED: {
    label: 'Contacted',
    color: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
    dot: 'bg-purple-400',
  },
  ACCEPTED: {
    label: 'Accepted',
    color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    dot: 'bg-emerald-400',
  },
  REJECTED: {
    label: 'Rejected',
    color: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
    dot: 'bg-rose-400',
  },
};

const VERIFICATION_STATUS_CONFIG = {
  NOT_SUBMITTED: {
    label: 'Not Submitted',
    color: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
    dot: 'bg-slate-400',
  },
  PENDING: {
    label: 'Pending Review',
    color: 'bg-amber-500/15 text-[#F59E0B] border-amber-500/30',
    dot: 'bg-[#F59E0B]',
  },
  UNDER_REVIEW: {
    label: 'Under Review',
    color: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
    dot: 'bg-sky-400',
  },
  APPROVED: {
    label: 'Approved & Verified',
    color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    dot: 'bg-emerald-400',
  },
  REJECTED: {
    label: 'Rejected',
    color: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
    dot: 'bg-rose-400',
  },
  CORRECTION_REQUIRED: {
    label: 'Correction Required',
    color: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
    dot: 'bg-orange-400',
  },
};

export default function AdminDashboard() {
  // Navigation View State: 'registrations' | 'admins' | 'verifications'
  const [activeView, setActiveView] = useState('registrations');

  // Authentication State
  const [token, setToken] = useState(() => localStorage.getItem('routewise_admin_token') || '');
  const [adminUser, setAdminUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Login Form State
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Dashboard Data State
  const [stats, setStats] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalCount: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  });

  // Filters State
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // UI / Interaction State
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [dataError, setDataError] = useState('');
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [updateNote, setUpdateNote] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [toastMessage, setToastMessage] = useState(null);

  // Admin Team Management State
  const [adminUsers, setAdminUsers] = useState([]);
  const [isLoadingAdmins, setIsLoadingAdmins] = useState(false);
  const [showAddAdminModal, setShowAddAdminModal] = useState(false);
  const [newAdminForm, setNewAdminForm] = useState({
    name: '',
    username: '',
    password: '',
    role: 'ADMIN',
  });
  const [showNewAdminPassword, setShowNewAdminPassword] = useState(false);
  const [addAdminError, setAddAdminError] = useState('');
  const [isAddingAdmin, setIsAddingAdmin] = useState(false);

  // Transporter Verifications State (Phase 6)
  const [verificationsList, setVerificationsList] = useState([]);
  const [verificationsLoading, setVerificationsLoading] = useState(false);
  const [verificationsPagination, setVerificationsPagination] = useState({
    page: 1,
    limit: 10,
    totalCount: 0,
    totalPages: 1,
  });
  const [verificationsFilterStatus, setVerificationsFilterStatus] = useState('ALL');
  const [verificationsPendingCount, setVerificationsPendingCount] = useState(0);

  const [selectedVerification, setSelectedVerification] = useState(null);
  const [verificationModalOpen, setVerificationModalOpen] = useState(false);
  const [reviewStatus, setReviewStatus] = useState('APPROVED');
  const [reviewNotes, setReviewNotes] = useState('');
  const [reviewReason, setReviewReason] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState('');

  // Search debounce
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
      setPagination((prev) => ({ ...prev, page: 1 }));
    }, 350);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Show toast notification helper
  const showToast = useCallback((msg, type = 'success') => {
    setToastMessage({ msg, type });
    setTimeout(() => setToastMessage(null), 3500);
  }, []);

  // Handle Logout
  const handleLogout = useCallback(() => {
    localStorage.removeItem('routewise_admin_token');
    setToken('');
    setAdminUser(null);
    setStats(null);
    setRegistrations([]);
    setAdminUsers([]);
    setSelectedRecord(null);
    setShowAddAdminModal(false);
    showToast('Signed out of Operations Console.', 'info');
  }, [showToast]);

  // Verify auth token on initial mount
  const verifyToken = useCallback(async (authToken) => {
    if (!authToken) {
      setAuthLoading(false);
      return;
    }
    try {
      const res = await fetch('/api/admin/auth/me', {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAdminUser(data.user);
      } else {
        handleLogout();
      }
    } catch {
      handleLogout();
    } finally {
      setAuthLoading(false);
    }
  }, [handleLogout]);

  useEffect(() => {
    verifyToken(token);
  }, [token, verifyToken]);

  // Fetch Summary Metrics
  const fetchStats = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/admin/stats', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  }, [token]);

  // Fetch Paginated Registrations
  const fetchRegistrations = useCallback(async () => {
    if (!token) return;
    setIsLoadingData(true);
    setDataError('');
    try {
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
      });
      if (roleFilter !== 'ALL') params.set('role', roleFilter);
      if (statusFilter !== 'ALL') params.set('status', statusFilter);
      if (debouncedSearch) params.set('search', debouncedSearch);

      const res = await fetch(`/api/admin/registrations?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        if (res.status === 401) {
          handleLogout();
          throw new Error('Session expired. Please log in again.');
        }
        throw new Error('Failed to retrieve registration records.');
      }

      const data = await res.json();
      setRegistrations(data.data);
      setPagination(data.pagination);
    } catch (err) {
      setDataError(err.message || 'Error loading dashboard data.');
    } finally {
      setIsLoadingData(false);
    }
  }, [token, pagination.page, pagination.limit, roleFilter, statusFilter, debouncedSearch, handleLogout]);

  // Fetch Admin Users List
  const fetchAdminUsers = useCallback(async () => {
    if (!token) return;
    setIsLoadingAdmins(true);
    try {
      const res = await fetch('/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAdminUsers(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch admin users:', err);
    } finally {
      setIsLoadingAdmins(false);
    }
  }, [token]);

  // Fetch Transporter Verifications (Phase 6)
  const fetchVerifications = useCallback(
    async (page = 1, status = verificationsFilterStatus) => {
      if (!token) return;
      setVerificationsLoading(true);
      try {
        let url = `/api/admin/verifications?page=${page}&limit=10`;
        if (status && status !== 'ALL') {
          url += `&status=${status}`;
        }
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setVerificationsList(data.data || []);
          if (data.pagination) {
            setVerificationsPagination(data.pagination);
          }
          if (status === 'ALL') {
            const pending = (data.data || []).filter(
              (v) => v.status === 'PENDING' || v.status === 'UNDER_REVIEW'
            ).length;
            setVerificationsPendingCount(pending);
          }
        }
      } catch (err) {
        console.error('Error fetching verifications:', err);
      } finally {
        setVerificationsLoading(false);
      }
    },
    [token, verificationsFilterStatus]
  );

  const handleInspectVerification = async (vId) => {
    try {
      const res = await fetch(`/api/admin/verifications/${vId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSelectedVerification(data.data);
        setReviewStatus('APPROVED');
        setReviewNotes('');
        setReviewReason('');
        setReviewError('');
        setReviewSuccess('');
        setVerificationModalOpen(true);
      } else {
        alert('Failed to load verification record');
      }
    } catch {
      alert('Network error retrieving verification details');
    }
  };

  const handleDownloadVerificationDoc = async (docId, originalName) => {
    try {
      const res = await fetch(`/api/verification/documents/${docId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        alert('Failed to retrieve protected document');
        return;
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = originalName || 'verification-document';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      alert('Error downloading document');
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!selectedVerification) return;
    if (
      (reviewStatus === 'REJECTED' || reviewStatus === 'CORRECTION_REQUIRED') &&
      !reviewReason.trim()
    ) {
      setReviewError('A specific reason is required for rejection or requesting corrections.');
      return;
    }
    setIsSubmittingReview(true);
    setReviewError('');
    try {
      const res = await fetch(`/api/admin/verifications/${selectedVerification.id}/review`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: reviewStatus,
          notes: reviewNotes.trim(),
          reason: reviewReason.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setReviewSuccess(`Verification updated to ${reviewStatus}`);
        fetchVerifications(verificationsPagination.page);
        const fresh = await fetch(`/api/admin/verifications/${selectedVerification.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (fresh.ok) {
          const freshData = await fresh.json();
          setSelectedVerification(freshData.data);
        }
        setTimeout(() => setVerificationModalOpen(false), 1200);
      } else {
        setReviewError(data.message || 'Failed to update review status.');
      }
    } catch {
      setReviewError('Network error submitting review.');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Load data when token or query parameters change
  useEffect(() => {
    if (token && adminUser) {
      fetchStats();
      if (activeView === 'registrations') {
        fetchRegistrations();
      } else if (activeView === 'admins') {
        fetchAdminUsers();
      } else if (activeView === 'verifications') {
        fetchVerifications();
      }
    }
  }, [token, adminUser, activeView, fetchStats, fetchRegistrations, fetchAdminUsers, fetchVerifications]);

  // Handle Admin Login
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');

    if (!loginForm.username.trim() || !loginForm.password) {
      setLoginError('Please enter both username and password.');
      return;
    }

    setIsLoggingIn(true);
    try {
      const res = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Authentication failed.');
      }

      localStorage.setItem('routewise_admin_token', data.token);
      setToken(data.token);
      setAdminUser(data.user);
      showToast('Logged in successfully as Administrator.');
    } catch (err) {
      setLoginError(err.message || 'Network error connecting to login service.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Handle Status & Notes Update
  const handleSaveStatus = async (recordId) => {
    if (!token || !recordId || !newStatus) return;
    setStatusUpdating(true);
    try {
      const res = await fetch(`/api/admin/registrations/${recordId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: newStatus,
          adminNotes: updateNote,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to update status.');
      }

      // Update in table state
      setRegistrations((prev) =>
        prev.map((item) => (item.id === recordId ? data.data : item))
      );

      // Update open modal state
      if (selectedRecord && selectedRecord.id === recordId) {
        setSelectedRecord(data.data);
      }

      showToast(`Registration status updated to ${newStatus}.`);
      fetchStats(); // Refresh status counts
    } catch (err) {
      showToast(err.message || 'Failed to update registration status.', 'error');
    } finally {
      setStatusUpdating(false);
    }
  };

  // Handle Create New Admin
  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    setAddAdminError('');

    if (!newAdminForm.name.trim() || !newAdminForm.username.trim() || !newAdminForm.password) {
      setAddAdminError('Please fill in all required fields.');
      return;
    }

    if (newAdminForm.password.length < 6) {
      setAddAdminError('Password must be at least 6 characters long.');
      return;
    }

    setIsAddingAdmin(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newAdminForm),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to create administrator account.');
      }

      setAdminUsers((prev) => [data.data, ...prev]);
      setShowAddAdminModal(false);
      setNewAdminForm({ name: '', username: '', password: '', role: 'ADMIN' });
      showToast(`Administrator '${data.data.name}' created successfully.`);
    } catch (err) {
      setAddAdminError(err.message || 'Failed to create administrator.');
    } finally {
      setIsAddingAdmin(false);
    }
  };

  // Handle Toggle Admin Status (Active / Suspended)
  const handleToggleAdminStatus = async (adminId, currentStatus) => {
    try {
      const res = await fetch(`/api/admin/users/${adminId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to update account status.');
      }

      setAdminUsers((prev) =>
        prev.map((u) => (u.id === adminId ? { ...u, isActive: data.data.isActive } : u))
      );
      showToast(`Administrator account ${data.data.isActive ? 'activated' : 'suspended'}.`);
    } catch (err) {
      showToast(err.message || 'Failed to update status.', 'error');
    }
  };

  // Handle Delete Admin
  const handleDeleteAdmin = async (adminId, adminName) => {
    if (!window.confirm(`Are you sure you want to remove administrator '${adminName}'? This action cannot be undone.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/users/${adminId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to remove administrator.');
      }

      setAdminUsers((prev) => prev.filter((u) => u.id !== adminId));
      showToast(`Administrator '${adminName}' removed.`);
    } catch (err) {
      showToast(err.message || 'Failed to delete administrator.', 'error');
    }
  };

  // Open details modal
  const openDetails = (record) => {
    setSelectedRecord(record);
    setNewStatus(record.status);
    setUpdateNote(record.adminNotes || '');
  };

  // Reset Filters
  const resetFilters = () => {
    setRoleFilter('ALL');
    setStatusFilter('ALL');
    setSearchQuery('');
    setDebouncedSearch('');
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  // Loading Screen while verifying auth token
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#091827] flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-3 border-[#F59E0B] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold text-slate-300">Verifying RouteWise Operations Session...</p>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // ADMIN LOGIN VIEW
  // -------------------------------------------------------------
  if (!token || !adminUser) {
    return (
      <div className="min-h-screen bg-[#091827] text-[#FAFAF7] flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Background glow accents */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[350px] bg-amber-500/10 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute -bottom-10 right-10 w-72 h-72 bg-sky-500/10 blur-[100px] rounded-full pointer-events-none" />

        <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
          <div className="text-center space-y-3">
            <div className="flex justify-center">
              <Logo />
            </div>
            <div className="inline-flex items-center space-x-2 bg-[#0F2A44] border border-[#1E3D60] px-3.5 py-1 rounded-full text-xs font-semibold text-[#F59E0B] mt-2">
              <Shield className="w-3.5 h-3.5" />
              <span>Pilot Operations Console</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Admin Authentication
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Sign in to manage and review live pilot registrations.
            </p>
          </div>

          <div className="mt-8 bg-[#0F2A44] border border-[#1E3D60] rounded-2xl p-6 sm:p-8 shadow-2xl relative">
            {loginError && (
              <div className="mb-5 p-3.5 bg-rose-950/70 border border-rose-500/50 rounded-xl text-xs text-rose-200 flex items-start space-x-2.5">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{loginError}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Admin Username
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="e.g. admin or ops_manager"
                  value={loginForm.username}
                  onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-[#091827] text-white text-sm rounded-xl border border-[#1E3D60] focus:outline-none focus:border-[#F59E0B] focus:ring-1 focus:ring-[#F59E0B]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••••••"
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                    className="w-full px-3.5 py-2.5 pr-10 bg-[#091827] text-white text-sm rounded-xl border border-[#1E3D60] focus:outline-none focus:border-[#F59E0B] focus:ring-1 focus:ring-[#F59E0B]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1"
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoggingIn}
                  className={`w-full inline-flex items-center justify-center px-5 py-3 text-sm font-bold text-[#091827] bg-[#F59E0B] hover:bg-[#D97706] rounded-xl transition-all shadow-md ${
                    isLoggingIn ? 'opacity-70 cursor-not-allowed' : ''
                  }`}
                >
                  {isLoggingIn ? (
                    <>
                      <span className="w-4 h-4 mr-2 border-2 border-[#091827] border-t-transparent rounded-full animate-spin" />
                      <span>Authenticating...</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4 mr-2" />
                      <span>Sign In to Console</span>
                    </>
                  )}
                </button>
              </div>
            </form>

            <div className="mt-6 pt-5 border-t border-[#1E3D60]/60 flex items-center justify-between text-xs text-slate-400">
              <a
                href="/"
                className="hover:text-white transition-colors flex items-center group"
              >
                <ChevronLeft className="w-3.5 h-3.5 mr-1 group-hover:-translate-x-0.5 transition-transform" />
                <span>Back to RouteWise Landing</span>
              </a>
              <span className="text-[11px] text-slate-500 font-mono">Phase 2.0 Admin</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // AUTHENTICATED DASHBOARD VIEW
  // -------------------------------------------------------------
  return (
    <div className="min-h-[100dvh] w-full overflow-x-hidden bg-[#091827] text-[#FAFAF7] flex flex-col font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-5 right-5 z-50 flex items-center space-x-2.5 px-4 py-3 rounded-xl border shadow-xl text-xs sm:text-sm font-medium animate-fadeIn ${
            toastMessage.type === 'error'
              ? 'bg-rose-950/90 border-rose-500/50 text-rose-200'
              : toastMessage.type === 'info'
              ? 'bg-[#152E4A] border-sky-500/50 text-sky-200'
              : 'bg-emerald-950/90 border-emerald-500/50 text-emerald-200'
          }`}
        >
          {toastMessage.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          )}
          <span>{toastMessage.msg}</span>
        </div>
      )}

      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-[#091827]/95 backdrop-blur-md border-b border-[#1E3D60]/80 shadow-md">
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 w-full">
          <div className="flex items-center justify-between h-16">
            {/* Logo & Platform Tag */}
            <div className="flex items-center space-x-3">
              <a href="/" className="flex items-center" aria-label="RouteWise Home">
                <Logo showTagline={false} />
              </a>
              <span className="hidden sm:inline-block text-slate-600">|</span>
              <span className="inline-flex items-center space-x-1.5 bg-[#0F2A44] border border-[#1E3D60] px-3 py-1 rounded-full text-xs font-semibold text-[#F59E0B]">
                <Shield className="w-3.5 h-3.5 text-[#F59E0B]" />
                <span>Pilot Operations</span>
              </span>
            </div>

            {/* Navigation Tabs */}
            <nav className="hidden md:flex items-center space-x-1 bg-[#11253B] border border-[#1E3D60] p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setActiveView('registrations')}
                className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeView === 'registrations'
                    ? 'bg-[#F59E0B] text-[#091827] shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-[#152E4A]'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Registrations</span>
                {stats && (
                  <span
                    className={`ml-1 text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                      activeView === 'registrations'
                        ? 'bg-[#091827]/30 text-[#091827]'
                        : 'bg-[#091827] text-slate-300'
                    }`}
                  >
                    {stats.totalRegistrations}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveView('admins');
                  fetchAdminUsers();
                }}
                className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeView === 'admins'
                    ? 'bg-[#F59E0B] text-[#091827] shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-[#152E4A]'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Admin Team</span>
                {adminUsers.length > 0 && (
                  <span
                    className={`ml-1 text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                      activeView === 'admins'
                        ? 'bg-[#091827]/30 text-[#091827]'
                        : 'bg-[#091827] text-slate-300'
                    }`}
                  >
                    {adminUsers.length}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveView('verifications');
                  fetchVerifications();
                }}
                className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeView === 'verifications'
                    ? 'bg-[#F59E0B] text-[#091827] shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-[#152E4A]'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Verifications</span>
                {verificationsPendingCount > 0 && (
                  <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full font-mono bg-rose-500 text-white font-bold">
                    {verificationsPendingCount}
                  </span>
                )}
              </button>
            </nav>

            {/* Actions & Profile */}
            <div className="flex items-center space-x-3">
              {/* Add Admin Shortcut Button */}
              <button
                type="button"
                onClick={() => {
                  setAddAdminError('');
                  setShowAddAdminModal(true);
                }}
                className="hidden sm:inline-flex items-center text-xs font-bold text-[#091827] bg-[#F59E0B] hover:bg-[#D97706] px-3 py-1.5 rounded-xl transition-all shadow-sm"
              >
                <UserPlus className="w-3.5 h-3.5 mr-1.5" />
                <span>Add Admin</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  fetchStats();
                  if (activeView === 'registrations') fetchRegistrations();
                  if (activeView === 'admins') fetchAdminUsers();
                  if (activeView === 'verifications') fetchVerifications();
                  showToast('Dashboard data refreshed.');
                }}
                disabled={isLoadingData || isLoadingAdmins || verificationsLoading}
                className="inline-flex items-center text-xs font-semibold text-slate-300 hover:text-white px-3 py-2 rounded-lg bg-[#0F2A44] border border-[#1E3D60] hover:bg-[#152E4A] transition-colors"
                title="Refresh dashboard data"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 sm:mr-1.5 ${
                    isLoadingData || isLoadingAdmins || verificationsLoading ? 'animate-spin text-[#F59E0B]' : ''
                  }`}
                />
                <span className="hidden sm:inline">Refresh</span>
              </button>

              <div className="h-6 w-px bg-[#1E3D60] hidden sm:block" />

              <div className="hidden sm:flex items-center space-x-2 text-xs">
                <div className="w-7 h-7 rounded-full bg-[#152E4A] border border-[#1E3D60] flex items-center justify-center font-bold text-[#F59E0B] uppercase">
                  {(adminUser.name || adminUser.username || 'A')[0]}
                </div>
                <div className="text-left">
                  <p className="font-semibold text-white leading-none">
                    {adminUser.name || adminUser.username}
                  </p>
                  <p className="text-[10px] text-slate-400 leading-tight">
                    {adminUser.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Admin'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center text-xs font-semibold text-rose-300 hover:text-white px-3 py-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5 sm:mr-1.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>

          {/* Mobile Navigation Tabs */}
          <div className="grid grid-cols-3 gap-1 md:hidden border-t border-[#1E3D60]/60 py-2">
            <button
              type="button"
              onClick={() => setActiveView('registrations')}
              className={`py-1.5 px-2 rounded-lg text-xs font-bold text-center truncate ${
                activeView === 'registrations'
                  ? 'bg-[#F59E0B] text-[#091827]'
                  : 'bg-[#0F2A44] text-slate-300'
              }`}
            >
              Leads ({stats ? stats.totalRegistrations : 0})
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveView('admins');
                fetchAdminUsers();
              }}
              className={`py-1.5 px-2 rounded-lg text-xs font-bold text-center truncate ${
                activeView === 'admins'
                  ? 'bg-[#F59E0B] text-[#091827]'
                  : 'bg-[#0F2A44] text-slate-300'
              }`}
            >
              Admins ({adminUsers.length})
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveView('verifications');
                fetchVerifications();
              }}
              className={`py-1.5 px-2 rounded-lg text-xs font-bold text-center truncate ${
                activeView === 'verifications'
                  ? 'bg-[#F59E0B] text-[#091827]'
                  : 'bg-[#0F2A44] text-slate-300'
              }`}
            >
              Verify ({verificationsPendingCount})
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 py-8 space-y-8 flex-1 w-full">
        {/* ========================================================= */}
        {/* VIEW 1: PILOT REGISTRATIONS MANAGEMENT                    */}
        {/* ========================================================= */}
        {activeView === 'registrations' && (
          <div className="space-y-8">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  Pilot Registrations Overview
                </h1>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  Live intake from freight shippers and commercial transporters on early access corridors.
                </p>
              </div>
              <div className="inline-flex items-center space-x-2 bg-[#0F2A44] border border-emerald-500/40 px-3 py-1.5 rounded-xl text-xs text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Atlas Database: Connected</span>
              </div>
            </div>

            {/* Summary Metrics Cards */}
            <section aria-label="Key Registration Metrics">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                {/* Total Registrations */}
                <div className="bg-[#0F2A44] border border-[#1E3D60] rounded-2xl p-5 shadow-lg relative overflow-hidden group">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Total Leads
                    </span>
                    <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-[#F59E0B]">
                      <FileText className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-3 flex items-baseline space-x-2">
                    <span className="text-3xl font-extrabold text-white">
                      {stats ? stats.totalRegistrations : '—'}
                    </span>
                    <span className="text-xs text-slate-400">All Time</span>
                  </div>
                  <div className="mt-2 text-xs text-slate-400 flex items-center">
                    <Clock className="w-3.5 h-3.5 mr-1 text-emerald-400" />
                    <span>{stats ? stats.recent24hCount : 0} joined in last 24h</span>
                  </div>
                </div>

                {/* Shippers Count */}
                <button
                  type="button"
                  onClick={() => {
                    setRoleFilter(roleFilter === 'SHIPPER' ? 'ALL' : 'SHIPPER');
                    setPagination((prev) => ({ ...prev, page: 1 }));
                  }}
                  className={`text-left bg-[#0F2A44] border rounded-2xl p-5 shadow-lg transition-all ${
                    roleFilter === 'SHIPPER'
                      ? 'border-[#F59E0B] ring-1 ring-[#F59E0B] bg-[#152E4A]'
                      : 'border-[#1E3D60] hover:border-slate-500'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Shippers
                    </span>
                    <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-[#F59E0B]">
                      <UserCheck className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-3 flex items-baseline space-x-2">
                    <span className="text-3xl font-extrabold text-white">
                      {stats ? stats.shippersCount : '—'}
                    </span>
                    <span className="text-xs text-amber-300">
                      {stats && stats.totalRegistrations
                        ? `${Math.round((stats.shippersCount / stats.totalRegistrations) * 100)}%`
                        : '0%'}
                    </span>
                  </div>
                  <div className="mt-2 text-xs text-slate-400 flex items-center justify-between">
                    <span>Freight cargo owners</span>
                    <span className="text-[11px] text-[#F59E0B] font-semibold underline">
                      {roleFilter === 'SHIPPER' ? 'Filtered' : 'Filter'}
                    </span>
                  </div>
                </button>

                {/* Transporters Count */}
                <button
                  type="button"
                  onClick={() => {
                    setRoleFilter(roleFilter === 'TRANSPORTER' ? 'ALL' : 'TRANSPORTER');
                    setPagination((prev) => ({ ...prev, page: 1 }));
                  }}
                  className={`text-left bg-[#0F2A44] border rounded-2xl p-5 shadow-lg transition-all ${
                    roleFilter === 'TRANSPORTER'
                      ? 'border-sky-400 ring-1 ring-sky-400 bg-[#152E4A]'
                      : 'border-[#1E3D60] hover:border-slate-500'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Transporters
                    </span>
                    <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
                      <Truck className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-3 flex items-baseline space-x-2">
                    <span className="text-3xl font-extrabold text-white">
                      {stats ? stats.transportersCount : '—'}
                    </span>
                    <span className="text-xs text-sky-300">
                      {stats && stats.totalRegistrations
                        ? `${Math.round((stats.transportersCount / stats.totalRegistrations) * 100)}%`
                        : '0%'}
                    </span>
                  </div>
                  <div className="mt-2 text-xs text-slate-400 flex items-center justify-between">
                    <span>Vehicle &amp; fleet owners</span>
                    <span className="text-[11px] text-sky-400 font-semibold underline">
                      {roleFilter === 'TRANSPORTER' ? 'Filtered' : 'Filter'}
                    </span>
                  </div>
                </button>

                {/* Admin Team Metric */}
                <button
                  type="button"
                  onClick={() => {
                    setActiveView('admins');
                    fetchAdminUsers();
                  }}
                  className="text-left bg-[#0F2A44] border border-[#1E3D60] hover:border-purple-400 rounded-2xl p-5 shadow-lg flex flex-col justify-between transition-all"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Operations Team
                    </span>
                    <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                      <Users className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-3 flex items-baseline space-x-2">
                    <span className="text-3xl font-extrabold text-white">
                      {adminUsers.length > 0 ? adminUsers.length : '1+'}
                    </span>
                    <span className="text-xs text-purple-300">Active Admins</span>
                  </div>
                  <div className="mt-2 text-xs text-[#F59E0B] font-semibold underline flex items-center">
                    <span>Manage Admin Team &rarr;</span>
                  </div>
                </button>
              </div>

              {/* Status Breakdown Interactive Filter Row */}
              {stats && (
                <div className="mt-4 p-4 bg-[#0F2A44] border border-[#1E3D60] rounded-2xl">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                    <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      Workflow Status Breakdown:
                    </span>
                    {statusFilter !== 'ALL' && (
                      <button
                        type="button"
                        onClick={() => {
                          setStatusFilter('ALL');
                          setPagination((prev) => ({ ...prev, page: 1 }));
                        }}
                        className="text-xs text-[#F59E0B] hover:underline inline-flex items-center"
                      >
                        <RotateCcw className="w-3 h-3 mr-1" />
                        Reset status filter
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                    {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
                      const count = stats.byStatus[key] || 0;
                      const isSelected = statusFilter === key;
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => {
                            setStatusFilter(isSelected ? 'ALL' : key);
                            setPagination((prev) => ({ ...prev, page: 1 }));
                          }}
                          className={`px-3 py-2.5 rounded-xl border text-left transition-all ${
                            isSelected
                              ? `${cfg.color} ring-1 ring-white/20 font-bold scale-[1.02]`
                              : 'bg-[#11253B] border-[#1E3D60] hover:border-slate-500 text-slate-300'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium">{cfg.label}</span>
                            <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                          </div>
                          <div className="text-lg font-bold text-white mt-1">{count}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </section>

            {/* Search & Filter Toolbar */}
            <section
              aria-label="Filter registrations"
              className="bg-[#0F2A44] border border-[#1E3D60] rounded-2xl p-4 sm:p-5 shadow-lg space-y-4"
            >
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5">
                {/* Search Input */}
                <div className="sm:col-span-5 relative">
                  <label htmlFor="search-input" className="sr-only">
                    Search leads
                  </label>
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="search-input"
                    type="text"
                    placeholder="Search name, entity, route, phone, or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 bg-[#091827] text-white text-xs sm:text-sm rounded-xl border border-[#1E3D60] focus:outline-none focus:border-[#F59E0B] focus:ring-1 focus:ring-[#F59E0B]"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1"
                      aria-label="Clear search"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Role Filter */}
                <div className="sm:col-span-3">
                  <label htmlFor="role-filter" className="sr-only">
                    Filter by Role
                  </label>
                  <select
                    id="role-filter"
                    value={roleFilter}
                    onChange={(e) => {
                      setRoleFilter(e.target.value);
                      setPagination((prev) => ({ ...prev, page: 1 }));
                    }}
                    className="w-full px-3.5 py-2.5 bg-[#091827] text-white text-xs sm:text-sm rounded-xl border border-[#1E3D60] focus:outline-none focus:border-[#F59E0B] focus:ring-1 focus:ring-[#F59E0B]"
                  >
                    <option value="ALL">All Roles (Shippers &amp; Transporters)</option>
                    <option value="SHIPPER">Shippers Only</option>
                    <option value="TRANSPORTER">Transporters Only</option>
                  </select>
                </div>

                {/* Status Filter */}
                <div className="sm:col-span-3">
                  <label htmlFor="status-filter" className="sr-only">
                    Filter by Status
                  </label>
                  <select
                    id="status-filter"
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value);
                      setPagination((prev) => ({ ...prev, page: 1 }));
                    }}
                    className="w-full px-3.5 py-2.5 bg-[#091827] text-white text-xs sm:text-sm rounded-xl border border-[#1E3D60] focus:outline-none focus:border-[#F59E0B] focus:ring-1 focus:ring-[#F59E0B]"
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="SUBMITTED">Submitted</option>
                    <option value="UNDER_REVIEW">Under Review</option>
                    <option value="CONTACTED">Contacted</option>
                    <option value="ACCEPTED">Accepted for Pilot</option>
                    <option value="REJECTED">Rejected</option>
                  </select>
                </div>

                {/* Reset Filters */}
                <div className="sm:col-span-1 flex items-center justify-end">
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="w-full py-2.5 px-3 bg-[#11253B] hover:bg-[#152E4A] border border-[#1E3D60] text-slate-300 hover:text-white rounded-xl text-xs font-semibold flex items-center justify-center transition-colors"
                    title="Reset all filters"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span className="sm:hidden ml-1.5">Reset</span>
                  </button>
                </div>
              </div>

              {/* Active Filter Indicators */}
              {(roleFilter !== 'ALL' || statusFilter !== 'ALL' || debouncedSearch) && (
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#1E3D60]/60 text-xs">
                  <span className="text-slate-400 text-[11px]">Active Filters:</span>
                  {roleFilter !== 'ALL' && (
                    <span className="inline-flex items-center bg-[#152E4A] text-amber-300 px-2.5 py-0.5 rounded-lg border border-[#1E3D60]">
                      Role: {roleFilter}
                      <button
                        type="button"
                        onClick={() => setRoleFilter('ALL')}
                        className="ml-1.5 hover:text-white"
                      >
                        ×
                      </button>
                    </span>
                  )}
                  {statusFilter !== 'ALL' && (
                    <span className="inline-flex items-center bg-[#152E4A] text-sky-300 px-2.5 py-0.5 rounded-lg border border-[#1E3D60]">
                      Status: {STATUS_CONFIG[statusFilter]?.label || statusFilter}
                      <button
                        type="button"
                        onClick={() => setStatusFilter('ALL')}
                        className="ml-1.5 hover:text-white"
                      >
                        ×
                      </button>
                    </span>
                  )}
                  {debouncedSearch && (
                    <span className="inline-flex items-center bg-[#152E4A] text-slate-200 px-2.5 py-0.5 rounded-lg border border-[#1E3D60]">
                      Query: "{debouncedSearch}"
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="ml-1.5 hover:text-white"
                      >
                        ×
                      </button>
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="text-xs text-[#F59E0B] hover:underline ml-2"
                  >
                    Clear all
                  </button>
                </div>
              )}
            </section>

            {/* Registrations Data Table */}
            <section aria-label="Pilot registrations table" className="space-y-4">
              <div className="bg-[#0F2A44] border border-[#1E3D60] rounded-2xl shadow-xl overflow-hidden">
                {/* Table Header Controls */}
                <div className="p-4 sm:px-6 border-b border-[#1E3D60] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#11253B]">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      Pilot Registration Records
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-mono bg-[#091827] text-slate-300 border border-[#1E3D60]">
                      {pagination.totalCount} leads
                    </span>
                  </div>

                  {/* Page Limit Selector */}
                  <div className="flex items-center space-x-2 text-xs text-slate-400">
                    <span>Per page:</span>
                    <select
                      value={pagination.limit}
                      onChange={(e) => {
                        const newLimit = Number(e.target.value);
                        setPagination((prev) => ({ ...prev, limit: newLimit, page: 1 }));
                      }}
                      className="bg-[#091827] text-white text-xs px-2.5 py-1.5 rounded-lg border border-[#1E3D60] focus:outline-none focus:border-[#F59E0B]"
                    >
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                    </select>
                  </div>
                </div>

                {/* Error Message */}
                {dataError && (
                  <div className="m-6 p-4 bg-rose-950/70 border border-rose-500/50 rounded-xl text-xs text-rose-200 flex items-center justify-between">
                    <div className="flex items-center space-x-2.5">
                      <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                      <span>{dataError}</span>
                    </div>
                    <button
                      type="button"
                      onClick={fetchRegistrations}
                      className="px-3 py-1 bg-rose-500/20 hover:bg-rose-500/30 rounded-lg text-xs font-semibold text-rose-200"
                    >
                      Retry
                    </button>
                  </div>
                )}

                {/* Table Content */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead className="bg-[#091827]/70 text-slate-400 uppercase text-[11px] tracking-wider border-b border-[#1E3D60]">
                      <tr>
                        <th scope="col" className="py-3 px-4 sm:px-6">Contact Person</th>
                        <th scope="col" className="py-3 px-4">Role &amp; Entity</th>
                        <th scope="col" className="py-3 px-4">Corridor Route</th>
                        <th scope="col" className="py-3 px-4 hidden md:table-cell">Specs / Cargo</th>
                        <th scope="col" className="py-3 px-4">Status</th>
                        <th scope="col" className="py-3 px-4 hidden lg:table-cell">Registered</th>
                        <th scope="col" className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-[#1E3D60]/60">
                      {/* Loading Skeleton */}
                      {isLoadingData && (
                        <tr>
                          <td colSpan={7} className="py-12 text-center text-slate-400">
                            <div className="flex flex-col items-center justify-center space-y-3">
                              <div className="w-8 h-8 border-2 border-[#F59E0B] border-t-transparent rounded-full animate-spin" />
                              <span className="text-xs">Fetching registration records from Atlas...</span>
                            </div>
                          </td>
                        </tr>
                      )}

                      {/* Empty State */}
                      {!isLoadingData && registrations.length === 0 && (
                        <tr>
                          <td colSpan={7} className="py-12 text-center">
                            <div className="max-w-sm mx-auto space-y-3 text-slate-400">
                              <Boxes className="w-10 h-10 text-slate-500 mx-auto" />
                              <p className="text-sm font-semibold text-white">No registrations found</p>
                              <p className="text-xs">
                                No records match your selected role, status, or search query.
                              </p>
                              {(roleFilter !== 'ALL' || statusFilter !== 'ALL' || debouncedSearch) && (
                                <button
                                  type="button"
                                  onClick={resetFilters}
                                  className="inline-flex items-center px-4 py-2 bg-[#152E4A] hover:bg-[#1E3D60] text-xs font-semibold text-[#F59E0B] rounded-xl border border-[#1E3D60] transition-colors"
                                >
                                  <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                                  <span>Clear all filters</span>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}

                      {/* Data Rows */}
                      {!isLoadingData &&
                        registrations.map((record) => {
                          const isShipper = record.role === 'SHIPPER';
                          const statusCfg = STATUS_CONFIG[record.status] || STATUS_CONFIG.SUBMITTED;

                          return (
                            <tr
                              key={record.id}
                              className="hover:bg-[#11253B]/60 transition-colors group"
                            >
                              {/* Contact Person */}
                              <td className="py-3.5 px-4 sm:px-6">
                                <div className="font-semibold text-white text-sm">
                                  {record.contactName}
                                </div>
                                <div className="flex items-center space-x-3 mt-1 text-xs text-slate-400">
                                  <span className="flex items-center text-slate-300">
                                    <Phone className="w-3 h-3 mr-1 text-[#F59E0B]" />
                                    {record.phone}
                                  </span>
                                  {record.email && (
                                    <span className="hidden sm:flex items-center text-slate-400 truncate max-w-[140px] xl:max-w-none">
                                      <Mail className="w-3 h-3 mr-1" />
                                      {record.email}
                                    </span>
                                  )}
                                </div>
                              </td>

                              {/* Role & Entity */}
                              <td className="py-3.5 px-4">
                                <span
                                  className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider mb-1 ${
                                    isShipper
                                      ? 'bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30'
                                      : 'bg-sky-500/15 text-sky-400 border border-sky-500/30'
                                  }`}
                                >
                                  {isShipper ? (
                                    <UserCheck className="w-3 h-3 mr-1" />
                                  ) : (
                                    <Truck className="w-3 h-3 mr-1" />
                                  )}
                                  {record.role}
                                </span>
                                <div className="text-xs text-slate-300 font-medium truncate max-w-[160px] xl:max-w-none">
                                  {record.businessName || record.fleetName || 'Private Operator'}
                                </div>
                              </td>

                              {/* Corridor Route */}
                              <td className="py-3.5 px-4">
                                <div className="flex items-start space-x-1.5 max-w-[220px] xl:max-w-md">
                                  <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                                  <span className="text-xs text-slate-200 font-medium leading-tight">
                                    {record.route}
                                  </span>
                                </div>
                              </td>

                              {/* Specs / Cargo (Medium+ Screens) */}
                              <td className="py-3.5 px-4 hidden md:table-cell">
                                {isShipper ? (
                                  <div className="space-y-0.5 text-xs">
                                    <div className="text-slate-300">{record.cargoCategory || 'General'}</div>
                                    <div className="text-[11px] text-slate-400 font-mono">
                                      {record.shipmentFrequency || 'Standard frequency'}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="space-y-0.5 text-xs">
                                    <div className="text-slate-300 truncate max-w-[170px] xl:max-w-none">
                                      {record.vehicleType || 'Commercial Freight'}
                                    </div>
                                    <div className="text-[11px] text-sky-400 font-mono">
                                      {record.availableCapacity || 'Available for Return Load'}
                                    </div>
                                  </div>
                                )}
                              </td>

                              {/* Status Badge */}
                              <td className="py-3.5 px-4">
                                <span
                                  className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${statusCfg.color}`}
                                >
                                  <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${statusCfg.dot}`} />
                                  <span>{statusCfg.label}</span>
                                </span>
                              </td>

                              {/* Registration Date (Large Screens) */}
                              <td className="py-3.5 px-4 hidden lg:table-cell text-xs text-slate-400">
                                <div>{new Date(record.createdAt).toLocaleDateString()}</div>
                                <div className="text-[11px] text-slate-500 font-mono">
                                  {new Date(record.createdAt).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </div>
                              </td>

                              {/* Action Button */}
                              <td className="py-3.5 px-4 text-right">
                                <button
                                  type="button"
                                  onClick={() => openDetails(record)}
                                  className="inline-flex items-center px-3 py-1.5 bg-[#152E4A] hover:bg-[#1E3D60] text-slate-200 hover:text-white rounded-lg border border-[#1E3D60] transition-colors font-semibold text-xs shadow-sm"
                                >
                                  <Eye className="w-3.5 h-3.5 mr-1 text-[#F59E0B]" />
                                  <span>Details</span>
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Footer */}
                <div className="p-4 sm:px-6 border-t border-[#1E3D60] bg-[#11253B] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
                  <div>
                    Showing{' '}
                    <strong className="text-white">
                      {pagination.totalCount > 0
                        ? (pagination.page - 1) * pagination.limit + 1
                        : 0}
                    </strong>{' '}
                    to{' '}
                    <strong className="text-white">
                      {Math.min(pagination.page * pagination.limit, pagination.totalCount)}
                    </strong>{' '}
                    of <strong className="text-white">{pagination.totalCount}</strong> registrations
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
                      disabled={!pagination.hasPrevPage || isLoadingData}
                      className={`inline-flex items-center px-3 py-1.5 rounded-lg border text-xs font-semibold ${
                        pagination.hasPrevPage && !isLoadingData
                          ? 'bg-[#152E4A] hover:bg-[#1E3D60] text-white border-[#1E3D60]'
                          : 'bg-[#091827] text-slate-600 border-[#1E3D60]/40 cursor-not-allowed'
                      }`}
                    >
                      <ChevronLeft className="w-3.5 h-3.5 mr-1" />
                      <span>Previous</span>
                    </button>

                    <span className="px-2 font-mono text-slate-300">
                      Page {pagination.page} / {pagination.totalPages}
                    </span>

                    <button
                      type="button"
                      onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
                      disabled={!pagination.hasNextPage || isLoadingData}
                      className={`inline-flex items-center px-3 py-1.5 rounded-lg border text-xs font-semibold ${
                        pagination.hasNextPage && !isLoadingData
                          ? 'bg-[#152E4A] hover:bg-[#1E3D60] text-white border-[#1E3D60]'
                          : 'bg-[#091827] text-slate-600 border-[#1E3D60]/40 cursor-not-allowed'
                      }`}
                    >
                      <span>Next</span>
                      <ChevronRight className="w-3.5 h-3.5 ml-1" />
                    </button>
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 2: ADMIN TEAM & ACCESS MANAGEMENT                   */}
        {/* ========================================================= */}
        {activeView === 'admins' && (
          <div className="space-y-8 animate-fadeIn">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  Admin Team &amp; Access Control
                </h1>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  Manage accounts authorized to inspect shipments, coordinate return loads, and update pilot statuses.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setAddAdminError('');
                  setShowAddAdminModal(true);
                }}
                className="inline-flex items-center justify-center px-5 py-2.5 bg-[#F59E0B] hover:bg-[#D97706] text-[#091827] rounded-xl text-xs sm:text-sm font-bold shadow-md transition-all self-start sm:self-auto"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                <span>Add Administrator</span>
              </button>
            </div>

            {/* Administrators Table */}
            <div className="bg-[#0F2A44] border border-[#1E3D60] rounded-2xl shadow-xl overflow-hidden">
              <div className="p-4 sm:px-6 border-b border-[#1E3D60] bg-[#11253B] flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 text-[#F59E0B]" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    Authorized Team Accounts
                  </span>
                </div>
                <span className="text-xs text-slate-400 font-mono">
                  {adminUsers.length} active admins
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-[#091827]/70 text-slate-400 uppercase text-[11px] tracking-wider border-b border-[#1E3D60]">
                    <tr>
                      <th scope="col" className="py-3 px-4 sm:px-6">Administrator</th>
                      <th scope="col" className="py-3 px-4">Role</th>
                      <th scope="col" className="py-3 px-4">Account Status</th>
                      <th scope="col" className="py-3 px-4 hidden sm:table-cell">Added By</th>
                      <th scope="col" className="py-3 px-4 hidden md:table-cell">Last Login</th>
                      <th scope="col" className="py-3 px-4 text-right">Manage</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-[#1E3D60]/60">
                    {isLoadingAdmins && (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-400">
                          <div className="flex flex-col items-center justify-center space-y-3">
                            <div className="w-8 h-8 border-2 border-[#F59E0B] border-t-transparent rounded-full animate-spin" />
                            <span className="text-xs">Loading administrators...</span>
                          </div>
                        </td>
                      </tr>
                    )}

                    {!isLoadingAdmins && adminUsers.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-400">
                          <Users className="w-8 h-8 mx-auto text-slate-500 mb-2" />
                          <p className="font-semibold text-white">No administrators found</p>
                          <p className="text-xs mt-1">Click "+ Add Administrator" to create the first team member.</p>
                        </td>
                      </tr>
                    )}

                    {!isLoadingAdmins &&
                      adminUsers.map((admin) => {
                        const isSelf = admin.username === adminUser.username;
                        return (
                          <tr key={admin.id} className="hover:bg-[#11253B]/60 transition-colors">
                            {/* Administrator Name & Username */}
                            <td className="py-3.5 px-4 sm:px-6">
                              <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 rounded-full bg-[#152E4A] border border-[#1E3D60] flex items-center justify-center font-bold text-[#F59E0B] uppercase">
                                  {admin.name[0]}
                                </div>
                                <div>
                                  <div className="font-semibold text-white flex items-center space-x-1.5">
                                    <span>{admin.name}</span>
                                    {isSelf && (
                                      <span className="text-[10px] bg-amber-500/20 text-[#F59E0B] px-1.5 py-0.2 rounded border border-amber-500/30">
                                        You
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-xs text-slate-400 font-mono">
                                    @{admin.username}
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* Role */}
                            <td className="py-3.5 px-4">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider ${
                                  admin.role === 'SUPER_ADMIN'
                                    ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                                    : 'bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/30'
                                }`}
                              >
                                {admin.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Admin'}
                              </span>
                            </td>

                            {/* Account Status */}
                            <td className="py-3.5 px-4">
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                  admin.isActive
                                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                    : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                                }`}
                              >
                                <span
                                  className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                                    admin.isActive ? 'bg-emerald-400' : 'bg-rose-400'
                                  }`}
                                />
                                {admin.isActive ? 'Active' : 'Suspended'}
                              </span>
                            </td>

                            {/* Added By */}
                            <td className="py-3.5 px-4 hidden sm:table-cell text-xs text-slate-300">
                              <div>@{admin.createdBy || 'system'}</div>
                              <div className="text-[11px] text-slate-500">
                                {new Date(admin.createdAt).toLocaleDateString()}
                              </div>
                            </td>

                            {/* Last Login */}
                            <td className="py-3.5 px-4 hidden md:table-cell text-xs text-slate-400 font-mono">
                              {admin.lastLoginAt
                                ? new Date(admin.lastLoginAt).toLocaleString()
                                : 'Never'}
                            </td>

                            {/* Actions */}
                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end space-x-2">
                                {/* Toggle Active/Suspended */}
                                {!isSelf && (
                                  <button
                                    type="button"
                                    onClick={() => handleToggleAdminStatus(admin.id, admin.isActive)}
                                    className={`p-1.5 rounded-lg border transition-colors ${
                                      admin.isActive
                                        ? 'text-amber-400 hover:bg-amber-500/20 border-amber-500/30'
                                        : 'text-emerald-400 hover:bg-emerald-500/20 border-emerald-500/30'
                                    }`}
                                    title={admin.isActive ? 'Suspend access' : 'Activate access'}
                                  >
                                    <Power className="w-3.5 h-3.5" />
                                  </button>
                                )}

                                {/* Delete Admin */}
                                {!isSelf && (
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteAdmin(admin.id, admin.name)}
                                    className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/20 border border-rose-500/30 transition-colors"
                                    title="Remove administrator"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 3: TRANSPORTER DOCUMENT VERIFICATION (Phase 6)       */}
        {/* ========================================================= */}
        {activeView === 'verifications' && (
          <div className="space-y-8 animate-fadeIn">
            {/* Header & Status Filter */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  Transporter Compliance &amp; Verification
                </h1>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  Review submitted business documents, GSTIN/PAN records, and commercial vehicle papers for marketplace trust.
                </p>
              </div>

              <div className="flex items-center space-x-3 self-start sm:self-auto">
                <label className="text-xs text-slate-400 font-semibold">Filter Status:</label>
                <select
                  value={verificationsFilterStatus}
                  onChange={(e) => {
                    const next = e.target.value;
                    setVerificationsFilterStatus(next);
                    fetchVerifications(1, next);
                  }}
                  className="px-3 py-2 bg-[#0F2A44] border border-[#1E3D60] rounded-xl text-xs text-white focus:outline-none focus:border-[#F59E0B]"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="PENDING">Pending Review</option>
                  <option value="UNDER_REVIEW">Under Review</option>
                  <option value="APPROVED">Approved &amp; Verified</option>
                  <option value="CORRECTION_REQUIRED">Correction Required</option>
                  <option value="REJECTED">Rejected</option>
                </select>
              </div>
            </div>

            {/* Verifications Table */}
            <div className="bg-[#0F2A44] border border-[#1E3D60] rounded-2xl shadow-xl overflow-hidden">
              <div className="p-4 sm:px-6 border-b border-[#1E3D60] bg-[#11253B] flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 text-[#F59E0B]" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    Verification Submissions ({verificationsPagination.totalCount})
                  </span>
                </div>
                {verificationsPendingCount > 0 && (
                  <span className="text-xs text-amber-400 font-bold">
                    ⚡ {verificationsPendingCount} awaiting review
                  </span>
                )}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#091827]/70 text-slate-400 uppercase text-[10px] tracking-wider border-b border-[#1E3D60]">
                    <tr>
                      <th className="py-3 px-4 font-bold">Transporter / Business</th>
                      <th className="py-3 px-4 font-bold">Fleet Scope</th>
                      <th className="py-3 px-4 font-bold">Documents</th>
                      <th className="py-3 px-4 font-bold">Status</th>
                      <th className="py-3 px-4 font-bold">Submitted Date</th>
                      <th className="py-3 px-4 font-bold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1E3D60]/50 text-slate-200">
                    {verificationsLoading ? (
                      <tr>
                        <td colSpan="6" className="py-12 text-center text-slate-400">
                          <div className="inline-flex items-center space-x-2">
                            <RefreshCw className="w-4 h-4 animate-spin text-[#F59E0B]" />
                            <span>Loading verification requests...</span>
                          </div>
                        </td>
                      </tr>
                    ) : verificationsList.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="py-12 text-center text-slate-400">
                          No transporter verification submissions found for the selected filter.
                        </td>
                      </tr>
                    ) : (
                      verificationsList.map((v) => {
                        const statusCfg =
                          VERIFICATION_STATUS_CONFIG[v.status] ||
                          VERIFICATION_STATUS_CONFIG.PENDING;
                        const docTypes = (v.documents || [])
                          .map((d) => d.documentType.replace('_', ' '))
                          .join(', ');

                        return (
                          <tr key={v.id} className="hover:bg-[#11253B]/50 transition-colors">
                            <td className="py-3.5 px-4">
                              <p className="font-bold text-white">{v.transporter?.businessName}</p>
                              <p className="text-[11px] text-slate-400">
                                {v.transporter?.name} • {v.transporter?.phone}
                              </p>
                            </td>
                            <td className="py-3.5 px-4 text-slate-300">
                              {v.vehicleId ? (
                                <span className="inline-flex items-center text-[11px] text-indigo-300 font-medium">
                                  <Truck className="w-3.5 h-3.5 mr-1" />
                                  Single Fleet Vehicle
                                </span>
                              ) : (
                                <span className="text-[11px] text-slate-300">
                                  General Transporter Profile
                                </span>
                              )}
                            </td>
                            <td className="py-3.5 px-4">
                              <span className="font-semibold text-white">
                                {v.documents?.length || 0} files
                              </span>
                              <p className="text-[10px] text-slate-400 truncate max-w-xs">
                                {docTypes || 'No files'}
                              </p>
                            </td>
                            <td className="py-3.5 px-4">
                              <span
                                className={`inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${statusCfg.color}`}
                              >
                                <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                                <span>{statusCfg.label}</span>
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                              {v.submittedAt
                                ? new Date(v.submittedAt).toLocaleDateString('en-IN', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric',
                                  })
                                : '—'}
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <button
                                type="button"
                                onClick={() => handleInspectVerification(v.id)}
                                className="inline-flex items-center space-x-1 px-3 py-1.5 bg-[#F59E0B] hover:bg-[#D97706] text-[#091827] text-xs font-bold rounded-lg transition-colors shadow-sm"
                              >
                                <span>Inspect &amp; Review</span>
                                <span>&rarr;</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {verificationsPagination.totalPages > 1 && (
                <div className="p-4 border-t border-[#1E3D60] bg-[#11253B] flex items-center justify-between text-xs">
                  <span className="text-slate-400">
                    Page {verificationsPagination.page} of {verificationsPagination.totalPages}
                  </span>
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      disabled={verificationsPagination.page <= 1}
                      onClick={() => fetchVerifications(verificationsPagination.page - 1)}
                      className="px-3 py-1 bg-[#0F2A44] hover:bg-[#152E4A] border border-[#1E3D60] rounded-lg disabled:opacity-40"
                    >
                      Previous
                    </button>
                    <button
                      type="button"
                      disabled={verificationsPagination.page >= verificationsPagination.totalPages}
                      onClick={() => fetchVerifications(verificationsPagination.page + 1)}
                      className="px-3 py-1 bg-[#0F2A44] hover:bg-[#152E4A] border border-[#1E3D60] rounded-lg disabled:opacity-40"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* ----------------------------------------------------------- */}
      {/* 5. ADD NEW ADMINISTRATOR MODAL                             */}
      {/* ----------------------------------------------------------- */}
      {showAddAdminModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#0F2A44] border-2 border-[#F59E0B] rounded-2xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative">
            <div className="flex items-start justify-between pb-4 border-b border-[#1E3D60]">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-[#F59E0B]">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Add New Administrator</h3>
                  <p className="text-xs text-slate-400">Grant operations access to a team member</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddAdminModal(false)}
                className="text-slate-400 hover:text-white p-1"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {addAdminError && (
              <div className="my-4 p-3.5 bg-rose-950/70 border border-rose-500/50 rounded-xl text-xs text-rose-200 flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{addAdminError}</span>
              </div>
            )}

            <form onSubmit={handleCreateAdmin} className="space-y-4 my-4">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Full Name <span className="text-[#F59E0B]">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Amit Verma"
                  value={newAdminForm.name}
                  onChange={(e) => setNewAdminForm({ ...newAdminForm, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-[#091827] text-white text-sm rounded-xl border border-[#1E3D60] focus:outline-none focus:border-[#F59E0B]"
                />
              </div>

              {/* Username */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Username <span className="text-[#F59E0B]">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. amit_ops"
                  value={newAdminForm.username}
                  onChange={(e) =>
                    setNewAdminForm({
                      ...newAdminForm,
                      username: e.target.value.toLowerCase().replace(/[^a-z0-9_.-]/g, ''),
                    })
                  }
                  className="w-full px-3.5 py-2.5 bg-[#091827] text-white text-sm rounded-xl border border-[#1E3D60] focus:outline-none focus:border-[#F59E0B]"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Used to sign in. Lowercase letters, numbers, hyphens, underscores only.
                </span>
              </div>

              {/* Initial Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Initial Password <span className="text-[#F59E0B]">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showNewAdminPassword ? 'text' : 'password'}
                    required
                    placeholder="At least 6 characters"
                    value={newAdminForm.password}
                    onChange={(e) => setNewAdminForm({ ...newAdminForm, password: e.target.value })}
                    className="w-full px-3.5 py-2.5 pr-10 bg-[#091827] text-white text-sm rounded-xl border border-[#1E3D60] focus:outline-none focus:border-[#F59E0B]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewAdminPassword(!showNewAdminPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1"
                  >
                    {showNewAdminPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Role */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Access Level
                </label>
                <select
                  value={newAdminForm.role}
                  onChange={(e) => setNewAdminForm({ ...newAdminForm, role: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-[#091827] text-white text-sm rounded-xl border border-[#1E3D60] focus:outline-none focus:border-[#F59E0B]"
                >
                  <option value="ADMIN">Administrator (Can review leads &amp; update statuses)</option>
                  <option value="SUPER_ADMIN">Super Admin (Full access + can manage admins)</option>
                </select>
              </div>

              <div className="pt-3 flex items-center justify-end space-x-3 border-t border-[#1E3D60]">
                <button
                  type="button"
                  onClick={() => setShowAddAdminModal(false)}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-300 hover:text-white rounded-xl border border-[#1E3D60]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAddingAdmin}
                  className="inline-flex items-center px-5 py-2.5 bg-[#F59E0B] hover:bg-[#D97706] text-[#091827] text-xs font-bold rounded-xl shadow-md transition-all"
                >
                  {isAddingAdmin ? (
                    <>
                      <span className="w-3.5 h-3.5 mr-1.5 border-2 border-[#091827] border-t-transparent rounded-full animate-spin" />
                      <span>Creating Admin...</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-3.5 h-3.5 mr-1.5" />
                      <span>Create Administrator</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------- */}
      {/* 6. REGISTRATION DETAILS & WORKFLOW MODAL                   */}
      {/* ----------------------------------------------------------- */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#0F2A44] border border-[#1E3D60] rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative max-h-[92vh] overflow-y-auto space-y-6">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-[#1E3D60]">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider ${
                      selectedRecord.role === 'SHIPPER'
                        ? 'bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/30'
                        : 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                    }`}
                  >
                    {selectedRecord.role}
                  </span>
                  <span className="text-xs font-mono text-slate-400">ID: {selectedRecord.id}</span>
                </div>
                <h3 className="text-xl font-bold text-white">{selectedRecord.contactName}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRecord(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Core Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              {/* Contact Information */}
              <div className="p-4 bg-[#091827] rounded-xl border border-[#1E3D60] space-y-2">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block border-b border-[#1E3D60]/60 pb-1">
                  Contact Information
                </span>
                <div className="space-y-1.5 pt-1">
                  <p className="flex items-center text-slate-200">
                    <Phone className="w-3.5 h-3.5 mr-2 text-[#F59E0B]" />
                    <a href={`tel:${selectedRecord.phone}`} className="hover:underline">
                      {selectedRecord.phone}
                    </a>
                  </p>
                  {selectedRecord.email ? (
                    <p className="flex items-center text-slate-300">
                      <Mail className="w-3.5 h-3.5 mr-2 text-slate-400" />
                      <a href={`mailto:${selectedRecord.email}`} className="hover:underline">
                        {selectedRecord.email}
                      </a>
                    </p>
                  ) : (
                    <p className="text-slate-500 text-[11px]">No email provided</p>
                  )}
                  <p className="text-slate-400 pt-1">
                    Consent to Contact:{' '}
                    <span className="text-emerald-400 font-semibold">Granted</span>
                  </p>
                </div>
              </div>

              {/* Entity Information */}
              <div className="p-4 bg-[#091827] rounded-xl border border-[#1E3D60] space-y-2">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block border-b border-[#1E3D60]/60 pb-1">
                  {selectedRecord.role === 'SHIPPER' ? 'Trading Entity' : 'Fleet Information'}
                </span>
                <div className="space-y-1.5 pt-1 text-slate-300">
                  <p className="font-semibold text-white">
                    {selectedRecord.businessName || selectedRecord.fleetName || 'Private Operator'}
                  </p>
                  <p className="text-slate-400">
                    Registration Date:{' '}
                    <span className="text-slate-300 font-mono">
                      {new Date(selectedRecord.createdAt).toLocaleString()}
                    </span>
                  </p>
                  <p className="text-slate-400">
                    Last Status Update:{' '}
                    <span className="text-slate-300 font-mono">
                      {new Date(selectedRecord.updatedAt).toLocaleString()}
                    </span>
                  </p>
                </div>
              </div>

              {/* Corridor & Route */}
              <div className="sm:col-span-2 p-4 bg-[#091827] rounded-xl border border-[#1E3D60] space-y-2">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block border-b border-[#1E3D60]/60 pb-1">
                  Registered Corridor / Highways
                </span>
                <div className="flex items-start space-x-2 pt-1">
                  <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <p className="text-white font-medium text-sm leading-relaxed">
                    {selectedRecord.route}
                  </p>
                </div>
              </div>

              {/* Specifications: Shipper vs Transporter */}
              <div className="sm:col-span-2 p-4 bg-[#091827] rounded-xl border border-[#1E3D60] space-y-3">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block border-b border-[#1E3D60]/60 pb-1">
                  {selectedRecord.role === 'SHIPPER' ? 'Shipment Parameters' : 'Fleet Vehicle Parameters'}
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {selectedRecord.role === 'SHIPPER' ? (
                    <>
                      <div>
                        <span className="text-slate-400 block mb-0.5">Cargo Category:</span>
                        <span className="text-white font-medium">
                          {selectedRecord.cargoCategory || 'General Goods'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block mb-0.5">Shipment Frequency:</span>
                        <span className="text-white font-medium">
                          {selectedRecord.shipmentFrequency || 'Periodic'}
                        </span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <span className="text-slate-400 block mb-0.5">Primary Vehicle Type:</span>
                        <span className="text-white font-medium">
                          {selectedRecord.vehicleType || 'Commercial Freight'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block mb-0.5">Typical Free Capacity / Space:</span>
                        <span className="text-sky-300 font-medium">
                          {selectedRecord.availableCapacity || 'Available for Return Load'}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Workflow Action: Update Status & Internal Coordinator Notes */}
            <div className="p-5 bg-[#11253B] rounded-xl border border-amber-500/30 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center">
                  <Shield className="w-4 h-4 text-[#F59E0B] mr-1.5" />
                  Update Pilot Workflow Status
                </span>
                <span className="text-xs text-slate-400">
                  Current:{' '}
                  <strong className="text-white">
                    {STATUS_CONFIG[selectedRecord.status]?.label || selectedRecord.status}
                  </strong>
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Status Selector */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Select New Status
                  </label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#091827] text-white text-xs sm:text-sm rounded-xl border border-[#1E3D60] focus:outline-none focus:border-[#F59E0B]"
                  >
                    <option value="SUBMITTED">Submitted (New Lead)</option>
                    <option value="UNDER_REVIEW">Under Review (Dispatcher Evaluating)</option>
                    <option value="CONTACTED">Contacted (Phone / WhatsApp reached)</option>
                    <option value="ACCEPTED">Accepted for Pilot Corridor Match</option>
                    <option value="REJECTED">Rejected / Incompatible</option>
                  </select>
                </div>

                {/* Coordinator Note */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Internal Dispatcher / Pilot Notes (Optional)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="e.g. Called owner on 25-Oct; interested in Lucknow return haul on Thursdays..."
                    value={updateNote}
                    onChange={(e) => setUpdateNote(e.target.value)}
                    maxLength={1000}
                    className="w-full px-3.5 py-2 bg-[#091827] text-white text-xs sm:text-sm rounded-xl border border-[#1E3D60] focus:outline-none focus:border-[#F59E0B]"
                  />
                  <div className="flex justify-between text-[11px] text-slate-500 mt-1">
                    <span>Visible only to authorized RouteWise administrators.</span>
                    <span>{updateNote.length}/1000</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedRecord(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white rounded-xl border border-[#1E3D60] hover:bg-[#152E4A] transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={() => handleSaveStatus(selectedRecord.id)}
                  disabled={statusUpdating || (newStatus === selectedRecord.status && updateNote === (selectedRecord.adminNotes || ''))}
                  className={`inline-flex items-center px-5 py-2 text-xs font-bold text-[#091827] bg-[#F59E0B] hover:bg-[#D97706] rounded-xl transition-all shadow-md ${
                    statusUpdating ? 'opacity-70 cursor-not-allowed' : ''
                  }`}
                >
                  {statusUpdating ? (
                    <>
                      <span className="w-3.5 h-3.5 mr-1.5 border-2 border-[#091827] border-t-transparent rounded-full animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5 mr-1.5" />
                      <span>Save Status &amp; Notes</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------- */}
      {/* 7. TRANSPORTER VERIFICATION REVIEW MODAL (Phase 6)         */}
      {/* ----------------------------------------------------------- */}
      {verificationModalOpen && selectedVerification && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#0F2A44] border-2 border-[#F59E0B] rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative max-h-[92vh] overflow-y-auto space-y-6">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-[#1E3D60]">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-400 border border-amber-500/30">
                    Transporter Compliance
                  </span>
                  <span
                    className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                      VERIFICATION_STATUS_CONFIG[selectedVerification.status]?.color ||
                      'bg-slate-500/15 text-slate-400 border-slate-500/30'
                    }`}
                  >
                    <span>
                      {VERIFICATION_STATUS_CONFIG[selectedVerification.status]?.label ||
                        selectedVerification.status}
                    </span>
                  </span>
                </div>
                <h3 className="text-xl font-bold text-white">
                  {selectedVerification.transporter?.businessName}
                </h3>
                <p className="text-xs text-slate-400">
                  Contact: <span className="text-slate-200">{selectedVerification.transporter?.name}</span> •{' '}
                  <span className="text-slate-200">{selectedVerification.transporter?.phone}</span>
                  {selectedVerification.transporter?.email && (
                    <span> • {selectedVerification.transporter?.email}</span>
                  )}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setVerificationModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#152E4A] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Vehicle Scope Info if applicable */}
            {selectedVerification.vehicle && (
              <div className="p-3 bg-[#091827] rounded-xl border border-[#1E3D60] text-xs">
                <p className="text-[10px] uppercase font-bold text-indigo-400 mb-1 flex items-center">
                  <Truck className="w-3.5 h-3.5 mr-1" />
                  Linked Fleet Vehicle
                </p>
                <p className="font-semibold text-white">
                  {selectedVerification.vehicle.vehicleType} • {selectedVerification.vehicle.capacity}{' '}
                  {selectedVerification.vehicle.capacityUnit || 'Tons'}
                </p>
                <p className="text-slate-400 text-[11px]">
                  Operating corridor: {selectedVerification.vehicle.currentLocation} →{' '}
                  {selectedVerification.vehicle.destinationCorridor}
                </p>
              </div>
            )}

            {/* Uploaded Documents List */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center">
                <FileCheck className="w-4 h-4 mr-1.5 text-amber-400" />
                Submitted Business &amp; Vehicle Documents ({selectedVerification.documents?.length || 0})
              </h4>

              {(!selectedVerification.documents || selectedVerification.documents.length === 0) ? (
                <div className="p-4 rounded-xl bg-[#091827] border border-[#1E3D60] text-center text-xs text-slate-400">
                  No documents attached to this submission.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {selectedVerification.documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="p-3 rounded-xl bg-[#091827] border border-[#1E3D60] flex flex-col justify-between space-y-2"
                    >
                      <div>
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          {doc.documentType.replace('_', ' ')}
                        </span>
                        <p className="text-xs font-semibold text-white mt-1 truncate">
                          {doc.originalName}
                        </p>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                          {(doc.fileSizeBytes / 1024).toFixed(1)} KB •{' '}
                          {new Date(doc.uploadedAt).toLocaleDateString('en-IN')}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDownloadVerificationDoc(doc.id, doc.originalName)}
                        className="w-full py-1.5 px-2 bg-[#11253B] hover:bg-[#152E4A] border border-[#1E3D60] text-slate-200 text-xs font-semibold rounded-lg flex items-center justify-center space-x-1.5 transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
                        <span>Inspect Document</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Audit History / Past Decisions */}
            {selectedVerification.auditHistory && selectedVerification.auditHistory.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Verification Review History
                </h4>
                <div className="max-h-36 overflow-y-auto space-y-1.5 p-2 rounded-xl bg-[#091827] border border-[#1E3D60]">
                  {selectedVerification.auditHistory.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-2 rounded-lg bg-[#11253B] text-[11px] border border-[#1E3D60]/60 space-y-0.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white">
                          Status: <span className="text-amber-400">{item.status}</span>
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(item.reviewedAt).toLocaleString('en-IN')}
                        </span>
                      </div>
                      {item.reviewerName && (
                        <p className="text-slate-400">Reviewer: {item.reviewerName}</p>
                      )}
                      {item.reason && (
                        <p className="text-rose-300 font-medium">Reason: {item.reason}</p>
                      )}
                      {item.notes && (
                        <p className="text-slate-300 italic">Notes: &ldquo;{item.notes}&rdquo;</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Review Decision Form */}
            <form onSubmit={handleSubmitReview} className="space-y-4 pt-3 border-t border-[#1E3D60]">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Administrative Review Decision
              </h4>

              {/* Status Radio Buttons */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'APPROVED', label: 'Approve & Verify', color: 'border-emerald-500 text-emerald-400' },
                  { id: 'CORRECTION_REQUIRED', label: 'Request Fix', color: 'border-orange-500 text-orange-400' },
                  { id: 'UNDER_REVIEW', label: 'Under Review', color: 'border-sky-500 text-sky-400' },
                  { id: 'REJECTED', label: 'Reject', color: 'border-rose-500 text-rose-400' },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setReviewStatus(opt.id)}
                    className={`p-2.5 rounded-xl border text-center text-xs font-bold transition-all ${
                      reviewStatus === opt.id
                        ? `${opt.color} bg-[#152E4A] ring-1 ring-amber-400`
                        : 'border-[#1E3D60] text-slate-400 bg-[#091827] hover:border-slate-500'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {/* Specific Reason (Mandatory if Correction or Reject) */}
              {(reviewStatus === 'CORRECTION_REQUIRED' || reviewStatus === 'REJECTED') && (
                <div>
                  <label className="block text-xs font-bold text-slate-200 mb-1">
                    Specific Reason for Correction / Rejection *
                  </label>
                  <textarea
                    rows="2"
                    required
                    value={reviewReason}
                    onChange={(e) => setReviewReason(e.target.value)}
                    placeholder="e.g. RC copy is unreadable; please re-upload clear photo of commercial vehicle permit."
                    className="w-full px-3 py-2 bg-[#091827] border border-orange-500/50 rounded-xl text-xs text-white focus:outline-none focus:border-[#F59E0B]"
                  />
                </div>
              )}

              {/* Internal Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Internal Reviewer Notes (Non-sensitive audit log)
                </label>
                <input
                  type="text"
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="e.g. Verified against UP state portal registry. Passed."
                  className="w-full px-3 py-2 bg-[#091827] border border-[#1E3D60] rounded-xl text-xs text-white focus:outline-none focus:border-[#F59E0B]"
                />
              </div>

              {/* Alerts */}
              {reviewError && (
                <div className="p-3 bg-rose-950/50 border border-rose-500/50 rounded-xl text-xs text-rose-200 flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{reviewError}</span>
                </div>
              )}
              {reviewSuccess && (
                <div className="p-3 bg-emerald-950/50 border border-emerald-500/50 rounded-xl text-xs text-emerald-200 flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{reviewSuccess}</span>
                </div>
              )}

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setVerificationModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-[#11253B] border border-[#1E3D60] rounded-xl"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReview}
                  className="px-5 py-2 text-xs font-bold bg-[#F59E0B] hover:bg-[#D97706] text-[#091827] rounded-xl shadow-md transition-all disabled:opacity-50 flex items-center space-x-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSubmittingReview ? 'Submitting Review...' : 'Commit Review Decision'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
