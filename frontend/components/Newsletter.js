import React, { useState } from 'react';
import styles from './Newsletter.module.css';
import Button from './Button';

const Newsletter = () => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // 'idle' | 'loading' | 'success' | 'error'
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email || !email.includes('@') || !email.includes('.')) {
      setStatus('error');
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    setStatus('loading');
    setTimeout(() => {
      setStatus('success');
      setEmail('');
    }, 800);
  };

  return (
    <section className={styles.newsletterSection}>
      <div className={styles.container}>
        <div className={styles.content}>
          <span className={styles.eyebrow}>The Heritage Dispatch</span>
          <h2 className={styles.title}>Stories of Ethiopian craft, delivered with care.</h2>
          <p className={styles.description}>
            Receive seasonal artisan spotlight stories, origin harvests of highland coffee, and invitations to curated private releases.
          </p>

          {status === 'success' ? (
            <div className={styles.successBox}>
              <span className={styles.checkIcon}>✓</span>
              <div>
                <strong>Selam! You are subscribed.</strong>
                <p>Welcome to our community of collectors and cultural custodians.</p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.inputGroup}>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address..."
                  className={styles.input}
                  aria-label="Email address for newsletter"
                  disabled={status === 'loading'}
                  required
                />
                <Button
                  type="submit"
                  variant="gold"
                  size="md"
                  loading={status === 'loading'}
                >
                  Subscribe
                </Button>
              </div>
              {status === 'error' && (
                <p className={styles.errorText}>{errorMessage}</p>
              )}
              <span className={styles.privacyNote}>
                We respect your inbox. You may unsubscribe at any time.
              </span>
            </form>
          )}
        </div>
      </div>
    </section>
  );
};

export default Newsletter;

