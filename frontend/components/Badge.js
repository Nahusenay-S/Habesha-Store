import React from 'react';
import styles from './Badge.module.css';

const Badge = ({
  children,
  variant = 'default',
  size = 'md',
  className = '',
}) => {
  const variantClass = styles[variant] || styles.default;
  const sizeClass = styles[size] || styles.md;

  return (
    <span className={`${styles.badge} ${variantClass} ${sizeClass} ${className}`}>
      {children}
    </span>
  );
};

export default Badge;

