import React from 'react';
import Link from 'next/link';
import Button from './Button';
import styles from './EmptyState.module.css';

const EmptyState = ({
  icon = '🏺',
  title = 'No items found',
  description = 'There are currently no items to display in this view.',
  actionLabel = null,
  actionHref = null,
  onAction = null,
}) => {
  return (
    <div className={styles.container}>
      <div className={styles.iconCircle}>
        <span className={styles.icon}>{icon}</span>
      </div>
      <h3 className={styles.title}>{title}</h3>
      <p className={styles.description}>{description}</p>
      {(actionLabel && (actionHref || onAction)) && (
        <div className={styles.actionWrapper}>
          {actionHref ? (
            <Link href={actionHref}>
              <Button variant="primary" size="md">
                {actionLabel}
              </Button>
            </Link>
          ) : (
            <Button variant="primary" size="md" onClick={onAction}>
              {actionLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default EmptyState;

