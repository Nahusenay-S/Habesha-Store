import React, { useState } from 'react';
import Head from 'next/head';
import Header from '../components/Header';
import Footer from '../components/Footer';
import styles from '../styles/help.module.css';
import Icon from '../components/Icon';

const questions = [
  ['How do I track my order via Ethiopian Airlines Cargo?', 'Your tracking link is available from Order History as soon as your artisan dispatches the piece.'],
  ['Can I pay using CBE Birr or Telebirr?', 'Yes. Choose your preferred local payment method during checkout.'],
  ['What is the Artisan Verification process?', 'Every seller is reviewed for provenance, quality, and responsible production before joining the marketplace.'],
  ['How do returns work for international orders?', 'Contact support within seven days of delivery and we will guide you through the return process.'],
];

export default function HelpPage() {
  const [open, setOpen] = useState(null);
  return (
    <>
      <Head><title>Help Center - Habesha Modern</title></Head>
      <Header />
      <main className={styles.container}>
        <section className={styles.hero}><h1>How can we help you today?</h1><input placeholder="Search for tracking, payments, or authenticity..." /><div><span>Popular: Shipping status</span><span>Telebirr help</span><span>Return policy</span></div></section>
        <section className={styles.cards}>{[['truck', 'Shipping & Delivery', 'Global logistics powered by Ethiopian Airlines Cargo for authentic delivery.'], ['check', 'Payments', 'Secure transactions via Telebirr and CBE Birr localized for Ethiopia.'], ['edit', 'Vendor Policies', 'Terms of service for our artisans and high-end vendor requirements.'], ['heart', 'Artisan Authenticity', 'Ensuring every textile and spice is ethically sourced and verified.']].map(([icon, title, copy]) => <article key={title}><b><Icon name={icon} /></b><h2>{title}</h2><p>{copy}</p><a href="#faq">Learn more →</a></article>)}</section>
        <section className={styles.faq} id="faq"><h2>Frequently Asked Questions</h2><p>Quick answers to common questions from our community.</p>{questions.map(([question, answer], index) => <button type="button" key={question} onClick={() => setOpen(open === index ? null : index)}><strong>{question}</strong><span>⌄</span>{open === index && <small>{answer}</small>}</button>)}</section>
        <section className={styles.contact}><h2>Still need assistance?</h2><p>Our support team is available 24/7 to help with your modern Habesha experience.</p><a href="mailto:support@habeshastore.test">✉ &nbsp; Email Support</a></section>
      </main>
      <Footer />
    </>
  );
}
