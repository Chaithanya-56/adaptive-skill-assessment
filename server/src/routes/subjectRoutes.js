const express = require('express');
const { listSubjects, addSubject, listTopics, addTopic } = require('../controllers/subjectController');
const { authenticate, requireRole } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', listSubjects);
router.get('/:subjectId/topics', listTopics);

router.post('/', authenticate, requireRole('ADMIN'), addSubject);
router.post('/:subjectId/topics', authenticate, requireRole('ADMIN'), addTopic);

module.exports = router;
