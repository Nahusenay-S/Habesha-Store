import React, { useEffect, useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { vendorAPI, productAPI, orderAPI, notificationAPI } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import styles from '../styles/vendor.module.css';

const VendorPage = () => {
  const { user, loading } = useAuth();
  const [data, setData] = useState({ stats: {}, products: [] });
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [orders, setOrders] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [form, setForm] = useState({ name: '', description: '', price: '', category: 'textiles', stock: '', image: '' });
  const [error, setError] = useState('');
  const loadSummary = () => Promise.all([
    vendorAPI.getSummary(),
    orderAPI.getSellerFulfillment(),
    notificationAPI.getAll(),
  ]).then(([summary, fulfillment, notificationResponse]) => {
    setData(summary.data);
    setOrders(fulfillment.data);
    setNotifications(notificationResponse.data);
  }).catch((requestError) => setError(requestError.response?.data?.error || 'Unable to load your seller workspace.'));
  useEffect(() => { if (user?.role === 'seller') loadSummary(); }, [user]);
  const createProduct = async (event) => {
    event.preventDefault();
    setError('');
    try {
      const payload = { name: form.name, description: form.description, price: Number(form.price), category: form.category, stock: Number(form.stock), images: form.image ? [form.image] : [] };
      if (editingId) await productAPI.update(editingId, payload);
      else await productAPI.create(payload);
      setForm({ name: '', description: '', price: '', category: 'textiles', stock: '', image: '' });
      setEditingId(null);
      setShowForm(false);
      loadSummary();
    } catch (requestError) { setError(requestError.response?.data?.error || 'Unable to create product.'); }
  };
  const editProduct = (product) => {
    setEditingId(product._id);
    setForm({ name: product.name, description: product.description || '', price: product.price, category: product.category, stock: product.stock, image: product.images?.[0] || '' });
    setShowForm(true);
  };
  const archiveProduct = async (id) => {
    setError('');
    try { await productAPI.delete(id); loadSummary(); } catch (requestError) { setError(requestError.response?.data?.error || 'Unable to archive product.'); }
  };
  const updateFulfillment = async (order, status) => {
    setError('');
    try { await orderAPI.updateSellerStatus(order._id, status, order.trackingNumber); loadSummary(); } catch (requestError) { setError(requestError.response?.data?.error || 'Unable to update fulfillment.'); }
  };
  const markNotificationsRead = async () => {
    try { await notificationAPI.markAllRead(); setNotifications((current) => current.map((item) => ({ ...item, isRead: true }))); } catch (requestError) { setError(requestError.response?.data?.error || 'Unable to update notifications.'); }
  };
  if (loading) return <main className={styles.message}>Loading your vendor terminal...</main>;
  if (!user) return <main className={styles.message}>Sign in to open your vendor terminal.</main>;
  if (user.role !== 'seller') return <main className={styles.message}>Vendor access is reserved for artisan accounts.</main>;
  return <><Header /><main className={styles.page}><div className={styles.pageHeader}><div><span className={styles.eyebrow}>Good morning · Vendor terminal</span><h1>Your workshop at a glance.</h1></div><button className={styles.newButton} onClick={() => { setEditingId(null); setShowForm(!showForm); }}>{showForm ? 'Close form' : '+ New listing'}</button></div>
    {notifications.some((item) => !item.isRead) && <section className={styles.notifications}><div className={styles.sectionHeader}><div><span className={styles.eyebrow}>Live seller alerts</span><h2>Recent activity</h2></div><button onClick={markNotificationsRead}>Mark all read</button></div>{notifications.filter((item) => !item.isRead).slice(0, 5).map((item) => <article key={item._id}><strong>{item.title}</strong><p>{item.message}</p><small>{new Date(item.createdAt).toLocaleString()}</small></article>)}</section>}
    {showForm && <form className={styles.productForm} onSubmit={createProduct}><h2>{editingId ? 'Edit listing' : 'Add a new work'}</h2><div className={styles.formGrid}><input required placeholder="Product name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /><input required type="number" min="0" step="0.01" placeholder="Price (ETB)" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /><select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}><option value="textiles">Textiles</option><option value="coffee">Coffee</option><option value="spices">Spices</option><option value="crafts">Crafts</option><option value="jewelry">Jewelry</option><option value="art">Art</option></select><input required type="number" min="0" placeholder="Stock units" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} /><input className={styles.wide} placeholder="Image URL (optional)" value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} /><textarea className={styles.wide} required placeholder="Describe the materials, process, and story" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div><button className={styles.saveButton}>{editingId ? 'Save changes' : 'Publish listing'}</button></form>}{error && <p className={styles.error}>{error}</p>}<div className={styles.stats}><article><span>Gross sales</span><strong>ETB {Number(data.stats.sales || 0).toFixed(2)}</strong><small>Settled sales</small></article><article><span>Units sold</span><strong>{data.stats.units || 0}</strong><small>Across your collection</small></article><article><span>Active products</span><strong>{data.products.filter((item) => item.isActive).length}</strong><small>Available to buyers</small></article><article><span>Orders</span><strong>{data.stats.orders || 0}</strong><small>Orders containing your work</small></article></div><section className={styles.inventory}><header><div><span className={styles.eyebrow}>Inventory tracker</span><h2>Your collection</h2></div></header>{data.products.length ? data.products.map((product) => <div className={styles.product} key={product._id}><img src={product.images?.[0] || '/images/heritage-textile.svg'} onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = '/images/heritage-textile.svg'; }} alt="" /><div><strong>{product.name}</strong><span>{product.category}</span></div><b className={product.stock < 5 ? styles.low : ''}>{product.stock} in stock</b><button onClick={() => editProduct(product)}>Edit</button><button onClick={() => archiveProduct(product._id)}>Archive</button></div>) : <p>No products yet. Add your first work from the seller tools.</p>}</section>
    <section className={styles.fulfillment}><div className={styles.sectionHeader}><div><span className={styles.eyebrow}>Order operations</span><h2>Fulfillment queue</h2></div></div>{orders.length ? orders.map((order) => <article className={styles.order} key={order._id}><div><strong>#{order._id.slice(0, 8).toUpperCase()}</strong><span>{order.buyer?.name} · ETB {Number(order.totalAmount).toFixed(2)}</span><small>{order.items?.map((item) => `${item.product?.name} × ${item.quantity}`).join(', ')}</small></div><select value={order.status} onChange={(event) => updateFulfillment(order, event.target.value)}><option value="confirmed">Confirmed</option><option value="processing">Processing</option><option value="shipped">Shipped</option><option value="delivered">Delivered</option></select></article>) : <p>No seller orders yet. Paid buyer orders will appear here automatically.</p>}</section>
  </main><Footer /></>;
};
export default VendorPage;
