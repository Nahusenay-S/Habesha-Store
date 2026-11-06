import React, { useState } from 'react';
import Modal from './Modal';
import styles from './ChapaCheckoutModal.module.css';
import { useLanguage } from '../context/LanguageContext';

const ChapaCheckoutModal = ({
  isOpen,
  onClose,
  order,
  txRef,
  onPaymentSuccess,
}) => {
  const { language } = useLanguage();
  const [method, setMethod] = useState('telebirr'); // telebirr | cbe | awash | card
  const [phone, setPhone] = useState(order?.shippingAddress?.phone || '0911223344');
  const [step, setStep] = useState('input'); // input | prompt | processing | success
  const [pin, setPin] = useState('1234');
  const [cardNumber, setCardNumber] = useState('4242 4242 4242 4242');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvv, setCardCvv] = useState('888');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!order) return null;

  const totalAmount = Number(order.totalAmount || 0).toFixed(2);
  const reference = txRef || `HB-${(order._id || order.id || '').slice(0, 8).toUpperCase()}`;

  const handleInitiate = (e) => {
    e.preventDefault();
    if (method === 'card') {
      // Simulate 3DS card verification
      setStep('processing');
      setTimeout(() => {
        handleFinalApproval();
      }, 1800);
    } else {
      // Show realistic USSD push authorization prompt for mobile money
      setStep('prompt');
    }
  };

  const handleFinalApproval = async () => {
    setIsSubmitting(true);
    setStep('processing');
    try {
      if (onPaymentSuccess) {
        await onPaymentSuccess(reference);
      }
      setStep('success');
      setTimeout(() => {
        setIsSubmitting(false);
        setStep('input');
        onClose();
      }, 1500);
    } catch (err) {
      setIsSubmitting(false);
      setStep('input');
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setStep('input');
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} maxWidth="540px">
      <div className={styles.chapaWrapper}>
        {/* Chapa Gateway Header */}
        <div className={styles.chapaHeader}>
          <div className={styles.brandArea}>
            <span className={styles.chapaLogo}>chapa</span>
            <div>
              <strong style={{ display: 'block', fontSize: '0.95rem' }}>Habesha Store</strong>
              <span className={styles.merchantTag}>Verified Heritage Merchant</span>
            </div>
          </div>
          <div className={styles.amountArea}>
            <span className={styles.amountLabel}>Total to Pay</span>
            <span className={styles.amountValue}>ETB {totalAmount}</span>
          </div>
        </div>

        {/* Sandbox Indicator */}
        <div className={styles.sandboxNotice}>
          <span>🧪 Test Gateway Simulator • Ref: {reference}</span>
          <span className={styles.sandboxBadge}>Sandbox Mode</span>
        </div>

        {/* Method Tabs */}
        {step === 'input' && (
          <div className={styles.methodTabs}>
            <button
              type="button"
              className={`${styles.tabBtn} ${method === 'telebirr' ? styles.tabBtnActive : ''}`}
              onClick={() => setMethod('telebirr')}
            >
              <span className={styles.tabIcon}>📱</span>
              <span>Telebirr</span>
            </button>
            <button
              type="button"
              className={`${styles.tabBtn} ${method === 'cbe' ? styles.tabBtnActive : ''}`}
              onClick={() => setMethod('cbe')}
            >
              <span className={styles.tabIcon}>🏦</span>
              <span>CBE Birr</span>
            </button>
            <button
              type="button"
              className={`${styles.tabBtn} ${method === 'awash' ? styles.tabBtnActive : ''}`}
              onClick={() => setMethod('awash')}
            >
              <span className={styles.tabIcon}>🏛️</span>
              <span>Awash Birr</span>
            </button>
            <button
              type="button"
              className={`${styles.tabBtn} ${method === 'card' ? styles.tabBtnActive : ''}`}
              onClick={() => setMethod('card')}
            >
              <span className={styles.tabIcon}>💳</span>
              <span>Card</span>
            </button>
          </div>
        )}

        {/* Modal Body */}
        <div className={styles.bodyContent}>
          {step === 'input' && (
            <form onSubmit={handleInitiate}>
              {method !== 'card' ? (
                <>
                  <div className={styles.formGroup}>
                    <label>
                      {method === 'telebirr' ? 'Telebirr Phone Number' : method === 'cbe' ? 'CBE Birr Mobile Number' : 'Awash Birr Mobile Number'}
                    </label>
                    <input
                      type="tel"
                      className={styles.formInput}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="0911223344"
                      required
                    />
                    <p className={styles.hintText}>
                      A secure USSD payment authorization request will be sent to this phone.
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className={styles.formGroup}>
                    <label>Card Number</label>
                    <input
                      type="text"
                      className={styles.formInput}
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      placeholder="4242 4242 4242 4242"
                      required
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className={styles.formGroup}>
                      <label>Expiry (MM/YY)</label>
                      <input
                        type="text"
                        className={styles.formInput}
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        placeholder="12/28"
                        required
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>CVV</label>
                      <input
                        type="password"
                        maxLength="4"
                        className={styles.formInput}
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value)}
                        placeholder="•••"
                        required
                      />
                    </div>
                  </div>
                </>
              )}

              <button type="submit" className={styles.payButton}>
                <span>🔒 Pay ETB {totalAmount}</span>
              </button>
            </form>
          )}

          {step === 'prompt' && (
            <div className={styles.ussdPrompt}>
              <div className={styles.ussdIcon}>📲</div>
              <div className={styles.ussdTitle}>Authorize on Your Phone</div>
              <p className={styles.ussdDesc}>
                USSD authorization prompt sent to <strong>{phone}</strong> for <strong>ETB {totalAmount}</strong>.
              </p>
              <div style={{ margin: '1rem 0' }}>
                <span style={{ fontSize: '0.78rem', color: '#6b7280', display: 'block', marginBottom: '0.25rem' }}>
                  Enter test wallet PIN:
                </span>
                <input
                  type="password"
                  maxLength="4"
                  className={styles.pinInput}
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                />
              </div>
              <button
                type="button"
                onClick={handleFinalApproval}
                disabled={isSubmitting}
                className={styles.payButton}
                style={{ marginTop: '0.5rem' }}
              >
                {isSubmitting ? 'Verifying with Gateway...' : '✓ Approve & Complete Payment'}
              </button>
              <button
                type="button"
                onClick={() => setStep('input')}
                style={{ background: 'none', border: 'none', color: '#6b7280', fontSize: '0.82rem', marginTop: '0.75rem', cursor: 'pointer', textDecoration: 'underline' }}
              >
                Change Payment Method
              </button>
            </div>
          )}

          {step === 'processing' && (
            <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
              <div style={{ width: '40px', height: '40px', border: '3px solid #e5e7eb', borderTopColor: '#00ac51', borderRadius: '50%', margin: '0 auto 1rem', animation: 'spin 0.8s linear infinite' }} />
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              <strong style={{ fontSize: '1.05rem', color: '#0b3d2c', display: 'block', marginBottom: '0.35rem' }}>
                Connecting to Chapa Banking Switch...
              </strong>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#6b7280' }}>
                Confirming authorization with {method.toUpperCase()} and updating order #{reference}
              </p>
            </div>
          )}

          {step === 'success' && (
            <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
              <div style={{ width: '56px', height: '56px', background: '#eaf5ee', color: '#00ac51', borderRadius: '50%', display: 'grid', placeItems: 'center', fontSize: '1.8rem', margin: '0 auto 1rem', border: '2px solid #00ac51' }}>
                ✓
              </div>
              <strong style={{ fontSize: '1.2rem', color: '#00ac51', display: 'block', marginBottom: '0.4rem' }}>
                Payment Successfully Verified!
              </strong>
              <p style={{ margin: 0, fontSize: '0.88rem', color: '#4b5563' }}>
                ETB {totalAmount} paid to Habesha Store via {method.toUpperCase()}.
              </p>
            </div>
          )}

          <div className={styles.securityNote}>
            <span>🔒 256-Bit SSL Encrypted</span>
            <span>•</span>
            <span>National Bank of Ethiopia Regulated</span>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default ChapaCheckoutModal;
