import { get } from 'svelte/store';
import { authStore, logout } from '../stores/auth';

const BASE = '/api';

const request = async (method, path, body = null, auth = true) => {
  const headers = { 'Content-Type': 'application/json' };

  if (auth) {
    const store = get(authStore);
    if (store?.token) headers['Authorization'] = `Bearer ${store.token}`;
  }

  const opts = { method, headers };
  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(`${BASE}${path}`, opts);

  // Read response text first, then parse — handles empty bodies gracefully
  const text = await res.text();
  const data = text ? JSON.parse(text) : {};

  if (res.status === 401) {
    logout();
    window.location.href = '/login';
    return;
  }

  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
};

export const api = {
  get:    (path, auth = true)        => request('GET', path, null, auth),
  post:   (path, body, auth = true)  => request('POST', path, body, auth),
  patch:  (path, body, auth = true)  => request('PATCH', path, body, auth),
  delete: (path, auth = true)        => request('DELETE', path, null, auth),
};

// ── Auth ──────────────────────────────────────────
export const authApi = {
  adminLogin:      (body) => api.post('/auth/admin/login', body, false),
  adminRegister:   (body) => api.post('/auth/admin/register', body, false),
  studentRegister: (body) => api.post('/auth/student/register', body, false),
  studentLogin:    (body) => api.post('/auth/student/login', body, false),
  me:              ()     => api.get('/auth/me'),
};

// ── Admin ─────────────────────────────────────────
export const adminApi = {
  dashboard:           ()         => api.get('/admin/dashboard'),
  students:            (q = '')   => api.get(`/admin/students${q}`),
  pendingStudents:     ()         => api.get('/admin/students/pending'),
  studentDetail:       (id)       => api.get(`/admin/students/${id}`),
  approveStudent:      (id)       => api.patch(`/admin/students/${id}/approve`, {}),
  suspendStudent:      (id, body) => api.patch(`/admin/students/${id}/suspend`, body),
  unsuspendStudent:    (id)       => api.patch(`/admin/students/${id}/unsuspend`, {}),
  attendance:          (q = '')   => api.get(`/admin/attendance${q}`),
  resetRequests:       ()         => api.get('/admin/device-reset-requests'),
  approveReset:        (id)       => api.post(`/admin/device-reset-requests/${id}/approve`, {}),
  rejectReset:         (id, body) => api.post(`/admin/device-reset-requests/${id}/reject`, body),
};

// ── QR ────────────────────────────────────────────
export const qrApi = {
  generate:     (body) => api.post('/qr/generate', body),
  list:         ()     => api.get('/qr'),
  deactivate:   (id)   => api.patch(`/qr/${id}/deactivate`, {}),
  validate:     (tok)  => api.get(`/qr/validate/${tok}`, false),
};

// ── Attendance ────────────────────────────────────
export const attendanceApi = {
  clockIn:  (body) => api.post('/attendance/clock-in', body),
  clockOut: (body) => api.post('/attendance/clock-out', body),
  today:    ()     => api.get('/attendance/today'),
  history:  (q='') => api.get(`/attendance/history${q}`),
};

// ── Student ───────────────────────────────────────
export const studentApi = {
  profile:              ()   => api.get('/student/profile'),
  notifications:        ()   => api.get('/student/notifications'),
  unreadCount:          ()   => api.get('/student/notifications/unread-count'),
  markRead:             (id) => api.patch(`/student/notifications/${id}/read`, {}),
  markAllRead:          ()   => api.patch('/student/notifications/read-all', {}),
};

// ── Device ────────────────────────────────────────
export const deviceApi = {
  requestReset:    (body) => api.post('/device/reset-request', body),
  executeReset:    (body) => api.post('/device/reset', body, false),
  resetStatus:     ()     => api.get('/device/reset-request/status'),
};
