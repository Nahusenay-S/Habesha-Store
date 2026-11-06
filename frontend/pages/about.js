import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Button from '../components/Button';
import Breadcrumbs from '../components/Breadcrumbs';
import { useLanguage } from '../context/LanguageContext';
import styles from '../styles/about.module.css';

const AboutPage = () => {
  const { t } = useLanguage();

  return (
    <>
      <Head>
        <title>{t('about.title', 'Our Story & Artisan Heritage')} | Habesha Store</title>
        <meta
          name="description"
          content={t('about.hero_p', 'Discover the makers, ancestral traditions, and fair trade mission behind Habesha Store, connecting Ethiopian artisans with the world.')}
        />
      </Head>

      <Header />

      <main className={styles.page}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 2rem 0' }}>
          <Breadcrumbs items={[{ label: t('about.title', 'Our Story') }]} />
        </div>

        <section className={styles.hero}>
          <span className={styles.eyebrow}>{t('about.sanctuary_eyebrow', 'The Heritage Sanctuary')}</span>
          <h1>{t('about.hero_h1', 'Every object carries a piece of home.')}</h1>
          <p>{t('about.hero_p', 'Habesha Store was founded to bridge the ancient craft communities of Ethiopia with patrons worldwide, preserving time-honored artisanal traditions while honoring the hands that shape them.')}</p>
        </section>

        {/* Editorial Photo Showcase */}
        <section className={styles.photoShowcase}>
          <img
            src="/images/artisan.jpg"
            alt="Ethiopian master artisan weaver at handloom"
            className={styles.showcaseImg}
          />
          <img
            src="/images/portrait.jpg"
            alt="Traditional Ethiopian artisan portrait"
            className={styles.showcaseImg}
          />
        </section>

        {/* Narrative Section 1 */}
        <section className={styles.story}>
          <div>
            <span className={styles.eyebrow}>{t('about.why_eyebrow', 'Why We Exist')}</span>
            <h2>{t('about.why_h2', 'Ancestral knowledge in a modern world.')}</h2>
          </div>
          <div>
            <p>{t('about.why_p1', 'From the gossamer hand-spun cotton woven in Gulele to the single-origin Arabica harvested on misty slopes in Sidama, Ethiopia’s creative output is among the richest in human history.')}</p>
            <p>{t('about.why_p2', 'Yet for generations, independent makers have had limited access to global collectors, often losing fair compensation to multi-tier broker chains. Habesha Store creates a transparent, direct bridge that honors both the artisan and the collector.')}</p>
            <Link href="/products" style={{ display: 'inline-block', marginTop: '1.25rem', color: 'var(--color-green)', fontWeight: 700, textDecoration: 'underline' }}>
              {t('about.explore_link', 'Explore the Collection →')}
            </Link>
          </div>
        </section>

        {/* Values Grid */}
        <section className={styles.values}>
          <article>
            <strong>01</strong>
            <h3>{t('about.val1_title', 'Ethical Provenance')}</h3>
            <p>{t('about.val1_desc', 'We trace every textile, jebena, and spice blend back to its artisan creator and geographical terroir.')}</p>
          </article>
          <article>
            <strong>02</strong>
            <h3>{t('about.val2_title', 'Direct Artisan Guilds')}</h3>
            <p>{t('about.val2_desc', 'Over 80% of sales margin flows directly to independent makers, funding community looms and family workshops.')}</p>
          </article>
          <article>
            <strong>03</strong>
            <h3>{t('about.val3_title', 'Made for Generations')}</h3>
            <p>{t('about.val3_desc', 'Heirloom pieces designed for daily ritual, crafted with natural highland fibers, clays, and stone-ground spices.')}</p>
          </article>
        </section>

        {/* Join the Marketplace Banner */}
        <section className={styles.joinBanner}>
          <span className={styles.eyebrow} style={{ color: 'var(--color-gold)' }}>{t('about.partner_eyebrow', 'Artisan Partnerships')}</span>
          <h2>{t('about.partner_h2', 'Are you an Ethiopian artisan or creator?')}</h2>
          <p>{t('about.partner_p', 'Join our curated marketplace to showcase your handcrafted textiles, coffee harvests, pottery, and art to a worldwide community of collectors.')}</p>
          <div className={styles.joinBtnRow}>
            <Link href="/register?role=seller">
              <Button variant="gold" size="lg">
                {t('about.partner_btn', 'Join as an Artisan Maker →')}
              </Button>
            </Link>
            <Link href="/products">
              <Button variant="secondary" size="lg">
                {t('about.explore_btn', 'Explore Collection')}
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
};

export default AboutPage;
