/**
 * ============================================================
 * FILE: lib/api.js — Centralized API Client
 * ============================================================
 *
 * Every API call in the app goes through THIS file.
 *
 * WHY CENTRALIZED?
 *   - Base URL configured in one place
 *   - Cookie/credential handling in one place
 *   - Automatic token refresh on 401
 *   - Consistent error handling
 *   - If the API changes, only this file changes
 * ============================================================
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

/**
 * Core fetch wrapper with automatic refresh and error handling.
 */
async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;

  // Extract CSRF token from cookies
  let csrfToken = null;
  if (typeof document !== 'undefined') {
    const cookies = document.cookie.split(';');
    for (let c of cookies) {
      c = c.trim();
      if (c.startsWith('csrfToken=')) {
        csrfToken = c.substring('csrfToken='.length);
        break;
      }
    }
  }

  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {}),
      ...options.headers,
    },
    credentials: 'include', // Send cookies with every request
  };

  let response = await fetch(url, config);

  // If 401 and not already trying to refresh, attempt token refresh
  if (response.status === 401 && !options._isRetry) {
    const refreshed = await refreshToken();
    if (refreshed) {
      // Retry the original request with the new token
      response = await fetch(url, { ...config, _isRetry: true });
    }
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.message || 'Something went wrong');
    error.status = response.status;
    error.code = data.errorCode;
    error.data = data;
    throw error;
  }

  return data;
}

async function refreshToken() {
  try {
    await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    });
    return true;
  } catch {
    return false;
  }
}

// ============================================
// AUTH API
// ============================================
export const authAPI = {
  registerSchool: (data) =>
    request('/auth/register/school', { method: 'POST', body: JSON.stringify(data) }),

  registerCandidate: (data) =>
    request('/auth/register/candidate', { method: 'POST', body: JSON.stringify(data) }),

  verifyOtp: (data) =>
    request('/auth/verify-otp', { method: 'POST', body: JSON.stringify(data) }),

  login: (data) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify(data) }),

  verifyAdminLogin: (data) =>
    request('/auth/verify-admin-login', { method: 'POST', body: JSON.stringify(data) }),

  logout: () =>
    request('/auth/logout', { method: 'POST' }),

  changePassword: (data) =>
    request('/auth/change-password', { method: 'PUT', body: JSON.stringify(data) }),

  refresh: () =>
    request('/auth/refresh', { method: 'POST' }),

  getCsrfToken: () =>
    request('/auth/csrf-token'),

  getSessions: () =>
    request('/auth/sessions'),

  revokeSession: (id) =>
    request(`/auth/sessions/${id}`, { method: 'DELETE' }),
};

// ============================================
// SCHOOL API
// ============================================
export const schoolAPI = {
  getProfile: () =>
    request('/schools/profile'),

  updateProfile: (data) =>
    request('/schools/profile', { method: 'PUT', body: JSON.stringify(data) }),

  getDashboard: () =>
    request('/schools/dashboard'),

  createRequirement: (data) =>
    request('/schools/requirements', { method: 'POST', body: JSON.stringify(data) }),

  getRequirements: (page = 1, limit = 20) =>
    request(`/schools/requirements?page=${page}&limit=${limit}`),

  getRequirementById: (id) =>
    request(`/schools/requirements/${id}`),

  getMatches: (requirementId) =>
    request(`/schools/matches/${requirementId}`),

  shortlistCandidate: (data) =>
    request('/schools/shortlist', { method: 'POST', body: JSON.stringify(data) }),
};

// ============================================
// CANDIDATE API
// ============================================
export const candidateAPI = {
  getProfile: () =>
    request('/candidates/profile'),

  updateProfile: (data) =>
    request('/candidates/profile', { method: 'PUT', body: JSON.stringify(data) }),

  getDashboard: () =>
    request('/candidates/dashboard'),

  getPushHistory: (page = 1, limit = 20) =>
    request(`/candidates/push-history?page=${page}&limit=${limit}`),

  getMatchScores: () =>
    request('/candidates/match-scores'),

  getProfileViews: () =>
    request('/candidates/profile-views'),
};

