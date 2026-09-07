const {
  getAllSubjects,
  createSubject,
  getTopicsBySubjectId,
  createTopic
} = require('../services/subjectService');

function validateCreateSubject(body) {
  const errors = [];
  if (!body || typeof body !== 'object') return ['Invalid request body'];
  if (!body.subject_name || typeof body.subject_name !== 'string' || !body.subject_name.trim()) {
    errors.push('subject_name is required');
  }
  return errors;
}

function validateCreateTopic(body) {
  const errors = [];
  if (!body || typeof body !== 'object') return ['Invalid request body'];
  if (!body.topic_name || typeof body.topic_name !== 'string' || !body.topic_name.trim()) {
    errors.push('topic_name is required');
  }
  return errors;
}

async function listSubjects(req, res) {
  try {
    const subjects = await getAllSubjects();
    return res.status(200).json({
      success: true,
      message: 'Subjects retrieved successfully',
      data: {
        subjects
      }
    });
  } catch (error) {
    console.error('listSubjects error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while retrieving subjects'
    });
  }
}

async function addSubject(req, res) {
  try {
    const validationErrors = validateCreateSubject(req.body);
    if (validationErrors.length) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
    }
    const subject_name = req.body.subject_name.trim();
    const description = req.body.description ? req.body.description.trim() : null;

    const result = await createSubject({ subject_name, description });
    if (!result.success) {
      return res.status(409).json({
        success: false,
        message: result.error
      });
    }
    return res.status(201).json({
      success: true,
      message: 'Subject created successfully',
      data: {
        subject: result.subject
      }
    });
  } catch (error) {
    console.error('addSubject error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while creating subject'
    });
  }
}

async function listTopics(req, res) {
  try {
    const subjectId = Number(req.params.subjectId);
    if (!Number.isInteger(subjectId) || subjectId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid subject ID'
      });
    }
    const result = await getTopicsBySubjectId(subjectId);
    if (!result.success) {
      return res.status(404).json({
        success: false,
        message: result.error
      });
    }
    return res.status(200).json({
      success: true,
      message: 'Topics retrieved successfully',
      data: {
        topics: result.topics
      }
    });
  } catch (error) {
    console.error('listTopics error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while retrieving topics'
    });
  }
}

async function addTopic(req, res) {
  try {
    const subjectId = Number(req.params.subjectId);
    if (!Number.isInteger(subjectId) || subjectId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid subject ID'
      });
    }
    const validationErrors = validateCreateTopic(req.body);
    if (validationErrors.length) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
    }
    const topic_name = req.body.topic_name.trim();
    const description = req.body.description ? req.body.description.trim() : null;

    const result = await createTopic(subjectId, { topic_name, description });
    if (!result.success) {
      return res.status(result.error === 'Subject not found' ? 404 : 409).json({
        success: false,
        message: result.error
      });
    }
    return res.status(201).json({
      success: true,
      message: 'Topic created successfully',
      data: {
        topic: result.topic
      }
    });
  } catch (error) {
    console.error('addTopic error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while creating topic'
    });
  }
}

module.exports = {
  listSubjects,
  addSubject,
  listTopics,
  addTopic
};
