import { useState, useEffect, useCallback } from "react";
import BackupTable from "../components/BackupTable";
import BackupForm from "../components/BackupForm";
import SearchBar from "../components/SearchBar";
import { getBackups, getSummary, getServers, deleteBackup } from "../api/api";
import { useTheme } from "../context/ThemeContext";

function Backups() {
  const { darkMode } = useTheme();

  const [summary, setSummary] = useState({
    total_backups: 0,
    successful_backups: 0,
    failed_backups: 0,
    running_backups: 0,
    warning_backups: 0,
    success_percentage: "0%",
    total_storage_gb: 0,
  });

  const [servers, setServers] = useState([]);
  const [backups, setBackups] = useState([]);
  const [search, setSearch] = useState("");
  const [serverFilter, setServerFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [showForm, setShowForm] = useState(false);
  const [editingBackup, setEditingBackup] = useState(null);

  const cardBg = darkMode ? "#161B22" : "#FFFFFF";
  const border = darkMode ? "#30363D" : "#D0D7DE";
  const textTitle = darkMode ? "#F0F6FC" : "#1F2328";
  const textSub = darkMode ? "#8B949E" : "#6E7781";

  const loadData = useCallback(async () => {
    try {
      const [sumRes, srvRes, bckRes] = await Promise.allSettled([
        getSummary(),
        getServers(),
        getBackups(),
      ]);

      if (sumRes.status === "fulfilled" && sumRes.value) {
        setSummary(sumRes.value);
      }

      if (srvRes.status === "fulfilled" && Array.isArray(srvRes.value)) {
        setServers(srvRes.value);
      }

      if (bckRes.status === "fulfilled" && Array.isArray(bckRes.value)) {
        setBackups(bckRes.value);
      }
    } catch (err) {
      console.error("Error loading backups page data", err);
    }
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 8000);
    return () => clearInterval(interval);
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

  const handleEditClick = (backup) => {
    setEditingBackup(backup);
    setShowForm(true);
  };

  const filteredBackups = Array.isArray(backups)
    ? backups.filter((item) => {
        const matchesSearch =
          item.backup_name?.toLowerCase().includes(search.toLowerCase()) ||
          item.system_name?.toLowerCase().includes(search.toLowerCase()) ||
          item.file_name?.toLowerCase().includes(search.toLowerCase()) ||
          item.status?.toLowerCase().includes(search.toLowerCase());

        const matchesServer =
          serverFilter === "ALL" || String(item.server_id) === String(serverFilter);

        const matchesStatus =
          statusFilter === "ALL" || item.status?.toUpperCase() === statusFilter.toUpperCase();

        const matchesType =
          typeFilter === "ALL" || item.backup_type?.toUpperCase() === typeFilter.toUpperCase();

        return matchesSearch && matchesServer && matchesStatus && matchesType;
      })
    : [];

  const cards = [
    { title: "Total Backups", val: summary.total_backups, sub: "Recorded Backup Jobs", color: "#3B82F6", icon: "📦" },
    { title: "Success Rate", val: summary.success_percentage, sub: `${summary.successful_backups} Succeeded`, color: "#10B981", icon: "✅" },
    { title: "Failed Jobs", val: summary.failed_backups, sub: "Triggered Failure Alerts", color: "#EF4444", icon: "⚠️" },
    { title: "Active Running", val: summary.running_backups, sub: "In-Progress Jobs", color: "#3B82F6", icon: "⏳" },
    { title: "Total Storage Vault", val: `${summary.total_storage_gb} GB`, sub: "Preserved Capacity", color: "#8B5CF6", icon: "💾" },
  ];

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
      <header style={{ marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h1 style={{ margin: "0 0 6px 0", fontSize: "22px", fontWeight: "700", color: textTitle }}>
            💾 Infrastructure Backup Monitoring & Vault
          </h1>
          <p style={{ margin: 0, color: textSub, fontSize: "13px" }}>
            Real-time backup job execution monitoring, failure alerts, and historical data storage
          </p>
        </div>

        <button
          onClick={() => {
            setEditingBackup(null);
            setShowForm(!showForm);
          }}
          style={{
            backgroundColor: "#2563EB",
            color: "#FFFFFF",
            border: "none",
            padding: "8px 16px",
            borderRadius: "6px",
            fontSize: "13px",
            fontWeight: "600",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          {showForm ? "✕ Close Form" : "➕ Trigger New Backup"}
        </button>
      </header>

      {/* Overview Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "14px", marginBottom: "24px" }}>
        {cards.map((c, i) => (
          <div
            key={i}
            style={{
              backgroundColor: cardBg,
              border: `1px solid ${border}`,
              borderRadius: "8px",
              padding: "16px",
              boxShadow: darkMode ? "0 4px 12px rgba(0,0,0,0.2)" : "0 2px 8px rgba(0,0,0,0.06)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
              <span style={{ fontSize: "11px", fontWeight: "700", color: c.color, textTransform: "uppercase" }}>{c.title}</span>
              <span style={{ fontSize: "16px" }}>{c.icon}</span>
            </div>
            <div style={{ fontSize: "22px", fontWeight: "700", color: textTitle, fontFamily: "monospace" }}>{c.val}</div>
            <div style={{ fontSize: "11px", color: textSub }}>{c.sub}</div>
          </div>
        ))}
      </div>

      {/* Backup Form Modal/Panel */}
      {showForm && (
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
            {editingBackup ? "✏️ Edit Backup Job Record" : "➕ Trigger New Backup Job"}
          </h2>
          <BackupForm
            onSuccess={() => {
              loadData();
              setShowForm(false);
              setEditingBackup(null);
            }}
            editingBackup={editingBackup}
            clearEditing={() => {
              setEditingBackup(null);
              setShowForm(false);
            }}
          />
        </div>
      )}

      {/* Filter Toolbar & Table */}
      <div
        style={{
          backgroundColor: cardBg,
          borderRadius: "8px",
          padding: "20px",
          border: `1px solid ${border}`,
          boxShadow: darkMode ? "0 4px 12px rgba(0,0,0,0.2)" : "0 2px 8px rgba(0,0,0,0.06)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
            <h2 style={{ fontSize: "15px", margin: 0, color: textTitle }}>
              Backup History ({filteredBackups.length})
            </h2>

            {/* Server Filter */}
            <select
              value={serverFilter}
              onChange={(e) => setServerFilter(e.target.value)}
              style={{
                padding: "6px 10px",
                borderRadius: "6px",
                border: `1px solid ${border}`,
                backgroundColor: darkMode ? "#0D1117" : "#F6F8FA",
                color: textTitle,
                fontSize: "12px",
              }}
            >
              <option value="ALL">All Server Nodes</option>
              {servers.map((srv) => (
                <option key={srv.id} value={srv.id}>{srv.name}</option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                padding: "6px 10px",
                borderRadius: "6px",
                border: `1px solid ${border}`,
                backgroundColor: darkMode ? "#0D1117" : "#F6F8FA",
                color: textTitle,
                fontSize: "12px",
              }}
            >
              <option value="ALL">All Statuses</option>
              <option value="SUCCESS">SUCCESS</option>
              <option value="FAILED">FAILED</option>
              <option value="RUNNING">RUNNING</option>
              <option value="WARNING">WARNING</option>
            </select>

            {/* Type Filter */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              style={{
                padding: "6px 10px",
                borderRadius: "6px",
                border: `1px solid ${border}`,
                backgroundColor: darkMode ? "#0D1117" : "#F6F8FA",
                color: textTitle,
                fontSize: "12px",
              }}
            >
              <option value="ALL">All Job Types</option>
              <option value="FULL">FULL</option>
              <option value="INCREMENTAL">INCREMENTAL</option>
              <option value="DIFFERENTIAL">DIFFERENTIAL</option>
              <option value="DATABASE">DATABASE</option>
              <option value="SYSTEM_STATE">SYSTEM_STATE</option>
            </select>
          </div>

          <SearchBar search={search} setSearch={setSearch} />
        </div>

        <BackupTable
          backups={filteredBackups}
          setEditingBackup={handleEditClick}
          handleDelete={handleDelete}
        />
      </div>
    </div>
  );
}

export default Backups;