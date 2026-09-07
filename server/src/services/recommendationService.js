const { pool } = require('../config/db');

const RECOMMENDATION_TEMPLATES = {
  WEAK: [
    (topic) => `Strengthen the basics of ${topic} with introductory tutorials and worked examples. Review definitions, core components, and simple practice problems before advancing.`,
    (topic) => `For ${topic}, go back to fundamentals. Draw concept maps, study from beginner resources, and attempt low-difficulty questions until you consistently get them right.`,
    (topic) => `${topic} performance indicates foundational gaps. Dedicate focused study time using beginner-level material, flashcards for terminology, and step-by-step walkthroughs.`
  ],
  AVERAGE: [
    (topic) => `Solidify your understanding of ${topic} by practicing a mix of medium-difficulty questions and reviewing the edge cases you missed.`,
    (topic) => `For ${topic}, move into applied practice: attempt scenario-based questions, compare related concepts, and time yourself to build confidence.`,
    (topic) => `${topic} knowledge is developing. Target medium-level drills and revisit any subtopics that feel shaky, then review explanations after each attempt.`
  ]
};

function pickRecommendation(level, topicName) {
  const templates = RECOMMENDATION_TEMPLATES[level];
  if (!templates) return null;
  const idx = Math.abs(
    topicName.split('').reduce((acc, ch, i) => acc + ch.charCodeAt(0) * (i + 1), 0)
  ) % templates.length;
  return templates[idx](topicName);
}

function computePerformanceLevel(percentage) {
  if (percentage < 40) return 'WEAK';
  if (percentage <= 69) return 'AVERAGE';
  return 'STRONG';
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

async function buildAndPersistRecommendations(assessmentId, userId, topicRows) {
  const out = [];
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
    const text = pickRecommendation(templateLevel, t.topic_name || `topic ${t.topic_id}`);
    const [result] = await pool.query(
      'INSERT INTO Recommendations (assessment_id, user_id, topic_id, recommendation_text, priority_level) VALUES (?, ?, ?, ?, ?)',
      [assessmentId, userId, t.topic_id, text, priority]
    );
    out.push({
      recommendation_id: result.insertId,
      topic_id: t.topic_id,
      topic_name: t.topic_name,
      performance_level: t.performance_level,
      recommendation_text: text,
      priority_level: priority
    });
  }
  return out;
}

async function computeAndSave(assessmentId, userId, answers) {
  const topicRows = await buildTopicPerformanceRows(assessmentId, userId, answers);
  await persistTopicPerformance(topicRows);
  const recommendations = await buildAndPersistRecommendations(assessmentId, userId, topicRows);
  return { topicPerformance: topicRows, recommendations };
}

module.exports = {
  computePerformanceLevel,
  buildTopicPerformanceRows,
  persistTopicPerformance,
  buildAndPersistRecommendations,
  computeAndSave
};
