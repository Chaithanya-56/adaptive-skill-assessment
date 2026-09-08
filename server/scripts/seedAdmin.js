require('dotenv').config();
const bcrypt = require('bcryptjs');
const { pool } = require('../src/config/db');

async function seedAdmin() {
  const email = (process.env.ADMIN_EMAIL || 'admin@adaptive.com').trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  const name = (process.env.ADMIN_NAME || 'Admin User').trim();

  if (!password || password.length < 6) {
    throw new Error('Set ADMIN_PASSWORD to a password with at least 6 characters before running this script.');
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const [existingRows] = await pool.query(
    'SELECT user_id FROM Users WHERE email = ? LIMIT 1',
    [email]
  );

  if (existingRows[0]) {
    await pool.query(
      'UPDATE Users SET name = ?, password_hash = ?, role = ? WHERE user_id = ?',
      [name, passwordHash, 'ADMIN', existingRows[0].user_id]
    );
    console.log(`Admin account updated: ${email}`);
  } else {
    await pool.query(
      'INSERT INTO Users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
      [name, email, passwordHash, 'ADMIN']
    );
    console.log(`Admin account created: ${email}`);
  }
}

seedAdmin()
  .catch((error) => {
    console.error(`Admin seed failed: ${error.message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
