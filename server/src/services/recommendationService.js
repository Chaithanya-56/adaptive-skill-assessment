const { pool } = require('../config/db');

const PRIORITY_BY_LEVEL = {
  WEAK: 'HIGH',
  AVERAGE: 'MEDIUM',
  STRONG: 'LOW'
};

const RECOMMENDATION_TEMPLATES = {
  WEAK: [
    (topic) => `You are weak in ${topic}. Revise the fundamental concepts, practice ${topic.toLowerCase()} basics, and solve more beginner-level questions.`,
    (topic) => `You are weak in ${topic}. Review the core ideas, practice the essential patterns, and work through more foundational exercises.`,
    (topic) => `You are weak in ${topic}. Go back to the basics, focus on the concept-building steps, and complete more guided practice questions.`
  ],
  AVERAGE: [
    (topic) => `You are average in ${topic}. Improve your understanding by practicing weak sub-concepts and solving additional medium-difficulty problems.`,
    (topic) => `You are average in ${topic}. Strengthen the areas you missed, review explanations carefully, and apply the concept through more practice.`,
    (topic) => `You are average in ${topic}. Revisit the tricky parts, work on scenario-based questions, and continue practicing until your confidence improves.`
  ],
  STRONG: [
    (topic) => `You are strong in ${topic}. Maintain your knowledge by practicing advanced problems and moving to more difficult questions.`,
    (topic) => `You are strong in ${topic}. Keep building on the concepts, challenge yourself with higher-level exercises, and refine your speed and accuracy.`,
    (topic) => `You are strong in ${topic}. Continue with advanced practice, test your edge cases, and push into more complex problem solving.`
  ]
};

function computePerformanceLevel(percentage) {
  if (percentage < 40) return 'WEAK';
  if (percentage <= 69) return 'AVERAGE';
  return 'STRONG';
}

function generateRecommendationText(performanceLevel, topicName) {
  const templates = RECOMMENDATION_TEMPLATES[performanceLevel];
  if (!templates || templates.length === 0) {
    return `Review ${topicName} and continue practicing to strengthen your understanding.`;
  }

  const idx = Math.abs(
    topicName.split('').reduce((acc, ch, i) => acc + ch.charCodeAt(0) * (i + 1), 0)
  ) % templates.length;
  return templates[idx](topicName);
}

async function buildTopicPerformanceRows(assessmentId, userId, answers) {
  const byTopic = new Map();
  for (const answer of answers) {
    const tid = answer.topic_id;
    if (!byTopic.has(tid)) {
      byTopic.set(tid, { topic_id: tid, topic_name: answer.topic_name, correct: 0, wrong: 0 });
    }
    const bucket = byTopic.get(tid);
    if (answer.is_correct) bucket.correct++;
    else bucket.wrong++;
  }

  const rows = [];
  for (const [tid, bucket] of byTopic.entries()) {
    const attempted = bucket.correct + bucket.wrong;
    const percentage = attempted === 0 ? 0 : Number(((bucket.correct / attempted) * 100).toFixed(2));
    const performance_level = computePerformanceLevel(percentage);
    rows.push({
      assessment_id: assessmentId,
      topic_id: tid,
      topic_name: bucket.topic_name,
      correct_count: bucket.correct,
      wrong_count: bucket.wrong,
      percentage,
      performance_level
    });
  }
  return rows;
}

async function persistTopicPerformance(rows) {
  if (!rows || rows.length === 0) return [];
  for (const row of rows) {
    await pool.query(
      'INSERT INTO TopicPerformance (assessment_id, topic_id, correct_count, wrong_count, percentage, performance_level) VALUES (?, ?, ?, ?, ?, ?)',
      [row.assessment_id, row.topic_id, row.correct_count, row.wrong_count, row.percentage, row.performance_level]
    );
  }
  return rows;
}

async function getExistingRecommendationsForAssessment(assessmentId, userId, connection = pool) {
  const [rows] = await connection.query(
    'SELECT topic_id FROM Recommendations WHERE assessment_id = ? AND user_id = ?',
    [assessmentId, userId]
  );
  return new Set(rows.map((row) => Number(row.topic_id)));
}

