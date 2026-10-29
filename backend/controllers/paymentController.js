const Stripe = require('stripe');
const { query } = require('../db');
const { getPlatformConfig } = require('../services/platformConfig');

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;

const createStripePaymentIntent = async (req, res) => {
  if (!stripe) return res.status(503).json({ error: 'Stripe is not configured' });
  const config = await getPlatformConfig();
  if (!config.paymentMethods.stripe.enabled) return res.status(503).json({ error: 'Stripe payments are currently disabled' });
  const { orderId, amount } = req.body;
  const order = await query('SELECT o.id, o.total_amount, o.payment_status, u.email FROM orders o JOIN users u ON u.id = o.buyer_id WHERE o.id = $1 AND o.buyer_id = $2', [orderId, req.userId]);
  if (!order.rowCount) return res.status(404).json({ error: 'Order not found' });
  const value = Number(order.rows[0].total_amount);
  if (amount !== undefined && Math.abs(Number(amount) - value) > 0.01) {
    return res.status(400).json({ error: 'Payment amount does not match the order total' });
  }
  const intent = await stripe.paymentIntents.create({
    amount: Math.round(value * 100), currency: config.paymentMethods.stripe.currency,
    metadata: { orderId, userId: req.userId }, receipt_email: order.rows[0].email,
  });
  const payment = await query(
    `INSERT INTO payments (order_id, user_id, amount, currency, payment_method, status, provider_reference, metadata)
     VALUES ($1, $2, $3, 'USD', 'stripe', 'processing', $4, $5::jsonb) RETURNING id AS "_id"`,
    [orderId, req.userId, value, intent.id, JSON.stringify({ customerEmail: order.rows[0].email })]
  );
  return res.json({ clientSecret: intent.client_secret, paymentIntentId: intent.id, paymentId: payment.rows[0]._id });
};

const confirmStripePayment = async (req, res) => {
  if (!stripe) return res.status(503).json({ error: 'Stripe is not configured' });
  const { paymentIntentId, paymentId } = req.body;
  const intent = await stripe.paymentIntents.retrieve(paymentIntentId);
  if (intent.status !== 'succeeded') return res.status(400).json({ error: `Payment status: ${intent.status}` });
  const payment = await query(
    `UPDATE payments SET status = 'completed', transaction_id = $1, paid_at = NOW(), updated_at = NOW()
     WHERE id = $2 AND user_id = $3 RETURNING id AS "_id", order_id AS "order", amount, status`,
    [paymentIntentId, paymentId, req.userId]
  );
  if (!payment.rowCount) return res.status(404).json({ error: 'Payment not found' });
  await query(
    `WITH updated AS (
       UPDATE orders SET payment_status = 'completed', status = 'confirmed', updated_at = NOW()
       WHERE id = $1 AND payment_status <> 'completed'
       RETURNING id, seller_id
     )
     INSERT INTO notifications (user_id, type, title, message, order_id)
     SELECT seller_id, 'payment_confirmed', 'Payment confirmed', 'Payment was confirmed for a buyer order. You can now begin fulfillment.', id
     FROM updated
     WHERE seller_id IS NOT NULL`,
    [payment.rows[0].order]
  );
  return res.json({ message: 'Payment successful', payment: payment.rows[0] });
};

const getPaymentHistory = async (req, res) => {
  const result = await query(
    `SELECT id AS "_id", order_id AS "order", amount, currency, payment_method AS "paymentMethod", status,
     transaction_id AS "transactionId", created_at AS "createdAt", paid_at AS "paidAt"
     FROM payments WHERE user_id = $1 ORDER BY created_at DESC`,
    [req.userId]
  );
  return res.json(result.rows);
};

const getPaymentById = async (req, res) => {
  const result = await query(
    `SELECT id AS "_id", order_id AS "order", user_id AS "user", amount, currency, payment_method AS "paymentMethod", status,
     transaction_id AS "transactionId", created_at AS "createdAt", paid_at AS "paidAt"
     FROM payments WHERE id = $1 AND user_id = $2`,
    [req.params.id, req.userId]
  );
  if (!result.rowCount) return res.status(404).json({ error: 'Payment not found' });
  return res.json(result.rows[0]);
};

const processRefund = async (req, res) => {
  if (!stripe) return res.status(503).json({ error: 'Stripe is not configured' });
  const { paymentId, reason } = req.body;
  const payment = await query('SELECT * FROM payments WHERE id = $1 AND user_id = $2', [paymentId, req.userId]);
  if (!payment.rowCount || payment.rows[0].payment_method !== 'stripe' || !payment.rows[0].transaction_id) return res.status(400).json({ error: 'Refund is not available for this payment' });
  const refund = await stripe.refunds.create({ payment_intent: payment.rows[0].transaction_id, reason: 'requested_by_customer' });
  await query("UPDATE payments SET status = 'refunded', refunded_at = NOW(), refund_amount = amount, refund_reason = $1, updated_at = NOW() WHERE id = $2", [reason || null, paymentId]);
  await query("UPDATE orders SET status = 'cancelled', payment_status = 'refunded', updated_at = NOW() WHERE id = $1", [payment.rows[0].order_id]);
  return res.json({ message: 'Refund processed successfully', refundId: refund.id });
};

const handleStripeWebhook = async (req, res) => {
  if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET) return res.status(503).json({ error: 'Stripe webhook is not configured' });
  let event;
  try { event = stripe.webhooks.constructEvent(req.body, req.headers['stripe-signature'], process.env.STRIPE_WEBHOOK_SECRET); }
  catch (error) { return res.status(400).json({ error: `Webhook Error: ${error.message}` }); }
  const intent = event.data.object;
  if (event.type === 'payment_intent.succeeded') await query("UPDATE payments SET status = 'completed', paid_at = NOW(), updated_at = NOW() WHERE provider_reference = $1", [intent.id]);
  if (event.type === 'payment_intent.payment_failed') await query("UPDATE payments SET status = 'failed', failed_at = NOW(), error_message = $2, updated_at = NOW() WHERE provider_reference = $1", [intent.id, intent.last_payment_error?.message || 'Payment failed']);
  return res.json({ received: true });
};

module.exports = { createStripePaymentIntent, confirmStripePayment, getPaymentHistory, getPaymentById, processRefund, handleStripeWebhook };
