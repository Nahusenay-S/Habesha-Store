import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { paymentAPI } from '../lib/api';
import styles from './PayPalPayment.module.css';

const PayPalPayment = ({ orderId, amount, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [paypalOrderId, setPaypalOrderId] = useState(null);
  const [paymentId, setPaymentId] = useState(null);
  const router = useRouter();

  useEffect(() => {
    if (window.paypal) {
      initializePayPal();
    }
  }, [paypalOrderId]);

  const initializePayPal = async () => {
    try {
      // Create PayPal order
      const response = await paymentAPI.createPayPalOrder({
        orderId,
      });

      setPaypalOrderId(response.data.paypalOrderId);
      setPaymentId(response.data.paymentId);

      // Render PayPal button
      window.paypal.Buttons({
        createOrder: () => response.data.paypalOrderId,
        onApprove: async (data) => {
          setLoading(true);
          try {
            // Capture payment
            const captureResponse = await paymentAPI.capturePayPalPayment({
              paypalOrderId: data.orderID,
              paymentId: response.data.paymentId,
            });

            if (onSuccess) {
              onSuccess(captureResponse.data.payment);
            }
          } catch (err) {
            setError(err.response?.data?.error || 'Payment capture failed');
          } finally {
            setLoading(false);
          }
        },
        onError: (err) => {
          setError('Payment error: ' + err.message);
        },
      }).render('#paypal-button-container');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to initialize PayPal');
    }
  };

  return (
    <div className={styles.paypalPayment}>
      <div className={styles.header}>
        <span className={styles.logo}>PayPal</span>
        <p>Fast & Secure Payment</p>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.amountDisplay}>
        <span>Amount to Pay:</span>
        <strong>${(amount / 100).toFixed(2)}</strong>
      </div>

      <div id="paypal-button-container" className={styles.buttonContainer}></div>

      <div className={styles.info}>
        <p>💳 Secure payment powered by PayPal</p>
      </div>
    </div>
  );
};

export default PayPalPayment;