import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import { paymentAPI } from '../../lib/api';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import LoadingScreen from '../../components/LoadingScreen';
import Badge from '../../components/Badge';
import styles from '../../styles/payment-detail.module.css';

const PaymentDetailPage = () => {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
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
          <title>Payment Not Found - Habesha Store</title>
        </Head>
        <Header />
        <div className={styles.container}>
          <div className={styles.errorCard}>
            <span style={{ fontSize: '3rem' }}>📜</span>
            <h2>Payment Record Not Found</h2>
            <p>We could not locate this payment record or you do not have permission to view it.</p>
            <Link href="/payment-history" className={styles.downloadBtn}>
              ← Return to Payment History
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
        <title>Payment #{id} - Habesha Store</title>
        <meta name="description" content="Detailed receipt and payment transaction record on Habesha Store." />
      </Head>
      <Header />
      <div className={styles.container}>
        <button
          type="button"
          className={styles.backBtn}
          onClick={() => router.push('/payment-history')}
        >
          ← Return to Payment Records
        </button>

        <div className={styles.paymentDetail}>
          <div className={styles.header}>
            <div>
              <span className={styles.eyebrow}>Transaction Receipt</span>
              <h1>Payment Details</h1>
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
              <h3>Payment Summary</h3>
              <div className={styles.detail}>
                <span>Amount:</span>
                <strong>ETB {Number(payment.amount || 0).toFixed(2)}</strong>
              </div>
              <div className={styles.detail}>
                <span>Currency:</span>
                <strong>{payment.currency || 'ETB'}</strong>
              </div>
              <div className={styles.detail}>
                <span>Payment Method:</span>
                <strong className={styles.method}>{payment.paymentMethod || 'Online'}</strong>
              </div>
              <div className={styles.detail}>
                <span>Transaction ID:</span>
                <strong className={styles.transactionId}>
                  {payment.transactionId || payment.stripePaymentIntentId || id}
                </strong>
              </div>
            </div>

            <div className={styles.card}>
              <h3>Timestamps</h3>
              <div className={styles.detail}>
                <span>Created:</span>
                <strong>{payment.createdAt ? new Date(payment.createdAt).toLocaleString() : '—'}</strong>
              </div>
              {payment.paidAt && (
                <div className={styles.detail}>
                  <span>Settled / Paid:</span>
                  <strong>{new Date(payment.paidAt).toLocaleString()}</strong>
                </div>
              )}
              {payment.refundedAt && (
                <div className={styles.detail}>
                  <span>Refunded:</span>
                  <strong>{new Date(payment.refundedAt).toLocaleString()}</strong>
                </div>
              )}
            </div>

            <div className={styles.card}>
              <h3>Associated Order</h3>
              <div className={styles.detail}>
                <span>Order ID:</span>
                <strong>
                  {orderIdentifier !== 'N/A' ? (
                    <Link href={`/orders/${orderIdentifier}`} style={{ color: 'var(--color-gold)', textDecoration: 'underline' }}>
                      #{orderIdentifier.toString().slice(0, 8).toUpperCase()}
                    </Link>
                  ) : (
                    'Not attached'
                  )}
                </strong>
              </div>
              <div className={styles.detail}>
                <span>Invoice Number:</span>
                <strong>{payment.invoiceNumber || 'Pending Generation'}</strong>
              </div>
            </div>

            {payment.refundAmount && (
              <div className={styles.card}>
                <h3>Refund Information</h3>
                <div className={styles.detail}>
                  <span>Refund Amount:</span>
                  <strong>ETB {Number(payment.refundAmount || 0).toFixed(2)}</strong>
                </div>
                <div className={styles.detail}>
                  <span>Reason:</span>
                  <strong>{payment.refundReason || 'Standard Refund'}</strong>
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
                {refunding ? 'Processing Refund...' : 'Request Transaction Refund'}
              </button>
            )}
            {payment.invoiceNumber && (
              <a href={`/invoices/${payment.invoiceNumber}`} className={styles.downloadBtn}>
                Download Tax Invoice PDF
              </a>
            )}
            {orderIdentifier !== 'N/A' && (
              <Link href={`/orders/${orderIdentifier}`} className={styles.downloadBtn} style={{ background: '#222' }}>
                View Full Order Details →
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
