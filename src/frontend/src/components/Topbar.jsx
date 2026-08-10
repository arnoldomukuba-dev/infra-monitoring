import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import NotificationBell from "./NotificationBell";

function Topbar() {
  const { darkMode, toggleTheme } = useTheme();
  const { user, logout } = useAuth();

  const today = new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const username = user?.username || "Guest";

  const getRoleBadgeStyle = (r = "") => {
    const role = r.toUpperCase();
    if (role === "ADMIN") return { bg: "rgba(239, 68, 68, 0.15)", color: "#EF4444", border: "rgba(239, 68, 68, 0.4)", label: "ADMIN" };
    if (role === "INFRASTRUCTURE_MANAGER") return { bg: "rgba(245, 158, 11, 0.15)", color: "#F59E0B", border: "rgba(245, 158, 11, 0.4)", label: "INFRA MGR" };
    if (role === "MONITORING_OPERATOR") return { bg: "rgba(59, 130, 246, 0.15)", color: "#3B82F6", border: "rgba(59, 130, 246, 0.4)", label: "OPERATOR" };
    return { bg: "rgba(107, 114, 128, 0.15)", color: "#9CA3AF", border: "rgba(107, 114, 128, 0.4)", label: "READ ONLY" };
  };

  const roleStyle = getRoleBadgeStyle(user?.role);

  const bg = darkMode ? "#161B22" : "#FFFFFF";
  const border = darkMode ? "#30363D" : "#D0D7DE";
  const text = darkMode ? "#C9D1D9" : "#1F2328";
  const dateColor = darkMode ? "#8B949E" : "#6E7781";
  const userBg = darkMode ? "#0D1117" : "#F6F8FA";

  return (
    <header
      style={{
        backgroundColor: bg,
        borderBottom: `1px solid ${border}`,
        padding: "12px 24px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        color: text,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace',
        transition: "background-color 0.2s, border-color 0.2s",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            fontSize: "11px",
            fontWeight: "700",
            color: "#3FB950",
            backgroundColor: "rgba(46, 160, 67, 0.15)",
            border: "1px solid rgba(46, 160, 67, 0.4)",
            padding: "4px 10px",
            borderRadius: "20px",
            letterSpacing: "0.5px",
          }}
        >
          <span style={{ fontSize: "10px", color: "#3FB950" }}>●</span> SYSTEM OPERATIONAL
        </div>
        <span style={{ fontSize: "12px", color: dateColor }}>{today}</span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        {/* Notification Bell */}
        <NotificationBell />

        {/* Theme Switcher Button */}
        <button
          onClick={toggleTheme}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            padding: "6px 12px",
            borderRadius: "6px",
            border: `1px solid ${border}`,
            backgroundColor: userBg,
            color: text,
            fontSize: "12px",
            fontWeight: "600",
            cursor: "pointer",
            transition: "all 0.2s",
          }}
          title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          <span>{darkMode ? "☀️" : "🌙"}</span>
          <span>{darkMode ? "Light Mode" : "Dark Mode"}</span>
        </button>

        {/* User & Role Badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            backgroundColor: userBg,
            padding: "4px 10px 4px 6px",
            borderRadius: "20px",
            border: `1px solid ${border}`,
          }}
        >
          <div
            style={{
              width: "24px",
              height: "24px",
              borderRadius: "50%",
              backgroundColor: "#2563EB",
              color: "#FFFFFF",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "11px",
              fontWeight: "700",
            }}
          >
            {username.charAt(0).toUpperCase()}
          </div>
          <span style={{ fontSize: "12px", fontWeight: "600" }}>{username}</span>
          <span
            style={{
              fontSize: "9px",
              fontWeight: "800",
              padding: "2px 6px",
              borderRadius: "10px",
              backgroundColor: roleStyle.bg,
              color: roleStyle.color,
              border: `1px solid ${roleStyle.border}`,
            }}
          >
            {roleStyle.label}
          </span>
        </div>

        {/* Logout Button */}
        <button
          onClick={logout}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            backgroundColor: "rgba(248, 81, 73, 0.1)",
            border: "1px solid rgba(248, 81, 73, 0.4)",
            color: "#F85149",
            padding: "6px 12px",
            borderRadius: "6px",
            fontSize: "12px",
            fontWeight: "600",
            cursor: "pointer",
            transition: "all 0.2s",
          }}
        >
          <span>🚪</span> Logout
        </button>
      </div>
    </header>
  );
}

export default Topbar;