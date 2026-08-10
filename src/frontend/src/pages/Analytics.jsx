import { useState, useEffect } from "react";
import Charts from "../components/Charts";
import { getBackups } from "../api/api";
import { useTheme } from "../context/ThemeContext";

function Analytics() {
  const { darkMode } = useTheme();
  const [backups, setBackups] = useState([]);

  const cardBg = darkMode ? "#161B22" : "#FFFFFF";
  const border = darkMode ? "#30363D" : "#D0D7DE";
  const textTitle = darkMode ? "#F0F6FC" : "#1F2328";
  const textSub = darkMode ? "#8B949E" : "#6E7781";

  useEffect(() => {
    getBackups()
      .then((data) => Array.isArray(data) && setBackups(data))
      .catch(console.error);
  }, []);

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
      <header style={{ marginBottom: "20px" }}>
        <h1 style={{ margin: "0 0 6px 0", fontSize: "22px", fontWeight: "700", color: textTitle }}>
          📈 System Analytics & Reports
        </h1>
        <p style={{ margin: 0, color: textSub, fontSize: "13px" }}>
          Metrics trend analysis, success distribution, and system performance
        </p>
      </header>

      <div
        style={{
          backgroundColor: cardBg,
          borderRadius: "8px",
          padding: "20px",
          border: `1px solid ${border}`,
          boxShadow: darkMode ? "0 4px 12px rgba(0,0,0,0.2)" : "0 2px 8px rgba(0,0,0,0.06)",
        }}
      >
        <h2 style={{ fontSize: "15px", marginTop: 0, marginBottom: "16px", color: textTitle }}>
          Backup Performance Overview
        </h2>
        <Charts backups={backups} />
      </div>
    </div>
  );
}

export default Analytics;