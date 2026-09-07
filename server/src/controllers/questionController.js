const {
  VALID_CORRECT_OPTIONS,
  VALID_DIFFICULTIES,
  stripSensitiveForStudent,
  getQuestions,
  findQuestionById,
  createQuestion,
  updateQuestion,
  deleteQuestion
} = require('../services/questionService');

function validateCreateQuestion(body) {
  const errors = [];
  if (!body || typeof body !== 'object') return ['Invalid request body'];

  const requiredFields = [
    'subject_id', 'topic_id', 'question_text',
    'option_a', 'option_b', 'option_c', 'option_d',
    'correct_option', 'difficulty'
  ];

  for (const field of requiredFields) {
    if (body[field] === undefined || body[field] === null || (typeof body[field] === 'string' && !body[field].trim())) {
      errors.push(`${field} is required`);
    }
  }

  if (body.subject_id !== undefined) {
    const sid = Number(body.subject_id);
    if (!Number.isInteger(sid) || sid <= 0) {
      errors.push('subject_id must be a positive integer');
    }
  }

  if (body.topic_id !== undefined) {
    const tid = Number(body.topic_id);
    if (!Number.isInteger(tid) || tid <= 0) {
      errors.push('topic_id must be a positive integer');
    }
  }

  if (body.correct_option !== undefined && !VALID_CORRECT_OPTIONS.includes(String(body.correct_option).toUpperCase())) {
    errors.push(`correct_option must be one of: ${VALID_CORRECT_OPTIONS.join(', ')}`);
  }

  if (body.difficulty !== undefined && !VALID_DIFFICULTIES.includes(String(body.difficulty).toUpperCase())) {
    errors.push(`difficulty must be one of: ${VALID_DIFFICULTIES.join(', ')}`);
  }

  return errors;
}

function validateUpdateQuestion(body) {
  const errors = [];
  if (!body || typeof body !== 'object') return ['Invalid request body'];

  if (body.subject_id !== undefined && body.subject_id !== null) {
    const sid = Number(body.subject_id);
    if (!Number.isInteger(sid) || sid <= 0) {
      errors.push('subject_id must be a positive integer');
    }
  }

  if (body.topic_id !== undefined && body.topic_id !== null) {
    const tid = Number(body.topic_id);
    if (!Number.isInteger(tid) || tid <= 0) {
      errors.push('topic_id must be a positive integer');
    }
  }

  if (body.correct_option !== undefined && !VALID_CORRECT_OPTIONS.includes(String(body.correct_option).toUpperCase())) {
    errors.push(`correct_option must be one of: ${VALID_CORRECT_OPTIONS.join(', ')}`);
  }

  if (body.difficulty !== undefined && !VALID_DIFFICULTIES.includes(String(body.difficulty).toUpperCase())) {
    errors.push(`difficulty must be one of: ${VALID_DIFFICULTIES.join(', ')}`);
  }

  return errors;
}

function prepareQuestionPayload(role, question) {
  if (role === 'ADMIN') {
    return question;
  }
  return stripSensitiveForStudent(question);
}

async function listQuestions(req, res) {
  try {
    const { subject_id, topic_id, difficulty } = req.query;
    const questions = await getQuestions({ subject_id, topic_id, difficulty });
    const role = req.user.role;
    const result = questions.map(q => prepareQuestionPayload(role, q));
    return res.status(200).json({
      success: true,
      message: 'Questions retrieved successfully',
      data: {
        count: result.length,
        questions: result
      }
    });
  } catch (error) {
    console.error('listQuestions error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while retrieving questions'
    });
  }
}

async function getQuestion(req, res) {
  try {
    const questionId = Number(req.params.questionId);
    if (!Number.isInteger(questionId) || questionId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid question ID'
      });
    }
    const question = await findQuestionById(questionId);
    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }
    const result = prepareQuestionPayload(req.user.role, question);
    return res.status(200).json({
      success: true,
      message: 'Question retrieved successfully',
      data: {
        question: result
      }
    });
  } catch (error) {
    console.error('getQuestion error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while retrieving question'
    });
  }
}

async function addQuestion(req, res) {
  try {
    const validationErrors = validateCreateQuestion(req.body);
    if (validationErrors.length) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
    }
    const payload = {
      subject_id: Number(req.body.subject_id),
      topic_id: Number(req.body.topic_id),
      question_text: String(req.body.question_text).trim(),
      option_a: String(req.body.option_a).trim(),
      option_b: String(req.body.option_b).trim(),
      option_c: String(req.body.option_c).trim(),
      option_d: String(req.body.option_d).trim(),
      correct_option: String(req.body.correct_option).toUpperCase(),
      difficulty: String(req.body.difficulty).toUpperCase(),
      explanation: req.body.explanation ? String(req.body.explanation).trim() : null,
      created_by: req.user.user_id
    };
    const result = await createQuestion(payload);
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.error
      });
    }
    return res.status(201).json({
      success: true,
      message: 'Question created successfully',
      data: {
        question: result.question
      }
    });
  } catch (error) {
    console.error('addQuestion error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while creating question'
    });
  }
}

async function editQuestion(req, res) {
  try {
    const questionId = Number(req.params.questionId);
    if (!Number.isInteger(questionId) || questionId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid question ID'
      });
    }
    const validationErrors = validateUpdateQuestion(req.body);
    if (validationErrors.length) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
    }
    const updates = {};
    const allowedFields = [
      'subject_id', 'topic_id', 'question_text',
      'option_a', 'option_b', 'option_c', 'option_d',
      'correct_option', 'difficulty', 'explanation'
    ];
    for (const field of allowedFields) {
      if (req.body.hasOwnProperty(field)) {
        if (field === 'subject_id' || field === 'topic_id') {
          updates[field] = Number(req.body[field]);
        } else if (field === 'correct_option' || field === 'difficulty') {
          updates[field] = String(req.body[field]).toUpperCase();
        } else {
          const val = req.body[field];
          updates[field] = (val === null || val === undefined || (typeof val === 'string' && val.trim() === '')) ? null : String(val).trim();
        }
      }
    }
    const result = await updateQuestion(questionId, updates);
    if (!result.success) {
      return res.status(result.status || 400).json({
        success: false,
        message: result.error
      });
    }
    return res.status(200).json({
      success: true,
      message: 'Question updated successfully',
      data: {
        question: result.question
      }
    });
  } catch (error) {
    console.error('editQuestion error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while updating question'
    });
  }
}

async function removeQuestion(req, res) {
  try {
    const questionId = Number(req.params.questionId);
    if (!Number.isInteger(questionId) || questionId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid question ID'
      });
    }
    const result = await deleteQuestion(questionId);
    if (!result.success) {
      return res.status(404).json({
        success: false,
        message: result.error
      });
    }
    return res.status(200).json({
      success: true,
      message: 'Question deleted successfully',
      data: {
        question_id: result.question_id
      }
    });
  } catch (error) {
    console.error('removeQuestion error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while deleting question'
    });
  }
}

module.exports = {
  listQuestions,
  getQuestion,
  addQuestion,
  editQuestion,
  removeQuestion
};
