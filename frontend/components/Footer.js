import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Icon from './Icon';
import { useLanguage } from '../context/LanguageContext';
import styles from './Footer.module.css';

const Footer = () => {
  const { language, setLanguage, t } = useLanguage();
  const [showLangMenu, setShowLangMenu] = useState(false);
  const langRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (langRef.current && !langRef.current.contains(e.target)) {
        setShowLangMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

          {/* Minimalist Globe Icon Dropdown for Footer */}
          <div className={styles.langMenu} ref={langRef}>
            <button
              type="button"
              className={`${styles.langTrigger} ${showLangMenu ? styles.langTriggerActive : ''}`}
              onClick={() => setShowLangMenu(!showLangMenu)}
              aria-label="Select language / ቋንቋ ይምረጡ"
              title={language === 'am' ? 'ቋንቋ: አማርኛ (ቀይር)' : 'Language: English (Switch)'}
            >
              <Icon name="globe" size={17} />
            </button>

            {showLangMenu && (
              <div className={styles.langDropdown}>
                <div className={styles.langDropdownHeader}>
                  <span>{language === 'am' ? 'ቋንቋ ይምረጡ' : 'Select Language'}</span>
                </div>
                <div className={styles.langOptionsList}>
                  <button
                    type="button"
                    className={`${styles.langOptionItem} ${language === 'en' ? styles.langOptionItemActive : ''}`}
                    onClick={() => {
                      setLanguage('en');
                      setShowLangMenu(false);
                    }}
                  >
                    <span className={styles.langFlag}>🇬🇧</span>
                    <div className={styles.langMeta}>
                      <span className={styles.langName}>English</span>
                      <small className={styles.langRegion}>Global (EN)</small>
                    </div>
                    {language === 'en' && <span className={styles.langCheck}>✓</span>}
                  </button>

                  <button
                    type="button"
                    className={`${styles.langOptionItem} ${language === 'am' ? styles.langOptionItemActive : ''}`}
                    onClick={() => {
                      setLanguage('am');
                      setShowLangMenu(false);
                    }}
                  >
                    <span className={styles.langFlag}>🇪🇹</span>
                    <div className={styles.langMeta}>
                      <span className={styles.langName}>አማርኛ</span>
                      <small className={styles.langRegion}>ኢትዮጵያ (Ge&apos;ez)</small>
                    </div>
                    {language === 'am' && <span className={styles.langCheck}>✓</span>}
                  </button>
                </div>
              </div>
            )}
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
