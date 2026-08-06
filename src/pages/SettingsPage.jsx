import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Moon, Sun, User, LogOut, Save, Check, Clock } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { useUserStore } from '../hooks/useUserStore';
import { UserAvatar } from '../components/ui/UserAvatar';
import { Button } from '../components/ui/Button';
import styles from '../styles/SettingsPage.module.css';

export function SettingsPage() {
  const navigate = useNavigate();
  const { user, updateAccountInfo, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const store = useUserStore();

  const [account, setAccount] = useState({
    name: user?.name || '',
    age: user?.age || '',
    email: user?.email || ''
  });

  const [timeline, setTimeline] = useState({
    start: user?.settings?.timelineStart || '07:00',
    end: user?.settings?.timelineEnd || '22:00'
  });

  useEffect(() => {
    if (user) {
      setAccount({
        name: user.name || '',
        age: user.age || '',
        email: user.email || ''
      });
      setTimeline({
        start: user.settings?.timelineStart || '07:00',
        end: user.settings?.timelineEnd || '22:00'
      });
    }
  }, [user]);

  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleAccountSave = (e) => {
    e.preventDefault();
    updateAccountInfo(account.name, account.age, account.email);
    if (store.updateSettings) {
      store.updateSettings({
        timelineStart: timeline.start,
        timelineEnd: timeline.end
      });
    }
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className={styles.container}>
      {/* Account Profile Header with First-Letter User Avatar Badge */}
      <div className={styles.sectionCard} style={{ flexDirection: 'row', alignItems: 'center', gap: '20px' }}>
        <UserAvatar name={user?.name || 'User'} size="lg" />
        <div>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '20px', fontWeight: 700, color: 'var(--text-main)' }}>
            {user?.name || 'User'}
          </h2>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            {user?.email} • {user?.age ? `${user.age} years old` : 'Active Member'}
          </span>
        </div>
      </div>

      {/* Theme Switcher */}
      <div className={styles.sectionCard}>
        <div className={styles.sectionHeader}>
          <Moon size={16} />
          <h3 className={styles.sectionTitle}>Theme</h3>
        </div>

        <div className={styles.themeRow}>
          <button
            className={`${styles.themeBtn} ${theme === 'dark' ? styles.activeTheme : ''}`}
            onClick={() => setTheme('dark')}
          >
            <Moon size={16} />
            <span>Dark</span>
          </button>

          <button
            className={`${styles.themeBtn} ${theme === 'light' ? styles.activeTheme : ''}`}
            onClick={() => setTheme('light')}
          >
            <Sun size={16} />
            <span>Light</span>
          </button>
        </div>
      </div>

      {/* Active Work Timeline Range Selector */}
      <div className={styles.sectionCard}>
        <div className={styles.sectionHeader}>
          <Clock size={16} />
          <h3 className={styles.sectionTitle}>Active Work Timeline Range</h3>
        </div>

        <div className={styles.formGrid}>
          <div className={styles.field}>
            <label className={styles.label}>Timeline Start Time</label>
            <select
              value={timeline.start}
              onChange={(e) => setTimeline({ ...timeline, start: e.target.value })}
              className={styles.input}
            >
              <option value="05:00">05:00 AM</option>
              <option value="06:00">06:00 AM</option>
              <option value="07:00">07:00 AM</option>
              <option value="08:00">08:00 AM</option>
              <option value="09:00">09:00 AM</option>
            </select>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Timeline End Time</label>
            <select
              value={timeline.end}
              onChange={(e) => setTimeline({ ...timeline, end: e.target.value })}
              className={styles.input}
            >
              <option value="17:00">05:00 PM (17:00)</option>
              <option value="18:00">06:00 PM (18:00)</option>
              <option value="20:00">08:00 PM (20:00)</option>
              <option value="22:00">10:00 PM (22:00)</option>
              <option value="23:00">11:00 PM (23:00)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Account Information */}
      <div className={styles.sectionCard}>
        <div className={styles.sectionHeader}>
          <User size={16} />
          <h3 className={styles.sectionTitle}>Account Information</h3>
        </div>

        <form onSubmit={handleAccountSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className={styles.formGrid}>
            <div className={styles.field}>
              <label className={styles.label}>Name</label>
              <input
                type="text"
                value={account.name}
                onChange={(e) => setAccount({ ...account, name: e.target.value })}
                className={styles.input}
                placeholder="Enter your name"
                required
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Age</label>
              <input
                type="number"
                value={account.age}
                onChange={(e) => setAccount({ ...account, age: e.target.value })}
                className={styles.input}
                placeholder="Enter your age"
                min="10"
                max="120"
                required
              />
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Email</label>
            <input
              type="email"
              value={account.email}
              onChange={(e) => setAccount({ ...account, email: e.target.value })}
              className={styles.input}
              required
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px' }}>
            <Button type="submit" variant="primary" icon={savedSuccess ? Check : Save}>
              {savedSuccess ? 'Saved' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </div>

      {/* Logout */}
      <div className={styles.sectionCard}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-main)' }}>
            Sign Out
          </span>
          <Button variant="danger" icon={LogOut} onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </div>
    </div>
  );
}
