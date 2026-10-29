const { query } = require('../db');

const adminMiddleware = async (req, res, next) => {
  try {
    const result = await query('SELECT role FROM users WHERE id = $1 AND is_active = TRUE', [req.userId]);
    if (!result.rowCount || result.rows[0].role !== 'admin') {
      return res.status(403).json({ error: 'Administrator access is required' });
    }
    return next();
  } catch (error) {
    console.error('Admin authorization error:', error);
    return res.status(500).json({ error: 'Unable to verify administrator access' });
  }
};

module.exports = adminMiddleware;
