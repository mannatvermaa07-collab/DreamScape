import { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Plus,
  Star,
  Gift,
  Sparkles,
  CheckCircle,
  Circle,
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

// Indian national holidays & major festivals.
// Gazetted holidays have exact fixed dates; lunar-calendar festivals
// (Holi, Diwali, Eid, etc.) use their most common approximate date —
// swap out for a real calendar API if you need year-accurate dates.
const HOLIDAYS = [
  { month: 0,  day: 1,  name: 'New Year\'s Day' },
  { month: 0,  day: 14, name: 'Makar Sankranti / Lohri' },
  { month: 0,  day: 23, name: 'Netaji Subhas Chandra Bose Jayanti' },
  { month: 0,  day: 26, name: 'Republic Day' },
  { month: 1,  day: 19, name: 'Maha Shivratri (approx.)' },
  { month: 2,  day: 14, name: 'Holi (approx.)' },
  { month: 2,  day: 25, name: 'Gudi Padwa / Ugadi (approx.)' },
  { month: 3,  day: 6,  name: 'Ram Navami (approx.)' },
  { month: 3,  day: 14, name: 'Baisakhi / Dr. Ambedkar Jayanti' },
  { month: 3,  day: 18, name: 'Good Friday' },
  { month: 4,  day: 1,  name: 'Labour Day / Maharashtra Day' },
  { month: 4,  day: 12, name: 'Buddha Purnima (approx.)' },
  { month: 6,  day: 6,  name: 'Eid ul-Adha (approx.)' },
  { month: 6,  day: 17, name: 'Muharram (approx.)' },
  { month: 7,  day: 9,  name: 'Janmashtami (approx.)' },
  { month: 7,  day: 15, name: 'Independence Day' },
  { month: 8,  day: 2,  name: 'Onam (approx.)' },
  { month: 8,  day: 26, name: 'Eid-e-Milad (approx.)' },
  { month: 9,  day: 2,  name: 'Gandhi Jayanti' },
  { month: 9,  day: 2,  name: 'Navratri Begins (approx.)' },
  { month: 9,  day: 12, name: 'Dussehra (approx.)' },
  { month: 9,  day: 20, name: 'Diwali (approx.)' },
  { month: 9,  day: 22, name: 'Govardhan Puja (approx.)' },
  { month: 9,  day: 23, name: 'Bhai Dooj (approx.)' },
  { month: 10, day: 5,  name: 'Guru Nanak Jayanti (approx.)' },
  { month: 10, day: 14, name: 'Children\'s Day' },
  { month: 11, day: 25, name: 'Christmas Day' },
  { month: 11, day: 31, name: 'New Year\'s Eve' },
];

function getHolidaysForDate(dateObj) {
  return HOLIDAYS.filter((h) => h.month === dateObj.getMonth() && h.day === dateObj.getDate());
}

function getLocalDateString(dateObj) {
  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, '0');
  const d = String(dateObj.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// Tasks are stored with an absolute `date` field (a "YYYY-MM-DD" string set
// once, at creation, from the exact day the task was created for — see
// DashboardPage's toDateKey()). This used to instead be computed from a
// `dayOffset` relative to the CURRENT real-world week's Monday, which is
// why every task without that legacy field collapsed onto the same day
// (whatever this week's Monday happens to be) regardless of which day it
// actually belonged to. Tasks now carry their real date directly, so we
// just read it — no recomputation needed.
function getTaskDateString(task) {
  return task.date || getLocalDateString(new Date());
}

export function CalendarPage() {
  const { goals } = useGoals();
  const { habits } = useHabits();
  const { entries } = useJournal();
  const store = useUserStore();
  const isDemo = store.isDemo;
  const tasks = store.tasks || [];

  // In demo mode keep notes in-memory only — never read from or write to
  // localStorage so personal notes added by a guest don't persist.
  const [persistedNotes, setPersistedNotes] = useLocalStorage('dreamscape_day_notes', {});
  const [demoNotes, setDemoNotes] = useState({});
  const dayNotes = isDemo ? demoNotes : persistedNotes;
  const setDayNotes = isDemo ? setDemoNotes : setPersistedNotes;

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

  // Get items for a date. `important` (holidays + user-added notes like
  // birthdays/festivals) is the primary thing a day cell shows. Tasks,
  // scheduled events, goals, and journal entries are secondary — surfaced
  // as a quiet summary in the cell and as plain lists in the day modal.
  const getItemsForDate = (dateObj) => {
    const dateStr = getLocalDateString(dateObj);
    const dateGoals = goals.filter((g) => g.targetDate === dateStr || (g.completed && dateStr === g.createdAt));
    const dateEntries = entries.filter((e) => e.date === dateStr);
    const dateTasks = tasks.filter((t) => getTaskDateString(t) === dateStr && t.type !== 'event');
    const dateEvents = tasks.filter((t) => getTaskDateString(t) === dateStr && t.type === 'event');
    const dateHolidays = getHolidaysForDate(dateObj);
    const notesForDay = dayNotes[dateStr] || [];

    const important = [
      ...dateHolidays.map((h, i) => ({ key: `holiday-${i}`, label: h.name, kind: 'holiday' })),
      ...notesForDay.map((n, i) => ({ key: `note-${i}`, label: n, kind: 'note' }))
    ];

    return {
      dateStr,
      goals: dateGoals,
      entries: dateEntries,
      tasks: dateTasks,
      events: dateEvents,
      notes: notesForDay,
      important
    };
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
          const {
            dateStr,
            goals: cellGoals,
            entries: cellEntries,
            tasks: cellTasks,
            events: cellEvents,
            important
          } = getItemsForDate(cell.date);
          const isToday = dateStr === todayStr;

          // Secondary line: a single quiet summary instead of a badge per item
          const secondaryParts = [];
          if (cellTasks.length) secondaryParts.push(`${cellTasks.length} task${cellTasks.length > 1 ? 's' : ''}`);
          if (cellEvents.length) secondaryParts.push(`${cellEvents.length} event${cellEvents.length > 1 ? 's' : ''}`);
          if (cellGoals.length) secondaryParts.push(`${cellGoals.length} goal${cellGoals.length > 1 ? 's' : ''}`);
          if (cellEntries.length) secondaryParts.push('journal');

          return (
            <div
              key={idx}
              className={`${styles.dayCell} ${!cell.isCurrentMonth ? styles.otherMonthDay : ''} ${isToday ? styles.todayCell : ''} ${important.length > 0 && cell.isCurrentMonth ? styles.hasImportant : ''
                }`}
              onClick={() => setSelectedDayDate(cell.date)}
            >
              <div className={styles.cellHeader}>
                <span className={`${styles.dayNum} ${isToday ? styles.todayNum : ''}`}>
                  {cell.date.getDate()}
                </span>
              </div>

              <div className={styles.cellBody}>
                {important.length > 0 && cell.isCurrentMonth && (
                  <div className={styles.importantList}>
                    {important.slice(0, 2).map((item) => (
                      <span key={item.key} className={`${styles.importantLine} ${item.kind === 'note' ? styles.importantLineNote : ''}`}>
                        {item.label}
                      </span>
                    ))}
                    {important.length > 2 && (
                      <span className={styles.importantMore}>+{important.length - 2}</span>
                    )}
                  </div>
                )}

                {secondaryParts.length > 0 && (
                  <div className={styles.secondarySummary}>{secondaryParts.join(' · ')}</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Day Detail Modal */}
      <Modal
        isOpen={Boolean(selectedDayDate)}
        onClose={() => setSelectedDayDate(null)}
        title={
          selectedDayDate
            ? selectedDayDate.toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
              year: 'numeric'
            })
            : ''
        }
      >
        {selectedDayItems && (
          <div className={styles.modalBody}>
            {/* Important — holidays + birthdays/festivals you've added.
                Primary section, shown first. */}
            <div className={styles.modalImportantSection}>
              <span className={styles.modalCleanHeader}>
                <Star size={13} />
                Important
              </span>

              {selectedDayItems.important.length > 0 ? (
                <div className={styles.modalImportantChips}>
                  {selectedDayItems.important.map((item) => (
                    <span
                      key={item.key}
                      className={`${styles.modalImportantChip} ${item.kind === 'holiday' ? styles.modalImportantChipHoliday : styles.modalImportantChipNote
                        }`}
                    >
                      {item.kind === 'holiday' ? <Star size={11} /> : <Gift size={11} />}
                      {item.label}
                    </span>
                  ))}
                </div>
              ) : (
                <span className={styles.modalEmptyText}>Nothing marked for this date yet.</span>
              )}

              <form onSubmit={handleAddDayNote} className={styles.eventForm}>
                <input
                  type="text"
                  placeholder="e.g. Sam's birthday, anniversary…"
                  value={newNoteInput}
                  onChange={(e) => setNewNoteInput(e.target.value)}
                  className={styles.eventInput}
                />
                <Button type="submit" size="sm" variant="primary" icon={Plus}>
                  Add
                </Button>
              </form>
            </div>

            {/* Tasks for this day */}
            <div className={styles.modalCleanSection}>
              <span className={styles.modalCleanHeader}>
                <CheckCircle size={13} />
                Tasks
              </span>
              {selectedDayItems.tasks.length > 0 ? (
                selectedDayItems.tasks.map((t) => (
                  <div key={t.id} className={styles.modalRow}>
                    {t.completed ? (
                      <CheckCircle size={15} className={`${styles.modalRowIcon} ${styles.modalRowIconDone}`} />
                    ) : (
                      <Circle size={15} className={styles.modalRowIcon} />
                    )}
                    <span className={`${styles.modalRowTitle} ${t.completed ? styles.modalRowTitleDone : ''}`}>
                      {t.title}
                    </span>
                    <span className={styles.modalRowTime}>
                      {t.startTime || t.time}{t.endTime ? ` – ${t.endTime}` : ''}
                    </span>
                  </div>
                ))
              ) : (
                <span className={styles.modalEmptyText}>No tasks scheduled for this date.</span>
              )}
            </div>

            {/* Scheduled Events for this day */}
            <div className={styles.modalCleanSection}>
              <span className={styles.modalCleanHeader}>
                <Sparkles size={13} />
                Events
              </span>
              {selectedDayItems.events.length > 0 ? (
                selectedDayItems.events.map((ev) => (
                  <div key={ev.id} className={styles.modalRow}>
                    <Sparkles size={15} className={styles.modalRowIcon} />
                    <span className={styles.modalRowTitle}>{ev.title}</span>
                    {ev.allDay ? (
                      <span className={styles.modalRowTag}>All day</span>
                    ) : (
                      <span className={styles.modalRowTime}>
                        {ev.startTime || ev.time}{ev.endTime ? ` – ${ev.endTime}` : ''}
                      </span>
                    )}
                  </div>
                ))
              ) : (
                <span className={styles.modalEmptyText}>No scheduled events for this date.</span>
              )}
            </div>

            {/* Journal Entries for this day */}
            <div className={styles.modalCleanSection}>
              <span className={styles.modalCleanHeader}>
                <BookOpen size={13} />
                Notes
              </span>
              {selectedDayItems.entries.length > 0 ? (
                selectedDayItems.entries.map((e) => (
                  <div key={e.id} className={styles.modalRow}>
                    <BookOpen size={15} className={styles.modalRowIcon} />
                    <span className={styles.modalRowTitle}>
                      {e.title} <span className={styles.modalRowMuted}>· {e.mood}</span>
                    </span>
                  </div>
                ))
              ) : (
                <span className={styles.modalEmptyText}>Your journal is empty for this date.</span>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}