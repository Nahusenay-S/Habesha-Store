import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { authAPI } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import styles from './auth.module.css';
import Link from 'next/link';
import Icon from '../components/Icon';

const RegisterPage = () => {
  const router = useRouter();
  const { login } = useAuth();
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
      <div className={`${styles.authBox} ${styles.registerBox}`}>
        <div className={styles.authImage} style={{ backgroundImage: "url('/images/portrait.svg')" }}>
          <div className={styles.imageOverlay}><h2>Heritage Redefined.</h2><p>Join a global community dedicated to the finest Ethiopian crafts.</p></div>
        </div>
        <div className={styles.authPanel}>
        <Link href="/" className={styles.brand}>Habesha Modern</Link>
        <h1 className={styles.title}>Create Your Account</h1>
        <p className={styles.subtitle}>Step into the world of luxury Ethiopian artisanry.</p>

        {error && <div className={styles.error}>{error}</div>}

        <form className={styles.authForm} onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label>Full Name</label>
            <input
              type="text"
              name="name"
              placeholder="Your name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label>Email</label>
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
            <label>Account Type</label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
            >
              <option value="buyer">Buyer</option>
              <option value="seller">Seller</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label>Password</label>
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
            <label>Confirm Password</label>
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
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <p className={styles.link}>Already have an account? <Link href="/login">Sign In</Link></p>
        <div className={styles.artistCard}><strong><Icon name="edit" size={16} /> &nbsp; Are you an Artisan?</strong><p>Showcase your craftsmanship to the world and grow your legacy.</p><Link href="/register?role=seller">Join as Artisan →</Link></div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;