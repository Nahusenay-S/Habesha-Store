import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Breadcrumbs from '../components/Breadcrumbs';
import { useLanguage } from '../context/LanguageContext';
import styles from '../styles/collections.module.css';

const CollectionsPage = () => {
  const { t, language } = useLanguage();

  const collections = [
    {
      id: 'heritage-textiles',
      title: t('collections.textiles_title', 'Woven Heritage & Tibeb'),
      tag: t('collections.textiles_tag', 'Textile Collection'),
      image: '/images/heritage-textile.jpg',
      description: t('collections.textiles_desc', 'Centuries of highland handloom traditions brought to life in gossamer netela shawls, heavy ceremonial gabi blankets, and intricate colorful tibeb embroidery.'),
      link: '/products?category=textiles',
      count: t('collections.textiles_count', 'Highland Handloom'),
    },
    {
      id: 'coffee-ceremony',
      title: t('collections.coffee_title', 'Coffee Culture & The Jebena Ritual'),
      tag: t('collections.coffee_tag', 'Single-Origin Coffee'),
      image: '/images/coffee.jpg',
      description: t('collections.coffee_desc', 'Single-origin Arabica from the birthplace of coffee: Yirgacheffe, Sidama, and Harar, alongside fire-blackened clay jebena pots and hand-carved coffee tables.'),
      link: '/products?category=coffee',
      count: t('collections.coffee_count', 'Origin Harvests'),
    },
    {
      id: 'highland-spices',
      title: t('collections.spices_title', 'Highland Culinary & Berbere Blends'),
      tag: t('collections.spices_tag', 'Spices & Flavors'),
      image: '/images/spices.jpg',
      description: t('collections.spices_desc', 'Sun-dried red peppers stone-ground with korarima cardamom, sacred basil, and fenugreek. Handcrafted spice blends formulated by traditional homemakers.'),
      link: '/products?category=spices',
      count: t('collections.spices_count', 'Culinary Masterpieces'),
    },
    {
      id: 'pottery-and-crafts',
      title: t('collections.pottery_title', 'Clay, Wood & Sacred Iconography'),
      tag: t('collections.pottery_tag', 'Crafts & Art'),
      image: '/images/crafts.jpg',
      description: t('collections.pottery_desc', 'Ancient Lalibela processional crosses, hand-shaped clay serving dishes, and parchment paintings preserving sacred Ethiopian artistic heritage.'),
      link: '/products?category=crafts',
      count: t('collections.pottery_count', 'Heirloom Crafts'),
    },
    {
      id: 'filigree-jewelry',
      title: t('collections.jewelry_title', 'Traditional Filigree & Silver Adornments'),
      tag: t('collections.jewelry_tag', 'Jewelry & Adornment'),
      image: '/images/jewelry.jpg',
      description: t('collections.jewelry_desc', 'Intricate silver beadwork, Gondarine coin pendants, and golden filigree necklaces crafted by master silversmiths using ancestral techniques.'),
      link: '/products?category=jewelry',
      count: t('collections.jewelry_count', 'Precious Craft'),
    },
    {
      id: 'ceramics-and-home',
      title: t('collections.ceramics_title', 'Ceramics for Everyday Ritual'),
      tag: t('collections.ceramics_tag', 'Home & Living'),
      image: '/images/ceramics.jpg',
      description: t('collections.ceramics_desc', 'Hand-thrown clay cups (sini), natural grass-woven mesob baskets, and incense burners (mabt) that bring the warmth of an Ethiopian home into modern spaces.'),
      link: '/products?category=crafts',
      count: t('collections.ceramics_count', 'Living Traditions'),
    },
  ];

  return (
    <>
      <Head>
        <title>{t('collections.page_title', 'Curated Editorial Collections')} | Habesha Store</title>
        <meta
          name="description"
          content={t('collections.subtitle', 'Explore curated collections of authentic Ethiopian artisan works.')}
        />
      </Head>

      <Header />

      <main className={styles.container}>
        <Breadcrumbs items={[{ label: t('nav.collections', 'Collections') }]} />

        <div className={styles.header}>
          <span className={styles.eyebrow}>{t('collections.eyebrow', 'Curated Stories')}</span>
          <h1 className={styles.title}>{t('collections.page_title', 'The Editorial Collections')}</h1>
          <p className={styles.subtitle}>
            {t('collections.subtitle', 'Each collection is a thematic journey into Ethiopian cultural heritage, curated around ancestral rituals, artisanal craft, and time-honored materials.')}
          </p>
        </div>

        <div className={styles.grid}>
          {collections.map((col) => (
            <article key={col.id} className={styles.collectionCard}>
              <div className={styles.imageWrapper}>
                <img
                  src={col.image}
                  alt={col.title}
                  className={styles.image}
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = '/images/heritage-textile.jpg';
                  }}
                />
                <span className={styles.tag}>{col.tag}</span>
              </div>
              <div className={styles.content}>
                <h2 className={styles.cardTitle}>{col.title}</h2>
                <p className={styles.cardDesc}>{col.description}</p>
                <div className={styles.footerRow}>
                  <span className={styles.itemCount}>{col.count}</span>
                  <Link href={col.link} className={styles.actionLink}>
                    {t('collections.explore_btn', 'Explore Collection →')}
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </main>

      <Footer />
    </>
  );
};

export default CollectionsPage;

