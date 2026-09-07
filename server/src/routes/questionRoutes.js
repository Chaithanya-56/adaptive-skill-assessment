const express = require('express');
const { listQuestions, getQuestion, addQuestion, editQuestion, removeQuestion } = require('../controllers/questionController');
const { authenticate, requireRole } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', authenticate, listQuestions);
router.get('/:questionId', authenticate, getQuestion);

router.post('/', authenticate, requireRole('ADMIN'), addQuestion);
router.put('/:questionId', authenticate, requireRole('ADMIN'), editQuestion);
router.delete('/:questionId', authenticate, requireRole('ADMIN'), removeQuestion);

module.exports = router;
