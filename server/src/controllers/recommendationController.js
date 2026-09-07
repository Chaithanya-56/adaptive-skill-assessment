const {
  getStudentRecommendations,
  getAssessmentRecommendationsForStudent,
  getLearningSummaryForStudent,
  getAdminRecommendationsForAssessment
} = require('../services/recommendationService');

function parseAssessmentIdParam(paramValue) {
  const assessmentId = Number(paramValue);
  if (!Number.isInteger(assessmentId) || assessmentId <= 0) {
    return { valid: false, assessmentId: 0, error: 'Invalid assessment ID' };
  }
  return { valid: true, assessmentId, error: null };
}

async function listStudentRecommendations(req, res) {
  try {
    const recommendations = await getStudentRecommendations(req.user.user_id);
    return res.status(200).json({
      success: true,
      message: 'Recommendations retrieved successfully',
      data: {
        count: recommendations.length,
        recommendations
      }
    });
  } catch (error) {
    console.error('listStudentRecommendations error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while retrieving recommendations'
    });
  }
}

async function getAssessmentRecommendations(req, res) {
  try {
    const parsed = parseAssessmentIdParam(req.params.assessmentId);
    if (!parsed.valid) {
      return res.status(400).json({
        success: false,
        message: parsed.error
      });
    }

    const result = await getAssessmentRecommendationsForStudent(req.user.user_id, parsed.assessmentId);
    if (!result.success) {
      return res.status(result.status || 400).json({
        success: false,
        message: result.error
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Assessment recommendations retrieved successfully',
      data: result.data
    });
  } catch (error) {
    console.error('getAssessmentRecommendations error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while retrieving assessment recommendations'
    });
  }
}

async function getLearningSummary(req, res) {
  try {
    const result = await getLearningSummaryForStudent(req.user.user_id);
    if (!result.success) {
      return res.status(result.status || 400).json({
        success: false,
        message: result.error || 'Unable to generate learning summary'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Learning summary retrieved successfully',
      data: result.data
    });
  } catch (error) {
    console.error('getLearningSummary error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while retrieving learning summary'
    });
  }
}

async function getAdminAssessmentRecommendations(req, res) {
  try {
    const parsed = parseAssessmentIdParam(req.params.assessmentId);
    if (!parsed.valid) {
      return res.status(400).json({
        success: false,
        message: parsed.error
      });
    }

    const result = await getAdminRecommendationsForAssessment(parsed.assessmentId);
    if (!result.success) {
      return res.status(result.status || 400).json({
        success: false,
        message: result.error
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Assessment recommendations retrieved successfully',
      data: result.data
    });
  } catch (error) {
    console.error('getAdminAssessmentRecommendations error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while retrieving assessment recommendations'
    });
  }
}

module.exports = {
  listStudentRecommendations,
  getAssessmentRecommendations,
  getLearningSummary,
  getAdminAssessmentRecommendations
};
