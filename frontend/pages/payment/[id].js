import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';
import { paymentAPI } from '../lib/api';
import Header from '../components/Header';
import Footer from '../components/Footer';
import styles from '../styles/payment-detail.module.css';

const PaymentDetailPage = () => {
  const router = useRouter();
  const { user } = useAuth();
  const { id } = router.query;
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refunding, setRefunding] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push('/login');
    } else if (id) {
      fetchPaymentDetail();
    }
  }, [user, id]);

  const fetchPaymentDetail = async () => {
    try {
      setLoading(true);
      const response = await paymentAPI.getPaymentById(id);
      setPayment(response.data);
    } catch (error) {
      console.error('Failed to fetch payment:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefund = async () => {
    if (!window.confirm('Are you sure you want to request a refund?')) return;

    setRefunding(true);
    try {
      await paymentAPI.processRefund({
        paymentId: id,
        reason: 'requested_by_customer',
      });
      alert('Refund request submitted successfully!');
      fetchPaymentDetail();
    } catch (error) {
      alert('Failed to process refund: ' + error.response?.data?.error);
    } finally {
      setRefunding(false);
    }
  };

  if (!user) return <div>Loading...</div>;

  if (loading) return <div className={styles.loading}>Loading payment details...</div>;

  if (!payment) return <div className={styles.error}>Payment not found</div>;

  return (
    <>
      <Header />
      <div className={styles.container}>
        <button className={styles.backBtn} onClick={() => router.back()}>
          ← Back
        </button>

        <div className={styles.paymentDetail}>
          <div className={styles.header}>
            <h1>Payment Details</h1>
            <span
              className={styles.status}
              style={{
                background:
                  payment.status === 'completed'
                    ? '#078930'
                    : payment.status === 'failed'
                    ? '#CE1126'
                    : '#FF9800',
              }}
            >
              {payment.status.toUpperCase()}
            </span>
          </div>

          <div className={styles.grid}>
            <div className={styles.card}>
              <h3>Payment Information</h3>
              <div className={styles.detail}>
                <span>Amount:</span>
                <strong>Br {payment.amount.toFixed(2)}</strong>
              </div>
              <div className={styles.detail}>
                <span>Currency:</span>
                <strong>{payment.currency}</strong>
              </div>
              <div className={styles.detail}>
                <span>Method:</span>
                <strong className={styles.method}>{payment.paymentMethod}</strong>
              </div>
              <div className={styles.detail}>
                <span>Transaction ID:</span>
                <strong className={styles.transactionId}>
                  {payment.transactionId || payment.stripePaymentIntentId}
                </strong>
              </div>
            </div>

            <div className={styles.card}>
              <h3>Dates</h3>
              <div className={styles.detail}>
                <span>Created:</span>
                <strong>{new Date(payment.createdAt).toLocaleString()}</strong>
              </div>
              {payment.paidAt && (
                <div className={styles.detail}>
                  <span>Paid:</span>
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
              <h3>Order Information</h3>
              <div className={styles.detail}>
                <span>Order ID:</span>
                <strong>{payment.order._id}</strong>
              </div>
              <div className={styles.detail}>
                <span>Invoice Number:</span>
                <strong>{payment.invoiceNumber || 'Not generated'}</strong>
              </div>
            </div>

            {payment.refundAmount && (
              <div className={styles.card}>
                <h3>Refund Information</h3>
                <div className={styles.detail}>
                  <span>Refund Amount:</span>
                  <strong>Br {payment.refundAmount.toFixed(2)}</strong>
                </div>
                <div className={styles.detail}>
                  <span>Reason:</span>
                  <strong>{payment.refundReason}</strong>
                </div>
              </div>
            )}
          </div>

          {payment.status === 'completed' && !payment.refundAmount && (
            <div className={styles.actions}>
              <button
                className={styles.refundBtn}
                onClick={handleRefund}
                disabled={refunding}
              >
                {refunding ? 'Processing...' : 'Request Refund'}
              </button>
              {payment.invoiceNumber && (
                <a href={`/invoices/${payment.invoiceNumber}`} className={styles.downloadBtn}>
                  Download Invoice
                </a>
              )}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
};

export default PaymentDetailPage;