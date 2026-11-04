import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { productAPI } from '../lib/api';
import Header from '../components/Header';
import Footer from '../components/Footer';
import LoadingScreen from '../components/LoadingScreen';
import ProductCard from '../components/ProductCard';
import Breadcrumbs from '../components/Breadcrumbs';
import EmptyState from '../components/EmptyState';
import styles from '../styles/products.module.css';

const ProductsPage = () => {
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  const [filters, setFilters] = useState({
    category: '',
    minPrice: '',
    maxPrice: '',
    search: '',
    minRating: '',
    inStock: false,
    sortBy: 'newest',
  });

  // Sync initial query params from URL
  useEffect(() => {
    if (router.isReady) {
      setFilters((prev) => ({
        ...prev,
        category: typeof router.query.category === 'string' ? router.query.category : '',
        search: typeof router.query.search === 'string' ? router.query.search : '',
        sortBy: typeof router.query.sortBy === 'string' ? router.query.sortBy : 'newest',
        minPrice: typeof router.query.minPrice === 'string' ? router.query.minPrice : '',
        maxPrice: typeof router.query.maxPrice === 'string' ? router.query.maxPrice : '',
        inStock: router.query.inStock === 'true',
      }));
    }
  }, [router.isReady, router.query]);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const cleanFilters = {};
      if (filters.category) cleanFilters.category = filters.category;
      if (filters.search) cleanFilters.search = filters.search;
      if (filters.minPrice) cleanFilters.minPrice = filters.minPrice;
      if (filters.maxPrice) cleanFilters.maxPrice = filters.maxPrice;
      if (filters.minRating) cleanFilters.minRating = filters.minRating;
      if (filters.inStock) cleanFilters.inStock = true;
      if (filters.sortBy) cleanFilters.sortBy = filters.sortBy;

      const response = await productAPI.getAll(cleanFilters);
      setProducts(response.data.products || []);
      setTotalCount(response.data.pagination?.total || (response.data.products || []).length);
    } catch (error) {
      console.error('Failed to fetch products:', error);
      setProducts([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const updateFilter = (key, value) => {
    const nextFilters = { ...filters, [key]: value };
    setFilters(nextFilters);

    const query = { ...router.query };
    if (value) {
      query[key] = value;
    } else {
      delete query[key];
    }
    router.replace({ pathname: '/products', query }, undefined, { shallow: true });
  };

  const clearAllFilters = () => {
    setFilters({
      category: '',
      minPrice: '',
      maxPrice: '',
      search: '',
      minRating: '',
      inStock: false,
      sortBy: 'newest',
    });
    router.replace('/products', undefined, { shallow: true });
  };

  const hasActiveFilters = Boolean(
    filters.category ||
    filters.search ||
    filters.minPrice ||
    filters.maxPrice ||
    filters.minRating ||
    filters.inStock ||
    filters.sortBy !== 'newest'
  );

  return (
    <>
      <Head>
        <title>Curated Ethiopian Heritage Collection | Habesha Store</title>
        <meta
          name="description"
          content="Explore authentic Ethiopian textiles, single-origin highland coffee, spices, handcrafted pottery, and cultural treasures."
        />
      </Head>

      <Header />

      <main className={styles.container}>
        <Breadcrumbs
          items={[
            { label: 'Shop', href: '/products' },
            ...(filters.category ? [{ label: filters.category.toUpperCase() }] : []),
          ]}
        />

        <div className={styles.headerRow}>
          <span className={styles.eyebrow}>Curated Masterpieces</span>
          <h1 className={styles.pageTitle}>
            {filters.category ? `${filters.category.charAt(0).toUpperCase() + filters.category.slice(1)} Collection` : 'Objects with a Story.'}
          </h1>
          <p className={styles.pageDescription}>
            Every piece is ethically sourced and handcrafted by independent Ethiopian artisans, carrying centuries of cultural heritage directly to your home.
          </p>
        </div>

        {/* Filter Bar */}
        <section className={styles.filtersSection} aria-label="Product filters">
          <div className={styles.primaryFilters}>
            <input
              type="text"
              placeholder="Search by name, artisan, or material (e.g. Tibeb, Sidama, Clay)..."
              className={styles.searchInput}
              value={filters.search}
              onChange={(e) => updateFilter('search', e.target.value)}
              aria-label="Search collection"
            />

            <select
              className={styles.filterSelect}
              value={filters.category}
              onChange={(e) => updateFilter('category', e.target.value)}
              aria-label="Filter by category"
            >
              <option value="">All Categories</option>
              <option value="textiles">Handwoven Textiles 🧣</option>
              <option value="coffee">Highland Coffee ☕</option>
              <option value="spices">Traditional Spices 🌶️</option>
              <option value="crafts">Pottery & Crafts 🏺</option>
              <option value="jewelry">Filigree Jewelry 💎</option>
              <option value="art">Fine Art & Icons 🖼️</option>
            </select>

            <select
              className={styles.filterSelect}
              value={filters.sortBy}
              onChange={(e) => updateFilter('sortBy', e.target.value)}
              aria-label="Sort products"
            >
              <option value="newest">Sort: Newest First</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="rating">Best Rated</option>
              <option value="popularity">Most Popular</option>
            </select>
          </div>

          <div className={styles.secondaryFilters}>
            <div className={styles.priceGroup}>
              <span>Price (ETB):</span>
              <input
                type="number"
                placeholder="Min"
                className={styles.priceInput}
                value={filters.minPrice}
                onChange={(e) => updateFilter('minPrice', e.target.value)}
              />
              <span>—</span>
              <input
                type="number"
                placeholder="Max"
                className={styles.priceInput}
                value={filters.maxPrice}
                onChange={(e) => updateFilter('maxPrice', e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <select
                className={styles.priceInput}
                style={{ width: 'auto' }}
                value={filters.minRating}
                onChange={(e) => updateFilter('minRating', e.target.value)}
                aria-label="Filter by minimum rating"
              >
                <option value="">All Ratings</option>
                <option value="4">4★ & above</option>
                <option value="4.5">4.5★ & above</option>
              </select>

              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={filters.inStock}
                  onChange={(e) => updateFilter('inStock', e.target.checked)}
                />
                <span>In Stock Only</span>
              </label>
            </div>
          </div>
        </section>

        {/* Active Filters Row */}
        {hasActiveFilters && (
          <div className={styles.activeFiltersRow}>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-gray)' }}>Active filters:</span>
            {filters.category && (
              <span className={styles.filterPill}>
                Category: <strong>{filters.category}</strong>
                <button
                  type="button"
                  className={styles.removePillBtn}
                  onClick={() => updateFilter('category', '')}
                >
                  ✕
                </button>
              </span>
            )}
            {filters.search && (
              <span className={styles.filterPill}>
                Search: <strong>&ldquo;{filters.search}&rdquo;</strong>
                <button
                  type="button"
                  className={styles.removePillBtn}
                  onClick={() => updateFilter('search', '')}
                >
                  ✕
                </button>
              </span>
            )}
            {filters.minPrice && (
              <span className={styles.filterPill}>
                Min: ETB {filters.minPrice}
                <button
                  type="button"
                  className={styles.removePillBtn}
                  onClick={() => updateFilter('minPrice', '')}
                >
                  ✕
                </button>
              </span>
            )}
            {filters.maxPrice && (
              <span className={styles.filterPill}>
                Max: ETB {filters.maxPrice}
                <button
                  type="button"
                  className={styles.removePillBtn}
                  onClick={() => updateFilter('maxPrice', '')}
                >
                  ✕
                </button>
              </span>
            )}
            {filters.inStock && (
              <span className={styles.filterPill}>
                In Stock
                <button
                  type="button"
                  className={styles.removePillBtn}
                  onClick={() => updateFilter('inStock', false)}
                >
                  ✕
                </button>
              </span>
            )}
            <button
              type="button"
              className={styles.clearAllBtn}
              onClick={clearAllFilters}
            >
              Clear all filters
            </button>
          </div>
        )}

        {/* Product Count Indicator */}
        <div className={styles.countBar}>
          <span>
            Showing <span className={styles.countNumber}>{products.length}</span> of {totalCount} curated works
          </span>
          <span>Authentic ethical provenance</span>
        </div>

        {/* Grid or Empty State */}
        {loading ? (
          <LoadingScreen label="Unfolding the collection..." />
        ) : products.length === 0 ? (
          <EmptyState
            icon="🔍"
            title="No pieces match your search"
            description="Try clearing some of your active filters or explore our broader curated collection."
            actionLabel="Reset All Filters"
            onAction={clearAllFilters}
          />
        ) : (
          <div className={styles.productGrid}>
            {products.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}
      </main>

      <Footer />
    </>
  );
};

export default ProductsPage;