// ============================================
// ADMIN API
// ============================================
export const adminAPI = {
  getDashboard: () =>
    request('/admin/dashboard'),

  getSchools: (page = 1, limit = 20) =>
    request(`/admin/schools?page=${page}&limit=${limit}`),

  getCandidates: (page = 1, limit = 20, status = '') =>
    request(`/admin/candidates?page=${page}&limit=${limit}${status ? `&status=${status}` : ''}`),

  getPendingShortlists: (page = 1, limit = 20) =>
    request(`/admin/shortlists/pending?page=${page}&limit=${limit}`),

  approveShortlist: (id, notes) =>
    request(`/admin/shortlists/${id}/approve`, { method: 'POST', body: JSON.stringify({ notes }) }),

  rejectShortlist: (id, notes) =>
    request(`/admin/shortlists/${id}/reject`, { method: 'POST', body: JSON.stringify({ notes }) }),

  pushCandidate: (shortlistId) =>
    request('/admin/pipelines/push', { method: 'POST', body: JSON.stringify({ shortlistId }) }),

  releasePipeline: (id, reason) =>
    request(`/admin/pipelines/${id}/release`, { method: 'POST', body: JSON.stringify({ reason }) }),

  selectCandidate: (id) =>
    request(`/admin/pipelines/${id}/select`, { method: 'POST' }),

  dismissUser: (id, reason) =>
    request(`/admin/users/${id}/dismiss`, { method: 'POST', body: JSON.stringify({ reason }) }),

  getAuditLogs: (page = 1, limit = 20) =>
    request(`/admin/audit-logs?page=${page}&limit=${limit}`),

  getPipelines: (page = 1, limit = 20) =>
    request(`/admin/pipelines?page=${page}&limit=${limit}`),

  getFlaggedMessages: (page = 1, limit = 20) =>
    request(`/admin/messages/flagged?page=${page}&limit=${limit}`),

  clearMessageFlag: (id) =>
    request(`/admin/messages/${id}/clear-flag`, { method: 'PUT' }),

  getReports: (type) =>
    request(`/admin/reports/${type}`),

  updateFeeConfig: (amount) =>
    request('/admin/config/fee', { method: 'PUT', body: JSON.stringify({ amount }) }),
};

// ============================================
// MESSAGE API
// ============================================
export const messageAPI = {
  getThreads: () =>
    request('/messages/threads'),

  getMessages: (threadId, page = 1, limit = 50) =>
    request(`/messages/threads/${threadId}?page=${page}&limit=${limit}`),

  sendAction: (threadId, templateCode, metadata = {}) =>
    request(`/messages/threads/${threadId}/send`, {
      method: 'POST',
      body: JSON.stringify({ templateCode, metadata }),
    }),

  markAsRead: (threadId) =>
    request(`/messages/threads/${threadId}/read`, { method: 'PUT' }),

  getActions: () =>
    request('/messages/actions'),
};

// ============================================
// PAYMENT API
// ============================================
export const paymentAPI = {
  createOrder: () =>
    request('/payments/create-order', { method: 'POST' }),

  verifyPayment: (data) =>
    request('/payments/verify', { method: 'POST', body: JSON.stringify(data) }),

  getPaymentStatus: () =>
    request('/payments/status'),
};

// ============================================
// NOTIFICATION API
// ============================================
export const notificationAPI = {
  getNotifications: (page = 1, limit = 20) =>
    request(`/notifications?page=${page}&limit=${limit}`),

  markAsRead: (ids) =>
    request('/notifications/read', { method: 'PUT', body: JSON.stringify({ ids }) }),

  markAllAsRead: () =>
    request('/notifications/read', { method: 'PUT', body: JSON.stringify({}) }),

  getUnreadCount: () =>
    request('/notifications/unread-count'),

  getPreferences: () =>
    request('/notifications/preferences'),

  updatePreferences: (data) =>
    request('/notifications/preferences', { method: 'PUT', body: JSON.stringify(data) }),
};

// ============================================
// INTERVIEW API
// ============================================
export const interviewAPI = {
  schedule: (data) =>
    request('/interviews/schedule', { method: 'POST', body: JSON.stringify(data) }),

  sendInvite: (id) =>
    request(`/interviews/${id}/invite`, { method: 'POST' }),

  reschedule: (id, data) =>
    request(`/interviews/${id}/reschedule`, { method: 'PUT', body: JSON.stringify(data) }),

  cancel: (id) =>
    request(`/interviews/${id}/cancel`, { method: 'PUT' }),

  complete: (id, notes) =>
    request(`/interviews/${id}/complete`, { method: 'PUT', body: JSON.stringify({ notes }) }),

  getUpcoming: () =>
    request('/interviews/upcoming'),

  getForPipeline: (pipelineId) =>
    request(`/interviews/pipeline/${pipelineId}`),

  getJoinCredentials: (id) =>
    request(`/interviews/${id}/join`),
};

// ============================================
// FEEDBACK API
// ============================================
export const feedbackAPI = {
  submit: (data) =>
    request('/feedback', { method: 'POST', body: JSON.stringify(data) }),

  getForPipeline: (pipelineId) =>
    request(`/feedback/pipeline/${pipelineId}`),

  getStats: () =>
    request('/feedback/stats'),
};

// ============================================
// FILE API
// ============================================
export const fileAPI = {
  getUploadUrl: (fileName, fileType, fileSize) =>
    request('/files/upload-url', { method: 'POST', body: JSON.stringify({ fileName, fileType, fileSize }) }),

  getDownloadUrl: (fileKey) =>
    request(`/files/download-url?fileKey=${encodeURIComponent(fileKey)}`),
};
