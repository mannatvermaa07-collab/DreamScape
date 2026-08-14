import { useMemo, useState } from 'react';
import { MOOD_META, MOOD_LIST } from './journalMoods';
import styles from '../../styles/JournalHeatmap.module.css';

function toDateKey(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// Averages the mood "position" (0=Great...4=Very Bad) across a day's
// entries, rounded to the nearest actual mood — so multiple entries in a
// day blend toward a representative color, GitHub-intensity-style.
function avgMoodForDay(moods) {
  const indices = moods.map((m) => MOOD_LIST.indexOf(m)).filter((i) => i >= 0);
  if (indices.length === 0) return null;
  const avg = indices.reduce((a, b) => a + b, 0) / indices.length;
  const idx = Math.round(avg);
  return MOOD_LIST[Math.min(Math.max(idx, 0), MOOD_LIST.length - 1)];
}

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function JournalHeatmap({ entries }) {
  const [hoveredDay, setHoveredDay] = useState(null);

  const moodsByDate = useMemo(() => {
    const map = {};
    for (const e of entries) {
      if (!e.date) continue;
      if (!map[e.date]) map[e.date] = [];
      map[e.date].push(e.mood);
    }
    return map;
  }, [entries]);

  // 53 weeks back from today, Sunday-aligned — classic GitHub layout.
  const weeks = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(today);
    endOfWeek.setDate(today.getDate() + (6 - today.getDay()));
    const start = new Date(endOfWeek);
    start.setDate(endOfWeek.getDate() - 7 * 52 - 6);

    const cols = [];
    const cursor = new Date(start);
    for (let w = 0; w < 53; w++) {
      const days = [];
      for (let d = 0; d < 7; d++) {
        const dateKey = toDateKey(cursor);
        const isFuture = cursor > today;
        days.push({
          dateKey,
          date: new Date(cursor),
          isFuture,
          mood: isFuture ? null : avgMoodForDay(moodsByDate[dateKey] || []),
          count: (moodsByDate[dateKey] || []).length
        });
        cursor.setDate(cursor.getDate() + 1);
      }
      cols.push(days);
    }
    return cols;
  }, [moodsByDate]);

  const monthMarkers = useMemo(() => {
    const markers = [];
    let lastMonth = null;
    weeks.forEach((week, wi) => {
      const m = week[0].date.getMonth();
      if (m !== lastMonth) {
        markers.push({ weekIndex: wi, label: MONTH_LABELS[m] });
        lastMonth = m;
      }
    });
    return markers;
  }, [weeks]);

  return (
    <div className={styles.heatmapWrap}>
      <div className={styles.heatmapScroll}>
        <div className={styles.monthRow} style={{ gridTemplateColumns: `repeat(${weeks.length}, 12px)` }}>
          {weeks.map((_, wi) => {
            const marker = monthMarkers.find((m) => m.weekIndex === wi);
            return <span key={wi} className={styles.monthLabel}>{marker ? marker.label : ''}</span>;
          })}
        </div>

        <div className={styles.heatmapGrid} style={{ gridTemplateColumns: `repeat(${weeks.length}, 12px)` }}>
          {weeks.map((week, wi) => (
            <div key={wi} className={styles.heatmapCol}>
              {week.map((day) => {
                const meta = day.mood ? MOOD_META[day.mood] : null;
                return (
                  <div
                    key={day.dateKey}
                    className={styles.heatmapCell}
                    style={{
                      backgroundColor: day.isFuture ? 'transparent' : (meta ? meta.color : 'var(--bg-input)'),
                      opacity: day.isFuture ? 0 : (meta ? 1 : 0.5)
                    }}
                    onMouseEnter={() => !day.isFuture && setHoveredDay(day)}
                    onMouseLeave={() => setHoveredDay(null)}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <div className={styles.heatmapFooter}>
        <div className={styles.heatmapLegend}>
          {MOOD_LIST.map((m) => (
            <span key={m} className={styles.legendItem}>
              <span className={styles.legendDot} style={{ backgroundColor: MOOD_META[m].color }} />
              {MOOD_META[m].label}
            </span>
          ))}
        </div>

        <div className={styles.heatmapTooltip}>
          {hoveredDay
            ? hoveredDay.count > 0
              ? `${hoveredDay.mood} · ${hoveredDay.count} ${hoveredDay.count === 1 ? 'entry' : 'entries'} on ${hoveredDay.dateKey}`
              : `No entries on ${hoveredDay.dateKey}`
            : 'Hover a day to see its mood'}
        </div>
      </div>
    </div>
  );
}