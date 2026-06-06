import React from 'react';
import Head from 'next/head';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useRouter } from 'next/router';
import styles from '../styles/home.module.css';

const HomePage = () => {
  const router = useRouter();

  return (
    <>
      <Head>
        <title>Habesha Store - Ethiopian E-Commerce Platform</title>
        <meta name="description" content="Shop authentic Ethiopian products" />
      </Head>

      <Header />

      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <h1>Welcome to Habesha Store 🇪🇹</h1>
          <p>Discover authentic Ethiopian products delivered to your doorstep</p>
          <button
            className={styles.ctaBtn}
            onClick={() => router.push('/products')}
          >
            Shop Now
          </button>
        </div>
        <div className={styles.heroImage}>
          <img
            src="https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=600"
            alt="Ethiopian Coffee"
          />
        </div>
      </section>

      <section className={styles.categories}>
        <h2>Featured Categories</h2>
        <div className={styles.categoryGrid}>
          <div className={styles.categoryCard} onClick={() => router.push('/products?category=coffee')}>
            <span className={styles.emoji}>☕</span>
            <h3>Ethiopian Coffee</h3>
            <p>Premium single-origin coffee</p>
          </div>
          <div className={styles.categoryCard} onClick={() => router.push('/products?category=textiles')}>
            <span className={styles.emoji}>🧣</span>
            <h3>Textiles</h3>
            <p>Traditional woven fabrics</p>
          </div>
          <div className={styles.categoryCard} onClick={() => router.push('/products?category=crafts')}>
            <span className={styles.emoji}>🎨</span>
            <h3>Crafts</h3>
            <p>Handmade traditional art</p>
          </div>
          <div className={styles.categoryCard} onClick={() => router.push('/products?category=spices')}>
            <span className={styles.emoji}>🌶️</span>
            <h3>Spices</h3>
            <p>Authentic Ethiopian spices</p>
          </div>
        </div>
      </section>

      <section className={styles.features}>
        <h2>Why Choose Habesha Store?</h2>
        <div className={styles.featureGrid}>
          <div className={styles.featureCard}>
            <span>✅</span>
            <h3>Authentic Products</h3>
            <p>Direct from Ethiopian artisans</p>
          </div>
          <div className={styles.featureCard}>
            <span>🚚</span>
            <h3>Fast Shipping</h3>
            <p>Reliable delivery service</p>
          </div>
          <div className={styles.featureCard}>
            <span>🔒</span>
            <h3>Secure Payments</h3>
            <p>Safe and encrypted transactions</p>
          </div>
          <div className={styles.featureCard}>
            <span>⭐</span>
            <h3>Trusted Reviews</h3>
            <p>Verified buyer feedback</p>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
};

export default HomePage;