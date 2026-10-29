import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { orderAPI, configAPI } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useCartStore } from '../store/cartStore';
import styles from '../styles/checkout.module.css';

const CheckoutPage = () => {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { items, clearCart } = useCartStore();
  const [form, setForm] = useState({ street: '', city: 'Addis Ababa', region: '', phone: '', paymentMethod: 'stripe' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState(null);
  const [configError, setConfigError] = useState('');
  React.useEffect(() => {
    configAPI.getPublic().then((response) => {
      setConfig(response.data);
      const methods = response.data.paymentMethods;
      const firstEnabled = ['stripe', 'telebirr', 'paypal'].find((method) => methods[method]?.enabled);
      if (firstEnabled) setForm((current) => ({ ...current, paymentMethod: firstEnabled }));
    }).catch(() => setConfigError('Payment options are temporarily unavailable.'));
  }, []);
  const total = items.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);
  const sellerTotals = items.reduce((groups, item) => {
    const sellerId = item.seller?.id || item.seller_id || 'unknown';
    groups[sellerId] = (groups[sellerId] || 0) + Number(item.price || 0) * item.quantity;
    return groups;
  }, {});
  const shipping = Object.values(sellerTotals).reduce((sum, sellerTotal) => sum + (sellerTotal >= (config?.shipping.freeThreshold ?? 1000) ? 0 : (config?.shipping.flatRate ?? 50)), 0);

  const submit = async (event) => {
    event.preventDefault();
    if (!user) return router.push('/login?next=/checkout');
    if (user.role !== 'buyer') {
      setError('Seller accounts are for managing listings and fulfillment. Sign in with a buyer account to place an order.');
      return;
    }
    setLoading(true);
    try {
      const response = await orderAPI.create({
        items: items.map((item) => ({ product: item._id, quantity: item.quantity })),
        shippingAddress: { street: form.street, city: form.city, region: form.region, phone: form.phone },
        paymentMethod: form.paymentMethod,
      });
      clearCart();
      router.push(`/order-confirmation?id=${response.data.order._id}`);
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'We could not place this order.');
    } finally { setLoading(false); }
  };

  if (authLoading) return <main className={styles.page}><p>Checking your account...</p></main>;
  if (user?.role === 'seller') return <><Header /><main className={styles.page}><div className={styles.sellerNotice}><h1>Seller workspace</h1><p>Seller accounts manage products and fulfill orders. Shopping checkout is available to buyer accounts.</p><button type="button" onClick={() => router.push('/vendor')}>Open vendor terminal</button></div></main><Footer /></>;
  const paymentMethods = config?.paymentMethods || {};
  const hasPaymentMethod = Object.values(paymentMethods).some((method) => method?.enabled);
  return <><Header /><main className={styles.page}><span className={styles.eyebrow}>Secure checkout</span><h1>Complete your order.</h1><div className={styles.layout}><form className={styles.form} onSubmit={submit}><h2>Delivery details</h2><input required placeholder="Street address" value={form.street} onChange={(e) => setForm({ ...form, street: e.target.value })} /><div className={styles.row}><input required placeholder="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /><input placeholder="Region" value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })} /></div><input required placeholder="Phone number" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /><h2>Payment method</h2>{paymentMethods.stripe?.enabled && <label className={styles.option}><input type="radio" checked={form.paymentMethod === 'stripe'} onChange={() => setForm({ ...form, paymentMethod: 'stripe' })} /> Card / Stripe</label>}{paymentMethods.telebirr?.enabled && <label className={styles.option}><input type="radio" checked={form.paymentMethod === 'telebirr'} onChange={() => setForm({ ...form, paymentMethod: 'telebirr' })} /> Telebirr</label>}{paymentMethods.paypal?.enabled && <label className={styles.option}><input type="radio" checked={form.paymentMethod === 'paypal'} onChange={() => setForm({ ...form, paymentMethod: 'paypal' })} /> PayPal</label>}{!hasPaymentMethod && config && <p className={styles.error}>No payment methods are currently enabled.</p>}{configError && <p className={styles.error}>{configError}</p>}{error && <p className={styles.error}>{error}</p>}<button disabled={loading || !items.length || !config || !hasPaymentMethod}>{loading ? 'Placing order...' : 'Place order →'}</button></form><aside className={styles.summary}>  <h2>Order summary</h2>{items.map((item) => <div className={styles.item} key={item._id}><span>{item.name} × {item.quantity}</span><strong>{config?.currency || 'ETB'} {(Number(item.price) * item.quantity).toFixed(2)}</strong></div>)}<div className={styles.item}><span>Seller shipping</span><strong>{config?.currency || 'ETB'} {shipping.toFixed(2)}</strong></div><div className={styles.total}><span>Total</span><strong>{config?.currency || 'ETB'} {(total + shipping).toFixed(2)}</strong></div></aside></div></main><Footer /></>;
};

export default CheckoutPage;
