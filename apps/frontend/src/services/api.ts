import axios from 'axios';

// Since Vite proxy is configured, we use '/api/v1' as base.
// In production or direct connections, it can fallback to environment variable.
let API_URL = import.meta.env.VITE_API_URL || '/api/v1';
if (API_URL.startsWith('http') && !API_URL.endsWith('/api/v1')) {
  API_URL = `${API_URL.replace(/\/$/, '')}/api/v1`;
}


export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercept requests to add the JWT token automatically
api.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Auth endpoints
export const authService = {
  login: async (email: string, role?: string, name?: string) => {
    const response = await api.post('/auth/login', { email, role, name });
    if (response.data?.success && response.data?.data?.token) {
      sessionStorage.setItem('token', response.data.data.token);
      sessionStorage.setItem('user', JSON.stringify(response.data.data.user));
    }
    return response.data;
  },
  register: async (data: { name: string; email: string; accountType?: string; professionalId?: string; jurisdiction?: string; password?: string }) => {
    const response = await api.post('/auth/register', data);
    if (response.data?.success && response.data?.data?.token) {
      sessionStorage.setItem('token', response.data.data.token);
      sessionStorage.setItem('user', JSON.stringify(response.data.data.user));
    }
    return response.data;
  },
  verifyId: async (accountType: string, professionalId: string) => {
    const response = await api.post('/auth/verify-id', { accountType, professionalId });
    return response.data;
  },
  getCurrentUser: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },
  logout: () => {
    const userRaw = sessionStorage.getItem('user');
    if (userRaw) {
      try {
        const user = JSON.parse(userRaw);
        if (user && user.id) {
          import('./offlineStorage').then(({ offlineStorage }) => {
            offlineStorage.clearAllForUser('profiles', user.id);
            offlineStorage.clearAllForUser('timelines', user.id);
            offlineStorage.clearAllForUser('emergency', user.id);
            offlineStorage.clearAllForUser('screenings', user.id);
          }).catch(() => {});
        }
      } catch (e) {}
    }
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('active_emergency_session_id');
  },
};

// AI assistant endpoints (chat sessions)
export const assistantService = {
  createSession: async (language = 'en', userId = 'usr-901') => {
    const response = await api.post('/assistant/sessions', { language, userId });
    return response.data;
  },
  getSessions: async (userId = 'usr-901') => {
    const response = await api.get('/assistant/sessions', { params: { userId } });
    return response.data;
  },
  getSession: async (sessionId: string) => {
    const response = await api.get(`/assistant/sessions/${sessionId}`);
    return response.data;
  },
  deleteSession: async (sessionId: string) => {
    const response = await api.delete(`/assistant/sessions/${sessionId}`);
    return response.data;
  },
  renameSession: async (sessionId: string, title: string) => {
    const response = await api.post(`/assistant/sessions/${sessionId}/rename`, { title });
    return response.data;
  },
  sendMessage: async (sessionId: string, content: string, language = 'en', userId = 'usr-901') => {
    const response = await api.post(`/assistant/sessions/${sessionId}/messages`, {
      content,
      language,
      userId,
    });
    return response.data;
  },
  toggleFavorite: async (sessionId: string, messageId: string) => {
    const response = await api.post(`/assistant/sessions/${sessionId}/messages/${messageId}/favorite`);
    return response.data;
  },
  submitFeedback: async (sessionId: string, messageId: string, feedback: string) => {
    const response = await api.post(`/assistant/sessions/${sessionId}/messages/${messageId}/feedback`, {
      feedback,
    });
    return response.data;
  },
};

