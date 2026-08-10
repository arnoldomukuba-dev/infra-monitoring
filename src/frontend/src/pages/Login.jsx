import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

function Login() {
  const { login } = useAuth();
  const { darkMode } = useTheme();
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const cardBg = darkMode ? "#161B22" : "#FFFFFF";
  const border = darkMode ? "#30363D" : "#D0D7DE";
  const textTitle = darkMode ? "#F0F6FC" : "#1F2328";
  const textSub = darkMode ? "#8B949E" : "#6E7781";

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      setError("Please fill in both username and password fields.");
      return;
    }
    setError("");
    setIsSubmitting(true);
    try {
      await login(username, password);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.detail || err.message || "Invalid username or password");
    } finally {
      setIsSubmitting(false);
    }
  };

  const fillQuickCredentials = (userVal, passVal) => {
    setUsername(userVal);
    setPassword(passVal);
    setError("");
  };

  return (
    <div
      style={{
        minHeight: "80vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
    >
      <div
        style={{
          backgroundColor: cardBg,
          borderRadius: "12px",
          border: `1px solid ${border}`,
          padding: "32px",
          maxWidth: "440px",
          width: "100%",
          boxShadow: darkMode ? "0 12px 32px rgba(0,0,0,0.5)" : "0 6px 24px rgba(0,0,0,0.08)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <div style={{ fontSize: "36px", marginBottom: "8px" }}>🛡️</div>
          <h1 style={{ margin: "0 0 6px 0", fontSize: "22px", fontWeight: "700", color: textTitle }}>
            ODRISYSTEMS Auth Guard
          </h1>
          <p style={{ margin: 0, fontSize: "13px", color: textSub }}>
            Infrastructure Monitoring Platform RBAC Login
          </p>
        </div>

        {error && (
          <div
            style={{
              backgroundColor: "rgba(239, 68, 68, 0.15)",
              border: "1px solid rgba(239, 68, 68, 0.4)",
              color: "#EF4444",
              borderRadius: "6px",
              padding: "10px 14px",
              fontSize: "12px",
              marginBottom: "20px",
              fontWeight: "500",
            }}
          >
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: textTitle, marginBottom: "6px" }}>
              Username
            </label>
            <input
              type="text"
              required
              placeholder="e.g. admin"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "10px 14px",
                borderRadius: "6px",
                border: `1px solid ${border}`,
                backgroundColor: darkMode ? "#0D1117" : "#F6F8FA",
                color: textTitle,
                fontSize: "13px",
                outline: "none",
              }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: textTitle, marginBottom: "6px" }}>
              Password
            </label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "10px 14px",
                borderRadius: "6px",
                border: `1px solid ${border}`,
                backgroundColor: darkMode ? "#0D1117" : "#F6F8FA",
                color: textTitle,
                fontSize: "13px",
                outline: "none",
              }}
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              width: "100%",
              padding: "12px",
              marginTop: "8px",
              borderRadius: "6px",
              border: "none",
              backgroundColor: "#2563EB",
              color: "#FFFFFF",
              fontSize: "13px",
              fontWeight: "600",
              cursor: isSubmitting ? "not-allowed" : "pointer",
              opacity: isSubmitting ? 0.7 : 1,
            }}
          >
            {isSubmitting ? "Authenticating..." : "🔑 Sign In to Platform"}
          </button>
        </form>

        {/* Quick RBAC Role Testing Demo Bar */}
        <div style={{ marginTop: "24px", paddingTop: "20px", borderTop: `1px solid ${border}` }}>
          <div style={{ fontSize: "11px", fontWeight: "700", color: textSub, marginBottom: "10px", textAlign: "center" }}>
            ⚡ QUICK DEMO LOGIN ACCOUNTS
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
            <button
              onClick={() => fillQuickCredentials("admin", "admin123")}
              style={{
                padding: "6px 10px",
                borderRadius: "6px",
                border: `1px solid ${border}`,
                backgroundColor: darkMode ? "#21262D" : "#F6F8FA",
                color: textTitle,
                fontSize: "11px",
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              👑 <strong>Admin</strong> (admin)
            </button>

            <button
              onClick={() => fillQuickCredentials("manager", "manager123")}
              style={{
                padding: "6px 10px",
                borderRadius: "6px",
                border: `1px solid ${border}`,
                backgroundColor: darkMode ? "#21262D" : "#F6F8FA",
                color: textTitle,
                fontSize: "11px",
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              🛠️ <strong>Manager</strong> (manager)
            </button>

            <button
              onClick={() => fillQuickCredentials("operator", "operator123")}
              style={{
                padding: "6px 10px",
                borderRadius: "6px",
                border: `1px solid ${border}`,
                backgroundColor: darkMode ? "#21262D" : "#F6F8FA",
                color: textTitle,
                fontSize: "11px",
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              👁️ <strong>Operator</strong> (operator)
            </button>

            <button
              onClick={() => fillQuickCredentials("readonly", "readonly123")}
              style={{
                padding: "6px 10px",
                borderRadius: "6px",
                border: `1px solid ${border}`,
                backgroundColor: darkMode ? "#21262D" : "#F6F8FA",
                color: textTitle,
                fontSize: "11px",
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              📖 <strong>Read Only</strong> (readonly)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;