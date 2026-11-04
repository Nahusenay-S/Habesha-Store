import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { authAPI } from '../lib/api';
import styles from './auth.module.css';

const ResetPasswordPage = () => {
  const router = useRouter();
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (router.isReady && router.query.token) {
      setToken(router.query.token);
    }
  }, [router.isReady, router.query]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (!token.trim()) {
      setError('Security reset token is required.');
      return;
    }

    setLoading(true);
    try {
      await authAPI.resetPassword({ token: token.trim(), newPassword });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Unable to reset password. The link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Reset Password | Habesha Store</title>
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
              <span className={styles.brandSubtitle}>NEW CREDENTIALS</span>
              <h1>Choose a New Password</h1>
              <p>Create a secure passphrase for your Habesha Store account.</p>
            </div>

            {error && <div className={styles.error}>{error}</div>}

            {success ? (
              <div style={{ background: '#f5faf7', border: '1px solid #bce3cb', padding: '1.5rem', borderRadius: '4px', margin: '1.5rem 0' }}>
                <h3 style={{ color: '#134e35', marginBottom: '0.5rem', fontSize: '1.1rem' }}>✓ Password Reset Complete</h3>
                <p style={{ color: '#252923', fontSize: '0.9rem', lineHeight: 1.5 }}>
                  Your password has been successfully updated. You may now sign in to your sanctuary.
                </p>
                <div style={{ marginTop: '1.25rem' }}>
                  <Link
                    href="/login"
                    style={{
                      display: 'inline-block',
                      background: 'var(--color-green)',
                      color: '#ffffff',
                      padding: '0.75rem 1.5rem',
                      fontWeight: 600,
                      borderRadius: '3px',
                      textDecoration: 'none',
                    }}
                  >
                    Proceed to Sign In →
                  </Link>
                </div>
              </div>
            ) : (
              <form className={styles.authForm} onSubmit={handleSubmit}>
                {!router.query.token && (
                  <div className={styles.formGroup}>
                    <label htmlFor="token">Security Token</label>
                    <input
                      type="text"
                      id="token"
                      name="token"
                      value={token}
                      onChange={(e) => setToken(e.target.value)}
                      placeholder="Paste your reset token here"
                      required
                    />
                  </div>
                )}

                <div className={styles.formGroup}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label htmlFor="newPassword">New Password</label>
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
                    id="newPassword"
                    name="newPassword"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="confirmPassword">Confirm New Password</label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    name="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat your password"
                    required
                  />
                </div>

                <button type="submit" className={styles.submitBtn} disabled={loading}>
                  {loading ? 'Securing account...' : 'Set New Password'}
                </button>
              </form>
            )}

            <p className={styles.link} style={{ marginTop: '1.5rem' }}>
              Already know your credentials? <Link href="/login">Sign In</Link>
            </p>
          </div>

          <div className={styles.authImage} style={{ backgroundImage: "url('/images/pottery.jpg')" }}>
            <div className={styles.imageOverlay}>
              <span className={styles.imageTag}>AUTHENTIC HERITAGE</span>
              <h2>Craftsmanship that endures generations.</h2>
              <div><strong>Protected</strong> sessions <strong>Encrypted</strong> keys</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ResetPasswordPage;

