const express = require('express');
const {
  listStudentRecommendations,
  getAssessmentRecommendations,
  getLearningSummary,
  getAdminAssessmentRecommendations
} = require('../controllers/recommendationController');
const { authenticate, requireRole } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', authenticate, requireRole('STUDENT'), listStudentRecommendations);
router.get('/learning-summary', authenticate, requireRole('STUDENT'), getLearningSummary);
router.get('/assessment/:assessmentId', authenticate, requireRole('STUDENT'), getAssessmentRecommendations);
router.get('/admin/assessment/:assessmentId', authenticate, requireRole('ADMIN'), getAdminAssessmentRecommendations);

module.exports = router;
