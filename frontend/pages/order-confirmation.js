import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Footer from '../components/Footer';
import { orderAPI } from '../lib/api';
import styles from '../styles/order-confirmation.module.css';
import Icon from '../components/Icon';

const OrderConfirmationPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const [order, setOrder] = useState(null);
  useEffect(() => { if (id) orderAPI.getById(id).then((response) => setOrder(response.data)).catch(() => setOrder(false)); }, [id]);
  if (order === false) return <main className={styles.message}>Order not found.</main>;
  if (!order) return <main className={styles.message}>Loading your order...</main>;
  return <><main className={styles.page}><Link href="/" className={styles.brand}>Habesha <em>Store</em></Link><div className={styles.check}><Icon name="check" size={28} /></div><div className={styles.amharic}>አመሰግናለሁ</div><h1>Ameseginalehu!</h1><p className={styles.intro}>Your order has been placed successfully. We are honoring your support of Ethiopian craftsmanship and preparing your package with care.</p><div className={styles.cards}><div><span>Order number</span><strong>#{order._id.slice(0, 8).toUpperCase()}</strong><small><Icon name="check" size={13} /> Confirmation sent to your account</small></div><div><span>Estimated delivery</span><strong>3–5 business days</strong><small><Icon name="truck" size={13} /> Shipping from Ethiopia</small></div></div><section className={styles.summary}><header><h2>Order summary</h2><span>{order.items?.length || 0} items</span></header>{order.items?.map((item) => <div className={styles.item} key={item.product?.id}><div><small>{item.product?.seller?.name || 'Habesha artisan'}</small><span>{item.product?.name} × {item.quantity}</span></div><strong>ETB {(Number(item.price) * item.quantity).toFixed(2)}</strong></div>)}<div className={styles.paid}><span>Paid via <strong>{order.paymentMethod || 'secure checkout'}</strong></span><small>Order transaction recorded</small><div><span>Total amount</span><strong>ETB {Number(order.totalAmount).toFixed(2)}</strong></div></div></section><div className={styles.actions}><Link href={`/orders/${order._id}`}><Icon name="truck" size={15} /> Track order</Link><Link href="/products">Back to collection</Link></div><div className={styles.sustainability}><strong><Icon name="heart" size={15} /> Sustainability first</strong><p>Your order supports direct trade with Ethiopian artisans. We use carbon-neutral shipping and recyclable packaging for all orders.</p></div></main><Footer /></>;
};
export default OrderConfirmationPage;
