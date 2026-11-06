import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Footer from '../components/Footer';
import Header from '../components/Header';
import LoadingScreen from '../components/LoadingScreen';
import ChapaCheckoutModal from '../components/ChapaCheckoutModal';
import { orderAPI, paymentAPI } from '../lib/api';
import { useLanguage } from '../context/LanguageContext';
import styles from '../styles/order-confirmation.module.css';
import Icon from '../components/Icon';
import AnimatedReceipt from '../components/AnimatedReceipt';

const OrderConfirmationPage = () => {
  const router = useRouter();
  const { id, ref, pid, tx_ref, provider, sandbox, chapa_returned, open_modal } = router.query;
  const { t, language } = useLanguage();
  const [order, setOrder] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const [verifiedNotice, setVerifiedNotice] = useState('');
  const [verifyError, setVerifyError] = useState('');
  const [telebirrData, setTelebirrData] = useState({ ref: ref || '', pid: pid || '' });
  const [chapaLoading, setChapaLoading] = useState(false);
  const [showChapaModal, setShowChapaModal] = useState(false);
  const [activeTxRef, setActiveTxRef] = useState(tx_ref || '');

  const loadOrder = () => {
    const orderId = id || (router.isReady ? router.query.id : null);
    if (orderId) {
      orderAPI.getById(orderId)
        .then((response) => setOrder(response.data))
        .catch(() => setOrder(false));
    }
  };

  useEffect(() => {
    if (router.isReady && id) {
      loadOrder();
    }
  }, [router.isReady, id]);

  // Auto-open modal if redirected from checkout with open_modal=true
  useEffect(() => {
    if (open_modal === 'true' && order && order.paymentStatus !== 'completed') {
      setShowChapaModal(true);
    }
  }, [open_modal, order]);

  // Handle genuine Chapa return verification (only after returning from gateway)
  useEffect(() => {
    if (chapa_returned === 'true' && tx_ref && id) {
      setVerifying(true);
      setVerifyError('');
      paymentAPI.verifyChapaPayment(tx_ref)
        .then(() => {
          setVerifiedNotice(language === 'am' ? '✓ የቻፓ ክፍያዎ በተሳካ ሁኔታ ተረጋግጧል!' : '✓ Chapa payment verified successfully!');
          loadOrder();
        })
        .catch((err) => {
          console.warn('Chapa verification notice:', err);
          loadOrder();
        })
        .finally(() => {
          setVerifying(false);
        });
    }
  }, [chapa_returned, tx_ref, id]);

  const handlePayWithChapa = async () => {
    if (!order) return;
    setChapaLoading(true);
    setVerifyError('');
    try {
      const res = await paymentAPI.initiateChapaPayment({ orderId: order._id || order.id });
      if (res.data?.checkoutUrl) {
        if (res.data.isSandbox) {
          // Open interactive simulated Chapa checkout modal
          setActiveTxRef(res.data.txRef);
          setShowChapaModal(true);
          setChapaLoading(false);
        } else {
          // Live gateway: redirect to official hosted Chapa checkout portal
          window.location.href = res.data.checkoutUrl;
        }
      }
    } catch (err) {
      setVerifyError(err.response?.data?.error || 'Unable to redirect to Chapa checkout.');
      setChapaLoading(false);
    }
  };

  const handleChapaModalSuccess = async (reference) => {
    try {
      await paymentAPI.verifyChapaPayment(reference);
      setVerifiedNotice(language === 'am' ? '✓ የቻፓ ክፍያ በተሳካ ሁኔታ ተጠናቋል!' : '✓ Chapa payment verified successfully!');
      loadOrder();
    } catch (err) {
      setVerifyError('Verification could not be confirmed. Please check order status.');
    }
  };

  const handleVerifyChapa = async () => {
    const reference = tx_ref || `HB-${(order?._id || '').slice(0, 8).toUpperCase()}`;
    setVerifying(true);
    setVerifyError('');
    try {
      await paymentAPI.verifyChapaPayment(reference);
      setVerifiedNotice(language === 'am' ? '✓ የቻፓ ክፍያዎ ተረጋግጧል!' : '✓ Chapa payment verified!');
      loadOrder();
    } catch (err) {
      setVerifyError(err.response?.data?.error || 'Verification pending. Please check again.');
    } finally {
      setVerifying(false);
    }
  };

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

  if (order === false) return <><Header /><main className={styles.message}><h1>{t('order_detail.not_found', 'Order not found')}</h1><p>{t('order_detail.not_found_desc', 'We could not find this order.')}</p><Link href="/products">{t('cart.continue_shopping', 'Browse the collection')}</Link></main><Footer /></>;
  if (!order) return <><Header /><LoadingScreen label={language === 'am' ? 'ትዕዛዝዎን በመጫን ላይ...' : 'Loading your order...'} /><Footer /></>;

  const isPaid = order.paymentStatus === 'completed';

  return (
    <>
      <Header />
      <main className={styles.page}>
        <div className={styles.check}><Icon name="check" size={28} /></div>
        <div className={styles.amharic}>አመሰግናለሁ</div>
        <h1>{language === 'am' ? 'እናመሰግናለን!' : 'Ameseginalehu!'}</h1>
        <p className={styles.intro}>
          {language === 'am'
            ? 'ትዕዛዝዎ በተሳካ ሁኔታ ተጠናቋል። ለኢትዮጵያ ባህላዊ ጥበባት ለሰጡት ድጋፍ እያመሰገንን ትዕዛዝዎን በጥንቃቄ በማዘጋጀት ላይ ነን።'
            : 'Your order has been placed successfully. We are honoring your support of Ethiopian craftsmanship and preparing your package with care.'}
        </p>

        {/* Chapa Payment Action Card */}
        {order.paymentMethod === 'chapa' && (
          <div style={{ margin: '1.5rem auto 2.5rem', maxWidth: '600px', background: isPaid ? '#eaf5ee' : '#fdf8ee', border: isPaid ? '1px solid #b7dfca' : '1px solid #e6ca85', borderRadius: '6px', padding: '1.5rem', textAlign: 'left' }}>
            {isPaid ? (
              <div style={{ color: '#0b3d2c' }}>
                <strong style={{ fontSize: '1.05rem', display: 'block', marginBottom: '0.4rem' }}>
                  ✓ {language === 'am' ? 'የቻፓ ክፍያ ተጠናቋል (ቴሌብር / ንግድ ባንክ / ካርድ)' : 'Chapa Payment Completed (Telebirr / CBE / Cards)'}
                </strong>
                <p style={{ margin: 0, fontSize: '0.9rem' }}>
                  {language === 'am'
                    ? `የ ${t('common.currency', 'ETB')} ${Number(order.totalAmount).toFixed(2)} ክፍያዎ በቻፓ ተረጋግጧል። ባለሙያው ዕቃዎን እንዲያዘጋጅ ተነግሮታል።`
                    : `Your payment of ETB ${Number(order.totalAmount).toFixed(2)} has been verified via Chapa. The artisan has been notified.`}
                </p>
              </div>
            ) : (
              <div>
                <span style={{ background: '#d97706', color: '#fff', fontSize: '0.72rem', fontWeight: 700, padding: '0.2rem 0.5rem', borderRadius: '3px', textTransform: 'uppercase' }}>
                  {language === 'am' ? 'ክፍያ ያስፈልጋል' : 'Action Required'}
                </span>
                <h3 style={{ margin: '0.6rem 0 0.4rem', color: '#854d0e', fontSize: '1.2rem' }}>
                  {language === 'am' ? 'የቻፓ ክፍያዎን ያጠናቁ' : 'Complete Your Chapa Payment'}
                </h3>
                <p style={{ margin: '0 0 1rem', fontSize: '0.88rem', color: '#713f12' }}>
                  {language === 'am'
                    ? 'በቴሌብር፣ በኢትዮጵያ ንግድ ባንክ (CBE Birr)፣ በአዋሽ ባንክ ወይም በካርድ ለመክፈል ከታች ያለውን ይጫኑ።'
                    : 'Pay securely using Telebirr, CBE Birr, Awash Birr, or debit/credit cards.'}
                </p>
                <div style={{ background: '#fff', padding: '0.75rem 1rem', borderRadius: '4px', border: '1px solid #ebd9ab', marginBottom: '1rem', fontSize: '0.88rem' }}>
                  <div>{language === 'am' ? 'የሚከፈለው ጠቅላላ ገንዘብ:' : 'Amount to Pay:'} <strong>{t('common.currency', 'ETB')} {Number(order.totalAmount).toFixed(2)}</strong></div>
                  <div>{language === 'am' ? 'የክፍያ ኔትወርክ:' : 'Supported Networks:'} <strong>Telebirr, CBE Birr, Awash, Visa, Mastercard</strong></div>
                </div>
                {verifyError && <p style={{ color: '#c02b2b', fontSize: '0.88rem', margin: '0 0 0.75rem' }}>{verifyError}</p>}
                {verifiedNotice && <p style={{ color: '#0b3d2c', fontSize: '0.88rem', margin: '0 0 0.75rem' }}>{verifiedNotice}</p>}
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={handlePayWithChapa}
                    disabled={chapaLoading}
                    style={{ background: '#0b3d2c', color: '#fff', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '4px', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem' }}
                  >
                    {chapaLoading ? (language === 'am' ? 'ወደ ቻፓ በማገናኘት ላይ...' : 'Connecting to Chapa...') : (language === 'am' ? '💳 በቻፓ አሁኑኑ ይክፈሉ' : '💳 Pay with Chapa Now')}
                  </button>
                  <button
                    type="button"
                    onClick={handleVerifyChapa}
                    disabled={verifying}
                    style={{ background: '#fff', color: '#0b3d2c', border: '1px solid #0b3d2c', padding: '0.75rem 1.25rem', borderRadius: '4px', cursor: 'pointer', fontWeight: 600, fontSize: '0.88rem' }}
                  >
                    {verifying ? (language === 'am' ? 'በማረጋገጥ ላይ...' : 'Verifying...') : (language === 'am' ? '✓ ክፍያ አረጋግጥ' : '✓ Confirm Payment')}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Chapa Hosted Payment Modal */}
        <ChapaCheckoutModal
          isOpen={showChapaModal}
          onClose={() => setShowChapaModal(false)}
          order={order}
          txRef={activeTxRef}
          onPaymentSuccess={handleChapaModalSuccess}
        />

        {/* Telebirr Payment Action Card */}
        {order.paymentMethod === 'telebirr' && (
          <div style={{ margin: '1.5rem auto 2.5rem', maxWidth: '600px', background: isPaid ? '#eaf5ee' : '#fdf8ee', border: isPaid ? '1px solid #b7dfca' : '1px solid #e6ca85', borderRadius: '6px', padding: '1.5rem', textAlign: 'left' }}>
            {isPaid ? (
              <div style={{ color: '#0b3d2c' }}>
                <strong style={{ fontSize: '1.05rem', display: 'block', marginBottom: '0.4rem' }}>
                  ✓ {language === 'am' ? 'የቴሌብር ክፍያ ተጠናቋል' : 'Telebirr Payment Completed'}
                </strong>
                <p style={{ margin: 0, fontSize: '0.9rem' }}>
                  {language === 'am'
                    ? `የ ${t('common.currency', 'ETB')} ${Number(order.totalAmount).toFixed(2)} ክፍያዎ ተረጋግጧል። ባለሙያው ዕቃዎን እንዲያዘጋጅ ተነግሮታል።`
                    : `Your payment of ETB ${Number(order.totalAmount).toFixed(2)} has been verified. The maker has been notified.`}
                </p>
              </div>
            ) : (
              <div>
                <span style={{ background: '#d97706', color: '#fff', fontSize: '0.72rem', fontWeight: 700, padding: '0.2rem 0.5rem', borderRadius: '3px', textTransform: 'uppercase' }}>
                  {language === 'am' ? 'ክፍያ ያስፈልጋል' : 'Action Required'}
                </span>
                <h3 style={{ margin: '0.6rem 0 0.4rem', color: '#854d0e', fontSize: '1.2rem' }}>
                  {language === 'am' ? 'የቴሌብር ክፍያዎን ያጠናቁ' : 'Complete Your Telebirr Payment'}
                </h3>
                <p style={{ margin: '0 0 1rem', fontSize: '0.88rem', color: '#713f12' }}>
                  {language === 'am'
                    ? `ይህንን ግዢ ለማጠናቀቅ ወደ "ሀበሻ ስቶር" ወይም በቴሌብር (*127# ወይም አፕሊኬሽን) የክፍያ መለያ ቁጥር ${telebirrData.ref || 'HB-PENDING'} በመጠቀም ይክፈሉ።`
                    : `To finalize this purchase, transfer to merchant Habesha Store or approve reference ${telebirrData.ref || 'HB-PENDING'} on Telebirr (*127# or Telebirr App).`}
                </p>
                <div style={{ background: '#fff', padding: '0.75rem 1rem', borderRadius: '4px', border: '1px solid #ebd9ab', marginBottom: '1rem', fontSize: '0.88rem' }}>
                  <div>{language === 'am' ? 'የክፍያ መለያ ቁጥር:' : 'Payment Reference:'} <strong>{telebirrData.ref || (language === 'am' ? 'በመዘጋጀት ላይ...' : 'Generating...')}</strong></div>
                  <div>{language === 'am' ? 'የሚከፈለው ጠቅላላ ገንዘብ:' : 'Amount to Pay:'} <strong>{t('common.currency', 'ETB')} {Number(order.totalAmount).toFixed(2)}</strong></div>
                </div>
                {verifyError && <p style={{ color: '#c02b2b', fontSize: '0.88rem', margin: '0 0 0.75rem' }}>{verifyError}</p>}
                {verifiedNotice && <p style={{ color: '#0b3d2c', fontSize: '0.88rem', margin: '0 0 0.75rem' }}>{verifiedNotice}</p>}
                <button
                  type="button"
                  onClick={handleVerifyTelebirr}
                  disabled={verifying || !telebirrData.ref}
                  style={{ background: '#0b3d2c', color: '#fff', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '4px', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem' }}
                >
                  {verifying ? (language === 'am' ? 'በቴሌብር በማረጋገጥ ላይ...' : 'Verifying with Telebirr...') : (language === 'am' ? '✓ የቴሌብር ክፍያዬን አረጋግጥ' : '✓ Confirm & Verify Telebirr Payment')}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Animated Digital Receipt */}
        <AnimatedReceipt order={order} />

        <div className={styles.cards}>
          <div>
            <span>{language === 'am' ? 'የትዕዛዝ ቁጥር' : 'Order number'}</span>
            <strong>#{(order._id || order.id || '').slice(0, 8).toUpperCase()}</strong>
            <small><Icon name="check" size={13} /> {language === 'am' ? 'ትዕዛዝዎ በመለያዎ ተመዝግቧል' : 'Order confirmed in your account'}</small>
          </div>
          <div>
            <span>{language === 'am' ? 'የመድረሻ ጊዜ' : 'Estimated delivery'}</span>
            <strong>{language === 'am' ? 'ከ3 እስከ 5 የስራ ቀናት' : '3–5 business days'}</strong>
            <small><Icon name="truck" size={13} /> {language === 'am' ? 'በኢትዮጵያ አየር መንገድ ካርጎ' : 'Via Ethiopian Airlines Cargo'}</small>
          </div>
        </div>

        <section className={styles.summary}>
          <header>
            <h2>{t('cart.order_summary', 'Order summary')}</h2>
            <span>{order.items?.length || 0} {language === 'am' ? 'ቅርሶች' : 'items'}</span>
          </header>
          {order.items?.map((item) => (
            <div className={styles.item} key={item.product?.id || item._id}>
              <div>
                <small>{item.product?.seller?.name || (language === 'am' ? 'የሀበሻ እደ-ጥበብ ባለሙያ' : 'Habesha artisan')}</small>
                <span>{item.product?.name} × {item.quantity}</span>
              </div>
              <strong>{t('common.currency', 'ETB')} {(Number(item.price) * item.quantity).toFixed(2)}</strong>
            </div>
          ))}
          <div className={styles.paid}>
            <span>
              {language === 'am' ? 'የክፍያ ዘዴ:' : 'Payment Method:'} <strong style={{ textTransform: 'capitalize' }}>{order.paymentMethod || 'secure checkout'}</strong>
              {' '}(<em style={{ color: isPaid ? '#078930' : '#d97706' }}>{isPaid ? (language === 'am' ? 'ተጠናቋል' : 'Completed') : (language === 'am' ? 'በመጠባበቅ ላይ' : 'Pending')}</em>)
            </span>
            <small>{t('payments.transaction_id', 'Transaction ID:')} #{(order._id || order.id || '').slice(0, 8).toUpperCase()}</small>
            <div>
              <span>{t('cart.total', 'Total amount')}</span>
              <strong>{t('common.currency', 'ETB')} {Number(order.totalAmount).toFixed(2)}</strong>
            </div>
          </div>
        </section>

        <div className={styles.actions}>
          <Link href={`/orders/${order._id || order.id}`}>
            <Icon name="truck" size={15} /> {language === 'am' ? 'ትዕዛዝ ተከታተል' : 'Track order'}
          </Link>
          <Link href="/products">{language === 'am' ? 'ወደ ስብስቦች ተመለስ' : 'Back to collection'}</Link>
        </div>

        <div className={styles.sustainability}>
          <strong><Icon name="heart" size={15} /> {language === 'am' ? 'ቀጥተኛ የባለሙያዎች አጋርነት' : 'Direct artisan partnership'}</strong>
          <p>
            {language === 'am'
              ? 'የእርስዎ ትዕዛዝ በቀጥታ ከኢትዮጵያ እደ-ጥበብ ባለሙያዎች ጋር የሚደረገውን የፍትሃዊ ንግድ ግንኙነት ይደግፋል። ሁሉም ዕቃዎች በባህላዊ እና ለአካባቢ ተስማሚ በሆኑ እቃዎች ተጠቅልለው ይላካሉ።'
              : 'Your order supports direct trade with Ethiopian artisans. We use carbon-neutral logistics and recyclable packaging for all orders.'}
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
};

export default OrderConfirmationPage;
