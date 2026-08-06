import { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Target,
  BookOpen,
  Plus,
  StickyNote,
  CheckCircle,
  Clock
} from 'lucide-react';
import { useGoals } from '../hooks/useGoals';
import { useHabits } from '../hooks/useHabits';
import { useJournal } from '../hooks/useJournal';
import { useUserStore } from '../hooks/useUserStore';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import styles from '../styles/CalendarPage.module.css';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getLocalDateString(dateObj) {
  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, '0');
  const d = String(dateObj.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// Convert task dayOffset to an actual date string (YYYY-MM-DD)
// dayOffset is relative to the current week's Monday
function getTaskDateString(task) {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0=Sun, 1=Mon ... 6=Sat
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(today);
  monday.setDate(today.getDate() + mondayOffset);

  const taskDate = new Date(monday);
  taskDate.setDate(monday.getDate() + (task.dayOffset || 0));
  return getLocalDateString(taskDate);
}

export function CalendarPage() {
  const { goals } = useGoals();
  const { habits } = useHabits();
  const { entries } = useJournal();
  const store = useUserStore();
  const tasks = store.tasks || [];
  const [dayNotes, setDayNotes] = useLocalStorage('dreamscape_day_notes', {});

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDayDate, setSelectedDayDate] = useState(null);
  const [newNoteInput, setNewNoteInput] = useState('');

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthName = currentDate.toLocaleString('en-US', { month: 'long', year: 'numeric' });

  // Navigation handlers (Go back & forward in month)
  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Generate Month Days Grid
  const firstDayIndex = new Date(year, month, 1).getDay();
  const totalDaysInMonth = new Date(year, month + 1, 0).getDate();

  const calendarDays = [];
  // Prev month padding
  const prevMonthLastDate = new Date(year, month, 0).getDate();
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const d = new Date(year, month - 1, prevMonthLastDate - i);
    calendarDays.push({ date: d, isCurrentMonth: false });
  }
  // Current month
  for (let day = 1; day <= totalDaysInMonth; day++) {
    const d = new Date(year, month, day);
    calendarDays.push({ date: d, isCurrentMonth: true });
  }
  // Next month padding
  const remainingCells = 42 - calendarDays.length;
  for (let day = 1; day <= remainingCells; day++) {
    const d = new Date(year, month + 1, day);
    calendarDays.push({ date: d, isCurrentMonth: false });
  }

  // Get items for a date string (YYYY-MM-DD)
  const getItemsForDate = (dateObj) => {
    const dateStr = getLocalDateString(dateObj);
    const dateGoals = goals.filter((g) => g.targetDate === dateStr || (g.completed && dateStr === g.createdAt));
    const dateEntries = entries.filter((e) => e.date === dateStr);
    const dateTasks = tasks.filter((t) => getTaskDateString(t) === dateStr);
    const notesForDay = dayNotes[dateStr] || [];
    return { dateStr, goals: dateGoals, entries: dateEntries, tasks: dateTasks, notes: notesForDay };
  };

  const handleAddDayNote = (e) => {
    e.preventDefault();
    if (!newNoteInput.trim() || !selectedDayDate) return;
    const dateStr = getLocalDateString(selectedDayDate);
    const existing = dayNotes[dateStr] || [];
    setDayNotes({
      ...dayNotes,
      [dateStr]: [...existing, newNoteInput.trim()]
    });
    setNewNoteInput('');
  };

  const selectedDayItems = selectedDayDate ? getItemsForDate(selectedDayDate) : null;
  const todayStr = getLocalDateString(new Date());

  return (
    <div className={styles.container}>
      {/* Month Controls Bar */}
      <div className={styles.topControls}>
        <div className={styles.navGroup}>
          <h2 className={styles.monthTitle}>{monthName}</h2>
          <Button variant="outline" size="sm" onClick={prevMonth} icon={ChevronLeft} />
          <Button variant="outline" size="sm" onClick={goToToday}>Today</Button>
          <Button variant="outline" size="sm" onClick={nextMonth} icon={ChevronRight} />
        </div>
      </div>

      {/* Monthly View Grid */}
      <div className={styles.calendarGrid}>
        {WEEKDAYS.map((w) => (
          <div key={w} className={styles.weekdayHeader}>
            {w}
          </div>
        ))}

        {calendarDays.map((cell, idx) => {
          const { dateStr, goals: cellGoals, entries: cellEntries, tasks: cellTasks, notes: cellNotes } = getItemsForDate(cell.date);
          const isToday = dateStr === todayStr;
          const isFuture = cell.date > new Date(new Date().setHours(23, 59, 59, 999));

          return (
            <div
              key={idx}
              className={`${styles.dayCell} ${!cell.isCurrentMonth ? styles.otherMonthDay : ''} ${
                isToday ? styles.todayCell : ''
              }`}
              onClick={() => setSelectedDayDate(cell.date)}
            >
              <div className={styles.cellHeader}>
                <span className={`${styles.dayNum} ${isToday ? styles.todayNum : ''}`}>
                  {cell.date.getDate()}
                </span>
                {cellTasks.length > 0 && (
                  <span className={styles.taskCount}>{cellTasks.length}</span>
                )}
              </div>

              <div className={styles.badgeList}>
                {cellTasks.map((t) => (
                  <span
                    key={t.id}
                    className={`${styles.cellBadge} ${styles.taskBadge} ${t.completed ? styles.taskCompleted : ''}`}
                  >
                    {t.completed ? '✅' : '⏰'} {t.title}
                    <span className={styles.taskTime}>{t.startTime || t.time}</span>
                  </span>
                ))}
                {cellGoals.map((g) => (
                  <span key={g.id} className={`${styles.cellBadge} ${styles.goalBadge}`}>
                    🎯 {g.title}
                  </span>
                ))}
                {cellEntries.map((e) => (
                  <span key={e.id} className={`${styles.cellBadge} ${styles.journalBadge}`}>
                    📖 {e.title}
                  </span>
                ))}
                {cellNotes.map((n, i) => (
                  <span key={i} className={`${styles.cellBadge} ${styles.habitBadge}`}>
                    📝 {n}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Day Detail Modal */}
      <Modal
        isOpen={Boolean(selectedDayDate)}
        onClose={() => setSelectedDayDate(null)}
        title={selectedDayDate ? `Schedule details for ${selectedDayDate.toDateString()}` : ''}
      >
        {selectedDayItems && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Tasks for this day */}
            <div className={styles.modalSection}>
              <span className={styles.modalSecTitle}>
                <CheckCircle size={14} /> Scheduled Tasks
              </span>
              {selectedDayItems.tasks.length > 0 ? (
                selectedDayItems.tasks.map((t) => (
                  <div key={t.id} className={`${styles.modalItem} ${styles.modalTaskItem}`}>
                    <div className={styles.modalTaskHeader}>
                      <span className={`${styles.modalTaskStatus} ${t.completed ? styles.modalTaskDone : styles.modalTaskPending}`}>
                        {t.completed ? '✅ Done' : '⏳ Pending'}
                      </span>
                    </div>
                    <strong>{t.title}</strong>
                    <div className={styles.modalTaskMeta}>
                      <Clock size={11} />
                      <span>{t.startTime || t.time} — {t.endTime || ''}</span>
                      <span className={styles.modalTaskDuration}>{t.duration || '1h'}</span>
                    </div>
                  </div>
                ))
              ) : (
                <span style={{ fontSize: '12px', color: 'var(--text-dim)' }}>No tasks scheduled for this date.</span>
              )}
            </div>

            {/* Goals for this day */}
            <div className={styles.modalSection}>
              <span className={styles.modalSecTitle}>
                <Target size={14} /> Goal Milestones
              </span>
              {selectedDayItems.goals.length > 0 ? (
                selectedDayItems.goals.map((g) => (
                  <div key={g.id} className={styles.modalItem}>
                    <strong>{g.title}</strong> — {g.progress}% Complete ({g.category})
                  </div>
                ))
              ) : (
                <span style={{ fontSize: '12px', color: 'var(--text-dim)' }}>No goals scheduled for this date.</span>
              )}
            </div>

            {/* Journal Entries for this day */}
            <div className={styles.modalSection}>
              <span className={styles.modalSecTitle}>
                <BookOpen size={14} /> Reflections & Journal
              </span>
              {selectedDayItems.entries.length > 0 ? (
                selectedDayItems.entries.map((e) => (
                  <div key={e.id} className={styles.modalItem}>
                    <strong>{e.title}</strong> ({e.mood}) — {e.content}
                  </div>
                ))
              ) : (
                <span style={{ fontSize: '12px', color: 'var(--text-dim)' }}>Your journal is empty for this date.</span>
              )}
            </div>

            {/* Daily Notes */}
            <div className={styles.modalSection}>
              <span className={styles.modalSecTitle}>
                <StickyNote size={14} /> Daily Notes
              </span>
              {selectedDayItems.notes.map((n, i) => (
                <div key={i} className={styles.modalItem}>
                  {n}
                </div>
              ))}

              <form onSubmit={handleAddDayNote} style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                <input
                  type="text"
                  placeholder="Add note for this day..."
                  value={newNoteInput}
                  onChange={(e) => setNewNoteInput(e.target.value)}
                  style={{
                    flex: 1,
                    backgroundColor: 'var(--bg-input)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    fontSize: '13px',
                    color: 'var(--text-main)'
                  }}
                />
                <Button type="submit" size="sm" variant="primary" icon={Plus}>
                  Add
                </Button>
              </form>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
