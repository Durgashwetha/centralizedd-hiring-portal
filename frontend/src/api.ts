import axios from 'axios';

const API_BASE = '/api/v1';

export const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('cq_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authAPI = {
  login: async (formData: FormData) => {
    const res = await axios.post(`${API_BASE}/auth/login`, formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    return res.data;
  },
  register: async (data: any) => {
    const res = await api.post('/auth/register', data);
    return res.data;
  },
  getMe: async () => {
    const res = await api.get('/auth/me');
    return res.data;
  },
  requestResetKey: async (email: string) => {
    const res = await api.post('/auth/forgot-password/request-key', { email });
    return res.data;
  },
  resetPassword: async (data: { email: string; reset_key: string; new_password: string }) => {
    const res = await api.post('/auth/forgot-password/reset-password', data);
    return res.data;
  },
};

export const studentAPI = {
  getProfile: async () => {
    const res = await api.get('/student/profile');
    return res.data;
  },
  updateProfile: async (data: any) => {
    const res = await api.put('/student/profile', data);
    return res.data;
  },
  uploadResume: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post('/student/resume-upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },
  uploadAvatar: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post('/student/avatar-upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },
  getExplainPredict: async () => {
    const res = await api.get('/student/explain-predict');
    return res.data;
  },
  getSkillGap: async (jobDescription: string) => {
    const res = await api.post('/student/skill-gap', { job_description: jobDescription });
    return res.data;
  },
  chatMentor: async (message: string, chatHistory: any[]) => {
    const res = await api.post('/student/chat-mentor', { message, chat_history: chatHistory });
    return res.data;
  },
  getMockQuestion: async (role: string, topic: string, turn: number) => {
    const res = await api.post(`/student/mock-interview/question?role=${encodeURIComponent(role)}&topic=${encodeURIComponent(topic)}&turn=${turn}`);
    return res.data;
  },
  submitMockAnswer: async (question: string, answer: string) => {
    const res = await api.post('/student/mock-interview/answer', { question, answer });
    return res.data;
  },
  saveMockScore: async (score: number, mockType: string, exitedMid: boolean = false) => {
    const res = await api.post('/student/mock-interview/score', { score, mock_type: mockType, exited_mid: exitedMid });
    return res.data;
  },
  getJobs: async () => {
    const res = await api.get('/student/jobs');
    return res.data;
  },
  getRoleRecommendations: async () => {
    const res = await api.get('/student/role-recommendations');
    return res.data;
  },
  getMyApplications: async () => {
    const res = await api.get('/student/my-applications');
    return res.data;
  },
  applyJob: async (jobId: number) => {
    const res = await api.post(`/student/apply/${jobId}`);
    return res.data;
  },
};

export const adminAPI = {
  getStudents: async () => {
    const res = await api.get('/admin/students');
    return res.data;
  },
  createStudent: async (formData: FormData) => {
    const res = await api.post('/admin/create-student', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },
  getAnalytics: async () => {
    const res = await api.get('/admin/analytics');
    return res.data;
  },
  getLivePlacementFeed: async () => {
    const res = await api.get('/admin/live-placement-feed');
    return res.data;
  },
  getSkillDemandTrends: async () => {
    const res = await api.get('/admin/skill-demand-trends');
    return res.data;
  },
  generateDriveReport: async () => {
    const res = await api.post('/admin/generate-drive-report');
    return res.data;
  },
  getCandidate360Breakdown: async (profileId: number) => {
    const res = await api.post(`/admin/candidate-ai-breakdown/${profileId}`);
    return res.data;
  },
  getPendingRequests: async () => {
    const res = await api.get('/admin/pending-requests');
    return res.data;
  },
  getRejectedRequests: async () => {
    const res = await api.get('/admin/rejected-requests');
    return res.data;
  },
  approveRequest: async (userId: number) => {
    const res = await api.post(`/admin/approve-request/${userId}`);
    return res.data;
  },
  rejectRequest: async (userId: number) => {
    const res = await api.post(`/admin/reject-request/${userId}`);
    return res.data;
  },
  releaseHold: async (userId: number) => {
    const res = await api.post(`/admin/release-hold/${userId}`);
    return res.data;
  },
  getPendingJobDrives: async () => {
    const res = await api.get('/admin/pending-job-drives');
    return res.data;
  },
  getActiveJobDrives: async () => {
    const res = await api.get('/admin/active-job-drives');
    return res.data;
  },
  getJobApplications: async (jobId: number) => {
    const res = await api.get(`/admin/job-applications/${jobId}`);
    return res.data;
  },
  approveJobDrive: async (jobId: number) => {
    const res = await api.post(`/admin/approve-job-drive/${jobId}`);
    return res.data;
  },
  rejectJobDrive: async (jobId: number) => {
    const res = await api.post(`/admin/reject-job-drive/${jobId}`);
    return res.data;
  },
  closeJobDrive: async (jobId: number) => {
    const res = await api.post(`/admin/close-job-drive/${jobId}`);
    return res.data;
  },
  exportStudentsCSV: async () => {
    const res = await api.get('/admin/export-students-csv', { responseType: 'blob' });
    return res;
  },
  deleteStudent: async (studentId: number) => {
    const res = await api.delete(`/admin/delete-student/${studentId}`);
    return res.data;
  },
};

export const recruiterAPI = {
  getMyPostedJobs: async () => {
    const res = await api.get('/recruiter/my-posted-jobs');
    return res.data;
  },
  postJob: async (data: any) => {
    const res = await api.post('/recruiter/post-job', data);
    return res.data;
  },
  closeJobDrive: async (jobId: number) => {
    const res = await api.post(`/recruiter/close-job-drive/${jobId}`);
    return res.data;
  },
  getApplications: async (jobId: number) => {
    const res = await api.get(`/recruiter/applications/${jobId}`);
    return res.data;
  },
  updateApplicationStatus: async (applicationId: number, status: string) => {
    const res = await api.put('/recruiter/application-status', { application_id: applicationId, status });
    return res.data;
  },
  generateQuestions: async (jobDescription: string) => {
    const res = await api.post('/recruiter/generate-questions', { job_description: jobDescription });
    return res.data;
  },
  structureNotes: async (candidateName: string, roleTitle: string, rawNotes: string) => {
    const res = await api.post('/recruiter/structure-notes', {
      candidate_name: candidateName,
      role_title: roleTitle,
      raw_notes: rawNotes,
    });
    return res.data;
  },
  getCandidate360Breakdown: async (studentId: number) => {
    const res = await api.post(`/admin/candidate-ai-breakdown/${studentId}`);
    return res.data;
  },
  getStudents: async () => {
    const res = await api.get('/admin/students');
    return res.data;
  },
  exportStudentsCSV: async () => {
    const res = await api.get('/admin/export-students-csv', { responseType: 'blob' });
    return res;
  },
  compareCandidates: async (data: { student_a_id: number; student_b_id: number; job_id?: number }) => {
    const res = await api.post('/recruiter/compare-candidates', data);
    return res.data;
  },
  bulkUpdateStatus: async (data: { application_ids: number[]; status: string; send_interview_email?: boolean }) => {
    const res = await api.post('/recruiter/bulk-update-status', data);
    return res.data;
  },
  scheduleInterview: async (data: { student_id: number; job_id?: number; scheduled_at: string; notes?: string }) => {
    const res = await api.post('/recruiter/schedule-interview', data);
    return res.data;
  },
  getRecruiterInterviewRequests: async () => {
    const res = await api.get('/recruiter/interview-requests');
    return res.data;
  },
};

export const interviewAPI = {
  getStudentRequests: async () => {
    const res = await api.get('/student/interview-requests');
    return res.data;
  },
  getAdminRequests: async () => {
    const res = await api.get('/admin/interview-requests');
    return res.data;
  },
  respondRequest: async (data: { interview_id: number; decision: string } | number, decision?: string) => {
    const payload = typeof data === 'number' 
      ? { interview_id: data, decision: decision || 'Accepted' } 
      : data;
    const res = await api.post('/student/respond-interview', payload);
    return res.data;
  },
  submitAINotes: async (data: { interview_id: number; notes_transcript: string } | number, notesTranscript?: string) => {
    const payload = typeof data === 'number'
      ? { interview_id: data, notes_transcript: notesTranscript || '' }
      : data;
    const res = await api.post('/interview/submit-ai-notes', payload);
    return res.data;
  },
};
