import React, { useState, useEffect } from "react";
import {
  Bell,
  CheckCheck,
  Trash2,
  Filter,
  Search,
  AlertOctagon,
  AlertTriangle,
  Info,
  Server,
  RefreshCw,
  Clock,
} from "lucide-react";
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} from "../api/api";

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [severityFilter, setSeverityFilter] = useState("ALL");
  const [readFilter, setReadFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifications = async () => {
    try {
      setRefreshing(true);
      const params = {};
      if (readFilter === "UNREAD") params.is_read = false;
      if (readFilter === "READ") params.is_read = true;
      if (severityFilter !== "ALL") params.severity = severityFilter;

      const data = await getNotifications(params);
      setNotifications(data);
    } catch (err) {
      console.error("Failed to load notifications", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [severityFilter, readFilter]);

  const handleMarkRead = async (id) => {
    try {
      await markNotificationAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch (err) {
      console.error("Failed to mark notification as read", err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (err) {
      console.error("Failed to mark all as read", err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (err) {
      console.error("Failed to delete notification", err);
    }
  };

  const filteredNotifs = notifications.filter((n) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      n.title?.toLowerCase().includes(q) ||
      n.message?.toLowerCase().includes(q) ||
      n.type?.toLowerCase().includes(q) ||
      n.server_name?.toLowerCase().includes(q)
    );
  });

  const getSeverityBadge = (severity) => {
    switch (severity?.toUpperCase()) {
      case "CRITICAL":
        return (
          <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-red-500/10 text-red-400 border border-red-500/30">
            <AlertOctagon className="w-3.5 h-3.5" />
            <span>CRITICAL</span>
          </span>
        );
      case "WARNING":
        return (
          <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>WARNING</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30">
            <Info className="w-3.5 h-3.5" />
            <span>INFO</span>
          </span>
        );
    }
  };

  const formatDate = (ts) => {
    if (!ts) return "";
    const d = new Date(ts);
    return d.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-cyan-500/10 border border-cyan-500/30 rounded-xl text-cyan-400">
              <Bell className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white">
                Notification Center
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Real-time system events, server alerts, and backup notifications
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={fetchNotifications}
            className="flex items-center space-x-2 px-3.5 py-2 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-lg text-xs font-medium transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="flex items-center space-x-2 px-3.5 py-2 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded-lg text-xs font-medium transition"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Mark All as Read ({unreadCount})</span>
            </button>
          )}
        </div>
      </div>

      {/* Control Bar: Filters & Search */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Search */}
        <div className="md:col-span-6 relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search notifications by title, message, server..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900/80 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 transition"
          />
        </div>

        {/* Severity Filter */}
        <div className="md:col-span-3 flex items-center space-x-2 bg-slate-900/80 border border-slate-800 rounded-xl px-3 py-1.5">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <span className="text-xs text-slate-400 font-medium shrink-0">Severity:</span>
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="bg-transparent text-xs text-slate-200 focus:outline-none font-medium w-full cursor-pointer"
          >
            <option value="ALL" className="bg-slate-900">All Severities</option>
            <option value="CRITICAL" className="bg-slate-900">CRITICAL</option>
            <option value="WARNING" className="bg-slate-900">WARNING</option>
            <option value="INFO" className="bg-slate-900">INFO</option>
          </select>
        </div>

        {/* Read Status Filter */}
        <div className="md:col-span-3 flex items-center space-x-2 bg-slate-900/80 border border-slate-800 rounded-xl px-3 py-1.5">
          <span className="text-xs text-slate-400 font-medium shrink-0">Status:</span>
          <select
            value={readFilter}
            onChange={(e) => setReadFilter(e.target.value)}
            className="bg-transparent text-xs text-slate-200 focus:outline-none font-medium w-full cursor-pointer"
          >
            <option value="ALL" className="bg-slate-900">All Notifications</option>
            <option value="UNREAD" className="bg-slate-900">Unread Only</option>
            <option value="READ" className="bg-slate-900">Read Only</option>
          </select>
        </div>
      </div>

      {/* Notifications List */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            Loading system notifications...
          </div>
        ) : filteredNotifs.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Bell className="w-8 h-8 text-slate-600 mx-auto" />
            <p className="text-sm font-medium text-slate-400">
              No notifications found matching your filters.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/60">
            {filteredNotifs.map((n) => (
              <div
                key={n.id}
                className={`p-4 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${!n.is_read
                  ? "bg-slate-800/30 hover:bg-slate-800/50"
                  : "hover:bg-slate-800/20 text-slate-400"
                  }`}
              >
                <div className="flex items-start space-x-3.5">
                  <div className="mt-1">{getSeverityBadge(n.severity)}</div>
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <h3
                        className={`text-sm font-semibold ${!n.is_read ? "text-slate-100" : "text-slate-300"
                          }`}
                      >
                        {n.title}
                      </h3>
                      {!n.is_read && (
                        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                      )}
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      {n.message}
                    </p>
                    <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-slate-500">
                      <span className="flex items-center space-x-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{formatDate(n.created_at)}</span>
                      </span>
                      {n.server_name && (
                        <span className="flex items-center space-x-1 text-cyan-400 font-medium">
                          <Server className="w-3.5 h-3.5" />
                          <span>{n.server_name}</span>
                        </span>
                      )}
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono text-[10px]">
                        TYPE: {n.type}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 shrink-0 self-end sm:self-center">
                  {!n.is_read && (
                    <button
                      onClick={() => handleMarkRead(n.id)}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition flex items-center space-x-1"
                      title="Mark as read"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      <span>Mark Read</span>
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(n.id)}
                    className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg transition"
                    title="Delete notification"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
