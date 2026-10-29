import React from 'react';
import styles from './LoadingScreen.module.css';

const LoadingScreen = ({ label = 'Loading...', compact = false }) => (
  <div className={compact ? styles.compactWrap : styles.fullWrap} role="status" aria-live="polite" aria-busy="true">
    <div className={styles.loaderCard}>
      <div className={styles.spinner} aria-hidden="true" />
      <span className={styles.brand}>Habesha</span>
      <p>{label}</p>
    </div>
  </div>
);

export default LoadingScreen;
