const { query } = require('../db');
const { v4: uuidv4 } = require('uuid');
const { getPlatformConfig } = require('../services/platformConfig');

const createTelebirrPayment = async (req, res) => {
  const config = await getPlatformConfig();
  if (!config.paymentMethods.telebirr.enabled) return res.status(503).json({ error: 'Telebirr payments are currently disabled' });
  const { orderId } = req.body;
  const order = await query('SELECT id, total_amount FROM orders WHERE id = $1 AND buyer_id = $2', [orderId, req.userId]);
  if (!order.rowCount) return res.status(404).json({ error: 'Order not found' });
  const reference = `HB-${uuidv4().split('-')[0].toUpperCase()}`;
  const payment = await query(
    `INSERT INTO payments (order_id, user_id, amount, payment_method, status, provider_reference)
     VALUES ($1, $2, $3, 'telebirr', 'processing', $4) RETURNING id AS "_id"`,
    [orderId, req.userId, order.rows[0].total_amount, reference]
  );
  return res.json({ paymentId: payment.rows[0]._id, referenceId: reference, amount: order.rows[0].total_amount, status: 'processing' });
};

const verifyTelebirrPayment = async (req, res) => {
  const { paymentId, referenceId } = req.body;
  const result = await query(
    `UPDATE payments SET status = 'completed', paid_at = NOW(), updated_at = NOW()
     WHERE id = $1 AND user_id = $2 AND provider_reference = $3
     RETURNING id AS "_id", order_id AS "order", status`,
    [paymentId, req.userId, referenceId]
  );
  if (!result.rowCount) return res.status(404).json({ error: 'Payment not found' });
  await query(
    `WITH updated AS (
       UPDATE orders SET status = 'confirmed', payment_status = 'completed', updated_at = NOW()
       WHERE id = $1 AND payment_status <> 'completed' RETURNING id, seller_id
     )
     INSERT INTO notifications (user_id, type, title, message, order_id)
     SELECT seller_id, 'payment_confirmed', 'Payment confirmed', 'Payment was confirmed for a buyer order. You can now begin fulfillment.', id
     FROM updated WHERE seller_id IS NOT NULL`,
    [result.rows[0].order]
  );
  return res.json({ message: 'Payment verified', payment: result.rows[0] });
};

const getTelebirrPaymentStatus = async (req, res) => {
  const result = await query('SELECT id AS "_id", order_id AS "order", amount, status, provider_reference AS "referenceId" FROM payments WHERE provider_reference = $1 AND user_id = $2', [req.params.referenceId, req.userId]);
  if (!result.rowCount) return res.status(404).json({ error: 'Payment not found' });
  return res.json(result.rows[0]);
};

const handleTelebirrCallback = async (req, res) => res.json({ received: true });
const handleTelebirrWebhook = async (req, res) => res.json({ received: true });

module.exports = { createTelebirrPayment, verifyTelebirrPayment, handleTelebirrCallback, handleTelebirrWebhook, getTelebirrPaymentStatus };
