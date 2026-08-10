import { useState, useEffect, useCallback } from "react";
import { getUsers, createUser, updateUser, deleteUser } from "../api/api";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

function UserManagement() {
  const { darkMode } = useTheme();
  const { user: currentUser, isAdmin } = useAuth();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  // New user form state
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    role: "READ_ONLY",
  });

  const cardBg = darkMode ? "#161B22" : "#FFFFFF";
  const headerBg = darkMode ? "#0D1117" : "#F6F8FA";
  const border = darkMode ? "#30363D" : "#D0D7DE";
  const rowBorder = darkMode ? "#21262D" : "#EAEEF2";
  const textTitle = darkMode ? "#F0F6FC" : "#1F2328";
  const textSub = darkMode ? "#8B949E" : "#6E7781";
  const text = darkMode ? "#C9D1D9" : "#1F2328";

  const fetchUsersList = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const list = await getUsers();
      if (Array.isArray(list)) {
        setUsers(list);
      }
    } catch (err) {
      console.error("Failed to load users", err);
      setError(err.response?.data?.detail || "Failed to load user records from PostgreSQL");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsersList();
  }, [fetchUsersList]);

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    try {
      await createUser(formData);
      setShowCreateModal(false);
      setFormData({ username: "", email: "", password: "", role: "READ_ONLY" });
      fetchUsersList();
    } catch (err) {
      alert("Failed to create user: " + (err.response?.data?.detail || err.message));
    }
  };

  const handleUpdateRole = async (userId, newRole, activeStatus) => {
    try {
      await updateUser(userId, { role: newRole, is_active: activeStatus });
      setEditingUser(null);
      fetchUsersList();
    } catch (err) {
      alert("Failed to update user: " + (err.response?.data?.detail || err.message));
    }
  };

  const handleDeleteUser = async (userId, targetUsername) => {
    if (targetUsername === currentUser?.username) {
      alert("You cannot delete your own active administrator account.");
      return;
    }
    if (!window.confirm(`Are you sure you want to delete user '${targetUsername}'?`)) return;

    try {
      await deleteUser(userId);
      fetchUsersList();
    } catch (err) {
      alert("Failed to delete user: " + (err.response?.data?.detail || err.message));
    }
  };

  const getRoleBadge = (roleStr = "READ_ONLY") => {
    const r = roleStr.toUpperCase();
    if (r === "ADMIN") return { bg: "rgba(239, 68, 68, 0.15)", color: "#EF4444", border: "rgba(239, 68, 68, 0.4)", label: "👑 ADMIN" };
    if (r === "INFRASTRUCTURE_MANAGER") return { bg: "rgba(245, 158, 11, 0.15)", color: "#F59E0B", border: "rgba(245, 158, 11, 0.4)", label: "🛠️ INFRA MANAGER" };
    if (r === "MONITORING_OPERATOR") return { bg: "rgba(59, 130, 246, 0.15)", color: "#3B82F6", border: "rgba(59, 130, 246, 0.4)", label: "👁️ OPERATOR" };
    return { bg: "rgba(107, 114, 128, 0.15)", color: "#9CA3AF", border: "rgba(107, 114, 128, 0.4)", label: "📖 READ ONLY" };
  };

  if (!isAdmin()) {
    return (
      <div style={{ padding: "40px", textAlign: "center", color: "#EF4444" }}>
        ⛔ <h2>Access Denied</h2>
        <p style={{ color: textSub }}>You do not have Administrator permissions to manage user accounts.</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
      <header style={{ marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h1 style={{ margin: "0 0 6px 0", fontSize: "22px", fontWeight: "700", color: textTitle }}>
            👥 User Management & Role Authorization
          </h1>
          <p style={{ margin: 0, color: textSub, fontSize: "13px" }}>
            Create system users, assign RBAC access roles, and manage access permissions
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          style={{
            padding: "8px 16px",
            borderRadius: "6px",
            border: "none",
            backgroundColor: "#2563EB",
            color: "#FFFFFF",
            fontSize: "12px",
            fontWeight: "600",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          ➕ Provision New User
        </button>
      </header>

      {error && (
        <div style={{ backgroundColor: "rgba(239,68,68,0.15)", color: "#EF4444", padding: "12px", borderRadius: "6px", marginBottom: "16px", fontSize: "13px" }}>
          ⚠️ {error}
        </div>
      )}

      {/* Users Table */}
      <div
        style={{
          backgroundColor: cardBg,
          borderRadius: "8px",
          border: `1px solid ${border}`,
          boxShadow: darkMode ? "0 4px 12px rgba(0,0,0,0.2)" : "0 2px 8px rgba(0,0,0,0.06)",
          overflow: "hidden",
        }}
      >
        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${border}` }}>
          <h2 style={{ fontSize: "15px", margin: 0, color: textTitle }}>
            Registered Users ({users.length})
          </h2>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", color: text, fontSize: "13px" }}>
            <thead>
              <tr style={{ backgroundColor: headerBg, borderBottom: `1px solid ${border}` }}>
                <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "11px", fontWeight: "700", color: textSub }}>ID</th>
                <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "11px", fontWeight: "700", color: textSub }}>USERNAME</th>
                <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "11px", fontWeight: "700", color: textSub }}>EMAIL</th>
                <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "11px", fontWeight: "700", color: textSub }}>RBAC ROLE</th>
                <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "11px", fontWeight: "700", color: textSub }}>STATUS</th>
                <th style={{ padding: "12px 16px", textAlign: "right", fontSize: "11px", fontWeight: "700", color: textSub }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" style={{ padding: "30px", textAlign: "center", color: textSub }}>Loading user records...</td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ padding: "30px", textAlign: "center", color: textSub }}>No users found.</td>
                </tr>
              ) : (
                users.map((u) => {
                  const badge = getRoleBadge(u.role);
                  return (
                    <tr key={u.id} style={{ borderBottom: `1px solid ${rowBorder}` }}>
                      <td style={{ padding: "12px 16px", color: textSub, fontWeight: "600" }}>#{u.id}</td>
                      <td style={{ padding: "12px 16px", fontWeight: "600", color: textTitle }}>
                        {u.username}
                        {u.username === currentUser?.username && (
                          <span style={{ fontSize: "10px", marginLeft: "6px", backgroundColor: "rgba(59,130,246,0.2)", color: "#3B82F6", padding: "1px 5px", borderRadius: "3px" }}>YOU</span>
                        )}
                      </td>
                      <td style={{ padding: "12px 16px", color: textSub }}>{u.email}</td>
                      <td style={{ padding: "12px 16px" }}>
                        <span
                          style={{
                            fontSize: "11px",
                            fontWeight: "700",
                            padding: "3px 8px",
                            borderRadius: "12px",
                            backgroundColor: badge.bg,
                            color: badge.color,
                            border: `1px solid ${badge.border}`,
                          }}
                        >
                          {badge.label}
                        </span>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <span style={{ fontSize: "11px", fontWeight: "700", color: u.is_active ? "#10B981" : "#EF4444" }}>
                          ● {u.is_active ? "ACTIVE" : "INACTIVE"}
                        </span>
                      </td>
                      <td style={{ padding: "12px 16px", textAlign: "right" }}>
                        <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
                          <button
                            onClick={() => setEditingUser(u)}
                            style={{
                              padding: "4px 10px",
                              backgroundColor: darkMode ? "#21262D" : "#F6F8FA",
                              border: `1px solid ${border}`,
                              color: textTitle,
                              borderRadius: "4px",
                              fontSize: "11px",
                              cursor: "pointer",
                            }}
                          >
                            Edit Role
                          </button>
                          <button
                            onClick={() => handleDeleteUser(u.id, u.username)}
                            disabled={u.username === currentUser?.username}
                            style={{
                              padding: "4px 10px",
                              backgroundColor: "rgba(239, 68, 68, 0.15)",
                              border: "1px solid rgba(239, 68, 68, 0.4)",
                              color: "#EF4444",
                              borderRadius: "4px",
                              fontSize: "11px",
                              cursor: u.username === currentUser?.username ? "not-allowed" : "pointer",
                              opacity: u.username === currentUser?.username ? 0.5 : 1,
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Provision User Modal */}
      {showCreateModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" }}>
          <div style={{ backgroundColor: cardBg, border: `1px solid ${border}`, borderRadius: "8px", padding: "24px", maxWidth: "450px", width: "100%" }}>
            <h3 style={{ margin: "0 0 16px 0", color: textTitle }}>➕ Provision New User Account</h3>
            <form onSubmit={handleCreateSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <label style={{ display: "block", fontSize: "11px", fontWeight: "600", color: textTitle, marginBottom: "4px" }}>Username</label>
                <input
                  type="text"
                  required
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  style={{ width: "100%", boxSizing: "border-box", padding: "8px", borderRadius: "6px", border: `1px solid ${border}`, backgroundColor: darkMode ? "#0D1117" : "#F6F8FA", color: textTitle, fontSize: "12px" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "11px", fontWeight: "600", color: textTitle, marginBottom: "4px" }}>Email</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  style={{ width: "100%", boxSizing: "border-box", padding: "8px", borderRadius: "6px", border: `1px solid ${border}`, backgroundColor: darkMode ? "#0D1117" : "#F6F8FA", color: textTitle, fontSize: "12px" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "11px", fontWeight: "600", color: textTitle, marginBottom: "4px" }}>Password</label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  style={{ width: "100%", boxSizing: "border-box", padding: "8px", borderRadius: "6px", border: `1px solid ${border}`, backgroundColor: darkMode ? "#0D1117" : "#F6F8FA", color: textTitle, fontSize: "12px" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "11px", fontWeight: "600", color: textTitle, marginBottom: "4px" }}>Assign RBAC Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  style={{ width: "100%", boxSizing: "border-box", padding: "8px", borderRadius: "6px", border: `1px solid ${border}`, backgroundColor: darkMode ? "#0D1117" : "#F6F8FA", color: textTitle, fontSize: "12px" }}
                >
                  <option value="READ_ONLY">READ_ONLY (View Only Access)</option>
                  <option value="MONITORING_OPERATOR">MONITORING_OPERATOR (Ack Alerts + View)</option>
                  <option value="INFRASTRUCTURE_MANAGER">INFRASTRUCTURE_MANAGER (Servers + Backups)</option>
                  <option value="ADMIN">ADMIN (Full Superuser Control)</option>
                </select>
              </div>

              <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", marginTop: "12px" }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  style={{ padding: "8px 14px", borderRadius: "6px", border: `1px solid ${border}`, backgroundColor: "transparent", color: textSub, fontSize: "12px", cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: "8px 16px", borderRadius: "6px", border: "none", backgroundColor: "#2563EB", color: "#FFFFFF", fontSize: "12px", fontWeight: "600", cursor: "pointer" }}
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Role Modal */}
      {editingUser && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" }}>
          <div style={{ backgroundColor: cardBg, border: `1px solid ${border}`, borderRadius: "8px", padding: "24px", maxWidth: "400px", width: "100%" }}>
            <h3 style={{ margin: "0 0 16px 0", color: textTitle }}>✏️ Update User Role: {editingUser.username}</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <label style={{ display: "block", fontSize: "11px", fontWeight: "600", color: textTitle, marginBottom: "4px" }}>RBAC Role</label>
                <select
                  value={editingUser.role}
                  onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                  style={{ width: "100%", padding: "8px", borderRadius: "6px", border: `1px solid ${border}`, backgroundColor: darkMode ? "#0D1117" : "#F6F8FA", color: textTitle, fontSize: "12px" }}
                >
                  <option value="READ_ONLY">READ_ONLY</option>
                  <option value="MONITORING_OPERATOR">MONITORING_OPERATOR</option>
                  <option value="INFRASTRUCTURE_MANAGER">INFRASTRUCTURE_MANAGER</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "11px", fontWeight: "600", color: textTitle, marginBottom: "4px" }}>Account Status</label>
                <select
                  value={editingUser.is_active ? "true" : "false"}
                  onChange={(e) => setEditingUser({ ...editingUser, is_active: e.target.value === "true" })}
                  style={{ width: "100%", padding: "8px", borderRadius: "6px", border: `1px solid ${border}`, backgroundColor: darkMode ? "#0D1117" : "#F6F8FA", color: textTitle, fontSize: "12px" }}
                >
                  <option value="true">ACTIVE</option>
                  <option value="false">INACTIVE (Blocked)</option>
                </select>
              </div>

              <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", marginTop: "12px" }}>
                <button
                  onClick={() => setEditingUser(null)}
                  style={{ padding: "8px 14px", borderRadius: "6px", border: `1px solid ${border}`, backgroundColor: "transparent", color: textSub, fontSize: "12px", cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleUpdateRole(editingUser.id, editingUser.role, editingUser.is_active)}
                  style={{ padding: "8px 16px", borderRadius: "6px", border: "none", backgroundColor: "#2563EB", color: "#FFFFFF", fontSize: "12px", fontWeight: "600", cursor: "pointer" }}
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserManagement;
