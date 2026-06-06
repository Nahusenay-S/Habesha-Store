import React from 'react';
import styles from './ProductCard.module.css';
import Link from 'next/link';

const ProductCard = ({ product }) => {
  return (
    <Link href={`/products/${product._id}`}>
      <div className={styles.card}>
        <div className={styles.imageContainer}>
          <img
            src={product.images?.[0] || 'https://via.placeholder.com/300'}
            alt={product.name}
            className={styles.image}
          />
          <span className={styles.category}>{product.category}</span>
        </div>

        <div className={styles.content}>
          <h3 className={styles.name}>{product.name}</h3>
          <p className={styles.seller}>By {product.seller?.name}</p>

          <div className={styles.footer}>
            <div className={styles.priceRating}>
              <span className={styles.price}>Br {product.price.toFixed(2)}</span>
              <span className={styles.rating}>⭐ {product.rating.toFixed(1)}</span>
            </div>
            {product.stock > 0 ? (
              <span className={styles.inStock}>In Stock</span>
            ) : (
              <span className={styles.outOfStock}>Out of Stock</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;