import React from 'react';
import Head from 'next/head';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ProductCard from '../components/ProductCard';
import { useWishlistStore } from '../store/wishlistStore';
import styles from '../styles/wishlist.module.css';
import Icon from '../components/Icon';

const WishlistPage = () => {
  const products = useWishlistStore((state) => state.items);

  return (
    <>
      <Head><title>Saved Treasures - Habesha Modern</title></Head>
      <Header />
      <main className={styles.container}>
        <div className={styles.heading}>
          <div><h1>Saved Treasures</h1><p>A curated collection of your favorite Ethiopian craftsmanship.</p></div>
          <button type="button" className={styles.moveButton}><Icon name="cart" size={15} /> &nbsp; Move all to Cart</button>
        </div>
        {products.length ? <div className={styles.grid}>{products.slice(0, 8).map((product) => <ProductCard key={product._id} product={product} />)}</div> : <div className={styles.empty}><span>♡</span><h2>Your treasure chest is waiting.</h2><p>Save pieces that speak to you while exploring our collection.</p><a href="/products">Explore the collection →</a></div>}
      </main>
      <Footer />
    </>
  );
};

export default WishlistPage;
