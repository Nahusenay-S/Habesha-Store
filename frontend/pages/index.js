import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ProductCard from '../components/ProductCard';
import Newsletter from '../components/Newsletter';
import Icon from '../components/Icon';
import { productAPI } from '../lib/api';
import { useLanguage } from '../context/LanguageContext';
import styles from '../styles/home.module.css';

const TESTIMONIALS = [
  {
    quote:
      '“The handwoven Tibeb shawl arrived packed in natural woven fibers with an artisan card from the weaver in Gulele. The quality of cotton and intricate border embroidery is breathtaking.”',
    author: 'Almaz Kassa',
    location: 'London, United Kingdom',
    rating: 5,
  },
  {
    quote:
      '“As a coffee lover, brewing the Yirgacheffe in an authentic clay jebena has transformed our morning ritual. Single-origin notes with pure floral clarity. Incredible service.”',
    author: 'Marcus Vance',
    location: 'Washington, D.C.',
    rating: 5,
  },
  {
    quote:
      '“Finding authentic Ethiopian highland berbere with true korarima and sacred basil outside of Addis Ababa was impossible until now. The aroma fills the entire kitchen.”',
    author: 'Selamawit Tadesse',
    location: 'Toronto, Canada',
    rating: 5,
  },
];

const HomePage = () => {
  const router = useRouter();
  const { t } = useLanguage();
  const [featuredProducts, setFeaturedProducts] = useState([]);

  useEffect(() => {
    productAPI.getAll({ limit: 4 })
      .then((res) => setFeaturedProducts(res.data.products || []))
      .catch(() => setFeaturedProducts([]));
  }, []);

  return (
    <>
      <Head>
        <title>Habesha Store | Authentic Ethiopian Artisan Marketplace</title>
        <meta
          name="description"
          content="Discover authentic handwoven Ethiopian textiles, single-origin highland coffee, sacred crafts, and culinary spices ethically brought to the world."
        />
      </Head>

      <Header />

      {/* Editorial Hero */}
      <section className={styles.hero}>
        <div className={styles.heroImage}>
          <img
            src="/images/hero-heritage.jpg"
            alt="Handwoven Ethiopian textile and artisan crafts"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = '/images/heritage-textile.jpg';
            }}
          />
        </div>
        <div className={styles.heroContent}>
          <span className={styles.eyebrow}>{t('home.badge', 'The Highland Heritage Collection')}</span>
          <h1>{t('home.hero_title', 'Authentic Ethiopian Craftsmanship, Delivered Worldwide')}</h1>
          <p>
            {t('home.hero_sub', 'Handwoven textiles, sacred single-origin coffee, and highland pottery direct from master artisans in Addis Ababa, Dorze, and Harar.')}
          </p>
          <div className={styles.heroBtnGroup}>
            <button
              type="button"
              className={styles.ctaBtn}
              onClick={() => router.push('/products')}
            >
              {t('home.explore_btn', 'Explore the Collection')} <span aria-hidden="true">→</span>
            </button>
            <button
              type="button"
              className={styles.secondaryCtaBtn}
              onClick={() => router.push('/about')}
            >
              {t('home.heritage_btn', 'Our Heritage & Artisans')}
            </button>
          </div>
        </div>
      </section>

      {/* Featured Pieces Grid */}
      {featuredProducts.length > 0 && (
        <section style={{ maxWidth: '1320px', margin: '0 auto', padding: '4.5rem 2rem 2rem' }}>
          <div className={styles.sectionHeading} style={{ marginBottom: '2rem' }}>
            <div>
              <span className={styles.eyebrow}>Curated Selection</span>
              <h2>Featured Heritage Pieces</h2>
            </div>
            <Link href="/products" style={{ color: 'var(--color-green)', fontWeight: 600, textDecoration: 'underline' }}>
              View full collection →
            </Link>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '2rem' }}>
            {featuredProducts.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        </section>
      )}

      {/* Featured Categories */}
      <section className={styles.categories}>
        <div className={styles.sectionHeading}>
          <div>
            <span className={styles.eyebrow}>Shop by Story</span>
            <h2>Curated Categories</h2>
          </div>
          <Link href="/collections" style={{ color: 'var(--color-green)', fontWeight: 600, textDecoration: 'underline' }}>
            Explore editorial collections →
          </Link>
        </div>
        <div className={styles.categoryGrid}>
          <div
            className={styles.categoryCard}
            onClick={() => router.push('/products?category=coffee')}
          >
            <img src="/images/coffee.jpg" alt="Ethiopian coffee ceremony and jebena" />
            <div className={styles.categoryOverlay}>
              <span>Origin Coffee</span>
              <h3>Highland Ritual</h3>
              <p>Single-origin Sidama & Yirgacheffe</p>
            </div>
          </div>
          <div
            className={styles.categoryCard}
            onClick={() => router.push('/products?category=textiles')}
          >
            <img src="/images/textiles.jpg" alt="Handwoven Ethiopian tibeb textile" />
            <div className={styles.categoryOverlay}>
              <span>Textiles & Tibeb</span>
              <h3>Woven Heritage</h3>
              <p>Gossamer cotton spun by hand</p>
            </div>
          </div>
          <div
            className={styles.categoryCard}
            onClick={() => router.push('/products?category=crafts')}
          >
            <img src="/images/crafts.jpg" alt="Handcrafted Ethiopian pottery and cross" />
            <div className={styles.categoryOverlay}>
              <span>Pottery & Art</span>
              <h3>Made with Meaning</h3>
              <p>Objects for sacred everyday ritual</p>
            </div>
          </div>
          <div
            className={styles.categoryCard}
            onClick={() => router.push('/products?category=spices')}
          >
            <img src="/images/spices.jpg" alt="Authentic Ethiopian berbere spices" />
            <div className={styles.categoryOverlay}>
              <span>Culinary Spices</span>
              <h3>Highland Flavors</h3>
              <p>Stone-ground korarima & berbere</p>
            </div>
          </div>
        </div>
      </section>

      {/* Artisan Spotlight */}
      <section className={styles.spotlight}>
        <div className={styles.spotlightImage}>
          <img src="/images/artisan.jpg" alt="Ethiopian master weaver crafting textile" />
        </div>
        <div className={styles.spotlightCopy}>
          <span className={styles.eyebrow} style={{ color: '#e4c675' }}>Artisan Spotlight</span>
          <h2>Three generations of craft in every thread.</h2>
          <p>
            Meet the highland weavers of Addis Ababa preserving Ethiopia&apos;s ancient handloom techniques, ensuring fair wages and cultural continuity.
          </p>
          <button type="button" onClick={() => router.push('/about')}>
            Read their story →
          </button>
        </div>
      </section>

      {/* Editorial Grid */}
      <section className={styles.editorial}>
        <div className={styles.editorialHeading}>
          <span className={styles.eyebrow}>Curated for the Home</span>
          <h2>Small objects.<br />Deep roots.</h2>
        </div>
        <div className={styles.editorialGrid}>
          <div>
            <img src="/images/ceramics.jpg" alt="Traditional Ethiopian clay ceramics" />
            <span>Traditional Ceramics</span>
          </div>
          <div>
            <img src="/images/heritage-textile.jpg" alt="Natural woven cotton fabric" />
            <span>Natural Handloom Textiles</span>
          </div>
          <div>
            <img src="/images/coffee.jpg" alt="Traditional Jebena coffee brewing" />
            <span>The Coffee Ceremony</span>
          </div>
        </div>
      </section>

      {/* Customer Testimonials */}
      <section className={styles.testimonials}>
        <div className={styles.sectionHeading}>
          <div>
            <span className={styles.eyebrow}>Verified Feedback</span>
            <h2>Stories from Collectors</h2>
          </div>
        </div>
        <div className={styles.testimonialsGrid}>
          {TESTIMONIALS.map((t, idx) => (
            <article key={idx} className={styles.testimonialCard}>
              <div style={{ color: 'var(--color-gold)', marginBottom: '0.75rem', fontSize: '1rem' }}>
                {'★'.repeat(t.rating)}
              </div>
              <p className={styles.quoteText}>{t.quote}</p>
              <div className={styles.authorMeta}>
                <div>
                  <span className={styles.authorName}>{t.author}</span>
                  <span className={styles.authorLocation}>{t.location}</span>
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-green)', fontWeight: 600 }}>
                  ✓ Verified Collector
                </span>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* The Habesha Promise */}
      <section className={styles.features}>
        <span className={styles.eyebrow}>{t('home.why_title', 'The Habesha Store Standard')}</span>
        <h2>{t('home.why_sub', 'Why Choose Habesha Store?')}</h2>
        <div className={styles.featureGrid}>
          <div className={styles.featureCard}>
            <span><Icon name="check" /></span>
            <h3>{t('home.feat_artisan', '100% Master Artisan Made')}</h3>
            <p>{t('home.feat_artisan_desc', 'Direct from independent Ethiopian makers')}</p>
          </div>
          <div className={styles.featureCard}>
            <span><Icon name="truck" /></span>
            <h3>{t('home.feat_cargo', 'Ethiopian Airlines Cargo')}</h3>
            <p>{t('home.feat_cargo_desc', 'Reliable tracking via Ethiopian Airlines')}</p>
          </div>
          <div className={styles.featureCard}>
            <span><Icon name="check" /></span>
            <h3>{t('home.feat_payments', 'Secure Telebirr & Card')}</h3>
            <p>{t('home.feat_payments_desc', 'Encrypted local and global payments')}</p>
          </div>
          <div className={styles.featureCard}>
            <span><Icon name="heart" /></span>
            <h3>{t('product.provenance', 'Ethical Provenance')}</h3>
            <p>Fair trade supporting highland artisans</p>
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <Newsletter />

      <Footer />
    </>
  );
};

export default HomePage;
