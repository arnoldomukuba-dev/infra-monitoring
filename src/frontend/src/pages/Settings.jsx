import { useState, useEffect } from "react";
import { useTheme } from "../context/ThemeContext";
import { getNotificationSettings, updateNotificationSettings, getEmailStatus } from "../api/api";

function Settings() {
  const { darkMode, toggleTheme } = useTheme();

  const [thresholds, setThresholds] = useState({
    cpuThreshold: 80,
    ramThreshold: 85,
    diskThreshold: 90,
  });

  const [notifSettings, setNotifSettings] = useState([
    { key: "email_notifications_enabled", value: "true", description: "Global SMTP email notifications toggle" },
    { key: "notify_on_critical_alerts", value: "true", description: "Trigger notifications when CRITICAL alerts occur" },
    { key: "notify_on_warning_alerts", value: "true", description: "Trigger notifications when WARNING alerts occur" },
    { key: "notify_on_backup_failed", value: "true", description: "Trigger notifications when backup jobs fail" },
    { key: "notify_on_server_offline", value: "true", description: "Trigger notifications when monitored servers go OFFLINE" },
  ]);

  const [emailStatus, setEmailStatus] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await getNotificationSettings();
        if (settings && settings.length > 0) {
          setNotifSettings(settings);
        }
      } catch (err) {
        console.error("Failed to fetch notification settings", err);
      }

      try {
        const status = await getEmailStatus();
        setEmailStatus(status);
      } catch (err) {
        console.log("Email status restricted or unavailable", err);
      }
    };
    loadSettings();
  }, []);

  const cardBg = darkMode ? "#161B22" : "#FFFFFF";
  const border = darkMode ? "#30363D" : "#D0D7DE";
  const textTitle = darkMode ? "#F0F6FC" : "#1F2328";
  const textSub = darkMode ? "#8B949E" : "#6E7781";
  const inputBg = darkMode ? "#0D1117" : "#F6F8FA";

  const handleToggleSetting = (key) => {
    setNotifSettings((prev) =>
      prev.map((item) => {
        if (item.key === key) {
          const currentVal = item.value.toLowerCase() === "true";
          return { ...item, value: currentVal ? "false" : "true" };
        }
        return item;
      })
    );
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setSaveMessage("");
      const payload = notifSettings.map((s) => ({ key: s.key, value: s.value }));
      await updateNotificationSettings(payload);
      setSaveMessage("Settings saved successfully!");
      setTimeout(() => setSaveMessage(""), 4000);
    } catch (err) {
      console.error("Failed to save settings", err);
      setSaveMessage("Failed to save settings (Requires ADMIN role).");
    } fontFinally: {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
      <header style={{ marginBottom: "20px" }}>
        <h1 style={{ margin: "0 0 6px 0", fontSize: "22px", fontWeight: "700", color: textTitle }}>
          ⚙️ Infrastructure & Notification Configuration
        </h1>
        <p style={{ margin: 0, color: textSub, fontSize: "13px" }}>
          Configure monitoring thresholds, real-time alert notifications, and SMTP email settings
        </p>
      </header>

      {saveMessage && (
        <div style={{
          padding: "10px 16px",
          borderRadius: "6px",
          backgroundColor: saveMessage.includes("Failed") ? "rgba(239,68,68,0.15)" : "rgba(34,197,94,0.15)",
          border: `1px solid ${saveMessage.includes("Failed") ? "rgba(239,68,68,0.4)" : "rgba(34,197,94,0.4)"}`,
          color: saveMessage.includes("Failed") ? "#EF4444" : "#22C55E",
          fontSize: "13px",
          marginBottom: "16px",
          fontWeight: "600",
        }}>
          {saveMessage}
        </div>
      )}

      <form onSubmit={handleSaveSettings} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        {/* 1. Monitoring Thresholds */}
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
            ⚡ Monitoring Thresholds
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: textTitle, marginBottom: "6px" }}>
                CPU Warning Threshold (%): {thresholds.cpuThreshold}%
              </label>
              <input
                type="range"
                min="50"
                max="95"
                value={thresholds.cpuThreshold}
                onChange={(e) => setThresholds({ ...thresholds, cpuThreshold: Number(e.target.value) })}
                style={{ width: "100%", cursor: "pointer" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: textTitle, marginBottom: "6px" }}>
                RAM Warning Threshold (%): {thresholds.ramThreshold}%
              </label>
              <input
                type="range"
                min="50"
                max="95"
                value={thresholds.ramThreshold}
                onChange={(e) => setThresholds({ ...thresholds, ramThreshold: Number(e.target.value) })}
                style={{ width: "100%", cursor: "pointer" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: textTitle, marginBottom: "6px" }}>
                Disk Warning Threshold (%): {thresholds.diskThreshold}%
              </label>
              <input
                type="range"
                min="50"
                max="95"
                value={thresholds.diskThreshold}
                onChange={(e) => setThresholds({ ...thresholds, diskThreshold: Number(e.target.value) })}
                style={{ width: "100%", cursor: "pointer" }}
              />
            </div>
          </div>
        </div>

        {/* 2. Notification Rules & SMTP Email */}
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
            🔔 Notification Rules & Email Alert Settings
          </h2>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "20px" }}>
            {notifSettings.map((item) => {
              const isChecked = item.value.toLowerCase() === "true";
              return (
                <div key={item.key} style={{ display: "flex", alignItems: "center", justifyBetween: "space-between", gap: "10px" }}>
                  <input
                    type="checkbox"
                    id={item.key}
                    checked={isChecked}
                    onChange={() => handleToggleSetting(item.key)}
                    style={{ width: "16px", height: "16px", cursor: "pointer" }}
                  />
                  <label htmlFor={item.key} style={{ fontSize: "13px", fontWeight: "500", color: textTitle, cursor: "pointer" }}>
                    {item.description || item.key}
                  </label>
                </div>
              );
            })}
          </div>

          {emailStatus && (
            <div style={{
              padding: "12px 16px",
              backgroundColor: inputBg,
              border: `1px solid ${border}`,
              borderRadius: "6px",
              fontSize: "12px",
            }}>
              <div style={{ fontWeight: "700", color: textTitle, marginBottom: "6px" }}>
                📧 Active SMTP Dispatcher Status
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "8px", color: textSub }}>
                <div>Host: <span style={{ color: textTitle, fontFamily: "monospace" }}>{emailStatus.smtp_host}:{emailStatus.smtp_port}</span></div>
                <div>Sender: <span style={{ color: textTitle, fontFamily: "monospace" }}>{emailStatus.smtp_from}</span></div>
                <div>Status: <span style={{ color: emailStatus.enabled ? "#22C55E" : "#F59E0B" }}>{emailStatus.enabled ? "Active / Ready" : "Disabled"}</span></div>
              </div>
            </div>
          )}
        </div>

        {/* 3. System Configuration */}
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
            🔧 System Configuration
          </h2>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: `1px solid ${border}` }}>
            <div>
              <div style={{ fontWeight: "600", color: textTitle, fontSize: "13px" }}>Theme Mode</div>
              <div style={{ fontSize: "12px", color: textSub }}>Prometheus Dark Mode / Light Mode toggle</div>
            </div>
            <button
              type="button"
              onClick={toggleTheme}
              style={{
                padding: "6px 12px",
                borderRadius: "6px",
                border: `1px solid ${border}`,
                backgroundColor: inputBg,
                color: textTitle,
                cursor: "pointer",
                fontWeight: "600",
                fontSize: "12px",
              }}
            >
              {darkMode ? "☀️ Light Mode" : "🌙 Dark Mode"}
            </button>
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: `1px solid ${border}` }}>
            <div>
              <div style={{ fontWeight: "600", color: textTitle, fontSize: "13px" }}>FastAPI Backend Base URL</div>
              <div style={{ fontSize: "12px", color: textSub }}>Active API connection target</div>
            </div>
            <span style={{ fontFamily: "monospace", color: "#38BDF8", fontSize: "12px" }}>
              {import.meta.env.VITE_API_URL || "Same Origin (Proxied /)"}
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0" }}>
            <div>
              <div style={{ fontWeight: "600", color: textTitle, fontSize: "13px" }}>PostgreSQL Database Target</div>
              <div style={{ fontSize: "12px", color: textSub }}>Database container & port mapping</div>
            </div>
            <span style={{ fontFamily: "monospace", color: "#22C55E", fontSize: "12px" }}>
              backup_monitor_db (127.0.0.1:5433)
            </span>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button
            type="submit"
            disabled={saving}
            style={{
              backgroundColor: "#2563EB",
              color: "#FFFFFF",
              border: "none",
              padding: "10px 24px",
              borderRadius: "6px",
              fontSize: "13px",
              fontWeight: "600",
              cursor: saving ? "not-allowed" : "pointer",
              opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? "Saving..." : "💾 Save Settings"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default Settings;