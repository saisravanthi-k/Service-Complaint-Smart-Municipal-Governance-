import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (userData) => api.post('/auth/register', userData),
};

export const complaintAPI = {
  create: (data) => api.post('/complaints/', data),
  list: (params) => api.get('/complaints/', { params }),
  getById: (id) => api.get(`/complaints/${id}`),
  updateStatus: (id, status, notes) => api.put(`/complaints/${id}/status`, { status, resolution_notes: notes }),
  submitFeedback: (data) => api.post('/complaints/feedback', data),
  submitDelayReason: (id, data, officerId = 1) => api.post(`/complaints/${id}/delay-reason`, data, { params: { officer_id: officerId } }),
  getTimeline: (id) => api.get(`/complaints/${id}/timeline`),
};

export const officerAPI = {
  list: (departmentId) => api.get('/officers/', { params: { department_id: departmentId } }),
  allocate: (complaintId, officerId) => api.post('/officers/allocate', { complaint_id: complaintId, officer_id: officerId }),
  getWorkloadBalance: () => api.get('/officers/workload-balance'),
  getPerformanceReports: () => api.get('/officers/performance-reports'),
  getOfficerBadges: (officerId) => api.get(`/officers/${officerId}/badges`),
};

export const adminAPI = {
  getDelaySubmissions: () => api.get('/admin/delay-submissions'),
  reviewDelay: (complaintId, data) => api.post(`/admin/complaints/${complaintId}/review-delay`, data),
};

export const aiAPI = {
  processTeluguSpeechText: (text) => api.post('/ai/telugu-speech', { telugu_text: text }),
  processTeluguVoiceFile: (formData) => api.post('/ai/telugu-voice-file', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  predictSLA: (data) => api.post('/ai/predict-sla', data),
  getHotspots: () => api.get('/ai/predict-hotspots'),
  getRecommendations: () => api.get('/ai/recommendations'),
};

export const dashboardAPI = {
  getMetrics: () => api.get('/dashboard/metrics'),
  getSLAAnalytics: () => api.get('/dashboard/sla-analytics'),
  getWardAnalytics: () => api.get('/dashboard/ward-analytics'),
  getRankings: () => api.get('/dashboard/rankings'),
};

export const notificationAPI = {
  getNotifications: (recipientType, recipientId) => api.get('/notifications/', {
    params: { recipient_type: recipientType, recipient_id: recipientId }
  }),
  triggerEscalations: () => api.post('/notifications/trigger-escalation-check'),
};

export default api;
