const { pool } = require('../config/db');

async function getAllSubjects() {
  const [rows] = await pool.query(
    'SELECT subject_id, subject_name, description FROM Subjects ORDER BY subject_id'
  );
  return rows;
}

async function findSubjectById(subjectId) {
  const [rows] = await pool.query(
    'SELECT subject_id, subject_name, description FROM Subjects WHERE subject_id = ? LIMIT 1',
    [subjectId]
  );
  return rows[0] || null;
}

async function findSubjectByName(subjectName) {
  const [rows] = await pool.query(
    'SELECT subject_id, subject_name, description FROM Subjects WHERE subject_name = ? LIMIT 1',
    [subjectName]
  );
  return rows[0] || null;
}

async function createSubject({ subject_name, description }) {
  const existing = await findSubjectByName(subject_name);
  if (existing) {
    return { success: false, error: 'Subject name already exists' };
  }
  const [result] = await pool.query(
    'INSERT INTO Subjects (subject_name, description) VALUES (?, ?)',
    [subject_name, description || null]
  );
  const subject = await findSubjectById(result.insertId);
  return { success: true, subject };
}

async function getTopicsBySubjectId(subjectId) {
  const subject = await findSubjectById(subjectId);
  if (!subject) {
    return { success: false, error: 'Subject not found' };
  }
  const [rows] = await pool.query(
    'SELECT topic_id, subject_id, topic_name, description FROM Topics WHERE subject_id = ? ORDER BY topic_id',
    [subjectId]
  );
  return { success: true, topics: rows };
}

async function findTopicByNameAndSubject(topicName, subjectId) {
  const [rows] = await pool.query(
    'SELECT topic_id, subject_id, topic_name, description FROM Topics WHERE subject_id = ? AND topic_name = ? LIMIT 1',
    [subjectId, topicName]
  );
  return rows[0] || null;
}

async function createTopic(subjectId, { topic_name, description }) {
  const subject = await findSubjectById(subjectId);
  if (!subject) {
    return { success: false, error: 'Subject not found' };
  }
  const existing = await findTopicByNameAndSubject(topic_name, subjectId);
  if (existing) {
    return { success: false, error: 'Topic name already exists in this subject' };
  }
  const [result] = await pool.query(
    'INSERT INTO Topics (subject_id, topic_name, description) VALUES (?, ?, ?)',
    [subjectId, topic_name, description || null]
  );
  const [topicRows] = await pool.query(
    'SELECT topic_id, subject_id, topic_name, description FROM Topics WHERE topic_id = ? LIMIT 1',
    [result.insertId]
  );
  return { success: true, topic: topicRows[0] };
}

module.exports = {
  getAllSubjects,
  findSubjectById,
  createSubject,
  getTopicsBySubjectId,
  createTopic
};
