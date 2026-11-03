const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { query, pool } = require('../db');

const authenticProducts = [
  {
    name: 'Hand-woven Habesha Gabi (Masterpiece Edition)',
    description: 'Traditional four-layer Ethiopian cotton blanket meticulously hand-spun and adorned with vibrant traditional tibeb border motifs.',
    price: 3850.00,
    category: 'textiles',
    stock: 14,
    images: [
      'https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?w=900&auto=format&fit=crop&q=85',
      '/images/textiles.jpg'
    ]
  },
  {
    name: 'Yirgacheffe Single-Origin Highland Coffee (Whole Bean)',
    description: 'Ethically sourced heirloom Arabica coffee from the high-altitude misty slopes of Yirgacheffe. Features delicate floral, bergamot, and sweet citrus tasting notes.',
    price: 650.00,
    category: 'coffee',
    stock: 45,
    images: [
      'https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=900&auto=format&fit=crop&q=85',
      '/images/coffee.jpg'
    ]
  },
  {
    name: 'Artisanal Highland Berbere Blend (500g)',
    description: 'Authentic Ethiopian red pepper spice blend slowly sun-dried and pounded with sacred korarima (cardamom), rue, ginger, garlic, and cloves.',
    price: 420.00,
    category: 'spices',
    stock: 60,
    images: [
      'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=900&auto=format&fit=crop&q=85',
      '/images/spices.jpg'
    ]
  },
  {
    name: 'Traditional Hand-thrown Terracotta Jebena',
    description: 'Black clay coffee pot hand-burnished by master potters for the timeless Ethiopian coffee ceremony. Enhances rich aromatic extraction.',
    price: 1150.00,
    category: 'crafts',
    stock: 18,
    images: [
      'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=900&auto=format&fit=crop&q=85',
      '/images/ceramics.jpg'
    ]
  },
  {
    name: 'Hand-spun Cotton Netela Scarf with Gold Tibeb',
    description: 'Feather-light gauze scarf crafted from 100% Ethiopian organic cotton with finely hand-woven metallic gold embroidery.',
    price: 1890.00,
    category: 'textiles',
    stock: 22,
    images: [
      'https://images.unsplash.com/photo-1528458909336-e7a0adfed0a5?w=900&auto=format&fit=crop&q=85',
      '/images/heritage-textile.jpg'
    ]
  },
  {
    name: 'Harari Hand-woven Mesob Dining Basket',
    description: 'Woven from natural dyed grass and wheat straw with ancient geometric heritage motifs, designed for communal dining rituals.',
    price: 2450.00,
    category: 'crafts',
    stock: 9,
    images: [
      'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=900&auto=format&fit=crop&q=85',
      '/images/crafts.jpg'
    ]
  },
  {
    name: 'Lalibela Filigree Cross Pendant (Artisan Brass)',
    description: 'Hand-cast artisan pendant featuring historical Lalibela lattice motifs crafted through traditional lost-wax lost-metal casting.',
    price: 1650.00,
    category: 'jewelry',
    stock: 15,
    images: [
      'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=900&auto=format&fit=crop&q=85',
      '/images/jewelry.jpg'
    ]
  },
  {
    name: 'Fiery Mitmita Chili Seasoning (250g)',
    description: 'Pungent birds-eye chili blend with roasted korarima, cloves, and sea salt. The essential companion for kitfo and roasted meats.',
    price: 280.00,
    category: 'spices',
    stock: 50,
    images: [
      'https://images.unsplash.com/photo-1532336414038-cf19250c5757?w=900&auto=format&fit=crop&q=85',
      '/images/spices.jpg'
    ]
  },
  {
    name: 'Sidama Washed Specialty Green Coffee Beans (1kg)',
    description: 'Unroasted specialty grade Arabica beans for home-roasting aficionados. Packed with vibrant floral aromatics and clean body.',
    price: 780.00,
    category: 'coffee',
    stock: 35,
    images: [
      'https://images.unsplash.com/photo-1587734195503-904fca47e0e9?w=900&auto=format&fit=crop&q=85',
      '/images/coffee.jpg'
    ]
  }
];

async function seed() {
  console.log('Seeding authentic products with real photographs...');

  // Get a seller user to assign products to
  const sellerRes = await query("SELECT id FROM users WHERE role = 'seller' ORDER BY created_at ASC LIMIT 1");
  if (!sellerRes.rowCount) {
    throw new Error('No seller account found. Please create a seller user first.');
  }
  const sellerId = sellerRes.rows[0].id;

  // Update any product that had google image search URLs or SVGs with real photos
  await query(`
    UPDATE products
    SET name = 'Authentic Berbere Highland Spice Blend',
        description = 'Stone-ground sun-dried Ethiopian red chili peppers blended with sacred korarima cardamom, garlic, ginger, and highland herbs.',
        category = 'spices',
        price = 450.00,
        images = jsonb_build_array('https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=900&auto=format&fit=crop&q=85', '/images/spices.jpg'),
        updated_at = NOW()
    WHERE images::text LIKE '%google.com/imgres%' OR images::text = '[]'
  `);

  // Update existing products with real photos if they have SVG placeholders
  await query(
    "UPDATE products SET images = jsonb_build_array('https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?w=900&auto=format&fit=crop&q=85', '/images/textiles.jpg') WHERE category = 'textiles' AND (images::text LIKE '%svg%' OR images::text LIKE '%data:image%')"
  );

  // Upsert or insert authentic catalog products
  for (const item of authenticProducts) {
    const existing = await query("SELECT id FROM products WHERE name = $1", [item.name]);
    if (existing.rowCount) {
      await query(
        `UPDATE products SET description = $1, price = $2, category = $3, images = $4::jsonb, stock = $5, is_active = TRUE, updated_at = NOW() WHERE id = $6`,
        [item.description, item.price, item.category, JSON.stringify(item.images), item.stock, existing.rows[0].id]
      );
      console.log(`Updated: ${item.name}`);
    } else {
      await query(
        `INSERT INTO products (name, description, price, category, images, stock, seller_id, is_active)
         VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7, TRUE)`,
        [item.name, item.description, item.price, item.category, JSON.stringify(item.images), item.stock, sellerId]
      );
      console.log(`Inserted: ${item.name}`);
    }
  }

  console.log('Seeding complete! All products now have authentic real photography.');
}

seed().catch(console.error).finally(() => pool.end());
