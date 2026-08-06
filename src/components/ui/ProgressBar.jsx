import styles from '../../styles/ProgressBar.module.css';

export function ProgressBar({ value = 0, max = 100, variant = 'primary' }) {
  const percentage = Math.min(Math.max(0, (value / max) * 100), 100);
  const variantClass = percentage === 100 ? styles.success : styles[variant] || styles.primary;

  return (
    <div className={styles.track}>
      <div
        className={`${styles.fill} ${variantClass}`}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}
