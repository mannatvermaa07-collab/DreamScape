import { useMood } from '../../hooks/useMood';
import styles from '../../styles/MoodTracker.module.css';

const MOOD_OPTIONS = [
  { level: 5, label: 'Great', emoji: '⚡' },
  { level: 4, label: 'Good', emoji: '✨' },
  { level: 3, label: 'Neutral', emoji: '🌤️' },
  { level: 2, label: 'Low', emoji: '🌧️' },
  { level: 1, label: 'Down', emoji: '🔋' }
];

export function MoodTracker() {
  const { todayMood, setTodayMood } = useMood();

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <h4 className={styles.title}>Daily Mood & Energy</h4>
        <span className={styles.statusText}>
          {todayMood ? `Logged: ${todayMood.mood}` : 'How are you feeling today?'}
        </span>
      </div>

      <div className={styles.moodGrid}>
        {MOOD_OPTIONS.map((item) => {
          const isActive = todayMood && todayMood.level === item.level;
          return (
            <button
              key={item.level}
              className={`${styles.moodBtn} ${isActive ? styles.activeMood : ''}`}
              onClick={() => setTodayMood(item.label, item.level)}
              aria-label={`Set mood to ${item.label}`}
            >
              <span className={styles.emoji}>{item.emoji}</span>
              <span className={styles.label}>{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
