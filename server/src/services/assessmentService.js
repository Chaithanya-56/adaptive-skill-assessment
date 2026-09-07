const { pool } = require('../config/db');
const { findSubjectById } = require('./subjectService');
const { buildTopicPerformanceRows } = require('./recommendationService');

const VALID_OPTIONS = ['A', 'B', 'C', 'D'];
const DIFFICULTIES = ['EASY', 'MEDIUM', 'HARD'];
const INITIAL_DIFFICULTY = 'MEDIUM';
const DEFAULT_TOTAL_QUESTIONS = 10;
const MIN_TOTAL_QUESTIONS = 1;
const MAX_TOTAL_QUESTIONS = 50;

function sanitizeQuestion(q) {
  if (!q) return null;
  const { correct_option, explanation, created_by, ...rest } = q;
  return rest;
}

function difficultyIndex(d) {
  return DIFFICULTIES.indexOf(d);
}

function adjustDifficulty(current, isCorrect) {
  let idx = difficultyIndex(current);
  if (idx < 0) idx = 1;
  if (isCorrect) {
    idx = Math.min(idx + 1, DIFFICULTIES.length - 1);
  } else {
    idx = Math.max(idx - 1, 0);
  }
  return DIFFICULTIES[idx];
}

function computeLevel(percentage) {
  if (percentage < 40) return 'BEGINNER';
  if (percentage <= 69) return 'INTERMEDIATE';
  return 'ADVANCED';
}

function computePerformanceLevel(percentage) {
  if (percentage < 40) return 'WEAK';
  if (percentage <= 69) return 'AVERAGE';
  return 'STRONG';
}

async function loadAssessmentById(assessmentId) {
  const [rows] = await pool.query(
    'SELECT assessment_id, user_id, subject_id, started_at, submitted_at, status, total_questions, score, percentage, assessment_level FROM Assessments WHERE assessment_id = ? LIMIT 1',
    [assessmentId]
  );
  return rows[0] || null;
}

async function loadAssessmentByIdTx(conn, assessmentId) {
  const [rows] = await conn.query(
    'SELECT assessment_id, user_id, subject_id, started_at, submitted_at, status, total_questions, score, percentage, assessment_level FROM Assessments WHERE assessment_id = ? LIMIT 1',
    [assessmentId]
  );
  return rows[0] || null;
}

async function getAnsweredQuestionIds(assessmentId) {
  const [rows] = await pool.query(
    'SELECT question_id FROM UserAnswers WHERE assessment_id = ?',
    [assessmentId]
  );
  return rows.map(r => r.question_id);
}

async function getAnswerCounts(assessmentId) {
  const [rows] = await pool.query(
    `SELECT
       COUNT(*) AS total,
       SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) AS correct_count
     FROM UserAnswers WHERE assessment_id = ?`,
    [assessmentId]
  );
  const r = rows[0];
  return { answered: Number(r.total || 0), correct: Number(r.correct_count || 0) };
}

async function selectQuestionsForSubject(subjectId, totalQuestions, excludeIds = []) {
  const easyTarget = Math.ceil(totalQuestions * 0.5);
  const mediumTarget = totalQuestions - easyTarget;

  const selected = [];
  const selectedIds = new Set(excludeIds);

  const [easyRows] = await pool.query(
    `SELECT question_id, subject_id, topic_id, question_text, option_a, option_b, option_c, option_d, correct_option, difficulty, explanation, created_by, created_at
     FROM Questions WHERE subject_id = ? AND difficulty = 'EASY' ORDER BY RAND() LIMIT ?`,
    [subjectId, easyTarget]
  );
  for (const q of easyRows) {
    if (!selectedIds.has(q.question_id)) {
      selected.push(q);
      selectedIds.add(q.question_id);
    }
  }

  const easyShortfall = easyTarget - selected.filter(q => q.difficulty === 'EASY').length;
  const effectiveMediumTarget = mediumTarget + easyShortfall;

  const mediumPlaceholders = Array.from(selectedIds).map(() => '?').join(', ');
  const mediumParams = [subjectId, ...selectedIds, effectiveMediumTarget];
  const mediumSql = `SELECT question_id, subject_id, topic_id, question_text, option_a, option_b, option_c, option_d, correct_option, difficulty, explanation, created_by, created_at
                      FROM Questions WHERE subject_id = ? AND difficulty = 'MEDIUM' ${selectedIds.size > 0 ? `AND question_id NOT IN (${mediumPlaceholders})` : ''}
                      ORDER BY RAND() LIMIT ?`;
  const [mediumRows] = await pool.query(mediumSql, mediumParams);
  for (const q of mediumRows) {
    if (!selectedIds.has(q.question_id)) {
      selected.push(q);
      selectedIds.add(q.question_id);
    }
  }

  if (selected.length < totalQuestions) {
    const remaining = totalQuestions - selected.length;
    const allPlaceholders = Array.from(selectedIds).map(() => '?').join(', ');
    const allParams = [subjectId, ...selectedIds, remaining];
    const anySql = `SELECT question_id, subject_id, topic_id, question_text, option_a, option_b, option_c, option_d, correct_option, difficulty, explanation, created_by, created_at
                    FROM Questions WHERE subject_id = ? ${selectedIds.size > 0 ? `AND question_id NOT IN (${allPlaceholders})` : ''}
                    ORDER BY RAND() LIMIT ?`;
    const [anyRows] = await pool.query(anySql, allParams);
    for (const q of anyRows) {
      if (!selectedIds.has(q.question_id)) {
        selected.push(q);
        selectedIds.add(q.question_id);
      }
    }
  }

  return selected;
}

