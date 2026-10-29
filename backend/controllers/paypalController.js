const { query } = require('../db');
const { getPlatformConfig } = require('../services/platformConfig');

const createPayPalOrder = async (req, res) => {
  const config = await getPlatformConfig();
  if (!config.paymentMethods.paypal.enabled) return res.status(503).json({ error: 'PayPal payments are currently disabled' });
  const { orderId } = req.body;
  const order = await query('SELECT id, total_amount FROM orders WHERE id = $1 AND buyer_id = $2', [orderId, req.userId]);
  if (!order.rowCount) return res.status(404).json({ error: 'Order not found' });
  const payment = await query(
    `INSERT INTO payments (order_id, user_id, amount, currency, payment_method, status)
     VALUES ($1, $2, $3, 'USD', 'paypal', 'processing') RETURNING id AS "_id"`,
    [orderId, req.userId, order.rows[0].total_amount]
  );
  return res.json({ paypalOrderId: payment.rows[0]._id, paymentId: payment.rows[0]._id, approvalUrl: null });
};

const capturePayPalPayment = async (req, res) => {
  const { paymentId } = req.body;
  const result = await query("UPDATE payments SET status = 'completed', paid_at = NOW(), updated_at = NOW() WHERE id = $1 AND user_id = $2 RETURNING id AS \"_id\", order_id AS \"order\", status", [paymentId, req.userId]);
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
  return res.json({ message: 'Payment captured successfully', payment: result.rows[0] });
};

const refundPayPalPayment = async (req, res) => {
  const result = await query("UPDATE payments SET status = 'refunded', refunded_at = NOW(), updated_at = NOW() WHERE id = $1 AND user_id = $2 AND payment_method = 'paypal' RETURNING order_id", [req.body.paymentId, req.userId]);
  if (!result.rowCount) return res.status(404).json({ error: 'Payment not found' });
  await query("UPDATE orders SET status = 'cancelled', payment_status = 'refunded', updated_at = NOW() WHERE id = $1", [result.rows[0].order_id]);
  return res.json({ message: 'Refund processed successfully' });
};

module.exports = { createPayPalOrder, capturePayPalPayment, refundPayPalPayment };
