const express = require('express');
const { handleStart, handleGet, handleAnswer, handleSubmit, handleResult, handleList } = require('../controllers/assessmentController');
const { authenticate, requireRole } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', authenticate, requireRole('STUDENT'), handleList);
router.post('/start', authenticate, requireRole('STUDENT'), handleStart);
router.get('/:id', authenticate, requireRole('STUDENT'), handleGet);
router.post('/:id/answers', authenticate, requireRole('STUDENT'), handleAnswer);
router.post('/:id/submit', authenticate, requireRole('STUDENT'), handleSubmit);
router.get('/:id/results', authenticate, requireRole('STUDENT'), handleResult);

module.exports = router;
