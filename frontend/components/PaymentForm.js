import React, { useState } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { orderAPI, paymentAPI } from '../lib/api';
import styles from './PaymentForm.module.css';

const PaymentForm = ({ orderId, amount, onSuccess }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [cardholderName, setCardholderName] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!stripe || !elements) {
      setError('Stripe not loaded');
      return;
    }

    setLoading(true);

    try {
      // Step 1: Create payment intent
      const intentResponse = await paymentAPI.createStripePaymentIntent({
        orderId,
        amount,
      });

      const { clientSecret, paymentIntentId, paymentId } = intentResponse.data;

      // Step 2: Confirm payment with card
      const { paymentIntent, error: stripeError } = await stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: {
            card: elements.getElement(CardElement),
            billing_details: {
              name: cardholderName,
            },
          },
        }
      );

      if (stripeError) {
        setError(stripeError.message);
        setLoading(false);
        return;
      }

      // Step 3: Confirm payment on backend
      const confirmResponse = await paymentAPI.confirmStripePayment({
        paymentIntentId,
        paymentId,
      });

      setSuccess(true);
      if (onSuccess) {
        onSuccess(confirmResponse.data.payment);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className={styles.successMessage}>
        <div className={styles.checkmark}>✓</div>
        <h2>Payment Successful!</h2>
        <p>Your order has been placed successfully.</p>
        <p className={styles.amount}>Amount Paid: Br {amount.toFixed(2)}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={styles.paymentForm}>
      <h2>Enter Payment Details</h2>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.formGroup}>
        <label>Cardholder Name</label>
        <input
          type="text"
          value={cardholderName}
          onChange={(e) => setCardholderName(e.target.value)}
          placeholder="Your name"
          required
          className={styles.input}
        />
      </div>

      <div className={styles.formGroup}>
        <label>Card Details</label>
        <div className={styles.cardElement}>
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: '16px',
                  color: '#424770',
                  '::placeholder': {
                    color: '#aab7c4',
                  },
                },
                invalid: {
                  color: '#9e2146',
                },
              },
            }}
          />
        </div>
      </div>

      <div className={styles.amountSummary}>
        <span>Total Amount:</span>
        <span className={styles.amountValue}>Br {amount.toFixed(2)}</span>
      </div>

      <button
        type="submit"
        disabled={!stripe || loading}
        className={styles.submitBtn}
      >
        {loading ? 'Processing...' : `Pay Br ${amount.toFixed(2)}`}
      </button>
    </form>
  );
};

export default PaymentForm;