import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../lib/api';
import styles from '../pages/auth.module.css';
import Icon from '../components/Icon';

const LoginPage = () => {
  const router = useRouter();
  const { login } = useAuth();
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
        <title>Login - Habesha Store</title>
      </Head>
      <div className={styles.authContainer}>
        <div className={styles.authBox}>
          <div className={styles.authPanel}>
            <Link href="/" className={styles.brand}>Habesha Store</Link>
            <h1 className={styles.title}>Welcome Back</h1>
            <p className={styles.subtitle}>Access the finest Ethiopian craftsmanship and heritage.</p>
            <div style={{ margin: '1rem 0 1.5rem', display: 'flex', alignItems: 'center', gap: '0.6rem', background: 'var(--color-cream)', padding: '0.65rem 1rem', borderRadius: '4px', border: '1px solid var(--color-line)' }}>
              <span style={{ color: 'var(--color-gold)', fontSize: '1.1rem' }}>✦</span>
              <span style={{ fontSize: '0.82rem', color: 'var(--color-dark)', fontWeight: 500 }}>
                Certified Ethiopian Artisan & Collector Network
              </span>
            </div>

            {router.query.reason === 'cart' && (
              <div style={{ background: '#fdf9f0', border: '1px solid #d8be8d', padding: '0.75rem 1rem', borderRadius: '4px', marginBottom: '1rem', color: '#684a14', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>🔒</span>
                <span><strong>Collector Sign-in Required</strong>: Please sign in to add pieces to your shopping bag.</span>
              </div>
            )}
            {router.query.reason === 'wishlist' && (
              <div style={{ background: '#fdf9f0', border: '1px solid #d8be8d', padding: '0.75rem 1rem', borderRadius: '4px', marginBottom: '1rem', color: '#684a14', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>♡</span>
                <span><strong>Treasures & Wishlist</strong>: Please sign in to save pieces to your favorite treasures.</span>
              </div>
            )}
            {router.query.reason === 'checkout' && (
              <div style={{ background: '#fdf9f0', border: '1px solid #d8be8d', padding: '0.75rem 1rem', borderRadius: '4px', marginBottom: '1rem', color: '#684a14', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>🛍️</span>
                <span><strong>Checkout Sanctuary</strong>: Please sign in to finalize your delivery and secure your order.</span>
              </div>
            )}

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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label htmlFor="password">Password</label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ background: 'none', border: 'none', color: 'var(--color-gold)', fontSize: '0.78rem', cursor: 'pointer', padding: 0 }}
                >
                  {showPassword ? 'Hide' : 'Show'}
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
                  Forgot password?
                </Link>
              </div>
            </div>
            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
          <p className={styles.link}>Don&apos;t have an account? <Link href="/register">Create Account</Link></p>
          <Link href="/register?role=seller" className={styles.artistCard}><Icon name="edit" /> <span><small>ARE YOU A CREATOR?</small><br />Join as an Artisan →</span></Link>
          </div>
          <div className={styles.authImage} style={{ backgroundImage: "url('/images/coffee.jpg')" }}>
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
