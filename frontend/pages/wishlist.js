import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ProductCard from '../components/ProductCard';
import LoadingScreen from '../components/LoadingScreen';
import { useWishlistStore } from '../store/wishlistStore';
import { useCartStore } from '../store/cartStore';
import { useAuth } from '../context/AuthContext';
import styles from '../styles/wishlist.module.css';
import Icon from '../components/Icon';

const WishlistPage = () => {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const products = useWishlistStore((state) => state.items);
  const addToCart = useCartStore((state) => state.addToCart);
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login?next=/wishlist&reason=wishlist');
    }
  }, [user, authLoading, router]);

  if (authLoading || !user) {
    return (
      <>
        <Header />
        <LoadingScreen label="Unfolding your treasures..." />
        <Footer />
      </>
    );
  }

  const handleMoveAll = () => {
    if (!products.length) return;
    const inStock = products.filter((p) => p.stock > 0);
    inStock.forEach((p) => addToCart(p));
    setFeedback(`Moved ${inStock.length} pieces to your shopping bag!`);
    setTimeout(() => setFeedback(''), 3500);
  };

  return (
    <>
      <Head><title>Saved Treasures - Habesha Modern</title></Head>
      <Header />
      <main className={styles.container}>
        <div className={styles.heading}>
          <div>
            <h1>Saved Treasures</h1>
            <p>A curated collection of your favorite Ethiopian craftsmanship.</p>
          </div>
          {products.length > 0 && (
            <button type="button" className={styles.moveButton} onClick={handleMoveAll}>
              <Icon name="cart" size={15} /> &nbsp; Move all to Cart
            </button>
          )}
        </div>
        {feedback && (
          <div style={{ background: '#eaf5ee', color: '#0b3d2c', border: '1px solid #b7dfca', padding: '0.8rem 1.2rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>✓ {feedback}</span>
            <Link href="/cart" style={{ color: '#0b3d2c', fontWeight: 600, textDecoration: 'underline' }}>View Shopping Bag →</Link>
          </div>
        )}
        {products.length ? (
          <div className={styles.grid}>
            {products.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        ) : (
          <div className={styles.empty}>
            <span>♡</span>
            <h2>Your treasure chest is waiting.</h2>
            <p>Save pieces that speak to you while exploring our collection.</p>
            <Link href="/products">Explore the collection →</Link>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
};

export default WishlistPage;
