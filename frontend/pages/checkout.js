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
import { useLanguage } from '../context/LanguageContext';
import styles from '../styles/checkout.module.css';

const CheckoutPage = () => {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { items, clearCart } = useCartStore();
  const { t, language } = useLanguage();

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
    paymentMethod: 'chapa',
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
        const firstEnabled = ['chapa', 'telebirr', 'stripe', 'paypal'].find((m) => methods[m]?.enabled);
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

      // Chapa payment initiation (Telebirr, CBE Birr, Awash, Cards)
      if (formData.paymentMethod === 'chapa') {
        try {
          const chapaRes = await paymentAPI.initiateChapaPayment({ orderId: createdOrder._id });
          if (chapaRes.data?.checkoutUrl) {
            if (chapaRes.data.isSandbox) {
              router.push(`/order-confirmation?id=${createdOrder._id}&provider=chapa&sandbox=true&open_modal=true`);
              return;
            } else {
              window.location.href = chapaRes.data.checkoutUrl;
              return;
            }
          }
        } catch (chapaErr) {
          console.warn('Chapa initiation warning, routing to confirmation:', chapaErr);
        }
      }

      // Telebirr direct payment initiation
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
        <h1 className={styles.pageTitle}>{t('checkout.title', 'Complete Your Order.')}</h1>

        {/* 5-Step Progress Stepper */}
        <div className={styles.stepper} aria-label="Checkout Progress">
          {[
            { num: 1, label: language === 'am' ? 'መረጃ' : 'Customer' },
            { num: 2, label: language === 'am' ? 'አድራሻ' : 'Destination' },
            { num: 3, label: language === 'am' ? 'ማጓጓዣ' : 'Delivery' },
            { num: 4, label: language === 'am' ? 'ክፍያ' : 'Payment' },
            { num: 5, label: language === 'am' ? 'ማጠቃለያ' : 'Review' },
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
                  <h2 className={styles.stepHeading}>{language === 'am' ? '1. የተቀባይ መረጃ' : '1. Customer Information'}</h2>
                  <p className={styles.stepSubtext}>
                    {language === 'am' ? 'ደረሰኝ፣ የካርጎ መከታተያ ቁጥር እና ማሳወቂያዎችን የምንልክበትን መረጃ ያስገቡ።' : 'We will send order receipts, tracking numbers, and artisan craft notes here.'}
                  </p>
                </div>
                <div className={styles.field}>
                  <label htmlFor="fullName">{t('checkout.full_name', 'Full Name')}</label>
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
                    <label htmlFor="email">{t('checkout.email', 'Email Address')}</label>
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
                    <label htmlFor="phone">{t('checkout.phone', 'Phone Number')}</label>
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
                    <Button variant="ghost" size="md">← {t('cart.title', 'Return to Bag')}</Button>
                  </Link>
                  <Button variant="primary" size="md" onClick={nextStep}>
                    {language === 'am' ? 'ወደ መላኪያ አድራሻ ቀጥል →' : 'Continue to Destination →'}
                  </Button>
                </div>
              </div>
            )}

            {/* STEP 2: Delivery Destination */}
            {step === 2 && (
              <div className={styles.fieldGroup}>
                <div>
                  <h2 className={styles.stepHeading}>{language === 'am' ? '2. የመላኪያ አድራሻ' : '2. Delivery Destination'}</h2>
                  <p className={styles.stepSubtext}>
                    {language === 'am' ? 'የተሸመኑትን እና የተዘጋጁትን ቅርሶች ወዴት እንላክልዎ?' : 'Where should our carrier dispatch your handcrafted pieces?'}
                  </p>
                </div>
                <div className={styles.row}>
                  <div className={styles.field}>
                    <label htmlFor="country">{t('checkout.country', 'Country')}</label>
                    <select
                      id="country"
                      name="country"
                      value={formData.country}
                      onChange={handleChange}
                    >
                      <option value="Ethiopia">{language === 'am' ? 'ኢትዮጵያ' : 'Ethiopia'}</option>
                      <option value="United States">{language === 'am' ? 'አሜሪካ' : 'United States'}</option>
                      <option value="United Kingdom">{language === 'am' ? 'እንግሊዝ' : 'United Kingdom'}</option>
                      <option value="Canada">{language === 'am' ? 'ካናዳ' : 'Canada'}</option>
                      <option value="Germany">{language === 'am' ? 'ጀርመን' : 'Germany'}</option>
                    </select>
                  </div>
                  <div className={styles.field}>
                    <label htmlFor="region">{t('checkout.region', 'Region / State')}</label>
                    <input
                      id="region"
                      name="region"
                      type="text"
                      placeholder={language === 'am' ? 'ለምሳሌ አዲስ አበባ / ኦሮሚያ' : 'e.g. Addis Ababa / Oromia'}
                      value={formData.region}
                      onChange={handleChange}
                    />
                  </div>
                </div>
                <div className={styles.row}>
                  <div className={styles.field}>
                    <label htmlFor="city">{t('checkout.city', 'City / Sub-City')}</label>
                    <input
                      id="city"
                      name="city"
                      type="text"
                      required
                      placeholder={language === 'am' ? 'ለምሳሌ ቦሌ / አዲስ አበባ' : 'e.g. Bole / Addis Ababa'}
                      value={formData.city}
                      onChange={handleChange}
                    />
                  </div>
                  <div className={styles.field}>
                    <label htmlFor="postalCode">{language === 'am' ? 'የፖስታ ሳጥን ቁጥር (አስገዳጅ ያልሆነ)' : 'Postal Code (Optional)'}</label>
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
                  <label htmlFor="street">{t('checkout.street', 'Street Address & Residence')}</label>
                  <input
                    id="street"
                    name="street"
                    type="text"
                    required
                    placeholder={language === 'am' ? 'የመንገድ ስም፣ የቤት ቁጥር ወይም አቅራቢያ የሚገኝ ህንፃ' : 'e.g. Namibia St, House 42 / Behind Edna Mall'}
                    value={formData.street}
                    onChange={handleChange}
                  />
                </div>
                <div className={styles.buttonRow}>
                  <Button variant="ghost" size="md" onClick={prevStep}>← {t('common.back', 'Back')}</Button>
                  <Button variant="primary" size="md" onClick={nextStep}>
                    {language === 'am' ? 'ወደ ማጓጓዣ ምርጫ ቀጥል →' : 'Continue to Delivery Method →'}
                  </Button>
                </div>
              </div>
            )}

            {/* STEP 3: Delivery Options */}
            {step === 3 && (
              <div className={styles.fieldGroup}>
                <div>
                  <h2 className={styles.stepHeading}>{language === 'am' ? '3. የማጓጓዣ ዘዴ ይምረጡ' : '3. Delivery Method'}</h2>
                  <p className={styles.stepSubtext}>
                    {language === 'am' ? 'ለዚህ ትዕዛዝዎ የሚፈልጉትን የማጓጓዣ ፍጥነት ይምረጡ።' : 'Choose the dispatch carrier speed for your curated order.'}
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
                    <h4>{language === 'am' ? 'መደበኛ የመሬት ማጓጓዣ' : 'Standard Ground Delivery'}</h4>
                    <p>{language === 'am' ? 'ከ2 እስከ 3 የስራ ቀናት ውስጥ በአዲስ አበባ ወደ እርስዎ በር ይደርሳል።' : 'Delivered within 2–3 business days directly to your doorstep in Addis Ababa.'}</p>
                    <small style={{ color: 'var(--color-green)', fontWeight: 600 }}>
                      {language === 'am' ? 'የማጓጓዣ ዋጋ፡' : 'Rate:'} {config?.currency || 'ETB'} {baseShipping.toFixed(2)}
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
                    <h4>{language === 'am' ? '✦ የኢትዮጵያ አየር መንገድ ካርጎ ፈጣን በረራ' : '✦ Priority Flightway Cargo (Ethiopian Airlines)'}</h4>
                    <p>{language === 'am' ? 'በቀጣዩ ቀን የሚላክ፣ ፈጣን የመከታተያ ቁጥር ያለው ዓለም አቀፍ የበረራ ካርጎ።' : 'Next-day priority dispatch with live cargo bill tracking number and signature confirmation.'}</p>
                    <small style={{ color: 'var(--color-gold)', fontWeight: 700 }}>
                      {language === 'am' ? 'የማጓጓዣ ዋጋ፡' : 'Rate:'} {config?.currency || 'ETB'} {(baseShipping + 120).toFixed(2)} {language === 'am' ? '(+120 ብር የፈጣን በረራ ጭማሪ)' : '(+ETB 120 priority charge)'}
                    </small>
                  </div>
                </label>

                <div className={styles.buttonRow}>
                  <Button variant="ghost" size="md" onClick={prevStep}>← {t('common.back', 'Back')}</Button>
                  <Button variant="primary" size="md" onClick={nextStep}>
                    {language === 'am' ? 'ወደ ክፍያ ምርጫ ቀጥል →' : 'Continue to Payment →'}
                  </Button>
                </div>
              </div>
            )}

            {/* STEP 4: Payment Selection */}
            {step === 4 && (
              <div className={styles.fieldGroup}>
                <div>
                  <h2 className={styles.stepHeading}>{language === 'am' ? '4. የክፍያ ዘዴ ይምረጡ' : '4. Select Payment Method'}</h2>
                  <p className={styles.stepSubtext}>
                    {language === 'am' ? 'ሁሉም ክፍያዎች ደህንነታቸው በተጠበቀ እና በተረጋገጡ የክፍያ ኔትወርኮች ይስተናገዳሉ።' : 'Transactions are encrypted and processed through compliant financial gateways.'}
                  </p>
                </div>

                {/* Chapa Payment Gateway (All Ethiopian Banks, Telebirr & Cards) */}
                <label
                  className={`${styles.optionCard} ${
                    formData.paymentMethod === 'chapa' ? styles.optionSelected : ''
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="chapa"
                    checked={formData.paymentMethod === 'chapa'}
                    onChange={handleChange}
                  />
                  <div className={styles.optionInfo}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.25rem' }}>
                      <h4 style={{ margin: 0 }}>{language === 'am' ? 'ቻፓ - Chapa (ቴሌብር፣ ንግድ ባንክ፣ አዋሽ፣ ካርድ)' : 'Chapa Gateway (Telebirr, CBE Birr, Awash, Cards)'}</h4>
                      <Badge variant="gold" size="sm">{language === 'am' ? '★ ተመራጭ' : '★ Recommended'}</Badge>
                    </div>
                    <p>{language === 'am' ? 'በቴሌብር፣ በኢትዮጵያ ንግድ ባንክ (CBE Birr)፣ በአዋሽ ባንክ ወይም በቪዛ/ማስተርካርድ በቻፓ በኩል ይክፈሉ።' : 'Unified Ethiopian payment gateway: Telebirr, CBE Birr, Awash Birr, and international cards.'}</p>
                  </div>
                </label>

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
                      <h4>{t('checkout.pay_telebirr', 'Telebirr Digital Wallet')}</h4>
                      <p>{language === 'am' ? 'በኢትዮ ቴሌኮም ቴሌብር አፕሊኬሽን ወይም በUSSD ፈጣን ክፍያ።' : 'Instant mobile payment via Ethio Telecom Telebirr app or USSD prompt.'}</p>
                      <Badge variant="gold" size="sm">{language === 'am' ? 'በኢትዮጵያ ተመራጭ' : 'Recommended in Ethiopia'}</Badge>
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
                      <h4>{t('checkout.pay_card', 'International Card (Visa / Mastercard)')}</h4>
                      <p>{language === 'am' ? 'በዓለም አቀፍ ቪዛ እና ማስተርካርድ በStripe አስተማማኝ ክፍያ።' : 'Secure global card checkout powered by Stripe encrypted checkout.'}</p>
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
                      <p>{language === 'am' ? 'በፔይፓል አካውንትዎ ቀጥታ ይክፈሉ።' : 'Pay with your PayPal balance or connected bank account.'}</p>
                    </div>
                  </label>
                )}

                <div className={styles.buttonRow}>
                  <Button variant="ghost" size="md" onClick={prevStep}>← {t('common.back', 'Back')}</Button>
                  <Button variant="primary" size="md" onClick={nextStep}>
                    {language === 'am' ? 'ትዕዛዝዎን ይመርምሩ →' : 'Review Order →'}
                  </Button>
                </div>
              </div>
            )}

            {/* STEP 5: Final Review & Confirmation */}
            {step === 5 && (
              <div className={styles.fieldGroup}>
                <div>
                  <h2 className={styles.stepHeading}>{language === 'am' ? '5. ትዕዛዙን ይመርምሩና ያረጋግጡ' : '5. Review & Confirm Order'}</h2>
                  <p className={styles.stepSubtext}>
                    {language === 'am' ? 'እባክዎ ትዕዛዝዎን ከማጠናቀቅዎ በፊት መረጃዎን በትክክል ይፈትሹ።' : 'Please review your delivery details and order pieces before finalizing.'}
                  </p>
                </div>

                <div className={styles.reviewSection}>
                  <h4>{language === 'am' ? 'ተቀባይ እና አድራሻ' : 'Recipient & Contact'}</h4>
                  <p><strong>{formData.fullName}</strong></p>
                  <p>{formData.email} • {formData.phone}</p>
                </div>

                <div className={styles.reviewSection}>
                  <h4>{t('checkout.shipping_address', 'Delivery Address')}</h4>
                  <p>{formData.street}</p>
                  <p>{formData.city}, {formData.region}, {formData.country} {formData.postalCode}</p>
                  <p style={{ marginTop: '0.4rem', color: 'var(--color-green)', fontWeight: 600 }}>
                    {language === 'am' ? 'የማጓጓዣ ዘዴ፡' : 'Method:'} {formData.deliveryMethod === 'express_cargo' ? (language === 'am' ? 'የኢትዮጵያ አየር መንገድ ካርጎ' : 'Priority Flightway Cargo') : (language === 'am' ? 'መደበኛ የመሬት ማጓጓዣ' : 'Standard Ground')}
                  </p>
                </div>

                <div className={styles.reviewSection}>
                  <h4>{t('checkout.payment_method', 'Payment Choice')}</h4>
                  <p style={{ textTransform: 'capitalize' }}>
                    <strong>{formData.paymentMethod}</strong> {language === 'am' ? 'ክፍያ' : 'payment'}
                  </p>
                </div>

                <div className={styles.buttonRow}>
                  <Button variant="ghost" size="md" onClick={prevStep}>← {language === 'am' ? 'መረጃ አሻሽል' : 'Modify Details'}</Button>
                  <Button
                    variant="primary"
                    size="lg"
                    loading={loading}
                    disabled={!items.length}
                    onClick={handlePlaceOrder}
                  >
                    {language === 'am'
                      ? `ትዕዛዙን አረጋግጥና ላክ (${config?.currency || 'ብር'} ${grandTotal.toFixed(2)}) →`
                      : `Place Order & Confirm (${config?.currency || 'ETB'} ${grandTotal.toFixed(2)}) →`}
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Sticky Order Summary Sidebar */}
          <aside className={styles.summary}>
            <h3>{t('cart.order_summary', 'Order Summary')} ({items.length} {language === 'am' ? 'ቅርሶች' : 'items'})</h3>
            <div className={styles.itemsList}>
              {items.map((item) => (
                <div key={item._id} className={styles.summaryItem}>
                  <span>{item.name} × {item.quantity}</span>
                  <strong>{config?.currency || 'ETB'} {(Number(item.price) * item.quantity).toFixed(2)}</strong>
                </div>
              ))}
            </div>

            <div className={styles.costRow}>
              <span>{t('cart.subtotal', 'Subtotal')}:</span>
              <span>{config?.currency || 'ETB'} {total.toFixed(2)}</span>
            </div>

            <div className={styles.costRow}>
              <span>{t('cart.shipping', 'Carrier Shipping')}:</span>
              <span>{config?.currency || 'ETB'} {shipping.toFixed(2)}</span>
            </div>

            <div className={styles.totalRow}>
              <span>{t('cart.total', 'Total')}:</span>
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
