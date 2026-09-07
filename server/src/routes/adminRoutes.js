const express = require('express');
const { authenticate, requireRole } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/test', authenticate, requireRole('ADMIN'), (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Admin route accessible',
    data: {
      note: 'This endpoint requires authenticated ADMIN role.',
      accessedBy: {
        user_id: req.user.user_id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role
      }
    }
  });
});

module.exports = router;
