import { useState, useEffect } from "react";
import { createBackup, updateBackup, getServers } from "../api/api";
import { useTheme } from "../context/ThemeContext";

function BackupForm({ onSuccess, editingBackup, clearEditing }) {
  const { darkMode } = useTheme();

  const [servers, setServers] = useState([]);
  const [form, setForm] = useState({
    server_id: "",
    backup_name: "",
    backup_type: "FULL",
    status: "SUCCESS",
    size: "1.5 GB",
    source: "/var/data",
    destination: "s3://odri-backups/",
    duration: "12m 45s",
    error_message: "",
  });

  const border = darkMode ? "#30363D" : "#D0D7DE";
  const textTitle = darkMode ? "#F0F6FC" : "#1F2328";

  useEffect(() => {
    const fetchServers = async () => {
      try {
        const list = await getServers();
        if (Array.isArray(list)) setServers(list);
      } catch (err) {
        console.error("Failed to load servers for backup form", err);
      }
    };
    fetchServers();
  }, []);

  useEffect(() => {
    if (editingBackup) {
      setForm({
        server_id: editingBackup.server_id ? String(editingBackup.server_id) : "",
        backup_name: editingBackup.backup_name || editingBackup.file_name || "",
        backup_type: editingBackup.backup_type || "FULL",
        status: editingBackup.status || "SUCCESS",
        size: editingBackup.size || "1.5 GB",
        source: editingBackup.source || "/var/data",
        destination: editingBackup.destination || editingBackup.storage_location || "s3://odri-backups/",
        duration: editingBackup.duration || "12m 45s",
        error_message: editingBackup.error_message || "",
      });
    }
  }, [editingBackup]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const payload = {
        ...form,
        server_id: form.server_id ? parseInt(form.server_id, 10) : null,
      };

      if (editingBackup) {
        await updateBackup(editingBackup.id, payload);
        if (clearEditing) clearEditing();
      } else {
        await createBackup(payload);
      }

      setForm({
        server_id: "",
        backup_name: "",
        backup_type: "FULL",
        status: "SUCCESS",
        size: "1.5 GB",
        source: "/var/data",
        destination: "s3://odri-backups/",
        duration: "12m 45s",
        error_message: "",
      });

      if (onSuccess) onSuccess();
    } catch (error) {
      console.error("Backup operation error:", error);
      alert("Failed to submit backup record. Please check backend connection.");
    }
  };

  const inputStyle = {
    padding: "8px 12px",
    borderRadius: "6px",
    border: `1px solid ${border}`,
    backgroundColor: darkMode ? "#0D1117" : "#F6F8FA",
    color: textTitle,
    fontSize: "13px",
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px", alignItems: "end" }}>
      <div>
        <label style={{ display: "block", fontSize: "11px", fontWeight: "600", color: textTitle, marginBottom: "4px" }}>Target Server Node</label>
        <select name="server_id" value={form.server_id} onChange={handleChange} style={inputStyle}>
          <option value="">-- Unassigned Node --</option>
          {servers.map((srv) => (
            <option key={srv.id} value={srv.id}>
              {srv.name} ({srv.host})
            </option>
          ))}
        </select>
      </div>

      <div>
        <label style={{ display: "block", fontSize: "11px", fontWeight: "600", color: textTitle, marginBottom: "4px" }}>Backup Job Name *</label>
        <input
          name="backup_name"
          placeholder="e.g. Daily Postgres Backup"
          value={form.backup_name}
          onChange={handleChange}
          style={inputStyle}
          required
        />
      </div>

      <div>
        <label style={{ display: "block", fontSize: "11px", fontWeight: "600", color: textTitle, marginBottom: "4px" }}>Backup Type *</label>
        <select name="backup_type" value={form.backup_type} onChange={handleChange} style={inputStyle}>
          <option value="FULL">FULL</option>
          <option value="INCREMENTAL">INCREMENTAL</option>
          <option value="DIFFERENTIAL">DIFFERENTIAL</option>
          <option value="DATABASE">DATABASE</option>
          <option value="SYSTEM_STATE">SYSTEM_STATE</option>
        </select>
      </div>

      <div>
        <label style={{ display: "block", fontSize: "11px", fontWeight: "600", color: textTitle, marginBottom: "4px" }}>Status *</label>
        <select name="status" value={form.status} onChange={handleChange} style={inputStyle}>
          <option value="SUCCESS">SUCCESS</option>
          <option value="FAILED">FAILED (Triggers Alert)</option>
          <option value="RUNNING">RUNNING</option>
          <option value="WARNING">WARNING</option>
        </select>
      </div>

      <div>
        <label style={{ display: "block", fontSize: "11px", fontWeight: "600", color: textTitle, marginBottom: "4px" }}>Size</label>
        <input name="size" placeholder="e.g. 2.4 GB" value={form.size} onChange={handleChange} style={inputStyle} />
      </div>

      <div>
        <label style={{ display: "block", fontSize: "11px", fontWeight: "600", color: textTitle, marginBottom: "4px" }}>Source Path</label>
        <input name="source" placeholder="/var/data" value={form.source} onChange={handleChange} style={inputStyle} />
      </div>

      <div>
        <label style={{ display: "block", fontSize: "11px", fontWeight: "600", color: textTitle, marginBottom: "4px" }}>Destination Vault</label>
        <input name="destination" placeholder="s3://odri-backups/" value={form.destination} onChange={handleChange} style={inputStyle} />
      </div>

      {form.status === "FAILED" && (
        <div style={{ gridColumn: "1 / -1" }}>
          <label style={{ display: "block", fontSize: "11px", fontWeight: "600", color: "#EF4444", marginBottom: "4px" }}>Error Description (Alert Payload)</label>
          <input
            name="error_message"
            placeholder="e.g. Storage vault write permission denied"
            value={form.error_message}
            onChange={handleChange}
            style={{ ...inputStyle, borderColor: "#EF4444" }}
          />
        </div>
      )}

      <div style={{ display: "flex", gap: "8px", gridColumn: "1 / -1", marginTop: "4px" }}>
        <button
          type="submit"
          style={{
            backgroundColor: "#2563EB",
            color: "#FFFFFF",
            border: "none",
            padding: "9px 16px",
            borderRadius: "6px",
            fontSize: "13px",
            fontWeight: "600",
            cursor: "pointer",
            flex: 1,
          }}
        >
          {editingBackup ? "Save Changes" : "Create Backup Record"}
        </button>

        {editingBackup && (
          <button
            type="button"
            onClick={clearEditing}
            style={{
              backgroundColor: "transparent",
              border: `1px solid ${border}`,
              color: textTitle,
              padding: "9px 14px",
              borderRadius: "6px",
              fontSize: "13px",
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

export default BackupForm;