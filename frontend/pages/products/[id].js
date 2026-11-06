import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import Breadcrumbs from '../../components/Breadcrumbs';
import Button from '../../components/Button';
import Badge from '../../components/Badge';
import Icon from '../../components/Icon';
import ProductCard from '../../components/ProductCard';
import { productAPI, reviewAPI } from '../../lib/api';
import { useCartStore } from '../../store/cartStore';
import { useWishlistStore } from '../../store/wishlistStore';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import styles from '../../styles/product-detail.module.css';

const ProductDetailPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const { addToCart } = useCartStore();
  const { toggle: toggleWishlist, items: wishlistItems } = useWishlistStore();
  const { user } = useAuth();
  const { t, language } = useLanguage();

  const [data, setData] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [pageError, setPageError] = useState('');
  const [addedNotice, setAddedNotice] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('story'); // 'story' | 'specs' | 'artisan' | 'shipping'
  const [shareNotice, setShareNotice] = useState(false);
  const [recentlyViewed, setRecentlyViewed] = useState([]);

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
        .then((response) => {
          setData(response.data);
          const category = response.data.product?.category;
          if (category) {
            productAPI.getAll({ category, limit: 4 })
              .then((res) => {
                setRelatedProducts((res.data.products || []).filter((p) => p._id !== id));
              })
              .catch(() => {});
          }
        })
        .catch(() => setPageError('This piece could not be found in our collection.'));
    }
  }, [id]);

  useEffect(() => {
    if (data?.product && typeof window !== 'undefined') {
      try {
        const stored = JSON.parse(localStorage.getItem('habesha_recently_viewed') || '[]');
        const filtered = stored.filter((item) => item.id !== data.product._id);
        setRecentlyViewed(filtered.slice(0, 4));
        const updated = [
          {
            id: data.product._id,
            name: data.product.name,
            price: data.product.price,
            images: data.product.images,
            category: data.product.category,
            stock: data.product.stock,
          },
          ...filtered,
        ].slice(0, 6);
        localStorage.setItem('habesha_recently_viewed', JSON.stringify(updated));
      } catch (e) {
        // storage disabled or quota
      }
    }
  }, [data?.product]);

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      if (navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(window.location.href);
      }
      setShareNotice(true);
      setTimeout(() => setShareNotice(false), 2500);
    }
  };

  const handleAddToCart = () => {
    if (!user) {
      router.push(`/login?next=${encodeURIComponent(router.asPath)}&reason=cart`);
      return;
    }
    if (user?.role === 'seller') {
      alert('Artisan/seller accounts cannot purchase items.');
      return;
    }
    if (data?.product) {
      for (let i = 0; i < quantity; i++) {
        addToCart(data.product);
      }
      setAddedNotice(true);
      setTimeout(() => setAddedNotice(false), 3000);
    }
  };

  const handleBuyNow = () => {
    if (!user) {
      router.push(`/login?next=${encodeURIComponent(router.asPath)}&reason=cart`);
      return;
    }
    if (user?.role === 'seller') {
      alert('Artisan/seller accounts cannot purchase items.');
      return;
    }
    if (data?.product) {
      for (let i = 0; i < quantity; i++) {
        addToCart(data.product);
      }
      router.push('/checkout');
    }
  };

  const handleToggleWishlist = (piece) => {
    if (!user) {
      router.push(`/login?next=${encodeURIComponent(router.asPath)}&reason=wishlist`);
      return;
    }
    toggleWishlist(piece);
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
      setReviewSuccess('Thank you for sharing your experience with this piece!');
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
      setInquiryError('Please sign in to message this artisan.');
      return;
    }
    setInquiryLoading(true);
    try {
      await productAPI.inquire(id, { message: inquiryMessage, contactPhone: inquiryPhone });
      setInquirySuccess('Your message was sent directly to the maker! You will receive a response in your notifications.');
      setInquiryMessage('');
      setInquiryPhone('');
    } catch (requestError) {
      setInquiryError(requestError.response?.data?.error || 'Unable to deliver your inquiry.');
    } finally {
      setInquiryLoading(false);
    }
  };

  if (pageError) {
    return (
      <>
        <Header />
        <main className={styles.message}>
          <h2>{pageError}</h2>
          <p>The piece you are looking for may have been archived or sold.</p>
          <Link href="/products" style={{ color: 'var(--color-green)', fontWeight: 600, textDecoration: 'underline' }}>
            ← Return to full collection
          </Link>
        </main>
        <Footer />
      </>
    );
  }

  if (!data) {
    return (
      <>
        <Header />
        <main className={styles.message}>
          <p>Unfolding this piece from the archives...</p>
        </main>
        <Footer />
      </>
    );
  }

  const { product, reviews = [] } = data;
  const images = Array.isArray(product?.images) && product.images.length > 0 ? product.images : ['/images/heritage-textile.jpg'];
  const isSaved = Boolean(user && wishlistItems.some((item) => item._id === product._id));
  const inStock = (product.stock || 0) > 0;
  const isSeller = user?.role === 'seller';
  const price = Number(product.price || 0);

  return (
    <>
      <Head>
        <title>{product.name} | Habesha Store</title>
        <meta name="description" content={product.description?.slice(0, 160)} />
      </Head>

      <Header />

      <main className={styles.page}>
        <Breadcrumbs
          items={[
            { label: 'Shop', href: '/products' },
            { label: product.category?.toUpperCase() || 'HERITAGE', href: `/products?category=${product.category}` },
            { label: product.name },
          ]}
        />

        <section className={styles.product}>
          {/* Gallery Column */}
          <div className={styles.galleryCol}>
            <div className={styles.mainImageWrapper}>
              <img
                src={images[selectedImageIndex] || images[0] || '/images/heritage-textile.jpg'}
                alt={product.name}
                className={styles.mainImage}
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = '/images/heritage-textile.jpg';
                }}
              />
            </div>
            {images.length > 1 && (
              <div className={styles.thumbnailStrip}>
                {images.map((imgUrl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`${styles.thumbBtn} ${idx === selectedImageIndex ? styles.thumbBtnActive : ''}`}
                    aria-label={`Select photo ${idx + 1}`}
                  >
                    <img
                      src={imgUrl}
                      alt=""
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = '/images/heritage-textile.jpg';
                      }}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Details & Actions */}
          <div className={styles.info}>
            <span className={styles.categoryTag}>{product.category}</span>
            <h1 className={styles.productTitle}>{product.name}</h1>
            <p className={styles.seller}>
              Handcrafted in Ethiopia by <strong>{product.seller?.name || 'Highland Artisan Guild'}</strong>
            </p>

            <div className={styles.priceRatingRow}>
              <span className={styles.price}>{t('common.currency', 'ETB')} {price.toFixed(2)}</span>
              <span className={styles.rating}>★ {Number(product.rating || 5).toFixed(1)} ({reviews.length} {t('product.reviews', 'reviews')})</span>
              <span className={styles.stockBadge}>
                {inStock ? (
                  <Badge variant="success">{t('product.in_stock', 'In Stock')} ({product.stock})</Badge>
                ) : (
                  <Badge variant="danger">{t('product.out_of_stock', 'Sold Out')}</Badge>
                )}
              </span>
            </div>

            <p className={styles.description}>{product.description}</p>

            {/* Purchase Controls */}
            <div className={styles.purchaseSection}>
              {inStock && !isSeller && (
                <div className={styles.quantityRow}>
                  <span className={styles.qtyLabel}>{t('cart.quantity', 'Quantity')}:</span>
                  <div className={styles.qtyControls}>
                    <button
                      type="button"
                      className={styles.qtyBtn}
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    >
                      −
                    </button>
                    <span className={styles.qtyValue}>{quantity}</span>
                    <button
                      type="button"
                      className={styles.qtyBtn}
                      onClick={() => setQuantity((q) => Math.min(product.stock || 10, q + 1))}
                    >
                      +
                    </button>
                  </div>
                </div>
              )}

              {addedNotice && (
                <div style={{ background: '#eaf5ee', color: '#174f3f', padding: '0.75rem 1rem', marginBottom: '1rem', border: '1px solid #b7dfca', borderRadius: '3px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>✓ {language === 'am' ? `${quantity} ቅርሶች ወደ ቅርጫትዎ ተጨምረዋል!` : `Added ${quantity} to your shopping bag!`}</span>
                  <Link href="/cart" style={{ color: '#174f3f', fontWeight: 700, textDecoration: 'underline' }}>
                    {t('cart.title', 'Shopping Bag')} →
                  </Link>
                </div>
              )}

              <div className={styles.btnRow}>
                <Button
                  variant="primary"
                  size="lg"
                  disabled={!inStock || isSeller}
                  onClick={handleAddToCart}
                >
                  {addedNotice ? t('product.added', 'Added ✓') : inStock ? t('product.add_to_cart', 'Add to Shopping Bag') : t('product.out_of_stock', 'Sold Out')}
                </Button>
                <Button
                  variant="gold"
                  size="lg"
                  disabled={!inStock || isSeller}
                  onClick={handleBuyNow}
                >
                  {t('product.buy_now', 'Buy Now')} →
                </Button>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className={`${styles.wishlistBtn} ${isSaved ? styles.wishlistSaved : ''}`}
                  onClick={() => handleToggleWishlist(product)}
                  style={{ margin: 0, flex: 1, minWidth: '160px' }}
                >
                  <Icon name="heart" size={16} />
                  <span>{isSaved ? t('product.saved', 'Saved in Treasures') : t('product.save_wishlist', 'Save to Treasures')}</span>
                </button>
                <button
                  type="button"
                  className={styles.wishlistBtn}
                  onClick={handleShare}
                  style={{ margin: 0, flex: 1, minWidth: '160px' }}
                >
                  <span>{shareNotice ? '✓' : '🔗'}</span>
                  <span>{shareNotice ? (language === 'am' ? 'ሊንኩ ተገልብጧል!' : 'Link Copied to Clipboard!') : (language === 'am' ? 'ይህንን ቅርስ ያጋሩ' : 'Share Piece')}</span>
                </button>
              </div>
            </div>

            {/* Story & Technical Accordion Tabs */}
            <div className={styles.tabsContainer}>
              <div className={styles.tabButtons}>
                <button
                  type="button"
                  className={`${styles.tabBtn} ${activeTab === 'story' ? styles.tabBtnActive : ''}`}
                  onClick={() => setActiveTab('story')}
                >
                  {t('detail.description_tab', 'Heritage Story')}
                </button>
                <button
                  type="button"
                  className={`${styles.tabBtn} ${activeTab === 'specs' ? styles.tabBtnActive : ''}`}
                  onClick={() => setActiveTab('specs')}
                >
                  {t('detail.details_tab', 'Specifications')}
                </button>
                <button
                  type="button"
                  className={`${styles.tabBtn} ${activeTab === 'artisan' ? styles.tabBtnActive : ''}`}
                  onClick={() => setActiveTab('artisan')}
                >
                  {t('detail.maker_workshop', 'Artisan Maker')}
                </button>
                <button
                  type="button"
                  className={`${styles.tabBtn} ${activeTab === 'shipping' ? styles.tabBtnActive : ''}`}
                  onClick={() => setActiveTab('shipping')}
                >
                  {language === 'am' ? 'ማጓጓዣ እና አመጣጥ' : 'Shipping & Origin'}
                </button>
              </div>

              <div className={styles.tabContent}>
                {activeTab === 'story' && (
                  <div>
                    <p>{product.description}</p>
                    <p style={{ marginTop: '0.75rem', fontStyle: 'italic', color: 'var(--color-gray)' }}>
                      {language === 'am'
                        ? 'እያንዳንዱ ምርት በእጅ የተሠራ መሆኑን የሚያረጋግጥ ልዩ ጥበባዊ አሻራ አለው።'
                        : 'Each creation carries unique artisanal irregularities that testify to hand production without factory tooling.'}
                    </p>
                  </div>
                )}

                {activeTab === 'specs' && (
                  <table className={styles.specTable}>
                    <tbody>
                      <tr>
                        <td>{t('detail.origin', 'Origin')}</td>
                        <td>{language === 'am' ? 'ኢትዮጵያ (የደጋ አካባቢ)' : 'Ethiopia (Highlands Region)'}</td>
                      </tr>
                      <tr>
                        <td>{t('vendor.product_category', 'Category')}</td>
                        <td>{product.category?.toUpperCase()}</td>
                      </tr>
                      <tr>
                        <td>{t('detail.materials', 'Technique')}</td>
                        <td>{language === 'am' ? 'ባህላዊ የትውልድ የእደ-ጥበብ ዘዴ' : 'Traditional Ancestral Craftsmanship'}</td>
                      </tr>
                      <tr>
                        <td>{language === 'am' ? 'የዕቃ መለያ ቁጥር' : 'Stock Reference'}</td>
                        <td>HB-{product._id.slice(0, 8).toUpperCase()}</td>
                      </tr>
                      <tr>
                        <td>{language === 'am' ? 'የአያያዝ መመሪያ' : 'Care Instructions'}</td>
                        <td>{language === 'am' ? 'በእጅ በቀስታ እጠቡት ወይም አቧራውን ይጥረጉ፤ ከእርጥበት ይጠብቁት።' : 'Gentle hand wash or dry dust; store away from prolonged direct moisture.'}</td>
                      </tr>
                    </tbody>
                  </table>
                )}

                {activeTab === 'artisan' && (
                  <div>
                    <p>
                      {language === 'am'
                        ? <>የተሠራው በ <strong>{product.seller?.name || 'የሀገር ውስጥ የሸማኔ ማህበር'}</strong> ነው። የእርስዎ ግዢ ገቢውን በቀጥታ ለእደ-ጥበብ ባለሙያዎች ያስተላልፋል።</>
                        : <>Crafted by <strong>{product.seller?.name || 'Local Artisan Guild'}</strong>. Every purchase sends earnings directly to independent makers and preserves community weaving, pottery, and culinary arts.</>}
                    </p>
                    <div style={{ marginTop: '1rem' }}>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setShowInquiry(!showInquiry)}
                      >
                        {showInquiry ? (language === 'am' ? 'የመልዕክት ቅጹን ዝጋ' : 'Close Inquiry Form') : `💬 ${t('detail.inquire_title', 'Send Message to Artisan')}`}
                      </Button>
                    </div>

                    {showInquiry && (
                      <form onSubmit={submitInquiry} style={{ marginTop: '1rem', display: 'grid', gap: '0.65rem' }}>
                        {inquiryError && <p style={{ color: '#c02b2b', margin: 0 }}>{inquiryError}</p>}
                        {inquirySuccess && <p style={{ color: 'var(--color-green)', margin: 0 }}>{inquirySuccess}</p>}
                        <textarea
                          required
                          placeholder={t('detail.inquire_placeholder', 'Ask the artisan about sizing, materials, or custom crafts...')}
                          value={inquiryMessage}
                          onChange={(e) => setInquiryMessage(e.target.value)}
                          style={{ minHeight: '80px', padding: '0.75rem', border: '1px solid var(--color-line)', width: '100%', boxSizing: 'border-box' }}
                        />
                        <input
                          type="tel"
                          placeholder={t('detail.inquire_phone', 'Your phone number (optional)')}
                          value={inquiryPhone}
                          onChange={(e) => setInquiryPhone(e.target.value)}
                          style={{ padding: '0.6rem', border: '1px solid var(--color-line)', width: '100%', boxSizing: 'border-box' }}
                        />
                        <Button type="submit" variant="primary" size="sm" loading={inquiryLoading}>
                          {t('detail.inquire_submit', 'Submit Message to Artisan')}
                        </Button>
                      </form>
                    )}
                  </div>
                )}

                {activeTab === 'shipping' && (
                  <div>
                    <p>
                      <strong>{language === 'am' ? 'በኢትዮጵያ አየር መንገድ ካርጎ የሚላክ:' : 'Dispatched via Ethiopian Airlines Cargo:'}</strong> {language === 'am' ? 'ከተፈጥሮ በተገኙ ክሮች በጥንቃቄ ተጠቅልሎ ይላካል።' : 'Carefully wrapped in protective organic fibers.'}
                    </p>
                    <p style={{ marginTop: '0.5rem' }}>
                      {language === 'am' ? '✦ በአዲስ አበባ ውስጥ ማድረስ፡ ከ24 እስከ 48 ሰዓታት' : '✦ Local Addis Ababa Delivery: 24–48 hours'}<br />
                      {language === 'am' ? '✦ ክፍለ ሀገር እና ዓለም አቀፍ የበረራ ካርጎ፡ ከ3 እስከ 7 የስራ ቀናት በቀጥታ የበረራ መከታተያ ቁጥር' : '✦ Regional & International Flightway Cargo: 3–7 business days with live cargo tracking number provided upon dispatch.'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Related Heritage Pieces */}
        {relatedProducts.length > 0 && (
          <section className={styles.relatedSection}>
            <h2>{language === 'am' ? 'ተመሳሳይ የባህል ቅርሶች' : 'Related Heritage Pieces'}</h2>
            <div className={styles.relatedGrid}>
              {relatedProducts.map((p) => (
                <ProductCard key={p._id} product={p} />
              ))}
            </div>
          </section>
        )}

        {/* Community Reviews */}
        <section className={styles.reviewsSection}>
          <div className={styles.reviewsHeading}>
            <div>
              <span className={styles.categoryTag}>{t('home.testimonials_badge', 'Verified Feedback')}</span>
              <h2>{t('detail.reviews_heading', 'Collector Reviews')} ({reviews.length})</h2>
            </div>
          </div>

          <div className={styles.reviewList}>
            {reviews.length ? (
              reviews.map((item) => (
                <article key={item._id} className={styles.reviewCard}>
                  <div className={styles.reviewCardHeader}>
                    <strong>{item.author?.name || t('home.verified_collector', 'Verified Collector')}</strong>
                    <span className={styles.reviewRating}>
                      {'★'.repeat(item.rating)}{'☆'.repeat(5 - item.rating)}
                    </span>
                  </div>
                  {item.isVerified && (
                    <Badge variant="success" size="sm">✓ {t('home.verified_collector', 'Verified Collector')}</Badge>
                  )}
                  <h3 className={styles.reviewTitle}>{item.title}</h3>
                  <p className={styles.reviewComment}>{item.comment}</p>
                </article>
              ))
            ) : (
              <p style={{ gridColumn: '1 / -1', color: 'var(--color-gray)' }}>
                {t('detail.no_reviews', 'No reviews yet for this piece. Be the first to share your notes on its craft and texture.')}
              </p>
            )}
          </div>

          {/* Leave a Review Form */}
          <div className={styles.reviewFormBox}>
            <h3>{t('detail.leave_review', 'Leave a review')}</h3>
            {reviewError && <p style={{ color: '#c02b2b', margin: '0 0 1rem' }}>{reviewError}</p>}
            {reviewSuccess && <p style={{ color: 'var(--color-green)', margin: '0 0 1rem' }}>{reviewSuccess}</p>}
            <form onSubmit={submitReview} style={{ display: 'grid', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <label htmlFor="rating-select" style={{ fontSize: '0.9rem', fontWeight: 600 }}>{t('detail.review_rating_label', 'Rating')}:</label>
                <select
                  id="rating-select"
                  value={review.rating}
                  onChange={(e) => setReview({ ...review, rating: Number(e.target.value) })}
                  style={{ padding: '0.5rem 0.75rem', border: '1px solid var(--color-line)', background: '#fff' }}
                >
                  <option value={5}>★★★★★ (5 - {language === 'am' ? 'ድንቅ ስራ' : 'Masterpiece'})</option>
                  <option value={4}>★★★★☆ (4 - {language === 'am' ? 'በጣም ጥሩ' : 'Excellent'})</option>
                  <option value={3}>★★★☆☆ (3 - {language === 'am' ? 'ጥሩ' : 'Good'})</option>
                  <option value={2}>★★☆☆☆ (2 - {language === 'am' ? 'መካከለኛ' : 'Fair'})</option>
                  <option value={1}>★☆☆☆☆ (1 - {language === 'am' ? 'ደካማ' : 'Poor'})</option>
                </select>
              </div>

              <input
                required
                placeholder={t('detail.review_title_placeholder', 'Review headline (e.g. Magnificent weave and soft texture)')}
                value={review.title}
                onChange={(e) => setReview({ ...review, title: e.target.value })}
                style={{ padding: '0.75rem', border: '1px solid var(--color-line)', font: 'inherit' }}
              />

              <textarea
                required
                placeholder={t('detail.review_comment_placeholder', 'Share notes on the weight, craftsmanship, and how you display or use this piece...')}
                value={review.comment}
                onChange={(e) => setReview({ ...review, comment: e.target.value })}
                style={{ minHeight: '110px', padding: '0.75rem', border: '1px solid var(--color-line)', font: 'inherit' }}
              />

              <Button type="submit" variant="primary" size="md" loading={reviewLoading}>
                {t('detail.review_submit', 'Submit Review')}
              </Button>
            </form>
          </div>
        </section>

        {/* Recently Viewed Rail */}
        {recentlyViewed.length > 0 && (
          <section className={styles.relatedSection} style={{ marginTop: '3.5rem' }}>
            <span className={styles.categoryTag}>{language === 'am' ? 'የቅርብ ጊዜ ጉብኝት' : 'Collector Memory'}</span>
            <h2>{language === 'am' ? 'በቅርብ ጊዜ ያገኟቸው ቅርሶች' : 'Recently Viewed Pieces'}</h2>
            <div className={styles.relatedGrid}>
              {recentlyViewed.map((item) => (
                <ProductCard key={item.id} product={{ _id: item.id, ...item }} />
              ))}
            </div>
          </section>
        )}
      </main>

      <Footer />
    </>
  );
};

export default ProductDetailPage;
