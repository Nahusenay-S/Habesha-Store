import React from 'react';
import Head from 'next/head';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useRouter } from 'next/router';
import styles from '../styles/home.module.css';
import Icon from '../components/Icon';

const HomePage = () => {
  const router = useRouter();

  return (
    <>
      <Head>
        <title>Habesha Store - Ethiopian E-Commerce Platform</title>
        <meta name="description" content="Shop authentic Ethiopian products" />
      </Head>

      <Header />

      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <span className={styles.eyebrow}>New collection · 2024</span>
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
            src="/images/heritage-textile.svg"
            alt="Handwoven Ethiopian textile"
          />
        </div>
      </section>

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
            <img src="/images/coffee.svg" alt="Ethiopian coffee beans" />
            <div className={styles.categoryOverlay}><span>Coffee</span><h3>Highland ritual</h3><p>Single-origin Arabica</p></div>
          </div>
          <div className={styles.categoryCard} onClick={() => router.push('/products?category=textiles')}>
            <img src="/images/heritage-textile.svg" alt="Woven textile" />
            <div className={styles.categoryOverlay}><span>Textiles</span><h3>Woven heritage</h3><p>Made by hand, made to last</p></div>
          </div>
          <div className={styles.categoryCard} onClick={() => router.push('/products?category=crafts')}>
            <img src="/images/artisan.svg" alt="Ethiopian artisan craft" />
            <div className={styles.categoryOverlay}><span>Crafts</span><h3>Made with meaning</h3><p>Objects for everyday ritual</p></div>
          </div>
          <div className={styles.categoryCard} onClick={() => router.push('/products?category=spices')}>
            <img src="/images/spices.svg" alt="Ethiopian spices" />
            <div className={styles.categoryOverlay}><span>Spices</span><h3>Color of the kitchen</h3><p>Warmth from the highlands</p></div>
          </div>
        </div>
      </section>

      <section className={styles.spotlight}>
        <div className={styles.spotlightImage}>
          <img src="/images/artisan.svg" alt="Ethiopian artisan weaving textiles" />
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
          <div><img src="/images/ceramics.svg" alt="Traditional Ethiopian ceramic" /><span>Traditional ceramics</span></div>
          <div><img src="/images/heritage-textile.svg" alt="Natural woven fabric" /><span>Natural textiles</span></div>
          <div><img src="/images/coffee.svg" alt="Coffee ceremony" /><span>Coffee ceremony</span></div>
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