import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Button from '../components/Button';
import Badge from '../components/Badge';
import Breadcrumbs from '../components/Breadcrumbs';
import { orderAPI, configAPI, paymentAPI } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useCartStore } from '../store/cartStore';
import styles from '../styles/checkout.module.css';

const CheckoutPage = () => {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { items, clearCart } = useCartStore();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [config, setConfig] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    // Step 1: Customer Contact
    fullName: '',
    email: '',
    phone: '',
    // Step 2: Destination
    country: 'Ethiopia',
    region: 'Addis Ababa',
    city: 'Addis Ababa',
    street: '',
    postalCode: '',
    // Step 3: Delivery Method
    deliveryMethod: 'standard', // 'standard' | 'express_cargo'
    // Step 4: Payment
    paymentMethod: 'telebirr',
  });

  // Pre-fill user data if logged in
  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        fullName: prev.fullName || user.name || '',
        email: prev.email || user.email || '',
        phone: prev.phone || user.phone || '',
        street: prev.street || user.address?.street || '',
        city: prev.city || user.address?.city || 'Addis Ababa',
        region: prev.region || user.address?.region || 'Addis Ababa',
      }));
    }
  }, [user]);

  // Load platform configuration for payment methods & shipping rates
  useEffect(() => {
    configAPI.getPublic()
      .then((res) => {
        setConfig(res.data);
        const methods = res.data.paymentMethods || {};
        const firstEnabled = ['telebirr', 'stripe', 'paypal'].find((m) => methods[m]?.enabled);
        if (firstEnabled) {
          setFormData((prev) => ({ ...prev, paymentMethod: firstEnabled }));
        }
      })
      .catch(() => {});
  }, []);

  const total = items.reduce((sum, item) => sum + Number(item.price || 0) * item.quantity, 0);
  const sellerTotals = items.reduce((groups, item) => {
    const sellerId = item.seller?.id || item.seller_id || 'artisan';
    groups[sellerId] = (groups[sellerId] || 0) + Number(item.price || 0) * item.quantity;
    return groups;
  }, {});

  const baseShipping = Object.values(sellerTotals).reduce((sum, sTotal) => {
    const threshold = config?.shipping?.freeThreshold ?? 1000;
    const flat = config?.shipping?.flatRate ?? 50;
    return sum + (sTotal >= threshold ? 0 : flat);
  }, 0);

  const expressSurcharge = formData.deliveryMethod === 'express_cargo' ? 120 : 0;
  const shipping = baseShipping + expressSurcharge;
  const grandTotal = total + shipping;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateStep = (currentStep) => {
    setError('');
    if (currentStep === 1) {
      if (!formData.fullName.trim() || !formData.email.trim() || !formData.phone.trim()) {
        setError('Please provide your full name, email, and contact phone number.');
        return false;
      }
      if (!formData.email.includes('@')) {
        setError('Please provide a valid email address.');
        return false;
      }
    }
    if (currentStep === 2) {
      if (!formData.street.trim() || !formData.city.trim()) {
        setError('Please provide your delivery street address and city.');
        return false;
      }
    }
    return true;
  };

  const nextStep = () => {
    if (validateStep(step)) {
      setStep((s) => Math.min(5, s + 1));
      window.scrollTo({ top: 120, behavior: 'smooth' });
    }
  };

  const prevStep = () => {
    setError('');
    setStep((s) => Math.max(1, s - 1));
    window.scrollTo({ top: 120, behavior: 'smooth' });
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setError('');

    if (!user) {
      router.push(`/login?next=/checkout`);
      return;
    }

    if (user.role === 'seller') {
      setError('Seller accounts cannot place orders. Please sign in with a collector account.');
      return;
    }

    if (!items.length) {
      setError('Your shopping bag is empty.');
      return;
    }

    setLoading(true);
    try {
      const response = await orderAPI.create({
        items: items.map((item) => ({ product: item._id, quantity: item.quantity })),
        shippingAddress: {
          fullName: formData.fullName,
          street: formData.street,
          city: formData.city,
          region: formData.region,
          country: formData.country,
          phone: formData.phone,
          deliveryMethod: formData.deliveryMethod,
        },
        paymentMethod: formData.paymentMethod,
      });

      clearCart();
      const createdOrder = response.data.order;

      // Telebirr payment initiation
      if (formData.paymentMethod === 'telebirr') {
        try {
          const teleRes = await paymentAPI.initiateTelebirrPayment({ orderId: createdOrder._id });
          router.push(`/order-confirmation?id=${createdOrder._id}&ref=${teleRes.data.referenceId}&pid=${teleRes.data.paymentId}`);
          return;
        } catch (teleErr) {
          console.warn('Telebirr initiation warning:', teleErr);
        }
      }

      router.push(`/order-confirmation?id=${createdOrder._id}`);
    } catch (err) {
      console.error('Order creation failed:', err);
      setError(err.response?.data?.error || 'Unable to place this order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login?next=/checkout&reason=checkout');
    }
  }, [user, authLoading, router]);

  if (authLoading || !user) {
    return (
      <>
        <Header />
        <main className={styles.page}>
          <p>Preparing your checkout experience...</p>
        </main>
        <Footer />
      </>
    );
  }

  if (user?.role === 'seller') {
    return (
      <>
        <Header />
        <main className={styles.page}>
          <div className={styles.formBox} style={{ textAlign: 'center', padding: '4rem 2rem' }}>
            <h2>Artisan Account Active</h2>
            <p style={{ color: 'var(--color-gray)', margin: '1rem 0 2rem' }}>
              You are currently signed in with an artisan/seller account. Shopping checkout is reserved for collector accounts.
            </p>
            <Link href="/vendor">
              <Button variant="primary" size="md">Go to Vendor Terminal →</Button>
            </Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const paymentMethods = config?.paymentMethods || { telebirr: { enabled: true } };

  return (
    <>
      <Head>
        <title>Secure Checkout | Habesha Store</title>
      </Head>

      <Header />

      <main className={styles.page}>
        <Breadcrumbs items={[{ label: 'Bag', href: '/cart' }, { label: 'Secure Checkout' }]} />

        <span className={styles.eyebrow}>Highland Craftsmanship</span>
        <h1 className={styles.pageTitle}>Complete Your Order.</h1>

        {/* 5-Step Progress Stepper */}
        <div className={styles.stepper} aria-label="Checkout Progress">
          {[
            { num: 1, label: 'Customer' },
            { num: 2, label: 'Destination' },
            { num: 3, label: 'Delivery' },
            { num: 4, label: 'Payment' },
            { num: 5, label: 'Review' },
          ].map((s) => (
            <div
              key={s.num}
              className={`${styles.stepItem} ${
                step === s.num ? styles.stepActive : step > s.num ? styles.stepCompleted : ''
              }`}
            >
              <span className={styles.stepNumber}>
                {step > s.num ? '✓' : s.num}
              </span>
              <span>{s.label}</span>
            </div>
          ))}
        </div>

        <div className={styles.layout}>
          {/* Main Step Form Container */}
          <div className={styles.formBox}>
            {error && <div className={styles.errorBanner}>{error}</div>}

            {/* STEP 1: Customer Contact */}
            {step === 1 && (
              <div className={styles.fieldGroup}>
                <div>
                  <h2 className={styles.stepHeading}>1. Customer Information</h2>
                  <p className={styles.stepSubtext}>
                    We will send order receipts, tracking numbers, and artisan craft notes here.
                  </p>
                </div>
                <div className={styles.field}>
                  <label htmlFor="fullName">Full Name</label>
                  <input
                    id="fullName"
                    name="fullName"
                    type="text"
                    required
                    placeholder="e.g. Almaz Bekele"
                    value={formData.fullName}
                    onChange={handleChange}
                  />
                </div>
                <div className={styles.row}>
                  <div className={styles.field}>
                    <label htmlFor="email">Email Address</label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      placeholder="almaz@example.com"
                      value={formData.email}
                      onChange={handleChange}
                    />
                  </div>
                  <div className={styles.field}>
                    <label htmlFor="phone">Phone Number</label>
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      required
                      placeholder="+251 91 123 4567"
                      value={formData.phone}
                      onChange={handleChange}
                    />
                  </div>
                </div>
                <div className={styles.buttonRow}>
                  <Link href="/cart">
                    <Button variant="ghost" size="md">← Return to Bag</Button>
                  </Link>
                  <Button variant="primary" size="md" onClick={nextStep}>
                    Continue to Destination →
                  </Button>
                </div>
              </div>
            )}

            {/* STEP 2: Delivery Destination */}
            {step === 2 && (
              <div className={styles.fieldGroup}>
                <div>
                  <h2 className={styles.stepHeading}>2. Delivery Destination</h2>
                  <p className={styles.stepSubtext}>
                    Where should our carrier dispatch your handcrafted pieces?
                  </p>
                </div>
                <div className={styles.row}>
                  <div className={styles.field}>
                    <label htmlFor="country">Country</label>
                    <select
                      id="country"
                      name="country"
                      value={formData.country}
                      onChange={handleChange}
                    >
                      <option value="Ethiopia">Ethiopia</option>
                      <option value="United States">United States</option>
                      <option value="United Kingdom">United Kingdom</option>
                      <option value="Canada">Canada</option>
                      <option value="Germany">Germany</option>
                    </select>
                  </div>
                  <div className={styles.field}>
                    <label htmlFor="region">Region / State</label>
                    <input
                      id="region"
                      name="region"
                      type="text"
                      placeholder="e.g. Addis Ababa / Oromia"
                      value={formData.region}
                      onChange={handleChange}
                    />
                  </div>
                </div>
                <div className={styles.row}>
                  <div className={styles.field}>
                    <label htmlFor="city">City / Sub-City</label>
                    <input
                      id="city"
                      name="city"
                      type="text"
                      required
                      placeholder="e.g. Bole / Addis Ababa"
                      value={formData.city}
                      onChange={handleChange}
                    />
                  </div>
                  <div className={styles.field}>
                    <label htmlFor="postalCode">Postal Code (Optional)</label>
                    <input
                      id="postalCode"
                      name="postalCode"
                      type="text"
                      placeholder="e.g. 1000"
                      value={formData.postalCode}
                      onChange={handleChange}
                    />
                  </div>
                </div>
                <div className={styles.field}>
                  <label htmlFor="street">Street Address & Residence</label>
                  <input
                    id="street"
                    name="street"
                    type="text"
                    required
                    placeholder="e.g. Namibia St, House 42 / Behind Edna Mall"
                    value={formData.street}
                    onChange={handleChange}
                  />
                </div>
                <div className={styles.buttonRow}>
                  <Button variant="ghost" size="md" onClick={prevStep}>← Back</Button>
                  <Button variant="primary" size="md" onClick={nextStep}>
                    Continue to Delivery Method →
                  </Button>
                </div>
              </div>
            )}

            {/* STEP 3: Delivery Options */}
            {step === 3 && (
              <div className={styles.fieldGroup}>
                <div>
                  <h2 className={styles.stepHeading}>3. Delivery Method</h2>
                  <p className={styles.stepSubtext}>
                    Choose the dispatch carrier speed for your curated order.
                  </p>
                </div>
                <label
                  className={`${styles.optionCard} ${
                    formData.deliveryMethod === 'standard' ? styles.optionSelected : ''
                  }`}
                >
                  <input
                    type="radio"
                    name="deliveryMethod"
                    value="standard"
                    checked={formData.deliveryMethod === 'standard'}
                    onChange={handleChange}
                  />
                  <div className={styles.optionInfo}>
                    <h4>Standard Ground Delivery</h4>
                    <p>Delivered within 2–3 business days directly to your doorstep in Addis Ababa.</p>
                    <small style={{ color: 'var(--color-green)', fontWeight: 600 }}>
                      Rate: {config?.currency || 'ETB'} {baseShipping.toFixed(2)}
                    </small>
                  </div>
                </label>

                <label
                  className={`${styles.optionCard} ${
                    formData.deliveryMethod === 'express_cargo' ? styles.optionSelected : ''
                  }`}
                >
                  <input
                    type="radio"
                    name="deliveryMethod"
                    value="express_cargo"
                    checked={formData.deliveryMethod === 'express_cargo'}
                    onChange={handleChange}
                  />
                  <div className={styles.optionInfo}>
                    <h4>✦ Priority Flightway Cargo (Ethiopian Airlines)</h4>
                    <p>Next-day priority dispatch with live cargo bill tracking number and signature confirmation.</p>
                    <small style={{ color: 'var(--color-gold)', fontWeight: 700 }}>
                      Rate: {config?.currency || 'ETB'} {(baseShipping + 120).toFixed(2)} (+ETB 120 priority charge)
                    </small>
                  </div>
                </label>

                <div className={styles.buttonRow}>
                  <Button variant="ghost" size="md" onClick={prevStep}>← Back</Button>
                  <Button variant="primary" size="md" onClick={nextStep}>
                    Continue to Payment →
                  </Button>
                </div>
              </div>
            )}

            {/* STEP 4: Payment Selection */}
            {step === 4 && (
              <div className={styles.fieldGroup}>
                <div>
                  <h2 className={styles.stepHeading}>4. Select Payment Method</h2>
                  <p className={styles.stepSubtext}>
                    Transactions are encrypted and processed through compliant financial gateways.
                  </p>
                </div>

                {paymentMethods.telebirr?.enabled && (
                  <label
                    className={`${styles.optionCard} ${
                      formData.paymentMethod === 'telebirr' ? styles.optionSelected : ''
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="telebirr"
                      checked={formData.paymentMethod === 'telebirr'}
                      onChange={handleChange}
                    />
                    <div className={styles.optionInfo}>
                      <h4>Telebirr Digital Wallet</h4>
                      <p>Instant mobile payment via Ethio Telecom Telebirr app or USSD prompt.</p>
                      <Badge variant="gold" size="sm">Recommended in Ethiopia</Badge>
                    </div>
                  </label>
                )}

                {paymentMethods.stripe?.enabled && (
                  <label
                    className={`${styles.optionCard} ${
                      formData.paymentMethod === 'stripe' ? styles.optionSelected : ''
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="stripe"
                      checked={formData.paymentMethod === 'stripe'}
                      onChange={handleChange}
                    />
                    <div className={styles.optionInfo}>
                      <h4>International Card (Visa / Mastercard)</h4>
                      <p>Secure global card checkout powered by Stripe encrypted checkout.</p>
                    </div>
                  </label>
                )}

                {paymentMethods.paypal?.enabled && (
                  <label
                    className={`${styles.optionCard} ${
                      formData.paymentMethod === 'paypal' ? styles.optionSelected : ''
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="paypal"
                      checked={formData.paymentMethod === 'paypal'}
                      onChange={handleChange}
                    />
                    <div className={styles.optionInfo}>
                      <h4>PayPal</h4>
                      <p>Pay with your PayPal balance or connected bank account.</p>
                    </div>
                  </label>
                )}

                <div className={styles.buttonRow}>
                  <Button variant="ghost" size="md" onClick={prevStep}>← Back</Button>
                  <Button variant="primary" size="md" onClick={nextStep}>
                    Review Order →
                  </Button>
                </div>
              </div>
            )}

            {/* STEP 5: Final Review & Confirmation */}
            {step === 5 && (
              <div className={styles.fieldGroup}>
                <div>
                  <h2 className={styles.stepHeading}>5. Review & Confirm Order</h2>
                  <p className={styles.stepSubtext}>
                    Please review your delivery details and order pieces before finalizing.
                  </p>
                </div>

                <div className={styles.reviewSection}>
                  <h4>Recipient & Contact</h4>
                  <p><strong>{formData.fullName}</strong></p>
                  <p>{formData.email} • {formData.phone}</p>
                </div>

                <div className={styles.reviewSection}>
                  <h4>Delivery Address</h4>
                  <p>{formData.street}</p>
                  <p>{formData.city}, {formData.region}, {formData.country} {formData.postalCode}</p>
                  <p style={{ marginTop: '0.4rem', color: 'var(--color-green)', fontWeight: 600 }}>
                    Method: {formData.deliveryMethod === 'express_cargo' ? 'Priority Flightway Cargo' : 'Standard Ground'}
                  </p>
                </div>

                <div className={styles.reviewSection}>
                  <h4>Payment Choice</h4>
                  <p style={{ textTransform: 'capitalize' }}>
                    <strong>{formData.paymentMethod}</strong> payment
                  </p>
                </div>

                <div className={styles.buttonRow}>
                  <Button variant="ghost" size="md" onClick={prevStep}>← Modify Details</Button>
                  <Button
                    variant="primary"
                    size="lg"
                    loading={loading}
                    disabled={!items.length}
                    onClick={handlePlaceOrder}
                  >
                    Place Order & Confirm ({config?.currency || 'ETB'} {grandTotal.toFixed(2)}) →
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Sticky Order Summary Sidebar */}
          <aside className={styles.summary}>
            <h3>Order Summary ({items.length} items)</h3>
            <div className={styles.itemsList}>
              {items.map((item) => (
                <div key={item._id} className={styles.summaryItem}>
                  <span>{item.name} × {item.quantity}</span>
                  <strong>{config?.currency || 'ETB'} {(Number(item.price) * item.quantity).toFixed(2)}</strong>
                </div>
              ))}
            </div>

            <div className={styles.costRow}>
              <span>Subtotal:</span>
              <span>{config?.currency || 'ETB'} {total.toFixed(2)}</span>
            </div>

            <div className={styles.costRow}>
              <span>Carrier Shipping:</span>
              <span>{config?.currency || 'ETB'} {shipping.toFixed(2)}</span>
            </div>

            <div className={styles.totalRow}>
              <span>Total:</span>
              <span>{config?.currency || 'ETB'} {grandTotal.toFixed(2)}</span>
            </div>
          </aside>
        </div>
      </main>

      <Footer />
    </>
  );
};

export default CheckoutPage;
