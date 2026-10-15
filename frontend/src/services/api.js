import axios from 'axios';

const API_BASE = '/api/v1';

const apiClient = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor to attach JWT token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('cyberanzen_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor for 401 handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token if expired
      localStorage.removeItem('cyberanzen_token');
      localStorage.removeItem('cyberanzen_user');
    }
    return Promise.reject(error);
  }
);

export const authService = {
  async login(username, password) {
    const res = await apiClient.post('/auth/login', { username, password });
    localStorage.setItem('cyberanzen_token', res.data.access_token);
    localStorage.setItem('cyberanzen_user', JSON.stringify({
      username: res.data.username,
      role: res.data.role,
      points: res.data.points
    }));
    return res.data;
  },

  async register(username, email, password) {
    const res = await apiClient.post('/auth/register', { username, email, password });
    localStorage.setItem('cyberanzen_token', res.data.access_token);
    localStorage.setItem('cyberanzen_user', JSON.stringify({
      username: res.data.username,
      role: res.data.role,
      points: res.data.points
    }));
    return res.data;
  },

  logout() {
    localStorage.removeItem('cyberanzen_token');
    localStorage.removeItem('cyberanzen_user');
  },

  getCurrentUser() {
    const data = localStorage.getItem('cyberanzen_user');
    return data ? JSON.parse(data) : null;
  },

  async getProfile() {
    const res = await apiClient.get('/auth/me');
    return res.data;
  }
};

export const caseService = {
  async listCases(params = {}) {
    const res = await apiClient.get('/cases', { params });
    return res.data;
  },

  async getCaseDetail(caseId) {
    const res = await apiClient.get(`/cases/${caseId}`);
    return res.data;
  }
};

export const submissionService = {
  async runSample(caseId, language, sourceCode) {
    const res = await apiClient.post('/submissions/run-sample', {
      case_id: caseId,
      language,
      source_code: sourceCode
    });
    return res.data;
  },

  async submitSolution(caseId, language, sourceCode) {
    const res = await apiClient.post('/submissions/submit', {
      case_id: caseId,
      language,
      source_code: sourceCode
    });
    return res.data;
  },

  async getSubmissions(caseId = null) {
    const params = caseId ? { case_id: caseId } : {};
    const res = await apiClient.get('/submissions', { params });
    return res.data;
  },

  async getSubmissionDetail(id) {
    const res = await apiClient.get(`/submissions/${id}`);
    return res.data;
  }
};

export const evidenceService = {
  async getTokens() {
    const res = await apiClient.get('/evidence/tokens');
    return res.data;
  },

  async getEvidenceGraph() {
    const res = await apiClient.get('/evidence/graph');
    return res.data;
  },

  async runFinalConvergence() {
    const res = await apiClient.post('/evidence/converge');
    return res.data;
  }
};

export const platformService = {
  async getLeaderboard() {
    const res = await apiClient.get('/leaderboard');
    return res.data;
  },

  async getStats() {
    const res = await apiClient.get('/stats');
    return res.data;
  }
};

export const adminService = {
  async listCases() {
    const res = await apiClient.get('/admin/cases');
    return res.data;
  },

  async updateCase(caseId, data) {
    const res = await apiClient.put(`/admin/cases/${caseId}`, data);
    return res.data;
  },

  async addTestCase(caseId, testData) {
    const res = await apiClient.post(`/admin/cases/${caseId}/tests`, testData);
    return res.data;
  },

  async getAuditLogs() {
    const res = await apiClient.get('/admin/audit-logs');
    return res.data;
  },

  async getHealth() {
    const res = await apiClient.get('/admin/health');
    return res.data;
  },

  async gitPreview(repoPath = null) {
    const res = await apiClient.post('/admin/git/preview', { repo_path: repoPath });
    return res.data;
  },

  async gitSync(repoPath = null, publishValidated = false) {
    const res = await apiClient.post('/admin/git/sync', {
      repo_path: repoPath,
      publish_validated: publishValidated
    });
    return res.data;
  }
};
