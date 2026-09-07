const { pool } = require('../config/db');
const { findSubjectById } = require('./subjectService');

const VALID_CORRECT_OPTIONS = ['A', 'B', 'C', 'D'];
const VALID_DIFFICULTIES = ['EASY', 'MEDIUM', 'HARD'];

function stripSensitiveForStudent(question) {
  if (!question) return null;
  const { correct_option, explanation, ...rest } = question;
  return rest;
}

async function findTopicById(topicId) {
  const [rows] = await pool.query(
    'SELECT topic_id, subject_id, topic_name, description FROM Topics WHERE topic_id = ? LIMIT 1',
    [topicId]
  );
  return rows[0] || null;
}

async function findQuestionById(questionId) {
  const [rows] = await pool.query(
    'SELECT question_id, subject_id, topic_id, question_text, option_a, option_b, option_c, option_d, correct_option, difficulty, explanation, created_by, created_at FROM Questions WHERE question_id = ? LIMIT 1',
    [questionId]
  );
  return rows[0] || null;
}

function buildFilterQuery({ subject_id, topic_id, difficulty }) {
  const conditions = [];
  const params = [];
  if (subject_id !== undefined && subject_id !== null && subject_id !== '') {
    const sid = Number(subject_id);
    if (Number.isInteger(sid) && sid > 0) {
      conditions.push('q.subject_id = ?');
      params.push(sid);
    }
  }
  if (topic_id !== undefined && topic_id !== null && topic_id !== '') {
    const tid = Number(topic_id);
    if (Number.isInteger(tid) && tid > 0) {
      conditions.push('q.topic_id = ?');
      params.push(tid);
    }
  }
  if (difficulty !== undefined && difficulty !== null && difficulty !== '') {
    const d = String(difficulty).toUpperCase();
    if (VALID_DIFFICULTIES.includes(d)) {
      conditions.push('q.difficulty = ?');
      params.push(d);
    }
  }
  return { conditions, params };
}

async function getQuestions(filters) {
  const { conditions, params } = buildFilterQuery(filters);
  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const sql = `SELECT q.question_id, q.subject_id, q.topic_id, q.question_text, q.option_a, q.option_b, q.option_c, q.option_d, q.correct_option, q.difficulty, q.explanation, q.created_by, q.created_at, s.subject_name, t.topic_name FROM Questions q LEFT JOIN Subjects s ON q.subject_id = s.subject_id LEFT JOIN Topics t ON q.topic_id = t.topic_id ${whereClause} ORDER BY q.question_id`;
  const [rows] = await pool.query(sql, params);
  return rows;
}

async function validateQuestionRelations({ subject_id, topic_id }) {
  const subject = await findSubjectById(subject_id);
  if (!subject) {
    return { valid: false, error: 'Subject does not exist' };
  }
  const topic = await findTopicById(topic_id);
  if (!topic) {
    return { valid: false, error: 'Topic does not exist' };
  }
  if (topic.subject_id !== subject_id) {
    return { valid: false, error: 'Topic does not belong to the selected subject' };
  }
  return { valid: true, subject, topic };
}

async function createQuestion({
  subject_id,
  topic_id,
  question_text,
  option_a,
  option_b,
  option_c,
  option_d,
  correct_option,
  difficulty,
  explanation,
  created_by
}) {
  const relationCheck = await validateQuestionRelations({ subject_id, topic_id });
  if (!relationCheck.valid) {
    return { success: false, error: relationCheck.error };
  }
  if (!VALID_CORRECT_OPTIONS.includes(correct_option)) {
    return { success: false, error: 'correct_option must be A, B, C, or D' };
  }
  if (!VALID_DIFFICULTIES.includes(difficulty)) {
    return { success: false, error: 'difficulty must be EASY, MEDIUM, or HARD' };
  }
  const [result] = await pool.query(
    `INSERT INTO Questions (subject_id, topic_id, question_text, option_a, option_b, option_c, option_d, correct_option, difficulty, explanation, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      subject_id,
      topic_id,
      question_text,
      option_a,
      option_b,
      option_c,
      option_d,
      correct_option,
      difficulty,
      explanation || null,
      created_by
    ]
  );
  const question = await findQuestionById(result.insertId);
  return { success: true, question };
}

async function updateQuestion(questionId, updates) {
  const existing = await findQuestionById(questionId);
  if (!existing) {
    return { success: false, error: 'Question not found', status: 404 };
  }

  const finalData = { ...existing, ...updates };

  if (updates.subject_id !== undefined || updates.topic_id !== undefined) {
    const relationCheck = await validateQuestionRelations({
      subject_id: finalData.subject_id,
      topic_id: finalData.topic_id
    });
    if (!relationCheck.valid) {
      return { success: false, error: relationCheck.error, status: 400 };
    }
  }

  if (updates.correct_option !== undefined && !VALID_CORRECT_OPTIONS.includes(updates.correct_option)) {
    return { success: false, error: 'correct_option must be A, B, C, or D', status: 400 };
  }

  if (updates.difficulty !== undefined && !VALID_DIFFICULTIES.includes(updates.difficulty)) {
    return { success: false, error: 'difficulty must be EASY, MEDIUM, or HARD', status: 400 };
  }

  const fields = [];
  const params = [];

  const updatableFields = [
    'subject_id', 'topic_id', 'question_text',
    'option_a', 'option_b', 'option_c', 'option_d',
    'correct_option', 'difficulty', 'explanation'
  ];

  for (const field of updatableFields) {
    if (updates.hasOwnProperty(field)) {
      fields.push(`${field} = ?`);
      params.push(updates[field] === '' ? null : updates[field]);
    }
  }

  if (fields.length === 0) {
    return { success: true, question: existing };
  }

  params.push(questionId);
  const sql = `UPDATE Questions SET ${fields.join(', ')} WHERE question_id = ?`;
  await pool.query(sql, params);

  const updated = await findQuestionById(questionId);
  return { success: true, question: updated };
}

async function deleteQuestion(questionId) {
  const existing = await findQuestionById(questionId);
  if (!existing) {
    return { success: false, error: 'Question not found' };
  }
  await pool.query('DELETE FROM Questions WHERE question_id = ?', [questionId]);
  return { success: true, question_id: questionId };
}

module.exports = {
  VALID_CORRECT_OPTIONS,
  VALID_DIFFICULTIES,
  stripSensitiveForStudent,
  getQuestions,
  findQuestionById,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  validateQuestionRelations
};
