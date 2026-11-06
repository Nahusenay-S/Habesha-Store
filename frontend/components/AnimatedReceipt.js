import React, { useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '../context/LanguageContext';
import Icon from './Icon';
import styles from './AnimatedReceipt.module.css';

const BAR_WIDTHS = [2, 4, 1, 3, 5, 2, 1, 4, 2, 3, 5, 1, 3, 2, 4, 1, 3, 2, 4, 1, 5, 2, 3, 1, 4, 2];

const SPARKLES = [
  { id: 1, tx: '-70px', ty: '-90px', color: '#c5a15a', size: 8, delay: '2.7s' },
  { id: 2, tx: '85px', ty: '-110px', color: '#0d6832', size: 10, delay: '2.8s' },
  { id: 3, tx: '-120px', ty: '-30px', color: '#e6ca85', size: 6, delay: '2.9s' },
  { id: 4, tx: '110px', ty: '40px', color: '#c5a15a', size: 9, delay: '2.75s' },
  { id: 5, tx: '-90px', ty: '100px', color: '#0d6832', size: 7, delay: '2.95s' },
  { id: 6, tx: '70px', ty: '120px', color: '#e6ca85', size: 8, delay: '2.85s' },
  { id: 7, tx: '-40px', ty: '-130px', color: '#c5a15a', size: 11, delay: '3.0s' },
  { id: 8, tx: '40px', ty: '-140px', color: '#0d6832', size: 8, delay: '2.9s' },
];

const AnimatedReceipt = ({ order, onPrint }) => {
  const { t, language } = useLanguage();
  const [animKey, setAnimKey] = useState(0);

  if (!order) return null;

  const isPaid = order.paymentStatus === 'completed';
  const orderDate = order.createdAt ? new Date(order.createdAt) : new Date();
  const formattedDate = orderDate.toLocaleDateString(language === 'am' ? 'am-ET' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
  const formattedTime = orderDate.toLocaleTimeString(language === 'am' ? 'am-ET' : 'en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const currencyLabel = t('common.currency', 'ETB');
  const totalAmount = Number(order.totalAmount || 0).toFixed(2);
  const items = order.items || [];
  const serialNo = (order._id || 'HABESHA00').slice(0, 8).toUpperCase();
  const receiptNo = `RCP-${serialNo}`;

  const handlePrint = () => {
    if (onPrint) {
      onPrint();
    } else {
      window.print();
    }
  };

  const handleReplay = () => {
    setAnimKey((prev) => prev + 1);
  };

  return (
    <div className={styles.receiptWrapper}>
      {/* Top Printer Slot */}
      <div className={styles.printerSlot} aria-hidden="true" />

      {/* Floating Sparkles Burst when Paid */}
      {isPaid && (
        <div key={`sparkles-${animKey}`} className={styles.confettiContainer} aria-hidden="true">
          {SPARKLES.map((s) => (
            <span
              key={s.id}
              className={styles.sparkle}
              style={{
                '--tx': s.tx,
                '--ty': s.ty,
                top: '35%',
                left: '50%',
                width: `${s.size}px`,
                height: `${s.size}px`,
                background: s.color,
                animationDelay: s.delay,
              }}
            />
          ))}
        </div>
      )}

      {/* The Printable Paper Receipt */}
      <div key={`paper-${animKey}`} className={`${styles.receiptPaper} ${styles.printAnimation}`}>
        <div className={styles.sawtoothTop} aria-hidden="true" />
        <div className={styles.watermark} aria-hidden="true">†</div>

        {/* Dynamic Rubber Stamp */}
        {isPaid ? (
          <div className={styles.stampPaid}>
            ✓ {language === 'am' ? 'ተከፍሏል • PAID' : 'PAID • ተከፍሏል'}
          </div>
        ) : (
          <div className={styles.stampPending}>
            ⏳ {language === 'am' ? 'በመጠባበቅ ላይ' : 'PENDING'}
          </div>
        )}

        {/* Store Brand Header */}
        <header className={styles.header}>
          <div className={styles.storeLogo}>ሐበሻ • Habesha Store</div>
          <span className={styles.storeSub}>
            {language === 'am' ? 'እውነተኛ የኢትዮጵያ ቅርሶችና ዕደ-ጥበባት' : 'Authentic Ethiopian Heritage & Master Craftsmanship'}
          </span>
          <span className={styles.receiptType}>
            {language === 'am' ? 'ይፋዊ የክፍያ ደረሰኝ (RECEIPT)' : 'OFFICIAL PAYMENT RECEIPT'}
          </span>
        </header>

        {/* Metadata Grid */}
        <div className={styles.metaGrid}>
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>{language === 'am' ? 'የደረሰኝ ቁጥር' : 'Receipt No.'}</span>
            <span className={styles.metaValue}>#{receiptNo}</span>
          </div>
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>{language === 'am' ? 'የትዕዛዝ ቁጥር' : 'Order ID'}</span>
            <span className={styles.metaValue}>#{serialNo}</span>
          </div>
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>{language === 'am' ? 'ቀንና ሰዓት' : 'Date & Time'}</span>
            <span className={styles.metaValue}>{formattedDate} • {formattedTime}</span>
          </div>
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>{language === 'am' ? 'የክፍያ ዘዴ' : 'Payment Method'}</span>
            <span className={styles.metaValue} style={{ textTransform: 'capitalize' }}>
              {order.paymentMethod || 'Telebirr'} ({isPaid ? (language === 'am' ? 'የተረጋገጠ' : 'Verified') : (language === 'am' ? 'ያልተጠናቀቀ' : 'Pending')})
            </span>
          </div>
          {order.shippingAddress?.fullName && (
            <div className={styles.metaItem} style={{ gridColumn: 'span 2' }}>
              <span className={styles.metaLabel}>{language === 'am' ? 'የተቀባይ ስም' : 'Billed To'}</span>
              <span className={styles.metaValue}>
                {order.shippingAddress.fullName}
                {order.shippingAddress.city ? ` • ${order.shippingAddress.city}, ${order.shippingAddress.country || 'Ethiopia'}` : ''}
              </span>
            </div>
          )}
        </div>

        {/* Purchased Items List */}
        <div className={styles.itemsTable}>
          {items.map((item, idx) => {
            const productName = item.product?.name || item.name || (language === 'am' ? 'የባህል ዕቃ' : 'Heritage Artifact');
            const qty = item.quantity || 1;
            const price = Number(item.price || 0);
            const lineTotal = (price * qty).toFixed(2);

            return (
              <div key={item._id || item.product?.id || idx} className={styles.itemRow}>
                <div className={styles.itemInfo}>
                  <span className={styles.itemName}>{productName}</span>
                  <span className={styles.itemQty}>
                    {qty} × {currencyLabel} {price.toFixed(2)}
                  </span>
                </div>
                <span className={styles.itemPrice}>
                  {currencyLabel} {lineTotal}
                </span>
              </div>
            );
          })}
        </div>

        {/* Financial Calculations */}
        <div className={styles.totalsSection}>
          <div className={styles.totalRow}>
            <span>{language === 'am' ? 'የዕቃዎች ድምር (Subtotal)' : 'Item Subtotal'}</span>
            <span>{currencyLabel} {totalAmount}</span>
          </div>
          <div className={styles.totalRow}>
            <span>{language === 'am' ? 'ካርጎ ማጓጓዣ (Dispatch)' : 'Artisan Cargo Dispatch'}</span>
            <span style={{ color: '#0d6832', fontWeight: 600 }}>
              {language === 'am' ? 'ነፃ (Complimentary)' : 'Complimentary'}
            </span>
          </div>
          <div className={styles.totalRow}>
            <span>{language === 'am' ? 'ባህላዊ ማሸጊያ (Heritage Box)' : 'Eco-Preservation Packaging'}</span>
            <span style={{ color: '#0d6832', fontWeight: 600 }}>
              {language === 'am' ? 'የተካተተ (Included)' : 'Included'}
            </span>
          </div>
          <div className={styles.grandTotalRow}>
            <span className={styles.grandTotalLabel}>
              {language === 'am' ? 'ጠቅላላ የተከፈለ' : 'Total Paid'}
            </span>
            <span className={styles.grandTotalAmount}>
              {currencyLabel} {totalAmount}
            </span>
          </div>
        </div>

        {/* Authentic Barcode Simulation */}
        <div className={styles.barcodeSection}>
          <div className={styles.barcodeVisual}>
            {BAR_WIDTHS.map((width, idx) => (
              <span
                key={idx}
                className={styles.barcodeBar}
                style={{ width: `${width}px` }}
              />
            ))}
          </div>
          <span className={styles.barcodeDigits}>* {receiptNo} *</span>
        </div>

        {/* Footer Provenance Note */}
        <footer className={styles.receiptFooter}>
          <strong>{language === 'am' ? 'እናመሰግናለን! / Ameseginalehu!' : 'Thank you for your patronage!'}</strong>
          <p style={{ margin: '0.2rem 0 0' }}>
            {language === 'am'
              ? 'ይህ ክፍያ በቀጥታ የኢትዮጵያ እደ-ጥበብ ባለሙያዎችን ማህበረሰብ ይደግፋል።'
              : 'Direct trade fair compensation for Ethiopian highland weavers, potters, and spice masters.'}
          </p>
        </footer>

        <div className={styles.sawtoothBottom} aria-hidden="true" />
      </div>

      {/* Interactive Controls Ribbon */}
      <div className={styles.receiptActions}>
        <button
          type="button"
          onClick={handlePrint}
          className={`${styles.actionBtn} ${styles.printBtn}`}
        >
          <Icon name="check" size={15} />
          {language === 'am' ? 'ደረሰኝ አትም / Print Receipt' : 'Print / Save PDF'}
        </button>

        <button
          type="button"
          onClick={handleReplay}
          className={`${styles.actionBtn} ${styles.replayBtn}`}
          title={language === 'am' ? 'የህትመት አኒሜሽኑን በድጋሚ ተመልከት' : 'Replay the printing animation'}
        >
          <span>✨</span>
          {language === 'am' ? 'በድጋሚ አሳይ' : 'Replay Animation'}
        </button>

        <Link
          href={`/orders/${order._id}`}
          className={`${styles.actionBtn} ${styles.replayBtn}`}
        >
          <Icon name="truck" size={15} />
          {language === 'am' ? 'ትዕዛዝ ተከታተል' : 'Track Cargo'}
        </Link>
      </div>
    </div>
  );
};

export default AnimatedReceipt;
