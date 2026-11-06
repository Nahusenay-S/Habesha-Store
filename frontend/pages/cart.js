import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Button from '../components/Button';
import Badge from '../components/Badge';
import EmptyState from '../components/EmptyState';
import Icon from '../components/Icon';
import LoadingScreen from '../components/LoadingScreen';
import { useCartStore } from '../store/cartStore';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { configAPI } from '../lib/api';
import styles from '../styles/cart.module.css';

const VALID_COUPONS = {
  HABESHA10: { type: 'percent', value: 0.1, label: '10% Cultural Patron Discount' },
  CULTURE15: { type: 'percent', value: 0.15, label: '15% Heritage Explorer Discount' },
  HIGHLAND100: { type: 'fixed', value: 100, label: 'ETB 100 Highland Welcome Voucher' },
};

const CartPage = () => {
  const { items, removeFromCart, updateQuantity, clearCart } = useCartStore();
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { t } = useLanguage();
  const [config, setConfig] = useState(null);

  // Promo code state
  const [promoInput, setPromoInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState('');

  useEffect(() => {
    configAPI.getPublic()
      .then((response) => setConfig(response.data))
      .catch(() => setConfig(null));
  }, []);

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const freeThreshold = config?.shipping?.freeThreshold ?? 1000;
  const flatRate = config?.shipping?.flatRate ?? 50;

  const sellerTotals = items.reduce((groups, item) => {
    const sellerId = item.seller?.id || item.seller_id || 'unknown';
    groups[sellerId] = (groups[sellerId] || 0) + Number(item.price || 0) * item.quantity;
    return groups;
  }, {});

  const shipping = Object.values(sellerTotals).reduce(
    (sum, sellerTotal) => sum + (sellerTotal >= freeThreshold ? 0 : flatRate),
    0
  );

  // Free shipping progress
  const amountToFreeShipping = Math.max(0, freeThreshold - total);
  const progressPercent = Math.min(100, Math.round((total / freeThreshold) * 100));

  // Discount calculation
  let discountAmount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.type === 'percent') {
      discountAmount = total * appliedCoupon.value;
    } else {
      discountAmount = Math.min(total, appliedCoupon.value);
    }
  }

  const finalTotal = Math.max(0, total - discountAmount + shipping);

  const handleApplyCoupon = (e) => {
    e.preventDefault();
    setCouponError('');
    setCouponSuccess('');
    const code = promoInput.trim().toUpperCase();

    if (!code) return;

    if (VALID_COUPONS[code]) {
      setAppliedCoupon({ code, ...VALID_COUPONS[code] });
      setCouponSuccess(`Coupon "${code}" applied: ${VALID_COUPONS[code].label}`);
      setPromoInput('');
    } else {
      setCouponError('Invalid voucher code. Try "HABESHA10" or "CULTURE15".');
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponSuccess('');
    setCouponError('');
  };

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login?next=/cart&reason=cart');
    }
  }, [user, authLoading, router]);

  if (authLoading || !user) {
    return (
      <>
        <Header />
        <LoadingScreen label="Checking your shopping bag..." />
        <Footer />
      </>
    );
  }

  if (user?.role === 'seller') {
    return (
      <>
        <Header />
        <main className={styles.container}>
          <div className={styles.sellerNotice}>
            <h1>Seller Workspace</h1>
            <p>Artisan accounts cannot purchase pieces directly. Open your vendor terminal to manage your workshop catalog and orders.</p>
            <Button variant="primary" size="md" onClick={() => router.push('/vendor')}>
              Open Artisan Terminal →
            </Button>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Shopping Bag | Habesha Store</title>
      </Head>

      <Header />

      <main className={styles.container}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
          <div>
            <span className={styles.eyebrow}>CURATED SELECTION</span>
            <h1 style={{ margin: '0.4rem 0 0' }}>{t('cart.title', 'Shopping Bag')}</h1>
          </div>
          {items.length > 0 && (
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <Link href="/products" style={{ color: 'var(--color-green)', fontSize: '0.9rem', fontWeight: 600, textDecoration: 'underline' }}>
                ← {t('cart.continue_shopping', 'Continue Browsing')}
              </Link>
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('Clear all items from your shopping bag?')) {
                    clearCart();
                  }
                }}
                style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: '0.85rem' }}
              >
                Clear Bag
              </button>
            </div>
          )}
        </div>

        {items.length === 0 ? (
          <EmptyState
            icon="🛍️"
            title={t('cart.empty_title', 'Your bag is waiting')}
            description={t('cart.empty_desc', 'Explore our curated collection of Ethiopian handwoven textiles, roasted single-origin coffees, and handcrafted jewelry.')}
            actionLabel={t('cart.continue_shopping', 'Discover Collection')}
            actionHref="/products"
          />
        ) : (
          <div className={styles.cartLayout}>
            <div className={styles.cartItems}>
              {/* Free Highland Shipping Progress Banner */}
              <div style={{ background: '#f8f5ee', border: '1px solid #e2dac9', padding: '1rem 1.25rem', borderRadius: '4px', marginBottom: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', fontSize: '0.88rem' }}>
                  <strong style={{ color: 'var(--color-green)' }}>
                    {amountToFreeShipping === 0 ? (
                      <span>✓ You have qualified for Free Highland Delivery!</span>
                    ) : (
                      <span>Add {config?.currency || 'ETB'} {amountToFreeShipping.toFixed(2)} more for Free Shipping</span>
                    )}
                  </strong>
                  <span style={{ fontSize: '0.78rem', color: 'var(--color-gray)' }}>{progressPercent}% towards goal</span>
                </div>
                <div style={{ width: '100%', height: '7px', background: '#e0d8c8', borderRadius: '4px', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${progressPercent}%`,
                      height: '100%',
                      background: 'var(--color-gold)',
                      transition: 'width 0.4s ease',
                    }}
                  />
                </div>
              </div>

              {items.map((item) => (
                <div key={item._id} className={styles.cartItem}>
                  <img
                    src={item.images?.[0] || '/images/heritage-textile.jpg'}
                    alt={item.name}
                    onError={(event) => {
                      event.currentTarget.onerror = null;
                      event.currentTarget.src = '/images/heritage-textile.jpg';
                    }}
                  />
                  <div className={styles.itemInfo}>
                    <Link href={`/products/${item._id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                      <h3 style={{ margin: '0 0 0.3rem', fontSize: '1.05rem', color: 'var(--color-green)' }}>{item.name}</h3>
                    </Link>
                    <p style={{ margin: 0, color: 'var(--color-gray)', fontSize: '0.88rem' }}>
                      Price: {config?.currency || 'ETB'} {Number(item.price || 0).toFixed(2)}
                    </p>
                  </div>
                  <div className={styles.itemControls}>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item._id, item.quantity - 1)}
                    >
                      −
                    </button>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) =>
                        updateQuantity(item._id, Math.max(1, parseInt(e.target.value, 10) || 1))
                      }
                    />
                    <button
                      type="button"
                      onClick={() => updateQuantity(item._id, item.quantity + 1)}
                    >
                      +
                    </button>
                  </div>
                  <div className={styles.itemPrice}>
                    {config?.currency || 'ETB'} {(Number(item.price || 0) * item.quantity).toFixed(2)}
                  </div>
                  <button
                    type="button"
                    className={styles.removeBtn}
                    onClick={() => removeFromCart(item._id)}
                    aria-label="Remove item"
                  >
                    <Icon name="trash" title="Remove item" />
                  </button>
                </div>
              ))}
            </div>

            <div className={styles.orderSummary}>
              <h2 style={{ fontSize: '1.25rem', marginBottom: '1.2rem', color: 'var(--color-green)' }}>Order Summary</h2>

              <div className={styles.summaryRow}>
                <span>Subtotal</span>
                <strong>{config?.currency || 'ETB'} {total.toFixed(2)}</strong>
              </div>

              {appliedCoupon && (
                <div className={styles.summaryRow} style={{ color: '#134e35' }}>
                  <span>Discount ({appliedCoupon.code})</span>
                  <span>- {config?.currency || 'ETB'} {discountAmount.toFixed(2)}</span>
                </div>
              )}

              <div className={styles.summaryRow}>
                <span>Shipping Estimate</span>
                <span>{shipping === 0 ? <Badge variant="success" size="sm">Free</Badge> : `${config?.currency || 'ETB'} ${shipping.toFixed(2)}`}</span>
              </div>

              <div className={styles.summaryTotal} style={{ borderTop: '2px solid var(--color-line)', paddingTop: '1rem', marginTop: '1rem' }}>
                <span style={{ fontSize: '1.1rem', fontWeight: 600 }}>Total</span>
                <span style={{ fontSize: '1.3rem', color: 'var(--color-green)', fontWeight: 700 }}>
                  {config?.currency || 'ETB'} {finalTotal.toFixed(2)}
                </span>
              </div>

              {/* Promo Code Form */}
              <div style={{ margin: '1.5rem 0', borderTop: '1px solid var(--color-line)', paddingTop: '1.25rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-gray)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Voucher / Promo Code
                </span>
                {appliedCoupon ? (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f5faf7', border: '1px solid #bce3cb', padding: '0.6rem 0.8rem', borderRadius: '4px', marginTop: '0.5rem' }}>
                    <div>
                      <strong style={{ color: '#134e35', fontSize: '0.88rem', display: 'block' }}>{appliedCoupon.code}</strong>
                      <small style={{ color: 'var(--color-gray)' }}>{appliedCoupon.label}</small>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveCoupon}
                      style={{ background: 'none', border: 'none', color: '#c02b2b', fontSize: '0.78rem', cursor: 'pointer', fontWeight: 600 }}
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleApplyCoupon} style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                    <input
                      type="text"
                      placeholder="e.g. HABESHA10"
                      value={promoInput}
                      onChange={(e) => setPromoInput(e.target.value)}
                      style={{ flex: 1, padding: '0.5rem 0.75rem', border: '1px solid var(--color-line)', font: 'inherit', fontSize: '0.88rem' }}
                    />
                    <Button type="submit" variant="outline" size="sm">
                      Apply
                    </Button>
                  </form>
                )}
                {couponError && <p style={{ color: '#c02b2b', fontSize: '0.8rem', margin: '0.4rem 0 0' }}>{couponError}</p>}
                {couponSuccess && <p style={{ color: '#134e35', fontSize: '0.8rem', margin: '0.4rem 0 0' }}>✓ {couponSuccess}</p>}
              </div>

              <Button
                variant="primary"
                size="lg"
                style={{ width: '100%', marginTop: '0.5rem' }}
                onClick={() => router.push('/checkout')}
                disabled={loading || items.length === 0}
              >
                {t('cart.checkout', 'Proceed to Checkout')} →
              </Button>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </>
  );
};

export default CartPage;
