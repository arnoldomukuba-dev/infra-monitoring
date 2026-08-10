import { Link, useLocation } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";

function Sidebar() {
  const location = useLocation();
  const { darkMode } = useTheme();
  const { user, logout, isAdmin } = useAuth();

  const menuItems = [
    { label: "Dashboard", path: "/", icon: "📊" },
    { label: "Servers", path: "/servers", icon: "🖥️" },
    { label: "Backup Monitoring", path: "/backups", icon: "💾" },
    { label: "Alerts", path: "/alerts", icon: "🔔" },
    { label: "Notifications", path: "/notifications", icon: "📨" },
    { label: "Metrics", path: "/metrics", icon: "📈" },
    { label: "Logs", path: "/logs", icon: "📜" },
  ];

  if (isAdmin()) {
    menuItems.push({ label: "User Management", path: "/users", icon: "👥" });
  }

  menuItems.push({ label: "Settings", path: "/settings", icon: "⚙️" });

  const bg = darkMode ? "#0D1117" : "#FFFFFF";
  const border = darkMode ? "#30363D" : "#D0D7DE";
  const text = darkMode ? "#F0F6FC" : "#1F2328";
  const subText = darkMode ? "#8B949E" : "#6E7781";
  const borderInner = darkMode ? "#21262D" : "#EAEEF2";

  const getRoleLabel = (r = "READ_ONLY") => {
    const role = r.toUpperCase();
    if (role === "ADMIN") return { label: "ADMIN", color: "#EF4444" };
    if (role === "INFRASTRUCTURE_MANAGER") return { label: "INFRA MGR", color: "#F59E0B" };
    if (role === "MONITORING_OPERATOR") return { label: "OPERATOR", color: "#3B82F6" };
    return { label: "READ ONLY", color: "#9CA3AF" };
  };

  const roleInfo = getRoleLabel(user?.role);

  return (
    <aside
      style={{
        width: "240px",
        backgroundColor: bg,
        borderRight: `1px solid ${border}`,
        minHeight: "100vh",
        padding: "20px 14px",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        color: text,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        transition: "background-color 0.2s, border-color 0.2s",
      }}
    >
      {/* Brand Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          paddingBottom: "20px",
          marginBottom: "20px",
          borderBottom: `1px solid ${borderInner}`,
        }}
      >
        <div
          style={{
            width: "36px",
            height: "36px",
            borderRadius: "8px",
            background: "linear-gradient(135deg, #6366F1 0%, #3B82F6 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "18px",
            boxShadow: "0 2px 8px rgba(99, 102, 241, 0.3)",
          }}
        >
          🛡️
        </div>
        <div>
          <h2 style={{ margin: 0, fontSize: "14px", fontWeight: "700", color: text, letterSpacing: "0.2px" }}>
            ODRISYSTEMS
          </h2>
          <span style={{ fontSize: "10px", color: "#38BDF8", fontWeight: "600", letterSpacing: "0.8px" }}>
            INFRA MONITORING
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav style={{ display: "flex", flexDirection: "column", gap: "4px", flex: 1 }}>
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "10px 12px",
                borderRadius: "6px",
                textDecoration: "none",
                fontSize: "13px",
                fontWeight: isActive ? "600" : "500",
                backgroundColor: isActive
                  ? darkMode
                    ? "rgba(56, 139, 253, 0.15)"
                    : "#EBF5FF"
                  : "transparent",
                color: isActive
                  ? darkMode
                    ? "#58A6FF"
                    : "#0969DA"
                  : subText,
                borderLeft: isActive
                  ? `3px solid ${darkMode ? "#58A6FF" : "#0969DA"}`
                  : "3px solid transparent",
                transition: "all 0.15s ease",
              }}
            >
              <span style={{ fontSize: "16px" }}>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Session Footer */}
      {user ? (
        <div
          style={{
            paddingTop: "14px",
            borderTop: `1px solid ${borderInner}`,
            display: "flex",
            flexDirection: "column",
            gap: "8px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: "12px", fontWeight: "700", color: text, overflow: "hidden", textOverflow: "ellipsis", maxWidth: "120px" }}>
                👤 {user.username}
              </span>
              <span style={{ fontSize: "9px", fontWeight: "800", color: roleInfo.color, letterSpacing: "0.5px" }}>
                {roleInfo.label}
              </span>
            </div>
            <button
              onClick={logout}
              title="Sign Out"
              style={{
                padding: "4px 8px",
                borderRadius: "4px",
                border: `1px solid ${border}`,
                backgroundColor: darkMode ? "#21262D" : "#F6F8FA",
                color: subText,
                fontSize: "11px",
                cursor: "pointer",
              }}
            >
              🚪 Exit
            </button>
          </div>
        </div>
      ) : (
        <div
          style={{
            paddingTop: "14px",
            borderTop: `1px solid ${borderInner}`,
          }}
        >
          <Link
            to="/login"
            style={{
              display: "block",
              textAlign: "center",
              padding: "6px 12px",
              borderRadius: "6px",
              backgroundColor: "#2563EB",
              color: "#FFFFFF",
              fontSize: "12px",
              fontWeight: "600",
              textDecoration: "none",
            }}
          >
            🔑 Sign In
          </Link>
        </div>
      )}
    </aside>
  );
}

export default Sidebar;