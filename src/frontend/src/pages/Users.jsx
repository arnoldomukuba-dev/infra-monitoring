import { useState, useEffect } from "react";
import { getUsers, deleteUser } from "../api/api";
import { useTheme } from "../context/ThemeContext";

function Users() {
  const { darkMode } = useTheme();
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const cardBg = darkMode ? "#161B22" : "#FFFFFF";
  const border = darkMode ? "#30363D" : "#D0D7DE";
  const textTitle = darkMode ? "#F0F6FC" : "#1F2328";
  const textSub = darkMode ? "#8B949E" : "#6E7781";
  const inputBg = darkMode ? "#0D1117" : "#F6F8FA";

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await getUsers();
      if (Array.isArray(data)) setUsers(data);
    } catch (err) {
      console.error("Failed to load users", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleDelete = async (id, username) => {
    const currentUsername = localStorage.getItem("username");
    if (username === currentUsername) {
      alert("You cannot delete your own logged-in account!");
      return;
    }

    if (!window.confirm(`Are you sure you want to delete user '${username}'?`)) return;

    try {
      await deleteUser(id);
      loadUsers();
    } catch (err) {
      alert("Failed to delete user: " + (err.response?.data?.detail || err.message));
    }
  };

  const filteredUsers = users.filter((u) =>
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
      <header style={{ marginBottom: "20px" }}>
        <h1 style={{ margin: "0 0 6px 0", fontSize: "22px", fontWeight: "700", color: textTitle }}>
          👥 System User Management
        </h1>
        <p style={{ margin: 0, color: textSub, fontSize: "13px" }}>
          Live database view of registered infrastructure operators and access control
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
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "12px" }}>
          <h2 style={{ fontSize: "15px", margin: 0, color: textTitle }}>
            Registered Users ({filteredUsers.length})
          </h2>

          <input
            type="text"
            placeholder="Search users by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              padding: "6px 12px",
              borderRadius: "6px",
              border: `1px solid ${border}`,
              backgroundColor: inputBg,
              color: textTitle,
              fontSize: "13px",
              outline: "none",
              minWidth: "240px",
            }}
          />
        </div>

        {loading ? (
          <div style={{ padding: "20px", textAlign: "center", color: textSub, fontSize: "13px" }}>
            Loading users...
          </div>
        ) : filteredUsers.length === 0 ? (
          <div style={{ padding: "20px", textAlign: "center", color: textSub, fontSize: "13px" }}>
            No matching user accounts found.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "13px",
                fontFamily: "monospace",
              }}
            >
              <thead>
                <tr style={{ borderBottom: `1px solid ${border}`, textAlign: "left", backgroundColor: inputBg }}>
                  <th style={{ padding: "10px", color: textSub, fontSize: "11px" }}>ID</th>
                  <th style={{ padding: "10px", color: textSub, fontSize: "11px" }}>USERNAME</th>
                  <th style={{ padding: "10px", color: textSub, fontSize: "11px" }}>EMAIL</th>
                  <th style={{ padding: "10px", color: textSub, fontSize: "11px" }}>STATUS</th>
                  <th style={{ padding: "10px", color: textSub, fontSize: "11px" }}>ROLE</th>
                  <th style={{ padding: "10px", color: textSub, fontSize: "11px", textAlign: "right" }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => (
                  <tr key={u.id} style={{ borderBottom: `1px solid ${border}` }}>
                    <td style={{ padding: "12px 10px", color: "#58A6FF" }}>#{u.id}</td>
                    <td style={{ padding: "12px 10px", color: textTitle, fontWeight: "600" }}>
                      👤 {u.username}
                    </td>
                    <td style={{ padding: "12px 10px", color: textSub }}>{u.email}</td>
                    <td style={{ padding: "12px 10px" }}>
                      <span
                        style={{
                          color: u.is_active ? "#3FB950" : "#F85149",
                          backgroundColor: u.is_active ? "rgba(46,160,67,0.15)" : "rgba(248,81,73,0.15)",
                          padding: "2px 8px",
                          borderRadius: "10px",
                          fontSize: "11px",
                          fontWeight: "600",
                        }}
                      >
                        ● {u.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td style={{ padding: "12px 10px", color: textTitle }}>
                      {u.is_admin ? "🛡️ Admin" : "User"}
                    </td>
                    <td style={{ padding: "12px 10px", textAlign: "right" }}>
                      <button
                        onClick={() => handleDelete(u.id, u.username)}
                        style={{
                          padding: "4px 10px",
                          backgroundColor: "rgba(248, 81, 73, 0.15)",
                          border: "1px solid rgba(248, 81, 73, 0.4)",
                          color: "#F85149",
                          borderRadius: "4px",
                          fontSize: "12px",
                          fontWeight: "600",
                          cursor: "pointer",
                        }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default Users;