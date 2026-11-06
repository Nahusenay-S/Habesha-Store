import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { orderAPI, notificationAPI, authAPI, reviewAPI } from '../lib/api';
import { useWishlistStore } from '../store/wishlistStore';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Button from '../components/Button';
import Badge from '../components/Badge';
import EmptyState from '../components/EmptyState';
import Icon from '../components/Icon';
import styles from '../styles/dashboard.module.css';

const DashboardPage = () => {
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  const { t, language } = useLanguage();
  const [orders, setOrders] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'profile' | 'reviews' | 'security'
  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [reviewsLoaded, setReviewsLoaded] = useState(false);
  const wishlistItems = useWishlistStore((state) => state.items);

  // Profile Form State
  const [profileForm, setProfileForm] = useState({
    name: '',
    phone: '',
    street: '',
    city: 'Addis Ababa',
    region: 'Addis Ababa',
  });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');

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

      setProfileForm({
        name: user.name || '',
        phone: user.phone || '',
        street: user.address?.street || '',
        city: user.address?.city || 'Addis Ababa',
        region: user.address?.region || 'Addis Ababa',
      });
    }
  }, [user, loading, router]);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileSuccess('');
    setProfileError('');
    try {
      await authAPI.updateProfile({
        name: profileForm.name,
        phone: profileForm.phone,
        address: {
          street: profileForm.street,
          city: profileForm.city,
          region: profileForm.region,
        },
      });
      setProfileSuccess('Your profile and destination address have been updated successfully.');
    } catch (err) {
      setProfileError(err.response?.data?.error || 'Unable to update profile.');
    } finally {
      setProfileSaving(false);
    }
  };

  if (loading || !user) {
    return (
      <>
        <Header />
        <main className={styles.container}>
          <p>Unfolding your heritage sanctuary...</p>
        </main>
        <Footer />
      </>
    );
  }

  const activeOrder = orders.find((o) => !['delivered', 'cancelled'].includes(o.status)) || orders[0];
  const activeOrderCount = orders.filter((o) => !['delivered', 'cancelled'].includes(o.status)).length;

  return (
    <>
      <Head>
        <title>Collector Sanctuary | Habesha Store</title>
      </Head>

      <Header />

      <div className={styles.container}>
        <aside className={styles.sidebar}>
          <span className={styles.sidebarLabel}>{language === 'am' ? 'የመለያ ክፍል' : 'SANCTUARY'}</span>
          <button
            type="button"
            className={`${styles.sidebarBtn} ${activeTab === 'overview' ? styles.sidebarBtnActive : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <span>▦</span> {language === 'am' ? 'ዳሽቦርድ መነሻ' : 'Dashboard Home'}
          </button>
          <button
            type="button"
            className={`${styles.sidebarBtn} ${activeTab === 'profile' ? styles.sidebarBtnActive : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <span>👤</span> {language === 'am' ? 'የግል መረጃ እና አድራሻ' : 'Profile & Address'}
          </button>
          <button
            type="button"
            className={`${styles.sidebarBtn} ${activeTab === 'security' ? styles.sidebarBtnActive : ''}`}
            onClick={() => setActiveTab('security')}
          >
            <span>🔒</span> {language === 'am' ? 'ደህንነት እና ቅንብሮች' : 'Security & Settings'}
          </button>

          <span className={styles.sidebarLabel}>{language === 'am' ? 'ስብስቦች' : 'COLLECTIONS'}</span>
          <Link href="/orders" className={styles.sidebarBtn}>
            <Icon name="truck" size={15} /> {language === 'am' ? 'የትዕዛዝ ታሪክ' : 'My Orders'} ({orders.length})
          </Link>
          <Link href="/wishlist" className={styles.sidebarBtn}>
            ♡ {language === 'am' ? 'የተወደዱ ቅርሶች' : 'Wishlist'} ({wishlistItems.length})
          </Link>
          <button
            type="button"
            className={`${styles.sidebarBtn} ${activeTab === 'reviews' ? styles.sidebarBtnActive : ''}`}
            onClick={() => {
              setActiveTab('reviews');
              if (!reviewsLoaded) {
                setLoadingReviews(true);
                reviewAPI.getMyReviews()
                  .then((res) => {
                    setReviews(res.data);
                    setReviewsLoaded(true);
                  })
                  .catch(() => setReviews([]))
                  .finally(() => setLoadingReviews(false));
              }
            }}
          >
            <span>⭐</span> {language === 'am' ? 'የሰጠኋቸው አስተያየቶች' : 'My Reviews & Feedback'}
          </button>
          <Link href="/payment-history" className={styles.sidebarBtn}>
            <Icon name="check" size={15} /> {language === 'am' ? 'የክፍያ መዝገቦች' : 'Payment Records'}
          </Link>

          <span className={styles.sidebarLabel}>{language === 'am' ? 'መውጫ' : 'SESSION'}</span>
          <button
            type="button"
            className={styles.sidebarBtn}
            onClick={() => {
              logout();
              router.push('/');
            }}
          >
            🚪 {t('nav.sign_out', 'Sign Out')}
          </button>
        </aside>

        <main className={styles.main}>
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <>
              <div className={styles.headingRow}>
                <div>
                  <h1>{language === 'am' ? `ሰላም፣ ${user.name}` : `Selam, ${user.name}`}</h1>
                  <p>{language === 'am' ? 'ወደ የግል የባህል ቅርስ መለያዎ እንኳን በደህና መጡ።' : 'Welcome back to your curated heritage sanctuary.'}</p>
                </div>
                <div className={styles.statStrip}>
                  <div>{language === 'am' ? 'በሂደት ላይ ያሉ ትዕዛዞች' : 'ACTIVE ORDERS'}<strong>{activeOrderCount}</strong></div>
                  <div>{language === 'am' ? 'የተወደዱ ቅርሶች' : 'SAVED TREASURES'}<strong>{wishlistItems.length}</strong></div>
                  <div className={styles.goldStat}>{language === 'am' ? 'ጠቅላላ ትዕዛዞች' : 'TOTAL ORDERS'}<strong>{orders.length}</strong></div>
                </div>
              </div>

              {/* Unread Alerts & Notifications */}
              {notifications.some((n) => !n.isRead) && (
                <section style={{ background: '#fdfbf7', border: '1px solid #c9b084', padding: '1.25rem', margin: '2rem 0', borderRadius: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <strong style={{ color: 'var(--color-green)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span>🔔</span> {language === 'am' ? 'የቅርብ ጊዜ ማሳወቂያዎች' : 'Recent Updates & Notifications'}
                    </strong>
                    <button
                      type="button"
                      onClick={async () => {
                        await notificationAPI.markAllRead();
                        setNotifications((curr) => curr.map((n) => ({ ...n, isRead: true })));
                      }}
                      style={{ background: 'none', border: 'none', color: 'var(--color-gold)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}
                    >
                      {language === 'am' ? 'ሁሉንም እንደተነበበ ምልክት አድርግ' : 'Mark all read'}
                    </button>
                  </div>
                  <div style={{ display: 'grid', gap: '0.5rem' }}>
                    {notifications.filter((n) => !n.isRead).slice(0, 3).map((n) => (
                      <div key={n._id} style={{ fontSize: '0.88rem', padding: '0.5rem 0', borderBottom: '1px solid #f0eae1' }}>
                        <strong>{n.title}: </strong>
                        <span>{n.message} </span>
                        {n.orderId && (
                          <Link href={`/orders/${n.orderId}`} style={{ color: 'var(--color-green)', fontWeight: 600, textDecoration: 'underline' }}>
                            {language === 'am' ? 'ትዕዛዙን ይመልከቱ →' : 'View Order →'}
                          </Link>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Current Shipment Status */}
              <section className={styles.shipment}>
                <div className={styles.sectionHeading}>
                  <h2>{language === 'am' ? 'የአሁኑ የበረራ ማጓጓዣ ሁኔታ' : 'Current Shipment Status'}</h2>
                  <Link href="/orders">{language === 'am' ? 'ሁሉንም ትዕዛዞች እይ →' : 'View All History →'}</Link>
                </div>
                {activeOrder ? (
                  <div className={styles.shipmentCard}>
                    <div>
                      <span className={styles.status} style={{ textTransform: 'uppercase' }}>
                        {activeOrder.status === 'processing' ? (language === 'am' ? 'በመዘጋጀት ላይ' : 'IN PROCESSING') : activeOrder.status === 'shipped' ? (language === 'am' ? 'በጉዞ ላይ' : 'IN TRANSIT') : activeOrder.status}
                      </span>
                      <h3>
                        {activeOrder.items?.[0]?.product?.name || (language === 'am' ? 'የኢትዮጵያ ባህላዊ ቅርስ' : 'Artisan Heritage Piece')}
                        {activeOrder.items?.length > 1 ? ` + ${activeOrder.items.length - 1} ${language === 'am' ? 'ተጨማሪ' : 'more'}` : ''}
                      </h3>
                      <p>
                        {activeOrder.trackingNumber
                          ? (language === 'am' ? `✦ በኢትዮጵያ አየር መንገድ ካርጎ • ${activeOrder.trackingNumber}` : `✦ Via Ethiopian Airlines Cargo • ${activeOrder.trackingNumber}`)
                          : (language === 'am' ? `✦ ትዕዛዝ #${activeOrder._id?.slice(0, 8).toUpperCase()} • ለመላክ በመዘጋጀት ላይ` : `✦ Order #${activeOrder._id?.slice(0, 8).toUpperCase()} • Preparing for dispatch`)}
                      </p>
                    </div>
                    <div>
                      <strong>
                        {language === 'am' ? 'የመድረሻ ሁኔታ' : 'DELIVERY STATUS'}<br />
                        <span style={{ fontSize: '0.9rem', color: 'var(--color-green)' }}>
                          {activeOrder.status === 'delivered' ? (language === 'am' ? 'ደርሷል' : 'Delivered') : (language === 'am' ? 'ከ3 እስከ 5 የስራ ቀናት' : '3–5 Business Days')}
                        </span>
                      </strong>
                      <br />
                      <Link href={`/orders/${activeOrder._id}`} style={{ display: 'inline-block', marginTop: '0.5rem', color: 'var(--color-green)', fontWeight: 600, fontSize: '0.85rem' }}>
                        {language === 'am' ? 'ትዕዛዝ ተከታተል →' : 'Track Order →'}
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className={styles.emptyState}>
                    {language === 'am' ? 'በአሁኑ ጊዜ በሂደት ላይ ያለ ትዕዛዝ የለም። ' : 'You have no active orders right now. '}
                    <Link href="/products">{language === 'am' ? 'ቅርሶችን ይጎብኙ →' : 'Explore the collection →'}</Link>
                  </div>
                )}
              </section>

              {/* Saved Treasures */}
              <section className={styles.favorites}>
                <div className={styles.sectionHeading}>
                  <h2>{t('wishlist.title', 'Saved Treasures')}</h2>
                  <Link href="/wishlist">{language === 'am' ? `የተወደዱትን እይ (${wishlistItems.length}) →` : `View Wishlist (${wishlistItems.length}) →`}</Link>
                </div>
                {wishlistItems.length ? (
                  <div className={styles.favoriteGrid}>
                    {wishlistItems.slice(0, 3).map((item) => (
                      <div key={item._id}>
                        <img
                          src={item.images?.[0] || '/images/heritage-textile.jpg'}
                          alt={item.name}
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = '/images/heritage-textile.jpg';
                          }}
                        />
                        <p>{item.category?.toUpperCase() || 'HERITAGE'}</p>
                        <h3>{item.name}</h3>
                        <strong>{t('common.currency', 'ETB')} {Number(item.price || 0).toFixed(2)}</strong>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className={styles.favoriteGrid}>
                    <div>
                      <img src="/images/coffee.jpg" alt="Ethiopian coffee" />
                      <p>{language === 'am' ? 'የቡና ቅርስ' : 'COFFEE HERITAGE'}</p>
                      <h3>{language === 'am' ? 'የይርጋጨፌ የተመረጠ ቡና' : 'Yirgacheffe Single Origin'}</h3>
                      <strong>{t('common.currency', 'ETB')} 450.00</strong>
                    </div>
                    <div>
                      <img src="/images/spices.jpg" alt="Ethiopian spices" />
                      <p>{language === 'am' ? 'የደጋ ቅመም' : 'CULINARY ARTS'}</p>
                      <h3>{language === 'am' ? 'ባህላዊ የበርበሬ ድብልቅ' : 'Artisanal Berbere Blend'}</h3>
                      <strong>{t('common.currency', 'ETB')} 320.00</strong>
                    </div>
                  </div>
                )}
              </section>
            </>
          )}

          {/* TAB 2: PROFILE & ADDRESS */}
          {activeTab === 'profile' && (
            <div className={styles.profileBox}>
              <h2>{language === 'am' ? 'የግል መረጃ እና የመላኪያ አድራሻ' : 'Personal Information & Delivery Destination'}</h2>
              <p className={styles.profileSubtext}>
                {language === 'am' ? 'ዕቃዎች በቀጥታ የሚላኩበትን ስልክ ቁጥር እና የመኖሪያ አድራሻዎን ያስተካክሉ።' : 'Manage your primary contact and shipping address for express courier deliveries.'}
              </p>

              {profileSuccess && (
                <div style={{ background: '#eaf5ee', color: 'var(--color-green)', padding: '0.75rem 1rem', marginTop: '1rem', border: '1px solid #b7dfca', borderRadius: '4px' }}>
                  ✓ {language === 'am' ? 'መረጃዎ በተሳካ ሁኔታ ተሻሽሏል።' : profileSuccess}
                </div>
              )}
              {profileError && (
                <div style={{ background: '#fdf2f2', color: '#9c3d2d', padding: '0.75rem 1rem', marginTop: '1rem', border: '1px solid #f8b4b4', borderRadius: '4px' }}>
                  ✕ {profileError}
                </div>
              )}

              <form onSubmit={handleProfileSubmit}>
                <div className={styles.formGrid}>
                  <div className={styles.formField}>
                    <label htmlFor="name">{language === 'am' ? 'ሙሉ ስም' : 'Full Name'}</label>
                    <input
                      id="name"
                      type="text"
                      required
                      value={profileForm.name}
                      onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                    />
                  </div>
                  <div className={styles.formField}>
                    <label htmlFor="phone">{language === 'am' ? 'ስልክ ቁጥር' : 'Phone Number'}</label>
                    <input
                      id="phone"
                      type="tel"
                      placeholder="+251 91 123 4567"
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                    />
                  </div>
                  <div className={`${styles.formField} ${styles.fullWidthField}`}>
                    <label htmlFor="street">{language === 'am' ? 'የመንገድ ስም / የቤት ቁጥር' : 'Street Address'}</label>
                    <input
                      id="street"
                      type="text"
                      placeholder={language === 'am' ? 'ለምሳሌ ቦሌ መድሃኒአለም፣ የቤት ቁጥር 45' : 'e.g. Bole Medhanialem, House 45'}
                      value={profileForm.street}
                      onChange={(e) => setProfileForm({ ...profileForm, street: e.target.value })}
                    />
                  </div>
                  <div className={styles.formField}>
                    <label htmlFor="city">{language === 'am' ? 'ከተማ / ክፍለ ከተማ' : 'City / Sub-city'}</label>
                    <input
                      id="city"
                      type="text"
                      value={profileForm.city}
                      onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })}
                    />
                  </div>
                  <div className={styles.formField}>
                    <label htmlFor="region">{language === 'am' ? 'ክልል' : 'Region'}</label>
                    <input
                      id="region"
                      type="text"
                      value={profileForm.region}
                      onChange={(e) => setProfileForm({ ...profileForm, region: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ marginTop: '2rem' }}>
                  <Button type="submit" variant="primary" size="md" loading={profileSaving}>
                    {t('dashboard.save_changes', 'Save Changes')}
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 3: SECURITY & SETTINGS */}
          {activeTab === 'security' && (
            <div className={styles.profileBox}>
              <h2>{language === 'am' ? 'ደህንነት እና የመለያ መረጃ' : 'Security & Account Credentials'}</h2>
              <p className={styles.profileSubtext}>
                {language === 'am' ? 'የመለያዎ ደህንነት እና የአባልነት ደረጃ ዝርዝሮች።' : 'Details regarding your authenticated session and marketplace status.'}
              </p>

              <div style={{ margin: '1.5rem 0', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ padding: '1rem', background: 'var(--color-cream)', borderRadius: '4px' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--color-gray)' }}>{language === 'am' ? 'የኢሜይል አድራሻ:' : 'Account Email:'}</span>
                  <p style={{ margin: '0.2rem 0', fontWeight: 600 }}>{user.email}</p>
                  <Badge variant="success" size="sm">{language === 'am' ? 'የተረጋገጠ ኢሜይል' : 'Verified Email'}</Badge>
                </div>

                <div style={{ padding: '1rem', background: 'var(--color-cream)', borderRadius: '4px' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--color-gray)' }}>{language === 'am' ? 'የተጠቃሚ ሚና:' : 'Marketplace Role:'}</span>
                  <p style={{ margin: '0.2rem 0', fontWeight: 600, textTransform: 'capitalize' }}>{user.role} Account</p>
                  <Badge variant="gold" size="sm">{language === 'am' ? 'የተረጋገጠ ደንበኛ' : 'Ethical Custodian Tier'}</Badge>
                </div>

                <div style={{ padding: '1rem', background: 'var(--color-cream)', borderRadius: '4px' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--color-gray)' }}>{language === 'am' ? 'የመለያ ሁኔታ:' : 'Session:'}</span>
                  <p style={{ margin: '0.2rem 0' }}>{language === 'am' ? 'በደህንነቱ በተጠበቀ JWT ቶከን የተረጋገጠ ክፍለ ጊዜ።' : 'Authenticated via JWT token with local credential isolation.'}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    style={{ marginTop: '0.5rem' }}
                    onClick={() => {
                      logout();
                      router.push('/login');
                    }}
                  >
                    {language === 'am' ? 'ከሁሉም ክፍለ ጊዜዎች ውጣ' : 'Terminate Current Session'}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: REVIEWS & FEEDBACK */}
          {activeTab === 'reviews' && (
            <div>
              <span className={styles.eyebrow}>{language === 'am' ? 'የደንበኞች ድምጽ' : 'COMMUNITY VOICE'}</span>
              <h2 className={styles.tabHeading}>{language === 'am' ? 'የሰጠኋቸው አስተያየቶች' : 'My Reviews & Artisan Feedback'}</h2>
              <p style={{ color: 'var(--color-gray)', marginBottom: '1.5rem', fontSize: '0.92rem' }}>
                {language === 'am' ? 'ስለ ዕደ-ጥበብ ስራዎች የሰጧቸው እውነተኛ አስተያየቶች።' : 'Your genuine feedback celebrating Ethiopian craftsmanship and artisan workshops.'}
              </p>

              {loadingReviews ? (
                <p style={{ padding: '2rem 0', textAlign: 'center', color: 'var(--color-gray)' }}>{t('common.loading', 'Loading...')}</p>
              ) : reviews.length === 0 ? (
                <EmptyState
                  icon="⭐"
                  title={language === 'am' ? 'እስካሁን የሰጡት አስተያየት የለም' : 'No reviews published yet'}
                  description={language === 'am' ? 'የገዟቸውን ዕቃዎች ጥራት በመገምገም ለሌሎች ደንበኞች እና ለባለሙያዎች አጋዥ መረጃ ያካፍሉ።' : 'You have not reviewed any acquired pieces yet. Share your experience to help fellow collectors and support Ethiopian creators.'}
                  actionLabel={language === 'am' ? 'ስብስቦቹን ይጎብኙ' : 'Explore Artisan Collections'}
                  actionHref="/collections"
                />
              ) : (
                <div style={{ display: 'grid', gap: '1.25rem' }}>
                  {reviews.map((rev) => (
                    <article
                      key={rev._id}
                      style={{
                        background: '#ffffff',
                        border: '1px solid var(--color-line)',
                        padding: '1.5rem',
                        display: 'flex',
                        gap: '1.5rem',
                        alignItems: 'flex-start',
                      }}
                    >
                      <img
                        src={rev.productDetails?.images?.[0] || '/images/heritage-textile.jpg'}
                        alt={rev.productDetails?.name || 'Product'}
                        style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '2px', border: '1px solid var(--color-line)' }}
                        onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/images/heritage-textile.jpg'; }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                          <div>
                            <Link
                              href={`/products/${rev.product}`}
                              style={{ color: 'var(--color-green)', fontWeight: 700, fontSize: '1rem', textDecoration: 'none' }}
                            >
                              {rev.productDetails?.name || (language === 'am' ? 'የኢትዮጵያ ቅርስ' : 'Heritage Piece')}
                            </Link>
                            <div style={{ color: 'var(--color-gold)', fontSize: '0.9rem', margin: '0.25rem 0' }}>
                              {'★'.repeat(rev.rating)}{'☆'.repeat(5 - rev.rating)}
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            {rev.isVerified && <Badge variant="success" size="sm">{t('home.verified_collector', 'Verified Collector')}</Badge>}
                            <small style={{ color: 'var(--color-gray)', fontSize: '0.8rem' }}>
                              {new Date(rev.createdAt).toLocaleDateString()}
                            </small>
                          </div>
                        </div>
                        <h4 style={{ color: 'var(--color-dark)', margin: '0.5rem 0 0.3rem', fontSize: '0.95rem' }}>{rev.title}</h4>
                        <p style={{ color: 'var(--color-gray)', fontSize: '0.88rem', lineHeight: 1.5, margin: 0 }}>{rev.comment}</p>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      <Footer />
    </>
  );
};

export default DashboardPage;