async function selectNextQuestion(subjectId, answeredIds, targetDifficulty) {
  if (answeredIds.length === 0) {
    const [rows] = await pool.query(
      `SELECT question_id, subject_id, topic_id, question_text, option_a, option_b, option_c, option_d, correct_option, difficulty, explanation, created_by, created_at
       FROM Questions WHERE subject_id = ? AND difficulty = ? ORDER BY RAND() LIMIT 1`,
      [subjectId, targetDifficulty]
    );
    if (rows.length > 0) return rows[0];
  }

  const placeholders = answeredIds.map(() => '?').join(', ');
  const params = [subjectId, ...answeredIds];

  const diffOrderPreference = [];
  const ti = difficultyIndex(targetDifficulty);
  diffOrderPreference.push(targetDifficulty);
  if (ti >= 0) {
    for (let offset = 1; offset < DIFFICULTIES.length; offset++) {
      if (ti + offset < DIFFICULTIES.length) diffOrderPreference.push(DIFFICULTIES[ti + offset]);
      if (ti - offset >= 0) diffOrderPreference.push(DIFFICULTIES[ti - offset]);
    }
  }
  const seen = new Set();
  const ordered = diffOrderPreference.filter(d => !seen.has(d) && seen.add(d));

  for (const diff of ordered) {
    const sql = `SELECT question_id, subject_id, topic_id, question_text, option_a, option_b, option_c, option_d, correct_option, difficulty, explanation, created_by, created_at
                 FROM Questions WHERE subject_id = ? AND difficulty = ? AND question_id NOT IN (${placeholders})
                 ORDER BY RAND() LIMIT 1`;
    const [rows] = await pool.query(sql, [subjectId, diff, ...answeredIds]);
    if (rows.length > 0) return rows[0];
  }

  const anySql = `SELECT question_id, subject_id, topic_id, question_text, option_a, option_b, option_c, option_d, correct_option, difficulty, explanation, created_by, created_at
                  FROM Questions WHERE subject_id = ? AND question_id NOT IN (${placeholders})
                  ORDER BY RAND() LIMIT 1`;
  const [anyRows] = await pool.query(anySql, params);
  return anyRows[0] || null;
}

async function getCurrentDifficulty(assessmentId) {
  const [rows] = await pool.query(
    `SELECT q.difficulty, ua.is_correct
     FROM UserAnswers ua JOIN Questions q ON ua.question_id = q.question_id
     WHERE ua.assessment_id = ?
     ORDER BY ua.answer_id DESC
     LIMIT 1`,
    [assessmentId]
  );
  if (rows.length === 0) return INITIAL_DIFFICULTY;
  const last = rows[0];
  return adjustDifficulty(last.difficulty, !!last.is_correct);
}

async function getAssessment(userId, assessmentId) {
  const assessment = await loadAssessmentById(assessmentId);
  if (!assessment) {
    return { success: false, error: 'Assessment not found', status: 404 };
  }
  if (assessment.user_id !== userId) {
    return { success: false, error: 'Access denied: this assessment does not belong to you', status: 403 };
  }

  const questions = await selectQuestionsForSubject(
    assessment.subject_id,
    assessment.total_questions,
    []
  );
  const sanitizedQuestions = questions.map(sanitizeQuestion);
  const counts = await getAnswerCounts(assessmentId);

  return {
    success: true,
    assessment,
    questions: sanitizedQuestions,
    progress: { answered: counts.answered, total: assessment.total_questions, correct: counts.correct }
  };
}

