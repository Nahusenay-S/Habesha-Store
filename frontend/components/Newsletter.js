import React, { useState } from 'react';
import styles from './Newsletter.module.css';
import Button from './Button';
import { useLanguage } from '../context/LanguageContext';

const Newsletter = () => {
  const { t, language } = useLanguage();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // 'idle' | 'loading' | 'success' | 'error'
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email || !email.includes('@') || !email.includes('.')) {
      setStatus('error');
      setErrorMessage(language === 'am' ? 'እባክዎ ትክክለኛ የኢሜይል አድራሻ ያስገቡ።' : 'Please enter a valid email address.');
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
          <span className={styles.eyebrow}>{t('newsletter.eyebrow', 'The Heritage Dispatch')}</span>
          <h2 className={styles.title}>{t('newsletter.title', 'Stories of Ethiopian craft, delivered with care.')}</h2>
          <p className={styles.description}>
            {t('newsletter.desc', 'Receive seasonal artisan spotlight stories, origin harvests of highland coffee, and invitations to curated private releases.')}
          </p>

          {status === 'success' ? (
            <div className={styles.successBox}>
              <span className={styles.checkIcon}>✓</span>
              <div>
                <strong>{t('newsletter.success_title', 'Selam! You are subscribed.')}</strong>
                <p>{t('newsletter.success_desc', 'Welcome to our community of collectors and cultural custodians.')}</p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.inputGroup}>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('newsletter.placeholder', 'Enter your email address...')}
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
                  {t('newsletter.btn', 'Subscribe')}
                </Button>
              </div>
              {status === 'error' && (
                <p className={styles.errorText}>{errorMessage}</p>
              )}
              <span className={styles.privacyNote}>
                {language === 'am' ? 'የእርስዎን ግላዊነት እናከብራለን። በማንኛውም ጊዜ ደንበኝነቱን ማቋረጥ ይችላሉ።' : 'We respect your inbox. You may unsubscribe at any time.'}
              </span>
            </form>
          )}
        </div>
      </div>
    </section>
  );
};

export default Newsletter;

