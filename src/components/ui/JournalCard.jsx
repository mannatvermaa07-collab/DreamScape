import { useState } from 'react';
import { ArrowRight, Edit3, Trash2 } from 'lucide-react';
import { MOOD_META } from './journalMoods';
import styles from '../../styles/JournalCard.module.css';

export function JournalCard({ entry, index = 0, onClick, onEdit, onDelete }) {
  const { id, title, content, mood, date, time } = entry;
  const meta = MOOD_META[mood] || MOOD_META.Neutral;
  const Icon = meta.icon;
  const [removing, setRemoving] = useState(false);

  const handleDelete = (e) => {
    e.stopPropagation();
    if (removing) return;
    setRemoving(true);
    // Let the shrink/fade play out before it actually leaves the list.
    setTimeout(() => onDelete && onDelete(id), 220);
  };

  return (
    <div
      className={`${styles.card} ${removing ? styles.cardRemoving : ''}`}
      style={{
        '--mood-color': meta.color,
        animationDelay: `${Math.min(index, 12) * 45}ms`
      }}
      onClick={() => !removing && onClick && onClick(entry)}
    >
      <div className={styles.header}>
        <span className={styles.dateInfo}>{date} · {time}</span>
        <span
          className={styles.moodChip}
          style={{ backgroundColor: `${meta.color}22`, borderColor: `${meta.color}55`, color: meta.color }}
        >
          <Icon size={12} /> {meta.label}
        </span>
      </div>

      <h4 className={styles.title}>{title}</h4>
      <p className={styles.snippet}>{content}</p>

      <div className={styles.footer}>
        <span className={styles.readMore}>
          Read entry <ArrowRight size={12} />
        </span>
        <div className={styles.actions} onClick={(e) => e.stopPropagation()}>
          {onEdit && (
            <button className={styles.iconBtn} onClick={() => onEdit(entry)} title="Edit entry">
              <Edit3 size={14} />
            </button>
          )}
          {onDelete && (
            <button className={`${styles.iconBtn} ${styles.delete}`} onClick={handleDelete} title="Delete entry">
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}