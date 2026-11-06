const fs = require('fs');
const path = require('path');
const { pool } = require('../db');

const migrate = async () => {
  const schemaPath = path.join(__dirname, '..', 'schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');

  console.log('Running database migrations from schema.sql...');
  await pool.query(schemaSql);
  console.log('Database migrations applied successfully.');
};

migrate()
  .catch((err) => {
    console.error('Migration failed:', err.message);
    process.exit(1);
  })
  .finally(() => pool.end());
