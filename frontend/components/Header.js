import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';
import styles from './Header.module.css';

const Header = () => {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <div className={styles.logo}>
          <Link href="/">
            <span className={styles.logoText}>🇪🇹 Habesha Store</span>
          </Link>
        </div>

        <nav className={styles.nav}>
          <Link href="/" className={styles.navLink}>
            Home
          </Link>
          <Link href="/products" className={styles.navLink}>
            Shop
          </Link>
          <Link href="/about" className={styles.navLink}>
            About
          </Link>
        </nav>

        <div className={styles.actions}>
          <Link href="/cart" className={styles.cartBtn}>
            🛒 Cart
          </Link>
          {user ? (
            <div className={styles.userMenu}>
              <button className={styles.userBtn}>{user.name}</button>
              <div className={styles.dropdown}>
                <Link href="/dashboard">Dashboard</Link>
                {user.role === 'seller' && <Link href="/seller">Seller Hub</Link>}
                <button onClick={handleLogout}>Logout</button>
              </div>
            </div>
          ) : (
            <>
              <Link href="/login" className={styles.loginBtn}>
                Login
              </Link>
              <Link href="/register" className={styles.registerBtn}>
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;