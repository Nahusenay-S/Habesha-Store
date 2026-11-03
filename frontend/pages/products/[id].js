import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { productAPI, reviewAPI } from '../../lib/api';
import { useCartStore } from '../../store/cartStore';
import { useAuth } from '../../context/AuthContext';
import styles from '../../styles/product-detail.module.css';

const ProductDetailPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const { addToCart } = useCartStore();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [pageError, setPageError] = useState('');
  const [addedNotice, setAddedNotice] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // Review state
  const [review, setReview] = useState({ rating: 5, title: '', comment: '' });
  const [reviewError, setReviewError] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);

  // Inquiry state
  const [showInquiry, setShowInquiry] = useState(false);
  const [inquiryMessage, setInquiryMessage] = useState('');
  const [inquiryPhone, setInquiryPhone] = useState('');
  const [inquiryLoading, setInquiryLoading] = useState(false);
  const [inquiryError, setInquiryError] = useState('');
  const [inquirySuccess, setInquirySuccess] = useState('');

  useEffect(() => {
    if (id) {
      productAPI.getById(id)
        .then((response) => setData(response.data))
        .catch(() => setPageError('This piece could not be found.'));
    }
  }, [id]);

  const handleAddToCart = () => {
    if (user?.role === 'seller') {
      alert('Artisan/seller accounts cannot purchase items.');
      return;
    }
    if (data?.product) {
      addToCart(data.product);
      setAddedNotice(true);
      setTimeout(() => setAddedNotice(false), 3000);
    }
  };

  const submitReview = async (event) => {
    event.preventDefault();
    setReviewError('');
    setReviewSuccess('');
    if (!user) {
      setReviewError('Please sign in to leave a review.');
      return;
    }
    setReviewLoading(true);
    try {
      await reviewAPI.create({ ...review, product: id });
      const response = await productAPI.getById(id);
      setData(response.data);
      setReview({ rating: 5, title: '', comment: '' });
      setReviewSuccess('Thank you for sharing your feedback on this piece!');
    } catch (requestError) {
      setReviewError(requestError.response?.data?.error || 'Unable to submit your review.');
    } finally {
      setReviewLoading(false);
    }
  };

  const submitInquiry = async (event) => {
    event.preventDefault();
    setInquiryError('');
    setInquirySuccess('');
    if (!user) {
      setInquiryError('Please sign in to send a direct message to this artisan.');
      return;
    }
    setInquiryLoading(true);
    try {
      await productAPI.inquire(id, { message: inquiryMessage, contactPhone: inquiryPhone });
      setInquirySuccess('Your message was sent directly to the artisan! Check your notifications for replies.');
      setInquiryMessage('');
      setInquiryPhone('');
    } catch (requestError) {
      setInquiryError(requestError.response?.data?.error || 'Unable to deliver your inquiry.');
    } finally {
      setInquiryLoading(false);
    }
  };

  if (pageError) return <><Header /><main className={styles.message}>{pageError}</main><Footer /></>;
  if (!data) return <><Header /><main className={styles.message}>Loading this piece...</main><Footer /></>;
  const { product, reviews = [] } = data;
  const images = Array.isArray(product?.images) && product.images.length > 0 ? product.images : ['/images/heritage-textile.jpg'];

  return (
    <>
      <Header />
      <main className={styles.page}>
        <button className={styles.back} onClick={() => router.back()}>← Back to collection</button>
        <section className={styles.product}>
          <div className={styles.gallery}>
            <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: '360px', overflow: 'hidden' }}>
              <img
                src={images[selectedImageIndex] || images[0] || '/images/heritage-textile.jpg'}
                alt={product.name}
                onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = '/images/heritage-textile.jpg'; }}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
            {images.length > 1 && (
              <div style={{ display: 'flex', gap: '0.6rem', marginTop: '0.75rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                {images.map((imgUrl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedImageIndex(idx)}
                    style={{
                      border: idx === selectedImageIndex ? '2px solid #0b3d2c' : '1px solid #c9b084',
                      padding: 0,
                      background: 'none',
                      cursor: 'pointer',
                      borderRadius: '4px',
                      overflow: 'hidden',
                      flexShrink: 0,
                      width: '64px',
                      height: '64px',
                    }}
                  >
                    <img
                      src={imgUrl}
                      alt=""
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/images/heritage-textile.jpg'; }}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className={styles.info}>
            <span className={styles.category}>{product.category}</span>
            <h1>{product.name}</h1>
            <p className={styles.seller}>By {product.seller?.name || 'Habesha artisan'}</p>
            <p className={styles.price}>ETB {Number(product.price).toFixed(2)}</p>
            <p className={styles.description}>{product.description}</p>
            <div className={styles.meta}>
              <span>★ {Number(product.rating || 0).toFixed(1)} ({product.reviews || 0} reviews)</span>
              <span>{product.stock > 0 ? `${product.stock} available in stock` : 'Currently sold out'}</span>
            </div>

            {addedNotice && (
              <div style={{ background: '#eaf5ee', color: '#0b3d2c', padding: '0.8rem 1rem', marginBottom: '1rem', border: '1px solid #b7dfca', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>✓ Added to your shopping bag!</span>
                <Link href="/cart" style={{ color: '#0b3d2c', fontWeight: 600, textDecoration: 'underline' }}>View Bag →</Link>
              </div>
            )}

            <button
              className={styles.add}
              disabled={!product.stock || user?.role === 'seller'}
              onClick={handleAddToCart}
            >
              {addedNotice ? 'Added to bag ✓' : product.stock > 0 ? 'Add to bag' : 'Sold Out'} <span>→</span>
            </button>

            {/* Direct Communication / Inquiry with Artisan */}
            <div style={{ marginTop: '1.25rem', padding: '1rem', border: '1px solid #dfd7cc', borderRadius: '4px', background: '#fdfbf7' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong style={{ display: 'block', color: '#0b3d2c' }}>Have a question about this piece?</strong>
                  <small style={{ color: '#666' }}>Ask the maker about sizing, materials, or custom crafts.</small>
                </div>
                <button
                  type="button"
                  onClick={() => setShowInquiry(!showInquiry)}
                  style={{ background: '#c49a45', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' }}
                >
                  {showInquiry ? 'Close' : '💬 Ask Artisan'}
                </button>
              </div>

              {showInquiry && (
                <form onSubmit={submitInquiry} style={{ marginTop: '1rem', display: 'grid', gap: '0.6rem' }}>
                  {inquiryError && <p style={{ color: '#c02b2b', fontSize: '0.88rem', margin: 0 }}>{inquiryError}</p>}
                  {inquirySuccess && <p style={{ color: '#0b3d2c', fontSize: '0.88rem', margin: 0 }}>{inquirySuccess}</p>}
                  <textarea
                    required
                    placeholder="Type your question for the artisan..."
                    value={inquiryMessage}
                    onChange={(e) => setInquiryMessage(e.target.value)}
                    style={{ minHeight: '80px', padding: '0.7rem', border: '1px solid #ccc', font: 'inherit', width: '100%', boxSizing: 'border-box' }}
                  />
                  <input
                    type="tel"
                    placeholder="Your phone number (optional, for direct contact)"
                    value={inquiryPhone}
                    onChange={(e) => setInquiryPhone(e.target.value)}
                    style={{ padding: '0.6rem', border: '1px solid #ccc', font: 'inherit', width: '100%', boxSizing: 'border-box' }}
                  />
                  <button
                    type="submit"
                    disabled={inquiryLoading || !inquiryMessage.trim()}
                    style={{ background: '#0b3d2c', color: '#fff', border: 'none', padding: '0.7rem', cursor: 'pointer', fontWeight: 600 }}
                  >
                    {inquiryLoading ? 'Sending inquiry...' : 'Send message to artisan →'}
                  </button>
                </form>
              )}
            </div>

            <div className={styles.promise}>
              <strong>Certified authentic Ethiopian heritage</strong>
              <p>Every piece is handcrafted by local artisans and verified for ethical provenance and quality.</p>
            </div>
          </div>
        </section>

        <section className={styles.reviews}>
          <div>
            <span className={styles.category}>Community notes</span>
            <h2>Reviews from the collection</h2>
          </div>
          <div className={styles.reviewList}>
            {reviews.length ? reviews.map((item) => (
              <article key={item._id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong>{item.author?.name || 'Verified Collector'}</strong>
                  <span style={{ color: '#c49a45' }}>{'★'.repeat(item.rating)}{'☆'.repeat(5 - item.rating)}</span>
                </div>
                {item.isVerified && (
                  <small style={{ color: '#0b3d2c', fontWeight: 600, display: 'block', margin: '0.2rem 0' }}>✓ Verified Buyer</small>
                )}
                <h3>{item.title}</h3>
                <p>{item.comment}</p>
              </article>
            )) : <p>No reviews yet. Be the first to share your experience with this piece.</p>}
          </div>

          <form onSubmit={submitReview} className={styles.reviewForm}>
            <h3>Leave a review</h3>
            {reviewError && <p style={{ color: '#c02b2b', margin: 0 }}>{reviewError}</p>}
            {reviewSuccess && <p style={{ color: '#0b3d2c', margin: 0 }}>{reviewSuccess}</p>}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <label htmlFor="rating-select" style={{ fontSize: '0.9rem', color: '#444' }}>Rating:</label>
              <select
                id="rating-select"
                value={review.rating}
                onChange={(e) => setReview({ ...review, rating: Number(e.target.value) })}
                style={{ padding: '0.5rem', border: '1px solid var(--color-line)', background: '#fff' }}
              >
                <option value={5}>★★★★★ (5 - Masterpiece)</option>
                <option value={4}>★★★★☆ (4 - Great)</option>
                <option value={3}>★★★☆☆ (3 - Good)</option>
                <option value={2}>★★☆☆☆ (2 - Fair)</option>
                <option value={1}>★☆☆☆☆ (1 - Poor)</option>
              </select>
            </div>
            <input
              required
              placeholder="Review title (e.g. Stunning craftsmanship)"
              value={review.title}
              onChange={(e) => setReview({ ...review, title: e.target.value })}
            />
            <textarea
              required
              placeholder="Tell us about the texture, quality, and your experience with this piece..."
              value={review.comment}
              onChange={(e) => setReview({ ...review, comment: e.target.value })}
            />
            <button disabled={reviewLoading}>
              {reviewLoading ? 'Submitting review...' : 'Submit review'}
            </button>
          </form>
        </section>
      </main>
      <Footer />
    </>
  );
};

export default ProductDetailPage;
