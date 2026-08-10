import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  Bell,
  CheckCheck,
  AlertTriangle,
  AlertOctagon,
  Info,
  Server,
  ExternalLink,
} from "lucide-react";
import {
  getNotifications,
  getNotificationSummary,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "../api/api";

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [recentNotifs, setRecentNotifs] = useState([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  const fetchSummary = async () => {
    try {
      const summary = await getNotificationSummary();
      setUnreadCount(summary.unread_count || 0);
    } catch (err) {
      console.error("Failed to fetch notification summary", err);
    }
  };

  const fetchRecent = async () => {
    try {
      setLoading(true);
      const data = await getNotifications({ limit: 6 });
      setRecentNotifs(data);
    } catch (err) {
      console.error("Failed to fetch recent notifications", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
    const interval = setInterval(fetchSummary, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleToggle = () => {
    if (!isOpen) {
      fetchRecent();
    }
    setIsOpen(!isOpen);
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id, e) => {
    e.stopPropagation();
    try {
      await markNotificationAsRead(id);
      setRecentNotifs((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Failed to mark as read", err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsAsRead();
      setRecentNotifs((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Failed to mark all as read", err);
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity?.toUpperCase()) {
      case "CRITICAL":
        return <AlertOctagon className="w-4 h-4 text-red-400 shrink-0" />;
      case "WARNING":
        return <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />;
      default:
        return <Info className="w-4 h-4 text-blue-400 shrink-0" />;
    }
  };

  const formatTime = (ts) => {
    if (!ts) return "";
    const date = new Date(ts);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={handleToggle}
        className="relative p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition duration-150 focus:outline-none"
        title="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-lg animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl z-50 overflow-hidden backdrop-blur-md">
          {/* Dropdown Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-900/90">
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-slate-100 text-sm">Notifications</span>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 text-xs bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded-full font-medium">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="flex items-center space-x-1 text-xs text-slate-400 hover:text-cyan-400 transition"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          {/* Notification Items List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/60">
            {loading ? (
              <div className="p-6 text-center text-xs text-slate-500">
                Loading notifications...
              </div>
            ) : recentNotifs.length === 0 ? (
              <div className="p-6 text-center text-slate-500 text-xs">
                No recent notifications
              </div>
            ) : (
              recentNotifs.map((n) => (
                <div
                  key={n.id}
                  onClick={(e) => !n.is_read && handleMarkAsRead(n.id, e)}
                  className={`p-3 transition cursor-pointer flex space-x-3 items-start ${
                    !n.is_read
                      ? "bg-slate-800/40 hover:bg-slate-800/80"
                      : "hover:bg-slate-800/30 text-slate-400"
                  }`}
                >
                  <div className="mt-0.5">{getSeverityIcon(n.severity)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <p
                        className={`text-xs font-semibold truncate ${
                          !n.is_read ? "text-slate-100" : "text-slate-400"
                        }`}
                      >
                        {n.title}
                      </p>
                      <span className="text-[10px] text-slate-500 shrink-0 ml-2">
                        {formatTime(n.created_at)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {n.message}
                    </p>
                    {n.server_name && (
                      <div className="mt-1.5 flex items-center space-x-1 text-[10px] text-cyan-400">
                        <Server className="w-3 h-3" />
                        <span className="truncate">{n.server_name}</span>
                      </div>
                    )}
                  </div>
                  {!n.is_read && (
                    <span className="w-2 h-2 rounded-full bg-cyan-400 shrink-0 mt-1" />
                  )}
                </div>
              ))
            )}
          </div>

          {/* Dropdown Footer */}
          <div className="p-2 border-t border-slate-800 bg-slate-900/90 text-center">
            <Link
              to="/notifications"
              onClick={() => setIsOpen(false)}
              className="inline-flex items-center space-x-1.5 text-xs text-cyan-400 hover:text-cyan-300 font-medium py-1 px-3 rounded-lg hover:bg-slate-800 transition"
            >
              <span>View All Notifications</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
