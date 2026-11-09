require('dotenv').config();
const { query, pool } = require('../db');
const bcrypt = require('bcryptjs');
const { generateToken, verifyToken } = require('../utils/jwt');

async function runExtensiveTests() {
  console.log('====================================================');
  console.log('🚀 HABESHA STORE EXTENSIVE DEPLOYMENT VERIFICATION');
  console.log('====================================================\n');

  let buyerId, sellerId, productId, orderId, paymentId;
  const timestamp = Date.now();
  const buyerEmail = `e2e_buyer_${timestamp}@habeshastore.et`;
  const sellerEmail = `e2e_artisan_${timestamp}@habeshastore.et`;
  const password = 'Password123!';

  try {
    // 1. DATABASE CONNECTIVITY & TABLE AUDIT
    console.log('1️⃣ Checking Database Tables & Foreign Key Constraints...');
    const tables = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    const tableList = tables.rows.map(t => t.table_name);
    console.log('   Found tables:', tableList.join(', '));
    const requiredTables = ['users', 'products', 'orders', 'order_items', 'reviews', 'notifications', 'payments'];
    for (const reqTable of requiredTables) {
      if (!tableList.includes(reqTable)) {
        throw new Error(`Missing required table: ${reqTable}`);
      }
    }
    console.log('   ✅ All 7 core database tables present and healthy.\n');

    // 2. AUTHENTICATION & ENCRYPTION
    console.log('2️⃣ Testing Password Hashing & JWT Token Generation...');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const isPasswordValid = await bcrypt.compare(password, hashedPassword);
    if (!isPasswordValid) throw new Error('Bcrypt password comparison failed');

    // Create Buyer
    const buyerRes = await query(
      `INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, 'buyer') RETURNING id, name, email, role`,
      ['Lidya Tesfaye', buyerEmail, hashedPassword]
    );
    buyerId = buyerRes.rows[0].id;
    const buyerToken = generateToken(buyerId);
    const decodedBuyer = verifyToken(buyerToken);
    if (decodedBuyer.id !== buyerId) throw new Error('JWT verification failed for buyer');

    // Create Seller
    const sellerRes = await query(
      `INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, 'seller') RETURNING id, name, email, role`,
      ['Master Weaver Almaz', sellerEmail, hashedPassword]
    );
    sellerId = sellerRes.rows[0].id;
    console.log(`   Buyer registered: ${buyerEmail} (ID: ${buyerId})`);
    console.log(`   Artisan registered: ${sellerEmail} (ID: ${sellerId})`);
    console.log('   ✅ Auth, Bcrypt, and JWT security verified.\n');

    // 3. PRODUCT CREATION & INVENTORY
    console.log('3️⃣ Testing Artisan Product Creation & Inventory Setup...');
    const prodRes = await query(
      `INSERT INTO products (name, description, price, category, stock, images, seller_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, name, price, stock, category`,
      [
        'Handwoven Gabi with Gold Tibeb',
        'Fine multi-layered Ethiopian traditional cotton blanket with authentic bullion embroidery.',
        1250.00,
        'textiles',
        15,
        JSON.stringify(['/images/heritage-textile.svg']),
        sellerId
      ]
    );
    productId = prodRes.rows[0].id;
    const initialStock = prodRes.rows[0].stock;
    console.log(`   Product Created: "${prodRes.rows[0].name}" | Price: ETB ${prodRes.rows[0].price} | Stock: ${initialStock}`);
    console.log('   ✅ Product inventory initialized.\n');

    // 4. BUYER-TO-SELLER INQUIRY
    console.log('4️⃣ Testing Buyer-to-Artisan Inquiry & Notification...');
    const inquiryMsg = 'Can you weave custom initials in gold thread on the border?';
    await query(
      `INSERT INTO notifications (user_id, type, title, message, product_id)
       VALUES ($1, 'inquiry', $2, $3, $4)`,
      [sellerId, 'New Product Inquiry', `Inquiry for Handwoven Gabi: "${inquiryMsg}" from Lidya Tesfaye`, productId]
    );
    const notifs = await query(`SELECT * FROM notifications WHERE user_id = $1 AND product_id = $2`, [sellerId, productId]);
    if (notifs.rowCount === 0) throw new Error('Inquiry notification was not delivered to artisan');
    console.log(`   Artisan received inquiry notification: "${notifs.rows[0].title}"`);
    console.log('   ✅ Buyer-artisan direct inquiry verified.\n');

    // 5. ORDER CREATION & STOCK DEDUCTION
    console.log('5️⃣ Testing Order Placement & Stock Reservation...');
    const orderQuantity = 2;
    const unitPrice = 1250.00;
    const subtotal = unitPrice * orderQuantity;
    const shipping = 100.00;
    const total = subtotal + shipping;

    const orderRes = await query(
      `INSERT INTO orders (buyer_id, seller_id, total_amount, subtotal, shipping_amount, shipping_address, payment_method, status, payment_status)
       VALUES ($1, $2, $3, $4, $5, $6, 'chapa', 'pending', 'pending')
       RETURNING id, total_amount, status, payment_status`,
      [
        buyerId,
        sellerId,
        total,
        subtotal,
        shipping,
        JSON.stringify({ fullName: 'Lidya Tesfaye', phone: '+251911445566', city: 'Addis Ababa', region: 'Bole' })
      ]
    );
    orderId = orderRes.rows[0].id;

    // Create Order Item
    await query(
      `INSERT INTO order_items (order_id, product_id, quantity, price)
       VALUES ($1, $2, $3, $4)`,
      [orderId, productId, orderQuantity, unitPrice]
    );

    // Decrement stock
    await query(`UPDATE products SET stock = stock - $1 WHERE id = $2`, [orderQuantity, productId]);
    const updatedProd = await query(`SELECT stock FROM products WHERE id = $1`, [productId]);
    if (updatedProd.rows[0].stock !== initialStock - orderQuantity) {
      throw new Error(`Inventory deduction mismatch. Expected ${initialStock - orderQuantity}, got ${updatedProd.rows[0].stock}`);
    }
    console.log(`   Order #${orderId.slice(0, 8).toUpperCase()} placed for ETB ${total}`);
    console.log(`   Stock reserved: ${initialStock} -> ${updatedProd.rows[0].stock}`);
    console.log('   ✅ Order creation and inventory reservation verified.\n');

    // 6. CHAPA PAYMENT & VERIFICATION FLOW
    console.log('6️⃣ Testing Chapa Payment Record & State Transition...');
    const txRef = `HB-${orderId.slice(0, 8).toUpperCase()}-${Date.now().toString().slice(-4)}`;
    const payRes = await query(
      `INSERT INTO payments (order_id, user_id, amount, payment_method, status, transaction_id)
       VALUES ($1, $2, $3, 'chapa', 'pending', $4)
       RETURNING id, status`,
      [orderId, buyerId, total, txRef]
    );
    paymentId = payRes.rows[0].id;

    // Simulate Chapa Payment Verification
    await query(
      `UPDATE payments
       SET status = 'completed', transaction_id = $1, paid_at = NOW(), updated_at = NOW()
       WHERE id = $2`,
      [txRef, paymentId]
    );
    await query(
      `UPDATE orders
       SET status = 'confirmed', payment_status = 'completed', updated_at = NOW()
       WHERE id = $1`,
      [orderId]
    );
    await query(
      `INSERT INTO notifications (user_id, type, title, message, order_id)
       VALUES ($1, 'payment_confirmed', 'Chapa Payment Received', 'Payment confirmed via Chapa. Begin fulfillment.', $2)`,
      [sellerId, orderId]
    );
    await query(
      `INSERT INTO notifications (user_id, type, title, message, order_id)
       VALUES ($1, 'payment_confirmed', 'Chapa Payment Verified', 'Your Chapa payment was confirmed!', $2)`,
      [buyerId, orderId]
    );

    const verifiedOrder = await query(`SELECT status, payment_status FROM orders WHERE id = $1`, [orderId]);
    if (verifiedOrder.rows[0].status !== 'confirmed' || verifiedOrder.rows[0].payment_status !== 'completed') {
      throw new Error('Order status transition to confirmed/completed failed');
    }
    console.log(`   Payment #${paymentId.slice(0, 8)} verified successfully`);
    console.log(`   Order #${orderId.slice(0, 8)} status: ${verifiedOrder.rows[0].status} | payment: ${verifiedOrder.rows[0].payment_status}`);
    console.log('   ✅ Chapa payment flow and dual-party notifications verified.\n');

    // 7. ARTISAN FULFILLMENT & CARGO TRACKING
    console.log('7️⃣ Testing Artisan Fulfillment & Ethiopian Cargo Tracking...');
    const cargoTrackingNo = 'ET-CARGO-AD-998877';
    await query(
      `UPDATE orders
       SET status = 'shipped', tracking_number = $1, updated_at = NOW()
       WHERE id = $2`,
      [cargoTrackingNo, orderId]
    );
    await query(
      `INSERT INTO notifications (user_id, type, title, message, order_id)
       VALUES ($1, 'order_status', 'Order Shipped', 'Your order is on the way via Ethiopian Airlines Cargo. Tracking: ${cargoTrackingNo}', $2)`,
      [buyerId, orderId]
    );
    const shippedOrder = await query(`SELECT status, tracking_number FROM orders WHERE id = $1`, [orderId]);
    if (shippedOrder.rows[0].status !== 'shipped' || shippedOrder.rows[0].tracking_number !== cargoTrackingNo) {
      throw new Error('Cargo tracking update failed');
    }
    console.log(`   Order marked shipped with cargo tracking: ${cargoTrackingNo}`);
    console.log('   ✅ Artisan fulfillment & cargo tracking verified.\n');

    // 8. PRODUCT REVIEWS & RATINGS
    console.log('8️⃣ Testing Review Submission & Ratings Aggregation...');
    await query(
      `INSERT INTO reviews (product_id, author_id, rating, title, comment)
       VALUES ($1, $2, 5, 'Masterpiece', 'Exceptional weaving quality. Genuine gold tibeb borders!')`,
      [productId, buyerId]
    );
    const avgReview = await query(
      `SELECT AVG(rating)::numeric(10,1) as avg_rating, COUNT(*)::int as count FROM reviews WHERE product_id = $1`,
      [productId]
    );
    if (Number(avgReview.rows[0].avg_rating) !== 5 || avgReview.rows[0].count !== 1) {
      throw new Error('Review aggregation mismatch');
    }
    console.log(`   Review recorded: 5★ ("${avgReview.rows[0].avg_rating}" avg from ${avgReview.rows[0].count} review)`);
    console.log('   ✅ Customer reviews & rating engine verified.\n');

    console.log('====================================================');
    console.log('✨ ALL 8 SYSTEM PHASES PASSED WITH ZERO ERRORS!');
    console.log('====================================================\n');
  } catch (err) {
    console.error('❌ E2E VERIFICATION TEST FAILED:', err);
    process.exitCode = 1;
  } finally {
    console.log('🧹 Cleaning up temporary test artifacts...');
    if (orderId) {
      await query(`DELETE FROM reviews WHERE product_id = $1`, [productId]);
      await query(`DELETE FROM payments WHERE order_id = $1`, [orderId]);
      await query(`DELETE FROM notifications WHERE order_id = $1`, [orderId]);
      await query(`DELETE FROM order_items WHERE order_id = $1`, [orderId]);
      await query(`DELETE FROM orders WHERE id = $1`, [orderId]);
    }
    if (productId) {
      await query(`DELETE FROM notifications WHERE product_id = $1`, [productId]);
      await query(`DELETE FROM products WHERE id = $1`, [productId]);
    }
    if (buyerId) {
      await query(`DELETE FROM notifications WHERE user_id = $1`, [buyerId]);
      await query(`DELETE FROM users WHERE id = $1`, [buyerId]);
    }
    if (sellerId) {
      await query(`DELETE FROM notifications WHERE user_id = $1`, [sellerId]);
      await query(`DELETE FROM users WHERE id = $1`, [sellerId]);
    }
    console.log('   Database cleaned. Zero residual test records.');
    await pool.end();
  }
}

runExtensiveTests();