// Triage query & OCR scanning endpoints
export const aiService = {
  triage: async (query: string, language = 'hi', geoHash?: string) => {
    const response = await api.post('/ai/triage', { query, language, geoHash });
    return response.data;
  },
  translate: async (text: string, sourceLang: string, targetLang: string) => {
    const response = await api.post('/ai/translate', { text, sourceLang, targetLang });
    return response.data;
  },
  scanMedicine: async (formData: FormData, contextConsent = false) => {
    // Attach userId and consent flag so backend can run patient safety checks
    const user = sessionStorage.getItem('user');
    const userId = user ? JSON.parse(user)?.id || 'usr-901' : 'usr-901';
    formData.set('userId', userId);
    formData.set('contextConsent', String(contextConsent));
    const response = await api.post('/medicine/analyze', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
  analyzeReport: async (formData: FormData) => {
    const response = await api.post('/ai/analyze-report', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
};

// Patient context — fetches allergies, prescriptions, digital twin for safety checks
export const patientContextApiService = {
  getContext: async (userId?: string) => {
    const user = sessionStorage.getItem('user');
    const uid = userId || (user ? JSON.parse(user)?.id : 'usr-901') || 'usr-901';
    const response = await api.get('/patient-context', { params: { userId: uid } });
    return response.data;
  },
};

// Emergency Response Network Services
export const emergencyNetworkService = {
  classify: async (symptoms: string[]) => {
    const response = await api.post('/emergency-network/classify', { symptoms });
    return response.data;
  },
  createSession: async (params: {
    symptoms: string[];
    latitude: number;
    longitude: number;
    companionName?: string;
    companionPhone?: string;
  }) => {
    const response = await api.post('/emergency-network/session', params);
    return response.data;
  },
  getSession: async (id: string) => {
    const response = await api.get(`/emergency-network/session/${id}`);
    return response.data;
  },
  sendHospitalAlert: async (id: string, hospitalId: string, eta?: string) => {
    const response = await api.post(`/emergency-network/session/${id}/hospital-alert`, { hospitalId, eta });
    return response.data;
  },
  sendPharmacyAlert: async (id: string, pharmacyId: string, assistanceRequest?: string) => {
    const response = await api.post(`/emergency-network/session/${id}/pharmacy-alert`, { pharmacyId, assistanceRequest });
    return response.data;
  },
  grantConsent: async (id: string, params: { authorizedEntity: string; consentScope?: string[]; durationMinutes?: number }) => {
    const response = await api.post(`/emergency-network/session/${id}/consent`, { action: 'grant', ...params });
    return response.data;
  },
  revokeConsent: async (id: string, consentId: string) => {
    const response = await api.post(`/emergency-network/session/${id}/consent`, { action: 'revoke', consentId });
    return response.data;
  },
  getMedicalHistory: async (id: string, entity: string) => {
    const response = await api.get(`/emergency-network/session/${id}/medical-history`, { params: { entity } });
    return response.data;
  },
  resolveSession: async (id: string) => {
    const response = await api.post(`/emergency-network/session/${id}/resolve`);
    return response.data;
  },
  getNearbyFacilities: async () => {
    const response = await api.get('/emergency-network/facilities');
    return response.data;
  },
  // Doctor assistance / chat request
  requestDoctorAssistance: async (id: string) => {
    const response = await api.post(`/emergency-network/session/${id}/doctor-assistance`);
    return response.data;
  },
  getDoctorAssistanceStatus: async (id: string) => {
    const response = await api.get(`/emergency-network/session/${id}/doctor-status`);
    return response.data;
  },
  getDoctorRequests: async () => {
    const response = await api.get('/emergency-network/doctor/requests');
    return response.data;
  },
  acceptRequest: async (requestId: string) => {
    const response = await api.post(`/emergency-network/doctor/requests/${requestId}/accept`);
    return response.data;
  },
  declineRequest: async (requestId: string) => {
    const response = await api.post(`/emergency-network/doctor/requests/${requestId}/decline`);
    return response.data;
  },
  getChatMessages: async (requestId: string) => {
    const response = await api.get(`/emergency-network/doctor/requests/${requestId}/messages`);
    return response.data;
  },
  sendChatMessage: async (requestId: string, message: string, options?: { patientLanguage?: string; doctorLanguage?: string }) => {
    const response = await api.post(`/emergency-network/doctor/requests/${requestId}/messages`, {
      message,
      patientLanguage: options?.patientLanguage,
      doctorLanguage: options?.doctorLanguage,
    });
    return response.data;
  },
  translateChatMessage: async (requestId: string, messageId: string, targetLanguage: string) => {
    const response = await api.post(`/emergency-network/doctor/requests/${requestId}/translate`, {
      messageId,
      targetLanguage,
    });
    return response.data;
  },
  closeRequest: async (requestId: string) => {
    const response = await api.post(`/emergency-network/doctor/requests/${requestId}/close`);
    return response.data;
  },
  getEmergencyContext: async (requestId: string) => {
    const response = await api.get(`/emergency-network/doctor/requests/${requestId}/context`);
    return response.data;
  },
  getChatSummary: async (requestId: string) => {
    const response = await api.get(`/emergency-network/doctor/requests/${requestId}/ai-summary`);
    return response.data;
  },
  // Hospital view
  getHospitalAlerts: async (hospitalId: string) => {
    const response = await api.get(`/emergency-network/hospital/${hospitalId}/alerts`);
    return response.data;
  },
  acknowledgeHospitalAlert: async (hospitalId: string, alertId: string) => {
    const response = await api.post(`/emergency-network/hospital/${hospitalId}/alerts/${alertId}/acknowledge`);
    return response.data;
  },
  // Pharmacy view (Phase C — full)
  getPharmacyAlerts: async (pharmacyId: string) => {
    const response = await api.get(`/emergency-network/pharmacy/${pharmacyId}/alerts`);
    return response.data;
  },
  getPharmacyAlertContext: async (pharmacyId: string, alertId: string) => {
    const response = await api.get(`/emergency-network/pharmacy/${pharmacyId}/alerts/${alertId}`);
    return response.data;
  },
  acknowledgePharmacyAlert: async (pharmacyId: string, alertId: string) => {
    const response = await api.post(`/emergency-network/pharmacy/${pharmacyId}/alerts/${alertId}/acknowledge`);
    return response.data;
  },
  markPharmacyPreparing: async (pharmacyId: string, alertId: string, assistanceDetails?: string) => {
    const response = await api.post(`/emergency-network/pharmacy/${pharmacyId}/alerts/${alertId}/preparing`, { assistanceDetails });
    return response.data;
  },
  markPharmacyReady: async (pharmacyId: string, alertId: string, assistanceDetails?: string) => {
    const response = await api.post(`/emergency-network/pharmacy/${pharmacyId}/alerts/${alertId}/ready`, { assistanceDetails });
    return response.data;
  },
  rejectPharmacyAlert: async (pharmacyId: string, alertId: string) => {
    const response = await api.post(`/emergency-network/pharmacy/${pharmacyId}/alerts/${alertId}/reject`);
    return response.data;
  },
  escalatePharmacyAlert: async (pharmacyId: string, alertId: string) => {
    const response = await api.post(`/emergency-network/pharmacy/${pharmacyId}/alerts/${alertId}/escalate`);
    return response.data;
  },
  resolvePharmacyAlert: async (pharmacyId: string, alertId: string) => {
    const response = await api.post(`/emergency-network/pharmacy/${pharmacyId}/alerts/${alertId}/resolve`);
    return response.data;
  },
  getPharmacyAIHandoff: async (pharmacyId: string, alertId: string) => {
    const response = await api.get(`/emergency-network/pharmacy/${pharmacyId}/alerts/${alertId}/ai-handoff`);
    return response.data;
  },
  // Citizen: list nearby emergency pharmacies
  getNearbyEmergencyPharmacies: async (lat: number, lng: number, radius?: number) => {
    const response = await api.get('/emergency-network/pharmacy/nearby', { params: { lat, lng, radius } });
    return response.data;
  },
  // Citizen: poll status of all pharmacy alerts for a session
  getSessionPharmacyStatus: async (sessionId: string) => {
    const response = await api.get(`/emergency-network/session/${sessionId}/pharmacy-status`);
    return response.data;
  },
};



// Analytics & simulation endpoints
export const analyticsService = {
  getGeoHeatmap: async (district?: string, disease?: string) => {
    const response = await api.get('/analytics/heatmap', { params: { district, disease } });
    return response.data;
  },
  getOutbreakAnomalies: async () => {
    const response = await api.get('/analytics/anomalies');
    return response.data;
  },
  getKnowledgeGraph: async () => {
    const response = await api.get('/analytics/knowledge-graph');
    return response.data;
  },
  getNews: async () => {
    const response = await api.get('/analytics/news');
    return response.data;
  },
  getResourceInventory: async () => {
    const response = await api.get('/analytics/resources');
    return response.data;
  },
  simulateScenario: async (params: any) => {
    const response = await api.post('/analytics/simulate', params);
    return response.data;
  },
  simulateDigitalTwin: async (params: any) => {
    const response = await api.post('/analytics/digital-twin', params);
    return response.data;
  },
  getScenarios: async () => {
    const response = await api.get('/analytics/scenarios');
    return response.data;
  },
  saveScenario: async (scenario: any) => {
    const response = await api.post('/analytics/scenarios', scenario);
    return response.data;
  },
  deleteScenario: async (id: string) => {
    const response = await api.delete(`/analytics/scenarios/${id}`);
    return response.data;
  },
  acknowledgeAlert: async (alertId: string) => {
    const response = await api.post('/analytics/acknowledge-alert', { alertId });
    return response.data;
  },
};

// Campaigns & Public health education
export const campaignService = {
  getCampaigns: async () => {
    const response = await api.get('/campaigns');
    return response.data;
  },
  createCampaign: async (campaign: any) => {
    const response = await api.post('/campaigns', campaign);
    return response.data;
  },
  generateContent: async (prompt: string, category: string) => {
    const response = await api.post('/campaigns/generate', { prompt, category });
    return response.data;
  },
};

// Report Generation endpoints
export const reportService = {
  generateReport: async (district: string, month: string, format = 'PDF') => {
    const response = await api.post('/reports/generate', { district, month, format });
    return response.data;
  },
  getHistory: async () => {
    const response = await api.get('/reports/history');
    return response.data;
  },
  getTrends: async () => {
    const response = await api.get('/reports/trends');
    return response.data;
  },
  compare: async (currentId: string, previousId: string) => {
    const response = await api.post('/reports/compare', { currentId, previousId });
    return response.data;
  },
  delete: async (id: string) => {
    const response = await api.delete(`/reports/${id}`);
    return response.data;
  },
  getReportById: async (id: string) => {
    const response = await api.get(`/reports/${id}`);
    return response.data;
  },
  getOverallHealthScore: async () => {
    const response = await api.get('/reports/overall-health');
    return response.data;
  },
};

// Doctor Portal specific APIs
export const doctorApiService = {
  getProfile: async () => {
    const response = await api.get('/doctors/profile');
    return response.data;
  },
  updateAvailability: async (availability: string) => {
    const response = await api.post('/doctors/availability', { availability });
    return response.data;
  },
};

// ASHA / Community Health Worker Services
export const workerService = {
  getCitizens: async (query = '') => {
    const response = await api.get('/worker/citizens', { params: { query } });
    return response.data;
  },
  registerCitizen: async (citizen: {
    name: string;
    age: number;
    gender: string;
    village: string;
    phone?: string;
    emergency_contact?: string;
  }) => {
    const response = await api.post('/worker/citizens', citizen);
    return response.data;
  },
  saveScreening: async (screening: any) => {
    const response = await api.post('/worker/screenings', screening);
    return response.data;
  },
  syncScreenings: async (screenings: any[]) => {
    const response = await api.post('/worker/screenings/sync', { screenings });
    return response.data;
  },
  getStats: async () => {
    const response = await api.get('/worker/stats');
    return response.data;
  },
  getCitizenHistory: async (citizenId: string) => {
    const response = await api.get(`/worker/citizen/${citizenId}/history`);
    return response.data;
  },
};

// Officer ASHA Monitoring Services (Read-Only Operations)
export const officerAshaService = {
  getOverview: async () => {
    const response = await api.get('/officer/asha/overview');
    return response.data;
  },
  getWorkers: async () => {
    const response = await api.get('/officer/asha/workers');
    return response.data;
  },
  getScreenings: async (params: {
    workerId?: string;
    riskLevel?: string;
    dateRange?: string;
    search?: string;
    limit?: number;
    offset?: number;
  } = {}) => {
    const response = await api.get('/officer/asha/screenings', { params });
    return response.data;
  },
};

