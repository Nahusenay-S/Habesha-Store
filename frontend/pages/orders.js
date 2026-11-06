import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Header from '../components/Header';
import Footer from '../components/Footer';
import LoadingScreen from '../components/LoadingScreen';
import EmptyState from '../components/EmptyState';
import Badge from '../components/Badge';
import { orderAPI } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import styles from '../styles/orders.module.css';

const OrdersPage = () => {
  const { user, loading } = useAuth();
  const { t, language } = useLanguage();
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  useEffect(() => {
    if (user?.role === 'buyer') {
      setOrdersLoading(true);
      orderAPI
        .getAll()
        .then((response) => {
          setOrders(Array.isArray(response.data) ? response.data : response.data.orders || []);
        })
        .catch(() => setOrders([]))
        .finally(() => setOrdersLoading(false));
    } else {
      setOrdersLoading(false);
    }
  }, [user]);

  const getOrderStatusVariant = (status) => {
    switch (status?.toLowerCase()) {
      case 'delivered':
        return 'success';
      case 'cancelled':
        return 'danger';
      case 'shipped':
        return 'info';
      case 'processing':
      case 'confirmed':
        return 'gold';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <>
        <Head>
          <title>Order History - Habesha Store</title>
        </Head>
        <Header />
        <LoadingScreen label="Unfolding your order history..." />
        <Footer />
      </>
    );
  }

  if (!user) {
    return (
      <>
        <Head>
          <title>Order History - Habesha Store</title>
        </Head>
        <Header />
        <main className={styles.message}>
          <h1>Sign in to view your orders.</h1>
          <p style={{ color: 'var(--color-gray)', margin: '0.8rem 0 1.5rem' }}>
            Please authenticate to access past purchases and live shipping tracking.
          </p>
          <Link href="/login?next=/orders" style={{ display: 'inline-block', padding: '0.75rem 1.6rem', background: 'var(--color-green)', color: 'white', borderRadius: '4px', textDecoration: 'none', fontWeight: 600 }}>
            Sign In to Continue
          </Link>
        </main>
        <Footer />
      </>
    );
  }

  if (user.role !== 'buyer') {
    return (
      <>
        <Head>
          <title>Order History - Habesha Store</title>
        </Head>
        <Header />
        <main className={styles.message}>
          <h1>Orders are part of the buyer workspace.</h1>
          <p style={{ color: 'var(--color-gray)', margin: '0.8rem 0 1.5rem' }}>
            Seller accounts manage fulfillment and dispatch from the vendor terminal.
          </p>
          <Link href="/vendor" style={{ display: 'inline-block', padding: '0.75rem 1.6rem', background: 'var(--color-green)', color: 'white', borderRadius: '4px', textDecoration: 'none', fontWeight: 600 }}>
            Open Vendor Terminal
          </Link>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Order History - Habesha Store</title>
        <meta name="description" content="View your order history, carrier tracking, and fulfillment updates on Habesha Store." />
      </Head>
      <Header />
      <main className={styles.page}>
        <span className={styles.eyebrow}>{language === 'am' ? 'የእርስዎ መለያ' : 'Your account'}</span>
        <h1 style={{ marginBottom: '1.5rem' }}>{t('orders.title', 'Order history.')}</h1>

        {ordersLoading ? (
          <LoadingScreen compact label={language === 'am' ? 'የትዕዛዝ ታሪክዎን በማምጣት ላይ...' : 'Retrieving your orders...'} />
        ) : orders.length ? (
          <div className={styles.list}>
            {orders.map((order) => {
              const orderId = order._id || order.id || '';
              const orderShort = orderId.toString().slice(0, 8).toUpperCase();
              const statusDisplay =
                order.status === 'delivered'
                  ? t('orders.status_delivered', 'Delivered Safely')
                  : order.status === 'shipped'
                  ? t('orders.status_shipped', 'Shipped via Cargo')
                  : order.status === 'cancelled'
                  ? t('orders.status_cancelled', 'Cancelled')
                  : order.status === 'processing'
                  ? t('orders.status_processing', 'In Workshop')
                  : t('orders.status_pending', 'Pending');
              return (
                <Link href={`/orders/${orderId}`} className={styles.row} key={orderId}>
                  <div>
                    <strong style={{ fontSize: '1.05rem', color: 'var(--color-green)' }}>
                      #{orderShort}
                    </strong>
                    <span>{order.createdAt ? new Date(order.createdAt).toLocaleDateString() : '—'}</span>
                    <small style={{ color: '#666', maxWidth: '340px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {order.items?.map((item) => `${item.product?.name || 'Item'} × ${item.quantity}`).join(', ') || 'Craft piece'}
                    </small>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Badge variant={getOrderStatusVariant(order.status)} size="sm">
                      {statusDisplay}
                    </Badge>
                    <strong style={{ whiteSpace: 'nowrap' }}>
                      {t('common.currency', 'ETB')} {Number(order.totalAmount || 0).toFixed(2)} →
                    </strong>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <EmptyState
            icon="📦"
            title={t('orders.empty_title', 'Your order history is waiting for its first story.')}
            description={t('orders.empty_desc', 'Explore our handwoven textiles, highland spices, and ceremonial coffee to begin your journey.')}
            actionLabel={t('nav.shop', 'Explore the Collection')}
            actionHref="/products"
          />
        )}
      </main>
      <Footer />
    </>
  );
};

export default OrdersPage;
