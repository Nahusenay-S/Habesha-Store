import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useRouter } from 'next/router';
import styles from '../styles/home.module.css';
import Icon from '../components/Icon';
import ProductCard from '../components/ProductCard';
import { productAPI } from '../lib/api';

const HomePage = () => {
  const router = useRouter();
  const [featuredProducts, setFeaturedProducts] = useState([]);

  useEffect(() => {
    productAPI.getAll({ limit: 4 })
      .then((res) => setFeaturedProducts(res.data.products || []))
      .catch(() => setFeaturedProducts([]));
  }, []);

  return (
    <>
      <Head>
        <title>Habesha Store - Ethiopian E-Commerce Platform</title>
        <meta name="description" content="Shop authentic Ethiopian products" />
      </Head>

      <Header />

      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <span className={styles.eyebrow}>Artisan Crafts · Direct from Ethiopia</span>
          <h1>Objects with a story, made to be kept.</h1>
          <p>Discover authentic textiles, coffee, spices, and art crafted by Ethiopian makers and delivered to your doorstep.</p>
          <button
            className={styles.ctaBtn}
            onClick={() => router.push('/products')}
          >
            Explore the collection <span aria-hidden="true">→</span>
          </button>
        </div>
        <div className={styles.heroImage}>
          <img
            src="/images/hero-heritage.jpg"
            alt="Handwoven Ethiopian textile"
            onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/images/heritage-textile.jpg'; }}
          />
        </div>
      </section>

      {featuredProducts.length > 0 && (
        <section style={{ maxWidth: '1320px', margin: '0 auto', padding: '4rem 2rem 2rem' }}>
          <div className={styles.sectionHeading} style={{ marginBottom: '2rem' }}>
            <div>
              <span className={styles.eyebrow}>Curated Selection</span>
              <h2>Featured Heritage Pieces</h2>
            </div>
            <button onClick={() => router.push('/products')}>View full collection →</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '2rem' }}>
            {featuredProducts.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        </section>
      )}

      <section className={styles.categories}>
        <div className={styles.sectionHeading}>
          <div>
            <span className={styles.eyebrow}>Shop by story</span>
            <h2>Featured categories</h2>
          </div>
          <button onClick={() => router.push('/products')}>View all works →</button>
        </div>
        <div className={styles.categoryGrid}>
          <div className={styles.categoryCard} onClick={() => router.push('/products?category=coffee')}>
            <img src="/images/coffee.jpg" alt="Ethiopian coffee beans" />
            <div className={styles.categoryOverlay}><span>Coffee</span><h3>Highland ritual</h3><p>Single-origin Arabica</p></div>
          </div>
          <div className={styles.categoryCard} onClick={() => router.push('/products?category=textiles')}>
            <img src="/images/textiles.jpg" alt="Woven textile" />
            <div className={styles.categoryOverlay}><span>Textiles</span><h3>Woven heritage</h3><p>Made by hand, made to last</p></div>
          </div>
          <div className={styles.categoryCard} onClick={() => router.push('/products?category=crafts')}>
            <img src="/images/crafts.jpg" alt="Ethiopian artisan craft" />
            <div className={styles.categoryOverlay}><span>Crafts</span><h3>Made with meaning</h3><p>Objects for everyday ritual</p></div>
          </div>
          <div className={styles.categoryCard} onClick={() => router.push('/products?category=spices')}>
            <img src="/images/spices.jpg" alt="Ethiopian spices" />
            <div className={styles.categoryOverlay}><span>Spices</span><h3>Color of the kitchen</h3><p>Warmth from the highlands</p></div>
          </div>
        </div>
      </section>

      <section className={styles.spotlight}>
        <div className={styles.spotlightImage}>
          <img src="/images/artisan.jpg" alt="Ethiopian artisan weaving textiles" />
        </div>
        <div className={styles.spotlightCopy}>
          <span className={styles.eyebrow}>Artisan spotlight</span>
          <h2>Three generations of craft in every thread.</h2>
          <p>Meet the makers preserving Ethiopia’s hand-weaving traditions, one heirloom at a time.</p>
          <button onClick={() => router.push('/about')}>Read their story →</button>
        </div>
      </section>

      <section className={styles.editorial}>
        <div className={styles.editorialHeading}>
          <span className={styles.eyebrow}>Curated for the home</span>
          <h2>Small objects.<br />Deep roots.</h2>
        </div>
        <div className={styles.editorialGrid}>
          <div><img src="/images/ceramics.jpg" alt="Traditional Ethiopian ceramic" /><span>Traditional ceramics</span></div>
          <div><img src="/images/heritage-textile.jpg" alt="Natural woven fabric" /><span>Natural textiles</span></div>
          <div><img src="/images/coffee.jpg" alt="Coffee ceremony" /><span>Coffee ceremony</span></div>
        </div>
      </section>

      <section className={styles.features}>
        <span className={styles.eyebrow}>The Habesha promise</span>
        <h2>Why choose Habesha Store?</h2>
        <div className={styles.featureGrid}>
          <div className={styles.featureCard}>
            <span><Icon name="check" /></span>
            <h3>Authentic Products</h3>
            <p>Direct from Ethiopian artisans</p>
          </div>
          <div className={styles.featureCard}>
            <span><Icon name="truck" /></span>
            <h3>Fast Shipping</h3>
            <p>Reliable delivery service</p>
          </div>
          <div className={styles.featureCard}>
            <span><Icon name="check" /></span>
            <h3>Secure Payments</h3>
            <p>Safe and encrypted transactions</p>
          </div>
          <div className={styles.featureCard}>
            <span><Icon name="heart" /></span>
            <h3>Trusted Reviews</h3>
            <p>Verified buyer feedback</p>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
};

export default HomePage;