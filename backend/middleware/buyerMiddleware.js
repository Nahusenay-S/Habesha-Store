const { query } = require('../db');

const buyerMiddleware = async (req, res, next) => {
  try {
    const result = await query('SELECT role FROM users WHERE id = $1 AND is_active = TRUE', [req.userId]);
    if (!result.rowCount || result.rows[0].role !== 'buyer') {
      return res.status(403).json({ error: 'Buyer access is required for shopping and orders' });
    }
    return next();
  } catch (error) {
    console.error('Buyer authorization error:', error);
    return res.status(500).json({ error: 'Unable to verify buyer access' });
  }
};

module.exports = buyerMiddleware;
