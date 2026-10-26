import React, { useState, useEffect, useCallback } from 'react';
import {
  Bell,
  X,
  Check,
  CheckCheck,
  Truck,
  Package,
  MapPin,
  ShieldCheck,
  AlertTriangle,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  Navigation,
  Award,
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || '';

function getNotificationIcon(type) {
  switch (type) {
    case 'QUOTE_RECEIVED':
      return <Truck className="w-4 h-4 text-amber-400" />;
    case 'QUOTE_ACCEPTED':
    case 'BOOKING_CONFIRMED':
      return <ShieldCheck className="w-4 h-4 text-emerald-400" />;
    case 'LOAD_PICKED_UP':
      return <Package className="w-4 h-4 text-blue-400" />;
    case 'TRANSIT_UPDATE':
      return <Navigation className="w-4 h-4 text-cyan-400" />;
    case 'DELIVERY_REPORTED':
      return <MapPin className="w-4 h-4 text-purple-400" />;
    case 'DELIVERY_COMPLETED':
      return <Award className="w-4 h-4 text-emerald-400" />;
    case 'DELIVERY_DISPUTED':
      return <AlertCircle className="w-4 h-4 text-rose-400" />;
    case 'VERIFICATION_APPROVED':
      return <ShieldCheck className="w-4 h-4 text-emerald-400" />;
    case 'VERIFICATION_CORRECTION':
    case 'VERIFICATION_REJECTED':
      return <AlertTriangle className="w-4 h-4 text-amber-400" />;
    default:
      return <Bell className="w-4 h-4 text-slate-400" />;
  }
}

function formatRelativeTime(dateString) {
  if (!dateString) return '';
  const now = new Date();
  const date = new Date(dateString);
  const diffSec = Math.floor((now - date) / 1000);

  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
}

export default function NotificationDrawer({
  authToken,
  isOpen,
  onClose,
  onNotificationClick,
  onUnreadCountChange,
}) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [filterUnreadOnly, setFilterUnreadOnly] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (!authToken) return;
    try {
      setLoading(true);
      const url = `${API_BASE}/api/notifications?limit=30${filterUnreadOnly ? '&unreadOnly=true' : ''}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.data?.notifications || []);
        const count = data.data?.pagination?.unreadCount || 0;
        setUnreadCount(count);
        if (onUnreadCountChange) onUnreadCountChange(count);
      }
    } catch (err) {
      console.warn('Failed to fetch notifications:', err);
    } finally {
      setLoading(false);
    }
  }, [authToken, filterUnreadOnly, onUnreadCountChange]);

  // Initial and periodic fetch
  useEffect(() => {
    if (authToken && isOpen) {
      fetchNotifications();
    }
  }, [authToken, isOpen, fetchNotifications]);

  // Background light polling for unread count
  useEffect(() => {
    if (!authToken) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE}/api/notifications/unread-count`, {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        if (res.ok) {
          const data = await res.json();
          setUnreadCount(data.unreadCount || 0);
          if (onUnreadCountChange) onUnreadCountChange(data.unreadCount || 0);
        }
      } catch (_) {}
    }, 25000); // Poll every 25 seconds

    return () => clearInterval(interval);
  }, [authToken, onUnreadCountChange]);

  const handleMarkAsRead = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      const res = await fetch(`${API_BASE}/api/notifications/${id}/read`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
        );
        setUnreadCount((c) => Math.max(0, c - 1));
        if (onUnreadCountChange) onUnreadCountChange(Math.max(0, unreadCount - 1));
      }
    } catch (err) {
      console.error('Failed to mark notification read:', err);
    }
  };

  const handleMarkAllRead = async () => {
    if (markingAll || unreadCount === 0) return;
    try {
      setMarkingAll(true);
      const res = await fetch(`${API_BASE}/api/notifications/read-all`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setUnreadCount(0);
        if (onUnreadCountChange) onUnreadCountChange(0);
      }
    } catch (err) {
      console.error('Failed to mark all read:', err);
    } finally {
      setMarkingAll(false);
    }
  };

  const handleClickItem = (item) => {
    if (!item.isRead) {
      handleMarkAsRead(item.id);
    }
    if (onNotificationClick) {
      onNotificationClick(item);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-xs transition-opacity animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-[#171717] border-l border-[#2D2D2D] h-full shadow-2xl flex flex-col text-stone-100 z-50 animate-slideLeft"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#2D2D2D] bg-[#1F1F1F] flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="relative p-2 bg-[#262626] rounded-lg border border-[#333333]">
              <Bell className="w-5 h-5 text-[#F28C28]" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-[#F28C28] text-[10px] font-bold text-black font-tabular">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </div>
            <div>
              <h3 className="font-bold text-base text-white tracking-tight">Notifications</h3>
              <p className="text-xs text-stone-400">
                {unreadCount > 0 ? `${unreadCount} unread alert${unreadCount === 1 ? '' : 's'}` : 'All caught up'}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={fetchNotifications}
              disabled={loading}
              title="Refresh notifications"
              className="p-1.5 text-stone-400 hover:text-white hover:bg-[#262626] rounded-lg transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-stone-400 hover:text-white hover:bg-[#262626] rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter & Action Toolbar */}
        <div className="px-4 py-2.5 bg-[#1A1A1A] border-b border-[#2D2D2D] flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setFilterUnreadOnly(false)}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                !filterUnreadOnly
                  ? 'bg-[#F28C28] text-black font-bold'
                  : 'text-stone-400 hover:text-white hover:bg-[#262626]'
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setFilterUnreadOnly(true)}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                filterUnreadOnly
                  ? 'bg-[#F28C28] text-black font-bold'
                  : 'text-stone-400 hover:text-white hover:bg-[#262626]'
              }`}
            >
              Unread only ({unreadCount})
            </button>
          </div>

          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllRead}
              disabled={markingAll}
              className="inline-flex items-center text-[#F28C28] hover:text-[#FFA959] font-semibold transition-colors disabled:opacity-50"
            >
              <CheckCheck className="w-3.5 h-3.5 mr-1" />
              <span>Mark all read</span>
            </button>
          )}
        </div>

        {/* Notification List */}
        <div className="flex-1 overflow-y-auto divide-y divide-[#2D2D2D]/60 p-2 space-y-1">
          {loading && notifications.length === 0 ? (
            <div className="p-8 text-center text-stone-400 space-y-3">
              <RefreshCw className="w-6 h-6 mx-auto animate-spin text-[#F28C28]" />
              <p className="text-xs">Loading notifications...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-12 text-center text-stone-400 space-y-3">
              <div className="w-12 h-12 mx-auto rounded-full bg-[#1F1F1F] flex items-center justify-center border border-[#2D2D2D]">
                <Check className="w-6 h-6 text-emerald-400" />
              </div>
              <h4 className="font-semibold text-stone-200 text-sm">No notifications</h4>
              <p className="text-xs text-stone-400 max-w-xs mx-auto">
                {filterUnreadOnly
                  ? 'You have read all your notifications.'
                  : 'Booking updates, price offers, and review notices will appear here.'}
              </p>
            </div>
          ) : (
            notifications.map((n) => {
              const icon = getNotificationIcon(n.type);
              return (
                <div
                  key={n.id}
                  onClick={() => handleClickItem(n)}
                  className={`p-3 rounded-lg transition-all duration-150 cursor-pointer flex items-start space-x-3 group ${
                    n.isRead
                      ? 'bg-transparent hover:bg-[#202020] text-stone-300'
                      : 'bg-[#222222] hover:bg-[#292929] border border-[#F28C28]/30 text-white shadow-xs'
                  }`}
                >
                  <div className="mt-0.5 p-2 rounded-lg bg-[#171717] border border-[#2D2D2D] shrink-0">
                    {icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <h4
                        className={`text-xs font-semibold truncate ${
                          n.isRead ? 'text-stone-200' : 'text-[#F28C28] font-bold'
                        }`}
                      >
                        {n.title}
                      </h4>
                      <span className="text-[10px] text-stone-400 font-tabular shrink-0">
                        {formatRelativeTime(n.createdAt)}
                      </span>
                    </div>
                    <p className="text-xs text-stone-300 mt-1 line-clamp-2 leading-relaxed">
                      {n.message}
                    </p>
                    <div className="mt-2 flex items-center justify-between text-[11px]">
                      <span className="text-stone-400 group-hover:text-[#F28C28] flex items-center font-medium transition-colors">
                        <span>View details</span>
                        <ExternalLink className="w-3 h-3 ml-1" />
                      </span>
                      {!n.isRead && (
                        <button
                          type="button"
                          onClick={(e) => handleMarkAsRead(n.id, e)}
                          title="Mark as read"
                          className="text-stone-400 hover:text-emerald-400 p-1"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-[#2D2D2D] bg-[#1F1F1F] text-center text-stone-400 text-[11px] font-mono">
          LoadMitra Network Dispatch v2.0
        </div>
      </div>
    </div>
  );
}
