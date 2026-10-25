import { Menu, Moon, Sun } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import styles from '../../styles/Navbar.module.css';

export function Navbar({ onToggleSidebar }) {
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
      </div>
    </header>
  );
}
