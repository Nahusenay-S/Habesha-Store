import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';
import styles from './Header.module.css';
import Icon from './Icon';
import { useCartStore } from '../store/cartStore';

const Header = () => {
  const router = useRouter();
  const { user, logout } = useAuth();
  const cartItemCount = useCartStore((state) => state.items.reduce((count, item) => count + item.quantity, 0));
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
            <span className={styles.logoText}>Habesha Modern</span>
          </Link>
        </div>

        <nav className={styles.nav}>
          <Link href="/products" className={styles.navLink}>
            Textiles
          </Link>
          <Link href="/products?category=spices" className={styles.navLink}>
            Spices
          </Link>
          <Link href="/products?category=crafts" className={styles.navLink}>
            Art
          </Link>
          <Link href="/products?category=coffee" className={styles.navLink}>
            Coffee
          </Link>
        </nav>

        <div className={styles.actions}>
          <Link href="/products" className={styles.searchBtn} aria-label="Search collection">
            <Icon name="search" size={15} /> <span>Search heritage...</span>
          </Link>
          <Link href="/cart" className={styles.iconBtn} aria-label="Shopping cart">
            <Icon name="cart" />
            {cartItemCount > 0 && <span className={styles.cartBadge}>{cartItemCount > 99 ? '99+' : cartItemCount}</span>}
          </Link>
          {user ? (
            <div className={styles.userMenu}>
              <button className={styles.userBtn} aria-label="Open account menu">
                <span className={styles.avatar}>{user.name?.charAt(0).toUpperCase()}</span>
                <span className={styles.userName}>{user.name}</span>
              </button>
              <div className={styles.dropdown}>
                <Link href="/dashboard">Dashboard</Link>
                {user.role === 'admin' && <Link href="/admin">Admin console</Link>}
                <Link href="/wishlist">Saved treasures</Link>
                {user.role === 'seller' && <Link href="/vendor">Vendor Terminal</Link>}
                <button onClick={handleLogout}>Logout</button>
              </div>
            </div>
          ) : (
            <>
              <Link href="/login" className={styles.iconBtn} aria-label="Sign in"><Icon name="user" /></Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;