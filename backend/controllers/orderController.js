const { pool, query } = require('../db');
const { getPlatformConfig } = require('../services/platformConfig');

const createOrder = async (req, res) => {
  const { items, shippingAddress = {}, paymentMethod = 'stripe' } = req.body;
  if (!Array.isArray(items) || !items.length) return res.status(400).json({ error: 'Order must contain items' });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const groups = new Map();
    for (const item of items) {
      if (!item.product || !Number.isInteger(Number(item.quantity)) || Number(item.quantity) < 1) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Each item requires a valid product and quantity' });
      }
      const product = await client.query(
        'SELECT id, name, price, stock, seller_id FROM products WHERE id = $1 AND is_active = TRUE FOR UPDATE',
        [item.product]
      );
      if (!product.rowCount) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: `Product ${item.product} not found` });
      }
      const row = product.rows[0];
      const quantity = Number(item.quantity);
      if (row.stock < quantity) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: `Insufficient stock for ${row.name}` });
      }
      const group = groups.get(row.seller_id) || { sellerId: row.seller_id, items: [], subtotal: 0 };
      group.items.push({ product: row.id, quantity, price: Number(row.price) });
      group.subtotal += Number(row.price) * quantity;
      groups.set(row.seller_id, group);
    }

    const createdOrders = [];
    const paymentConfig = await getPlatformConfig();
    for (const group of groups.values()) {
      const shipping = group.subtotal >= paymentConfig.shipping.freeThreshold ? 0 : paymentConfig.shipping.flatRate;
      const order = await client.query(
        `INSERT INTO orders (buyer_id, seller_id, subtotal, shipping_amount, total_amount, shipping_address, payment_method)
         VALUES ($1, $2, $3, $4, $3::numeric + $4::numeric, $5::jsonb, $6)
         RETURNING id AS "_id", buyer_id AS buyer, total_amount AS "totalAmount", status,
           payment_method AS "paymentMethod", payment_status AS "paymentStatus",
           subtotal, shipping_amount AS "shippingAmount", shipping_address AS "shippingAddress",
           created_at AS "createdAt"`,
        [req.userId, group.sellerId, group.subtotal, shipping, JSON.stringify(shippingAddress), paymentMethod]
      );
      for (const item of group.items) {
        await client.query(
          'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ($1, $2, $3, $4)',
          [order.rows[0]._id, item.product, item.quantity, item.price]
        );
        await client.query('UPDATE products SET stock = stock - $1, updated_at = NOW() WHERE id = $2', [item.quantity, item.product]);
      }
      await client.query(
        `INSERT INTO notifications (user_id, type, title, message, order_id)
         VALUES ($1, 'order_received', 'New order received', $2, $3)`,
        [group.sellerId, `A buyer placed an order containing ${group.items.length} item${group.items.length === 1 ? '' : 's'} from your store.`, order.rows[0]._id]
      );
      createdOrders.push({ ...order.rows[0], items: group.items });
    }
    await client.query('COMMIT');
    return res.status(201).json({
      message: 'Order created successfully',
      orders: createdOrders,
      order: createdOrders[0],
      shippingTotal: createdOrders.reduce((sum, order) => sum + Number(order.shippingAmount || 0), 0),
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Create order error:', error);
    return res.status(500).json({ error: 'Unable to create order' });
  } finally {
    client.release();
  }
};

const orderQuery = `
  SELECT o.id AS "_id", o.total_amount AS "totalAmount", o.status, o.payment_method AS "paymentMethod",
  o.payment_status AS "paymentStatus", o.subtotal, o.shipping_amount AS "shippingAmount",
  o.shipping_address AS "shippingAddress", o.tracking_number AS "trackingNumber",
  o.cancellation_reason AS "cancellationReason", o.created_at AS "createdAt",
  json_build_object('id', u.id, 'name', u.name, 'email', u.email) AS buyer,
  json_build_object('id', s.id, 'name', s.name) AS seller,
  COALESCE(json_agg(json_build_object('product', json_build_object('id', p.id, 'name', p.name, 'price', oi.price), 'quantity', oi.quantity, 'price', oi.price)) FILTER (WHERE oi.id IS NOT NULL), '[]') AS items
  FROM orders o JOIN users u ON u.id = o.buyer_id LEFT JOIN users s ON s.id = o.seller_id
  LEFT JOIN order_items oi ON oi.order_id = o.id LEFT JOIN products p ON p.id = oi.product_id`;

const getUserOrders = async (req, res) => {
  const result = await query(`${orderQuery} WHERE o.buyer_id = $1 GROUP BY o.id, u.id, s.id ORDER BY o.created_at DESC`, [req.userId]);
  return res.json(result.rows);
};

const getOrderById = async (req, res) => {
  const result = await query(`${orderQuery} WHERE o.id = $1 AND o.buyer_id = $2 GROUP BY o.id, u.id, s.id`, [req.params.id, req.userId]);
  if (!result.rowCount) return res.status(404).json({ error: 'Order not found' });
  return res.json(result.rows[0]);
};

