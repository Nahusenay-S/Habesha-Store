import React, { useState, useMemo } from 'react';
import Head from 'next/head';
import Header from '../components/Header';
import Footer from '../components/Footer';
import styles from '../styles/help.module.css';
import Icon from '../components/Icon';

const faqList = [
  {
    category: 'shipping',
    q: 'How do I track my order via Ethiopian Airlines Cargo?',
    a: 'Once your artisan packages and dispatches the piece, an air waybill (AWB) and local tracking link are generated automatically in your Order History. You will also receive an email notification with real-time flight transit milestones.',
  },
  {
    category: 'payments',
    q: 'Can I pay using CBE Birr or Telebirr?',
    a: 'Yes! We support native Ethiopian mobile payment gateways including Telebirr and CBE Birr, alongside international credit cards (Visa, Mastercard) and secure multi-currency options. Select your preferred rail at checkout.',
  },
  {
    category: 'authenticity',
    q: 'What is the Artisan Verification & Provenance process?',
    a: 'Every artisan on Habesha Store undergoes a multi-point verification verifying authentic handloom techniques (Shemane), highland clay sourcing, or certified origin spices (e.g., Berbere from certified cooperatives). Our team physically inspects workshops before badges are granted.',
  },
  {
    category: 'returns',
    q: 'How do returns and refunds work for international orders?',
    a: 'We offer a 7-day satisfaction window from delivery date. Because every garment and craft is hand-produced, contact our concierge support with order photos. If an item is damaged or does not match specifications, we issue a replacement or full refund.',
  },
  {
    category: 'shipping',
    q: 'How long does international shipping take?',
    a: 'Direct express flights via Ethiopian Airlines Cargo typically reach major North American and European hubs in 4–7 business days after artisan preparation. Local deliveries in Addis Ababa arrive within 24–48 hours.',
  },
  {
    category: 'care',
    q: 'How should I care for my handwoven Habesha Kemis and Tibeb embroidery?',
    a: 'Traditional 100% Ethiopian cotton garments featuring metallic thread (Tibeb) should be hand-washed gently in cold water with mild detergent or professionally dry-cleaned. Never wring or machine tumble dry.',
  },
  {
    category: 'sellers',
    q: 'How can an artisan or weaver sell on Habesha Store?',
    a: 'We welcome master weavers, potters, silversmiths, and coffee roasters. Apply through our "Become an Artisan" registration by selecting the Seller account type. Our curation team in Addis Ababa will schedule an introductory visit within 48 hours.',
  },
  {
    category: 'orders',
    q: 'Can I modify or cancel my order after placement?',
    a: 'Orders can be cancelled or adjusted from your Order Details screen while their status is "Pending". Once an artisan starts custom weaving or marks the piece as "Processing", cancellations require support concierge approval.',
  },
];

const popularQueries = [
  'Shipping status',
  'Telebirr help',
  'Artisan authenticity',
  'Return policy',
  'Care instructions',
];

