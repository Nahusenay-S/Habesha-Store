import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { orderAPI } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import styles from '../styles/orders.module.css';

const OrdersPage = () => {
  const { user, loading } = useAuth();
  const [orders, setOrders] = useState([]);
  useEffect(() => { if (user?.role === 'buyer') orderAPI.getAll().then((response) => setOrders(Array.isArray(response.data) ? response.data : response.data.orders || [])).catch(() => setOrders([])); }, [user]);
  if (loading) return <main className={styles.message}>Loading your orders...</main>;
  if (!user) return <><Header /><main className={styles.message}><h1>Sign in to view your orders.</h1><Link href="/login?next=/orders">Sign in to continue</Link></main><Footer /></>;
  if (user.role !== 'buyer') return <><Header /><main className={styles.message}><h1>Orders are part of the buyer workspace.</h1><p>Seller accounts manage fulfillment from the vendor terminal.</p><Link href="/vendor">Open vendor terminal</Link></main><Footer /></>;
  return <><Header /><main className={styles.page}><span className={styles.eyebrow}>Your account</span><h1>Order history.</h1>{orders.length ? <div className={styles.list}>{orders.map((order) => <Link href={`/orders/${order._id}`} className={styles.row} key={order._id}><div><strong>#{order._id.slice(0, 8).toUpperCase()}</strong><span>{new Date(order.createdAt).toLocaleDateString()}</span></div><div><span className={styles.status}>{order.status}</span><strong>ETB {Number(order.totalAmount).toFixed(2)} →</strong></div></Link>)}</div> : <div className={styles.empty}><p>Your order history is waiting for its first story.</p><Link href="/products">Explore the collection →</Link></div>}</main><Footer /></>;
};
export default OrdersPage;
