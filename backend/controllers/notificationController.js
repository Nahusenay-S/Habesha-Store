const { query } = require('../db');

const getNotifications = async (req, res) => {
  const result = await query(
    `SELECT id AS "_id", type, title, message, order_id AS "orderId",
      product_id AS "productId", is_read AS "isRead", created_at AS "createdAt"
     FROM notifications
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT 50`,
    [req.userId]
  );
  return res.json(result.rows);
};

const markAsRead = async (req, res) => {
  const result = await query(
    `UPDATE notifications SET is_read = TRUE
     WHERE id = $1 AND user_id = $2
     RETURNING id AS "_id", is_read AS "isRead"`,
    [req.params.id, req.userId]
  );
  if (!result.rowCount) return res.status(404).json({ error: 'Notification not found' });
  return res.json(result.rows[0]);
};

const markAllAsRead = async (req, res) => {
  await query('UPDATE notifications SET is_read = TRUE WHERE user_id = $1 AND is_read = FALSE', [req.userId]);
  return res.json({ message: 'Notifications marked as read' });
};

module.exports = { getNotifications, markAsRead, markAllAsRead };
