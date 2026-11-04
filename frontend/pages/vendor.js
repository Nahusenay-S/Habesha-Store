import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Button from '../components/Button';
import Badge from '../components/Badge';
import { vendorAPI, productAPI, orderAPI, notificationAPI, authAPI } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import styles from '../styles/vendor.module.css';

const VendorPage = () => {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('inventory'); // 'inventory' | 'fulfillment' | 'profile'
  const [data, setData] = useState({ stats: {}, products: [] });
  const [orders, setOrders] = useState([]);
  const [orderFilter, setOrderFilter] = useState('all');
  const [notifications, setNotifications] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Product Form State
  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    category: 'textiles',
    stock: '',
    imagesText: '',
  });

  // Store Profile State
  const [storeProfile, setStoreProfile] = useState({
    name: '',
    phone: '',
    city: '',
    region: '',
  });
  const [profileSaving, setProfileSaving] = useState(false);

  const loadSummary = () => {
    Promise.all([
      vendorAPI.getSummary(),
      orderAPI.getSellerFulfillment(),
      notificationAPI.getAll(),
    ])
      .then(([summary, fulfillment, notificationResponse]) => {
        setData(summary.data);
        setOrders(fulfillment.data || []);
        setNotifications(notificationResponse.data || []);
      })
      .catch((err) => setError(err.response?.data?.error || 'Unable to load seller workspace.'));
  };

  useEffect(() => {
    if (user?.role === 'seller') {
      loadSummary();
      setStoreProfile({
        name: user.name || '',
        phone: user.phone || '',
        city: user.address?.city || 'Addis Ababa',
        region: user.address?.region || 'Addis Ababa',
      });
    }
  }, [user]);

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Parse image URLs
    const rawUrls = form.imagesText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
    const images = rawUrls.length ? rawUrls : ['/images/heritage-textile.jpg'];

    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      price: Number(form.price),
      category: form.category,
      stock: Number(form.stock),
      images,
    };

    try {
      if (editingId) {
        await productAPI.update(editingId, payload);
        setSuccess('Product listing updated successfully.');
      } else {
        await productAPI.create(payload);
        setSuccess('New handcrafted piece published to the marketplace.');
      }
      setForm({ name: '', description: '', price: '', category: 'textiles', stock: '', imagesText: '' });
      setEditingId(null);
      setShowForm(false);
      loadSummary();
    } catch (err) {
      setError(err.response?.data?.error || 'Unable to save product.');
    }
  };

  const startEditProduct = (product) => {
    setEditingId(product._id);
    setForm({
      name: product.name,
      description: product.description || '',
      price: product.price,
      category: product.category,
      stock: product.stock,
      imagesText: (product.images || []).join('\n'),
    });
    setShowForm(true);
    window.scrollTo({ top: 300, behavior: 'smooth' });
  };

  const archiveProduct = async (id) => {
    if (!window.confirm('Archive this piece from active listings?')) return;
    setError('');
    try {
      await productAPI.delete(id);
      loadSummary();
    } catch (err) {
      setError(err.response?.data?.error || 'Unable to archive product.');
    }
  };

  const updateFulfillment = async (order, status, trackingNumber) => {
    setError('');
    try {
      const tracking = trackingNumber !== undefined ? trackingNumber : order.trackingNumber;
      await orderAPI.updateSellerStatus(order._id, status, tracking);
      loadSummary();
    } catch (err) {
      setError(err.response?.data?.error || 'Unable to update fulfillment.');
    }
  };

  const handleSaveStoreProfile = async (e) => {
    e.preventDefault();
    setProfileSaving(true);
    setError('');
    setSuccess('');
    try {
      await authAPI.updateProfile({
        name: storeProfile.name,
        phone: storeProfile.phone,
        address: { city: storeProfile.city, region: storeProfile.region },
      });
      setSuccess('Artisan store profile saved.');
    } catch (err) {
      setError(err.response?.data?.error || 'Unable to save store profile.');
    } finally {
      setProfileSaving(false);
    }
  };

  if (loading) {
    return (
      <>
        <Header />
        <main className={styles.message}>
          <p>Opening artisan workspace...</p>
        </main>
        <Footer />
      </>
    );
  }

  if (!user || user.role !== 'seller') {
    return (
      <>
        <Header />
        <main className={styles.message}>
          <h2>Artisan Workspace Restricted</h2>
          <p style={{ margin: '1rem 0' }}>This terminal is reserved for registered Ethiopian makers and sellers.</p>
        </main>
        <Footer />
      </>
    );
  }

  const filteredOrders = orders.filter((o) => {
    if (orderFilter === 'all') return true;
    if (orderFilter === 'pending') return ['pending', 'confirmed'].includes(o.status);
    if (orderFilter === 'transit') return ['processing', 'shipped'].includes(o.status);
    if (orderFilter === 'delivered') return o.status === 'delivered';
    return true;
  });

  return (
    <>
      <Head>
        <title>Artisan Terminal | Habesha Store</title>
      </Head>

      <Header />

      <main className={styles.page}>
        <div className={styles.pageHeader}>
          <div>
            <span className={styles.eyebrow}>Artisan Guild Operations</span>
            <h1>Workshop Terminal</h1>
          </div>
          <Button
            variant="gold"
            size="md"
            onClick={() => {
              setEditingId(null);
              setForm({ name: '', description: '', price: '', category: 'textiles', stock: '', imagesText: '' });
              setShowForm(!showForm);
            }}
          >
            {showForm ? 'Close Form' : '+ New Heritage Listing'}
          </Button>
        </div>

        {/* Navigation Tabs */}
        <div className={styles.navTabs}>
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === 'inventory' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('inventory')}
          >
            📦 Products & Stock ({data.products?.length || 0})
          </button>
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === 'fulfillment' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('fulfillment')}
          >
            ✈️ Fulfillment Queue ({orders.length})
          </button>
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === 'profile' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            🏛️ Artisan Profile
          </button>
        </div>

        {/* Global Notifications */}
        {notifications.some((item) => !item.isRead) && (
          <section className={styles.notifications}>
            <div className={styles.sectionHeader}>
              <h2>Live Artisan Alerts</h2>
              <button
                type="button"
                onClick={async () => {
                  await notificationAPI.markAllRead();
                  setNotifications((curr) => curr.map((n) => ({ ...n, isRead: true })));
                }}
                style={{ background: 'none', border: 'none', color: 'var(--color-gold)', cursor: 'pointer', fontWeight: 600 }}
              >
                Mark all read
              </button>
            </div>
            {notifications.filter((item) => !item.isRead).slice(0, 4).map((item) => (
              <div key={item._id} style={{ padding: '0.4rem 0', borderBottom: '1px solid #f0eae1' }}>
                <strong style={{ color: 'var(--color-green)' }}>{item.title}: </strong>
                <span>{item.message}</span>
              </div>
            ))}
          </section>
        )}

        {/* Metrics Grid */}
        <section className={styles.stats}>
          <article>
            <span>Settled Sales</span>
            <strong>ETB {Number(data.stats?.sales || 0).toFixed(2)}</strong>
            <small>Across confirmed buyer orders</small>
          </article>
          <article>
            <span>Units Sold</span>
            <strong>{data.stats?.units || 0}</strong>
            <small>Handcrafted pieces delivered</small>
          </article>
          <article>
            <span>Active Listings</span>
            <strong>{data.products?.filter((p) => p.isActive).length || 0}</strong>
            <small>Live on public marketplace</small>
          </article>
          <article>
            <span>Fulfillment Orders</span>
            <strong>{orders.filter((o) => !['delivered', 'cancelled'].includes(o.status)).length}</strong>
            <small>Awaiting packing or transit</small>
          </article>
        </section>

        {error && <div style={{ background: '#ffebe8', color: 'var(--color-red)', padding: '0.75rem 1rem', marginBottom: '1.5rem', borderRadius: '4px' }}>✕ {error}</div>}
        {success && <div style={{ background: '#eaf5ee', color: 'var(--color-green)', padding: '0.75rem 1rem', marginBottom: '1.5rem', borderRadius: '4px' }}>✓ {success}</div>}

        {/* Add/Edit Product Form */}
        {showForm && (
          <form className={styles.productForm} onSubmit={handleSaveProduct}>
            <h2>{editingId ? 'Edit Heritage Listing' : 'Publish New Handcrafted Piece'}</h2>
            <div className={styles.formGrid}>
              <div className={styles.field}>
                <label>Product Name</label>
                <input
                  required
                  placeholder="e.g. Traditional Handwoven Tibeb Gabi"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div className={styles.field}>
                <label>Price (ETB)</label>
                <input
                  required
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="2450.00"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                />
              </div>
              <div className={styles.field}>
                <label>Category</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                >
                  <option value="textiles">Handwoven Textiles 🧣</option>
                  <option value="coffee">Highland Coffee ☕</option>
                  <option value="spices">Traditional Spices 🌶️</option>
                  <option value="crafts">Pottery & Crafts 🏺</option>
                  <option value="jewelry">Filigree Jewelry 💎</option>
                  <option value="art">Fine Art & Icons 🖼️</option>
                </select>
              </div>
              <div className={styles.field}>
                <label>Stock Units Available</label>
                <input
                  required
                  type="number"
                  min="0"
                  placeholder="5"
                  value={form.stock}
                  onChange={(e) => setForm({ ...form, stock: e.target.value })}
                />
              </div>
              <div className={`${styles.field} ${styles.wide}`}>
                <label>Photo URLs (One per line or comma-separated)</label>
                <textarea
                  placeholder="https://images.unsplash.com/... or /images/heritage-textile.jpg"
                  value={form.imagesText}
                  onChange={(e) => setForm({ ...form, imagesText: e.target.value })}
                  style={{ minHeight: '60px' }}
                />
              </div>
              <div className={`${styles.field} ${styles.wide}`}>
                <label>Artisan Story & Provenance Description</label>
                <textarea
                  required
                  placeholder="Describe the weaving technique, cotton origin, dyes, and cultural meaning..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
            </div>

            <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem' }}>
              <Button type="submit" variant="primary" size="md">
                {editingId ? 'Save Listing Changes' : 'Publish Piece to Store'}
              </Button>
              <Button type="button" variant="ghost" size="md" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
            </div>
          </form>
        )}

        {/* TAB 1: INVENTORY */}
        {activeTab === 'inventory' && (
          <section className={styles.inventory}>
            <header>
              <h2>Your Public Collection ({data.products?.length || 0})</h2>
            </header>
            {data.products?.length ? (
              data.products.map((product) => (
                <div className={styles.product} key={product._id}>
                  <img
                    src={product.images?.[0] || '/images/heritage-textile.jpg'}
                    alt={product.name}
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = '/images/heritage-textile.jpg';
                    }}
                  />
                  <div>
                    <strong>{product.name}</strong>
                    <span>
                      {product.category} • ETB {Number(product.price).toFixed(2)}
                    </span>
                  </div>
                  <b className={product.stock < 3 ? styles.low : ''}>
                    {product.stock} in stock {product.stock < 3 ? '⚠️ Low' : ''}
                  </b>
                  <div className={styles.actionBtnGroup}>
                    <Button variant="secondary" size="sm" onClick={() => startEditProduct(product)}>
                      Edit
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => archiveProduct(product._id)}>
                      Archive
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <p style={{ color: 'var(--color-gray)' }}>
                No active listings yet. Click &quot;+ New Heritage Listing&quot; above to add your first handcrafted piece.
              </p>
            )}
          </section>
        )}

        {/* TAB 2: FULFILLMENT QUEUE */}
        {activeTab === 'fulfillment' && (
          <section className={styles.fulfillment}>
            <div className={styles.sectionHeader}>
              <h2>Order Fulfillment & Cargo Operations</h2>
            </div>

            {/* Filter buttons */}
            <div className={styles.queueFilters}>
              {['all', 'pending', 'transit', 'delivered'].map((f) => (
                <button
                  key={f}
                  type="button"
                  className={`${styles.queueFilterBtn} ${orderFilter === f ? styles.queueFilterBtnActive : ''}`}
                  onClick={() => setOrderFilter(f)}
                >
                  {f.toUpperCase()}
                </button>
              ))}
            </div>

            {filteredOrders.length ? (
              filteredOrders.map((order) => (
                <article key={order._id} className={styles.orderItem}>
                  <div>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <strong>#{order._id.slice(0, 8).toUpperCase()}</strong>
                      <Badge
                        variant={order.status === 'delivered' ? 'success' : order.status === 'cancelled' ? 'danger' : 'gold'}
                        size="sm"
                      >
                        {order.status}
                      </Badge>
                    </div>
                    <span style={{ display: 'block', margin: '0.35rem 0', color: 'var(--color-gray)', fontSize: '0.85rem' }}>
                      Buyer: {order.buyer?.name} ({order.buyer?.email})
                    </span>
                    <small style={{ color: 'var(--color-green)', fontWeight: 600 }}>
                      Items: {order.items?.map((item) => `${item.product?.name} × ${item.quantity}`).join(', ')}
                    </small>
                    {order.shippingAddress && (
                      <p style={{ margin: '0.4rem 0 0', fontSize: '0.8rem', color: '#666' }}>
                        Destination: {order.shippingAddress.street}, {order.shippingAddress.city}, {order.shippingAddress.region}
                        {order.shippingAddress.phone ? ` • Tel: ${order.shippingAddress.phone}` : ''}
                      </p>
                    )}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <label style={{ fontSize: '0.78rem', color: '#666' }}>Status:</label>
                      <select
                        value={order.status}
                        onChange={(e) => updateFulfillment(order, e.target.value)}
                        style={{ flex: 1, padding: '0.4rem', border: '1px solid var(--color-line)' }}
                      >
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="processing">Processing</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>

                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <input
                        type="text"
                        defaultValue={order.trackingNumber || ''}
                        placeholder="Ethiopian Cargo Tracking #"
                        id={`track-${order._id}`}
                        style={{ flex: 1, padding: '0.4rem', border: '1px solid var(--color-line)', fontSize: '0.8rem' }}
                      />
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          const input = document.getElementById(`track-${order._id}`);
                          if (input) updateFulfillment(order, order.status, input.value.trim());
                        }}
                      >
                        Save
                      </Button>
                    </div>
                  </div>
                </article>
              ))
            ) : (
              <p style={{ color: 'var(--color-gray)' }}>No orders in this fulfillment queue filter.</p>
            )}
          </section>
        )}

        {/* TAB 3: ARTISAN PROFILE */}
        {activeTab === 'profile' && (
          <section className={styles.storeProfile}>
            <h2>Artisan Store Identity</h2>
            <p style={{ color: 'var(--color-gray)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              Your brand name and location are displayed on your product pages and public artisan cards.
            </p>

            <form onSubmit={handleSaveStoreProfile} style={{ maxWidth: '600px', display: 'grid', gap: '1rem' }}>
              <div className={styles.field}>
                <label>Artisan / Workshop Name</label>
                <input
                  required
                  value={storeProfile.name}
                  onChange={(e) => setStoreProfile({ ...storeProfile, name: e.target.value })}
                />
              </div>
              <div className={styles.field}>
                <label>Contact Phone</label>
                <input
                  type="tel"
                  value={storeProfile.phone}
                  onChange={(e) => setStoreProfile({ ...storeProfile, phone: e.target.value })}
                />
              </div>
              <div className={styles.field}>
                <label>Workshop City</label>
                <input
                  value={storeProfile.city}
                  onChange={(e) => setStoreProfile({ ...storeProfile, city: e.target.value })}
                />
              </div>
              <div className={styles.field}>
                <label>Highlands Region</label>
                <input
                  value={storeProfile.region}
                  onChange={(e) => setStoreProfile({ ...storeProfile, region: e.target.value })}
                />
              </div>

              <div style={{ marginTop: '1rem' }}>
                <Button type="submit" variant="primary" size="md" loading={profileSaving}>
                  Update Artisan Profile
                </Button>
              </div>
            </form>
          </section>
        )}
      </main>

      <Footer />
    </>
  );
};

export default VendorPage;
