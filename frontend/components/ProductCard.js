import React from 'react';
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
  const price = Number(product.price || 0);
  const disableCartAction = authLoading || user?.role === 'seller';

  const handleAddToCart = (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (!user) {
      router.push('/login?next=/products');
      return;
    }
    if (user.role !== 'buyer') {
      router.push('/vendor');
      return;
    }
    addToCart(product);
  };

  return (
    <div className={styles.card}>
      <Link href={`/products/${product._id}`} className={styles.cardLink}>
        <div className={styles.imageContainer}>
          <img
            src={product.images?.[0] || '/images/heritage-textile.svg'}
            alt={product.name}
            className={styles.image}
            onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = '/images/heritage-textile.svg'; }}
          />
          <span className={styles.category}>{product.category}</span>
          <button type="button" className={`${styles.saveButton} ${saved ? styles.saved : ''}`} aria-label={saved ? 'Remove from saved treasures' : 'Save to treasures'} onClick={(event) => { event.preventDefault(); event.stopPropagation(); toggleWishlist(product); }}><Icon name="heart" size={16} /></button>
        </div>

        <div className={styles.content}>
          <h3 className={styles.name}>{product.name}</h3>
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
                disabled={disableCartAction}
                onClick={handleAddToCart}
                title={!user ? 'Sign in to add to cart' : user.role !== 'buyer' ? 'Only buyer accounts can shop' : 'Add to cart'}
              >
                <Icon name="cart" size={15} />
                {!user ? 'Sign in to shop' : user.role !== 'buyer' ? 'Seller account' : 'Add to cart'}
              </button>
            ) : (
              <span className={styles.outOfStock}>Out of Stock</span>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
};

export default ProductCard;