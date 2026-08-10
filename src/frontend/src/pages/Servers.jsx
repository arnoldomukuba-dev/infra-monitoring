import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { getServers, createServerNode, collectServerMetrics } from "../api/api";

function Servers() {
  const { darkMode } = useTheme();
  const navigate = useNavigate();

  const [servers, setServers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newServer, setNewServer] = useState({
    name: "",
    host: "",
    os: "Ubuntu 22.04 LTS",
    description: "",
  });

  const cardBg = darkMode ? "#161B22" : "#FFFFFF";
  const border = darkMode ? "#30363D" : "#D0D7DE";
  const textTitle = darkMode ? "#F0F6FC" : "#1F2328";
  const textSub = darkMode ? "#8B949E" : "#6E7781";
  const inputBg = darkMode ? "#0D1117" : "#F6F8FA";

  const fetchServers = async () => {
    try {
      const data = await getServers();
      if (Array.isArray(data)) setServers(data);
    } catch (err) {
      console.error("Failed to fetch servers", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServers();
    const interval = setInterval(fetchServers, 8000);
    return () => clearInterval(interval);
  }, []);

  const handleAddServer = async (e) => {
    e.preventDefault();
    if (!newServer.name || !newServer.host) return;

    try {
      await createServerNode(newServer);
      setNewServer({ name: "", host: "", os: "Ubuntu 22.04 LTS", description: "" });
      setShowAddModal(false);
      fetchServers();
    } catch (err) {
      alert("Failed to register server node: " + (err.response?.data?.detail || err.message));
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "ONLINE":
        return { bg: "rgba(34, 197, 94, 0.15)", color: "#22C55E", label: "ONLINE" };
      case "WARNING":
        return { bg: "rgba(234, 179, 8, 0.15)", color: "#EAB308", label: "WARNING" };
      case "CRITICAL":
        return { bg: "rgba(239, 68, 68, 0.15)", color: "#EF4444", label: "CRITICAL" };
      default:
        return { bg: "rgba(148, 163, 184, 0.15)", color: "#94A3B8", label: "OFFLINE" };
    }
  };

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
      <header style={{ marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h1 style={{ margin: "0 0 6px 0", fontSize: "22px", fontWeight: "700", color: textTitle }}>
            🖥️ Server Infrastructure Inventory
          </h1>
          <p style={{ margin: 0, color: textSub, fontSize: "13px" }}>
            Live monitored server nodes, IP addresses, OS, and PostgreSQL telemetry
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(!showAddModal)}
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
          {showAddModal ? "✕ Close Form" : "➕ Add Monitored Server"}
        </button>
      </header>

      {/* Add Server Form Panel */}
      {showAddModal && (
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
            ➕ Register New Server Node in Database
          </h2>
          <form onSubmit={handleAddServer} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px", alignItems: "end" }}>
            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: "600", color: textTitle, marginBottom: "4px" }}>Server Name *</label>
              <input
                placeholder="e.g. odri-app-node-02"
                value={newServer.name}
                onChange={(e) => setNewServer({ ...newServer, name: e.target.value })}
                required
                style={{ width: "100%", padding: "8px", borderRadius: "6px", border: `1px solid ${border}`, backgroundColor: inputBg, color: textTitle, fontSize: "13px" }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: "600", color: textTitle, marginBottom: "4px" }}>Host / IP Address *</label>
              <input
                placeholder="e.g. 192.168.1.50 or 127.0.0.1"
                value={newServer.host}
                onChange={(e) => setNewServer({ ...newServer, host: e.target.value })}
                required
                style={{ width: "100%", padding: "8px", borderRadius: "6px", border: `1px solid ${border}`, backgroundColor: inputBg, color: textTitle, fontSize: "13px" }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: "600", color: textTitle, marginBottom: "4px" }}>Operating System</label>
              <input
                placeholder="Ubuntu 22.04 LTS / Debian 12"
                value={newServer.os}
                onChange={(e) => setNewServer({ ...newServer, os: e.target.value })}
                style={{ width: "100%", padding: "8px", borderRadius: "6px", border: `1px solid ${border}`, backgroundColor: inputBg, color: textTitle, fontSize: "13px" }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: "600", color: textTitle, marginBottom: "4px" }}>Description</label>
              <input
                placeholder="Production API Node"
                value={newServer.description}
                onChange={(e) => setNewServer({ ...newServer, description: e.target.value })}
                style={{ width: "100%", padding: "8px", borderRadius: "6px", border: `1px solid ${border}`, backgroundColor: inputBg, color: textTitle, fontSize: "13px" }}
              />
            </div>
            <button
              type="submit"
              style={{ backgroundColor: "#2563EB", color: "#FFFFFF", border: "none", padding: "9px 16px", borderRadius: "6px", fontSize: "13px", fontWeight: "600", cursor: "pointer" }}
            >
              Add Server Node
            </button>
          </form>
        </div>
      )}

      {/* Grid of Monitored Servers */}
      {loading ? (
        <div style={{ padding: "40px", textAlign: "center", color: textSub }}>Loading servers from database...</div>
      ) : servers.length === 0 ? (
        <div style={{ backgroundColor: cardBg, padding: "40px", borderRadius: "8px", border: `1px solid ${border}`, textAlign: "center", color: textSub }}>
          No servers registered yet. Click "Add Monitored Server" above to add your first node.
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))", gap: "16px" }}>
          {servers.map((server) => {
            const badge = getStatusBadge(server.status);
            const latest = server.latest_metric || {};
            return (
              <div
                key={server.id}
                onClick={() => navigate(`/servers/${server.id}`)}
                style={{
                  backgroundColor: cardBg,
                  border: `1px solid ${border}`,
                  borderRadius: "8px",
                  padding: "18px",
                  cursor: "pointer",
                  boxShadow: darkMode ? "0 4px 12px rgba(0,0,0,0.2)" : "0 2px 8px rgba(0,0,0,0.06)",
                  transition: "transform 0.15s ease, border-color 0.15s ease",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: "15px", fontWeight: "700", color: textTitle }}>
                      {server.name}
                    </h3>
                    <div style={{ fontSize: "12px", color: textSub, marginTop: "2px" }}>
                      <span style={{ fontFamily: "monospace", color: "#38BDF8" }}>{server.host}</span> • {server.os}
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: "10px",
                      fontWeight: "700",
                      padding: "3px 8px",
                      borderRadius: "12px",
                      backgroundColor: badge.bg,
                      color: badge.color,
                      letterSpacing: "0.5px",
                    }}
                  >
                    ● {badge.label}
                  </span>
                </div>

                {/* Resource Usage Gauges */}
                <div style={{ display: "flex", flexDirection: "column", gap: "10px", margin: "14px 0" }}>
                  {/* CPU */}
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: textSub, marginBottom: "4px" }}>
                      <span>CPU Load</span>
                      <span style={{ fontWeight: "600", color: textTitle }}>{latest.cpu_usage || 0}%</span>
                    </div>
                    <div style={{ height: "6px", width: "100%", backgroundColor: darkMode ? "#21262D" : "#E5E7EB", borderRadius: "3px", overflow: "hidden" }}>
                      <div
                        style={{
                          height: "100%",
                          width: `${latest.cpu_usage || 0}%`,
                          backgroundColor: (latest.cpu_usage || 0) > 75 ? "#EF4444" : "#3B82F6",
                          borderRadius: "3px",
                          transition: "width 0.3s ease",
                        }}
                      ></div>
                    </div>
                  </div>

                  {/* RAM */}
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: textSub, marginBottom: "4px" }}>
                      <span>RAM Utilization</span>
                      <span style={{ fontWeight: "600", color: textTitle }}>{latest.ram_usage || 0}%</span>
                    </div>
                    <div style={{ height: "6px", width: "100%", backgroundColor: darkMode ? "#21262D" : "#E5E7EB", borderRadius: "3px", overflow: "hidden" }}>
                      <div
                        style={{
                          height: "100%",
                          width: `${latest.ram_usage || 0}%`,
                          backgroundColor: (latest.ram_usage || 0) > 80 ? "#F59E0B" : "#10B981",
                          borderRadius: "3px",
                          transition: "width 0.3s ease",
                        }}
                      ></div>
                    </div>
                  </div>

                  {/* Disk */}
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: textSub, marginBottom: "4px" }}>
                      <span>Disk Storage</span>
                      <span style={{ fontWeight: "600", color: textTitle }}>{latest.disk_usage || 0}%</span>
                    </div>
                    <div style={{ height: "6px", width: "100%", backgroundColor: darkMode ? "#21262D" : "#E5E7EB", borderRadius: "3px", overflow: "hidden" }}>
                      <div
                        style={{
                          height: "100%",
                          width: `${latest.disk_usage || 0}%`,
                          backgroundColor: (latest.disk_usage || 0) > 85 ? "#EF4444" : "#6366F1",
                          borderRadius: "3px",
                          transition: "width 0.3s ease",
                        }}
                      ></div>
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "12px", borderTop: `1px solid ${border}`, fontSize: "11px", color: textSub }}>
                  <span>Uptime: {latest.uptime || "N/A"}</span>
                  <span style={{ color: "#3B82F6", fontWeight: "600" }}>View Telemetry Details →</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Servers;
