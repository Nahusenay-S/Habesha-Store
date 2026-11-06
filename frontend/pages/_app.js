import React from 'react';
import Head from 'next/head';
import { AuthProvider } from '../context/AuthContext';
import { LanguageProvider } from '../context/LanguageContext';
import '../styles/globals.css';

function MyApp({ Component, pageProps }) {
  return (
    <LanguageProvider>
      <AuthProvider>
        <Head>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>Habesha Store | Authentic Ethiopian Heritage & Craftsmanship</title>
        </Head>
        <Component {...pageProps} />
      </AuthProvider>
    </LanguageProvider>
  );
}

export default MyApp;
