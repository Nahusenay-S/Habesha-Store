import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { productAPI, reviewAPI } from '../../lib/api';
import { useCartStore } from '../../store/cartStore';
import styles from '../../styles/product-detail.module.css';

const ProductDetailPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const { addToCart } = useCartStore();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [review, setReview] = useState({ rating: 5, title: '', comment: '' });

  useEffect(() => {
    if (id) productAPI.getById(id).then((response) => setData(response.data)).catch(() => setError('This piece could not be found.'));
  }, [id]);

  const submitReview = async (event) => {
    event.preventDefault();
    try {
      await reviewAPI.create({ ...review, product: id });
      const response = await productAPI.getById(id);
      setData(response.data);
      setReview({ rating: 5, title: '', comment: '' });
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Sign in to leave a review.');
    }
  };

  if (error) return <><Header /><main className={styles.message}>{error}</main><Footer /></>;
  if (!data) return <><Header /><main className={styles.message}>Loading this piece...</main><Footer /></>;
  const { product, reviews = [] } = data;
  return (
    <>
      <Header />
      <main className={styles.page}>
        <button className={styles.back} onClick={() => router.back()}>← Back to collection</button>
        <section className={styles.product}>
          <div className={styles.gallery}>
            <img src={product.images?.[0] || '/images/heritage-textile.svg'} alt={product.name} onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = '/images/heritage-textile.svg'; }} />
          </div>
          <div className={styles.info}>
            <span className={styles.category}>{product.category}</span>
            <h1>{product.name}</h1>
            <p className={styles.seller}>By {product.seller?.name || 'Habesha artisan'}</p>
            <p className={styles.price}>ETB {Number(product.price).toFixed(2)}</p>
            <p className={styles.description}>{product.description}</p>
            <div className={styles.meta}><span>★ {Number(product.rating || 0).toFixed(1)} ({product.reviews || 0} reviews)</span><span>{product.stock > 0 ? `${product.stock} available` : 'Sold out'}</span></div>
            <button className={styles.add} disabled={!product.stock} onClick={() => addToCart(product)}>Add to bag <span>→</span></button>
            <div className={styles.promise}><strong>Certified authentic</strong><p>Every piece is selected directly from its maker and packed with care.</p></div>
          </div>
        </section>
        <section className={styles.reviews}>
          <div><span className={styles.category}>Community notes</span><h2>Reviews from the collection</h2></div>
          <div className={styles.reviewList}>{reviews.length ? reviews.map((item) => <article key={item._id}><strong>{item.author?.name}</strong><span>★ {item.rating}</span><h3>{item.title}</h3><p>{item.comment}</p></article>) : <p>No reviews yet. Be the first to share the story.</p>}</div>
          <form onSubmit={submitReview} className={styles.reviewForm}><h3>Leave a review</h3><input required placeholder="Review title" value={review.title} onChange={(e) => setReview({ ...review, title: e.target.value })} /><textarea required placeholder="Tell us about this piece" value={review.comment} onChange={(e) => setReview({ ...review, comment: e.target.value })} /><button>Submit review</button></form>
        </section>
      </main>
      <Footer />
    </>
  );
};

export default ProductDetailPage;