async function generateRecommendationsForAssessment(assessmentId, userId, topicRows = null, connection = pool) {
  let performanceRows = topicRows;
  if (!performanceRows) {
    const [rows] = await connection.query(
      `SELECT tp.topic_id, t.topic_name, tp.percentage, tp.performance_level
       FROM TopicPerformance tp
       LEFT JOIN Topics t ON t.topic_id = tp.topic_id
       WHERE tp.assessment_id = ? ORDER BY tp.topic_performance_id ASC`,
      [assessmentId]
    );
    performanceRows = rows;
  }

  if (!performanceRows || performanceRows.length === 0) {
    return [];
  }

  const existingTopicIds = await getExistingRecommendationsForAssessment(assessmentId, userId, connection);
  const created = [];

  for (const row of performanceRows) {
    const topicId = Number(row.topic_id);
    if (existingTopicIds.has(topicId)) {
      continue;
    }

    const performanceLevel = row.performance_level || computePerformanceLevel(Number(row.percentage) || 0);
    const priorityLevel = PRIORITY_BY_LEVEL[performanceLevel] || 'MEDIUM';
    const topicName = row.topic_name || `Topic ${topicId}`;
    const recommendationText = generateRecommendationText(performanceLevel, topicName);

    const [result] = await connection.query(
      'INSERT INTO Recommendations (assessment_id, user_id, topic_id, recommendation_text, priority_level) VALUES (?, ?, ?, ?, ?)',
      [assessmentId, userId, topicId, recommendationText, priorityLevel]
    );

    created.push({
      recommendation_id: result.insertId,
      assessment_id: assessmentId,
      user_id: userId,
      topic_id: topicId,
      topic_name: topicName,
      recommendation_text: recommendationText,
      priority_level: priorityLevel,
      performance_level: performanceLevel,
      created_at: new Date()
    });
  }

  return created;
}

async function getStudentRecommendations(userId) {
  const [rows] = await pool.query(
    `SELECT
       r.recommendation_id,
       r.assessment_id,
       a.subject_id,
       s.subject_name,
       r.topic_id,
       t.topic_name,
       r.recommendation_text,
       r.priority_level,
       r.created_at
     FROM Recommendations r
     LEFT JOIN Assessments a ON a.assessment_id = r.assessment_id
     LEFT JOIN Subjects s ON s.subject_id = a.subject_id
     LEFT JOIN Topics t ON t.topic_id = r.topic_id
     WHERE r.user_id = ?
     ORDER BY FIELD(r.priority_level, 'HIGH', 'MEDIUM', 'LOW'), r.created_at DESC, r.recommendation_id DESC`,
    [userId]
  );

  return rows.map((row) => ({
    recommendation_id: row.recommendation_id,
    assessment_id: row.assessment_id,
    subject_id: row.subject_id,
    subject_name: row.subject_name,
    topic_id: row.topic_id,
    topic_name: row.topic_name,
    recommendation_text: row.recommendation_text,
    priority_level: row.priority_level,
    created_at: row.created_at
  }));
}

async function getAssessmentRecommendationsForStudent(userId, assessmentId) {
  const [assessmentRows] = await pool.query(
    'SELECT a.assessment_id, a.user_id, a.subject_id, a.status, a.score, a.percentage, a.assessment_level, s.subject_name FROM Assessments a LEFT JOIN Subjects s ON s.subject_id = a.subject_id WHERE a.assessment_id = ? LIMIT 1',
    [assessmentId]
  );
  const assessment = assessmentRows[0] || null;
  if (!assessment) {
    return { success: false, error: 'Assessment not found', status: 404 };
  }
  if (assessment.user_id !== userId) {
    return { success: false, error: 'Access denied: this assessment does not belong to you', status: 403 };
  }
  if (assessment.status !== 'COMPLETED') {
    return { success: false, error: 'Assessment is not yet completed', status: 409 };
  }

  const [rows] = await pool.query(
    `SELECT
       r.recommendation_id,
       r.assessment_id,
       r.topic_id,
       t.topic_name,
       r.recommendation_text,
       r.priority_level,
       r.created_at
     FROM Recommendations r
     LEFT JOIN Topics t ON t.topic_id = r.topic_id
     WHERE r.assessment_id = ? AND r.user_id = ?
     ORDER BY FIELD(r.priority_level, 'HIGH', 'MEDIUM', 'LOW'), r.created_at DESC, r.recommendation_id DESC`,
    [assessmentId, userId]
  );

  return {
    success: true,
    data: {
      assessment_id: assessment.assessment_id,
      subject_name: assessment.subject_name,
      assessment_level: assessment.assessment_level,
      score: assessment.score,
      percentage: Number(assessment.percentage),
      recommendations: rows
    }
  };
}

