import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';
import { productAPI } from '../lib/api';
import Header from '../components/Header';
import Footer from '../components/Footer';
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

  useEffect(() => {
    fetchProducts();
  }, [filters]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await productAPI.getAll(filters);
      setProducts(response.data.products);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header />
      <div className={styles.container}>
        <h1 className={styles.pageTitle}>Browse Products 🛍️</h1>

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
          <div className={styles.loading}>Loading products...</div>
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