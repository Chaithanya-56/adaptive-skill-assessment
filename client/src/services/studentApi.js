import api from '../api/client';

export async function getSubjects() {
  const response = await api.get('/subjects');
  return response?.data?.data?.subjects || [];
}

export async function getSubjectTopics(subjectId) {
  const response = await api.get(`/subjects/${subjectId}/topics`);
  return response?.data?.data?.topics || [];
}

export async function startAssessment(subjectId, totalQuestions) {
  const payload = { subject_id: subjectId };

  if (typeof totalQuestions === 'number' && Number.isFinite(totalQuestions) && totalQuestions > 0) {
    payload.total_questions = totalQuestions;
  }

  const response = await api.post('/assessments/start', payload);
  return response?.data?.data || {};
}

export async function getAssessment(assessmentId) {
  const response = await api.get(`/assessments/${assessmentId}`);
  return response?.data?.data || {};
}

export async function submitAnswer(assessmentId, payload) {
  const response = await api.post(`/assessments/${assessmentId}/answers`, payload);
  return response?.data?.data || {};
}

export async function submitAssessment(assessmentId) {
  const response = await api.post(`/assessments/${assessmentId}/submit`);
  return response?.data?.data || {};
}

export async function getAssessmentResults(assessmentId) {
  const response = await api.get(`/assessments/${assessmentId}/results`);
  return response?.data?.data || {};
}

export async function getStudentAssessments() {
  const response = await api.get('/assessments');
  return response?.data?.data?.assessments || [];
}

export async function getStudentRecommendations() {
  const response = await api.get('/recommendations');
  return response?.data?.data?.recommendations || [];
}

export async function getLearningSummary() {
  const response = await api.get('/recommendations/learning-summary');
  return response?.data?.data || {};
}
