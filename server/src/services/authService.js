const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');

const BCRYPT_SALT_ROUNDS = 10;
const JWT_EXPIRES_IN = '7d';

async function findUserByEmail(email) {
  const [rows] = await pool.query(
    'SELECT user_id, name, email, password_hash, role, created_at FROM Users WHERE email = ? LIMIT 1',
    [email]
  );
  return rows[0] || null;
}

async function findUserById(userId) {
  const [rows] = await pool.query(
    'SELECT user_id, name, email, role, created_at FROM Users WHERE user_id = ? LIMIT 1',
    [userId]
  );
  return rows[0] || null;
}

async function registerStudent({ name, email, password }) {
  const existing = await findUserByEmail(email);
  if (existing) {
    return { success: false, error: 'Email already registered' };
  }
  const passwordHash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
  const [result] = await pool.query(
    'INSERT INTO Users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
    [name, email, passwordHash, 'STUDENT']
  );
  const user = await findUserById(result.insertId);
  return { success: true, user };
}

async function loginUser({ email, password }) {
  const user = await findUserByEmail(email);
  if (!user) {
    return { success: false, error: 'Invalid email or password' };
  }
  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    return { success: false, error: 'Invalid email or password' };
  }
  const { password_hash: _omit, ...safeUser } = user;
  const token = generateToken(safeUser);
  return { success: true, user: safeUser, token };
}

function generateToken(user) {
  const payload = {
    user_id: user.user_id,
    email: user.email,
    role: user.role
  };
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

function verifyToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}

module.exports = {
  findUserById,
  registerStudent,
  loginUser,
  verifyToken
};