const updateOrderStatus = async (req, res) => {
  const valid = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
  if (!valid.includes(req.body.status)) return res.status(400).json({ error: 'Invalid order status' });
  const current = await query('SELECT status, seller_id FROM orders WHERE id = $1 AND buyer_id = $2', [req.params.id, req.userId]);
  if (!current.rowCount) return res.status(404).json({ error: 'Order not found' });
  if (req.body.status === 'cancelled' && ['shipped', 'delivered'].includes(current.rows[0].status)) {
    return res.status(409).json({ error: 'Shipped or delivered orders cannot be cancelled' });
  }
  const result = await query(
    "UPDATE orders SET status = $1, cancellation_reason = CASE WHEN $1 = 'cancelled' THEN $4 ELSE cancellation_reason END, updated_at = NOW() WHERE id = $2 AND buyer_id = $3 RETURNING id AS \"_id\", status",
    [req.body.status, req.params.id, req.userId, req.body.reason || null]
  );
  if (req.body.status === 'cancelled') {
    const items = await query('SELECT product_id, quantity FROM order_items WHERE order_id = $1', [req.params.id]);
    for (const item of items.rows) {
      await query('UPDATE products SET stock = stock + $1, updated_at = NOW() WHERE id = $2', [item.quantity, item.product_id]);
    }
    if (current.rows[0].seller_id) {
      await query(
        `INSERT INTO notifications (user_id, type, title, message, order_id)
         VALUES ($1, 'order_cancelled', 'Order cancelled by buyer', $2, $3)`,
        [
          current.rows[0].seller_id,
          `Buyer cancelled order #${req.params.id.slice(0, 8).toUpperCase()}${req.body.reason ? `. Reason: ${req.body.reason}` : ''}`,
          req.params.id,
        ]
      );
    }
  }
  return res.json({ message: 'Order status updated', order: result.rows[0] });
};

const getSellerOrders = async (req, res) => {
  const result = await query(
    `SELECT o.id AS "_id", o.status, o.payment_status AS "paymentStatus", o.total_amount AS "totalAmount",
      o.subtotal, o.shipping_amount AS "shippingAmount", o.shipping_address AS "shippingAddress",
      o.tracking_number AS "trackingNumber", o.created_at AS "createdAt",
      json_build_object('id', u.id, 'name', u.name, 'email', u.email) AS buyer,
      COALESCE(json_agg(json_build_object('product', json_build_object('id', p.id, 'name', p.name), 'quantity', oi.quantity, 'price', oi.price)) FILTER (WHERE oi.id IS NOT NULL), '[]') AS items
     FROM orders o JOIN users u ON u.id = o.buyer_id
     LEFT JOIN order_items oi ON oi.order_id = o.id LEFT JOIN products p ON p.id = oi.product_id
     WHERE o.seller_id = $1 GROUP BY o.id, u.id ORDER BY o.created_at DESC`,
    [req.userId]
  );
  return res.json(result.rows);
};

const updateSellerOrder = async (req, res) => {
  const valid = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
  if (!valid.includes(req.body.status)) return res.status(400).json({ error: 'Invalid fulfillment status' });
  const result = await query(
    `WITH updated AS (
       UPDATE orders SET status = $1, tracking_number = COALESCE($2, tracking_number),
         delivered_at = CASE WHEN $1 = 'delivered' THEN NOW() ELSE delivered_at END, updated_at = NOW()
       WHERE id = $3 AND seller_id = $4
         AND (
           ($1 = 'processing' AND status IN ('pending', 'confirmed')) OR
           ($1 = 'shipped' AND status = 'processing') OR
           ($1 = 'delivered' AND status = 'shipped') OR
           ($1 = 'cancelled' AND status IN ('pending', 'confirmed', 'processing'))
         )
       RETURNING id, buyer_id, status, tracking_number, delivered_at
     ),
     notice AS (
       INSERT INTO notifications (user_id, type, title, message, order_id)
       SELECT buyer_id, 'order_status', 'Order status updated',
         CONCAT('Your order is now ', status, CASE WHEN tracking_number IS NOT NULL THEN CONCAT('. Tracking: ', tracking_number) ELSE '' END),
         id
       FROM updated
       RETURNING id
     )
     SELECT updated.id AS "_id", updated.status, updated.tracking_number AS "trackingNumber",
       updated.delivered_at AS "deliveredAt"
     FROM updated`,
    [req.body.status, req.body.trackingNumber || null, req.params.id, req.userId]
  );
  if (!result.rowCount) {
    const owned = await query('SELECT id FROM orders WHERE id = $1 AND seller_id = $2', [req.params.id, req.userId]);
    if (!owned.rowCount) return res.status(404).json({ error: 'Seller order not found' });
    return res.status(409).json({ error: 'Invalid fulfillment transition' });
  }
  return res.json({ message: 'Fulfillment updated', order: result.rows[0] });
};

module.exports = { createOrder, getUserOrders, getOrderById, updateOrderStatus, getSellerOrders, updateSellerOrder };
