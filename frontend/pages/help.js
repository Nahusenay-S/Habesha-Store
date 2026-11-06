import React, { useState, useMemo } from 'react';
import Head from 'next/head';
import Header from '../components/Header';
import Footer from '../components/Footer';
import styles from '../styles/help.module.css';
import Icon from '../components/Icon';
import { useLanguage } from '../context/LanguageContext';

const faqListEn = [
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

const faqListAm = [
  {
    category: 'shipping',
    q: 'ትዕዛዜን በኢትዮጵያ አየር መንገድ ካርጎ እንዴት መከታተል እችላለሁ?',
    a: 'ባለሙያው ዕቃዎን አዘጋጅቶ ሲልክ፣ የካርጎ መከታተያ ቁጥር (AWB) በትዕዛዝ ታሪክዎ ውስጥ ወዲያውኑ ይዘጋጃል። በተጨማሪም የበረራውን ሂደት የሚያሳይ የኢሜይል ማሳወቂያ ይደርስዎታል።',
  },
  {
    category: 'payments',
    q: 'በቴሌብር ወይም በሲቢኢ ብር (CBE Birr) መክፈል ይቻላል?',
    a: 'አዎ! ቴሌብርን እና ሲቢኢ ብርን ጨምሮ በቪዛ፣ ማስተርካርድ እና በዓለም አቀፍ የክፍያ መንገዶች መክፈል ይችላሉ። በክፍያ ገጹ ላይ የሚፈልጉትን አማራጭ ይምረጡ።',
  },
  {
    category: 'authenticity',
    q: 'የእደ-ጥበብ ባለሙያዎች ማረጋገጫና አመጣጥ እንዴት ይፈተሻል?',
    a: 'በሀበሻ ስቶር የሚሳተፉ ሁሉም ባለሙያዎች በእጅ የሚሰሩ (ሸማኔዎች)፣ የተፈጥሮ ሸክላ የሚጠቀሙ እና ጥራት ያላቸው ቅመሞች አቅራቢ መሆናቸው በአካል ተረጋግጦ እውቅና ይሰጣቸዋል።',
  },
  {
    category: 'returns',
    q: 'የዕቃ መመለስ እና የተከፈለ ገንዘብ ተመላሽ እንዴት ይሰራል?',
    a: 'ዕቃው ከደረሰዎት ቀን ጀምሮ ለ7 ቀናት የይግባኝ ጊዜ አለዎት። ዕቃው ላይ ጉዳት ከደረሰ ወይም ካዘዙት የተለየ ከሆነ የዕቃውን ፎቶ ለደንበኞች አገልግሎት በመላክ አዲስ እንዲላክልዎ ወይም ሙሉ ገንዘብዎ እንዲመለስ ማድረግ ይችላሉ።',
  },
  {
    category: 'shipping',
    q: 'ዓለም አቀፍ ማጓጓዣ ስንት ጊዜ ይወስዳል?',
    a: 'በኢትዮጵያ አየር መንገድ ካርጎ ቀጥታ በረራ ከአዲስ አበባ ተነስቶ ወደ አሜሪካ እና አውሮፓ ዋና ከተሞች ከ4 እስከ 7 የስራ ቀናት ውስጥ ይደርሳል። በአዲስ አበባ ውስጥ ከ24 እስከ 48 ሰዓታት ውስጥ ይደርሳል።',
  },
  {
    category: 'care',
    q: 'የሀበሻ ቀሚስ እና የጥበብ አልባሳት እንዴት ይያዛሉ?',
    a: 'ከ100% ጥጥ እና ከጥበብ ክር የተሸመኑ አልባሳት በቀዝቃዛ ውሃ በቀስታ በእጅ መታጠብ ወይም በደረቅ ጽዳት (Dry Cleaning) መጽዳት አለባቸው። በማጠቢያ ማሽን ውስጥ ማድረቅ አይመከርም።',
  },
  {
    category: 'sellers',
    q: 'የእደ-ጥበብ ባለሙያ ወይም ሸማኔ በሀበሻ ስቶር ላይ እንዴት መሸጥ ይችላል?',
    a: 'ትውልድ ሸማኔዎችን፣ የሸክላ ሰሪዎችን፣ የብር አንጥረኞችን እና የቡና አዘጋጆችን በደስታ እንቀበላለን። "ተመዝገብ" በሚለው ገጽ ላይ "የእደ-ጥበብ ባለሙያ" የሚለውን በመምረጥ ማመልከት ይችላሉ። ቡድናችን በ48 ሰዓት ውስጥ ያነጋግርዎታል።',
  },
  {
    category: 'orders',
    q: 'ትዕዛዝ ከሰጠሁ በኋላ መሰረዝ ወይም ማሻሻል እችላለሁ?',
    a: 'ትዕዛዝዎ "በመጠባበቅ ላይ" ባለበት ወቅት ከትዕዛዝ ዝርዝር ገጽዎ በቀጥታ መሰረዝ ይችላሉ። ባለሙያው መሸመን ከጀመረ ግን የደንበኞች አገልግሎትን ማነጋገር ያስፈልጋል።',
  },
];

export default function HelpPage() {
  const { t, language } = useLanguage();
  const [openIndex, setOpenIndex] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const currentFaqList = language === 'am' ? faqListAm : faqListEn;

  const popularQueries = language === 'am'
    ? ['የካርጎ ሁኔታ', 'የቴሌብር ክፍያ', 'የእደ-ጥበብ ትክክለኛነት', 'የዕቃ መመለስ', 'የአያያዝ መመሪያ']
    : ['Shipping status', 'Telebirr help', 'Artisan authenticity', 'Return policy', 'Care instructions'];

  const filteredFaqs = useMemo(() => {
    const trimmed = searchQuery.trim().toLowerCase();
    if (!trimmed) return currentFaqList;
    return currentFaqList.filter(
      (item) =>
        item.q.toLowerCase().includes(trimmed) ||
        item.a.toLowerCase().includes(trimmed) ||
        item.category.toLowerCase().includes(trimmed)
    );
  }, [searchQuery, currentFaqList]);

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
        <title>{t('help.title', 'Help Center')} - Habesha Store</title>
        <meta
          name="description"
          content={t('help.hero_title', 'Find answers about shipping, payments, Ethiopian artisan provenance, and returns at Habesha Store.')}
        />
      </Head>
      <Header />
      <main className={styles.container}>
        <section className={styles.hero}>
          <h1>{t('help.hero_title', 'How can we help you today?')}</h1>
          <div className={styles.searchWrapper}>
            <input
              type="text"
              aria-label="Search help center"
              placeholder={t('help.search_placeholder', 'Search for tracking, payments, or authenticity...')}
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
            <span className={styles.pillLabel}>{t('help.popular_label', 'Popular topics:')}</span>
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
            ['truck', t('help.shipping_card_title', 'Shipping & Delivery'), t('help.shipping_card_desc', 'Global logistics powered by Ethiopian Airlines Cargo for authentic delivery.'), 'shipping'],
            ['check', t('help.payments_card_title', 'Payments & Birr'), t('help.payments_card_desc', 'Secure transactions via Telebirr, CBE Birr, and international cards.'), 'payments'],
            ['edit', t('help.artisan_card_title', 'Artisan Policies'), t('help.artisan_card_desc', 'Responsible production guidelines and ethical artisan compensation.'), 'sellers'],
            ['heart', t('help.authenticity_card_title', 'Artisan Authenticity'), t('help.authenticity_card_desc', 'Ensuring every textile and spice is ethically sourced and verified.'), 'authenticity'],
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
                {language === 'am' ? 'መልሶችን ይመልከቱ →' : 'Explore answers →'}
              </button>
            </article>
          ))}
        </section>

        <section className={styles.faq} id="faq">
          <h2>{t('help.faq_heading', 'Frequently Asked Questions')}</h2>
          <p>
            {searchQuery
              ? (language === 'am' ? `ለ "${searchQuery}" የተገኙ ውጤቶች (${filteredFaqs.length} ተገኝተዋል)` : `Showing results for "${searchQuery}" (${filteredFaqs.length} found)`)
              : (language === 'am' ? 'ከማህበረሰባችን ለሚነሱ ጥያቄዎች ፈጣን መልሶች።' : 'Quick answers to common questions from our community.')}
          </p>

          {filteredFaqs.length === 0 ? (
            <div className={styles.noResults}>
              <p>{language === 'am' ? `ለ "${searchQuery}" የተገኘ መልስ የለም።` : `No answers found matching "${searchQuery}".`}</p>
              <p style={{ fontSize: '0.8rem', marginTop: '0.4rem' }}>
                {language === 'am' ? 'እንደ "ካርጎ"፣ "ቴሌብር" ወይም "ጥጥ" ያሉ ቃላትን ተጠቅመው ይፈልጉ።' : 'Try searching for general keywords like "cargo", "telebirr", or "cotton".'}
              </p>
              <button
                type="button"
                className={styles.resetSearchBtn}
                onClick={() => setSearchQuery('')}
              >
                {language === 'am' ? 'ፍለጋውን መልስ' : 'Reset Search Filter'}
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
          <h2>{t('help.still_need_help', 'Still need assistance?')}</h2>
          <p>{t('help.contact_support', 'Our concierge support team in Addis Ababa and Washington D.C. is available 24/7 to help with your Habesha Store experience.')}</p>
          <a href="mailto:support@habeshastore.test">{t('help.email_support', '✉ Email Support Concierge')}</a>
        </section>
      </main>
      <Footer />
    </>
  );
}
