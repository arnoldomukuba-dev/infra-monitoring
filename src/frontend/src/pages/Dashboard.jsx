import { useState, useEffect, useCallback } from "react";
import DashboardCards from "../components/DashboardCards";
import BackupForm from "../components/BackupForm";
import BackupTable from "../components/BackupTable";
import Charts from "../components/Charts";
import SearchBar from "../components/SearchBar";
import { getBackups, getSummary, getServersSummary, getAlerts, getAlertsSummary, getLogs, deleteBackup } from "../api/api";
import { useTheme } from "../context/ThemeContext";

function Dashboard() {
  const { darkMode } = useTheme();

  const [summary, setSummary] = useState({
    total_backups: 0,
    successful_backups: 0,
    failed_backups: 0,
    uploaded_backups: 0,
    success_rate: "0%",
  });
  const [serverSummary, setServerSummary] = useState({
    total_servers: 0,
    online_servers: 0,
    warning_servers: 0,
    critical_servers: 0,
    offline_servers: 0,
    avg_cpu_usage: 0,
    avg_ram_usage: 0,
    avg_disk_usage: 0,
  });
  const [alertSummary, setAlertSummary] = useState({
    total_active: 0,
    critical_active: 0,
    warning_active: 0,
    info_active: 0,
  });
  const [backups, setBackups] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [recentLogs, setRecentLogs] = useState([]);
  const [search, setSearch] = useState("");
  const [editingBackup, setEditingBackup] = useState(null);

  const cardBg = darkMode ? "#161B22" : "#FFFFFF";
  const border = darkMode ? "#30363D" : "#D0D7DE";
  const textTitle = darkMode ? "#F0F6FC" : "#1F2328";
  const textSub = darkMode ? "#8B949E" : "#6E7781";

  const loadData = useCallback(async () => {
    try {
      const [summaryRes, serverSumRes, alertSumRes, backupsRes, alertsRes, logsRes] = await Promise.allSettled([
        getSummary(),
        getServersSummary(),
        getAlertsSummary(),
        getBackups(),
        getAlerts(),
        getLogs({ limit: 5 }),
      ]);

      if (summaryRes.status === "fulfilled" && summaryRes.value) {
        setSummary(summaryRes.value);
      }

      if (serverSumRes.status === "fulfilled" && serverSumRes.value) {
        setServerSummary(serverSumRes.value);
      }

      if (alertSumRes.status === "fulfilled" && alertSumRes.value) {
        setAlertSummary(alertSumRes.value);
      }

      if (backupsRes.status === "fulfilled" && Array.isArray(backupsRes.value)) {
        setBackups(backupsRes.value);
      }

      if (alertsRes.status === "fulfilled" && Array.isArray(alertsRes.value)) {
        setAlerts(alertsRes.value.slice(0, 5));
      }

      if (logsRes.status === "fulfilled" && logsRes.value && Array.isArray(logsRes.value.logs)) {
        setRecentLogs(logsRes.value.logs);
      }
    } catch (err) {
      console.error("Failed to load dashboard data", err);
    }
  }, []);

  useEffect(() => {
    loadData();
    const timer = setInterval(loadData, 8000);
    return () => clearInterval(timer);
  }, [loadData]);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this backup record?")) return;
    try {
      await deleteBackup(id);
      loadData();
    } catch (err) {
      alert("Failed to delete backup: " + err.message);
    }
  };

  const filteredBackups = Array.isArray(backups)
    ? backups.filter((item) =>
      item.system_name?.toLowerCase().includes(search.toLowerCase()) ||
      item.file_name?.toLowerCase().includes(search.toLowerCase()) ||
      item.status?.toLowerCase().includes(search.toLowerCase())
    )
    : [];

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
      <header style={{ marginBottom: "20px" }}>
        <h1 style={{ margin: "0 0 6px 0", fontSize: "22px", fontWeight: "700", color: textTitle }}>
          🚀 ODRISYSTEMS Infrastructure Overview
        </h1>
        <p style={{ margin: 0, color: textSub, fontSize: "13px" }}>
          Real-time server telemetry, backup operations, and PostgreSQL threshold alerts
        </p>
      </header>

      {/* Real Infrastructure Telemetry Summary Cards */}
      <DashboardCards summary={summary} serverSummary={serverSummary} alertSummary={alertSummary} />

      {/* Grid Row: Recent Alerts & Quick Trigger Form */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(450px, 1fr))", gap: "20px", marginBottom: "24px" }}>
        {/* Live Infrastructure Alerts Panel */}
        <div
          style={{
            backgroundColor: cardBg,
            borderRadius: "8px",
            padding: "20px",
            border: `1px solid ${border}`,
            boxShadow: darkMode ? "0 4px 12px rgba(0,0,0,0.2)" : "0 2px 8px rgba(0,0,0,0.06)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
            <h2 style={{ fontSize: "15px", margin: 0, color: textTitle }}>🔔 Live Threshold Alerts (PostgreSQL)</h2>
            <span style={{ fontSize: "11px", color: "#3B82F6", fontWeight: "600" }}>Real-time Feed</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {alerts.length === 0 ? (
              <div style={{ fontSize: "12px", color: textSub, textAlign: "center", padding: "20px" }}>
                No active threshold alerts detected.
              </div>
            ) : (
              alerts.map((alt) => (
                <div
                  key={alt.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px 12px",
                    borderRadius: "6px",
                    backgroundColor: darkMode ? "#0D1117" : "#F6F8FA",
                    border: `1px solid ${border}`,
                  }}
                >
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "3px" }}>
                      <span
                        style={{
                          fontSize: "9px",
                          fontWeight: "700",
                          padding: "2px 6px",
                          borderRadius: "4px",
                          backgroundColor: alt.type === "CRITICAL" ? "rgba(239,68,68,0.15)" : alt.type === "WARNING" ? "rgba(245,158,11,0.15)" : "rgba(59,130,246,0.15)",
                          color: alt.type === "CRITICAL" ? "#EF4444" : alt.type === "WARNING" ? "#F59E0B" : "#3B82F6",
                        }}
                      >
                        {alt.type}
                      </span>
                      <span style={{ fontSize: "12px", fontWeight: "600", color: textTitle }}>{alt.server_name}</span>
                    </div>
                    <div style={{ fontSize: "12px", color: textSub }}>{alt.message}</div>
                  </div>
                  <span style={{ fontSize: "11px", color: textSub, whiteSpace: "nowrap" }}>
                    {new Date(alt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Trigger Backup Form Panel */}
        <div
          style={{
            backgroundColor: cardBg,
            borderRadius: "8px",
            padding: "20px",
            border: `1px solid ${border}`,
            boxShadow: darkMode ? "0 4px 12px rgba(0,0,0,0.2)" : "0 2px 8px rgba(0,0,0,0.06)",
          }}
        >
          <h2 style={{ fontSize: "15px", marginTop: 0, marginBottom: "14px", color: textTitle }}>
            {editingBackup ? "✏️ Edit Backup Record" : "➕ Trigger New Backup Record"}
          </h2>
          <BackupForm
            onSuccess={loadData}
            editingBackup={editingBackup}
            clearEditing={() => setEditingBackup(null)}
          />
        </div>
      </div>

      {/* Recent Infrastructure Activity (Audit Trail) */}
      <div
        style={{
          backgroundColor: cardBg,
          borderRadius: "8px",
          padding: "20px",
          marginBottom: "24px",
          border: `1px solid ${border}`,
          boxShadow: darkMode ? "0 4px 12px rgba(0,0,0,0.2)" : "0 2px 8px rgba(0,0,0,0.06)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
          <h2 style={{ fontSize: "15px", margin: 0, color: textTitle }}>📜 Recent Infrastructure Activity (Audit Logs)</h2>
          <a href="/logs" style={{ fontSize: "12px", color: "#3B82F6", textDecoration: "none", fontWeight: "600" }}>View All Logs →</a>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {recentLogs.length === 0 ? (
            <div style={{ fontSize: "12px", color: textSub, textAlign: "center", padding: "16px" }}>
              No infrastructure audit activity recorded yet.
            </div>
          ) : (
            recentLogs.map((log) => (
              <div
                key={log.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "8px 12px",
                  borderRadius: "6px",
                  backgroundColor: darkMode ? "#0D1117" : "#F6F8FA",
                  border: `1px solid ${border}`,
                  fontSize: "12px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span
                    style={{
                      fontSize: "9px",
                      fontWeight: "700",
                      padding: "2px 6px",
                      borderRadius: "4px",
                      backgroundColor: log.severity === "CRITICAL" ? "rgba(239,68,68,0.15)" : log.severity === "WARNING" ? "rgba(245,158,11,0.15)" : "rgba(59,130,246,0.15)",
                      color: log.severity === "CRITICAL" ? "#EF4444" : log.severity === "WARNING" ? "#F59E0B" : "#3B82F6",
                    }}
                  >
                    {log.event_type}
                  </span>
                  <span style={{ color: textTitle, fontWeight: "500" }}>{log.message}</span>
                </div>
                <span style={{ color: textSub, fontSize: "11px", whiteSpace: "nowrap" }}>
                  {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Backup Analytics Chart */}
      {backups.length > 0 && (
        <div
          style={{
            backgroundColor: cardBg,
            borderRadius: "8px",
            padding: "20px",
            marginBottom: "24px",
            border: `1px solid ${border}`,
            boxShadow: darkMode ? "0 4px 12px rgba(0,0,0,0.2)" : "0 2px 8px rgba(0,0,0,0.06)",
          }}
        >
          <h2 style={{ fontSize: "15px", marginTop: 0, marginBottom: "14px", color: textTitle }}>
            📈 Backup Analytics & Status Distribution
          </h2>
          <Charts backups={backups} />
        </div>
      )}

      {/* Real Backup Activity Table from PostgreSQL */}
      <div
        style={{
          backgroundColor: cardBg,
          borderRadius: "8px",
          padding: "20px",
          border: `1px solid ${border}`,
          boxShadow: darkMode ? "0 4px 12px rgba(0,0,0,0.2)" : "0 2px 8px rgba(0,0,0,0.06)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", flexWrap: "wrap", gap: "12px" }}>
          <h2 style={{ fontSize: "15px", margin: 0, color: textTitle }}>📁 Recent Backup Activity (PostgreSQL Live)</h2>
          <SearchBar search={search} setSearch={setSearch} />
        </div>

        <BackupTable
          backups={filteredBackups}
          setEditingBackup={setEditingBackup}
          handleDelete={handleDelete}
        />
      </div>
    </div>
  );
}

export default Dashboard;