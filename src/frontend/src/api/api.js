import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "",
});

// Attach JWT token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Handle expired or invalid token
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);

// Backup API
export const getBackups = async () => {
  const response = await api.get("/backups/");
  return response.data;
};

export const getSummary = async () => {
  const response = await api.get("/backups/dashboard/summary");
  return response.data;
};

export const createBackup = async (backup) => {
  const response = await api.post("/backups/", backup);
  return response.data;
};

export const updateBackup = async (id, backup) => {
  const response = await api.put(`/backups/${id}`, backup);
  return response.data;
};

export const deleteBackup = async (id) => {
  const response = await api.delete(`/backups/${id}`);
  return response.data;
};

// Users API (defined below under Authentication & User Management)

// Server Monitoring API
export const getServers = async () => {
  const response = await api.get("/servers/");
  return response.data;
};

export const getServersSummary = async () => {
  const response = await api.get("/servers/summary");
  return response.data;
};

export const getServerDetails = async (id) => {
  const response = await api.get(`/servers/${id}`);
  return response.data;
};

export const createServerNode = async (serverData) => {
  const response = await api.post("/servers/", serverData);
  return response.data;
};

export const updateServerNode = async (id, serverData) => {
  const response = await api.put(`/servers/${id}`, serverData);
  return response.data;
};

export const deleteServerNode = async (id) => {
  const response = await api.delete(`/servers/${id}`);
  return response.data;
};

export const getServerMetrics = async (id, limit = 50) => {
  const response = await api.get(`/servers/${id}/metrics?limit=${limit}`);
  return response.data;
};

export const collectServerMetrics = async (id) => {
  const response = await api.post(`/servers/${id}/collect`);
  return response.data;
};

// Alerts API
export const getAlerts = async (severity, status, serverId) => {
  const params = {};
  if (severity && severity !== "ALL") params.severity = severity;
  if (status && status !== "ALL") params.status = status;
  if (serverId) params.server_id = serverId;
  const response = await api.get("/alerts/", { params });
  return response.data;
};

export const getAlertsSummary = async () => {
  const response = await api.get("/alerts/summary");
  return response.data;
};

export const acknowledgeAlert = async (id) => {
  const response = await api.post(`/alerts/${id}/acknowledge`);
  return response.data;
};

export const resolveAlertRecord = async (id) => {
  const response = await api.post(`/alerts/${id}/resolve`);
  return response.data;
};

export const deleteAlertRecord = async (id) => {
  const response = await api.delete(`/alerts/${id}`);
  return response.data;
};

// Audit Logs API
export const getLogs = async (params = {}) => {
  const queryParams = {};
  if (params.eventType && params.eventType !== "ALL") queryParams.event_type = params.eventType;
  if (params.severity && params.severity !== "ALL") queryParams.severity = params.severity;
  if (params.serverId && params.serverId !== "ALL") queryParams.server_id = params.serverId;
  if (params.startDate) queryParams.start_date = params.startDate;
  if (params.endDate) queryParams.end_date = params.endDate;
  if (params.page) queryParams.page = params.page;
  if (params.limit) queryParams.limit = params.limit;

  const response = await api.get("/logs", { params: queryParams });
  return response.data;
};

// Authentication & User Management API
export const loginUser = async (username, password) => {
  const response = await api.post("/auth/login", { username, password });
  return response.data;
};

export const logoutUser = async () => {
  try {
    await api.post("/auth/logout");
  } catch (err) {
    console.error("Logout error", err);
  }
};

export const getMe = async () => {
  const response = await api.get("/auth/me");
  return response.data;
};

export const getUsers = async () => {
  const response = await api.get("/users/");
  return response.data;
};

export const createUser = async (userData) => {
  const response = await api.post("/users/", userData);
  return response.data;
};

export const updateUser = async (id, userData) => {
  const response = await api.put(`/users/${id}`, userData);
  return response.data;
};

export const deleteUser = async (id) => {
  const response = await api.delete(`/users/${id}`);
  return response.data;
};

// --- Notification API Functions ---

export const getNotifications = async (params = {}) => {
  const response = await api.get("/notifications", { params });
  return response.data;
};

export const getNotificationSummary = async () => {
  const response = await api.get("/notifications/summary");
  return response.data;
};

export const getNotificationSettings = async () => {
  const response = await api.get("/notifications/settings");
  return response.data;
};

export const updateNotificationSettings = async (settings) => {
  const response = await api.put("/notifications/settings", { settings });
  return response.data;
};

export const markNotificationAsRead = async (id) => {
  const response = await api.post(`/notifications/${id}/read`);
  return response.data;
};

export const markAllNotificationsAsRead = async () => {
  const response = await api.post("/notifications/read-all");
  return response.data;
};

export const deleteNotification = async (id) => {
  const response = await api.delete(`/notifications/${id}`);
  return response.data;
};

export const getEmailStatus = async () => {
  const response = await api.get("/notifications/email-status");
  return response.data;
};

export default api;