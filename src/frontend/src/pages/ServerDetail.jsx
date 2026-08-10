import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { getServerDetails, getServerMetrics, collectServerMetrics, deleteServerNode } from "../api/api";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

function ServerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { darkMode } = useTheme();

  const [server, setServer] = useState(null);
  const [metrics, setMetrics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [collecting, setCollecting] = useState(false);

  const cardBg = darkMode ? "#161B22" : "#FFFFFF";
  const border = darkMode ? "#30363D" : "#D0D7DE";
  const textTitle = darkMode ? "#F0F6FC" : "#1F2328";
  const textSub = darkMode ? "#8B949E" : "#6E7781";

  const loadServerData = async () => {
    try {
      const [serverRes, metricsRes] = await Promise.all([
        getServerDetails(id),
        getServerMetrics(id, 30),
      ]);
      setServer(serverRes);
      if (Array.isArray(metricsRes)) {
        setMetrics(metricsRes.reverse()); // Chronological order
      }
    } catch (err) {
      console.error("Failed to fetch server details", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadServerData();
    const interval = setInterval(loadServerData, 10000);
    return () => clearInterval(interval);
  }, [id]);

  const handleManualCollect = async () => {
    try {
      setCollecting(true);
      await collectServerMetrics(id);
      await loadServerData();
    } catch (err) {
      alert("Metrics collection failed: " + err.message);
    } finally {
      setCollecting(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to remove server node #${id}?`)) return;
    try {
      await deleteServerNode(id);
      navigate("/servers");
    } catch (err) {
      alert("Failed to delete server node: " + err.message);
    }
  };

  if (loading) {
    return <div style={{ padding: "40px", textAlign: "center", color: textSub }}>Loading server telemetry...</div>;
  }

  if (!server) {
    return <div style={{ padding: "40px", textAlign: "center", color: textSub }}>Server node not found.</div>;
  }

  const latest = server.latest_metric || (metrics.length > 0 ? metrics[metrics.length - 1] : {});

  // Chart datasets
  const labels = metrics.map((m) => new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));

  const cpuChartData = {
    labels,
    datasets: [
      {
        label: "CPU Usage (%)",
        data: metrics.map((m) => m.cpu_usage),
        borderColor: "#3B82F6",
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        fill: true,
        tension: 0.3,
      },
    ],
  };

  const ramChartData = {
    labels,
    datasets: [
      {
        label: "RAM Usage (%)",
        data: metrics.map((m) => m.ram_usage),
        borderColor: "#10B981",
        backgroundColor: "rgba(16, 185, 129, 0.1)",
        fill: true,
        tension: 0.3,
      },
    ],
  };

  const diskChartData = {
    labels,
    datasets: [
      {
        label: "Disk Storage Usage (%)",
        data: metrics.map((m) => m.disk_usage),
        borderColor: "#EC4899",
        backgroundColor: "rgba(236, 72, 153, 0.1)",
        fill: true,
        tension: 0.3,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: "top", labels: { color: textTitle, font: { size: 12 } } } },
    scales: {
      x: { grid: { color: darkMode ? "#21262D" : "#E5E7EB" }, ticks: { color: textSub } },
      y: { grid: { color: darkMode ? "#21262D" : "#E5E7EB" }, ticks: { color: textSub } },
    },
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "ONLINE": return "#22C55E";
      case "WARNING": return "#EAB308";
      case "CRITICAL": return "#EF4444";
      default: return "#94A3B8";
    }
  };

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <button
            onClick={() => navigate("/servers")}
            style={{ backgroundColor: "transparent", border: `1px solid ${border}`, color: textSub, padding: "4px 10px", borderRadius: "4px", fontSize: "12px", cursor: "pointer", marginBottom: "8px" }}
          >
            ← Back to Server Inventory
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <h1 style={{ margin: 0, fontSize: "22px", fontWeight: "700", color: textTitle }}>
              🖥️ {server.name}
            </h1>
            <span
              style={{
                fontSize: "11px",
                fontWeight: "700",
                padding: "3px 10px",
                borderRadius: "12px",
                backgroundColor: `${getStatusColor(server.status)}20`,
                color: getStatusColor(server.status),
                border: `1px solid ${getStatusColor(server.status)}40`,
              }}
            >
              ● {server.status}
            </span>
          </div>
          <p style={{ margin: "4px 0 0 0", color: textSub, fontSize: "13px" }}>
            Host: <span style={{ fontFamily: "monospace", color: "#38BDF8" }}>{server.host}</span> | OS: {server.os} {server.description && `| ${server.description}`}
          </p>
        </div>

        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={handleManualCollect}
            disabled={collecting}
            style={{
              backgroundColor: "#2563EB",
              color: "#FFFFFF",
              border: "none",
              padding: "8px 14px",
              borderRadius: "6px",
              fontSize: "12px",
              fontWeight: "600",
              cursor: "pointer",
            }}
          >
            {collecting ? "Collecting..." : "🔄 Sample Real Telemetry"}
          </button>
          <button
            onClick={handleDelete}
            style={{
              backgroundColor: "rgba(239, 68, 68, 0.15)",
              border: "1px solid rgba(239, 68, 68, 0.4)",
              color: "#EF4444",
              padding: "8px 14px",
              borderRadius: "6px",
              fontSize: "12px",
              fontWeight: "600",
              cursor: "pointer",
            }}
          >
            Delete Node
          </button>
        </div>
      </div>

      {/* Live Telemetry Summary Gauges */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "14px", marginBottom: "24px" }}>
        <div style={{ backgroundColor: cardBg, border: `1px solid ${border}`, borderRadius: "8px", padding: "16px" }}>
          <div style={{ fontSize: "11px", color: textSub, fontWeight: "600", marginBottom: "4px" }}>CURRENT CPU LOAD</div>
          <div style={{ fontSize: "24px", fontWeight: "700", fontFamily: "monospace", color: "#3B82F6" }}>
            {latest?.cpu_usage || 0}%
          </div>
          <div style={{ fontSize: "11px", color: textSub, marginTop: "4px" }}>Host OS Telemetry</div>
        </div>

        <div style={{ backgroundColor: cardBg, border: `1px solid ${border}`, borderRadius: "8px", padding: "16px" }}>
          <div style={{ fontSize: "11px", color: textSub, fontWeight: "600", marginBottom: "4px" }}>RAM UTILIZATION</div>
          <div style={{ fontSize: "24px", fontWeight: "700", fontFamily: "monospace", color: "#10B981" }}>
            {latest?.ram_usage || 0}%
          </div>
          <div style={{ fontSize: "11px", color: textSub, marginTop: "4px" }}>
            {latest?.ram_used_gb || 0} GB / {latest?.ram_total_gb || 0} GB
          </div>
        </div>

        <div style={{ backgroundColor: cardBg, border: `1px solid ${border}`, borderRadius: "8px", padding: "16px" }}>
          <div style={{ fontSize: "11px", color: textSub, fontWeight: "600", marginBottom: "4px" }}>DISK STORAGE</div>
          <div style={{ fontSize: "24px", fontWeight: "700", fontFamily: "monospace", color: "#EC4899" }}>
            {latest?.disk_usage || 0}%
          </div>
          <div style={{ fontSize: "11px", color: textSub, marginTop: "4px" }}>
            {latest?.disk_used_gb || 0} GB / {latest?.disk_total_gb || 0} GB
          </div>
        </div>

        <div style={{ backgroundColor: cardBg, border: `1px solid ${border}`, borderRadius: "8px", padding: "16px" }}>
          <div style={{ fontSize: "11px", color: textSub, fontWeight: "600", marginBottom: "4px" }}>NETWORK & UPTIME</div>
          <div style={{ fontSize: "16px", fontWeight: "700", color: textTitle }}>
            {latest?.uptime || "N/A"}
          </div>
          <div style={{ fontSize: "11px", color: textSub, marginTop: "4px" }}>
            Sent: {latest?.network_sent_mb || 0} MB | Recv: {latest?.network_recv_mb || 0} MB
          </div>
        </div>
      </div>

      {/* Historical Metric Charts */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "20px" }}>
        <div style={{ backgroundColor: cardBg, border: `1px solid ${border}`, borderRadius: "8px", padding: "20px" }}>
          <h3 style={{ margin: "0 0 14px 0", fontSize: "15px", fontWeight: "700", color: textTitle }}>⚡ Historical CPU Telemetry (%)</h3>
          <div style={{ height: "220px" }}>
            <Line data={cpuChartData} options={chartOptions} />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(450px, 1fr))", gap: "20px" }}>
          <div style={{ backgroundColor: cardBg, border: `1px solid ${border}`, borderRadius: "8px", padding: "20px" }}>
            <h3 style={{ margin: "0 0 14px 0", fontSize: "15px", fontWeight: "700", color: textTitle }}>🧠 Historical RAM Consumption (%)</h3>
            <div style={{ height: "200px" }}>
              <Line data={ramChartData} options={chartOptions} />
            </div>
          </div>

          <div style={{ backgroundColor: cardBg, border: `1px solid ${border}`, borderRadius: "8px", padding: "20px" }}>
            <h3 style={{ margin: "0 0 14px 0", fontSize: "15px", fontWeight: "700", color: textTitle }}>💾 Historical Disk Storage (%)</h3>
            <div style={{ height: "200px" }}>
              <Line data={diskChartData} options={chartOptions} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ServerDetail;
