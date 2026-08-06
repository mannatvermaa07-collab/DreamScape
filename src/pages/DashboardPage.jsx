import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Check,
  Plus,
  Trash2,
  Pencil,
  Save,
  X,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Target
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useUserStore } from '../hooks/useUserStore';
import { useTheme } from '../hooks/useTheme';
import { QuoteWidget } from '../components/ui/QuoteWidget';
import { Button } from '../components/ui/Button';
import styles from '../styles/DashboardPage.module.css';


// Dynamically compute the current week (Mon-Sun) based on today's date
function getWeekDays() {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0=Sun, 1=Mon ... 6=Sat
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(today);
  monday.setDate(today.getDate() + mondayOffset);

  const fullNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const shortNames = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return {
      name: fullNames[i],
      shortName: shortNames[i],
      dateNum: d.getDate(),
      dayOffset: i,
      fullDate: d,
      isToday: d.toDateString() === today.toDateString()
    };
  });
}

export function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const store = useUserStore();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Dynamic timeline slots from user settings
  const TIME_SLOTS = store.getTimelineSlots();

  const [newTitle, setNewTitle] = useState('');
  const [newStartTime, setNewStartTime] = useState('10:00');
  const [newEndTime, setNewEndTime] = useState('11:00');
  const [newDayOffset, setNewDayOffset] = useState(0);

  // Edit task state
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editStartTime, setEditStartTime] = useState('');
  const [editEndTime, setEditEndTime] = useState('');

  // Active Date Offset (0 = Today, -1 = Yesterday, 1 = Tomorrow)
  const [activeDateOffset, setActiveDateOffset] = useState(0);

  // Calculate dynamic date based on activeDateOffset
  const displayDate = new Date();
  displayDate.setDate(displayDate.getDate() + activeDateOffset);

  const displayDateFormatted = displayDate.toLocaleDateString(navigator.language || 'en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });

  const activeDateLabel =
    activeDateOffset === 0
      ? 'Today'
      : activeDateOffset === -1
      ? 'Yesterday'
      : activeDateOffset === 1
      ? 'Tomorrow'
      : displayDateFormatted;

  // Time-of-day greeting
  const currentHour = new Date().getHours();
  const greetingTime =
    currentHour < 12
      ? 'Good morning'
      : currentHour < 18
      ? 'Good afternoon'
      : 'Good evening';

  const userName = user?.name || 'User';

  const tasks = store.user?.tasks || [];

  // Calculate duration label from start/end times
  const calcDuration = (start, end) => {
    const sh = parseInt(start.split(':')[0], 10);
    const eh = parseInt(end.split(':')[0], 10);
    const diff = eh - sh;
    return diff > 0 ? `${diff}h` : '1h';
  };

  const handleCreateTask = (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newTask = {
      id: `task-${Date.now()}`,
      title: newTitle.trim(),
      startTime: newStartTime,
      endTime: newEndTime,
      time: newStartTime,
      duration: calcDuration(newStartTime, newEndTime),
      dayOffset: Number(newDayOffset),
      completed: false
    };

    const existingTasks = store.user?.tasks || [];
    const updatedUserTasks = [newTask, ...existingTasks];
    
    store.updateActiveUser((user) => ({
      ...user,
      tasks: updatedUserTasks
    }));

    setNewTitle('');
  };

  const handleToggleTask = (id) => {
    const existingTasks = store.user?.tasks || [];
    const updated = existingTasks.map((t) =>
      t.id === id ? { ...t, completed: !t.completed } : t
    );
    store.updateActiveUser((user) => ({ ...user, tasks: updated }));
  };

  const handleDeleteTask = (id) => {
    const existingTasks = store.user?.tasks || [];
    const updated = existingTasks.filter((t) => t.id !== id);
    store.updateActiveUser((user) => ({ ...user, tasks: updated }));
  };

  const handleEditTask = (task) => {
    setEditingTaskId(task.id);
    setEditTitle(task.title);
    setEditStartTime(task.startTime || task.time || '10:00');
    setEditEndTime(task.endTime || '11:00');
  };

  const handleCancelEdit = () => {
    setEditingTaskId(null);
    setEditTitle('');
    setEditStartTime('');
    setEditEndTime('');
  };

  const handleSaveEdit = (id) => {
    if (!editTitle.trim()) return;
    const existingTasks = store.user?.tasks || [];
    const updated = existingTasks.map((t) =>
      t.id === id
        ? {
            ...t,
            title: editTitle.trim(),
            startTime: editStartTime,
            endTime: editEndTime,
            time: editStartTime,
            duration: calcDuration(editStartTime, editEndTime)
          }
        : t
    );
    store.updateActiveUser((user) => ({ ...user, tasks: updated }));
    setEditingTaskId(null);
    setEditTitle('');
    setEditStartTime('');
    setEditEndTime('');
  };

  // Dynamic week days
  const WEEK_DAYS = getWeekDays();

  // Current month/year for header
  const calendarMonthLabel = new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

  // Color palette for tasks — dark mode uses deeper saturated tones for readability
  const TASK_COLORS_LIGHT = [
    { bg: '#e8e0ff', border: '#a78bfa', text: '#4c1d95' },   // Lavender
    { bg: '#fce7f3', border: '#f9a8d4', text: '#831843' },   // Rose
    { bg: '#d1fae5', border: '#6ee7b7', text: '#064e3b' },   // Mint
    { bg: '#fef3c7', border: '#fcd34d', text: '#78350f' },   // Butter
    { bg: '#dbeafe', border: '#93c5fd', text: '#1e3a5f' },   // Sky
    { bg: '#ede9fe', border: '#c4b5fd', text: '#4c1d95' },   // Lilac
    { bg: '#ffe4e6', border: '#fda4af', text: '#881337' },   // Blush
    { bg: '#ccfbf1', border: '#5eead4', text: '#134e4a' },   // Teal
  ];

  const TASK_COLORS_DARK = [
    { bg: '#2e1065', border: '#a78bfa', text: '#e0d4ff' },   // Lavender
    { bg: '#4a0d2e', border: '#f472b6', text: '#fce7f3' },   // Rose
    { bg: '#064e3b', border: '#34d399', text: '#d1fae5' },   // Mint
    { bg: '#713f12', border: '#fbbf24', text: '#fef3c7' },   // Butter
    { bg: '#1e3a5f', border: '#60a5fa', text: '#dbeafe' },   // Sky
    { bg: '#3b0764', border: '#a78bfa', text: '#ede9fe' },   // Lilac
    { bg: '#4c0519', border: '#fb7185', text: '#ffe4e6' },   // Blush
    { bg: '#134e4a', border: '#2dd4bf', text: '#ccfbf1' },   // Teal
  ];

  const getTaskColor = (taskId) => {
    const idx = tasks.findIndex((t) => t.id === taskId);
    const palette = isDark ? TASK_COLORS_DARK : TASK_COLORS_LIGHT;
    return palette[idx % palette.length];
  };

  // Get task duration in hours
  const getTaskSpan = (task) => {
    const startH = parseInt((task.startTime || task.time || '0').split(':')[0], 10);
    const endH = parseInt((task.endTime || String(startH + 1).padStart(2, '0') + ':00').split(':')[0], 10);
    return Math.max(endH - startH, 1);
  };

  return (
    <div className={styles.dashboardContainer}>
      {/* Middle Task Panel ("Today" Workspace) */}
      <div className={styles.taskPanel}>

        {/* Unheaded Daily Insights Certified Quote */}
        <QuoteWidget />

        {/* Task Input Section Header with Date Arrows (< Yesterday / Today / Tomorrow >) */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '15px', fontWeight: 700, color: 'var(--text-main)' }}>
              {activeDateLabel}
            </h3>
            <span style={{ fontSize: '12px', color: 'var(--text-dim)' }}>({displayDateFormatted})</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <button
              onClick={() => setActiveDateOffset((prev) => prev - 1)}
              style={{
                background: 'var(--bg-input)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-muted)',
                borderRadius: '6px',
                padding: '4px 8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '12px'
              }}
              title="Previous Day (Yesterday)"
            >
              <ChevronLeft size={14} />
            </button>

            {activeDateOffset !== 0 && (
              <button
                onClick={() => setActiveDateOffset(0)}
                style={{
                  background: 'var(--primary-light)',
                  border: '1px solid var(--primary)',
                  color: 'var(--primary)',
                  borderRadius: '6px',
                  padding: '4px 8px',
                  cursor: 'pointer',
                  fontSize: '11px',
                  fontWeight: 600
                }}
              >
                Today
              </button>
            )}

            <button
              onClick={() => setActiveDateOffset((prev) => prev + 1)}
              style={{
                background: 'var(--bg-input)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-muted)',
                borderRadius: '6px',
                padding: '4px 8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '12px'
              }}
              title="Next Day (Tomorrow)"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>

        {/* Task Input Box */}
        <form onSubmit={handleCreateTask} className={styles.inputCard}>
          <input
            type="text"
            placeholder={`What would you like to accomplish ${activeDateLabel.toLowerCase()}?`}
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className={styles.taskInput}
          />

          <div className={styles.inputMetaRow}>
            <select
              value={newStartTime}
              onChange={(e) => {
                setNewStartTime(e.target.value);
                const sh = parseInt(e.target.value.split(':')[0], 10);
                const eh = parseInt(newEndTime.split(':')[0], 10);
                if (eh <= sh) setNewEndTime(`${String(sh + 1).padStart(2, '0')}:00`);
              }}
              className={styles.selectMeta}
              title="Start Time"
            >
              {TIME_SLOTS.map((t) => (
                <option key={t} value={t}>Start: {t}</option>
              ))}
            </select>

            <select
              value={newEndTime}
              onChange={(e) => setNewEndTime(e.target.value)}
              className={styles.selectMeta}
              title="End Time"
            >
              {TIME_SLOTS.filter((t) => {
                const h = parseInt(t.split(':')[0], 10);
                const sh = parseInt(newStartTime.split(':')[0], 10);
                return h > sh;
              }).map((t) => (
                <option key={t} value={t}>End: {t}</option>
              ))}
            </select>

            <select
              value={newDayOffset}
              onChange={(e) => setNewDayOffset(e.target.value)}
              className={styles.selectMeta}
            >
              {WEEK_DAYS.map((day) => (
                <option key={day.dayOffset} value={day.dayOffset}>
                  {day.name} {day.dateNum}
                </option>
              ))}
            </select>

            <Button type="submit" size="sm" variant="primary" icon={Plus} style={{ marginLeft: 'auto' }}>
              Add Task
            </Button>
          </div>
        </form>

        {/* Tasks List */}
        {tasks.length > 0 ? (
          <div className={styles.tasksList}>
          {tasks.map((task) => {
              const color = getTaskColor(task.id);
              const isEditing = editingTaskId === task.id;
              return (
              <div
                key={task.id}
                className={`${styles.taskCard} ${task.completed ? styles.completedTaskCard : ''}`}
                style={{ borderLeft: `3px solid ${color.border}`, backgroundColor: color.bg }}
              >
                <button
                  className={`${styles.checkbox} ${task.completed ? styles.checked : ''}`}
                  onClick={() => handleToggleTask(task.id)}
                >
                  {task.completed && <Check size={12} strokeWidth={3} />}
                </button>

                <div className={styles.taskMainInfo}>
                  {isEditing ? (
                    /* Inline Edit Mode */
                    <div className={styles.editForm}>
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className={styles.editInput}
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveEdit(task.id);
                          if (e.key === 'Escape') handleCancelEdit();
                        }}
                      />
                      <div className={styles.editTimeRow}>
                        <select
                          value={editStartTime}
                          onChange={(e) => {
                            setEditStartTime(e.target.value);
                            const sh = parseInt(e.target.value.split(':')[0], 10);
                            const eh = parseInt(editEndTime.split(':')[0], 10);
                            if (eh <= sh) setEditEndTime(`${String(sh + 1).padStart(2, '0')}:00`);
                          }}
                          className={styles.selectMeta}
                        >
                          {TIME_SLOTS.map((t) => (
                            <option key={t} value={t}>Start: {t}</option>
                          ))}
                        </select>
                        <select
                          value={editEndTime}
                          onChange={(e) => setEditEndTime(e.target.value)}
                          className={styles.selectMeta}
                        >
                          {TIME_SLOTS.filter((t) => {
                            const h = parseInt(t.split(':')[0], 10);
                            const sh = parseInt(editStartTime.split(':')[0], 10);
                            return h > sh;
                          }).map((t) => (
                            <option key={t} value={t}>End: {t}</option>
                          ))}
                        </select>
                      </div>
                      <div className={styles.editActions}>
                        <button
                          className={styles.editSaveBtn}
                          onClick={() => handleSaveEdit(task.id)}
                          title="Save Changes"
                        >
                          <Save size={13} /> Save
                        </button>
                        <button
                          className={styles.editCancelBtn}
                          onClick={handleCancelEdit}
                          title="Cancel Edit"
                        >
                          <X size={13} /> Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Display Mode */
                    <>
                      <div className={styles.taskTitleRow}>
                        <h4
                          className={`${styles.taskTitle} ${task.completed ? styles.completedTitle : ''}`}
                          style={{ color: color.text }}
                        >
                          {task.title}
                        </h4>
                        <span className={styles.durationPill}>{task.duration || '1h'}</span>
                      </div>

                      <div className={styles.badgeRow}>
                        <span style={{ fontSize: '10px', color: color.text, opacity: 0.7, display: 'flex', alignItems: 'center', gap: '4px' }}>
                          🕐 {task.startTime || task.time} — {task.endTime || ''}
                        </span>
                      </div>
                    </>
                  )}
                </div>

                {!isEditing && (
                  <div className={styles.taskActions}>
                    <button
                      className={styles.actionBtn}
                      onClick={() => handleEditTask(task)}
                      title="Edit Task"
                      style={{ color: color.text, opacity: 0.6 }}
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      className={styles.actionBtn}
                      onClick={() => handleDeleteTask(task.id)}
                      title="Delete Task"
                      style={{ color: color.text, opacity: 0.6 }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>
              );
            })}
          </div>
        ) : (
          <div className={styles.emptyStateCard}>
            <Target size={32} style={{ opacity: 0.3 }} />
            <span style={{ fontSize: '14px', fontWeight: 500 }}>No tasks scheduled yet.</span>
            <span style={{ fontSize: '12px', color: 'var(--text-dim)' }}>Type a task above to populate your workspace.</span>
          </div>
        )}
      </div>

      {/* Right Panel: Large Weekly Calendar Schedule Grid */}
      <div className={styles.calendarPanel}>
        <div className={styles.gridHeader}>
          <div className={styles.gridMonthTitle}>
            <CalendarIcon size={18} style={{ color: 'var(--primary)' }} />
            <span>{calendarMonthLabel}</span>
          </div>

          <div style={{ display: 'flex', gap: '4px' }}>
            <Button size="sm" variant="outline" onClick={() => navigate('/app/calendar')}>
              Calendar View →
            </Button>
          </div>
        </div>

        {/* Weekly Table Grid */}
        <div className={styles.weeklyTableWrapper}>
          <div className={styles.weeklyTable}>
          {/* Time Column Header */}
          <div className={styles.timeColHeader}></div>

          {/* Weekday Columns Header */}
          {WEEK_DAYS.map((day) => (
            <div
              key={day.dayOffset}
              className={`${styles.dayColHeader} ${day.isToday ? styles.activeDayHeader : ''}`}
            >
              <span className={styles.dayNameFull}>{day.name}</span>
              <span className={styles.dayNameShort}>{day.shortName}</span>
              <span className={styles.dayDateNum}>{day.dateNum}</span>
            </div>
          ))}

          {/* Hourly Time Rows */}
          {TIME_SLOTS.map((timeSlot) => (
            <>
              {/* Time Label Cell */}
              <div key={`time-${timeSlot}`} className={styles.timeSlotCell}>
                {timeSlot}
              </div>

              {/* Grid Slot Cells for Each Day */}
              {WEEK_DAYS.map((day) => {
                // Find a task whose START time matches this slot
                const startingTask = tasks.find(
                  (t) => t.dayOffset === day.dayOffset && (t.startTime || t.time) === timeSlot
                );

                // Find if another task spans over this slot (but didn't start here)
                const spanningTask = !startingTask && tasks.find((t) => {
                  if (t.dayOffset !== day.dayOffset) return false;
                  const startH = parseInt((t.startTime || t.time || '0').split(':')[0], 10);
                  const endH = parseInt((t.endTime || String(startH + 1).padStart(2, '0') + ':00').split(':')[0], 10);
                  const slotH = parseInt(timeSlot.split(':')[0], 10);
                  return slotH > startH && slotH < endH;
                });

                return (
                  <div
                    key={`slot-${day.dayOffset}-${timeSlot}`}
                    className={styles.gridSlotCell}
                    style={{ overflow: startingTask ? 'visible' : 'hidden', zIndex: startingTask ? 2 : 1 }}
                    onClick={() => navigate('/app/calendar')}
                  >
                    {startingTask && (() => {
                      const span = getTaskSpan(startingTask);
                      const color = getTaskColor(startingTask.id);
                      // 49px = cell height (48px) + 1px gap
                      const height = span * 49 - 1;
                      return (
                        <div
                          className={`${styles.eventBlockCard} ${startingTask.completed ? styles.eventBlockCompleted : ''}`}
                          style={{
                            backgroundColor: color.bg,
                            borderLeftColor: color.border,
                            color: color.text,
                            height: `${height}px`,
                            position: 'absolute',
                            top: '4px',
                            left: '4px',
                            right: '4px',
                            zIndex: 3,
                            borderRadius: '6px',
                            padding: '6px 8px',
                          }}
                        >
                          <span style={{ fontWeight: 600, color: color.text, textDecoration: startingTask.completed ? 'line-through' : 'none' }}>
                            {startingTask.completed && '✓ '}{startingTask.title}
                          </span>
                          <span style={{ fontSize: '9px', opacity: 0.7, marginTop: '2px', color: color.text }}>
                            {startingTask.startTime} – {startingTask.endTime}
                          </span>
                        </div>
                      );
                    })()}
                    {/* Hide content for cells covered by a spanning task */}
                  </div>
                );
              })}
            </>
          ))}
          </div>
        </div>
      </div>
    </div>
  );
}
