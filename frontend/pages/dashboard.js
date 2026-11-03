import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { orderAPI, notificationAPI } from '../lib/api';
import { useWishlistStore } from '../store/wishlistStore';
import Header from '../components/Header';
import Footer from '../components/Footer';
import styles from '../styles/dashboard.module.css';
import Icon from '../components/Icon';

const DashboardPage = () => {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [orders, setOrders] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const wishlistItems = useWishlistStore((state) => state.items);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
    if (user?.role === 'admin') {
      router.replace('/admin');
      return;
    }
    if (user?.role === 'buyer') {
      orderAPI.getAll()
        .then((response) => setOrders(Array.isArray(response.data) ? response.data : response.data.orders || []))
        .catch(() => setOrders([]));
      notificationAPI.getAll()
        .then((response) => setNotifications(response.data || []))
        .catch(() => setNotifications([]));
    }
  }, [user, loading, router]);

  if (loading || !user) return <div>Loading your account...</div>;

  // Find latest active order (not yet delivered or cancelled)
  const activeOrder = orders.find((o) => !['delivered', 'cancelled'].includes(o.status)) || orders[0];
  const activeOrderCount = orders.filter((o) => !['delivered', 'cancelled'].includes(o.status)).length;

  return (
    <>
      <Header />
      <div className={styles.container}>
        <aside className={styles.sidebar}>
          <span className={styles.sidebarLabel}>ACCOUNT</span>
          <Link className={styles.activeItem} href="/dashboard">▦ &nbsp; Dashboard Home</Link>
          <Link href="/orders"><Icon name="truck" size={15} /> &nbsp; My Orders</Link>
          <Link href="/wishlist">♡ &nbsp; Wishlist ({wishlistItems.length})</Link>
          <span className={styles.sidebarLabel}>SETTINGS</span>
          <Link href="/payment-history"><Icon name="check" size={15} /> &nbsp; Payment History</Link>
          <Link href="/help">? &nbsp; Help Center</Link>
        </aside>

        <main className={styles.main}>
          <div className={styles.headingRow}>
            <div>
              <h1>Selam, {user.name}</h1>
              <p>Welcome back to your heritage sanctuary.</p>
            </div>
            <div className={styles.statStrip}>
              <div>ACTIVE ORDERS<strong>{activeOrderCount}</strong></div>
              <div>SAVED TREASURES<strong>{wishlistItems.length}</strong></div>
              <div className={styles.goldStat}>TOTAL ORDERS<strong>{orders.length}</strong></div>
            </div>
          </div>

          {/* Unread Alerts & Communications */}
          {notifications.some((n) => !n.isRead) && (
            <section style={{ background: '#fdfbf7', border: '1px solid #c9b084', padding: '1.25rem', marginBottom: '2rem', borderRadius: '4px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <strong style={{ color: '#0b3d2c', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>🔔</span> Recent Updates & Notifications
                </strong>
                <button
                  type="button"
                  onClick={async () => {
                    await notificationAPI.markAllRead();
                    setNotifications((curr) => curr.map((n) => ({ ...n, isRead: true })));
                  }}
                  style={{ background: 'none', border: 'none', color: '#c49a45', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}
                >
                  Mark all read
                </button>
              </div>
              <div style={{ display: 'grid', gap: '0.5rem' }}>
                {notifications.filter((n) => !n.isRead).slice(0, 3).map((n) => (
                  <div key={n._id} style={{ fontSize: '0.88rem', padding: '0.5rem 0', borderBottom: '1px solid #f0eae1' }}>
                    <strong>{n.title}: </strong>
                    <span>{n.message} </span>
                    {n.orderId && <Link href={`/orders/${n.orderId}`} style={{ color: '#0b3d2c', fontWeight: 600, textDecoration: 'underline' }}>View Order →</Link>}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Current Shipment Tracker */}
          <section className={styles.shipment}>
            <div className={styles.sectionHeading}>
              <h2>Current Shipment Status</h2>
              <Link href="/orders">View All History →</Link>
            </div>
            {activeOrder ? (
              <div className={styles.shipmentCard}>
                <div>
                  <span className={styles.status} style={{ textTransform: 'uppercase' }}>
                    {activeOrder.status === 'processing' ? 'IN PROCESSING' : activeOrder.status === 'shipped' ? 'IN TRANSIT' : activeOrder.status}
                  </span>
                  <h3>
                    {activeOrder.items?.[0]?.product?.name || 'Artisan Heritage Piece'}
                    {activeOrder.items?.length > 1 ? ` + ${activeOrder.items.length - 1} more` : ''}
                  </h3>
                  <p>
                    {activeOrder.trackingNumber
                      ? `✦ Via Ethiopian Airlines Cargo • ${activeOrder.trackingNumber}`
                      : `✦ Order #${activeOrder._id?.slice(0, 8).toUpperCase()} • Preparing for dispatch`}
                  </p>
                </div>
                <div>
                  <strong>
                    DELIVERY STATUS<br />
                    <span style={{ fontSize: '0.9rem', color: '#0b3d2c' }}>
                      {activeOrder.status === 'delivered' ? 'Delivered' : '3–5 Business Days'}
                    </span>
                  </strong>
                  <br />
                  <Link href={`/orders/${activeOrder._id}`} style={{ display: 'inline-block', marginTop: '0.5rem', color: '#0b3d2c', fontWeight: 600, fontSize: '0.85rem' }}>
                    Track Order →
                  </Link>
                </div>
              </div>
            ) : (
              <div className={styles.emptyState}>
                You have no active orders right now. <Link href="/products">Explore the collection →</Link>
              </div>
            )}
          </section>

          {/* Saved Treasures / Favorites */}
          <section className={styles.favorites}>
            <div className={styles.sectionHeading}>
              <h2>Saved Treasures</h2>
              <Link href="/wishlist">View Wishlist ({wishlistItems.length}) →</Link>
            </div>
            {wishlistItems.length ? (
              <div className={styles.favoriteGrid}>
                {wishlistItems.slice(0, 3).map((item) => (
                  <div key={item._id}>
                    <img
                      src={item.images?.[0] || '/images/heritage-textile.jpg'}
                      alt={item.name}
                      onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/images/heritage-textile.jpg'; }}
                    />
                    <p>{item.category?.toUpperCase() || 'HERITAGE'}</p>
                    <h3>{item.name}</h3>
                    <strong>ETB {Number(item.price || 0).toFixed(2)}</strong>
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.favoriteGrid}>
                <div>
                  <img src="/images/coffee.jpg" alt="Ethiopian coffee" />
                  <p>COFFEE HERITAGE</p>
                  <h3>Yirgacheffe Single Origin</h3>
                  <strong>ETB 450.00</strong>
                </div>
                <div>
                  <img src="/images/spices.jpg" alt="Ethiopian spices" />
                  <p>CULINARY ARTS</p>
                  <h3>Artisanal Berbere Blend</h3>
                  <strong>ETB 320.00</strong>
                </div>
              </div>
            )}
          </section>
        </main>
      </div>
      <Footer />
    </>
  );
};

export default DashboardPage;