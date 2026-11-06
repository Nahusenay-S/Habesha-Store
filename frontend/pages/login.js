import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { authAPI } from '../lib/api';
import styles from '../pages/auth.module.css';
import Icon from '../components/Icon';

const LoginPage = () => {
  const router = useRouter();
  const { login } = useAuth();
  const { t, language } = useLanguage();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authAPI.login(formData);
      login(response.data.user, response.data.token);
      const nextPath = typeof router.query.next === 'string' ? router.query.next : null;
      const destination = response.data.user?.role === 'admin' ? '/admin' : response.data.user?.role === 'seller' ? '/vendor' : nextPath || '/dashboard';
      router.push(destination);
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>{t('auth.sign_in_title', 'Welcome Back')} - Habesha Store</title>
      </Head>
      <div className={styles.authContainer}>
        <div className={styles.authBox}>
          <div className={styles.authPanel}>
            <Link href="/" className={styles.brand}>Habesha Store</Link>
            <h1 className={styles.title}>{t('auth.sign_in_title', 'Welcome Back')}</h1>
            <p className={styles.subtitle}>{t('auth.sign_in_sub', 'Access the finest Ethiopian craftsmanship and heritage.')}</p>
            <div style={{ margin: '1rem 0 1.5rem', display: 'flex', alignItems: 'center', gap: '0.6rem', background: 'var(--color-cream)', padding: '0.65rem 1rem', borderRadius: '4px', border: '1px solid var(--color-line)' }}>
              <span style={{ color: 'var(--color-gold)', fontSize: '1.1rem' }}>✦</span>
              <span style={{ fontSize: '0.82rem', color: 'var(--color-dark)', fontWeight: 500 }}>
                {language === 'am' ? 'የተረጋገጠ የኢትዮጵያ እደ-ጥበብ ባለሙያዎች እና ደንበኞች መረብ' : 'Certified Ethiopian Artisan & Collector Network'}
              </span>
            </div>

            {router.query.reason === 'cart' && (
              <div style={{ background: '#fdf9f0', border: '1px solid #d8be8d', padding: '0.75rem 1rem', borderRadius: '4px', marginBottom: '1rem', color: '#684a14', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>🔒</span>
                <span><strong>{language === 'am' ? 'የደንበኛ መግቢያ ያስፈልጋል' : 'Collector Sign-in Required'}</strong>: {language === 'am' ? 'ዕቃዎችን ወደ ቅርጫትዎ ለመጨመር እባክዎ ይግቡ።' : 'Please sign in to add pieces to your shopping bag.'}</span>
              </div>
            )}
            {router.query.reason === 'wishlist' && (
              <div style={{ background: '#fdf9f0', border: '1px solid #d8be8d', padding: '0.75rem 1rem', borderRadius: '4px', marginBottom: '1rem', color: '#684a14', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>♡</span>
                <span><strong>{language === 'am' ? 'የተወደዱ ቅርሶች' : 'Treasures & Wishlist'}</strong>: {language === 'am' ? 'ዕቃዎችን ለበኋላ ለማስቀመጥ እባክዎ ይግቡ።' : 'Please sign in to save pieces to your favorite treasures.'}</span>
              </div>
            )}
            {router.query.reason === 'checkout' && (
              <div style={{ background: '#fdf9f0', border: '1px solid #d8be8d', padding: '0.75rem 1rem', borderRadius: '4px', marginBottom: '1rem', color: '#684a14', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>🛍️</span>
                <span><strong>{language === 'am' ? 'የክፍያ ማረጋገጫ' : 'Checkout Sanctuary'}</strong>: {language === 'am' ? 'ትዕዛዝዎን ለማጠናቀቅ እባክዎ ይግቡ።' : 'Please sign in to finalize your delivery and secure your order.'}</span>
              </div>
            )}

            {error && <div className={styles.error}>{error}</div>}
          <form className={styles.authForm} onSubmit={handleSubmit}>
            <div className={styles.formGroup}>
              <label htmlFor="email">{t('auth.email_label', 'Email address')}</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="name@example.com"
                required
              />
            </div>
            <div className={styles.formGroup}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label htmlFor="password">{t('auth.password_label', 'Password')}</label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ background: 'none', border: 'none', color: 'var(--color-gold)', fontSize: '0.78rem', cursor: 'pointer', padding: 0 }}
                >
                  {showPassword ? (language === 'am' ? 'ደብቅ' : 'Hide') : (language === 'am' ? 'አሳይ' : 'Show')}
                </button>
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                required
              />
              <div style={{ textAlign: 'right', marginTop: '0.4rem' }}>
                <Link href="/forgot-password" style={{ fontSize: '0.8rem', color: 'var(--color-gold)', textDecoration: 'none' }}>
                  {t('auth.forgot_password_link', 'Forgot password?')}
                </Link>
              </div>
            </div>
            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading ? (language === 'am' ? 'በመግባት ላይ...' : 'Signing in...') : t('auth.sign_in_btn', 'Sign In')}
            </button>
          </form>
          <p className={styles.link}>
            {language === 'am' ? 'መለያ የለዎትም?' : "Don't have an account?"} <Link href="/register">{t('auth.register_btn', 'Create Account')}</Link>
          </p>
          <Link href="/register?role=seller" className={styles.artistCard}>
            <Icon name="edit" /> <span><small>{language === 'am' ? 'የእጅ ጥበብ አምራች ነዎት?' : 'ARE YOU A CREATOR?'}</small><br />{language === 'am' ? 'እንደ እደ-ጥበብ ባለሙያ ይቀላቀሉ →' : 'Join as an Artisan →'}</span>
          </Link>
          </div>
          <div className={styles.authImage} style={{ backgroundImage: "url('/images/coffee.jpg')" }}>
            <div className={styles.imageOverlay}>
              <span className={styles.imageTag}>{language === 'am' ? 'የባህል ቅርሶች ስብስብ' : 'THE HERITAGE COLLECTION'}</span>
              <h2>{language === 'am' ? 'እያንዳንዱ የቡና ፍሬ የጥንታዊውን ደጋ ታሪክ ይናገራል።' : 'Every bean tells a story of ancient highlands.'}</h2>
              <div><strong>100%</strong> {language === 'am' ? 'ተፈጥሮአዊ ቡና' : 'organic arabica'} <strong>12k+</strong> {language === 'am' ? 'ንቁ ባለሙያዎች' : 'active artisans'}</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default LoginPage;
