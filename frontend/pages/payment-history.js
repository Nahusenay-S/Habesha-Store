import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';
import { paymentAPI } from '../lib/api';
import Header from '../components/Header';
import Footer from '../components/Footer';
import LoadingScreen from '../components/LoadingScreen';
import EmptyState from '../components/EmptyState';
import Badge from '../components/Badge';
import styles from '../styles/payment-history.module.css';

const PaymentHistoryPage = () => {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?next=/payment-history');
    } else if (user) {
      fetchPayments();
    }
  }, [user, authLoading]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const response = await paymentAPI.getPaymentHistory();
      setPayments(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Failed to fetch payments:', error);
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredPayments = payments.filter((p) => {
    if (filter === 'all') return true;
    return p.status === filter;
  });

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
          <title>Payment History - Habesha Store</title>
        </Head>
        <Header />
        <LoadingScreen label="Loading your payment records..." />
        <Footer />
      </>
    );
  }

  if (!user) {
    return (
      <>
        <Head>
          <title>Payment History - Habesha Store</title>
        </Head>
        <Header />
        <LoadingScreen label="Redirecting to secure sign-in..." />
        <Footer />
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Payment History - Habesha Store</title>
        <meta name="description" content="Review your payment records, transactions, and invoices on Habesha Store." />
      </Head>
      <Header />
      <div className={styles.container}>
        <div className={styles.headerRow}>
          <div>
            <span className={styles.eyebrow}>Ledger & Invoices</span>
            <h1>Payment History</h1>
          </div>
        </div>

        <div className={styles.filterSection}>
          {['all', 'completed', 'pending', 'failed', 'refunded'].map((statusKey) => (
            <button
              key={statusKey}
              type="button"
              className={filter === statusKey ? styles.activeFilter : ''}
              onClick={() => setFilter(statusKey)}
            >
              {statusKey === 'all'
                ? 'All Payments'
                : statusKey.charAt(0).toUpperCase() + statusKey.slice(1)}
            </button>
          ))}
        </div>

        {loading ? (
          <LoadingScreen compact label="Retrieving ledger records..." />
        ) : filteredPayments.length === 0 ? (
          <EmptyState
            icon="💳"
            title="No payment records found"
            description={
              filter === 'all'
                ? 'You have not completed any payments yet. Explore our handcrafted Ethiopian collections!'
                : `No transactions found matching status "${filter}".`
            }
            actionLabel={filter !== 'all' ? 'Reset Status Filter' : 'Explore Collections'}
            actionHref={filter === 'all' ? '/products' : undefined}
            onAction={filter !== 'all' ? () => setFilter('all') : undefined}
          />
        ) : (
          <div className={styles.paymentsTable}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Method</th>
                  <th>Status</th>
                  <th>Transaction ID</th>
                  <th>Invoice</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.map((payment) => {
                  const paymentKey = payment._id || payment.id || Math.random();
                  const paymentId = payment._id || payment.id;
                  return (
                    <tr key={paymentKey}>
                      <td>{payment.createdAt ? new Date(payment.createdAt).toLocaleDateString() : '—'}</td>
                      <td className={styles.amount}>
                        ETB {Number(payment.amount || 0).toFixed(2)}
                      </td>
                      <td>
                        <span className={styles.badge}>{payment.paymentMethod || 'Online'}</span>
                      </td>
                      <td>
                        <Badge variant={getStatusBadgeVariant(payment.status)} size="sm">
                          {payment.status?.toUpperCase() || 'UNKNOWN'}
                        </Badge>
                      </td>
                      <td className={styles.transactionId}>
                        {payment.transactionId || payment.stripePaymentIntentId?.slice(0, 12) || '—'}
                      </td>
                      <td>
                        {payment.invoiceNumber ? (
                          <a href={`/invoices/${payment.invoiceNumber}`} className={styles.link}>
                            View Invoice
                          </a>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td>
                        {paymentId && (
                          <button
                            type="button"
                            className={styles.actionBtn}
                            onClick={() => router.push(`/payment/${paymentId}`)}
                          >
                            Details
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <Footer />
    </>
  );
};

export default PaymentHistoryPage;
