import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import { MOOD_META } from './journalMoods';
import styles from '../../styles/JournalDeck.module.css';

// Card-deck browsing: one entry at a time, swipe/drag or arrow buttons to
// move between them, tap to flip and read the full entry.
export function JournalDeck({ entries, onEdit, onDelete }) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [dragX, setDragX] = useState(0);
  const [exiting, setExiting] = useState(null); // 'left' | 'right' | null
  const dragInfo = useRef(null);

  useEffect(() => {
    setIndex(0);
    setFlipped(false);
  }, [entries.length]);

  const goTo = (dir) => {
    if (dir === 1 && index >= entries.length - 1) return;
    if (dir === -1 && index <= 0) return;
    setExiting(dir === 1 ? 'left' : 'right');
    setTimeout(() => {
      setIndex((i) => i + dir);
      setExiting(null);
      setDragX(0);
      setFlipped(false);
    }, 220);
  };

  const handlePointerDown = (e) => {
    dragInfo.current = { startX: e.clientX, active: true };
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };
  const handlePointerMove = (e) => {
    if (!dragInfo.current?.active) return;
    setDragX(e.clientX - dragInfo.current.startX);
  };
  const handlePointerUp = () => {
    if (!dragInfo.current?.active) return;
    dragInfo.current.active = false;
    if (dragX > 90) goTo(-1);
    else if (dragX < -90) goTo(1);
    else setDragX(0);
  };

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'ArrowRight') goTo(1);
      if (e.key === 'ArrowLeft') goTo(-1);
      if (e.key === ' ') { e.preventDefault(); setFlipped((f) => !f); }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, entries.length]);

  if (entries.length === 0) return null;

  const entry = entries[index];
  const meta = MOOD_META[entry.mood] || MOOD_META.Neutral;
  const Icon = meta.icon;
  const nextPeek = entries[index + 1];

  return (
    <div className={styles.deckWrap}>
      <button type="button" className={styles.deckNavBtn} onClick={() => goTo(-1)} disabled={index <= 0} aria-label="Previous entry">
        <ChevronLeft size={18} />
      </button>

      <div className={styles.deckStage}>
        {nextPeek && (
          <div className={styles.deckPeekCard} style={{ '--mood-color': (MOOD_META[nextPeek.mood] || MOOD_META.Neutral).color }} />
        )}

        <div
          className={`${styles.deckCard} ${exiting ? styles[`exit${exiting === 'left' ? 'Left' : 'Right'}`] : ''} ${flipped ? styles.flipped : ''}`}
          style={{
            '--mood-color': meta.color,
            transform: !exiting ? `translateX(${dragX}px) rotate(${dragX / 24}deg)` : undefined
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          onClick={() => { if (Math.abs(dragX) < 4) setFlipped((f) => !f); }}
        >
          <div className={styles.deckCardInner}>
            <div className={styles.deckFace}>
              <div className={styles.deckHeader}>
                <span className={styles.deckDate}>{entry.date} · {entry.time}</span>
                <span className={styles.deckMoodChip} style={{ backgroundColor: `${meta.color}22`, borderColor: `${meta.color}55`, color: meta.color }}>
                  <Icon size={12} /> {meta.label}
                </span>
              </div>
              <h3 className={styles.deckTitle}>{entry.title}</h3>
              <p className={styles.deckSnippet}>{entry.content}</p>
              <span className={styles.deckFlipHint}><RotateCcw size={11} /> Tap to read</span>
            </div>

            <div className={`${styles.deckFace} ${styles.deckFaceBack}`}>
              <div className={styles.deckHeader}>
                <span className={styles.deckDate}>{entry.date} · {entry.time}</span>
                <span className={styles.deckMoodChip} style={{ backgroundColor: `${meta.color}22`, borderColor: `${meta.color}55`, color: meta.color }}>
                  <Icon size={12} /> {meta.label}
                </span>
              </div>
              <h3 className={styles.deckTitle}>{entry.title}</h3>
              <div className={styles.deckFullContent}>{entry.content}</div>
              <div className={styles.deckBackActions} onClick={(e) => e.stopPropagation()}>
                {onEdit && <button type="button" onClick={() => onEdit(entry)}>Edit</button>}
                {onDelete && <button type="button" className={styles.deckDeleteBtn} onClick={() => onDelete(entry.id)}>Delete</button>}
              </div>
            </div>
          </div>
        </div>
      </div>

      <button type="button" className={styles.deckNavBtn} onClick={() => goTo(1)} disabled={index >= entries.length - 1} aria-label="Next entry">
        <ChevronRight size={18} />
      </button>

      <div className={styles.deckCounter}>{index + 1} / {entries.length}</div>
    </div>
  );
}