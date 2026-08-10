import { useState, useEffect, useCallback } from "react";
import { useTheme } from "../context/ThemeContext";
import { getAlerts, acknowledgeAlert, resolveAlertRecord, deleteAlertRecord } from "../api/api";

function Alerts() {
  const { darkMode } = useTheme();

  const [severityFilter, setSeverityFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  const cardBg = darkMode ? "#161B22" : "#FFFFFF";
  const border = darkMode ? "#30363D" : "#D0D7DE";
  const textTitle = darkMode ? "#F0F6FC" : "#1F2328";
  const textSub = darkMode ? "#8B949E" : "#6E7781";

  const fetchAlerts = useCallback(async () => {
    try {
      const data = await getAlerts(severityFilter, statusFilter);
      if (Array.isArray(data)) setAlerts(data);
    } catch (err) {
      console.error("Failed to fetch alerts", err);
    } finally {
      setLoading(false);
    }
  }, [severityFilter, statusFilter]);

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 8000);
    return () => clearInterval(interval);
  }, [fetchAlerts]);

  const handleAck = async (id) => {
    try {
      await acknowledgeAlert(id);
      fetchAlerts();
    } catch (err) {
      alert("Failed to acknowledge alert: " + err.message);
    }
  };

  const handleResolve = async (id) => {
    try {
      await resolveAlertRecord(id);
      fetchAlerts();
    } catch (err) {
      alert("Failed to resolve alert: " + err.message);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteAlertRecord(id);
      fetchAlerts();
    } catch (err) {
      alert("Failed to delete alert: " + err.message);
    }
  };

  const getSeverityStyle = (type) => {
    switch (type) {
      case "CRITICAL":
        return { bg: "rgba(239, 68, 68, 0.15)", color: "#EF4444", border: "rgba(239, 68, 68, 0.3)" };
      case "WARNING":
        return { bg: "rgba(245, 158, 11, 0.15)", color: "#F59E0B", border: "rgba(245, 158, 11, 0.3)" };
      default:
        return { bg: "rgba(59, 130, 246, 0.15)", color: "#3B82F6", border: "rgba(59, 130, 246, 0.3)" };
    }
  };

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
      <header style={{ marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h1 style={{ margin: "0 0 6px 0", fontSize: "22px", fontWeight: "700", color: textTitle }}>
            🚨 Infrastructure Alerts & Incident Notifications
          </h1>
          <p style={{ margin: 0, color: textSub, fontSize: "13px" }}>
            Real-time threshold violation incident notifications and acknowledgement workflow
          </p>
        </div>

        {/* Filter Controls */}
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          {/* Severity Filter */}
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <span style={{ fontSize: "12px", color: textSub, marginRight: "4px" }}>Severity:</span>
            {["ALL", "CRITICAL", "WARNING", "INFO"].map((type) => (
              <button
                key={type}
                onClick={() => setSeverityFilter(type)}
                style={{
                  padding: "5px 10px",
                  borderRadius: "6px",
                  border: `1px solid ${severityFilter === type ? "#3B82F6" : border}`,
                  backgroundColor: severityFilter === type ? (darkMode ? "rgba(59,130,246,0.2)" : "#EFF6FF") : cardBg,
                  color: severityFilter === type ? "#3B82F6" : textSub,
                  fontSize: "12px",
                  fontWeight: "600",
                  cursor: "pointer",
                }}
              >
                {type}
              </button>
            ))}
          </div>

          {/* Status Filter */}
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <span style={{ fontSize: "12px", color: textSub, marginRight: "4px" }}>Status:</span>
            {["ALL", "ACTIVE", "ACKNOWLEDGED", "RESOLVED"].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                style={{
                  padding: "5px 10px",
                  borderRadius: "6px",
                  border: `1px solid ${statusFilter === st ? "#10B981" : border}`,
                  backgroundColor: statusFilter === st ? (darkMode ? "rgba(16,185,129,0.2)" : "#ECFDF5") : cardBg,
                  color: statusFilter === st ? "#10B981" : textSub,
                  fontSize: "12px",
                  fontWeight: "600",
                  cursor: "pointer",
                }}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </header>

      {loading ? (
        <div style={{ padding: "40px", textAlign: "center", color: textSub }}>Loading alerts...</div>
      ) : alerts.length === 0 ? (
        <div style={{ backgroundColor: cardBg, padding: "40px", borderRadius: "8px", border: `1px solid ${border}`, textAlign: "center", color: textSub }}>
          No alert incidents match the current severity and status filters.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {alerts.map((alt) => {
            const style = getSeverityStyle(alt.severity);
            return (
              <div
                key={alt.id}
                style={{
                  backgroundColor: cardBg,
                  border: `1px solid ${style.border}`,
                  borderRadius: "8px",
                  padding: "16px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  boxShadow: darkMode ? "0 4px 12px rgba(0,0,0,0.2)" : "0 2px 8px rgba(0,0,0,0.06)",
                  flexWrap: "wrap",
                  gap: "12px",
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                    <span
                      style={{
                        backgroundColor: style.bg,
                        color: style.color,
                        padding: "2px 8px",
                        borderRadius: "4px",
                        fontSize: "11px",
                        fontWeight: "700",
                      }}
                    >
                      {alt.severity}
                    </span>
                    <span style={{ fontSize: "14px", fontWeight: "700", color: textTitle }}>
                      {alt.server_name}
                    </span>
                    <span style={{ fontSize: "11px", color: textSub }}>
                      • {alt.alert_type} Alert
                    </span>
                    <span style={{ fontSize: "11px", color: textSub }}>
                      • {new Date(alt.timestamp).toLocaleString()}
                    </span>
                  </div>

                  <div style={{ fontSize: "13px", color: textTitle, marginBottom: "4px" }}>
                    {alt.message}
                  </div>

                  {alt.current_value !== null && alt.threshold_value !== null && (
                    <div style={{ fontSize: "11px", color: textSub }}>
                      Current Metric: <strong style={{ color: style.color }}>{alt.current_value}%</strong> | Configured Threshold: <strong>{alt.threshold_value}%</strong>
                    </div>
                  )}
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: "700",
                      padding: "4px 10px",
                      borderRadius: "12px",
                      backgroundColor: alt.status === "ACTIVE" ? "rgba(239, 68, 68, 0.15)" : alt.status === "ACKNOWLEDGED" ? "rgba(245, 158, 11, 0.15)" : "rgba(34, 197, 94, 0.15)",
                      color: alt.status === "ACTIVE" ? "#EF4444" : alt.status === "ACKNOWLEDGED" ? "#F59E0B" : "#22C55E",
                    }}
                  >
                    {alt.status}
                  </span>

                  {alt.status === "ACTIVE" && (
                    <button
                      onClick={() => handleAck(alt.id)}
                      style={{
                        backgroundColor: "#2563EB",
                        color: "#FFFFFF",
                        border: "none",
                        padding: "6px 12px",
                        borderRadius: "6px",
                        fontSize: "12px",
                        fontWeight: "600",
                        cursor: "pointer",
                      }}
                    >
                      Acknowledge
                    </button>
                  )}

                  {alt.status !== "RESOLVED" && (
                    <button
                      onClick={() => handleResolve(alt.id)}
                      style={{
                        backgroundColor: "#10B981",
                        color: "#FFFFFF",
                        border: "none",
                        padding: "6px 12px",
                        borderRadius: "6px",
                        fontSize: "12px",
                        fontWeight: "600",
                        cursor: "pointer",
                      }}
                    >
                      Resolve
                    </button>
                  )}

                  <button
                    onClick={() => handleDelete(alt.id)}
                    style={{
                      backgroundColor: "transparent",
                      border: `1px solid ${border}`,
                      color: textSub,
                      padding: "6px 10px",
                      borderRadius: "6px",
                      fontSize: "12px",
                      cursor: "pointer",
                    }}
                  >
                    Clear
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Alerts;
