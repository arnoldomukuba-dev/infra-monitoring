import { useState, useEffect, useCallback } from "react";
import { getLogs, getServers } from "../api/api";
import { useTheme } from "../context/ThemeContext";

function Logs() {
  const { darkMode } = useTheme();

  const [logsData, setLogsData] = useState({
    logs: [],
    total_count: 0,
    page: 1,
    limit: 20,
    total_pages: 1,
  });

  const [servers, setServers] = useState([]);
  const [eventTypeFilter, setEventTypeFilter] = useState("ALL");
  const [severityFilter, setSeverityFilter] = useState("ALL");
  const [serverFilter, setServerFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [selectedLog, setSelectedLog] = useState(null);

  const cardBg = darkMode ? "#161B22" : "#FFFFFF";
  const headerBg = darkMode ? "#0D1117" : "#F6F8FA";
  const border = darkMode ? "#30363D" : "#D0D7DE";
  const rowBorder = darkMode ? "#21262D" : "#EAEEF2";
  const textTitle = darkMode ? "#F0F6FC" : "#1F2328";
  const textSub = darkMode ? "#8B949E" : "#6E7781";
  const text = darkMode ? "#C9D1D9" : "#1F2328";
  const codeColor = darkMode ? "#58A6FF" : "#0969DA";

  const fetchServersList = useCallback(async () => {
    try {
      const list = await getServers();
      if (Array.isArray(list)) setServers(list);
    } catch (err) {
      console.error("Failed to load servers for log filters", err);
    }
  }, []);

  const fetchLogsList = useCallback(async () => {
    try {
      const res = await getLogs({
        eventType: eventTypeFilter,
        severity: severityFilter,
        serverId: serverFilter,
        page,
        limit,
      });

      if (res && Array.isArray(res.logs)) {
        setLogsData(res);
      }
    } catch (err) {
      console.error("Failed to fetch audit logs", err);
    }
  }, [eventTypeFilter, severityFilter, serverFilter, page, limit]);

  useEffect(() => {
    fetchServersList();
  }, [fetchServersList]);

  useEffect(() => {
    fetchLogsList();
    const interval = setInterval(fetchLogsList, 6000);
    return () => clearInterval(interval);
  }, [fetchLogsList]);

  const getSeverityBadge = (sev = "INFO") => {
    const s = sev.toUpperCase();
    if (s === "CRITICAL") return { bg: "rgba(239, 68, 68, 0.15)", color: "#EF4444", border: "rgba(239, 68, 68, 0.4)" };
    if (s === "WARNING") return { bg: "rgba(245, 158, 11, 0.15)", color: "#F59E0B", border: "rgba(245, 158, 11, 0.4)" };
    return { bg: "rgba(59, 130, 246, 0.15)", color: "#3B82F6", border: "rgba(59, 130, 246, 0.4)" };
  };

  const getEventTypeBadgeColor = (type = "") => {
    if (type.includes("SERVER")) return { bg: "rgba(139, 92, 246, 0.15)", color: "#8B5CF6" };
    if (type.includes("ALERT") || type.includes("METRIC")) return { bg: "rgba(234, 179, 8, 0.15)", color: "#EAB308" };
    if (type.includes("BACKUP")) return { bg: "rgba(16, 185, 129, 0.15)", color: "#10B981" };
    return { bg: "rgba(107, 114, 128, 0.15)", color: "#9CA3AF" };
  };

  const filteredLogs = (logsData.logs || []).filter((log) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      log.message?.toLowerCase().includes(q) ||
      log.event_type?.toLowerCase().includes(q) ||
      log.server_name?.toLowerCase().includes(q)
    );
  });

  const eventTypes = [
    "ALL",
    "SERVER_ONLINE",
    "SERVER_OFFLINE",
    "SERVER_REGISTERED",
    "METRIC_THRESHOLD_EXCEEDED",
    "ALERT_CREATED",
    "ALERT_ACKNOWLEDGED",
    "ALERT_RESOLVED",
    "BACKUP_STARTED",
    "BACKUP_SUCCEEDED",
    "BACKUP_FAILED",
    "USER_LOGIN",
    "USER_LOGOUT",
    "SETTINGS_CHANGED",
  ];

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
      <header style={{ marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h1 style={{ margin: "0 0 6px 0", fontSize: "22px", fontWeight: "700", color: textTitle }}>
            📜 System Logs & Infrastructure Audit Trail
          </h1>
          <p style={{ margin: 0, color: textSub, fontSize: "13px" }}>
            Immutable timeline of real infrastructure events, server heartbeats, alert lifecycle, and backup actions
          </p>
        </div>
      </header>

      {/* Filter Toolbar */}
      <div
        style={{
          backgroundColor: cardBg,
          borderRadius: "8px",
          padding: "16px",
          marginBottom: "20px",
          border: `1px solid ${border}`,
          boxShadow: darkMode ? "0 4px 12px rgba(0,0,0,0.2)" : "0 2px 8px rgba(0,0,0,0.06)",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "12px",
        }}
      >
        <div>
          <label style={{ display: "block", fontSize: "11px", fontWeight: "600", color: textTitle, marginBottom: "4px" }}>Search Keyword</label>
          <input
            type="text"
            placeholder="Filter message or type..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "7px 10px",
              borderRadius: "6px",
              border: `1px solid ${border}`,
              backgroundColor: darkMode ? "#0D1117" : "#F6F8FA",
              color: textTitle,
              fontSize: "12px",
              outline: "none",
            }}
          />
        </div>

        <div>
          <label style={{ display: "block", fontSize: "11px", fontWeight: "600", color: textTitle, marginBottom: "4px" }}>Event Type</label>
          <select
            value={eventTypeFilter}
            onChange={(e) => { setEventTypeFilter(e.target.value); setPage(1); }}
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "7px 10px",
              borderRadius: "6px",
              border: `1px solid ${border}`,
              backgroundColor: darkMode ? "#0D1117" : "#F6F8FA",
              color: textTitle,
              fontSize: "12px",
            }}
          >
            {eventTypes.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ display: "block", fontSize: "11px", fontWeight: "600", color: textTitle, marginBottom: "4px" }}>Severity</label>
          <select
            value={severityFilter}
            onChange={(e) => { setSeverityFilter(e.target.value); setPage(1); }}
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "7px 10px",
              borderRadius: "6px",
              border: `1px solid ${border}`,
              backgroundColor: darkMode ? "#0D1117" : "#F6F8FA",
              color: textTitle,
              fontSize: "12px",
            }}
          >
            <option value="ALL">All Severities</option>
            <option value="INFO">INFO</option>
            <option value="WARNING">WARNING</option>
            <option value="CRITICAL">CRITICAL</option>
          </select>
        </div>

        <div>
          <label style={{ display: "block", fontSize: "11px", fontWeight: "600", color: textTitle, marginBottom: "4px" }}>Server Node</label>
          <select
            value={serverFilter}
            onChange={(e) => { setServerFilter(e.target.value); setPage(1); }}
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "7px 10px",
              borderRadius: "6px",
              border: `1px solid ${border}`,
              backgroundColor: darkMode ? "#0D1117" : "#F6F8FA",
              color: textTitle,
              fontSize: "12px",
            }}
          >
            <option value="ALL">All Servers</option>
            {servers.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Log Table Container */}
      <div
        style={{
          backgroundColor: cardBg,
          borderRadius: "8px",
          border: `1px solid ${border}`,
          boxShadow: darkMode ? "0 4px 12px rgba(0,0,0,0.2)" : "0 2px 8px rgba(0,0,0,0.06)",
          overflow: "hidden",
        }}
      >
        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ fontSize: "15px", margin: 0, color: textTitle }}>
            Audit Log Entries ({logsData.total_count})
          </h2>
          <span style={{ fontSize: "12px", color: textSub }}>
            Page {logsData.page} of {logsData.total_pages}
          </span>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", color: text, fontSize: "12px", fontFamily: 'monospace' }}>
            <thead>
              <tr style={{ backgroundColor: headerBg, borderBottom: `1px solid ${border}` }}>
                <th style={{ padding: "10px 14px", textAlign: "left", fontSize: "11px", fontWeight: "700", color: textSub }}>TIMESTAMP (UTC)</th>
                <th style={{ padding: "10px 14px", textAlign: "left", fontSize: "11px", fontWeight: "700", color: textSub }}>EVENT TYPE</th>
                <th style={{ padding: "10px 14px", textAlign: "left", fontSize: "11px", fontWeight: "700", color: textSub }}>SEVERITY</th>
                <th style={{ padding: "10px 14px", textAlign: "left", fontSize: "11px", fontWeight: "700", color: textSub }}>SERVER</th>
                <th style={{ padding: "10px 14px", textAlign: "left", fontSize: "11px", fontWeight: "700", color: textSub }}>MESSAGE</th>
                <th style={{ padding: "10px 14px", textAlign: "right", fontSize: "11px", fontWeight: "700", color: textSub }}>DETAILS</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: "center", padding: "30px", color: textSub }}>
                    📭 No audit log entries found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const sevBadge = getSeverityBadge(log.severity);
                  const typeBadge = getEventTypeBadgeColor(log.event_type);

                  return (
                    <tr key={log.id} style={{ borderBottom: `1px solid ${rowBorder}` }}>
                      <td style={{ padding: "10px 14px", color: textSub, whiteSpace: "nowrap" }}>
                        {new Date(log.created_at).toISOString().replace("T", " ").substring(0, 19)}
                      </td>
                      <td style={{ padding: "10px 14px" }}>
                        <span
                          style={{
                            fontSize: "10px",
                            fontWeight: "700",
                            padding: "2px 6px",
                            borderRadius: "4px",
                            backgroundColor: typeBadge.bg,
                            color: typeBadge.color,
                          }}
                        >
                          {log.event_type}
                        </span>
                      </td>
                      <td style={{ padding: "10px 14px" }}>
                        <span
                          style={{
                            fontSize: "10px",
                            fontWeight: "700",
                            padding: "2px 6px",
                            borderRadius: "10px",
                            backgroundColor: sevBadge.bg,
                            color: sevBadge.color,
                            border: `1px solid ${sevBadge.border}`,
                          }}
                        >
                          ● {log.severity}
                        </span>
                      </td>
                      <td style={{ padding: "10px 14px", color: codeColor, fontWeight: "600" }}>
                        {log.server_name || "System"}
                      </td>
                      <td style={{ padding: "10px 14px", color: text, fontFamily: "sans-serif" }}>
                        {log.message}
                      </td>
                      <td style={{ padding: "10px 14px", textAlign: "right" }}>
                        <button
                          onClick={() => setSelectedLog(log)}
                          style={{
                            padding: "3px 8px",
                            backgroundColor: darkMode ? "#21262D" : "#F6F8FA",
                            border: `1px solid ${border}`,
                            color: text,
                            borderRadius: "4px",
                            fontSize: "11px",
                            cursor: "pointer",
                          }}
                        >
                          Details
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div style={{ padding: "14px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: `1px solid ${border}`, flexWrap: "wrap", gap: "10px" }}>
          <div style={{ fontSize: "12px", color: textSub }}>
            Showing page <strong>{logsData.page}</strong> of <strong>{logsData.total_pages}</strong> ({logsData.total_count} total logs)
          </div>

          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              style={{
                padding: "5px 12px",
                borderRadius: "6px",
                border: `1px solid ${border}`,
                backgroundColor: page <= 1 ? "transparent" : (darkMode ? "#21262D" : "#F6F8FA"),
                color: page <= 1 ? textSub : textTitle,
                fontSize: "12px",
                cursor: page <= 1 ? "not-allowed" : "pointer",
              }}
            >
              ◀ Previous
            </button>

            <button
              disabled={page >= logsData.total_pages}
              onClick={() => setPage((p) => Math.min(logsData.total_pages, p + 1))}
              style={{
                padding: "5px 12px",
                borderRadius: "6px",
                border: `1px solid ${border}`,
                backgroundColor: page >= logsData.total_pages ? "transparent" : (darkMode ? "#21262D" : "#F6F8FA"),
                color: page >= logsData.total_pages ? textSub : textTitle,
                fontSize: "12px",
                cursor: page >= logsData.total_pages ? "not-allowed" : "pointer",
              }}
            >
              Next ▶
            </button>
          </div>
        </div>
      </div>

      {/* Log Details Modal */}
      {selectedLog && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "20px",
          }}
        >
          <div
            style={{
              backgroundColor: cardBg,
              border: `1px solid ${border}`,
              borderRadius: "8px",
              padding: "24px",
              maxWidth: "550px",
              width: "100%",
              boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ margin: 0, fontSize: "16px", color: textTitle }}>📜 Audit Log #{selectedLog.id} Details</h3>
              <button
                onClick={() => setSelectedLog(null)}
                style={{ background: "none", border: "none", color: textSub, fontSize: "16px", cursor: "pointer" }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "13px" }}>
              <div><strong>Event Type:</strong> <code style={{ color: codeColor }}>{selectedLog.event_type}</code></div>
              <div><strong>Severity:</strong> <strong style={{ color: getSeverityBadge(selectedLog.severity).color }}>{selectedLog.severity}</strong></div>
              <div><strong>Server Node:</strong> {selectedLog.server_name || "System Level"}</div>
              <div><strong>Timestamp:</strong> {new Date(selectedLog.created_at).toUTCString()}</div>
              <div><strong>Message Payload:</strong></div>
              <div style={{ backgroundColor: darkMode ? "#0D1117" : "#F6F8FA", padding: "10px", borderRadius: "6px", border: `1px solid ${border}`, fontFamily: "monospace", fontSize: "12px" }}>
                {selectedLog.message}
              </div>

              {selectedLog.extra_metadata && (
                <div>
                  <strong>Metadata:</strong>
                  <pre style={{ backgroundColor: darkMode ? "#0D1117" : "#F6F8FA", padding: "10px", borderRadius: "6px", border: `1px solid ${border}`, fontSize: "11px", overflowX: "auto" }}>
                    {selectedLog.extra_metadata}
                  </pre>
                </div>
              )}
            </div>

            <div style={{ marginTop: "20px", textAlign: "right" }}>
              <button
                onClick={() => setSelectedLog(null)}
                style={{
                  backgroundColor: "#2563EB",
                  color: "#FFFFFF",
                  border: "none",
                  padding: "8px 16px",
                  borderRadius: "6px",
                  fontSize: "12px",
                  fontWeight: "600",
                  cursor: "pointer",
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Logs;
