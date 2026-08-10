import { useTheme } from "../context/ThemeContext";

function DashboardCards({ summary = {}, serverSummary = {}, alertSummary = {} }) {
  const { darkMode } = useTheme();
  const safeSummary = summary || {};
  const safeServerSummary = serverSummary || {};
  const safeAlertSummary = alertSummary || {};

  const cardBg = darkMode ? "#161B22" : "#FFFFFF";
  const valColor = darkMode ? "#F0F6FC" : "#1F2328";
  const subText = darkMode ? "#8B949E" : "#6E7781";

  const cards = [
    {
      title: "Total Monitored Servers",
      value: `${safeServerSummary.total_servers || 0} Nodes`,
      sub: `${safeServerSummary.online_servers || 0} Online • ${safeServerSummary.warning_servers || 0} Warning • ${safeServerSummary.critical_servers || 0} Critical`,
      color: "#3B82F6",
      bgColor: "rgba(59, 130, 246, 0.1)",
      borderColor: "rgba(59, 130, 246, 0.3)",
      icon: "🖥️",
    },
    {
      title: "Active System Alerts",
      value: safeAlertSummary.total_active || 0,
      sub: `${safeAlertSummary.critical_active || 0} Critical • ${safeAlertSummary.warning_active || 0} Warning`,
      color: safeAlertSummary.critical_active > 0 ? "#EF4444" : "#F59E0B",
      bgColor: safeAlertSummary.critical_active > 0 ? "rgba(239, 68, 68, 0.1)" : "rgba(245, 158, 11, 0.1)",
      borderColor: safeAlertSummary.critical_active > 0 ? "rgba(239, 68, 68, 0.3)" : "rgba(245, 158, 11, 0.3)",
      icon: "🚨",
    },
    {
      title: "Backup Success Rate",
      value: safeSummary.success_rate || "0%",
      sub: `${safeSummary.successful_backups || 0} Succeeded • ${safeSummary.failed_backups || 0} Failed`,
      color: "#10B981",
      bgColor: "rgba(16, 185, 129, 0.1)",
      borderColor: "rgba(16, 185, 129, 0.3)",
      icon: "✅",
    },
    {
      title: "Real CPU Load",
      value: `${safeServerSummary.avg_cpu_usage || 0}%`,
      sub: "Host System Telemetry",
      color: "#F59E0B",
      bgColor: "rgba(245, 158, 11, 0.1)",
      borderColor: "rgba(245, 158, 11, 0.3)",
      icon: "⚡",
    },
    {
      title: "Real RAM Usage",
      value: `${safeServerSummary.avg_ram_usage || 0}%`,
      sub: "Active Memory Utilization",
      color: "#EC4899",
      bgColor: "rgba(236, 72, 153, 0.1)",
      borderColor: "rgba(236, 72, 153, 0.3)",
      icon: "🧠",
    },
    {
      title: "Real Disk Usage",
      value: `${safeServerSummary.avg_disk_usage || 0}%`,
      sub: "Storage Partition Capacity",
      color: "#6366F1",
      bgColor: "rgba(99, 102, 241, 0.1)",
      borderColor: "rgba(99, 102, 241, 0.3)",
      icon: "💾",
    },
  ];

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        gap: "14px",
        marginBottom: "24px",
      }}
    >
      {cards.map((card, index) => (
        <div
          key={index}
          style={{
            backgroundColor: cardBg,
            border: `1px solid ${card.borderColor}`,
            borderRadius: "8px",
            padding: "16px",
            boxShadow: darkMode ? "0 4px 12px rgba(0,0,0,0.2)" : "0 2px 8px rgba(0,0,0,0.06)",
            transition: "transform 0.15s ease",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <span
              style={{
                fontSize: "11px",
                fontWeight: "700",
                color: card.color,
                backgroundColor: card.bgColor,
                padding: "3px 8px",
                borderRadius: "4px",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              {card.title}
            </span>
            <span style={{ fontSize: "18px" }}>{card.icon}</span>
          </div>

          <div
            style={{
              fontSize: "24px",
              fontWeight: "700",
              color: valColor,
              fontFamily: "monospace",
              marginBottom: "4px",
            }}
          >
            {card.value}
          </div>

          <div style={{ fontSize: "11px", color: subText }}>{card.sub}</div>
        </div>
      ))}
    </div>
  );
}

export default DashboardCards;