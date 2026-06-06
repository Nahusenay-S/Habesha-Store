import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';
import { paymentAPI } from '../lib/api';
import Header from '../components/Header';
import Footer from '../components/Footer';
import styles from '../styles/payment-history.module.css';

const PaymentHistoryPage = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (!user) {
      router.push('/login');
    } else {
      fetchPayments();
    }
  }, [user]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const response = await paymentAPI.getPaymentHistory();
      setPayments(response.data);
    } catch (error) {
      console.error('Failed to fetch payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPayments = payments.filter((p) => {
    if (filter === 'all') return true;
    return p.status === filter;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return '#078930';
      case 'pending':
        return '#FF9800';
      case 'failed':
        return '#CE1126';
      case 'refunded':
        return '#2196F3';
      default:
        return '#808080';
    }
  };

  if (!user) return <div>Loading...</div>;

  return (
    <>
      <Header />
      <div className={styles.container}>
        <h1>Payment History 💳</h1>

        <div className={styles.filterSection}>
          <button
            className={filter === 'all' ? styles.activeFilter : ''}
            onClick={() => setFilter('all')}
          >
            All Payments
          </button>
          <button
            className={filter === 'completed' ? styles.activeFilter : ''}
            onClick={() => setFilter('completed')}
          >
            Completed
          </button>
          <button
            className={filter === 'pending' ? styles.activeFilter : ''}
            onClick={() => setFilter('pending')}
          >
            Pending
          </button>
          <button
            className={filter === 'failed' ? styles.activeFilter : ''}
            onClick={() => setFilter('failed')}
          >
            Failed
          </button>
        </div>

        {loading ? (
          <div className={styles.loading}>Loading payments...</div>
        ) : filteredPayments.length === 0 ? (
          <div className={styles.empty}>No payments found</div>
        ) : (
          <div className={styles.paymentsTable}>
            <table>
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
                {filteredPayments.map((payment) => (
                  <tr key={payment._id}>
                    <td>{new Date(payment.createdAt).toLocaleDateString()}</td>
                    <td className={styles.amount}>Br {payment.amount.toFixed(2)}</td>
                    <td>
                      <span className={styles.badge}>{payment.paymentMethod}</span>
                    </td>
                    <td>
                      <span
                        className={styles.status}
                        style={{ color: getStatusColor(payment.status) }}
                      >
                        {payment.status.toUpperCase()}
                      </span>
                    </td>
                    <td className={styles.transactionId}>
                      {payment.transactionId || payment.stripePaymentIntentId?.slice(0, 10)}
                    </td>
                    <td>
                      {payment.invoiceNumber ? (
                        <a href={`/invoices/${payment.invoiceNumber}`} className={styles.link}>
                          View
                        </a>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td>
                      {payment.status === 'completed' && (
                        <button
                          className={styles.actionBtn}
                          onClick={() => router.push(`/payment/${payment._id}`)}
                        >
                          Details
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
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