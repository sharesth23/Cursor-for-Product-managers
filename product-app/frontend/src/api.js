import axios from "axios";

const api = axios.create({
  baseURL: "/api"
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("auth-token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth
export async function login(email, password) {
  const res = await api.post("/auth/login", { email, password });
  return res.data;
}

export async function superAdminLogin(email, password) {
  const res = await api.post("/auth/super-admin/login", { email, password });
  return res.data;
}

export async function signup(data) {
  const res = await api.post("/auth/signup", data);
  return res.data;
}

export async function fetchCompaniesList() {
  const res = await api.get("/auth/companies/list");
  return res.data;
}

// Super Admin
export async function fetchAllCompanies() {
  const res = await api.get("/super/companies");
  return res.data;
}
export async function createCompany(data) {
  const res = await api.post("/super/companies", data);
  return res.data;
}
export async function updateCompany(id, data) {
  const res = await api.patch(`/super/companies/${id}`, data);
  return res.data;
}
export async function deleteCompany(id) {
  const res = await api.delete(`/super/companies/${id}`);
  return res.data;
}
export async function fetchAuthLogs() {
  const res = await api.get("/super/logs");
  return res.data;
}

// Company Admin
export async function fetchEmployees() {
  const res = await api.get("/admin/employees");
  return res.data;
}
export async function createEmployee(data) {
  const res = await api.post("/admin/employees", data);
  return res.data;
}
export async function updateEmployee(id, data) {
  const res = await api.patch(`/admin/employees/${id}`, data);
  return res.data;
}
export async function updateEmployeeStatus(id, is_active) {
  const res = await api.patch(`/admin/employees/${id}/status`, { is_active });
  return res.data;
}

// Projects
export async function fetchProjects() {
  const res = await api.get("/projects");
  return res.data;
}
export async function createProject(data) {
  const res = await api.post("/projects", data);
  return res.data;
}
export async function fetchProject(projectId) {
  const res = await api.get(`/projects/${projectId}`);
  return res.data;
}

// Uploads
export async function uploadFile(projectId, file, kind = "evidence") {
  const form = new FormData();
  form.append("file", file);
  form.append("kind", kind);
  const res = await api.post(`/uploads/${projectId}`, form, {
    headers: { "Content-Type": "multipart/form-data" }
  });
  return res.data;
}
export async function fetchUploads(projectId) {
  const res = await api.get(`/uploads/${projectId}`);
  return res.data;
}

// Analysis
export async function fetchAnalysisSummary(projectId) {
  const res = await api.get(`/analysis/${projectId}/summary`);
  return res.data;
}
export async function fetchLatestAnalysis(projectId) {
  const res = await api.get(`/analysis/${projectId}`);
  return res.data;
}
export async function runAnalysis(projectId) {
  const res = await api.post(`/analysis/${projectId}`);
  return res.data;
}
export async function chatWithAnalysis(projectId, message, history = []) {
  const res = await api.post(`/analysis/${projectId}/chat`, { message, history });
  return res.data;
}

// Tasks
export async function fetchTasks(projectId) {
  const res = await api.get(`/tasks/${projectId}`);
  return res.data;
}
export async function createTask(projectId, data) {
  const res = await api.post(`/tasks/${projectId}`, data);
  return res.data;
}
export async function updateTask(projectId, taskId, data) {
  const res = await api.patch(`/tasks/${projectId}/${taskId}`, data);
  return res.data;
}

export default api;
