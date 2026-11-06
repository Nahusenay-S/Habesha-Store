import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { authAPI } from '../lib/api';
import { useLanguage } from '../context/LanguageContext';
import styles from './auth.module.css';

const ForgotPasswordPage = () => {
  const { t, language } = useLanguage();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState('');
  const [devToken, setDevToken] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setLoading(true);

    try {
      const response = await authAPI.forgotPassword({ email });
      setSuccessMessage(response.data.message || (language === 'am' ? 'መለያ ካለዎት መመሪያው ወደ ኢሜይልዎ ተልኳል።' : 'If an account exists, instructions have been sent.'));
      if (response.data.resetToken) {
        setDevToken(response.data.resetToken);
      }
    } catch (err) {
      setError(err.response?.data?.error || (language === 'am' ? 'ጥያቄዎትን ማስተናገድ አልተቻለም።' : 'Unable to process your request.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>{language === 'am' ? 'የይለፍ ቃል መልስ' : 'Forgot Password'} | Habesha Store</title>
      </Head>
      <div className={styles.authContainer}>
        <div className={styles.authCard}>
          <div className={styles.authFormSection}>
            <div className={styles.logo}>
              <Link href="/">
                <span className={styles.logoAmharic}>ሐበሻ</span>
                <span className={styles.logoLatin}>HABESHA STORE</span>
              </Link>
            </div>
            <div className={styles.authHeader}>
              <span className={styles.brandSubtitle}>{language === 'am' ? 'የመለያ መልሶ ማግኛ' : 'ACCOUNT RECOVERY'}</span>
              <h1>{language === 'am' ? 'የይለፍ ቃልዎን ይቀይሩ' : 'Reset Your Key'}</h1>
              <p>{language === 'am' ? 'የተመዘገቡበትን የኢሜይል አድራሻ ያስገቡና የማስተካከያ ሊንክ እንልክልዎታለን።' : 'Enter the email address tied to your account and we will dispatch a secure reset link.'}</p>
            </div>

            {error && <div className={styles.error}>{error}</div>}

            {successMessage ? (
              <div style={{ background: '#f5faf7', border: '1px solid #bce3cb', padding: '1.25rem', borderRadius: '4px', margin: '1.5rem 0' }}>
                <p style={{ color: '#134e35', fontSize: '0.92rem', lineHeight: 1.5 }}>
                  ✓ {successMessage}
                </p>
                {devToken && (
                  <div style={{ marginTop: '1rem', borderTop: '1px solid #c8e7d4', paddingTop: '0.75rem' }}>
                    <small style={{ color: 'var(--color-gray)', display: 'block', marginBottom: '0.4rem' }}>
                      [{language === 'am' ? 'የማረጋገጫ ሊንክ' : 'Dev Environment Verification Link'}]:
                    </small>
                    <Link
                      href={`/reset-password?token=${devToken}&email=${encodeURIComponent(email)}`}
                      style={{ color: 'var(--color-green)', fontWeight: 600, textDecoration: 'underline', fontSize: '0.85rem' }}
                    >
                      {language === 'am' ? 'ወደ ይለፍ ቃል መቀየሪያ ይሂዱ →' : 'Proceed to Reset Password with Token →'}
                    </Link>
                  </div>
                )}
                <div style={{ marginTop: '1.25rem' }}>
                  <Link href="/login" style={{ color: 'var(--color-green)', fontWeight: 600, fontSize: '0.88rem' }}>
                    {language === 'am' ? '← ወደ መግቢያ ተመለስ' : '← Return to Sign In'}
                  </Link>
                </div>
              </div>
            ) : (
              <form className={styles.authForm} onSubmit={handleSubmit}>
                <div className={styles.formGroup}>
                  <label htmlFor="email">{language === 'am' ? 'የተመዘገበ የኢሜይል አድራሻ' : 'Registered Email Address'}</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    required
                  />
                </div>
                <button type="submit" className={styles.submitBtn} disabled={loading}>
                  {loading ? (language === 'am' ? 'በመላክ ላይ...' : 'Dispatching instructions...') : (language === 'am' ? 'የማስተካከያ መመሪያ ላክ' : 'Send Reset Instructions')}
                </button>
              </form>
            )}

            <p className={styles.link} style={{ marginTop: '1.5rem' }}>
              {language === 'am' ? 'የይለፍ ቃልዎን አስታወሱ?' : 'Remembered your credentials?'} <Link href="/login">{t('auth.sign_in_btn', 'Sign In')}</Link>
            </p>
          </div>

          <div className={styles.authImage} style={{ backgroundImage: "url('/images/heritage-textile.jpg')" }}>
            <div className={styles.imageOverlay}>
              <span className={styles.imageTag}>{language === 'am' ? 'እውነተኛ ቅርስ' : 'AUTHENTIC HERITAGE'}</span>
              <h2>{language === 'am' ? 'የዘመናት ጥበብን በታማኝነት መጠበቅ።' : 'Preserving centuries of timeless artistry.'}</h2>
              <div><strong>{language === 'am' ? 'የተጠበቀ' : 'Protected'}</strong> {language === 'am' ? 'ምስጠራ' : 'encryption'} <strong>{language === 'am' ? 'የተረጋገጠ' : 'Verified'}</strong> {language === 'am' ? 'ምንጭ' : 'provenance'}</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ForgotPasswordPage;

