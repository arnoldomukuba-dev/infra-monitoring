import { useState } from "react";
import { useTheme } from "../context/ThemeContext";

function BackupTable({ backups = [], setEditingBackup, handleDelete }) {
  const { darkMode } = useTheme();
  const [selectedBackup, setSelectedBackup] = useState(null);

  const tableBg = darkMode ? "#161B22" : "#FFFFFF";
  const headerBg = darkMode ? "#0D1117" : "#F6F8FA";
  const border = darkMode ? "#30363D" : "#D0D7DE";
  const rowBorder = darkMode ? "#21262D" : "#EAEEF2";
  const text = darkMode ? "#C9D1D9" : "#1F2328";
  const textBold = darkMode ? "#F0F6FC" : "#1F2328";
  const textMuted = darkMode ? "#8B949E" : "#6E7781";
  const codeColor = darkMode ? "#58A6FF" : "#0969DA";

  if (!backups || backups.length === 0) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: "30px",
          backgroundColor: tableBg,
          border: `1px solid ${border}`,
          borderRadius: "8px",
          color: textMuted,
          fontSize: "13px",
        }}
      >
        <span>📭</span> No backup records found matching the current criteria.
      </div>
    );
  }

  const getStatusBadge = (status = "") => {
    const s = status.toUpperCase();
    if (s === "SUCCESS" || s === "SUCCESSFUL" || s === "COMPLETED") {
      return { label: "SUCCESS", bg: "rgba(46, 160, 67, 0.15)", color: "#3FB950", border: "rgba(46, 160, 67, 0.4)" };
    }
    if (s === "FAILED" || s === "ERROR") {
      return { label: "FAILED", bg: "rgba(248, 81, 73, 0.15)", color: "#F85149", border: "rgba(248, 81, 73, 0.4)" };
    }
    if (s === "RUNNING" || s === "IN_PROGRESS") {
      return { label: "RUNNING", bg: "rgba(56, 139, 253, 0.15)", color: "#58A6FF", border: "rgba(56, 139, 253, 0.4)" };
    }
    return { label: "WARNING", bg: "rgba(210, 153, 34, 0.15)", color: "#D29922", border: "rgba(210, 153, 34, 0.4)" };
  };

  return (
    <>
      <div style={{ overflowX: "auto", borderRadius: "8px", border: `1px solid ${border}` }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            backgroundColor: tableBg,
            color: text,
            fontSize: "13px",
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace',
          }}
        >
          <thead>
            <tr style={{ backgroundColor: headerBg, borderBottom: `1px solid ${border}` }}>
              <th style={{ padding: "10px 14px", textAlign: "left", fontSize: "11px", fontWeight: "700", color: textMuted }}>SERVER</th>
              <th style={{ padding: "10px 14px", textAlign: "left", fontSize: "11px", fontWeight: "700", color: textMuted }}>BACKUP NAME</th>
              <th style={{ padding: "10px 14px", textAlign: "left", fontSize: "11px", fontWeight: "700", color: textMuted }}>TYPE</th>
              <th style={{ padding: "10px 14px", textAlign: "left", fontSize: "11px", fontWeight: "700", color: textMuted }}>SIZE</th>
              <th style={{ padding: "10px 14px", textAlign: "left", fontSize: "11px", fontWeight: "700", color: textMuted }}>STARTED</th>
              <th style={{ padding: "10px 14px", textAlign: "left", fontSize: "11px", fontWeight: "700", color: textMuted }}>DURATION</th>
              <th style={{ padding: "10px 14px", textAlign: "left", fontSize: "11px", fontWeight: "700", color: textMuted }}>STATUS</th>
              <th style={{ padding: "10px 14px", textAlign: "right", fontSize: "11px", fontWeight: "700", color: textMuted }}>ACTIONS</th>
            </tr>
          </thead>

          <tbody>
            {backups.map((backup) => {
              const badge = getStatusBadge(backup.status);
              const bName = backup.backup_name || backup.file_name || `Backup #${backup.id}`;
              const sName = backup.server_name || backup.system_name || "Host Node";

              return (
                <tr key={backup.id} style={{ borderBottom: `1px solid ${rowBorder}` }}>
                  <td style={{ padding: "12px 14px", fontWeight: "600", color: textBold }}>{sName}</td>
                  <td style={{ padding: "12px 14px", fontFamily: "monospace", color: codeColor, fontSize: "12px" }}>{bName}</td>
                  <td style={{ padding: "12px 14px" }}>
                    <span style={{ fontSize: "10px", fontWeight: "700", padding: "2px 6px", borderRadius: "4px", backgroundColor: darkMode ? "#21262D" : "#EFF6FF", color: textMuted }}>
                      {backup.backup_type || "FULL"}
                    </span>
                  </td>
                  <td style={{ padding: "12px 14px", fontFamily: "monospace", fontSize: "12px" }}>{backup.size || "1.5 GB"}</td>
                  <td style={{ padding: "12px 14px", fontSize: "12px", color: textMuted }}>
                    {backup.started_at ? new Date(backup.started_at).toLocaleString() : new Date(backup.created_at).toLocaleString()}
                  </td>
                  <td style={{ padding: "12px 14px", fontSize: "12px", color: textMuted }}>{backup.duration || "12m 45s"}</td>
                  <td style={{ padding: "12px 14px" }}>
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
                      ● {badge.label}
                    </span>
                  </td>
                  <td style={{ padding: "12px 14px", textAlign: "right" }}>
                    <button
                      onClick={() => setSelectedBackup(backup)}
                      style={{
                        padding: "4px 8px",
                        backgroundColor: darkMode ? "#21262D" : "#F6F8FA",
                        border: `1px solid ${border}`,
                        color: text,
                        borderRadius: "4px",
                        fontSize: "11px",
                        marginRight: "4px",
                        cursor: "pointer",
                      }}
                    >
                      Details
                    </button>
                    <button
                      onClick={() => setEditingBackup(backup)}
                      style={{
                        padding: "4px 8px",
                        backgroundColor: darkMode ? "rgba(56, 139, 253, 0.15)" : "#DDF4FF",
                        border: `1px solid ${darkMode ? "rgba(56, 139, 253, 0.4)" : "#54AEFF"}`,
                        color: darkMode ? "#58A6FF" : "#0969DA",
                        borderRadius: "4px",
                        fontSize: "11px",
                        fontWeight: "600",
                        marginRight: "4px",
                        cursor: "pointer",
                      }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(backup.id)}
                      style={{
                        padding: "4px 8px",
                        backgroundColor: "rgba(248, 81, 73, 0.15)",
                        border: "1px solid rgba(248, 81, 73, 0.4)",
                        color: "#F85149",
                        borderRadius: "4px",
                        fontSize: "11px",
                        fontWeight: "600",
                        cursor: "pointer",
                      }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Backup Details Modal */}
      {selectedBackup && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "20px",
          }}
        >
          <div
            style={{
              backgroundColor: tableBg,
              border: `1px solid ${border}`,
              borderRadius: "8px",
              padding: "24px",
              maxWidth: "500px",
              width: "100%",
              boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ margin: 0, fontSize: "16px", color: textBold }}>💾 Backup Job Details</h3>
              <button
                onClick={() => setSelectedBackup(null)}
                style={{ background: "none", border: "none", color: textMuted, fontSize: "16px", cursor: "pointer" }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "13px" }}>
              <div><strong>Backup Name:</strong> <span style={{ color: codeColor }}>{selectedBackup.backup_name || selectedBackup.file_name}</span></div>
              <div><strong>Server Node:</strong> {selectedBackup.server_name || selectedBackup.system_name || "Unassigned"}</div>
              <div><strong>Type:</strong> {selectedBackup.backup_type || "FULL"}</div>
              <div><strong>Status:</strong> <strong style={{ color: getStatusBadge(selectedBackup.status).color }}>{selectedBackup.status}</strong></div>
              <div><strong>Size:</strong> {selectedBackup.size || "1.5 GB"}</div>
              <div><strong>Source Path:</strong> <code style={{ color: codeColor }}>{selectedBackup.source || "/var/data"}</code></div>
              <div><strong>Destination Vault:</strong> <code style={{ color: codeColor }}>{selectedBackup.destination || selectedBackup.storage_location || "s3://odri-backups/"}</code></div>
              <div><strong>Duration:</strong> {selectedBackup.duration || "12m 45s"}</div>
              <div><strong>Created Time:</strong> {new Date(selectedBackup.created_at).toLocaleString()}</div>

              {selectedBackup.error_message && (
                <div style={{ backgroundColor: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", padding: "10px", borderRadius: "6px", color: "#EF4444" }}>
                  <strong>Failure Error Payload:</strong>
                  <div style={{ marginTop: "4px", fontSize: "12px", fontFamily: "monospace" }}>{selectedBackup.error_message}</div>
                </div>
              )}
            </div>

            <div style={{ marginTop: "20px", textAlign: "right" }}>
              <button
                onClick={() => setSelectedBackup(null)}
                style={{
                  backgroundColor: "#2563EB",
                  color: "#FFFFFF",
                  border: "none",
                  padding: "8px 16px",
                  borderRadius: "6px",
                  fontSize: "12px",
                  fontWeight: "600",
                  cursor: "pointer",
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default BackupTable;