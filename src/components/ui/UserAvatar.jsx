import styles from '../../styles/UserAvatar.module.css';

export function UserAvatar({ name = 'User', size = 'md', onClick, className = '' }) {
  const safeName = (name || 'U').trim();
  const initial = safeName.charAt(0).toUpperCase() || 'U';

  return (
    <div
      className={`${styles.avatarBox} ${size === 'lg' ? styles.lg : ''} ${className}`}
      onClick={onClick}
      title={name || 'User Profile'}
    >
      {initial}
    </div>
  );
}
