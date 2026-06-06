import React, { useEffect, useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useCartStore } from '../store/cartStore';
import { orderAPI } from '../lib/api';
import styles from '../styles/cart.module.css';

const CartPage = () => {
  const { items, removeFromCart, updateQuantity, clearCart } = useCartStore();
  const [loading, setLoading] = useState(false);

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleCheckout = async () => {
    setLoading(true);
    try {
      const orderData = {
        items: items.map((item) => ({
          product: item._id,
          quantity: item.quantity,
        })),
        shippingAddress: {
          city: 'Addis Ababa',
          region: 'Addis Ababa',
        },
        paymentMethod: 'stripe',
      };

      const response = await orderAPI.create(orderData);
      alert('Order placed successfully!');
      clearCart();
      // Redirect to payment or order confirmation
    } catch (error) {
      alert('Failed to place order: ' + error.response?.data?.error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header />
      <div className={styles.container}>
        <h1>Shopping Cart 🛒</h1>

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
                    src={item.images?.[0] || 'https://via.placeholder.com/100'}
                    alt={item.name}
                  />
                  <div className={styles.itemInfo}>
                    <h3>{item.name}</h3>
                    <p>Price: Br {item.price.toFixed(2)}</p>
                  </div>
                  <div className={styles.itemControls}>
                    <button onClick={() => updateQuantity(item._id, item.quantity - 1)}>
                      −
                    </button>
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) =>
                        updateQuantity(item._id, parseInt(e.target.value))
                      }
                    />
                    <button onClick={() => updateQuantity(item._id, item.quantity + 1)}>
                      +
                    </button>
                  </div>
                  <div className={styles.itemPrice}>
                    Br {(item.price * item.quantity).toFixed(2)}
                  </div>
                  <button
                    className={styles.removeBtn}
                    onClick={() => removeFromCart(item._id)}
                  >
                    🗑️
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
                <span>Br 50.00</span>
              </div>
              <div className={styles.summaryTotal}>
                <span>Total:</span>
                <span>Br {(total + 50).toFixed(2)}</span>
              </div>
              <button
                className={styles.checkoutBtn}
                onClick={handleCheckout}
                disabled={loading}
              >
                {loading ? 'Processing...' : 'Proceed to Checkout'}
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