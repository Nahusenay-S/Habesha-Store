const { query } = require('../db');
const { getPlatformConfig, savePlatformConfig } = require('../services/platformConfig');

const getOverview = async (req, res) => {
  const [users, products, orders, revenue, recentOrders] = await Promise.all([
    query(`SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE role = 'seller')::int AS sellers,
      COUNT(*) FILTER (WHERE role = 'buyer')::int AS buyers FROM users`),
    query(`SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE is_active)::int AS active FROM products`),
    query(`SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE status NOT IN ('delivered', 'cancelled'))::int AS open FROM orders`),
    query(`SELECT COALESCE(SUM(total_amount) FILTER (WHERE payment_status = 'completed'), 0) AS total,
      COUNT(*) FILTER (WHERE payment_status = 'completed')::int AS paid_orders FROM orders`),
    query(`SELECT o.id AS "_id", o.status, o.payment_status AS "paymentStatus", o.total_amount AS "totalAmount",
      o.created_at AS "createdAt", u.name AS "buyerName", COALESCE(s.name, 'Unassigned') AS "sellerName"
      FROM orders o JOIN users u ON u.id = o.buyer_id LEFT JOIN users s ON s.id = o.seller_id
      ORDER BY o.created_at DESC LIMIT 10`),
  ]);
  return res.json({
    metrics: {
      users: users.rows[0],
      products: products.rows[0],
      orders: orders.rows[0],
      revenue: revenue.rows[0],
    },
    recentOrders: recentOrders.rows,
    paymentConfig: await getPlatformConfig(),
  });
};

const getPaymentConfig = async (req, res) => res.json(await getPlatformConfig());

const updatePaymentConfig = async (req, res) => {
  const incoming = req.body || {};
  const current = await getPlatformConfig();
  const config = {
    currency: String(incoming.currency || current.currency).toUpperCase().slice(0, 3),
    shipping: {
      flatRate: Number(incoming.shipping?.flatRate ?? current.shipping.flatRate),
      freeThreshold: Number(incoming.shipping?.freeThreshold ?? current.shipping.freeThreshold),
    },
    paymentMethods: {
      stripe: {
        enabled: Boolean(incoming.paymentMethods?.stripe?.enabled ?? current.paymentMethods.stripe.enabled),
        publishableKey: String(incoming.paymentMethods?.stripe?.publishableKey ?? current.paymentMethods.stripe.publishableKey),
        currency: String(incoming.paymentMethods?.stripe?.currency ?? current.paymentMethods.stripe.currency).toLowerCase(),
      },
      telebirr: {
        enabled: Boolean(incoming.paymentMethods?.telebirr?.enabled ?? current.paymentMethods.telebirr.enabled),
        merchantName: String(incoming.paymentMethods?.telebirr?.merchantName ?? current.paymentMethods.telebirr.merchantName),
      },
      paypal: {
        enabled: Boolean(incoming.paymentMethods?.paypal?.enabled ?? current.paymentMethods.paypal.enabled),
        clientId: String(incoming.paymentMethods?.paypal?.clientId ?? current.paymentMethods.paypal.clientId),
      },
    },
  };
  if (!Number.isFinite(config.shipping.flatRate) || config.shipping.flatRate < 0 || !Number.isFinite(config.shipping.freeThreshold) || config.shipping.freeThreshold < 0) {
    return res.status(400).json({ error: 'Shipping values must be non-negative numbers' });
  }
  return res.json(await savePlatformConfig(config));
};

module.exports = { getOverview, getPaymentConfig, updatePaymentConfig };
