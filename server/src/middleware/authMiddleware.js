const { verifyToken, findUserById } = require('../services/authService');

async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization || '';
  if (!authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Missing or invalid Authorization header. Expected: Bearer <token>'
    });
  }
  const token = authHeader.slice('Bearer '.length);
  try {
    const decoded = verifyToken(token);
    const user = await findUserById(decoded.user_id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token: user not found'
      });
    }
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
      error: error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError'
        ? error.message
        : undefined
    });
  }
}

function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: insufficient role permissions',
        data: {
          requiredRole: allowedRoles.join(' or '),
          currentRole: req.user.role
        }
      });
    }
    next();
  };
}

module.exports = {
  authenticate,
  requireRole
};
