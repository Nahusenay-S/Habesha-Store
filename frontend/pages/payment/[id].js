import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { paymentAPI } from '../../lib/api';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import LoadingScreen from '../../components/LoadingScreen';
import Badge from '../../components/Badge';
import styles from '../../styles/payment-detail.module.css';

const PaymentDetailPage = () => {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { t, language } = useLanguage();
  const { id } = router.query;
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refunding, setRefunding] = useState(false);
  const [refundMsg, setRefundMsg] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push(`/login?next=${encodeURIComponent(router.asPath)}`);
    } else if (id && user) {
      fetchPaymentDetail();
    }
  }, [user, id, authLoading]);

  const fetchPaymentDetail = async () => {
    try {
      setLoading(true);
      const response = await paymentAPI.getPaymentById(id);
      setPayment(response.data);
    } catch (error) {
      console.error('Failed to fetch payment:', error);
      setPayment(null);
    } finally {
      setLoading(false);
    }
  };

  const handleRefund = async () => {
    if (!window.confirm('Are you sure you wish to submit a refund request for this transaction?')) return;

    setRefunding(true);
    setRefundMsg('');
    try {
      await paymentAPI.processRefund({
        paymentId: id,
        reason: 'requested_by_customer',
      });
      setRefundMsg('Refund request processed successfully.');
      fetchPaymentDetail();
    } catch (error) {
      alert('Failed to process refund: ' + (error.response?.data?.error || error.message));
    } finally {
      setRefunding(false);
    }
  };

  const getStatusBadgeVariant = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'success';
      case 'pending':
        return 'gold';
      case 'failed':
        return 'danger';
      case 'refunded':
        return 'info';
      default:
        return 'default';
    }
  };

  if (authLoading) {
    return (
      <>
        <Head>
          <title>Payment Details - Habesha Store</title>
        </Head>
        <Header />
        <LoadingScreen label="Verifying payment credentials..." />
        <Footer />
      </>
    );
  }

  if (!user) {
    return (
      <>
        <Head>
          <title>Payment Details - Habesha Store</title>
        </Head>
        <Header />
        <LoadingScreen label="Redirecting to secure sign-in..." />
        <Footer />
      </>
    );
  }

  if (loading) {
    return (
      <>
        <Head>
          <title>Payment Details - Habesha Store</title>
        </Head>
        <Header />
        <LoadingScreen label="Loading transaction details..." />
        <Footer />
      </>
    );
  }

  if (!payment) {
    return (
      <>
        <Head>
          <title>{t('payment_detail.not_found', 'Payment Record Not Found')} - Habesha Store</title>
        </Head>
        <Header />
        <div className={styles.container}>
          <div className={styles.errorCard}>
            <span style={{ fontSize: '3rem' }}>📜</span>
            <h2>{t('payment_detail.not_found', 'Payment Record Not Found')}</h2>
            <p>{t('payment_detail.not_found_desc', 'We could not locate this payment record or you do not have permission to view it.')}</p>
            <Link href="/payment-history" className={styles.downloadBtn}>
              {t('payment_detail.back', '← Return to Payment Records')}
            </Link>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  const orderIdentifier =
    typeof payment.order === 'object'
      ? (payment.order?._id || payment.order?.id || 'N/A')
      : (payment.order || 'N/A');

  return (
    <>
      <Head>
        <title>{language === 'am' ? 'የክፍያ መዝገብ' : 'Payment'} #{id} - Habesha Store</title>
        <meta name="description" content="Detailed receipt and payment transaction record on Habesha Store." />
      </Head>
      <Header />
      <div className={styles.container}>
        <button
          type="button"
          className={styles.backBtn}
          onClick={() => router.push('/payment-history')}
        >
          {t('payment_detail.back', '← Return to Payment Records')}
        </button>

        <div className={styles.paymentDetail}>
          <div className={styles.header}>
            <div>
              <span className={styles.eyebrow}>{t('payment_detail.receipt_eyebrow', 'Transaction Receipt')}</span>
              <h1>{t('payment_detail.title', 'Payment Details')}</h1>
            </div>
            <Badge variant={getStatusBadgeVariant(payment.status)} size="lg">
              {payment.status?.toUpperCase()}
            </Badge>
          </div>

          {refundMsg && (
            <div style={{ background: '#eaf5ee', color: '#174f3f', padding: '1rem', borderRadius: '6px', marginBottom: '1.5rem', fontWeight: 500 }}>
              ✓ {refundMsg}
            </div>
          )}

          <div className={styles.grid}>
            <div className={styles.card}>
              <h3>{t('payment_detail.summary', 'Payment Summary')}</h3>
              <div className={styles.detail}>
                <span>{t('payment_detail.amount', 'Amount:')}</span>
                <strong>{t('common.currency', 'ETB')} {Number(payment.amount || 0).toFixed(2)}</strong>
              </div>
              <div className={styles.detail}>
                <span>{t('payment_detail.currency', 'Currency:')}</span>
                <strong>{language === 'am' ? 'ብር (ETB)' : (payment.currency || 'ETB')}</strong>
              </div>
              <div className={styles.detail}>
                <span>{t('payment_detail.method', 'Payment Method:')}</span>
                <strong className={styles.method}>{payment.paymentMethod || 'Online'}</strong>
              </div>
              <div className={styles.detail}>
                <span>{t('payment_detail.tx_id', 'Transaction ID:')}</span>
                <strong className={styles.transactionId}>
                  {payment.transactionId || payment.stripePaymentIntentId || id}
                </strong>
              </div>
            </div>

            <div className={styles.card}>
              <h3>{t('payment_detail.timestamps', 'Timestamps')}</h3>
              <div className={styles.detail}>
                <span>{t('payment_detail.created', 'Created:')}</span>
                <strong>{payment.createdAt ? new Date(payment.createdAt).toLocaleString() : '—'}</strong>
              </div>
              {payment.paidAt && (
                <div className={styles.detail}>
                  <span>{t('payment_detail.settled', 'Settled / Paid:')}</span>
                  <strong>{new Date(payment.paidAt).toLocaleString()}</strong>
                </div>
              )}
              {payment.refundedAt && (
                <div className={styles.detail}>
                  <span>{t('payment_detail.refunded', 'Refunded:')}</span>
                  <strong>{new Date(payment.refundedAt).toLocaleString()}</strong>
                </div>
              )}
            </div>

            <div className={styles.card}>
              <h3>{t('payment_detail.associated_order', 'Associated Order')}</h3>
              <div className={styles.detail}>
                <span>{t('payment_detail.order_id', 'Order ID:')}</span>
                <strong>
                  {orderIdentifier !== 'N/A' ? (
                    <Link href={`/orders/${orderIdentifier}`} style={{ color: 'var(--color-gold)', textDecoration: 'underline' }}>
                      #{orderIdentifier.toString().slice(0, 8).toUpperCase()}
                    </Link>
                  ) : (
                    language === 'am' ? 'አልተያያዘም' : 'Not attached'
                  )}
                </strong>
              </div>
              <div className={styles.detail}>
                <span>{t('payment_detail.invoice_no', 'Invoice Number:')}</span>
                <strong>{payment.invoiceNumber || (language === 'am' ? 'በመዘጋጀት ላይ' : 'Pending Generation')}</strong>
              </div>
            </div>

            {payment.refundAmount && (
              <div className={styles.card}>
                <h3>{t('payment_detail.refund_info', 'Refund Information')}</h3>
                <div className={styles.detail}>
                  <span>{t('payment_detail.refund_amount', 'Refund Amount:')}</span>
                  <strong>{t('common.currency', 'ETB')} {Number(payment.refundAmount || 0).toFixed(2)}</strong>
                </div>
                <div className={styles.detail}>
                  <span>{t('payment_detail.refund_reason', 'Reason:')}</span>
                  <strong>{payment.refundReason || (language === 'am' ? 'መደበኛ ተመላሽ' : 'Standard Refund')}</strong>
                </div>
              </div>
            )}
          </div>

          <div className={styles.actions}>
            {payment.status === 'completed' && !payment.refundAmount && (
              <button
                type="button"
                className={styles.refundBtn}
                onClick={handleRefund}
                disabled={refunding}
              >
                {refunding ? t('payment_detail.processing_refund', 'Processing Refund...') : t('payment_detail.request_refund', 'Request Transaction Refund')}
              </button>
            )}
            {payment.invoiceNumber && (
              <a href={`/invoices/${payment.invoiceNumber}`} className={styles.downloadBtn}>
                {t('payment_detail.download_invoice', 'Download Tax Invoice PDF')}
              </a>
            )}
            {orderIdentifier !== 'N/A' && (
              <Link href={`/orders/${orderIdentifier}`} className={styles.downloadBtn} style={{ background: '#222' }}>
                {t('payment_detail.view_order', 'View Full Order Details →')}
              </Link>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default PaymentDetailPage;
