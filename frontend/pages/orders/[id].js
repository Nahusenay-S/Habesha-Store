import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { orderAPI } from '../../lib/api';
import styles from '../../styles/orders.module.css';

const OrderDetailPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const [order, setOrder] = useState(null);
  useEffect(() => { if (id) orderAPI.getById(id).then((response) => setOrder(response.data)).catch(() => setOrder(false)); }, [id]);
  if (order === false) return <main className={styles.message}>Order not found.</main>;
  if (!order) return <main className={styles.message}>Loading order...</main>;
  const steps = ['pending', 'confirmed', 'shipped', 'delivered'];
  const active = steps.indexOf(order.status);
  return <><Header /><main className={styles.page}><Link href="/orders" className={styles.back}>← Order history</Link><span className={styles.eyebrow}>Order tracking</span><h1>#{order._id.slice(0, 8).toUpperCase()}</h1><div className={styles.tracker}>{steps.map((step, index) => <div className={index <= active ? styles.stepActive : styles.step} key={step}><span>{index + 1}</span><strong>{step}</strong></div>)}</div><section className={styles.detail}><h2>Items in this order</h2>{order.items?.map((item) => <div className={styles.item} key={item.product?.id}><span>{item.product?.name} × {item.quantity}</span><strong>ETB {(Number(item.price) * item.quantity).toFixed(2)}</strong></div>)}<div className={styles.total}><span>Total</span><strong>ETB {Number(order.totalAmount).toFixed(2)}</strong></div></section><section className={styles.address}><h2>Delivering to</h2><p>{order.shippingAddress?.street}<br />{order.shippingAddress?.city}, {order.shippingAddress?.region}</p></section></main><Footer /></>;
};
export default OrderDetailPage;
