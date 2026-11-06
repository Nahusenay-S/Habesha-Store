import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Modal from './Modal';
import Button from './Button';
import Badge from './Badge';
import { useCartStore } from '../store/cartStore';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import styles from './QuickViewModal.module.css';

const QuickViewModal = ({ product, isOpen, onClose }) => {
  const router = useRouter();
  const addToCart = useCartStore((state) => state.addToCart);
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const [addedNotice, setAddedNotice] = useState(false);
  const [quantity, setQuantity] = useState(1);

  if (!product) return null;

  const price = Number(product.price || 0);
  const isSeller = user?.role === 'seller';
  const inStock = (product.stock || 0) > 0;
  const image = product.images?.[0] || '/images/heritage-textile.jpg';

  const handleAddToCart = () => {
    if (!user) {
      onClose();
      router.push(`/login?next=${encodeURIComponent(router.asPath)}&reason=cart`);
      return;
    }
    if (isSeller || !inStock) return;
    for (let i = 0; i < quantity; i++) {
      addToCart(product);
    }
    setAddedNotice(true);
    setTimeout(() => {
      setAddedNotice(false);
      onClose();
    }, 1200);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="720px">
      <div className={styles.grid}>
        <div className={styles.imageCol}>
          <img
            src={image}
            alt={product.name}
            className={styles.image}
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = '/images/heritage-textile.jpg';
            }}
          />
        </div>
        <div className={styles.infoCol}>
          <div className={styles.tagsRow}>
            <Badge variant="gold">{product.category}</Badge>
            {inStock ? (
              <Badge variant="success">{t('product.in_stock', 'In Stock')} ({product.stock})</Badge>
            ) : (
              <Badge variant="danger">{t('product.out_of_stock', 'Sold Out')}</Badge>
            )}
          </div>

          <h2 className={styles.title}>{product.name}</h2>
          <p className={styles.artisan}>
            {language === 'am' ? 'የተሠራው በ ' : 'Crafted by '}<strong>{product.seller?.name || (language === 'am' ? 'የኢትዮጵያ እደ-ጥበብ ባለሙያ' : 'Ethiopian Artisan')}</strong>
          </p>

          <div className={styles.priceRow}>
            <span className={styles.price}>{t('common.currency', 'ETB')} {price.toFixed(2)}</span>
            <span className={styles.rating}>★ {Number(product.rating || 5).toFixed(1)}</span>
          </div>

          <p className={styles.description}>
            {product.description || (language === 'am' ? 'እውነተኛ የኢትዮጵያ ባህላዊ ቅርስ፣ በባለሙያዎች በጥንቃቄ የተዘጋጀ።' : 'Authentic handcrafted Ethiopian heritage piece, thoughtfully curated for ethical provenance.')}
          </p>

          {inStock && !isSeller && (
            <div className={styles.quantityRow}>
              <span className={styles.quantityLabel}>{t('cart.quantity', 'Quantity')}:</span>
              <div className={styles.quantityControls}>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className={styles.qtyBtn}
                >
                  −
                </button>
                <span className={styles.qtyValue}>{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.min(product.stock || 10, q + 1))}
                  className={styles.qtyBtn}
                >
                  +
                </button>
              </div>
            </div>
          )}

          <div className={styles.actions}>
            <Button
              variant="primary"
              size="md"
              fullWidth
              disabled={!inStock || isSeller}
              onClick={handleAddToCart}
            >
              {addedNotice ? t('product.added', 'Added ✓') : inStock ? t('product.add_to_cart', 'Add to Shopping Bag') : t('product.out_of_stock', 'Sold Out')}
            </Button>
            <Link
              href={`/products/${product._id}`}
              className={styles.viewDetailsLink}
              onClick={onClose}
            >
              {language === 'am' ? 'ሙሉ ታሪኩንና ዝርዝሩን ይመልከቱ →' : 'View Full Details & Story →'}
            </Link>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default QuickViewModal;