async function getLearningSummaryForStudent(userId) {
  const [summaryRows] = await pool.query(
    `SELECT
       COUNT(*) AS total_completed_assessments,
       IFNULL(ROUND(AVG(percentage), 2), 0) AS overall_average_percentage
     FROM Assessments
     WHERE user_id = ? AND status = 'COMPLETED'`,
    [userId]
  );

  const summary = summaryRows[0] || { total_completed_assessments: 0, overall_average_percentage: 0 };

  const [performanceRows] = await pool.query(
    `SELECT
       tp.topic_id,
       t.topic_name,
       s.subject_name,
       tp.percentage,
       tp.performance_level,
       tp.assessment_id
     FROM TopicPerformance tp
     LEFT JOIN Topics t ON t.topic_id = tp.topic_id
     LEFT JOIN Subjects s ON s.subject_id = t.subject_id
     LEFT JOIN Assessments a ON a.assessment_id = tp.assessment_id
     WHERE a.user_id = ? AND a.status = 'COMPLETED'
     ORDER BY a.assessment_id DESC, tp.topic_performance_id DESC`,
    [userId]
  );

  const latestByTopic = new Map();
  for (const row of performanceRows) {
    const key = Number(row.topic_id);
    if (!latestByTopic.has(key)) {
      latestByTopic.set(key, row);
    }
  }

  const weakTopics = [];
  const averageTopics = [];
  const strongTopics = [];

  for (const row of latestByTopic.values()) {
    const item = {
      topic_id: Number(row.topic_id),
      topic_name: row.topic_name,
      subject_name: row.subject_name,
      latest_percentage: Number(row.percentage),
      priority_level: PRIORITY_BY_LEVEL[row.performance_level] || 'MEDIUM'
    };

    if (row.performance_level === 'WEAK') weakTopics.push(item);
    else if (row.performance_level === 'AVERAGE') averageTopics.push(item);
    else if (row.performance_level === 'STRONG') strongTopics.push(item);
  }

  const [recommendationRows] = await pool.query(
    `SELECT
       r.recommendation_id,
       r.topic_id,
       t.topic_name,
       s.subject_name,
       r.recommendation_text,
       r.priority_level,
       r.created_at
     FROM Recommendations r
     LEFT JOIN Topics t ON t.topic_id = r.topic_id
     LEFT JOIN Assessments a ON a.assessment_id = r.assessment_id
     LEFT JOIN Subjects s ON s.subject_id = a.subject_id
     WHERE r.user_id = ?
     ORDER BY FIELD(r.priority_level, 'HIGH', 'MEDIUM', 'LOW'), r.created_at DESC, r.recommendation_id DESC`,
    [userId]
  );

  const recommendations = { high: [], medium: [], low: [] };
  for (const row of recommendationRows) {
    const bucket = row.priority_level ? row.priority_level.toLowerCase() : 'medium';
    if (recommendations[bucket]) {
      recommendations[bucket].push({
        recommendation_id: row.recommendation_id,
        topic_id: row.topic_id,
        topic_name: row.topic_name,
        subject_name: row.subject_name,
        recommendation_text: row.recommendation_text,
        priority_level: row.priority_level,
        created_at: row.created_at
      });
    }
  }

  return {
    success: true,
    data: {
      total_completed_assessments: Number(summary.total_completed_assessments || 0),
      overall_average_percentage: Number(summary.overall_average_percentage || 0),
      weak_topics: weakTopics,
      average_topics: averageTopics,
      strong_topics: strongTopics,
      recommendations
    }
  };
}

async function getAdminRecommendationsForAssessment(assessmentId) {
  const [assessmentRows] = await pool.query(
    'SELECT a.assessment_id, a.user_id, a.subject_id, a.status, a.score, a.percentage, a.assessment_level, s.subject_name FROM Assessments a LEFT JOIN Subjects s ON s.subject_id = a.subject_id WHERE a.assessment_id = ? LIMIT 1',
    [assessmentId]
  );
  const assessment = assessmentRows[0] || null;
  if (!assessment) {
    return { success: false, error: 'Assessment not found', status: 404 };
  }

  const [rows] = await pool.query(
    `SELECT
       r.recommendation_id,
       r.assessment_id,
       r.user_id,
       u.name AS student_name,
       r.topic_id,
       t.topic_name,
       r.recommendation_text,
       r.priority_level,
       r.created_at
     FROM Recommendations r
     LEFT JOIN Users u ON u.user_id = r.user_id
     LEFT JOIN Topics t ON t.topic_id = r.topic_id
     WHERE r.assessment_id = ?
     ORDER BY FIELD(r.priority_level, 'HIGH', 'MEDIUM', 'LOW'), r.created_at DESC, r.recommendation_id DESC`,
    [assessmentId]
  );

  return {
    success: true,
    data: {
      assessment_id: assessment.assessment_id,
      subject_name: assessment.subject_name,
      assessment_level: assessment.assessment_level,
      score: assessment.score,
      percentage: Number(assessment.percentage),
      recommendations: rows
    }
  };
}

async function computeAndSave(assessmentId, userId, answers) {
  const topicRows = await buildTopicPerformanceRows(assessmentId, userId, answers);
  await persistTopicPerformance(topicRows);
  const recommendations = await generateRecommendationsForAssessment(assessmentId, userId, topicRows);
  return { topicPerformance: topicRows, recommendations };
}

module.exports = {
  computePerformanceLevel,
  generateRecommendationText,
  buildTopicPerformanceRows,
  persistTopicPerformance,
  generateRecommendationsForAssessment,
  getStudentRecommendations,
  getAssessmentRecommendationsForStudent,
  getLearningSummaryForStudent,
  getAdminRecommendationsForAssessment,
  computeAndSave
};
