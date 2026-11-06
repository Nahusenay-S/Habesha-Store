import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import LoadingScreen from '../../components/LoadingScreen';
import { orderAPI, paymentAPI } from '../../lib/api';
import { useLanguage } from '../../context/LanguageContext';
import styles from '../../styles/orders.module.css';

const OrderDetailPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const { t, language } = useLanguage();
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

  const handleVerifyChapa = async () => {
    setVerifying(true);
    setVerifyNotice('');
    try {
      const initRes = await paymentAPI.initiateChapaPayment({ orderId: id });
      const txRef = initRes.data?.txRef;
      if (txRef) {
        await paymentAPI.verifyChapaPayment(txRef);
        setVerifyNotice(language === 'am' ? 'የቻፓ ክፍያ ተረጋግጧል!' : 'Chapa payment successfully verified!');
        loadOrder();
      }
    } catch (err) {
      setVerifyNotice(err.response?.data?.error || 'Verification failed. Please try again.');
    } finally {
      setVerifying(false);
    }
  };

  if (order === false) {
    return (
      <>
        <Head><title>{t('order_detail.not_found', 'Order Not Found')} - Habesha Store</title></Head>
        <Header />
        <main className={styles.message}>
          <h1>{t('order_detail.not_found', 'Order not found')}</h1>
          <p>{t('order_detail.not_found_desc', 'We could not locate this order in your account.')}</p>
          <Link href="/orders" className={styles.back}>{t('orders.back_btn', '← Back to all orders')}</Link>
        </main>
        <Footer />
      </>
    );
  }
  if (!order) {
    return (
      <>
        <Head><title>{t('common.loading', 'Loading Order...')} - Habesha Store</title></Head>
        <Header />
        <LoadingScreen label={language === 'am' ? 'የትዕዛዙን ዝርዝር በመጫን ላይ...' : 'Loading order details...'} />
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
    { label: t('order_detail.step_placed', 'Order Placed'), desc: t('order_detail.step_placed_desc', 'Order received by seller') },
    { label: t('order_detail.step_processing', 'Processing'), desc: t('order_detail.step_processing_desc', 'Handcrafted & packed') },
    { label: t('order_detail.step_shipped', 'Shipped'), desc: t('order_detail.step_shipped_desc', 'In transit via Cargo') },
    { label: t('order_detail.step_delivered', 'Delivered'), desc: t('order_detail.step_delivered_desc', 'Arrived safely') },
  ];

  const canCancel = ['pending', 'confirmed'].includes(order.status);

  return (
    <>
      <Head>
        <title>{language === 'am' ? 'ትዕዛዝ' : 'Order'} #{(order._id || id || '').toString().slice(0, 8).toUpperCase()} - Habesha Store</title>
      </Head>
      <Header />
      <main className={styles.page}>
        <Link href="/orders" className={styles.back}>{t('order_detail.back', '← Order history')}</Link>
        <span className={styles.eyebrow}>{t('order_detail.eyebrow', 'Order Tracking & Details')}</span>
        <h1>#{order._id.slice(0, 8).toUpperCase()}</h1>

        {isCancelled ? (
          <div style={{ background: '#fdf2f2', border: '1px solid #f8b4b4', color: '#9b1c1c', padding: '1.25rem', marginBottom: '2.5rem', borderRadius: '4px' }}>
            <h3 style={{ margin: '0 0 0.5rem' }}>{t('order_detail.cancelled_title', '✕ Order Cancelled')}</h3>
            <p style={{ margin: 0, fontSize: '0.92rem' }}>
              {t('order_detail.cancelled_desc', 'This order was cancelled. Any reserved inventory has been returned.')} {order.cancellationReason ? `(${language === 'am' ? 'ምክንያት' : 'Reason'}: "${order.cancellationReason}")` : ''}
            </p>
          </div>
        ) : (
          <div className={styles.tracker}>
            {displaySteps.map((stepItem, index) => (
              <div className={index <= activeStep ? styles.stepActive : styles.step} key={stepItem.label}>
                <span>{index + 1}</span>
                <strong>{stepItem.label}</strong>
                <small style={{ color: '#888', fontSize: '0.75rem' }}>{stepItem.desc}</small>
              </div>
            ))}
          </div>
        )}

        {/* Live Shipping & Tracking info */}
        {order.trackingNumber && (
          <div style={{ background: '#f7f4ee', border: '1px solid #c9b084', padding: '1.2rem', marginBottom: '1.5rem', borderRadius: '4px' }}>
            <span style={{ color: '#0b3d2c', fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              {t('order_detail.live_dispatch', '✦ Live Shipment Dispatch')}
            </span>
            <h3 style={{ margin: '0.4rem 0', color: '#0b3d2c' }}>
              {t('order_detail.tracking_num', 'Tracking Number:')} {order.trackingNumber}
            </h3>
            <p style={{ margin: '0 0 0.5rem', color: '#555', fontSize: '0.9rem' }}>
              {t('order_detail.carrier_cargo', 'Carrier: Ethiopian Airlines Cargo · Flightway express delivery')}
            </p>
            <span style={{ display: 'inline-block', background: '#0b3d2c', color: '#fff', fontSize: '0.75rem', padding: '0.2rem 0.6rem', borderRadius: '2px' }}>
              {t('order_detail.status', 'Status:')} {order.status.toUpperCase()}
            </span>
          </div>
        )}

        {/* Payment Status Bar */}
        <div style={{ background: '#faf8f5', border: '1px solid var(--color-line)', padding: '1rem 1.25rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <span style={{ fontSize: '0.85rem', color: '#666' }}>{t('order_detail.payment_method', 'Payment Method:')} </span>
            <strong style={{ textTransform: 'capitalize' }}>{order.paymentMethod || 'Stripe'}</strong>
            <span style={{ margin: '0 0.5rem' }}>•</span>
            <span style={{ fontSize: '0.85rem', color: '#666' }}>{t('order_detail.payment_status', 'Payment Status:')} </span>
            <strong style={{ color: order.paymentStatus === 'completed' ? '#078930' : '#d97706' }}>
              {order.paymentStatus === 'completed' ? t('order_detail.paid_confirmed', 'Paid & Confirmed ✓') : t('order_detail.payment_pending', 'Payment Pending')}
            </strong>
          </div>
          {order.paymentStatus !== 'completed' && order.paymentMethod === 'chapa' && !isCancelled && (
            <div>
              <button
                type="button"
                onClick={handleVerifyChapa}
                disabled={verifying}
                style={{ background: '#0b3d2c', color: '#fff', border: 'none', padding: '0.4rem 0.9rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' }}
              >
                {verifying ? t('order_detail.verifying', 'Verifying...') : (language === 'am' ? '✓ ቻፓ ክፍያ አረጋግጥ' : '✓ Verify Chapa Payment')}
              </button>
            </div>
          )}
          {order.paymentStatus !== 'completed' && order.paymentMethod === 'telebirr' && !isCancelled && (
            <div>
              <button
                type="button"
                onClick={handleVerifyTelebirr}
                disabled={verifying}
                style={{ background: '#078930', color: '#fff', border: 'none', padding: '0.4rem 0.9rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' }}
              >
                {verifying ? t('order_detail.verifying', 'Verifying...') : t('order_detail.verify_telebirr', 'Verify Telebirr Payment')}
              </button>
            </div>
          )}
        </div>
        {verifyNotice && <p style={{ color: '#078930', fontWeight: 600, margin: '0 0 1rem' }}>{verifyNotice}</p>}

        <section className={styles.detail}>
          <h2>{t('order_detail.items_heading', 'Items in this order')}</h2>
          {order.items?.map((item) => (
            <div className={styles.item} key={item.product?.id}>
              <div>
                <strong style={{ color: 'var(--color-dark)' }}>{item.product?.name}</strong>
                <span style={{ display: 'block', fontSize: '0.82rem', color: '#777' }}>{t('order_detail.quantity', 'Quantity:')} {item.quantity}</span>
              </div>
              <strong>{t('common.currency', 'ETB')} {(Number(item.price) * item.quantity).toFixed(2)}</strong>
            </div>
          ))}
          <div className={styles.item}>
            <span>{t('order_detail.shipping', 'Shipping')}</span>
            <strong>{t('common.currency', 'ETB')} {Number(order.shippingAmount || 0).toFixed(2)}</strong>
          </div>
          <div className={styles.total}>
            <span>{t('order_detail.total', 'Total Amount')}</span>
            <strong>{t('common.currency', 'ETB')} {Number(order.totalAmount).toFixed(2)}</strong>
          </div>
        </section>

        <section className={styles.address}>
          <h2>{t('order_detail.delivery_destination', 'Delivery Destination')}</h2>
          <p>
            <strong>{order.buyer?.name}</strong><br />
            {order.shippingAddress?.street || (language === 'am' ? 'የተመዘገበ አድራሻ' : 'Address on file')}<br />
            {order.shippingAddress?.city}, {order.shippingAddress?.region || (language === 'am' ? 'ኢትዮጵያ' : 'Ethiopia')}<br />
            {order.shippingAddress?.phone && <span>{language === 'am' ? 'ስልክ' : 'Tel'}: {order.shippingAddress.phone}</span>}
          </p>
        </section>

        {/* Cancellation Action */}
        {canCancel && (
          <div style={{ marginTop: '2rem', padding: '1rem', borderTop: '1px solid var(--color-line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <strong style={{ color: '#666', fontSize: '0.9rem' }}>{t('order_detail.need_change', 'Need to make a change?')}</strong>
              <p style={{ margin: 0, color: '#888', fontSize: '0.82rem' }}>{t('order_detail.cancel_info', 'You can cancel this order before the artisan begins shipping.')}</p>
            </div>
            <button
              type="button"
              onClick={handleCancelOrder}
              disabled={cancelling}
              style={{ background: 'none', border: '1px solid #c02b2b', color: '#c02b2b', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' }}
            >
              {cancelling ? t('order_detail.cancelling', 'Cancelling...') : t('order_detail.cancel_btn', 'Cancel Order')}
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
