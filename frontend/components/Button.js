import React from 'react';
import styles from './Button.module.css';

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  onClick,
  type = 'button',
  icon = null,
  fullWidth = false,
  className = '',
  ...props
}) => {
  const variantClass = styles[variant] || styles.primary;
  const sizeClass = styles[size] || styles.md;
  const widthClass = fullWidth ? styles.fullWidth : '';

  return (
    <button
      type={type}
      className={`${styles.button} ${variantClass} ${sizeClass} ${widthClass} ${className}`}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {loading ? (
        <span className={styles.spinnerWrapper}>
          <span className={styles.spinner} />
          <span>Processing...</span>
        </span>
      ) : (
        <>
          {icon && <span className={styles.icon}>{icon}</span>}
          <span>{children}</span>
        </>
      )}
    </button>
  );
};

export default Button;

