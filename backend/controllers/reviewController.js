const { query } = require('../db');

const createReview = async (req, res) => {
  const { product, rating, title, comment } = req.body;
  if (!product || !rating || !title || !comment) return res.status(400).json({ error: 'Product, rating, title and comment are required' });
  try {
    const result = await query(
      `INSERT INTO reviews (product_id, author_id, rating, title, comment, is_verified)
       VALUES ($1, $2, $3, $4, $5, EXISTS (
         SELECT 1 FROM order_items oi JOIN orders o ON o.id = oi.order_id
         WHERE oi.product_id = $1 AND o.buyer_id = $2 AND o.status = 'delivered'
       ))
       RETURNING id AS "_id", product_id AS product, author_id AS author, rating, title, comment, is_verified AS "isVerified", created_at AS "createdAt"`,
      [product, req.userId, rating, title, comment]
    );
    await query(
      `UPDATE products SET rating = stats.average, review_count = stats.total
       FROM (SELECT product_id, AVG(rating)::numeric(3,2) AS average, COUNT(*)::int AS total FROM reviews WHERE product_id = $1 GROUP BY product_id) stats
       WHERE products.id = stats.product_id`,
      [product]
    );
    return res.status(201).json({ message: 'Review created successfully', review: result.rows[0] });
  } catch (error) {
    if (error.code === '23505') return res.status(400).json({ error: 'You have already reviewed this product' });
    console.error('Create review error:', error);
    return res.status(500).json({ error: 'Unable to create review' });
  }
};

const getProductReviews = async (req, res) => {
  const result = await query(
    `SELECT r.id AS "_id", r.product_id AS product, r.rating, r.title, r.comment, r.is_verified AS "isVerified", r.created_at AS "createdAt",
     json_build_object('id', u.id, 'name', u.name) AS author
     FROM reviews r JOIN users u ON u.id = r.author_id WHERE r.product_id = $1 ORDER BY r.created_at DESC`,
    [req.params.productId]
  );
  return res.json(result.rows);
};

const updateReview = async (req, res) => {
  const { rating, title, comment } = req.body;
  const result = await query(
    `UPDATE reviews SET rating = COALESCE($1, rating), title = COALESCE($2, title), comment = COALESCE($3, comment), updated_at = NOW()
     WHERE id = $4 AND author_id = $5 RETURNING id AS "_id", product_id AS product, rating, title, comment`,
    [rating, title, comment, req.params.id, req.userId]
  );
  if (!result.rowCount) return res.status(404).json({ error: 'Review not found or not authorized' });
  return res.json({ message: 'Review updated successfully', review: result.rows[0] });
};

const deleteReview = async (req, res) => {
  const result = await query('DELETE FROM reviews WHERE id = $1 AND author_id = $2 RETURNING product_id', [req.params.id, req.userId]);
  if (!result.rowCount) return res.status(404).json({ error: 'Review not found or not authorized' });
  await query(
    `UPDATE products SET rating = COALESCE(stats.average, 0), review_count = COALESCE(stats.total, 0)
     FROM (SELECT product_id, AVG(rating)::numeric(3,2) AS average, COUNT(*)::int AS total FROM reviews WHERE product_id = $1 GROUP BY product_id) stats
     WHERE products.id = $1`,
    [result.rows[0].product_id]
  );
  return res.json({ message: 'Review deleted successfully' });
};

module.exports = { createReview, getProductReviews, updateReview, deleteReview };
