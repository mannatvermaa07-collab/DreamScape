import { Flame, Check, Edit3, Trash2 } from 'lucide-react';
import styles from '../../styles/HabitCard.module.css';

const DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export function HabitCard({ habit, onToggleDay, onEdit, onDelete }) {
  const { id, title, category, streak, bestStreak, completedDays } = habit;

  return (
    <div className={styles.card}>
      <div className={styles.topRow}>
        <div className={styles.info}>
          <h4 className={styles.title}>{title}</h4>
          <span className={styles.categoryTag}>{category}</span>
        </div>
        <div className={styles.streakBadge} title={`Current Streak: ${streak || 0} days`}>
          <Flame size={14} />
          <span>{streak || 0}d</span>
        </div>
      </div>

      <div className={styles.weekGrid}>
        {DAYS.map((dayLabel, index) => {
          const isDone = completedDays[index];
          return (
            <div key={index} className={styles.dayCol}>
              <span className={styles.dayLabel}>{dayLabel}</span>
              <button
                className={`${styles.dayDot} ${isDone ? styles.dayDotActive : ''}`}
                onClick={() => onToggleDay(id, index)}
                aria-label={`Toggle ${dayLabel}`}
              >
                <Check size={14} strokeWidth={3} />
              </button>
            </div>
          );
        })}
      </div>

      <div className={styles.footerRow}>
        <span>Best Streak: {bestStreak || 0} days</span>
        <div className={styles.actions}>
          {onEdit && (
            <button className={styles.iconBtn} onClick={() => onEdit(habit)} title="Edit Habit">
              <Edit3 size={14} />
            </button>
          )}
          {onDelete && (
            <button className={`${styles.iconBtn} ${styles.delete}`} onClick={() => onDelete(id)} title="Delete Habit">
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
