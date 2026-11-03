import React, { useState } from 'react';
import styles from './ProductCard.module.css';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useCartStore } from '../store/cartStore';
import Icon from './Icon';
import { useWishlistStore } from '../store/wishlistStore';
import { useAuth } from '../context/AuthContext';

const ProductCard = ({ product }) => {
  const router = useRouter();
  const addToCart = useCartStore((state) => state.addToCart);
  const toggleWishlist = useWishlistStore((state) => state.toggle);
  const { user, loading: authLoading } = useAuth();
  const saved = useWishlistStore((state) => state.items.some((item) => item._id === product._id));
  const [addedNotice, setAddedNotice] = useState(false);
  const price = Number(product.price || 0);
  const isSeller = user?.role === 'seller';

  const handleAddToCart = (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (isSeller) {
      router.push('/vendor');
      return;
    }
    addToCart(product);
    setAddedNotice(true);
    setTimeout(() => setAddedNotice(false), 1500);
  };

  return (
    <div className={styles.card}>
      <div className={styles.imageContainer}>
        <Link href={`/products/${product._id}`} className={styles.imageLink}>
          <img
            src={product.images?.[0] || '/images/heritage-textile.jpg'}
            alt={product.name}
            className={styles.image}
            onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = '/images/heritage-textile.jpg'; }}
          />
        </Link>
        <span className={styles.category}>{product.category}</span>
        <button
          type="button"
          className={`${styles.saveButton} ${saved ? styles.saved : ''}`}
          aria-label={saved ? 'Remove from saved treasures' : 'Save to treasures'}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            toggleWishlist(product);
          }}
        >
          <Icon name="heart" size={16} />
        </button>
      </div>

      <div className={styles.content}>
        <Link href={`/products/${product._id}`} className={styles.titleLink}>
          <h3 className={styles.name}>{product.name}</h3>
        </Link>
        <p className={styles.seller}>By {product.seller?.name || 'Habesha artisan'}</p>

        <div className={styles.footer}>
          <div className={styles.priceRating}>
            <span className={styles.price}>ETB {price.toFixed(2)}</span>
            <span className={styles.rating}>★ {Number(product.rating || 0).toFixed(1)}</span>
          </div>
          {product.stock > 0 ? (
            <button
              type="button"
              className={styles.addButton}
              disabled={authLoading || isSeller}
              onClick={handleAddToCart}
              title={isSeller ? 'Artisan accounts cannot purchase' : 'Add to cart'}
            >
              <Icon name="cart" size={15} />
              {addedNotice ? 'Added ✓' : isSeller ? 'Artisan view' : 'Add to bag'}
            </button>
          ) : (
            <span className={styles.outOfStock}>Out of Stock</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;