const {
  startAssessment,
  getAssessment,
  answerQuestion,
  submitAssessment,
  getAssessmentResult,
  getStudentAssessmentHistory
} = require('../services/assessmentService');

function validateStart(body) {
  const errors = [];
  if (!body || typeof body !== 'object') return ['Invalid request body'];
  const sid = Number(body.subject_id);
  if (body.subject_id === undefined || body.subject_id === null || (typeof body.subject_id === 'string' && !body.subject_id.trim())) {
    errors.push('subject_id is required');
  } else if (!Number.isInteger(sid) || sid <= 0) {
    errors.push('subject_id must be a positive integer');
  }
  if (body.total_questions !== undefined && body.total_questions !== null && body.total_questions !== '') {
    const tq = Number(body.total_questions);
    if (!Number.isInteger(tq)) {
      errors.push('total_questions must be an integer when provided');
    }
  }
  return errors;
}

function validateAnswer(body) {
  const errors = [];
  if (!body || typeof body !== 'object') return ['Invalid request body'];
  const qid = Number(body.question_id);
  if (body.question_id === undefined || body.question_id === null || (typeof body.question_id === 'string' && !body.question_id.trim())) {
    errors.push('question_id is required');
  } else if (!Number.isInteger(qid) || qid <= 0) {
    errors.push('question_id must be a positive integer');
  }
  if (body.selected_option === undefined || body.selected_option === null || (typeof body.selected_option === 'string' && !body.selected_option.trim())) {
    errors.push('selected_option is required');
  }
  if (body.time_taken_seconds !== undefined && body.time_taken_seconds !== null && body.time_taken_seconds !== '') {
    const tts = Number(body.time_taken_seconds);
    if (!Number.isFinite(tts) || tts < 0 || !Number.isInteger(tts)) {
      errors.push('time_taken_seconds must be a non-negative integer when provided');
    }
  }
  return errors;
}

function parseIdParam(paramValue, label = 'ID') {
  const id = Number(paramValue);
  if (!Number.isInteger(id) || id <= 0) {
    return { valid: false, id: 0, error: `Invalid ${label}` };
  }
  return { valid: true, id, error: null };
}

async function handleStart(req, res) {
  try {
    const validationErrors = validateStart(req.body);
    if (validationErrors.length) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
    }
    const subjectId = Number(req.body.subject_id);
    const totalQuestions = req.body.total_questions;
    const result = await startAssessment(req.user.user_id, subjectId, totalQuestions);
    if (!result.success) {
      return res.status(result.status || 400).json({
        success: false,
        message: result.error
      });
    }
    return res.status(201).json({
      success: true,
      message: 'Assessment started successfully',
      data: {
        assessment: result.assessment,
        questions: result.questions,
        progress: result.progress,
        has_more_questions: result.has_more_questions,
        next_question: result.next_question
      }
    });
  } catch (error) {
    console.error('handleStart error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while starting assessment'
    });
  }
}

async function handleGet(req, res) {
  try {
    const parsed = parseIdParam(req.params.id, 'assessment ID');
    if (!parsed.valid) {
      return res.status(400).json({
        success: false,
        message: parsed.error
      });
    }
    const result = await getAssessment(req.user.user_id, parsed.id);
    if (!result.success) {
      return res.status(result.status || 400).json({
        success: false,
        message: result.error
      });
    }
    return res.status(200).json({
      success: true,
      message: 'Assessment retrieved successfully',
      data: {
        assessment: result.assessment,
        questions: result.questions,
        progress: result.progress
      }
    });
  } catch (error) {
    console.error('handleGet error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while retrieving assessment'
    });
  }
}

async function handleAnswer(req, res) {
  try {
    const parsed = parseIdParam(req.params.id, 'assessment ID');
    if (!parsed.valid) {
      return res.status(400).json({
        success: false,
        message: parsed.error
      });
    }
    const validationErrors = validateAnswer(req.body);
    if (validationErrors.length) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
    }
    const payload = {
      question_id: req.body.question_id,
      selected_option: req.body.selected_option,
      time_taken_seconds: req.body.time_taken_seconds
    };
    const result = await answerQuestion(req.user.user_id, parsed.id, payload);
    if (!result.success) {
      return res.status(result.status || 400).json({
        success: false,
        message: result.error
      });
    }
    return res.status(200).json({
      success: true,
      message: 'Answer recorded successfully',
      data: {
        progress: result.progress,
        has_more_questions: result.has_more_questions,
        next_question: result.next_question
      }
    });
  } catch (error) {
    console.error('handleAnswer error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while recording answer'
    });
  }
}

async function handleSubmit(req, res) {
  try {
    const parsed = parseIdParam(req.params.id, 'assessment ID');
    if (!parsed.valid) {
      return res.status(400).json({
        success: false,
        message: parsed.error
      });
    }
    const result = await submitAssessment(req.user.user_id, parsed.id);
    if (!result.success) {
      return res.status(result.status || 400).json({
        success: false,
        message: result.error
      });
    }
    return res.status(200).json({
      success: true,
      message: 'Assessment submitted successfully',
      data: {
        assessment: result.assessment,
        answers: result.answers,
        topic_performance: result.topic_performance,
        recommendations: result.recommendations
      }
    });
  } catch (error) {
    console.error('handleSubmit error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while submitting assessment'
    });
  }
}

async function handleResult(req, res) {
  try {
    const parsed = parseIdParam(req.params.id, 'assessment ID');
    if (!parsed.valid) {
      return res.status(400).json({
        success: false,
        message: parsed.error
      });
    }
    const result = await getAssessmentResult(req.user.user_id, parsed.id);
    if (!result.success) {
      return res.status(result.status || 400).json({
        success: false,
        message: result.error
      });
    }
    return res.status(200).json({
      success: true,
      message: 'Assessment result retrieved successfully',
      data: {
        assessment: result.assessment,
        answers: result.answers,
        topic_performance: result.topic_performance,
        recommendations: result.recommendations
      }
    });
  } catch (error) {
    console.error('handleResult error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while retrieving result'
    });
  }
}

async function handleList(req, res) {
  try {
    const result = await getStudentAssessmentHistory(req.user.user_id);
    return res.status(200).json({
      success: true,
      message: 'Assessments retrieved successfully',
      data: {
        count: result.assessments.length,
        assessments: result.assessments
      }
    });
  } catch (error) {
    console.error('handleList error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while retrieving assessments'
    });
  }
}

module.exports = {
  handleStart,
  handleGet,
  handleAnswer,
  handleSubmit,
  handleResult,
  handleList
};
