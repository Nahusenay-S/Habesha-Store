import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { productAPI } from '../lib/api';
import Header from '../components/Header';
import Footer from '../components/Footer';
import LoadingScreen from '../components/LoadingScreen';
import styles from '../styles/products.module.css';
import ProductCard from '../components/ProductCard';

const ProductsPage = () => {
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    category: '',
    minPrice: '',
    maxPrice: '',
    search: '',
  });

  // Sync filters from URL query params
  useEffect(() => {
    if (router.isReady) {
      setFilters((prev) => ({
        ...prev,
        category: typeof router.query.category === 'string' ? router.query.category : '',
        search: typeof router.query.search === 'string' ? router.query.search : '',
      }));
    }
  }, [router.isReady, router.query.category, router.query.search]);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const cleanFilters = {};
      if (filters.category) cleanFilters.category = filters.category;
      if (filters.search) cleanFilters.search = filters.search;
      if (filters.minPrice) cleanFilters.minPrice = filters.minPrice;
      if (filters.maxPrice) cleanFilters.maxPrice = filters.maxPrice;
      const response = await productAPI.getAll(cleanFilters);
      setProducts(response.data.products || []);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleCategoryChange = (e) => {
    const value = e.target.value;
    setFilters((prev) => ({ ...prev, category: value }));
    const newQuery = { ...router.query };
    if (value) newQuery.category = value;
    else delete newQuery.category;
    router.replace({ pathname: '/products', query: newQuery }, undefined, { shallow: true });
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setFilters((prev) => ({ ...prev, search: value }));
  };

  const clearFilters = () => {
    setFilters({ category: '', minPrice: '', maxPrice: '', search: '' });
    router.replace('/products', undefined, { shallow: true });
  };

  const isFiltering = Boolean(filters.category || filters.search || filters.minPrice || filters.maxPrice);

  return (
    <>
      <Header />
      <div className={styles.container}>
        <span className={styles.eyebrow}>The collection</span>
        <h1 className={styles.pageTitle}>Objects with a story.</h1>

        <div className={styles.filtersSection}>
          <input
            type="text"
            placeholder="Search products by name or material..."
            className={styles.searchInput}
            value={filters.search}
            onChange={handleSearchChange}
          />

          <select
            className={styles.filterSelect}
            value={filters.category}
            onChange={handleCategoryChange}
          >
            <option value="">All Categories</option>
            <option value="textiles">Textiles 🧣</option>
            <option value="coffee">Coffee ☕</option>
            <option value="crafts">Crafts 🎨</option>
            <option value="spices">Spices 🌶️</option>
            <option value="jewelry">Jewelry 💎</option>
            <option value="art">Art 🖼️</option>
          </select>
        </div>

        {isFiltering && (
          <div style={{ margin: '0.75rem 0 1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.88rem' }}>
            <span>Active filters: {filters.category && <strong>{filters.category} </strong>}{filters.search && <em>&ldquo;{filters.search}&rdquo;</em>}</span>
            <button
              type="button"
              onClick={clearFilters}
              style={{ background: 'none', border: '1px solid #c4b59d', padding: '0.2rem 0.6rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}
            >
              ✕ Clear filters
            </button>
          </div>
        )}

        {loading ? (
          <LoadingScreen label="Loading the collection..." />
        ) : products.length === 0 ? (
          <div className={styles.noProducts}>
            <p>No products found matching your selection.</p>
            {isFiltering && (
              <button
                type="button"
                onClick={clearFilters}
                style={{ marginTop: '0.5rem', background: '#0b3d2c', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer' }}
              >
                View all works
              </button>
            )}
          </div>
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