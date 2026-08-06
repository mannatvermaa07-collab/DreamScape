import { Check, Calendar, Edit3, Trash2 } from 'lucide-react';
import { ProgressBar } from './ProgressBar';
import styles from '../../styles/GoalCard.module.css';

export function GoalCard({ goal, onToggle, onEdit, onDelete }) {
  const { id, title, description, category, progress, targetDate, completed } = goal;

  return (
    <div className={`${styles.card} ${completed ? styles.completedCard : ''}`}>
      <div className={styles.header}>
        <button
          className={`${styles.checkbox} ${completed ? styles.checked : ''}`}
          onClick={() => onToggle(id)}
          aria-label={completed ? 'Mark incomplete' : 'Mark complete'}
        >
          {completed && <Check size={14} strokeWidth={3} />}
        </button>

        <div className={styles.mainInfo}>
          <div className={styles.titleRow}>
            <h4 className={`${styles.title} ${completed ? styles.completedTitle : ''}`}>
              {title}
            </h4>
            <div className={styles.actions}>
              {onEdit && (
                <button className={styles.iconBtn} onClick={() => onEdit(goal)} title="Edit Goal">
                  <Edit3 size={14} />
                </button>
              )}
              {onDelete && (
                <button className={`${styles.iconBtn} ${styles.delete}`} onClick={() => onDelete(id)} title="Delete Goal">
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          </div>
          {description && <p className={styles.description}>{description}</p>}
        </div>
      </div>

      <div className={styles.metaRow}>
        <div className={styles.tags}>
          <span className={styles.badge}>{category}</span>
        </div>
        <div className={styles.datePill}>
          <Calendar size={12} />
          <span>{targetDate}</span>
        </div>
      </div>

      <div className={styles.progressSection}>
        <div className={styles.progressText}>
          <span>Progress</span>
          <span>{progress}%</span>
        </div>
        <ProgressBar value={progress} />
      </div>
    </div>
  );
}
