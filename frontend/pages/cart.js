import React, { useEffect, useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useCartStore } from '../store/cartStore';
import { useRouter } from 'next/router';
import styles from '../styles/cart.module.css';
import Icon from '../components/Icon';
import { useAuth } from '../context/AuthContext';
import LoadingScreen from '../components/LoadingScreen';
import { configAPI } from '../lib/api';

const CartPage = () => {
  const { items, removeFromCart, updateQuantity, clearCart } = useCartStore();
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [config, setConfig] = useState(null);
  useEffect(() => { configAPI.getPublic().then((response) => setConfig(response.data)).catch(() => setConfig(null)); }, []);

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const sellerTotals = items.reduce((groups, item) => {
    const sellerId = item.seller?.id || item.seller_id || 'unknown';
    groups[sellerId] = (groups[sellerId] || 0) + Number(item.price || 0) * item.quantity;
    return groups;
  }, {});
  const shipping = Object.values(sellerTotals).reduce((sum, sellerTotal) => sum + (sellerTotal >= (config?.shipping.freeThreshold ?? 1000) ? 0 : (config?.shipping.flatRate ?? 50)), 0);

  if (authLoading) return <><Header /><LoadingScreen label="Checking your account..." /></>;
  if (user?.role === 'seller') return <><Header /><main className={styles.container}><div className={styles.sellerNotice}><h1>Seller workspace</h1><p>Seller accounts cannot purchase items. Use the vendor terminal to manage your listings and fulfillment.</p><button type="button" onClick={() => router.push('/vendor')}>Open vendor terminal</button></div></main><Footer /></>;
  return (
    <>
      <Header />
      <div className={styles.container}>
        <span className={styles.eyebrow}>Your collection</span>
        <h1>Shopping bag</h1>

        {items.length === 0 ? (
          <div className={styles.emptyCart}>
            <p>Your cart is empty</p>
            <a href="/products" className={styles.shopBtn}>
              Continue Shopping
            </a>
          </div>
        ) : (
          <div className={styles.cartLayout}>
            <div className={styles.cartItems}>
              {items.map((item) => (
                <div key={item._id} className={styles.cartItem}>
                  <img
                    src={item.images?.[0] || '/images/heritage-textile.svg'}
                    alt={item.name}
                    onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = '/images/heritage-textile.svg'; }}
                  />
                  <div className={styles.itemInfo}>
                    <h3>{item.name}</h3>
                    <p>Price: ETB {Number(item.price || 0).toFixed(2)}</p>
                  </div>
                  <div className={styles.itemControls}>
                    <button onClick={() => updateQuantity(item._id, item.quantity - 1)}>
                      −
                    </button>
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) =>
                        updateQuantity(item._id, Math.max(1, parseInt(e.target.value, 10) || 1))
                      }
                    />
                    <button onClick={() => updateQuantity(item._id, item.quantity + 1)}>
                      +
                    </button>
                  </div>
                  <div className={styles.itemPrice}>
                    ETB {(Number(item.price || 0) * item.quantity).toFixed(2)}
                  </div>
                  <button
                    className={styles.removeBtn}
                    onClick={() => removeFromCart(item._id)}
                  >
                    <Icon name="trash" title="Remove item" />
                  </button>
                </div>
              ))}
            </div>

            <div className={styles.orderSummary}>
              <h2>Order Summary</h2>
              <div className={styles.summaryRow}>
                <span>Subtotal:</span>
                <span>Br {total.toFixed(2)}</span>
              </div>
              <div className={styles.summaryRow}>
                <span>Shipping:</span>
                <span>Br {shipping.toFixed(2)}</span>
              </div>
              <div className={styles.summaryTotal}>
                <span>Total:</span>
                <span>Br {(total + shipping).toFixed(2)}</span>
              </div>
              <button
                className={styles.checkoutBtn}
                onClick={() => router.push('/checkout')}
                disabled={loading}
              >
                Continue to checkout <span aria-hidden="true">→</span>
              </button>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </>
  );
};

export default CartPage;