import React from 'react';
import Link from 'next/link';
import styles from './Footer.module.css';

const Footer = () => {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.section}>
          <h3>Habesha Store</h3>
          <p>
            An ethical digital sanctuary connecting authentic Ethiopian artisans and producers directly with patrons worldwide.
          </p>
          <span style={{ fontSize: '0.8rem', color: 'var(--color-gold)', display: 'block', marginTop: '0.75rem', fontWeight: 600 }}>
            Crafted with cultural provenance in Ethiopia.
          </span>
        </div>

        <div className={styles.section}>
          <h3>Curated Shop</h3>
          <ul>
            <li><Link href="/products">All Works & Catalog</Link></li>
            <li><Link href="/collections">The Editorial Collections</Link></li>
            <li><Link href="/products?category=textiles">Handwoven Textiles & Tibeb</Link></li>
            <li><Link href="/products?category=coffee">Single-Origin Arabica</Link></li>
            <li><Link href="/products?category=spices">Highland Spices & Berbere</Link></li>
            <li><Link href="/products?category=crafts">Pottery, Wood & Art</Link></li>
          </ul>
        </div>

        <div className={styles.section}>
          <h3>Makers & Heritage</h3>
          <ul>
            <li><Link href="/about">Our Story & Ancestral Craft</Link></li>
            <li><Link href="/register?role=seller">Join as an Artisan Maker</Link></li>
            <li><Link href="/vendor">Vendor Operations Terminal</Link></li>
            <li><Link href="/admin">Platform Administration</Link></li>
          </ul>
        </div>

        <div className={styles.section}>
          <h3>Customer Care</h3>
          <ul>
            <li><Link href="/orders">Live Cargo Order Tracking</Link></li>
            <li><Link href="/wishlist">Saved Treasures Wishlist</Link></li>
            <li><Link href="/dashboard">Collector Account Dashboard</Link></li>
            <li><Link href="/help">Shipping & Returns Policy</Link></li>
            <li><Link href="/payment-history">Payment History & Invoices</Link></li>
          </ul>
        </div>
      </div>

      <div className={styles.bottom}>
        <p>
          &copy; {new Date().getFullYear()} Habesha Store. All rights reserved. Handcrafted in Addis Ababa, Ethiopia.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