export default function HelpPage() {
  const [openIndex, setOpenIndex] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredFaqs = useMemo(() => {
    const trimmed = searchQuery.trim().toLowerCase();
    if (!trimmed) return faqList;
    return faqList.filter(
      (item) =>
        item.q.toLowerCase().includes(trimmed) ||
        item.a.toLowerCase().includes(trimmed) ||
        item.category.toLowerCase().includes(trimmed)
    );
  }, [searchQuery]);

  const handlePillClick = (query) => {
    if (searchQuery.toLowerCase() === query.toLowerCase()) {
      setSearchQuery('');
    } else {
      setSearchQuery(query);
    }
    setOpenIndex(null);
  };

  const handleCategoryCardClick = (category) => {
    setSearchQuery(category);
    setOpenIndex(null);
    const faqElement = document.getElementById('faq');
    if (faqElement) {
      faqElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <>
      <Head>
        <title>Help Center - Habesha Store</title>
        <meta
          name="description"
          content="Find answers about shipping, payments, Ethiopian artisan provenance, and returns at Habesha Store."
        />
      </Head>
      <Header />
      <main className={styles.container}>
        <section className={styles.hero}>
          <h1>How can we help you today?</h1>
          <div className={styles.searchWrapper}>
            <input
              type="text"
              aria-label="Search help center"
              placeholder="Search for tracking, payments, or authenticity..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setOpenIndex(null);
              }}
            />
            {searchQuery && (
              <button
                type="button"
                className={styles.clearBtn}
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
          </div>
          <div className={styles.pillRow}>
            <span className={styles.pillLabel}>Popular topics:</span>
            {popularQueries.map((pill) => {
              const isActive = searchQuery.toLowerCase() === pill.toLowerCase();
              return (
                <button
                  type="button"
                  key={pill}
                  className={`${styles.heroPill} ${isActive ? styles.heroPillActive : ''}`}
                  onClick={() => handlePillClick(pill)}
                >
                  {pill}
                </button>
              );
            })}
          </div>
        </section>

        <section className={styles.cards}>
          {[
            ['truck', 'Shipping & Delivery', 'Global logistics powered by Ethiopian Airlines Cargo for authentic delivery.', 'shipping'],
            ['check', 'Payments & Birr', 'Secure transactions via Telebirr, CBE Birr, and international cards.', 'payments'],
            ['edit', 'Artisan Policies', 'Responsible production guidelines and ethical artisan compensation.', 'sellers'],
            ['heart', 'Artisan Authenticity', 'Ensuring every textile and spice is ethically sourced and verified.', 'authenticity'],
          ].map(([icon, title, copy, cat]) => (
            <article key={title}>
              <b><Icon name={icon} /></b>
              <h2>{title}</h2>
              <p>{copy}</p>
              <button
                type="button"
                className={styles.cardsLink}
                style={{ background: 'none', border: 'none', padding: 0, font: 'inherit', textAlign: 'left', cursor: 'pointer' }}
                onClick={() => handleCategoryCardClick(cat)}
              >
                Explore answers →
              </button>
            </article>
          ))}
        </section>

        <section className={styles.faq} id="faq">
          <h2>Frequently Asked Questions</h2>
          <p>
            {searchQuery
              ? `Showing results for "${searchQuery}" (${filteredFaqs.length} found)`
              : 'Quick answers to common questions from our community.'}
          </p>

          {filteredFaqs.length === 0 ? (
            <div className={styles.noResults}>
              <p>No answers found matching &ldquo;{searchQuery}&rdquo;.</p>
              <p style={{ fontSize: '0.8rem', marginTop: '0.4rem' }}>
                Try searching for general keywords like &ldquo;cargo&rdquo;, &ldquo;telebirr&rdquo;, or &ldquo;cotton&rdquo;.
              </p>
              <button
                type="button"
                className={styles.resetSearchBtn}
                onClick={() => setSearchQuery('')}
              >
                Reset Search Filter
              </button>
            </div>
          ) : (
            filteredFaqs.map((faq, index) => {
              const isOpen = openIndex === index;
              return (
                <button
                  type="button"
                  key={faq.q}
                  className={isOpen ? styles.active : ''}
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  aria-expanded={isOpen}
                >
                  <strong>{faq.q}</strong>
                  <span>{isOpen ? '⌃' : '⌄'}</span>
                  {isOpen && <small>{faq.a}</small>}
                </button>
              );
            })
          )}
        </section>

        <section className={styles.contact}>
          <h2>Still need assistance?</h2>
          <p>Our concierge support team in Addis Ababa and Washington D.C. is available 24/7 to help with your Habesha Store experience.</p>
          <a href="mailto:support@habeshastore.test">✉ &nbsp; Email Support Concierge</a>
        </section>
      </main>
      <Footer />
    </>
  );
}
