const { query } = require('../db');

const productFields = `
  p.id AS "_id", p.name, p.description, p.price, p.category, p.images, p.stock,
  p.rating, p.review_count AS reviews, p.is_active AS "isActive",
  p.created_at AS "createdAt", json_build_object('id', u.id, 'name', u.name, 'email', u.email) AS seller`;

const getAllProducts = async (req, res) => {
  try {
    const { category, minPrice, maxPrice, search, limit = 10, page = 1 } = req.query;
    const values = [];
    const conditions = ['p.is_active = TRUE'];
    const add = (value) => { values.push(value); return `$${values.length}`; };
    if (category) conditions.push(`p.category = ${add(category)}`);
    if (minPrice) conditions.push(`p.price >= ${add(Number(minPrice))}`);
    if (maxPrice) conditions.push(`p.price <= ${add(Number(maxPrice))}`);
    if (search) conditions.push(`(p.name ILIKE ${add(`%${search}%`)} OR p.description ILIKE $${values.length})`);
    const safeLimit = Math.min(Math.max(Number(limit) || 10, 1), 100);
    const safePage = Math.max(Number(page) || 1, 1);
    const count = await query(`SELECT COUNT(*) FROM products p WHERE ${conditions.join(' AND ')}`, values);
    values.push(safeLimit, (safePage - 1) * safeLimit);
    const products = await query(
      `SELECT ${productFields} FROM products p JOIN users u ON u.id = p.seller_id
       WHERE ${conditions.join(' AND ')} ORDER BY p.created_at DESC LIMIT $${values.length - 1} OFFSET $${values.length}`,
      values
    );
    const total = Number(count.rows[0].count);
    return res.json({ products: products.rows, pagination: { total, page: safePage, limit: safeLimit, pages: Math.ceil(total / safeLimit) } });
  } catch (error) {
    console.error('Get products error:', error);
    return res.status(500).json({ error: 'Unable to load products' });
  }
};

const getProductById = async (req, res) => {
  const product = await query(`SELECT ${productFields} FROM products p JOIN users u ON u.id = p.seller_id WHERE p.id = $1`, [req.params.id]);
  if (!product.rowCount) return res.status(404).json({ error: 'Product not found' });
  const reviews = await query(
    `SELECT r.id AS "_id", r.rating, r.title, r.comment, r.is_verified AS "isVerified", r.created_at AS "createdAt",
     json_build_object('id', u.id, 'name', u.name) AS author
     FROM reviews r JOIN users u ON u.id = r.author_id WHERE r.product_id = $1 ORDER BY r.created_at DESC`,
    [req.params.id]
  );
  return res.json({ product: product.rows[0], reviews: reviews.rows });
};

const createProduct = async (req, res) => {
  const { name, description, price, category = 'other', images = [], stock = 0 } = req.body;
  if (!name || !description || price === undefined || !Number.isFinite(Number(price)) || Number(price) < 0 || !Number.isInteger(Number(stock)) || Number(stock) < 0 || !Array.isArray(images)) {
    return res.status(400).json({ error: 'Name, description, a valid price, stock, and images are required' });
  }
  const result = await query(
    `INSERT INTO products (name, description, price, category, images, stock, seller_id)
     VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7) RETURNING id AS "_id", name, description, price, category, images, stock`,
    [name, description, price, category, JSON.stringify(images), stock, req.userId]
  );
  return res.status(201).json({ message: 'Product created successfully', product: result.rows[0] });
};

const updateProduct = async (req, res) => {
  const allowed = ['name', 'description', 'price', 'category', 'images', 'stock'];
  const keys = Object.keys(req.body).filter((key) => allowed.includes(key));
  if (!keys.length) return res.status(400).json({ error: 'No product fields to update' });
  if (keys.includes('price') && (!Number.isFinite(Number(req.body.price)) || Number(req.body.price) < 0)) return res.status(400).json({ error: 'Price must be a non-negative number' });
  if (keys.includes('stock') && (!Number.isInteger(Number(req.body.stock)) || Number(req.body.stock) < 0)) return res.status(400).json({ error: 'Stock must be a non-negative integer' });
  if (keys.includes('images') && !Array.isArray(req.body.images)) return res.status(400).json({ error: 'Images must be an array' });
  const values = keys.map((key) => key === 'images' ? JSON.stringify(req.body[key]) : req.body[key]);
  const assignments = keys.map((key, index) => `${key} = $${index + 1}${key === 'images' ? '::jsonb' : ''}`).join(', ');
  values.push(req.params.id, req.userId);
  const result = await query(
    `UPDATE products SET ${assignments}, updated_at = NOW() WHERE id = $${values.length - 1} AND seller_id = $${values.length} AND is_active = TRUE
     RETURNING id AS "_id", name, description, price, category, images, stock`,
    values
  );
  if (!result.rowCount) return res.status(404).json({ error: 'Product not found or not authorized' });
  return res.json({ message: 'Product updated successfully', product: result.rows[0] });
};

const deleteProduct = async (req, res) => {
  const result = await query('UPDATE products SET is_active = FALSE, updated_at = NOW() WHERE id = $1 AND seller_id = $2 RETURNING id', [req.params.id, req.userId]);
  if (!result.rowCount) return res.status(404).json({ error: 'Product not found or not authorized' });
  return res.json({ message: 'Product deleted successfully' });
};

const inquireProduct = async (req, res) => {
  const { message, contactPhone } = req.body;
  if (!message || !message.trim()) {
    return res.status(400).json({ error: 'Inquiry message cannot be empty' });
  }

  try {
    const productRes = await query(
      'SELECT p.id, p.name, p.seller_id, u.name AS seller_name FROM products p JOIN users u ON u.id = p.seller_id WHERE p.id = $1 AND p.is_active = TRUE',
      [req.params.id]
    );
    if (!productRes.rowCount) {
      return res.status(404).json({ error: 'Product not found' });
    }
    const product = productRes.rows[0];

    const buyerRes = await query('SELECT id, name, email, phone FROM users WHERE id = $1', [req.userId]);
    if (!buyerRes.rowCount) {
      return res.status(404).json({ error: 'User not found' });
    }
    const buyer = buyerRes.rows[0];
    const contact = contactPhone || buyer.phone || buyer.email;

    // Send notification to seller
    await query(
      `INSERT INTO notifications (user_id, type, title, message, product_id)
       VALUES ($1, 'product_inquiry', $2, $3, $4)`,
      [
        product.seller_id,
        `Inquiry for ${product.name}`,
        `${buyer.name} (${buyer.email}${contact !== buyer.email ? ` · Tel: ${contact}` : ''}) asks: "${message.trim()}"`,
        product.id,
      ]
    );

    // Send confirmation notification to buyer
    await query(
      `INSERT INTO notifications (user_id, type, title, message, product_id)
       VALUES ($1, 'inquiry_sent', $2, $3, $4)`,
      [
        buyer.id,
        `Question sent to ${product.seller_name}`,
        `Your inquiry regarding "${product.name}" was delivered to the maker. They will reach out to you directly.`,
        product.id,
      ]
    );

    return res.status(201).json({ message: 'Inquiry successfully delivered to artisan' });
  } catch (error) {
    console.error('Inquire product error:', error);
    return res.status(500).json({ error: 'Unable to deliver inquiry' });
  }
};

module.exports = { getAllProducts, getProductById, createProduct, updateProduct, deleteProduct, inquireProduct };
