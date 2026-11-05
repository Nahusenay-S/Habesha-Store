import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';
import styles from './Header.module.css';
import Icon from './Icon';
import { useCartStore } from '../store/cartStore';
import { useWishlistStore } from '../store/wishlistStore';
import { notificationAPI } from '../lib/api';

const Header = () => {
  const router = useRouter();
  const { user, logout } = useAuth();
  const cartItemCount = useCartStore((state) => state.items.reduce((count, item) => count + item.quantity, 0));
  const wishlistCount = useWishlistStore((state) => state.items.length);
  const [notifications, setNotifications] = useState([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const notifRef = useRef(null);

  // Close mobile drawer on route change
  useEffect(() => {
    const handleRouteChange = () => setMobileMenuOpen(false);
    router.events.on('routeChangeComplete', handleRouteChange);
    return () => router.events.off('routeChangeComplete', handleRouteChange);
  }, [router]);

  const loadNotifications = () => {
    if (user) {
      notificationAPI.getAll()
        .then((res) => setNotifications(res.data || []))
        .catch(() => setNotifications([]));
    }
  };

  useEffect(() => {
    loadNotifications();
  }, [user]);

  // Close notifications dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifs(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleMarkAllRead = async () => {
    try {
      await notificationAPI.markAllRead();
      setNotifications((curr) => curr.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error('Mark read error:', err);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push('/products');
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            type="button"
            className={styles.hamburgerBtn}
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open menu"
          >
            ☰
          </button>
          <div className={styles.logo}>
            <Link href="/">
              <span className={styles.logoText}>Habesha Store</span>
            </Link>
          </div>
        </div>

        <nav className={styles.nav}>
          <Link href="/products" className={styles.navLink}>
            Shop
          </Link>
          <Link href="/collections" className={styles.navLink}>
            Collections
          </Link>
          <Link href="/products?category=textiles" className={styles.navLink}>
            Textiles
          </Link>
          <Link href="/products?category=coffee" className={styles.navLink}>
            Coffee
          </Link>
          <Link href="/products?category=spices" className={styles.navLink}>
            Spices
          </Link>
          <Link href="/products?category=crafts" className={styles.navLink}>
            Art & Crafts
          </Link>
          <Link href="/about" className={styles.navLink}>
            Our Story
          </Link>
        </nav>

        <div className={styles.actions}>
          <form onSubmit={handleSearchSubmit} className={styles.searchBtn}>
            <Icon name="search" size={15} />
            <input
              type="text"
              placeholder="Search collection..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ background: 'transparent', border: 'none', outline: 'none', width: '100%', fontSize: '0.78rem', color: 'inherit' }}
            />
          </form>

          {/* Notifications Bell for logged in users */}
          {user && (
            <div className={styles.notifMenu} ref={notifRef}>
              <button
                type="button"
                className={styles.notifBtn}
                onClick={() => setShowNotifs(!showNotifs)}
                aria-label="View notifications"
                title="Notifications"
              >
                <span>🔔</span>
                {unreadCount > 0 && (
                  <span className={styles.cartBadge}>{unreadCount > 9 ? '9+' : unreadCount}</span>
                )}
              </button>

              {showNotifs && (
                <div className={styles.notifDropdown}>
                  <div className={styles.notifHeader}>
                    <strong>Notifications ({unreadCount} new)</strong>
                    {unreadCount > 0 && (
                      <button type="button" onClick={handleMarkAllRead}>
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className={styles.notifList}>
                    {notifications.length === 0 ? (
                      <div className={styles.notifEmpty}>No notifications yet.</div>
                    ) : (
                      notifications.slice(0, 7).map((n) => (
                        <Link
                          key={n._id}
                          href={n.orderId ? (user.role === 'seller' ? '/vendor' : `/orders/${n.orderId}`) : n.productId ? `/products/${n.productId}` : '/dashboard'}
                          className={`${styles.notifItem} ${!n.isRead ? styles.notifItemUnread : ''}`}
                          onClick={() => {
                            if (!n.isRead) {
                              notificationAPI.markRead(n._id).catch(() => {});
                              setNotifications((curr) =>
                                curr.map((item) => (item._id === n._id ? { ...item, isRead: true } : item))
                              );
                            }
                            setShowNotifs(false);
                          }}
                        >
                          <span className={styles.notifTitle}>{n.title}</span>
                          <p className={styles.notifMessage}>{n.message}</p>
                          <span className={styles.notifTime}>{new Date(n.createdAt).toLocaleString()}</span>
                        </Link>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {user ? (
            <>
              <Link href="/wishlist" className={styles.iconBtn} aria-label="Saved treasures" title="Saved treasures">
                <Icon name="heart" />
                {wishlistCount > 0 && <span className={styles.cartBadge}>{wishlistCount > 99 ? '99+' : wishlistCount}</span>}
              </Link>

              <Link href="/cart" className={styles.iconBtn} aria-label="Shopping bag" title="Shopping bag">
                <Icon name="cart" />
                {cartItemCount > 0 && <span className={styles.cartBadge}>{cartItemCount > 99 ? '99+' : cartItemCount}</span>}
              </Link>
            </>
          ) : (
            <>
              <Link href="/login?next=/wishlist&reason=wishlist" className={styles.iconBtn} aria-label="Saved treasures (Sign in required)" title="Saved treasures (Sign in required)">
                <Icon name="heart" />
              </Link>

              <Link href="/login?next=/cart&reason=cart" className={styles.iconBtn} aria-label="Shopping bag (Sign in required)" title="Shopping bag (Sign in required)">
                <Icon name="cart" />
              </Link>
            </>
          )}

          {user ? (
            <div className={styles.userMenu}>
              <button className={styles.userBtn} aria-label="Open account menu">
                <span className={styles.avatar}>{user.name?.charAt(0).toUpperCase()}</span>
                <span className={styles.userName}>{user.name}</span>
              </button>
              <div className={styles.dropdown}>
                <Link href="/dashboard">Dashboard</Link>
                <Link href="/orders">My Orders</Link>
                <Link href="/wishlist">Saved treasures</Link>
                {user.role === 'seller' && <Link href="/vendor">Vendor Terminal</Link>}
                {user.role === 'admin' && <Link href="/admin">Admin console</Link>}
                <Link href="/payment-history">Payment History</Link>
                <button onClick={handleLogout}>Logout</button>
              </div>
            </div>
          ) : (
            <Link href="/login" className={styles.iconBtn} aria-label="Sign in">
              <Icon name="user" />
            </Link>
          )}
        </div>
      </div>

      {/* Mobile Navigation Drawer Backdrop */}
      {mobileMenuOpen && (
        <div
          className={styles.mobileBackdrop}
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile Navigation Drawer */}
      <aside className={`${styles.mobileDrawer} ${mobileMenuOpen ? styles.mobileDrawerOpen : ''}`}>
        <div className={styles.drawerHeader}>
          <span className={styles.logoText} style={{ fontSize: '1.2rem' }}>Habesha Store</span>
          <button
            type="button"
            className={styles.drawerCloseBtn}
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close navigation menu"
          >
            ✕
          </button>
        </div>

        <div className={styles.drawerSearch}>
          <form onSubmit={(e) => { handleSearchSubmit(e); setMobileMenuOpen(false); }} className={styles.drawerSearchForm}>
            <Icon name="search" size={15} />
            <input
              type="text"
              placeholder="Search items, spices..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </form>
        </div>

        <div className={styles.drawerSection}>
          <span className={styles.drawerSectionLabel}>Curated Collections</span>
          <div className={styles.drawerNavLinks}>
            <Link href="/collections" className={styles.drawerNavLink} onClick={() => setMobileMenuOpen(false)}>
              <span>🏛️</span> The Collections
            </Link>
            <Link href="/products?category=textiles" className={styles.drawerNavLink} onClick={() => setMobileMenuOpen(false)}>
              <span>✨</span> Handwoven Textiles
            </Link>
            <Link href="/products?category=spices" className={styles.drawerNavLink} onClick={() => setMobileMenuOpen(false)}>
              <span>🌶️</span> Highland Spices
            </Link>
            <Link href="/products?category=crafts" className={styles.drawerNavLink} onClick={() => setMobileMenuOpen(false)}>
              <span>🏺</span> Pottery & Artwork
            </Link>
            <Link href="/products?category=coffee" className={styles.drawerNavLink} onClick={() => setMobileMenuOpen(false)}>
              <span>☕</span> Origin Coffee
            </Link>
            <Link href="/products" className={styles.drawerNavLink} onClick={() => setMobileMenuOpen(false)}>
              <span>📦</span> All Works
            </Link>
          </div>
        </div>

        <div className={styles.drawerSection}>
          <span className={styles.drawerSectionLabel}>Account & Orders</span>
          <div className={styles.drawerNavLinks}>
            {user ? (
              <>
                <Link href="/dashboard" className={styles.drawerNavLink} onClick={() => setMobileMenuOpen(false)}>
                  <span>👤</span> Dashboard ({user.name})
                </Link>
                <Link href="/orders" className={styles.drawerNavLink} onClick={() => setMobileMenuOpen(false)}>
                  <span>📜</span> My Orders
                </Link>
                <Link href="/wishlist" className={styles.drawerNavLink} onClick={() => setMobileMenuOpen(false)}>
                  <span>🤎</span> Saved Treasures
                </Link>
                {user.role === 'seller' && (
                  <Link href="/vendor" className={styles.drawerNavLink} onClick={() => setMobileMenuOpen(false)}>
                    <span>💼</span> Vendor Terminal
                  </Link>
                )}
                {user.role === 'admin' && (
                  <Link href="/admin" className={styles.drawerNavLink} onClick={() => setMobileMenuOpen(false)}>
                    <span>⚙️</span> Admin Console
                  </Link>
                )}
                <Link href="/payment-history" className={styles.drawerNavLink} onClick={() => setMobileMenuOpen(false)}>
                  <span>💳</span> Payment History
                </Link>
                <button
                  type="button"
                  className={styles.drawerNavLink}
                  style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer' }}
                  onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                >
                  <span>🚪</span> Sign Out
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className={styles.drawerNavLink} onClick={() => setMobileMenuOpen(false)}>
                  <span>🔑</span> Sign In
                </Link>
                <Link href="/register" className={styles.drawerNavLink} onClick={() => setMobileMenuOpen(false)}>
                  <span>✨</span> Create Collector Account
                </Link>
              </>
            )}
          </div>
        </div>

        <div className={styles.drawerFooter}>
          Authentic Ethiopian Heritage & Modern Craftsmanship
        </div>
      </aside>
    </header>
  );
};

export default Header;