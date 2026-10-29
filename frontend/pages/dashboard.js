import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';
import { orderAPI } from '../lib/api';
import Header from '../components/Header';
import Footer from '../components/Footer';
import styles from '../styles/dashboard.module.css';
import Icon from '../components/Icon';

const DashboardPage = () => {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [orders, setOrders] = React.useState([]);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
    if (user?.role === 'admin') {
      router.replace('/admin');
      return;
    }
    if (user?.role === 'buyer') orderAPI.getAll().then((response) => setOrders(Array.isArray(response.data) ? response.data : response.data.orders || [])).catch(() => setOrders([]));
  }, [user, loading]);

  if (loading || !user) return <div>Loading your account...</div>;

  return (
    <>
      <Header />
      <div className={styles.container}>
        <aside className={styles.sidebar}>
          <span className={styles.sidebarLabel}>ACCOUNT</span>
          <a className={styles.activeItem} href="/dashboard">▦ &nbsp; Dashboard Home</a>
          <a href="/orders"><Icon name="truck" size={15} /> &nbsp; My Orders</a>
          <a href="/wishlist">♡ &nbsp; Wishlist</a>
          <span className={styles.sidebarLabel}>SETTINGS</span>
          <a href="/dashboard#addresses">⌖ &nbsp; Saved Addresses</a>
          <a href="/payment-history"><Icon name="check" size={15} /> &nbsp; Payment Methods</a>
          <a href="/help">? &nbsp; Help Center</a>
        </aside>
        <main className={styles.main}>
          <div className={styles.headingRow}>
            <div><h1>Selam, {user.name}</h1><p>Welcome back to your heritage sanctuary.</p></div>
            <div className={styles.statStrip}><div>ACTIVE ORDERS<strong>{orders.length}</strong></div><div>SAVED TREASURES<strong>0</strong></div><div className={styles.goldStat}>LOYALTY POINTS<strong>4,250 <small>pts</small></strong></div></div>
          </div>
          <section className={styles.shipment}>
            <div className={styles.sectionHeading}><h2>Current Shipments</h2><a href="/orders">View All History →</a></div>
            {orders.length ? <div className={styles.shipmentCard}><div><span className={styles.status}>IN TRANSIT</span><h3>Hand-woven Gabi — Masterpiece Edition</h3><p>✦ Via Ethiopian Airlines Cargo • #{orders[0]._id?.slice(0, 8).toUpperCase()}</p></div><strong>EST. DELIVERY<br />Oct 24, 2024</strong><div className={styles.progress}><span /></div></div> : <div className={styles.emptyState}>Your next heritage delivery will appear here. <a href="/products">Explore the collection →</a></div>}
          </section>
          <section className={styles.favorites}><div className={styles.sectionHeading}><h2>Recent Favorites</h2><a href="/wishlist">→</a></div><div className={styles.favoriteGrid}><div><img src="/images/coffee.svg" alt="Ethiopian coffee" /><p>COFFEE HERITAGE</p><h3>Yirgacheffe Single Origin</h3><strong>24.00 USD</strong></div><div><img src="/images/spices.svg" alt="Ethiopian spices" /><p>CULINARY ARTS</p><h3>Artisanal Berbere Blend</h3><strong>18.50 USD</strong></div></div></section>
        </main>
      </div>
      <Footer />
    </>
  );
};

export default DashboardPage;