import React from 'react';
import Link from 'next/link';
import Icon from './Icon';
import { useLanguage } from '../context/LanguageContext';
import styles from './Footer.module.css';

const Footer = () => {
  const { language, setLanguage, t } = useLanguage();

  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.section}>
          <h3>Habesha Store</h3>
          <p>
            {language === 'am'
              ? 'እውነተኛ የኢትዮጵያ የእደ-ጥበብ ባለሙያዎችን እና አምራቾችን በቀጥታ ከመላው ዓለም ደንበኞች ጋር የሚያገናኝ የባህል ገበያ።'
              : 'An ethical digital sanctuary connecting authentic Ethiopian artisans and producers directly with patrons worldwide.'}
          </p>
          <span style={{ fontSize: '0.8rem', color: 'var(--color-gold)', display: 'block', marginTop: '0.75rem', fontWeight: 600 }}>
            {language === 'am' ? 'በኢትዮጵያ በባህላዊ ቅርስ የታነጸ።' : 'Crafted with cultural provenance in Ethiopia.'}
          </span>
          <div style={{ marginTop: '1rem', display: 'inline-flex', alignItems: 'center', background: '#ffffff', border: '1px solid var(--color-line)', borderRadius: '24px', padding: '2px 4px', gap: '2px' }}>
            <span style={{ color: 'var(--color-gold)', padding: '0 4px 0 6px', display: 'inline-flex', alignItems: 'center' }} title="Language / ቋንቋ">
              <Icon name="globe" size={15} />
            </span>
            <button
              type="button"
              onClick={() => setLanguage('en')}
              style={{
                padding: '4px 9px',
                borderRadius: '16px',
                border: 'none',
                background: language === 'en' ? 'var(--color-green)' : 'transparent',
                color: language === 'en' ? '#fff' : '#666',
                fontWeight: language === 'en' ? 700 : 500,
                fontSize: '0.74rem',
                cursor: 'pointer',
              }}
              aria-label="Switch to English"
            >
              🇬🇧 English
            </button>
            <button
              type="button"
              onClick={() => setLanguage('am')}
              style={{
                padding: '4px 9px',
                borderRadius: '16px',
                border: 'none',
                background: language === 'am' ? 'var(--color-green)' : 'transparent',
                color: language === 'am' ? '#fff' : '#666',
                fontWeight: language === 'am' ? 700 : 500,
                fontSize: '0.74rem',
                cursor: 'pointer',
              }}
              aria-label="ቀይር ወደ አማርኛ"
            >
              🇪🇹 አማርኛ
            </button>
          </div>
        </div>

        <div className={styles.section}>
          <h3>{t('nav.collections', 'Curated Shop')}</h3>
          <ul>
            <li><Link href="/products">{t('nav.all_works', 'All Works & Catalog')}</Link></li>
            <li><Link href="/collections">{t('nav.collections', 'The Editorial Collections')}</Link></li>
            <li><Link href="/products?category=textiles">{t('nav.textiles', 'Handwoven Textiles & Tibeb')}</Link></li>
            <li><Link href="/products?category=coffee">{t('nav.coffee', 'Single-Origin Arabica')}</Link></li>
            <li><Link href="/products?category=spices">{t('nav.spices', 'Highland Spices & Berbere')}</Link></li>
            <li><Link href="/products?category=crafts">{t('nav.crafts', 'Pottery, Wood & Art')}</Link></li>
          </ul>
        </div>

        <div className={styles.section}>
          <h3>{language === 'am' ? 'ባለሙያዎች እና ቅርስ' : 'Makers & Heritage'}</h3>
          <ul>
            <li><Link href="/about">{t('nav.about', 'Our Story & Ancestral Craft')}</Link></li>
            <li><Link href="/register?role=seller">{language === 'am' ? 'እንደ እደ-ጥበብ ባለሙያ ይቀላቀሉ' : 'Join as an Artisan Maker'}</Link></li>
            <li><Link href="/vendor">{t('nav.vendor_terminal', 'Artisan Studio Terminal')}</Link></li>
            <li><Link href="/admin">{t('nav.admin_portal', 'Platform Administration')}</Link></li>
          </ul>
        </div>

        <div className={styles.section}>
          <h3>{language === 'am' ? 'የደንበኞች አገልግሎት' : 'Customer Care'}</h3>
          <ul>
            <li><Link href="/orders">{language === 'am' ? 'የካርጎ ትዕዛዝ መከታተያ' : 'Live Cargo Order Tracking'}</Link></li>
            <li><Link href="/wishlist">{t('nav.wishlist', 'Saved Treasures Wishlist')}</Link></li>
            <li><Link href="/dashboard">{t('nav.my_account', 'Collector Account Dashboard')}</Link></li>
            <li><Link href="/help">{t('nav.help', 'Shipping & Returns Policy')}</Link></li>
            <li><Link href="/payment-history">{t('nav.payments', 'Payment History & Invoices')}</Link></li>
          </ul>
        </div>
      </div>

      <div className={styles.bottom}>
        <p>
          &copy; {new Date().getFullYear()} Habesha Store. {language === 'am' ? 'መብቱ በህግ የተጠበቀ ነው። የተዘጋጀው በአዲስ አበባ፣ ኢትዮጵያ።' : 'All rights reserved. Handcrafted in Addis Ababa, Ethiopia.'}
        </p>
      </div>
    </footer>
  );
};

export default Footer;
