import { NavLink, useNavigate } from 'react-router-dom';
import { Settings as SettingsIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useUserStore } from '../../hooks/useUserStore';
import styles from '../../styles/Sidebar.module.css';

export function Sidebar({ isOpen, onClose, isCollapsed, onToggleCollapse }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const store = useUserStore();

  const userName = user?.name || 'User';
  const userInitial = userName.charAt(0).toUpperCase();

  // Quick stats
  const taskCount = (store.tasks || []).length;
  const habitCount = (store.habits || []).length;
  const noteCount = (store.journals || []).length;

  // Today's date
  const today = new Date();
  const dateStr = today.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric'
  });

  // Greeting based on time
  const hour = today.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <aside
      className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : ''} ${
        isCollapsed ? styles.collapsedSidebar : ''
      }`}
    >
      <div className={styles.sidebarTop}>
        {/* Profile Section */}
        {!isCollapsed ? (
          <div className={styles.profileSection}>
            <div
              className={styles.profileCard}
              onClick={() => navigate('/app/settings')}
              title="Account Settings"
            >
              {user?.avatar ? (
                <img src={user.avatar} alt={userName} className={styles.avatar} />
              ) : (
                <div className={styles.avatarFallback}>{userInitial}</div>
              )}
              <div className={styles.profileInfo}>
                <span className={styles.profileGreeting}>{greeting},</span>
                <span className={styles.profileName}>{userName}</span>
              </div>
            </div>
            <span className={styles.dateLabel}>{dateStr}</span>
          </div>
        ) : (
          <div
            className={styles.avatarCollapsed}
            onClick={() => navigate('/app/settings')}
            title="Account Settings"
          >
            {user?.avatar ? (
              <img src={user.avatar} alt={userName} className={styles.avatar} />
            ) : (
              <div className={styles.avatarFallback}>{userInitial}</div>
            )}
          </div>
        )}

        {/* Quick Stats */}
        {!isCollapsed && (
          <div className={styles.statsRow}>
            <div className={styles.statPill}>
              <span className={styles.statNum}>{taskCount}</span>
              <span className={styles.statText}>tasks</span>
            </div>
            <span className={styles.statDot}>·</span>
            <div className={styles.statPill}>
              <span className={styles.statNum}>{habitCount}</span>
              <span className={styles.statText}>habits</span>
            </div>
            <span className={styles.statDot}>·</span>
            <div className={styles.statPill}>
              <span className={styles.statNum}>{noteCount}</span>
              <span className={styles.statText}>notes</span>
            </div>
          </div>
        )}
      </div>

      {/* Bottom: Collapse toggle + Settings */}
      <div className={styles.sidebarBottom}>
        <button
          className={styles.collapseBtn}
          onClick={onToggleCollapse}
          title={isCollapsed ? 'Expand' : 'Collapse'}
        >
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          {!isCollapsed && <span>Collapse</span>}
        </button>

        <NavLink
          to="/app/settings"
          className={({ isActive }) =>
            `${styles.settingsLink} ${isActive ? styles.activeNavItem : ''}`
          }
          onClick={() => {
            if (onClose) onClose();
          }}
          title={isCollapsed ? 'Settings' : undefined}
        >
          <SettingsIcon size={18} />
          {!isCollapsed && <span>Settings</span>}
        </NavLink>
      </div>
    </aside>
  );
}
