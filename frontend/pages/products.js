import React, { useCallback, useEffect, useState } from 'react';
import { productAPI } from '../lib/api';
import Header from '../components/Header';
import Footer from '../components/Footer';
import LoadingScreen from '../components/LoadingScreen';
import styles from '../styles/products.module.css';
import ProductCard from '../components/ProductCard';

const ProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    category: '',
    minPrice: '',
    maxPrice: '',
    search: '',
  });

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const response = await productAPI.getAll(filters);
      setProducts(response.data.products);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return (
    <>
      <Header />
      <div className={styles.container}>
        <span className={styles.eyebrow}>The collection</span>
        <h1 className={styles.pageTitle}>Objects with a story.</h1>

        <div className={styles.filtersSection}>
          <input
            type="text"
            placeholder="Search products..."
            className={styles.searchInput}
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          />

          <select
            className={styles.filterSelect}
            value={filters.category}
            onChange={(e) => setFilters({ ...filters, category: e.target.value })}
          >
            <option value="">All Categories</option>
            <option value="coffee">Coffee ☕</option>
            <option value="textiles">Textiles 🧣</option>
            <option value="crafts">Crafts 🎨</option>
            <option value="spices">Spices 🌶️</option>
            <option value="jewelry">Jewelry 💎</option>
            <option value="art">Art 🖼️</option>
          </select>
        </div>

        {loading ? (
          <LoadingScreen label="Loading the collection..." />
        ) : products.length === 0 ? (
          <div className={styles.noProducts}>No products found</div>
        ) : (
          <div className={styles.productGrid}>
            {products.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}
      </div>
      <Footer />
    </>
  );
};

export default ProductsPage;