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
  const token = localStorage.getItem('arena_token') || localStorage.getItem('enigmatrix_token') || localStorage.getItem('cyberanzen_token');
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
      localStorage.removeItem('arena_token');
      localStorage.removeItem('arena_user');
      localStorage.removeItem('enigmatrix_token');
      localStorage.removeItem('cyberanzen_token');
    }
    return Promise.reject(error);
  }
);

// ==============================================================================
// AUTHENTICATION SERVICE
// ==============================================================================
export const authService = {
  async getSetupStatus() {
    const res = await apiClient.get('/auth/setup-status');
    return res.data;
  },

  async firstRunSetup(username, email, password, organizationName = 'CyberAnzen Arena') {
    const res = await apiClient.post('/auth/first-run-setup', {
      username,
      email,
      password,
      organization_name: organizationName
    });
    if (res.data.access_token) {
      localStorage.setItem('arena_token', res.data.access_token);
      localStorage.setItem('arena_user', JSON.stringify(res.data.user));
    }
    return res.data;
  },

  async login(username, password) {
    const res = await apiClient.post('/auth/login', { username, password });
    localStorage.setItem('arena_token', res.data.access_token);
    const userData = {
      id: res.data.id,
      username: res.data.username,
      role: res.data.role,
      points: res.data.points
    };
    localStorage.setItem('arena_user', JSON.stringify(userData));
    return res.data;
  },

  async register(username, email, password) {
    const res = await apiClient.post('/auth/register', { username, email, password });
    localStorage.setItem('arena_token', res.data.access_token);
    const userData = {
      id: res.data.id,
      username: res.data.username,
      role: res.data.role,
      points: res.data.points
    };
    localStorage.setItem('arena_user', JSON.stringify(userData));
    return res.data;
  },

  logout() {
    localStorage.removeItem('arena_token');
    localStorage.removeItem('arena_user');
    localStorage.removeItem('enigmatrix_token');
    localStorage.removeItem('cyberanzen_token');
  },

  getCurrentUser() {
    const data = localStorage.getItem('arena_user') || localStorage.getItem('enigmatrix_user');
    return data ? JSON.parse(data) : null;
  },

  async getProfile() {
    const res = await apiClient.get('/auth/me');
    return res.data;
  }
};

// ==============================================================================
// EVENTS SERVICE
// ==============================================================================
export const eventService = {
  async listEvents(status = null, event_type = null) {
    const params = {};
    if (status) params.status = status;
    if (event_type) params.event_type = event_type;
    const res = await apiClient.get('/events', { params });
    return res.data;
  },

  async getEventDetail(eventId) {
    const res = await apiClient.get(`/events/${eventId}`);
    return res.data;
  },

  async registerEvent(eventId, selectedMode = 'individual') {
    const res = await apiClient.post(`/events/${eventId}/register`, { selected_mode: selectedMode });
    return res.data;
  },

  async unregisterEvent(eventId) {
    const res = await apiClient.delete(`/events/${eventId}/register`);
    return res.data;
  },

  async getWorkspaceConfig(eventId) {
    const res = await apiClient.get(`/events/${eventId}/workspace-config`);
    return res.data;
  },

  async getEventQuestions(eventId) {
    const res = await apiClient.get(`/events/${eventId}/questions`);
    return res.data;
  },

  async getEventChallenges(eventId) {
    const res = await apiClient.get(`/events/${eventId}/challenges`);
    return res.data;
  },

  async getEventMCQs(eventId) {
    const res = await apiClient.get(`/events/${eventId}/mcqs`);
    return res.data;
  },

  async getEventLeaderboard(eventId) {
    const res = await apiClient.get(`/events/${eventId}/leaderboard`);
    return res.data;
  },

  async getEventSubmissions(eventId) {
    const res = await apiClient.get(`/events/${eventId}/submissions`);
    return res.data;
  }
};

// ==============================================================================
// SQUADS & TEAMS SERVICE
// ==============================================================================
export const teamService = {
  async getMyTeam() {
    const res = await apiClient.get('/teams/me');
    return res.data;
  },

  async createTeam(name, maxMembers = 4, eventId = null) {
    const res = await apiClient.post('/teams', {
      name,
      max_members: maxMembers,
      event_id: eventId
    });
    return res.data;
  },

  async joinTeam(invitationCode) {
    const res = await apiClient.post('/teams/join', { invitation_code: invitationCode });
    return res.data;
  },

  async leaveTeam() {
    const res = await apiClient.post('/teams/leave');
    return res.data;
  },

  async rotateInvite() {
    const res = await apiClient.post('/teams/rotate-invite');
    return res.data;
  },

  async getTeamLeaderboard() {
    const res = await apiClient.get('/leaderboard/teams');
    return res.data;
  }
};

