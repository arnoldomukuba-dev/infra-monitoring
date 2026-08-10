import { Routes, Route, Navigate } from "react-router-dom";
import { useTheme } from "./context/ThemeContext";
import { useAuth } from "./context/AuthContext";

import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";

import Dashboard from "./pages/Dashboard";
import Servers from "./pages/Servers";
import ServerDetail from "./pages/ServerDetail";
import Backups from "./pages/Backups";
import Alerts from "./pages/Alerts";
import Monitoring from "./pages/Monitoring";
import Logs from "./pages/Logs";
import Notifications from "./pages/Notifications";
import Settings from "./pages/Settings";
import UserManagement from "./pages/UserManagement";
import Login from "./pages/Login";

function ProtectedLayout({ children }) {
  const { user, token, loading } = useAuth();
  const { darkMode } = useTheme();

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: darkMode ? "#0D1117" : "#F6F8FA", color: darkMode ? "#C9D1D9" : "#1F2328" }}>
        <div>Loading session...</div>
      </div>
    );
  }

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  const bg = darkMode ? "#0D1117" : "#F6F8FA";
  const text = darkMode ? "#C9D1D9" : "#1F2328";

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        backgroundColor: bg,
        color: text,
        transition: "background-color 0.2s, color 0.2s",
      }}
    >
      <Sidebar />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <Topbar />
        <main style={{ padding: "24px", flex: 1, overflowY: "auto" }}>
          {children}
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        path="/"
        element={
          <ProtectedLayout>
            <Dashboard />
          </ProtectedLayout>
        }
      />
      <Route
        path="/servers"
        element={
          <ProtectedLayout>
            <Servers />
          </ProtectedLayout>
        }
      />
      <Route
        path="/servers/:id"
        element={
          <ProtectedLayout>
            <ServerDetail />
          </ProtectedLayout>
        }
      />
      <Route
        path="/backups"
        element={
          <ProtectedLayout>
            <Backups />
          </ProtectedLayout>
        }
      />
      <Route
        path="/alerts"
        element={
          <ProtectedLayout>
            <Alerts />
          </ProtectedLayout>
        }
      />
      <Route
        path="/metrics"
        element={
          <ProtectedLayout>
            <Monitoring />
          </ProtectedLayout>
        }
      />
      <Route
        path="/logs"
        element={
          <ProtectedLayout>
            <Logs />
          </ProtectedLayout>
        }
      />
      <Route
        path="/users"
        element={
          <ProtectedLayout>
            <UserManagement />
          </ProtectedLayout>
        }
      />
      <Route
        path="/notifications"
        element={
          <ProtectedLayout>
            <Notifications />
          </ProtectedLayout>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedLayout>
            <Settings />
          </ProtectedLayout>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;