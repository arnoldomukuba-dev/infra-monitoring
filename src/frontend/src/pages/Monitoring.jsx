import { useState } from "react";
import { useTheme } from "../context/ThemeContext";
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

function Monitoring() {
  const { darkMode } = useTheme();
  const [timeRange, setTimeRange] = useState("1h");

  const cardBg = darkMode ? "#161B22" : "#FFFFFF";
  const border = darkMode ? "#30363D" : "#D0D7DE";
  const textTitle = darkMode ? "#F0F6FC" : "#1F2328";
  const textSub = darkMode ? "#8B949E" : "#6E7781";

  const timeLabels = ["11:00", "11:05", "11:10", "11:15", "11:20", "11:25", "11:30", "11:35", "11:40", "11:45", "11:50"];

  const cpuData = {
    labels: timeLabels,
    datasets: [
      {
        label: "odri-db-primary-01 (CPU %)",
        data: [18, 22, 25, 30, 28, 45, 32, 24, 26, 22, 24],
        borderColor: "#3B82F6",
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        fill: true,
        tension: 0.3,
      },
      {
        label: "odri-backend-app-01 (CPU %)",
        data: [35, 40, 38, 52, 60, 48, 42, 38, 40, 44, 42],
        borderColor: "#8B5CF6",
        backgroundColor: "rgba(139, 92, 246, 0.1)",
        fill: true,
        tension: 0.3,
      },
    ],
  };

  const memoryData = {
    labels: timeLabels,
    datasets: [
      {
        label: "RAM Consumption (GB)",
        data: [12.4, 12.6, 12.8, 13.1, 13.5, 14.0, 13.8, 13.6, 13.5, 13.7, 13.6],
        borderColor: "#10B981",
        backgroundColor: "rgba(16, 185, 129, 0.1)",
        fill: true,
        tension: 0.3,
      },
    ],
  };

  const diskData = {
    labels: timeLabels,
    datasets: [
      {
        label: "Storage Vault Read I/O (MB/s)",
        data: [45, 50, 48, 120, 180, 210, 95, 60, 55, 50, 52],
        borderColor: "#EC4899",
        backgroundColor: "rgba(236, 72, 153, 0.1)",
        fill: true,
        tension: 0.3,
      },
      {
        label: "Storage Vault Write I/O (MB/s)",
        data: [20, 25, 22, 85, 140, 160, 60, 35, 30, 28, 26],
        borderColor: "#6366F1",
        backgroundColor: "rgba(99, 102, 241, 0.1)",
        fill: true,
        tension: 0.3,
      },
    ],
  };

  const networkData = {
    labels: timeLabels,
    datasets: [
      {
        label: "Inbound Traffic (MB/s)",
        data: [12, 18, 15, 42, 68, 85, 45, 30, 25, 20, 22],
        borderColor: "#F59E0B",
        backgroundColor: "rgba(245, 158, 11, 0.1)",
        fill: true,
        tension: 0.3,
      },
      {
        label: "Outbound Traffic (MB/s)",
        data: [8, 12, 10, 28, 45, 55, 30, 20, 18, 15, 16],
        borderColor: "#14B8A6",
        backgroundColor: "rgba(20, 184, 166, 0.1)",
        fill: true,
        tension: 0.3,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
        labels: {
          color: textTitle,
          font: { size: 12 },
        },
      },
    },
    scales: {
      x: {
        grid: { color: darkMode ? "#21262D" : "#E5E7EB" },
        ticks: { color: textSub },
      },
      y: {
        grid: { color: darkMode ? "#21262D" : "#E5E7EB" },
        ticks: { color: textSub },
      },
    },
  };

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
      <header style={{ marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h1 style={{ margin: "0 0 6px 0", fontSize: "22px", fontWeight: "700", color: textTitle }}>
            📈 Infrastructure Telemetry & Historical Metrics
          </h1>
          <p style={{ margin: 0, color: textSub, fontSize: "13px" }}>
            Prometheus time-series charts (CPU, RAM, Disk I/O & Network Metrics)
          </p>
        </div>

        {/* Historical Time Range Selector */}
        <div style={{ display: "flex", gap: "6px" }}>
          {["1h", "6h", "24h", "7d", "30d"].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              style={{
                padding: "6px 12px",
                borderRadius: "6px",
                border: `1px solid ${timeRange === range ? "#3B82F6" : border}`,
                backgroundColor: timeRange === range ? (darkMode ? "rgba(59,130,246,0.2)" : "#EFF6FF") : cardBg,
                color: timeRange === range ? "#3B82F6" : textSub,
                fontSize: "12px",
                fontWeight: "600",
                cursor: "pointer",
              }}
            >
              {range}
            </button>
          ))}
        </div>
      </header>

      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "20px" }}>
        {/* CPU Chart */}
        <div
          style={{
            backgroundColor: cardBg,
            border: `1px solid ${border}`,
            borderRadius: "8px",
            padding: "20px",
            boxShadow: darkMode ? "0 4px 12px rgba(0,0,0,0.2)" : "0 2px 8px rgba(0,0,0,0.06)",
          }}
        >
          <h3 style={{ margin: "0 0 14px 0", fontSize: "15px", fontWeight: "700", color: textTitle }}>
            ⚡ CPU Load Usage Charts ({timeRange} Historical Window)
          </h3>
          <div style={{ height: "240px" }}>
            <Line data={cpuData} options={chartOptions} />
          </div>
        </div>

        {/* Memory & Disk Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(450px, 1fr))", gap: "20px" }}>
          <div
            style={{
              backgroundColor: cardBg,
              border: `1px solid ${border}`,
              borderRadius: "8px",
              padding: "20px",
              boxShadow: darkMode ? "0 4px 12px rgba(0,0,0,0.2)" : "0 2px 8px rgba(0,0,0,0.06)",
            }}
          >
            <h3 style={{ margin: "0 0 14px 0", fontSize: "15px", fontWeight: "700", color: textTitle }}>
              🧠 Memory Usage Charts (RAM GB)
            </h3>
            <div style={{ height: "220px" }}>
              <Line data={memoryData} options={chartOptions} />
            </div>
          </div>

          <div
            style={{
              backgroundColor: cardBg,
              border: `1px solid ${border}`,
              borderRadius: "8px",
              padding: "20px",
              boxShadow: darkMode ? "0 4px 12px rgba(0,0,0,0.2)" : "0 2px 8px rgba(0,0,0,0.06)",
            }}
          >
            <h3 style={{ margin: "0 0 14px 0", fontSize: "15px", fontWeight: "700", color: textTitle }}>
              💾 Disk Usage & Storage I/O Charts
            </h3>
            <div style={{ height: "220px" }}>
              <Line data={diskData} options={chartOptions} />
            </div>
          </div>
        </div>

        {/* Network Metrics Chart */}
        <div
          style={{
            backgroundColor: cardBg,
            border: `1px solid ${border}`,
            borderRadius: "8px",
            padding: "20px",
            boxShadow: darkMode ? "0 4px 12px rgba(0,0,0,0.2)" : "0 2px 8px rgba(0,0,0,0.06)",
          }}
        >
          <h3 style={{ margin: "0 0 14px 0", fontSize: "15px", fontWeight: "700", color: textTitle }}>
            🌐 Network Metrics & Throughput (MB/s)
          </h3>
          <div style={{ height: "220px" }}>
            <Line data={networkData} options={chartOptions} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Monitoring;
