import React from 'react';
import styles from './Footer.module.css';

const Footer = () => {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.section}>
          <h3>Habesha Store</h3>
          <p>Bringing the spirit of Ethiopia to the world through curated artisan partnerships.</p>
        </div>

        <div className={styles.section}>
          <h3>Shop</h3>
          <ul>
            <li><a href="/products">Textiles</a></li>
            <li><a href="/products?category=spices">Spices</a></li>
            <li><a href="/products?category=coffee">Coffee</a></li>
          </ul>
        </div>

        <div className={styles.section}>
          <h3>About</h3>
          <ul>
            <li><a href="/about">Our Artisans</a></li>
            <li><a href="/help">Shipping & Returns</a></li>
            <li><a href="/vendor">Vendor Portal</a></li>
          </ul>
        </div>

        <div className={styles.section}>
          <h3>Stay Updated</h3>
          <p>New stories and collections, delivered occasionally.</p>
          <p>info@habeshastore.com</p>
        </div>
      </div>

      <div className={styles.bottom}>
        <p>&copy; 2024 Habesha Store. Crafted with care in Ethiopia.</p>
      </div>
    </footer>
  );
};

export default Footer;