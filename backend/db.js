const { Pool } = require('pg');

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is required. Add your Neon connection string to backend/.env');
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
  max: 10,
});

pool.on('error', (error) => {
  console.error('Unexpected Neon pool error:', error);
});

const query = (text, params) => pool.query(text, params);

module.exports = { pool, query };