// ==============================================================================
// DSA QUESTIONS SERVICE
// ==============================================================================
export const dsaService = {
  async listQuestions(params = {}) {
    const res = await apiClient.get('/questions', { params });
    return res.data;
  },

  async getQuestionDetail(identifier) {
    const res = await apiClient.get(`/questions/${identifier}`);
    return res.data;
  },

  async runSample(identifier, language, sourceCode) {
    const res = await apiClient.post(`/questions/${identifier}/run-sample`, {
      language,
      source_code: sourceCode
    });
    return res.data;
  },

  async submitSolution(identifier, language, sourceCode, eventId = null) {
    const payload = {
      language,
      source_code: sourceCode
    };
    if (eventId) payload.event_id = eventId;
    const res = await apiClient.post(`/questions/${identifier}/submit`, payload);
    return res.data;
  },

  async submitCode(identifier, sourceCode, language, eventId = null) {
    return this.submitSolution(identifier, language, sourceCode, eventId);
  }
};
export const questionService = dsaService;

// ==============================================================================
// MCQ QUIZ SERVICE
// ==============================================================================
export const mcqService = {
  async listMCQs(params = {}) {
    const res = await apiClient.get('/mcqs', { params });
    return res.data;
  },

  async getMCQDetail(mcqId) {
    const res = await apiClient.get(`/mcqs/${mcqId}`);
    return res.data;
  },

  async submitMCQ(mcqId, selectedOptionIds, timeTakenSec = 0, eventId = null) {
    const payload = {
      selected_option_ids: selectedOptionIds,
      time_taken_sec: timeTakenSec
    };
    if (eventId) payload.event_id = eventId;
    const res = await apiClient.post(`/mcqs/${mcqId}/submit`, payload);
    return res.data;
  },

  async submitAttempt(mcqId, selectedOptionIds, timeTakenSec = 0, eventId = null) {
    return this.submitMCQ(mcqId, selectedOptionIds, timeTakenSec, eventId);
  }
};

// ==============================================================================
// CTF CHALLENGES SERVICE
// ==============================================================================
export const ctfService = {
  async listChallenges(params = {}) {
    const res = await apiClient.get('/challenges', { params });
    return res.data;
  },

  async getChallengeDetail(identifier) {
    const res = await apiClient.get(`/challenges/${identifier}`);
    return res.data;
  },

  async submitFlag(identifier, flag, eventId = null) {
    const payload = { flag };
    if (eventId) payload.event_id = eventId;
    const res = await apiClient.post(`/challenges/${identifier}/submit-flag`, payload);
    return res.data;
  }
};
export const challengeService = ctfService;

// ==============================================================================
// DOCKER LABS SERVICE
// ==============================================================================
export const labService = {
  async launchLab(challengeId) {
    const res = await apiClient.post(`/labs/challenges/${challengeId}/launch`);
    return res.data;
  },

  async stopLab(instanceId) {
    const res = await apiClient.post(`/labs/instances/${instanceId}/stop`);
    return res.data;
  },

  async resetLab(instanceId) {
    const res = await apiClient.post(`/labs/instances/${instanceId}/reset`);
    return res.data;
  },

  async getLabStatus(instanceId) {
    const res = await apiClient.get(`/labs/instances/${instanceId}/status`);
    return res.data;
  }
};

// ==============================================================================
// LEADERBOARD & STATS SERVICE
// ==============================================================================
export const leaderboardService = {
  async getLeaderboard() {
    const res = await apiClient.get('/leaderboard');
    return res.data;
  },

  async getTeamLeaderboard() {
    const res = await apiClient.get('/leaderboard/teams');
    return res.data;
  },

  async getStats() {
    const res = await apiClient.get('/leaderboard/stats');
    return res.data;
  }
};

export const platformService = leaderboardService;

// ==============================================================================
// SUBMISSIONS SERVICE
// ==============================================================================
export const submissionService = {
  async getSubmissions(params = {}) {
    const res = await apiClient.get('/submissions', { params });
    return res.data;
  },

  async getSubmissionDetail(id) {
    const res = await apiClient.get(`/submissions/${id}`);
    return res.data;
  }
};

