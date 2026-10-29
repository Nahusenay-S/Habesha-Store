import Head from 'next/head';
import Link from 'next/link';
import Header from '../components/Header';
import Footer from '../components/Footer';
import styles from '../styles/about.module.css';

const AboutPage = () => (
  <>
    <Head>
      <title>Our Story | Habesha Store</title>
      <meta name="description" content="The people and traditions behind Habesha Store." />
    </Head>
    <Header />
    <main className={styles.page}>
      <section className={styles.hero}>
        <span className={styles.eyebrow}>The Heritage Collection</span>
        <h1>Every object carries a piece of home.</h1>
        <p>Habesha Store connects the world with Ethiopia's makers, preserving traditional craft while giving it a thoughtful place in modern life.</p>
      </section>
      <section className={styles.story}>
        <div>
          <span className={styles.eyebrow}>Our promise</span>
          <h2>Trade that honors the hands behind the work.</h2>
        </div>
        <div>
          <p>From hand-woven cotton in Addis Ababa to coffee grown in the highlands of Sidamo, every collection is selected for its provenance, quality, and cultural meaning.</p>
          <p>We work with independent artisans and small producers to make their work discoverable, fairly represented, and delivered with care.</p>
          <Link href="/products" className={styles.link}>Explore the collection →</Link>
        </div>
      </section>
      <section className={styles.values}>
        <article><strong>01</strong><h3>Certified authentic</h3><p>We know where each piece comes from and who made it.</p></article>
        <article><strong>02</strong><h3>Direct partnerships</h3><p>More value reaches the makers and their communities.</p></article>
        <article><strong>03</strong><h3>Made to last</h3><p>Objects chosen for daily use, ritual, and generations ahead.</p></article>
      </section>
    </main>
    <Footer />
  </>
);

export default AboutPage;