async function startAssessment(userId, subjectId, totalQuestions) {
  const subject = await findSubjectById(subjectId);
  if (!subject) {
    return { success: false, error: 'Subject does not exist', status: 400 };
  }

  let effectiveTotal = DEFAULT_TOTAL_QUESTIONS;
  if (totalQuestions !== undefined && totalQuestions !== null && totalQuestions !== '') {
    const n = Number(totalQuestions);
    if (!Number.isInteger(n) || n < MIN_TOTAL_QUESTIONS || n > MAX_TOTAL_QUESTIONS) {
      return {
        success: false,
        error: `total_questions must be an integer between ${MIN_TOTAL_QUESTIONS} and ${MAX_TOTAL_QUESTIONS}`,
        status: 400
      };
    }
    effectiveTotal = n;
  }

  const [existingRows] = await pool.query(
    `SELECT assessment_id FROM Assessments WHERE user_id = ? AND subject_id = ? AND status = 'IN_PROGRESS' LIMIT 1`,
    [userId, subjectId]
  );
  if (existingRows.length > 0) {
    return { success: false, error: 'An in-progress assessment already exists for this subject', status: 409 };
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [insertRes] = await conn.query(
      `INSERT INTO Assessments (user_id, subject_id, started_at, status, total_questions, score, percentage, assessment_level)
       VALUES (?, ?, NOW(), 'IN_PROGRESS', ?, 0, 0.00, NULL)`,
      [userId, subjectId, effectiveTotal]
    );
    const assessmentId = insertRes.insertId;

    const questions = await selectQuestionsForSubject(subjectId, effectiveTotal, []);
    const firstQ = questions[0] || null;

    const assessment = await loadAssessmentByIdTx(conn, assessmentId);
    await conn.commit();

    const sanitizedQuestions = questions.map(sanitizeQuestion);

    return {
      success: true,
      assessment,
      questions: sanitizedQuestions,
      progress: { answered: 0, total: effectiveTotal },
      next_question: firstQ ? sanitizeQuestion(firstQ) : null,
      has_more_questions: sanitizedQuestions.length > 0
    };
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}

async function answerQuestion(userId, assessmentId, { question_id, selected_option, time_taken_seconds }) {
  const assessment = await loadAssessmentById(assessmentId);
  if (!assessment) {
    return { success: false, error: 'Assessment not found', status: 404 };
  }
  if (assessment.user_id !== userId) {
    return { success: false, error: 'Access denied: this assessment does not belong to you', status: 403 };
  }
  if (assessment.status !== 'IN_PROGRESS') {
    return { success: false, error: 'Assessment is not in progress', status: 409 };
  }

  const selected = String(selected_option || '').toUpperCase();
  if (!VALID_OPTIONS.includes(selected)) {
    return { success: false, error: 'selected_option must be one of: A, B, C, D', status: 400 };
  }
  const qid = Number(question_id);
  if (!Number.isInteger(qid) || qid <= 0) {
    return { success: false, error: 'question_id must be a positive integer', status: 400 };
  }
  if (time_taken_seconds !== undefined && time_taken_seconds !== null && time_taken_seconds !== '') {
    const tts = Number(time_taken_seconds);
    if (!Number.isFinite(tts) || tts < 0 || !Number.isInteger(tts)) {
      return { success: false, error: 'time_taken_seconds must be a non-negative integer', status: 400 };
    }
  }

  const [questionRows] = await pool.query(
    `SELECT question_id, subject_id, topic_id, correct_option, difficulty FROM Questions WHERE question_id = ? LIMIT 1`,
    [qid]
  );
  const question = questionRows[0];
  if (!question) {
    return { success: false, error: 'Question does not exist', status: 400 };
  }
  if (question.subject_id !== assessment.subject_id) {
    return { success: false, error: 'Question does not belong to the assessment subject', status: 400 };
  }

  const [existingAnswer] = await pool.query(
    'SELECT answer_id FROM UserAnswers WHERE assessment_id = ? AND question_id = ? LIMIT 1',
    [assessmentId, qid]
  );
  if (existingAnswer.length > 0) {
    return { success: false, error: 'This question has already been answered in this assessment', status: 409 };
  }

  const is_correct = (question.correct_option === selected) ? 1 : 0;
  const tts = (time_taken_seconds === undefined || time_taken_seconds === null || time_taken_seconds === '')
    ? null
    : Number(time_taken_seconds);

  await pool.query(
    `INSERT INTO UserAnswers (assessment_id, question_id, selected_option, is_correct, time_taken_seconds)
     VALUES (?, ?, ?, ?, ?)`,
    [assessmentId, qid, selected, is_correct, tts]
  );

  const nextTargetDiff = adjustDifficulty(question.difficulty, !!is_correct);
  const answeredIds = await getAnsweredQuestionIds(assessmentId);
  const counts = await getAnswerCounts(assessmentId);
  const reachedTarget = counts.answered >= assessment.total_questions;
  let nextQuestion = null;
  if (!reachedTarget) {
    nextQuestion = await selectNextQuestion(assessment.subject_id, answeredIds, nextTargetDiff);
  }

  const has_more_questions = !reachedTarget && !!nextQuestion;
  return {
    success: true,
    progress: { answered: counts.answered, total: assessment.total_questions, correct: counts.correct },
    next_difficulty: nextTargetDiff,
    has_more_questions,
    next_question: nextQuestion ? sanitizeQuestion(nextQuestion) : null
  };
}

async function submitAssessment(userId, assessmentId) {
  const assessment = await loadAssessmentById(assessmentId);
  if (!assessment) {
    return { success: false, error: 'Assessment not found', status: 404 };
  }
  if (assessment.user_id !== userId) {
    return { success: false, error: 'Access denied: this assessment does not belong to you', status: 403 };
  }
  if (assessment.status !== 'IN_PROGRESS') {
    return { success: false, error: 'Assessment is not in progress', status: 409 };
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [answerRows] = await conn.query(
      `SELECT ua.question_id, ua.selected_option, ua.is_correct, ua.time_taken_seconds,
              q.topic_id, t.topic_name, q.difficulty, q.question_text,
              q.option_a, q.option_b, q.option_c, q.option_d,
              q.correct_option, q.explanation
       FROM UserAnswers ua
       JOIN Questions q ON ua.question_id = q.question_id
       LEFT JOIN Topics t ON q.topic_id = t.topic_id
       WHERE ua.assessment_id = ?
       ORDER BY ua.answer_id ASC`,
      [assessmentId]
    );
    const answered = answerRows.length;
    const correct = answerRows.filter(r => r.is_correct).length;
    const percentage = answered === 0 ? 0 : Number(((correct / answered) * 100).toFixed(2));
    const level = computeLevel(percentage);

    await conn.query(
      `UPDATE Assessments
       SET submitted_at = NOW(), status = 'COMPLETED', total_questions = ?, score = ?, percentage = ?, assessment_level = ?
       WHERE assessment_id = ?`,
      [answered, correct, percentage, level, assessmentId]
    );

    const topicRows = await buildTopicPerformanceRows(assessmentId, userId, answerRows);
    for (const row of topicRows) {
      await conn.query(
        'INSERT INTO TopicPerformance (assessment_id, topic_id, correct_count, wrong_count, percentage, performance_level) VALUES (?, ?, ?, ?, ?, ?)',
        [row.assessment_id, row.topic_id, row.correct_count, row.wrong_count, row.percentage, row.performance_level]
      );
    }

    const recommendations = [];
    for (const t of topicRows) {
      let priority = null;
      let templateLevel = null;
      if (t.performance_level === 'WEAK') {
        priority = 'HIGH';
        templateLevel = 'WEAK';
      } else if (t.performance_level === 'AVERAGE') {
        priority = 'MEDIUM';
        templateLevel = 'AVERAGE';
      }
      if (!priority) continue;
      const text = deterministicRecommendation(templateLevel, t.topic_name || `topic ${t.topic_id}`);
      const [result] = await conn.query(
        'INSERT INTO Recommendations (assessment_id, user_id, topic_id, recommendation_text, priority_level) VALUES (?, ?, ?, ?, ?)',
        [assessmentId, userId, t.topic_id, text, priority]
      );
      recommendations.push({
        recommendation_id: result.insertId,
        topic_id: t.topic_id,
        topic_name: t.topic_name,
        performance_level: t.performance_level,
        recommendation_text: text,
        priority_level: priority
      });
    }

    const [finalRows] = await conn.query(
      'SELECT assessment_id, user_id, subject_id, started_at, submitted_at, status, total_questions, score, percentage, assessment_level FROM Assessments WHERE assessment_id = ? LIMIT 1',
      [assessmentId]
    );
    await conn.commit();
    return {
      success: true,
      assessment: finalRows[0],
      answers: answerRows,
      topic_performance: topicRows,
      recommendations
    };
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}

function deterministicRecommendation(level, topicName) {
  const templates = {
    WEAK: [
      `Strengthen the basics of ${topicName} with introductory tutorials and worked examples. Review definitions, core components, and simple practice problems before advancing.`,
      `For ${topicName}, go back to fundamentals. Draw concept maps, study from beginner resources, and attempt low-difficulty questions until you consistently get them right.`,
      `${topicName} performance indicates foundational gaps. Dedicate focused study time using beginner-level material, flashcards for terminology, and step-by-step walkthroughs.`
    ],
    AVERAGE: [
      `Solidify your understanding of ${topicName} by practicing a mix of medium-difficulty questions and reviewing the edge cases you missed.`,
      `For ${topicName}, move into applied practice: attempt scenario-based questions, compare related concepts, and time yourself to build confidence.`,
      `${topicName} knowledge is developing. Target medium-level drills and revisit any subtopics that feel shaky, then review explanations after each attempt.`
    ]
  };
  const arr = templates[level] || [];
  if (arr.length === 0) return `Review ${topicName}.`;
  const idx = Math.abs(
    topicName.split('').reduce((acc, ch, i) => acc + ch.charCodeAt(0) * (i + 1), 0)
  ) % arr.length;
  return arr[idx];
}

async function getAssessmentResult(userId, assessmentId) {
  const assessment = await loadAssessmentById(assessmentId);
  if (!assessment) {
    return { success: false, error: 'Assessment not found', status: 404 };
  }
  if (assessment.user_id !== userId) {
    return { success: false, error: 'Access denied: this assessment does not belong to you', status: 403 };
  }
  if (assessment.status !== 'COMPLETED') {
    return { success: false, error: 'Assessment is not yet completed', status: 409 };
  }

  const [answerRows] = await pool.query(
    `SELECT ua.question_id, ua.selected_option, ua.is_correct, ua.time_taken_seconds,
            q.topic_id, t.topic_name, q.difficulty, q.question_text,
            q.option_a, q.option_b, q.option_c, q.option_d,
            q.correct_option, q.explanation
     FROM UserAnswers ua
     JOIN Questions q ON ua.question_id = q.question_id
     LEFT JOIN Topics t ON q.topic_id = t.topic_id
     WHERE ua.assessment_id = ?
     ORDER BY ua.answer_id ASC`,
    [assessmentId]
  );
  const [tpRows] = await pool.query(
    `SELECT tp.topic_performance_id, tp.topic_id, t.topic_name, tp.correct_count, tp.wrong_count, tp.percentage, tp.performance_level
     FROM TopicPerformance tp LEFT JOIN Topics t ON tp.topic_id = t.topic_id
     WHERE tp.assessment_id = ? ORDER BY tp.topic_performance_id ASC`,
    [assessmentId]
  );
  const [recRows] = await pool.query(
    `SELECT r.recommendation_id, r.topic_id, t.topic_name, r.recommendation_text, r.priority_level, r.created_at
     FROM Recommendations r LEFT JOIN Topics t ON r.topic_id = t.topic_id
     WHERE r.assessment_id = ? ORDER BY FIELD(r.priority_level, 'HIGH', 'MEDIUM', 'LOW'), r.recommendation_id ASC`,
    [assessmentId]
  );
  return {
    success: true,
    assessment,
    answers: answerRows,
    topic_performance: tpRows,
    recommendations: recRows
  };
}

module.exports = {
  startAssessment,
  getAssessment,
  answerQuestion,
  submitAssessment,
  getAssessmentResult,
  loadAssessmentById,
  VALID_OPTIONS,
  DEFAULT_TOTAL_QUESTIONS,
  MIN_TOTAL_QUESTIONS,
  MAX_TOTAL_QUESTIONS,
  sanitizeQuestion,
  computeLevel,
  computePerformanceLevel
};
