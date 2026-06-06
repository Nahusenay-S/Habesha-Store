import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import Footer from '../components/Footer';
import styles from '../styles/dashboard.module.css';

const DashboardPage = () => {
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user]);

  if (!user) return <div>Loading...</div>;

  return (
    <>
      <Header />
      <div className={styles.container}>
        <h1>Welcome, {user.name}! 👋</h1>

        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <h3>📦 My Orders</h3>
            <p className={styles.statValue}>0</p>
            <a href="/orders">View Orders →</a>
          </div>

          <div className={styles.statCard}>
            <h3>❤️ Wishlist</h3>
            <p className={styles.statValue}>0</p>
            <a href="/wishlist">View Wishlist →</a>
          </div>

          <div className={styles.statCard}>
            <h3>⭐ Reviews</h3>
            <p className={styles.statValue}>0</p>
            <a href="/reviews">View Reviews →</a>
          </div>

          <div className={styles.statCard}>
            <h3>⚙️ Settings</h3>
            <p className={styles.statValue}>→</p>
            <a href="/settings">Edit Profile →</a>
          </div>
        </div>

        {user.role === 'seller' && (
          <div className={styles.sellerSection}>
            <h2>Seller Dashboard</h2>
            <div className={styles.sellerGrid}>
              <div className={styles.sellerCard}>
                <h3>📊 Sales</h3>
                <p className={styles.statValue}>0 Br</p>
                <a href="/seller/analytics">View Analytics →</a>
              </div>

              <div className={styles.sellerCard}>
                <h3>🛒 Products</h3>
                <p className={styles.statValue}>0</p>
                <a href="/seller/products">Manage Products →</a>
              </div>

              <div className={styles.sellerCard}>
                <h3>📋 Orders</h3>
                <p className={styles.statValue}>0</p>
                <a href="/seller/orders">View Orders →</a>
              </div>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </>
  );
};

export default DashboardPage;