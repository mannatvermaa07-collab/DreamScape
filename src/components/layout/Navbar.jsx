import { useNavigate } from 'react-router-dom';
import { Menu, Moon, Sun } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import styles from '../../styles/Navbar.module.css';

export function Navbar({ onToggleSidebar }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const currentHour = new Date().getHours();
  const greetingTime =
    currentHour < 12
      ? 'Good morning'
      : currentHour < 18
      ? 'Good afternoon'
      : 'Good evening';

  const userName = user?.name || 'User';

  return (
    <header className={styles.navbar}>
      <div className={styles.leftSection}>
        <button className={styles.menuBtn} onClick={onToggleSidebar} aria-label="Toggle menu">
          <Menu size={20} />
        </button>

        <span className={styles.greetingNavbarText}>
          {greetingTime}, {userName}
        </span>
      </div>

      <div className={styles.rightSection}>

        {/* Theme Switcher Button */}
        <button className={styles.themeToggleBtn} onClick={toggleTheme} title="Toggle Theme">
          {theme === 'dark' ? <Moon size={14} /> : <Sun size={14} />}
          <span>{theme === 'dark' ? 'Dark' : 'Light'}</span>
        </button>

        {user?.avatar ? (
          <img
            src={user.avatar}
            alt={user.name || 'User'}
            className={styles.profileAvatarBtn}
            onClick={() => navigate('/app/settings')}
            title="Account Settings"
          />
        ) : (
          <div
            className={styles.profileAvatarBtn}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: 'var(--primary)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '13px',
              cursor: 'pointer'
            }}
            onClick={() => navigate('/app/settings')}
          >
            {(user?.name || 'User').charAt(0).toUpperCase()}
          </div>
        )}
      </div>
    </header>
  );
}