// ==============================================================================
// ADMIN CONTROL CENTER SERVICE
// ==============================================================================
export const adminService = {
  // Event Management & Builder
  async listEvents() {
    const res = await apiClient.get('/admin/events');
    return res.data;
  },
  async createEvent(data) {
    const res = await apiClient.post('/admin/events', data);
    return res.data;
  },
  async getEvent(id) {
    const res = await apiClient.get(`/admin/events/${id}`);
    return res.data;
  },
  async assignEventQuestions(id, questionIds, pointsOverrides = {}) {
    const res = await apiClient.post(`/admin/events/${id}/assign-questions`, {
      question_ids: questionIds,
      points_overrides: pointsOverrides
    });
    return res.data;
  },
  async updateEventStatus(id, status) {
    const res = await apiClient.post(`/admin/events/${id}/status`, { status });
    return res.data;
  },
  async uploadEventBanner(id, file) {
    const formData = new FormData();
    formData.append('file', file);
    const res = await apiClient.post(`/admin/events/${id}/banner`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  },
  async removeEventBanner(id) {
    const res = await apiClient.delete(`/admin/events/${id}/banner`);
    return res.data;
  },
  async deleteEvent(id) {
    const res = await apiClient.delete(`/admin/events/${id}`);
    return res.data;
  },

  // Competition Templates (Development Studio)
  async listCompetitionTemplates() {
    const res = await apiClient.get('/admin/competition-templates');
    return res.data;
  },
  async createCompetitionTemplate(data) {
    const res = await apiClient.post('/admin/competition-templates', data);
    return res.data;
  },
  async getCompetitionTemplate(id) {
    const res = await apiClient.get(`/admin/competition-templates/${id}`);
    return res.data;
  },
  async updateCompetitionTemplate(id, data) {
    const res = await apiClient.put(`/admin/competition-templates/${id}`, data);
    return res.data;
  },
  async deleteCompetitionTemplate(id) {
    const res = await apiClient.delete(`/admin/competition-templates/${id}`);
    return res.data;
  },

  // Event Question Breakdown & Management
  async getEventQuestionBreakdown(eventId) {
    const res = await apiClient.get(`/admin/events/${eventId}/question-breakdown`);
    return res.data;
  },
  async reorderEventQuestions(eventId, items) {
    const res = await apiClient.post(`/admin/events/${eventId}/questions/reorder`, { items });
    return res.data;
  },
  async copyQuestionsToEvent(eventId, { questionIds, domain = 'dsa', sourceEventId = null, pointsOverride = null }) {
    const res = await apiClient.post(`/admin/events/${eventId}/copy-questions`, {
      question_ids: questionIds,
      domain,
      source_event_id: sourceEventId,
      points_override: pointsOverride
    });
    return res.data;
  },
  async removeQuestionFromEvent(eventId, domain, questionId) {
    const res = await apiClient.delete(`/admin/events/${eventId}/questions/${domain}/${questionId}`);
    return res.data;
  },
  async updateEventQuestionExperience(eventId, data) {
    const res = await apiClient.put(`/admin/events/${eventId}/question-experience`, data);
    return res.data;
  },

  // DSA Question Studio
  async createDSA(data) {
    const res = await apiClient.post('/admin/dsa', data);
    return res.data;
  },
  async listDSA(params = {}) {
    const res = await apiClient.get('/admin/dsa', { params });
    return res.data;
  },
  async getDSA(id) {
    const res = await apiClient.get(`/admin/dsa/${id}`);
    return res.data;
  },
  async deleteDSA(id) {
    const res = await apiClient.delete(`/admin/dsa/${id}`);
    return res.data;
  },
  async addDSATestCase(id, data) {
    const res = await apiClient.post(`/admin/dsa/${id}/test-cases`, data);
    return res.data;
  },
  async deleteDSATestCase(testId) {
    const res = await apiClient.delete(`/admin/dsa/test-cases/${testId}`);
    return res.data;
  },
  async validateDSAReference(id) {
    const res = await apiClient.post(`/admin/dsa/${id}/validate-reference`);
    return res.data;
  },

  // MCQ Question Studio
  async createMCQ(data) {
    const res = await apiClient.post('/admin/mcqs', data);
    return res.data;
  },
  async listMCQs(params = {}) {
    const res = await apiClient.get('/admin/mcqs', { params });
    return res.data;
  },
  async deleteMCQ(id) {
    const res = await apiClient.delete(`/admin/mcqs/${id}`);
    return res.data;
  },

  // CTF Challenge Studio
  async createCTF(data) {
    const res = await apiClient.post('/admin/ctf', data);
    return res.data;
  },
  async listCTF(params = {}) {
    const res = await apiClient.get('/admin/ctf', { params });
    return res.data;
  },
  async deleteCTF(id) {
    const res = await apiClient.delete(`/admin/ctf/${id}`);
    return res.data;
  },

  // Dynamic Question Generator
  async createTemplate(data) {
    const res = await apiClient.post('/admin/dynamic-templates', data);
    return res.data;
  },
  async listTemplates() {
    const res = await apiClient.get('/admin/dynamic-templates');
    return res.data;
  },
  async generateInstance(templateId, seed) {
    const res = await apiClient.post(`/admin/dynamic-templates/${templateId}/generate`, { seed });
    return res.data;
  },

  // Docker Labs
  async listLabs() {
    const res = await apiClient.get('/admin/labs');
    return res.data;
  },

  // User Governance
  async listUsers() {
    const res = await apiClient.get('/admin/users');
    return res.data;
  },
  async updateUserRole(userId, role) {
    const res = await apiClient.put(`/admin/users/${userId}/role`, { role });
    return res.data;
  },
  async deleteUser(userId, confirmUsername) {
    const res = await apiClient.delete(`/admin/users/${userId}`, {
      data: { confirm_username: confirmUsername }
    });
    return res.data;
  },

  // Audits & Security
  async getAuditLogs(limit = 100) {
    const res = await apiClient.get('/admin/audit-logs', { params: { limit } });
    return res.data;
  },
  async getSecurityIncidents() {
    const res = await apiClient.get('/admin/security-incidents');
    return res.data;
  },
  async batchAntiCheat(category, allowCopyPaste) {
    const res = await apiClient.post('/admin/batch-anti-cheat', {
      category,
      allow_copy_paste: allowCopyPaste
    });
    return res.data;
  },

  // Submissions & Rejudging
  async listSubmissions(params = {}) {
    const res = await apiClient.get('/admin/submissions', { params });
    return res.data;
  },
  async rejudgeSubmission(subId) {
    const res = await apiClient.post(`/admin/submissions/${subId}/rejudge`);
    return res.data;
  },

  // Teams & Squads
  async listTeams(params = {}) {
    const res = await apiClient.get('/admin/teams', { params });
    return res.data;
  },
  async deleteTeam(teamId) {
    const res = await apiClient.delete(`/admin/teams/${teamId}`);
    return res.data;
  },

  // Event Registrations
  async listRegistrations(params = {}) {
    const res = await apiClient.get('/admin/registrations', { params });
    return res.data;
  },
  async deleteRegistration(regId) {
    const res = await apiClient.delete(`/admin/registrations/${regId}`);
    return res.data;
  },

  // Event Leaderboard & Freeze
  async getEventLeaderboard(eventId) {
    const res = await apiClient.get(`/admin/events/${eventId}/leaderboard`);
    return res.data;
  },
  async toggleFreezeLeaderboard(eventId) {
    const res = await apiClient.post(`/admin/events/${eventId}/freeze`);
    return res.data;
  },

  // Site Content & Creator Management
  async getSiteContent() {
    const res = await apiClient.get('/content/admin/content');
    return res.data;
  },
  async updateSiteContent(data) {
    const res = await apiClient.put('/content/admin/content', data);
    return res.data;
  },

  // System Settings
  async getSettings() {
    const res = await apiClient.get('/admin/settings');
    return res.data;
  },
  async updateSetting(key, payload) {
    const res = await apiClient.put(`/admin/settings/${key}`, payload);
    return res.data;
  }
};

// ==============================================================================
// PUBLIC SITE CONTENT SERVICE
// ==============================================================================
export const contentService = {
  async getPublicContent() {
    const res = await apiClient.get('/content/public');
    return res.data;
  }
};

// ==============================================================================
// QUESTION IMPORT SERVICE (PDF, DOCX, MD, JSON, CSV, ZIP, GIT)
// ==============================================================================
export const importService = {
  async uploadFile(file) {
    const formData = new FormData();
    formData.append('file', file);
    const res = await apiClient.post('/imports/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  },

  async importGit(repoUrl, branch = null, commitSha = null) {
    const res = await apiClient.post('/imports/git', {
      repo_url: repoUrl,
      branch: branch || undefined,
      commit_sha: commitSha || undefined
    });
    return res.data;
  },

  async listJobs(limit = 20) {
    const res = await apiClient.get('/imports/jobs', { params: { limit } });
    return res.data;
  },

  async getJob(jobId) {
    const res = await apiClient.get(`/imports/jobs/${jobId}`);
    return res.data;
  },

  async updateQuestion(jobId, idx, data) {
    const res = await apiClient.put(`/imports/jobs/${jobId}/question/${idx}`, data);
    return res.data;
  },

  async validateQuestion(jobId, idx) {
    const res = await apiClient.post(`/imports/jobs/${jobId}/validate/${idx}`);
    return res.data;
  },

  async publishQuestions(jobId, questionIndices, status = 'published') {
    const res = await apiClient.post(`/imports/jobs/${jobId}/publish`, {
      question_indices: questionIndices,
      status
    });
    return res.data;
  }
};
