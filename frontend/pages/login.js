import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import apiClient from '../lib/apiClient';
import styles from '../pages/auth.module.css';
import Icon from '../components/Icon';

const LoginPage = () => {
  const router = useRouter();
  const { login } = useAuth();
  const [formData, setFormData] = useState({ email: '', password: '' });
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
      const response = await apiClient.post('/auth/login', formData);
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
        <title>Login - Habesha Store</title>
      </Head>
      <div className={styles.authContainer}>
        <div className={styles.authBox}>
          <div className={styles.authPanel}>
            <Link href="/" className={styles.brand}>Habesha Store</Link>
            <h1 className={styles.title}>Welcome Back</h1>
            <p className={styles.subtitle}>Access the finest Ethiopian craftsmanship and heritage.</p>
            <div className={styles.socialRow}>
              <button type="button"><strong className={styles.googleMark}>G</strong> Google</button>
              <button type="button">Apple</button>
            </div>
            <div className={styles.divider}>or with email</div>
          {error && <div className={styles.error}>{error}</div>}
          <form className={styles.authForm} onSubmit={handleSubmit}>
            <div className={styles.formGroup}>
              <label htmlFor="email">Email address</label>
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
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                required
              />
            </div>
            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
          <p className={styles.link}>Don&apos;t have an account? <Link href="/register">Create Account</Link></p>
          <Link href="/register?role=seller" className={styles.artistCard}><Icon name="edit" /> <span><small>ARE YOU A CREATOR?</small><br />Join as an Artisan →</span></Link>
          </div>
          <div className={styles.authImage} style={{ backgroundImage: "url('/images/coffee.svg')" }}>
            <div className={styles.imageOverlay}>
              <span className={styles.imageTag}>THE HERITAGE COLLECTION</span>
              <h2>Every bean tells a story of ancient highlands.</h2>
              <div><strong>100%</strong> organic arabica <strong>12k+</strong> active artisans</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default LoginPage;
