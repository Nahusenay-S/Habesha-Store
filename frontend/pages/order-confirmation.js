import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Footer from '../components/Footer';
import Header from '../components/Header';
import { orderAPI, paymentAPI } from '../lib/api';
import styles from '../styles/order-confirmation.module.css';
import Icon from '../components/Icon';

const OrderConfirmationPage = () => {
  const router = useRouter();
  const { id, ref, pid } = router.query;
  const [order, setOrder] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const [verifiedNotice, setVerifiedNotice] = useState('');
  const [verifyError, setVerifyError] = useState('');
  const [telebirrData, setTelebirrData] = useState({ ref: ref || '', pid: pid || '' });

  const loadOrder = () => {
    if (id) {
      orderAPI.getById(id)
        .then((response) => setOrder(response.data))
        .catch(() => setOrder(false));
    }
  };

  useEffect(() => {
    loadOrder();
  }, [id]);

  useEffect(() => {
    if (ref && pid) {
      setTelebirrData({ ref, pid });
    } else if (order && order.paymentMethod === 'telebirr' && order.paymentStatus !== 'completed') {
      paymentAPI.initiateTelebirrPayment({ orderId: order._id })
        .then((res) => setTelebirrData({ ref: res.data.referenceId, pid: res.data.paymentId }))
        .catch(() => {});
    }
  }, [ref, pid, order]);

  const handleVerifyTelebirr = async () => {
    if (!telebirrData.pid || !telebirrData.ref) {
      setVerifyError('Payment reference details are missing. Please try again.');
      return;
    }
    setVerifying(true);
    setVerifyError('');
    setVerifiedNotice('');
    try {
      await paymentAPI.verifyTelebirrPayment({
        paymentId: telebirrData.pid,
        referenceId: telebirrData.ref,
      });
      setVerifiedNotice('Telebirr payment successfully confirmed! Order is confirmed and being prepared.');
      loadOrder();
    } catch (err) {
      setVerifyError(err.response?.data?.error || 'Verification failed. Please ensure you approved the payment in Telebirr.');
    } finally {
      setVerifying(false);
    }
  };

  if (order === false) return <><Header /><main className={styles.message}><h1>Order not found</h1><p>We could not find this order.</p><Link href="/products">Browse the collection</Link></main><Footer /></>;
  if (!order) return <><Header /><main className={styles.message}>Loading your order...</main><Footer /></>;

  const isPaid = order.paymentStatus === 'completed';

  return (
    <>
      <Header />
      <main className={styles.page}>
        <div className={styles.check}><Icon name="check" size={28} /></div>
        <div className={styles.amharic}>አመሰግናለሁ</div>
        <h1>Ameseginalehu!</h1>
        <p className={styles.intro}>
          Your order has been placed successfully. We are honoring your support of Ethiopian craftsmanship and preparing your package with care.
        </p>

        {/* Telebirr Payment Action Card */}
        {order.paymentMethod === 'telebirr' && (
          <div style={{ margin: '1.5rem auto 2.5rem', maxWidth: '600px', background: isPaid ? '#eaf5ee' : '#fdf8ee', border: isPaid ? '1px solid #b7dfca' : '1px solid #e6ca85', borderRadius: '6px', padding: '1.5rem', textAlign: 'left' }}>
            {isPaid ? (
              <div style={{ color: '#0b3d2c' }}>
                <strong style={{ fontSize: '1.05rem', display: 'block', marginBottom: '0.4rem' }}>
                  ✓ Telebirr Payment Completed
                </strong>
                <p style={{ margin: 0, fontSize: '0.9rem' }}>
                  Your payment of <strong>ETB {Number(order.totalAmount).toFixed(2)}</strong> has been verified. The maker has been notified.
                </p>
              </div>
            ) : (
              <div>
                <span style={{ background: '#d97706', color: '#fff', fontSize: '0.72rem', fontWeight: 700, padding: '0.2rem 0.5rem', borderRadius: '3px', textTransform: 'uppercase' }}>
                  Action Required
                </span>
                <h3 style={{ margin: '0.6rem 0 0.4rem', color: '#854d0e', fontSize: '1.2rem' }}>
                  Complete Your Telebirr Payment
                </h3>
                <p style={{ margin: '0 0 1rem', fontSize: '0.88rem', color: '#713f12' }}>
                  To finalize this purchase, transfer to merchant <strong>Habesha Store</strong> or approve reference <strong>{telebirrData.ref || 'HB-PENDING'}</strong> on Telebirr (*127# or Telebirr App).
                </p>
                <div style={{ background: '#fff', padding: '0.75rem 1rem', borderRadius: '4px', border: '1px solid #ebd9ab', marginBottom: '1rem', fontSize: '0.88rem' }}>
                  <div>Payment Reference: <strong>{telebirrData.ref || 'Generating...'}</strong></div>
                  <div>Amount to Pay: <strong>ETB {Number(order.totalAmount).toFixed(2)}</strong></div>
                </div>
                {verifyError && <p style={{ color: '#c02b2b', fontSize: '0.88rem', margin: '0 0 0.75rem' }}>{verifyError}</p>}
                {verifiedNotice && <p style={{ color: '#0b3d2c', fontSize: '0.88rem', margin: '0 0 0.75rem' }}>{verifiedNotice}</p>}
                <button
                  type="button"
                  onClick={handleVerifyTelebirr}
                  disabled={verifying || !telebirrData.ref}
                  style={{ background: '#0b3d2c', color: '#fff', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '4px', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem' }}
                >
                  {verifying ? 'Verifying with Telebirr...' : '✓ Confirm & Verify Telebirr Payment'}
                </button>
              </div>
            )}
          </div>
        )}

        <div className={styles.cards}>
          <div>
            <span>Order number</span>
            <strong>#{order._id.slice(0, 8).toUpperCase()}</strong>
            <small><Icon name="check" size={13} /> Order confirmed in your account</small>
          </div>
          <div>
            <span>Estimated delivery</span>
            <strong>3–5 business days</strong>
            <small><Icon name="truck" size={13} /> Via Ethiopian Airlines Cargo</small>
          </div>
        </div>

        <section className={styles.summary}>
          <header>
            <h2>Order summary</h2>
            <span>{order.items?.length || 0} items</span>
          </header>
          {order.items?.map((item) => (
            <div className={styles.item} key={item.product?.id}>
              <div>
                <small>{item.product?.seller?.name || 'Habesha artisan'}</small>
                <span>{item.product?.name} × {item.quantity}</span>
              </div>
              <strong>ETB {(Number(item.price) * item.quantity).toFixed(2)}</strong>
            </div>
          ))}
          <div className={styles.paid}>
            <span>
              Payment Method: <strong style={{ textTransform: 'capitalize' }}>{order.paymentMethod || 'secure checkout'}</strong>
              {' '}(<em style={{ color: isPaid ? '#078930' : '#d97706' }}>{isPaid ? 'Completed' : 'Pending'}</em>)
            </span>
            <small>Transaction ID: #{order._id.slice(0, 8).toUpperCase()}</small>
            <div>
              <span>Total amount</span>
              <strong>ETB {Number(order.totalAmount).toFixed(2)}</strong>
            </div>
          </div>
        </section>

        <div className={styles.actions}>
          <Link href={`/orders/${order._id}`}>
            <Icon name="truck" size={15} /> Track order
          </Link>
          <Link href="/products">Back to collection</Link>
        </div>

        <div className={styles.sustainability}>
          <strong><Icon name="heart" size={15} /> Direct artisan partnership</strong>
          <p>Your order supports direct trade with Ethiopian artisans. We use carbon-neutral logistics and recyclable packaging for all orders.</p>
        </div>
      </main>
      <Footer />
    </>
  );
};

export default OrderConfirmationPage;
