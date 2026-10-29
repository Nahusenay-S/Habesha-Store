const { query } = require('../db');

const getSummary = async (req, res) => {
  const products = await query(
    `SELECT id AS "_id", name, category, stock, price, images, is_active AS "isActive"
     FROM products WHERE seller_id = $1 ORDER BY created_at DESC`,
    [req.userId]
  );
  const stats = await query(
    `SELECT COUNT(DISTINCT o.id)::int AS orders,
      COALESCE(SUM(oi.price * oi.quantity) FILTER (WHERE o.payment_status = 'completed'), 0) AS sales,
      COALESCE(SUM(oi.quantity), 0)::int AS units
     FROM orders o JOIN order_items oi ON oi.order_id = o.id JOIN products p ON p.id = oi.product_id
     WHERE p.seller_id = $1`,
    [req.userId]
  );
  return res.json({ stats: stats.rows[0], products: products.rows });
};

module.exports = { getSummary };
