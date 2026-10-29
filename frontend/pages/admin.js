import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { adminAPI } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import styles from '../styles/admin.module.css';

const AdminPage = () => {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [data, setData] = useState(null);
  const [form, setForm] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) router.replace('/dashboard');
    if (user?.role === 'admin') adminAPI.getOverview().then((response) => { setData(response.data); setForm(response.data.paymentConfig); }).catch((requestError) => setError(requestError.response?.data?.error || 'Unable to load admin console.'));
  }, [authLoading, user, router]);

  const save = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');
    try { const response = await adminAPI.updatePaymentConfig(form); setForm(response.data); setMessage('Payment configuration saved.'); } catch (requestError) { setError(requestError.response?.data?.error || 'Unable to save payment configuration.'); }
  };

  if (authLoading || !user || user.role !== 'admin' || !data || !form) return <main className={styles.message}>Loading administrator console...</main>;
  const updateProvider = (provider, key, value) => setForm((current) => ({ ...current, paymentMethods: { ...current.paymentMethods, [provider]: { ...current.paymentMethods[provider], [key]: value } } }));
  return <><Header /><main className={styles.page}><div className={styles.hero}><div><span className={styles.eyebrow}>Operations tier · Executive control</span><h1>Platform admin console</h1><p>Manage marketplace health, order activity, and configurable payment providers.</p></div><span className={styles.health}>● Platform operational</span></div><section className={styles.metrics}><article><span>Gross merchandise value</span><strong>{form.currency} {Number(data.metrics.revenue.total).toLocaleString()}</strong><small>{data.metrics.revenue.paid_orders} paid orders</small></article><article><span>Active products</span><strong>{data.metrics.products.active}</strong><small>{data.metrics.products.total} total listings</small></article><article><span>Open orders</span><strong>{data.metrics.orders.open}</strong><small>{data.metrics.orders.total} total orders</small></article><article><span>Marketplace users</span><strong>{data.metrics.users.total}</strong><small>{data.metrics.users.sellers} sellers · {data.metrics.users.buyers} buyers</small></article></section><div className={styles.grid}><section className={styles.panel}><div className={styles.panelHeading}><div><span className={styles.eyebrow}>Commerce activity</span><h2>Recent orders</h2></div></div>{data.recentOrders.length ? <div className={styles.orders}>{data.recentOrders.map((order) => <article key={order._id}><div><strong>#{order._id.slice(0, 8).toUpperCase()}</strong><span>{order.buyerName} → {order.sellerName}</span></div><div><b>{form.currency} {Number(order.totalAmount).toFixed(2)}</b><small>{order.status} · {order.paymentStatus}</small></div></article>)}</div> : <p>No orders yet.</p>}</section><section className={styles.panel}><div className={styles.panelHeading}><div><span className={styles.eyebrow}>Runtime configuration</span><h2>Payment & shipping</h2></div></div><form onSubmit={save} className={styles.form}><label>Display currency<input value={form.currency} maxLength="3" onChange={(event) => setForm({ ...form, currency: event.target.value.toUpperCase() })} /></label><div className={styles.two}><label>Flat shipping<input type="number" min="0" step="0.01" value={form.shipping.flatRate} onChange={(event) => setForm({ ...form, shipping: { ...form.shipping, flatRate: event.target.value } })} /></label><label>Free shipping threshold<input type="number" min="0" step="0.01" value={form.shipping.freeThreshold} onChange={(event) => setForm({ ...form, shipping: { ...form.shipping, freeThreshold: event.target.value } })} /></label></div>{['stripe', 'telebirr', 'paypal'].map((provider) => <fieldset key={provider}><legend>{provider}</legend><label className={styles.checkbox}><input type="checkbox" checked={form.paymentMethods[provider].enabled} onChange={(event) => updateProvider(provider, 'enabled', event.target.checked)} /> Enabled for checkout</label>{provider === 'stripe' && <><label>Publishable key<input value={form.paymentMethods.stripe.publishableKey} onChange={(event) => updateProvider('stripe', 'publishableKey', event.target.value)} /></label><label>Stripe currency<input value={form.paymentMethods.stripe.currency} maxLength="3" onChange={(event) => updateProvider('stripe', 'currency', event.target.value.toLowerCase())} /></label></>}{provider === 'telebirr' && <label>Merchant name<input value={form.paymentMethods.telebirr.merchantName} onChange={(event) => updateProvider('telebirr', 'merchantName', event.target.value)} /></label>}{provider === 'paypal' && <label>Client ID<input value={form.paymentMethods.paypal.clientId} onChange={(event) => updateProvider('paypal', 'clientId', event.target.value)} /></label>}</fieldset>)}{message && <p className={styles.success}>{message}</p>}{error && <p className={styles.error}>{error}</p>}<button className={styles.save}>Save configuration</button></form></section></div></main><Footer /></>;
};

export default AdminPage;
