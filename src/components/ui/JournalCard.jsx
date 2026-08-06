import { Calendar, ArrowRight, Edit3, Trash2 } from 'lucide-react';
import styles from '../../styles/JournalCard.module.css';

export function JournalCard({ entry, onClick, onEdit, onDelete }) {
  const { id, title, content, mood, category, date, time } = entry;

  return (
    <div className={styles.card} onClick={() => onClick && onClick(entry)}>
      <div className={styles.header}>
        <div className={styles.dateInfo}>
          <Calendar size={12} />
          <span>{date} • {time}</span>
        </div>
        <div className={styles.badges}>
          <span className={styles.moodTag}>{mood}</span>
          <span className={styles.categoryBadge}>{category}</span>
        </div>
      </div>

      <h4 className={styles.title}>{title}</h4>
      <p className={styles.snippet}>{content}</p>

      <div className={styles.footer}>
        <span className={styles.readMore}>
          Read Entry <ArrowRight size={12} />
        </span>
        <div className={styles.actions} onClick={(e) => e.stopPropagation()}>
          {onEdit && (
            <button className={styles.iconBtn} onClick={() => onEdit(entry)} title="Edit Entry">
              <Edit3 size={14} />
            </button>
          )}
          {onDelete && (
            <button className={`${styles.iconBtn} ${styles.delete}`} onClick={() => onDelete(id)} title="Delete Entry">
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
