const { registerStudent, loginUser } = require('../services/authService');

function validateRegister(body) {
  const errors = [];
  if (!body || typeof body !== 'object') return ['Invalid request body'];
  if (!body.name || typeof body.name !== 'string' || !body.name.trim()) {
    errors.push('name is required');
  }
  if (!body.email || typeof body.email !== 'string' || !body.email.trim()) {
    errors.push('email is required');
  } else if (!/^\S+@\S+\.\S+$/.test(body.email.trim())) {
    errors.push('email format is invalid');
  }
  if (!body.password || typeof body.password !== 'string') {
    errors.push('password is required');
  } else if (body.password.length < 6) {
    errors.push('password must be at least 6 characters long');
  }
  return errors;
}

function validateLogin(body) {
  const errors = [];
  if (!body || typeof body !== 'object') return ['Invalid request body'];
  if (!body.email || typeof body.email !== 'string' || !body.email.trim()) {
    errors.push('email is required');
  }
  if (!body.password || typeof body.password !== 'string') {
    errors.push('password is required');
  }
  return errors;
}

async function register(req, res) {
  try {
    const validationErrors = validateRegister(req.body);
    if (validationErrors.length) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
    }
    const name = req.body.name.trim();
    const email = req.body.email.trim().toLowerCase();
    const password = req.body.password;

    const result = await registerStudent({ name, email, password });
    if (!result.success) {
      return res.status(409).json({
        success: false,
        message: result.error
      });
    }
    return res.status(201).json({
      success: true,
      message: 'Student registered successfully',
      data: {
        user: result.user
      }
    });
  } catch (error) {
    console.error('register error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during registration'
    });
  }
}

async function login(req, res) {
  try {
    const validationErrors = validateLogin(req.body);
    if (validationErrors.length) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
    }
    const email = req.body.email.trim().toLowerCase();
    const password = req.body.password;

    const result = await loginUser({ email, password });
    if (!result.success) {
      return res.status(401).json({
        success: false,
        message: result.error
      });
    }
    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        token: result.token,
        user: result.user
      }
    });
  } catch (error) {
    console.error('login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during login'
    });
  }
}

async function me(req, res) {
  return res.status(200).json({
    success: true,
    message: 'Current authenticated user',
    data: {
      user: req.user
    }
  });
}

module.exports = {
  register,
  login,
  me
};
