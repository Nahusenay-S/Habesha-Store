const { query } = require('../db');

const sellerMiddleware = async (req, res, next) => {
  try {
    const result = await query('SELECT role FROM users WHERE id = $1', [req.userId]);
    if (!result.rowCount || !['seller', 'admin'].includes(result.rows[0].role)) {
      return res.status(403).json({ error: 'Seller access is required for this action' });
    }
    return next();
  } catch (error) {
    console.error('Seller authorization error:', error);
    return res.status(500).json({ error: 'Unable to verify seller access' });
  }
};

module.exports = sellerMiddleware;
