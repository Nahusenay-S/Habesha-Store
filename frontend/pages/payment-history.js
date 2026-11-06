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
import { useLanguage } from '../context/LanguageContext';
import styles from '../styles/payment-history.module.css';

const PaymentHistoryPage = () => {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { t, language } = useLanguage();
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
            <span className={styles.eyebrow}>{language === 'am' ? 'የክፍያ መዝገብ እና ደረሰኞች' : 'Ledger & Invoices'}</span>
            <h1>{t('payments.title', 'Payment History')}</h1>
          </div>
        </div>

        <div className={styles.filterSection}>
          {[
            { key: 'all', label: t('payments.all', 'All Payments') },
            { key: 'completed', label: t('payments.completed', 'Completed') },
            { key: 'pending', label: t('payments.pending', 'Pending') },
            { key: 'failed', label: t('payments.failed', 'Failed') },
            { key: 'refunded', label: t('payments.refunded', 'Refunded') },
          ].map(({ key, label }) => (
            <button
              key={key}
              type="button"
              className={filter === key ? styles.activeFilter : ''}
              onClick={() => setFilter(key)}
            >
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <LoadingScreen compact label={language === 'am' ? 'የክፍያ መዝገብዎን በማምጣት ላይ...' : 'Retrieving ledger records...'} />
        ) : filteredPayments.length === 0 ? (
          <EmptyState
            icon="💳"
            title={language === 'am' ? 'ምንም የክፍያ መዝገብ አልተገኘም' : 'No payment records found'}
            description={
              filter === 'all'
                ? (language === 'am' ? 'እስካሁን ምንም ዓይነት ክፍያ አልፈጸሙም። የተመረጡ የኢትዮጵያ ቅርሶቻችንን ይጎብኙ!' : 'You have not completed any payments yet. Explore our handcrafted Ethiopian collections!')
                : (language === 'am' ? `በ "${filter}" ሁኔታ የተመዘገበ ክፍያ አልተገኘም።` : `No transactions found matching status "${filter}".`)
            }
            actionLabel={filter !== 'all' ? (language === 'am' ? 'ማጣሪያውን መልስ' : 'Reset Status Filter') : t('nav.shop', 'Explore Collections')}
            actionHref={filter === 'all' ? '/products' : undefined}
            onAction={filter !== 'all' ? () => setFilter('all') : undefined}
          />
        ) : (
          <div className={styles.paymentsTable}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>{t('payments.date', 'Date')}</th>
                  <th>{t('payments.amount', 'Amount')}</th>
                  <th>{t('payments.method', 'Method')}</th>
                  <th>{t('payments.status', 'Status')}</th>
                  <th>{t('payments.transaction_id', 'Transaction ID')}</th>
                  <th>{t('payments.invoice', 'Invoice')}</th>
                  <th>{language === 'am' ? 'ተግባር' : 'Action'}</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.map((payment) => {
                  const paymentKey = payment._id || payment.id || Math.random();
                  const paymentId = payment._id || payment.id;
                  const statusLabel =
                    payment.status === 'completed'
                      ? t('payments.completed', 'Completed')
                      : payment.status === 'pending'
                      ? t('payments.pending', 'Pending')
                      : payment.status === 'failed'
                      ? t('payments.failed', 'Failed')
                      : payment.status === 'refunded'
                      ? t('payments.refunded', 'Refunded')
                      : (payment.status?.toUpperCase() || 'UNKNOWN');
                  return (
                    <tr key={paymentKey}>
                      <td>{payment.createdAt ? new Date(payment.createdAt).toLocaleDateString() : '—'}</td>
                      <td className={styles.amount}>
                        {t('common.currency', 'ETB')} {Number(payment.amount || 0).toFixed(2)}
                      </td>
                      <td>
                        <span className={styles.badge}>{payment.paymentMethod || 'Online'}</span>
                      </td>
                      <td>
                        <Badge variant={getStatusBadgeVariant(payment.status)} size="sm">
                          {statusLabel}
                        </Badge>
                      </td>
                      <td className={styles.transactionId}>
                        {payment.transactionId || payment.stripePaymentIntentId?.slice(0, 12) || '—'}
                      </td>
                      <td>
                        {payment.invoiceNumber ? (
                          <a href={`/invoices/${payment.invoiceNumber}`} className={styles.link}>
                            {t('payments.view_invoice', 'View Invoice')}
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
                            {t('payments.details_btn', 'Details')}
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
