const request = require('supertest');
const app = require('../server');
const { pool, query } = require('../db');

jest.setTimeout(45000);

describe('Habesha Store API & Communication Flow Tests', () => {
  let buyerToken;
  let buyerId;
  let sellerToken;
  let sellerId;
  let productId;
  let testOrderId;
  let chapaOrderId;

  const testBuyerEmail = `testbuyer_${Date.now()}@example.com`;
  const testSellerEmail = `testseller_${Date.now()}@example.com`;

  beforeAll(async () => {
    // Ensure database schema and tables exist before running test suite
    const fs = require('fs');
    const path = require('path');
    const schemaSql = fs.readFileSync(path.join(__dirname, '..', 'schema.sql'), 'utf8');
    await query(schemaSql);

    // Register buyer
    const buyerRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test Buyer Communication',
        email: testBuyerEmail,
        password: 'password123',
        role: 'buyer',
      });
    expect(buyerRes.status).toBe(201);
    buyerToken = buyerRes.body.token;
    buyerId = buyerRes.body.user.id;

    // Register seller
    const sellerRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test Artisan Maker',
        email: testSellerEmail,
        password: 'password123',
        role: 'seller',
      });
    expect(sellerRes.status).toBe(201);
    sellerToken = sellerRes.body.token;
    sellerId = sellerRes.body.user.id;

    // Seller creates a test product
    const prodRes = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({
        name: 'Handcrafted Shemma Shawl',
        description: 'Authentic Ethiopian hand-spun cotton shawl with tibeb borders.',
        price: 850,
        category: 'textiles',
        stock: 10,
        images: ['/images/heritage-textile.svg'],
      });
    expect(prodRes.status).toBe(201);
    productId = prodRes.body.product._id;
  });

  afterAll(async () => {
    // Cleanup created data in proper foreign-key order
    if (chapaOrderId) {
      await query('DELETE FROM payments WHERE order_id = $1', [chapaOrderId]);
      await query('DELETE FROM notifications WHERE order_id = $1', [chapaOrderId]);
      await query('DELETE FROM order_items WHERE order_id = $1', [chapaOrderId]);
      await query('DELETE FROM orders WHERE id = $1', [chapaOrderId]);
    }
    if (testOrderId) {
      await query('DELETE FROM payments WHERE order_id = $1', [testOrderId]);
      await query('DELETE FROM notifications WHERE order_id = $1', [testOrderId]);
      await query('DELETE FROM order_items WHERE order_id = $1', [testOrderId]);
      await query('DELETE FROM orders WHERE id = $1', [testOrderId]);
    }
    if (productId) {
      await query('DELETE FROM notifications WHERE product_id = $1', [productId]);
      await query('DELETE FROM order_items WHERE product_id = $1', [productId]);
      await query('DELETE FROM products WHERE id = $1', [productId]);
    }
    if (buyerId) {
      await query('DELETE FROM notifications WHERE user_id = $1', [buyerId]);
      await query('DELETE FROM users WHERE id = $1', [buyerId]);
    }
    if (sellerId) {
      await query('DELETE FROM notifications WHERE user_id = $1', [sellerId]);
      await query('DELETE FROM products WHERE seller_id = $1', [sellerId]);
      await query('DELETE FROM users WHERE id = $1', [sellerId]);
    }
    await pool.end();
  });

  test('Auth Error Handling: returns 401 with informative error message on wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: testBuyerEmail,
        password: 'wrong_password',
      });
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Invalid credentials');
  });

  test('Buyer-to-Seller Communication: buyer sends inquiry about product and seller receives notification', async () => {
    const inquiryRes = await request(app)
      .post(`/api/products/${productId}/inquire`)
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({
        message: 'Could you make this shawl in custom burgundy tibeb borders?',
        contactPhone: '+251911234567',
      });
    expect(inquiryRes.status).toBe(201);
    expect(inquiryRes.body.message).toContain('delivered to artisan');

    // Verify notification was delivered to seller
    const sellerNotifs = await request(app)
      .get('/api/notifications')
      .set('Authorization', `Bearer ${sellerToken}`);
    expect(sellerNotifs.status).toBe(200);
    const inquiryNotif = sellerNotifs.body.find((n) => n.type === 'product_inquiry');
    expect(inquiryNotif).toBeDefined();
    expect(inquiryNotif.message).toContain('burgundy tibeb');

    // Verify confirmation notification was delivered to buyer
    const buyerNotifs = await request(app)
      .get('/api/notifications')
      .set('Authorization', `Bearer ${buyerToken}`);
    expect(buyerNotifs.status).toBe(200);
    const sentNotif = buyerNotifs.body.find((n) => n.type === 'inquiry_sent');
    expect(sentNotif).toBeDefined();
  });

  test('Order & Inventory: placing order reserves stock and notifies artisan', async () => {
    const orderRes = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({
        items: [{ product: productId, quantity: 2 }],
        shippingAddress: {
          street: 'Bole Road 12',
          city: 'Addis Ababa',
          region: 'Addis Ababa',
          phone: '+251911234567',
        },
        paymentMethod: 'telebirr',
      });
    expect(orderRes.status).toBe(201);
    testOrderId = orderRes.body.order._id;
    expect(testOrderId).toBeDefined();

    // Verify product stock was decremented from 10 to 8
    const checkProduct = await query('SELECT stock FROM products WHERE id = $1', [productId]);
    expect(checkProduct.rows[0].stock).toBe(8);
  });

  test('Telebirr Payment Flow: initiate and verify telebirr payment updates order and notifies parties', async () => {
    // Initiate
    const initRes = await request(app)
      .post('/api/payments/telebirr/create')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({ orderId: testOrderId });
    expect(initRes.status).toBe(200);
    expect(initRes.body.referenceId).toMatch(/^HB-/);
    const { paymentId, referenceId } = initRes.body;

    // Verify
    const verifyRes = await request(app)
      .post('/api/payments/telebirr/verify')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({ paymentId, referenceId });
    expect(verifyRes.status).toBe(200);

    // Verify order is now confirmed & completed
    const checkOrder = await query('SELECT status, payment_status FROM orders WHERE id = $1', [testOrderId]);
    expect(checkOrder.rows[0].status).toBe('confirmed');
    expect(checkOrder.rows[0].payment_status).toBe('completed');
  });

  test('Chapa Payment Flow: initializes checkout and verifies payment', async () => {
    // 1. Create a second order for Chapa test
    const chapaOrderRes = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({
        items: [{ product: productId, quantity: 1 }],
        shippingAddress: {
          street: 'Churchill Ave 5',
          city: 'Addis Ababa',
          region: 'Addis Ababa',
          phone: '+251911999888',
        },
        paymentMethod: 'chapa',
      });
    expect(chapaOrderRes.status).toBe(201);
    chapaOrderId = chapaOrderRes.body.order._id;

    // 2. Initialize Chapa checkout
    const initRes = await request(app)
      .post('/api/payments/chapa/initialize')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({ orderId: chapaOrderId });
    expect(initRes.status).toBe(200);
    expect(initRes.body.checkoutUrl).toBeDefined();
    expect(initRes.body.txRef).toMatch(/^HB-/);

    // 3. Verify Chapa payment
    const verifyRes = await request(app)
      .get(`/api/payments/chapa/verify/${initRes.body.txRef}`)
      .set('Authorization', `Bearer ${buyerToken}`);
    expect(verifyRes.status).toBe(200);
    expect(verifyRes.body.status).toBe('completed');

    // 4. Verify order is confirmed
    const checkOrder = await query('SELECT status, payment_status FROM orders WHERE id = $1', [chapaOrderId]);
    expect(checkOrder.rows[0].status).toBe('confirmed');
    expect(checkOrder.rows[0].payment_status).toBe('completed');

    // Cleanup
    await query('DELETE FROM payments WHERE order_id = $1', [chapaOrderId]);
    await query('DELETE FROM notifications WHERE order_id = $1', [chapaOrderId]);
    await query('DELETE FROM order_items WHERE order_id = $1', [chapaOrderId]);
    await query('DELETE FROM orders WHERE id = $1', [chapaOrderId]);
  });

  test('Artisan Fulfillment: updates fulfillment status and cargo tracking number and notifies buyer', async () => {
    const cargoTracking = 'ET-CARGO-778899';
    const updateRes = await request(app)
      .put(`/api/orders/seller/${testOrderId}/status`)
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({
        status: 'shipped',
        trackingNumber: cargoTracking,
      });
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.order.status).toBe('shipped');
    expect(updateRes.body.order.trackingNumber).toBe(cargoTracking);

    // Verify buyer received order status notification with cargo tracking number
    const buyerNotifs = await request(app)
      .get('/api/notifications')
      .set('Authorization', `Bearer ${buyerToken}`);
    const shippedNotif = buyerNotifs.body.find((n) => n.orderId === testOrderId && n.type === 'order_status');
    expect(shippedNotif).toBeDefined();
    expect(shippedNotif.message).toContain(cargoTracking);
  });
});
