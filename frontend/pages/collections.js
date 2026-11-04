import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Breadcrumbs from '../components/Breadcrumbs';
import styles from '../styles/collections.module.css';

const COLLECTIONS = [
  {
    id: 'heritage-textiles',
    title: 'Woven Heritage & Tibeb',
    tag: 'Textile Collection',
    image: '/images/heritage-textile.jpg',
    description:
      'Centuries of highland handloom traditions brought to life in gossamer netela shawls, heavy ceremonial gabi blankets, and intricate colorful tibeb embroidery.',
    link: '/products?category=textiles',
    count: 'Highland Handloom',
  },
  {
    id: 'coffee-ceremony',
    title: 'Coffee Culture & The Jebena Ritual',
    tag: 'Single-Origin Coffee',
    image: '/images/coffee.jpg',
    description:
      'Single-origin Arabica from the birthplace of coffee: Yirgacheffe, Sidama, and Harar, alongside fire-blackened clay jebena pots and hand-carved coffee tables.',
    link: '/products?category=coffee',
    count: 'Origin Harvests',
  },
  {
    id: 'highland-spices',
    title: 'Highland Culinary & Berbere Blends',
    tag: 'Spices & Flavors',
    image: '/images/spices.jpg',
    description:
      'Sun-dried red peppers stone-ground with korarima cardamom, sacred basil, and fenugreek. Handcrafted spice blends formulated by traditional homemakers.',
    link: '/products?category=spices',
    count: 'Culinary Masterpieces',
  },
  {
    id: 'pottery-and-crafts',
    title: 'Clay, Wood & Sacred Iconography',
    tag: 'Crafts & Art',
    image: '/images/crafts.jpg',
    description:
      'Ancient Lalibela processional crosses, hand-shaped clay serving dishes, and parchment paintings preserving sacred Ethiopian artistic heritage.',
    link: '/products?category=crafts',
    count: 'Heirloom Crafts',
  },
  {
    id: 'filigree-jewelry',
    title: 'Traditional Filigree & Silver Adornments',
    tag: 'Jewelry & Adornment',
    image: '/images/jewelry.jpg',
    description:
      'Intricate silver beadwork, Gondarine coin pendants, and golden filigree necklaces crafted by master silversmiths using ancestral techniques.',
    link: '/products?category=jewelry',
    count: 'Precious Craft',
  },
  {
    id: 'ceramics-and-home',
    title: 'Ceramics for Everyday Ritual',
    tag: 'Home & Living',
    image: '/images/ceramics.jpg',
    description:
      'Hand-thrown clay cups (sini), natural grass-woven mesob baskets, and incense burners (mabt) that bring the warmth of an Ethiopian home into modern spaces.',
    link: '/products?category=crafts',
    count: 'Living Traditions',
  },
];

const CollectionsPage = () => {
  return (
    <>
      <Head>
        <title>Curated Editorial Collections | Habesha Store</title>
        <meta
          name="description"
          content="Explore curated collections of authentic Ethiopian artisan works, from handwoven textiles to sacred coffee rituals and highland spices."
        />
      </Head>

      <Header />

      <main className={styles.container}>
        <Breadcrumbs items={[{ label: 'Collections' }]} />

        <div className={styles.header}>
          <span className={styles.eyebrow}>Curated Stories</span>
          <h1 className={styles.title}>The Editorial Collections</h1>
          <p className={styles.subtitle}>
            Each collection is a thematic journey into Ethiopian cultural heritage, curated around ancestral rituals, artisanal craft, and time-honored materials.
          </p>
        </div>

        <div className={styles.grid}>
          {COLLECTIONS.map((col) => (
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
                    Explore Collection <span aria-hidden="true">→</span>
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

