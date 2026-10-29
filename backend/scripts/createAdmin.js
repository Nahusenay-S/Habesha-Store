require('dotenv').config();
const { query, pool } = require('../db');
const { hashPassword } = require('../utils/password');

const run = async () => {
  const { ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
  if (!ADMIN_NAME || !ADMIN_EMAIL || !ADMIN_PASSWORD || ADMIN_PASSWORD.length < 6) {
    throw new Error('Set ADMIN_NAME, ADMIN_EMAIL, and ADMIN_PASSWORD (minimum 6 characters).');
  }
  const result = await query(
    `INSERT INTO users (name, email, password, role)
     VALUES ($1, LOWER($2), $3, 'admin')
     ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name, password = EXCLUDED.password, role = 'admin', is_active = TRUE
     RETURNING id, name, email, role`,
    [ADMIN_NAME.trim(), ADMIN_EMAIL, await hashPassword(ADMIN_PASSWORD)]
  );
  console.log(`Admin account ready: ${result.rows[0].email}`);
};

run().catch((error) => { console.error(error.message); process.exitCode = 1; }).finally(() => pool.end());
