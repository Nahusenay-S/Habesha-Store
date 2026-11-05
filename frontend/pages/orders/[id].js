import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import LoadingScreen from '../../components/LoadingScreen';
import { orderAPI, paymentAPI } from '../../lib/api';
import styles from '../../styles/orders.module.css';

const OrderDetailPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const [order, setOrder] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verifyNotice, setVerifyNotice] = useState('');

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

  const handleCancelOrder = async () => {
    const reason = window.prompt('Please enter a reason for cancelling this order (optional):');
    if (reason === null) return;
    setCancelling(true);
    setCancelError('');
    try {
      await orderAPI.updateStatus(id, 'cancelled', reason);
      loadOrder();
    } catch (err) {
      setCancelError(err.response?.data?.error || 'Unable to cancel order.');
    } finally {
      setCancelling(false);
    }
  };

  const handleVerifyTelebirr = async () => {
    setVerifying(true);
    setVerifyNotice('');
    try {
      // Create or fetch payment reference then verify
      const initRes = await paymentAPI.initiateTelebirrPayment({ orderId: id });
      const { paymentId, referenceId } = initRes.data;
      await paymentAPI.verifyTelebirrPayment({ paymentId, referenceId });
      setVerifyNotice('Telebirr payment successfully verified!');
      loadOrder();
    } catch (err) {
      setVerifyNotice(err.response?.data?.error || 'Verification failed. Please try again.');
    } finally {
      setVerifying(false);
    }
  };

  if (order === false) {
    return (
      <>
        <Head><title>Order Not Found - Habesha Store</title></Head>
        <Header />
        <main className={styles.message}>
          <h1>Order not found</h1>
          <p>We could not locate this order in your account.</p>
          <Link href="/orders" className={styles.back}>← Back to all orders</Link>
        </main>
        <Footer />
      </>
    );
  }
  if (!order) {
    return (
      <>
        <Head><title>Loading Order - Habesha Store</title></Head>
        <Header />
        <LoadingScreen label="Loading order details..." />
        <Footer />
      </>
    );
  }

  // Map database status to tracker step index
  // Lifecycle: 0: Pending -> 1: Processing / Confirmed -> 2: Shipped -> 3: Delivered
  const isCancelled = order.status === 'cancelled';
  let activeStep = 0;
  if (order.status === 'confirmed' || order.status === 'processing') activeStep = 1;
  else if (order.status === 'shipped') activeStep = 2;
  else if (order.status === 'delivered') activeStep = 3;

  const displaySteps = [
    { label: 'Order Placed', desc: 'Order received by seller' },
    { label: 'Processing', desc: 'Handcrafted & packed' },
    { label: 'Shipped', desc: 'In transit via Cargo' },
    { label: 'Delivered', desc: 'Arrived safely' },
  ];

  const canCancel = ['pending', 'confirmed'].includes(order.status);

  return (
    <>
      <Head>
        <title>Order #{(order._id || id || '').toString().slice(0, 8).toUpperCase()} - Habesha Store</title>
      </Head>
      <Header />
      <main className={styles.page}>
        <Link href="/orders" className={styles.back}>← Order history</Link>
        <span className={styles.eyebrow}>Order Tracking & Details</span>
        <h1>#{order._id.slice(0, 8).toUpperCase()}</h1>

        {isCancelled ? (
          <div style={{ background: '#fdf2f2', border: '1px solid #f8b4b4', color: '#9b1c1c', padding: '1.25rem', marginBottom: '2.5rem', borderRadius: '4px' }}>
            <h3 style={{ margin: '0 0 0.5rem' }}>✕ Order Cancelled</h3>
            <p style={{ margin: 0, fontSize: '0.92rem' }}>
              This order was cancelled. {order.cancellationReason ? `Reason: "${order.cancellationReason}"` : ''} Any reserved inventory has been returned.
            </p>
          </div>
        ) : (
          <div className={styles.tracker}>
            {displaySteps.map((step, index) => (
              <div className={index <= activeStep ? styles.stepActive : styles.step} key={step.label}>
                <span>{index + 1}</span>
                <strong>{step.label}</strong>
                <small style={{ color: '#888', fontSize: '0.75rem' }}>{step.desc}</small>
              </div>
            ))}
          </div>
        )}

        {/* Live Shipping & Tracking info */}
        {order.trackingNumber && (
          <div style={{ background: '#f7f4ee', border: '1px solid #c9b084', padding: '1.2rem', marginBottom: '1.5rem', borderRadius: '4px' }}>
            <span style={{ color: '#0b3d2c', fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              ✦ Live Shipment Dispatch
            </span>
            <h3 style={{ margin: '0.4rem 0', color: '#0b3d2c' }}>
              Tracking Number: {order.trackingNumber}
            </h3>
            <p style={{ margin: '0 0 0.5rem', color: '#555', fontSize: '0.9rem' }}>
              Carrier: Ethiopian Airlines Cargo · Flightway express delivery
            </p>
            <span style={{ display: 'inline-block', background: '#0b3d2c', color: '#fff', fontSize: '0.75rem', padding: '0.2rem 0.6rem', borderRadius: '2px' }}>
              Status: {order.status.toUpperCase()}
            </span>
          </div>
        )}

        {/* Payment Status Bar */}
        <div style={{ background: '#faf8f5', border: '1px solid var(--color-line)', padding: '1rem 1.25rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <span style={{ fontSize: '0.85rem', color: '#666' }}>Payment Method: </span>
            <strong style={{ textTransform: 'capitalize' }}>{order.paymentMethod || 'Stripe'}</strong>
            <span style={{ margin: '0 0.5rem' }}>•</span>
            <span style={{ fontSize: '0.85rem', color: '#666' }}>Payment Status: </span>
            <strong style={{ color: order.paymentStatus === 'completed' ? '#078930' : '#d97706' }}>
              {order.paymentStatus === 'completed' ? 'Paid & Confirmed ✓' : 'Payment Pending'}
            </strong>
          </div>
          {order.paymentStatus !== 'completed' && order.paymentMethod === 'telebirr' && !isCancelled && (
            <div>
              <button
                type="button"
                onClick={handleVerifyTelebirr}
                disabled={verifying}
                style={{ background: '#078930', color: '#fff', border: 'none', padding: '0.4rem 0.9rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' }}
              >
                {verifying ? 'Verifying...' : 'Verify Telebirr Payment'}
              </button>
            </div>
          )}
        </div>
        {verifyNotice && <p style={{ color: '#078930', fontWeight: 600, margin: '0 0 1rem' }}>{verifyNotice}</p>}

        <section className={styles.detail}>
          <h2>Items in this order</h2>
          {order.items?.map((item) => (
            <div className={styles.item} key={item.product?.id}>
              <div>
                <strong style={{ color: 'var(--color-dark)' }}>{item.product?.name}</strong>
                <span style={{ display: 'block', fontSize: '0.82rem', color: '#777' }}>Quantity: {item.quantity}</span>
              </div>
              <strong>ETB {(Number(item.price) * item.quantity).toFixed(2)}</strong>
            </div>
          ))}
          <div className={styles.item}>
            <span>Shipping</span>
            <strong>ETB {Number(order.shippingAmount || 0).toFixed(2)}</strong>
          </div>
          <div className={styles.total}>
            <span>Total Amount</span>
            <strong>ETB {Number(order.totalAmount).toFixed(2)}</strong>
          </div>
        </section>

        <section className={styles.address}>
          <h2>Delivery Destination</h2>
          <p>
            <strong>{order.buyer?.name}</strong><br />
            {order.shippingAddress?.street || 'Address on file'}<br />
            {order.shippingAddress?.city}, {order.shippingAddress?.region || 'Ethiopia'}<br />
            {order.shippingAddress?.phone && <span>Tel: {order.shippingAddress.phone}</span>}
          </p>
        </section>

        {/* Cancellation Action */}
        {canCancel && (
          <div style={{ marginTop: '2rem', padding: '1rem', borderTop: '1px solid var(--color-line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <strong style={{ color: '#666', fontSize: '0.9rem' }}>Need to make a change?</strong>
              <p style={{ margin: 0, color: '#888', fontSize: '0.82rem' }}>You can cancel this order before the artisan begins shipping.</p>
            </div>
            <button
              type="button"
              onClick={handleCancelOrder}
              disabled={cancelling}
              style={{ background: 'none', border: '1px solid #c02b2b', color: '#c02b2b', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' }}
            >
              {cancelling ? 'Cancelling...' : 'Cancel Order'}
            </button>
          </div>
        )}
        {cancelError && <p style={{ color: '#c02b2b', marginTop: '0.5rem' }}>{cancelError}</p>}
      </main>
      <Footer />
    </>
  );
};

export default OrderDetailPage;
