import api from '../api/client';

export async function getSubjects() {
  const response = await api.get('/subjects');
  return response?.data?.data?.subjects || [];
}

export async function createSubject(payload) {
  const response = await api.post('/subjects', payload);
  return response?.data?.data?.subject || null;
}

export async function getTopicsBySubject(subjectId) {
  const response = await api.get(`/subjects/${subjectId}/topics`);
  return response?.data?.data?.topics || [];
}

export async function createTopic(subjectId, payload) {
  const response = await api.post(`/subjects/${subjectId}/topics`, payload);
  return response?.data?.data?.topic || null;
}

export async function getQuestions(filters = {}) {
  const params = new URLSearchParams();

  if (filters.subject_id !== undefined && filters.subject_id !== null && filters.subject_id !== '') {
    params.set('subject_id', String(filters.subject_id));
  }

  if (filters.topic_id !== undefined && filters.topic_id !== null && filters.topic_id !== '') {
    params.set('topic_id', String(filters.topic_id));
  }

  if (filters.difficulty !== undefined && filters.difficulty !== null && filters.difficulty !== '') {
    params.set('difficulty', String(filters.difficulty));
  }

  const queryString = params.toString();
  const response = await api.get(`/questions${queryString ? `?${queryString}` : ''}`);
  return response?.data?.data?.questions || [];
}

export async function getQuestionById(questionId) {
  const response = await api.get(`/questions/${questionId}`);
  return response?.data?.data?.question || null;
}

export async function createQuestion(payload) {
  const response = await api.post('/questions', payload);
  return response?.data?.data?.question || null;
}

export async function updateQuestion(questionId, payload) {
  const response = await api.put(`/questions/${questionId}`, payload);
  return response?.data?.data?.question || null;
}

export async function deleteQuestion(questionId) {
  const response = await api.delete(`/questions/${questionId}`);
  return response?.data?.data || {};
}
