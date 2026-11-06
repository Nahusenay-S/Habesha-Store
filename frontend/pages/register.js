import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { authAPI } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import styles from './auth.module.css';
import Link from 'next/link';
import Icon from '../components/Icon';

const RegisterPage = () => {
  const router = useRouter();
  const { login } = useAuth();
  const { t, language } = useLanguage();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'buyer',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [queryApplied, setQueryApplied] = useState(false);

  React.useEffect(() => {
    if (router.query.role === 'seller' && !queryApplied) {
      setFormData((previous) => ({ ...previous, role: 'seller' }));
      setQueryApplied(true);
    }
  }, [router.query.role, queryApplied]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const response = await authAPI.register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
      });

      login(response.data.user, response.data.token);
      const destination = response.data.user?.role === 'seller' ? '/vendor' : '/dashboard';
      router.push(destination);
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.authContainer}>
      <Head>
        <title>{t('auth.register_title', 'Create Your Account')} - Habesha Store</title>
      </Head>
      <div className={`${styles.authBox} ${styles.registerBox}`}>
        <div className={styles.authImage} style={{ backgroundImage: "url('/images/portrait.jpg')" }}>
          <div className={styles.imageOverlay}>
            <h2>{language === 'am' ? 'የትውልድ ቅርስ በዘመናዊ መንገድ።' : 'Heritage Redefined.'}</h2>
            <p>{language === 'am' ? 'የኢትዮጵያን ባህላዊ ጥበቦች ወደሚያደንቀው ዓለም አቀፍ ማህበረሰብ ይቀላቀሉ።' : 'Join a global community dedicated to the finest Ethiopian crafts.'}</p>
          </div>
        </div>
        <div className={styles.authPanel}>
        <Link href="/" className={styles.brand}>Habesha Store</Link>
        <h1 className={styles.title}>{t('auth.register_title', 'Create Your Account')}</h1>
        <p className={styles.subtitle}>{t('auth.register_sub', 'Step into the world of luxury Ethiopian artisanry.')}</p>

        {error && <div className={styles.error}>{error}</div>}

        <form className={styles.authForm} onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label>{t('auth.name_label', 'Full Name')}</label>
            <input
              type="text"
              name="name"
              placeholder={language === 'am' ? 'ስምዎትን ያስገቡ' : 'Your name'}
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label>{t('auth.email_label', 'Email')}</label>
            <input
              type="email"
              name="email"
              placeholder="your@email.com"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label>{language === 'am' ? 'የመለያ አይነት' : 'Account Type'}</label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
            >
              <option value="buyer">{t('auth.buyer_role', 'Buyer / Collector')}</option>
              <option value="seller">{t('auth.seller_role', 'Artisan / Maker')}</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label>{t('auth.password_label', 'Password')}</label>
            <input
              type="password"
              name="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label>{t('auth.confirm_password_label', 'Confirm Password')}</label>
            <input
              type="password"
              name="confirmPassword"
              placeholder="••••••••"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />
          </div>

          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? (language === 'am' ? 'መለያ በመፍጠር ላይ...' : 'Creating Account...') : t('auth.register_btn', 'Create Account')}
          </button>
        </form>

        <p className={styles.link}>
          {t('auth.have_account', 'Already have an account?')} <Link href="/login">{t('auth.sign_in_btn', 'Sign In')}</Link>
        </p>
        <div className={styles.artistCard}>
          <strong><Icon name="edit" size={16} /> &nbsp; {language === 'am' ? 'የእደ-ጥበብ ባለሙያ ነዎት?' : 'Are you an Artisan?'}</strong>
          <p>{language === 'am' ? 'የእጅ ጥበብዎን ለዓለም በማሳየት ገቢዎትን ያሳድጉ።' : 'Showcase your craftsmanship to the world and grow your legacy.'}</p>
          <Link href="/register?role=seller">{language === 'am' ? 'እንደ ባለሙያ ይቀላቀሉ →' : 'Join as Artisan →'}</Link>
        </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;