import React from 'react';
import styles from './Footer.module.css';

const Footer = () => {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.section}>
          <h3>About Habesha Store</h3>
          <p>Your trusted marketplace for authentic Ethiopian products.</p>
        </div>

        <div className={styles.section}>
          <h3>Quick Links</h3>
          <ul>
            <li><a href="/">Home</a></li>
            <li><a href="/products">Products</a></li>
            <li><a href="/about">About</a></li>
            <li><a href="/contact">Contact</a></li>
          </ul>
        </div>

        <div className={styles.section}>
          <h3>Categories</h3>
          <ul>
            <li><a href="/products?category=coffee">Coffee</a></li>
            <li><a href="/products?category=textiles">Textiles</a></li>
            <li><a href="/products?category=crafts">Crafts</a></li>
            <li><a href="/products?category=spices">Spices</a></li>
          </ul>
        </div>

        <div className={styles.section}>
          <h3>Contact</h3>
          <p>Email: info@habeshastore.com</p>
          <p>Phone: +251-XXX-XXXXXX</p>
          <p>Addis Ababa, Ethiopia</p>
        </div>
      </div>

      <div className={styles.bottom}>
        <p>&copy; 2024 Habesha Store. All rights reserved. Built with ❤️</p>
      </div>
    </footer>
  );
};

export default Footer;