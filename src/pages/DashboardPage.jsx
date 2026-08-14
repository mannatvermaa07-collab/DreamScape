import { useState, useEffect, useRef } from 'react';
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
  ChevronDown,
  Target,
  Maximize2,
  Palette,
  Clock,
  Repeat
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useUserStore } from '../hooks/useUserStore';
import { QuoteWidget } from '../components/ui/QuoteWidget';
import { Button } from '../components/ui/Button';
import styles from '../styles/DashboardPage.module.css';

// Converts a 24-hour "HH:mm" string (e.g. "16:00") to a 12-hour
// display string (e.g. "4:00 PM"). Underlying stored values stay in
// 24-hour format everywhere else — this is display-only formatting.
function formatTime12h(time24) {
  if (!time24) return '';
  const [hStr, mStr = '00'] = time24.split(':');
  const h = parseInt(hStr, 10);
  if (Number.isNaN(h)) return time24;
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${mStr.padStart(2, '0')} ${period}`;
}

const DAY_FULL_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DAY_SHORT_NAMES = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const WEEKDAY_HEADERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const WEEKDAY_LONG_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const WEEKDAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MS_PER_DAY = 24 * 60 * 60 * 1000;

// Row height in px for one hour of the grid — MUST match the CSS
// (.gridSlotCell height: 48px) + the 1px grid gap. Used both to size
// event blocks and to convert a drag distance in px into hours.
const ROW_HEIGHT = 49;

// Solid event color palette for tasks — hashed per-task-id in getTaskColor()
// as the default, but a task can override it with its own `color` field
// (set via the color-swatch picker on each task card).
const GCAL_COLORS = [
  '#C05476',
  '#D85675',
  '#D6837A',
  '#DA5234',
  '#E3683E',
  '#DD7835',
  '#E0963C',
  '#E7BA51',
  '#D8BE5E',
  '#BCC256',
  '#85AD59',
  '#489160',
  '#55B080',
  '#429A8E',
  '#4B99D2',
  '#668BE1',
  '#828BC2',
  '#6E72C3',
  '#AE9CCE',
  '#A479B1',
  '#A75ABA',
  '#957367',
  '#7C7C7C',
  '#7C7C7C',
  '#A5998C',
];

// Darkens a #rrggbb hex color by `amount` (0-1) — used for the event's
// left border accent, same way Google Calendar uses a slightly deeper
// shade of the fill color for the border.
function darken(hex, amount = 0.18) {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.max(0, (num >> 16) - Math.round(255 * amount));
  const g = Math.max(0, ((num >> 8) & 0xff) - Math.round(255 * amount));
  const b = Math.max(0, (num & 0xff) - Math.round(255 * amount));
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

// Relative luminance (WCAG formula) of a #rrggbb hex color, 0 (black) to
// 1 (white) — used to decide whether a task's solid color needs light or
// dark text/badges on top of it for real contrast, instead of forcing
// white on every color regardless of how light that color already is.
function getLuminance(hex) {
  const num = parseInt(hex.replace('#', ''), 16);
  const toLinear = (c) => {
    const cs = c / 255;
    return cs <= 0.03928 ? cs / 12.92 : Math.pow((cs + 0.055) / 1.055, 2.4);
  };
  const r = toLinear((num >> 16) & 0xff);
  const g = toLinear((num >> 8) & 0xff);
  const b = toLinear(num & 0xff);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

// Simple stable string hash — used to pick a task's default color
// deterministically from its id, so an unset-color task never shifts.
function hashStringToIndex(str, mod) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  }
  return hash % mod;
}

function clamp(val, min, max) {
  return Math.min(Math.max(val, min), max);
}

// Lays out a day's events so ones that overlap in time are shown side by
// side instead of stacked on top of each other (same approach most
// calendar apps use — greedy column packing, then a union-find pass to
// group transitively-overlapping events so each group only splits the
// width it actually needs).
function layoutDayEvents(events) {
  const sorted = [...events].sort((a, b) => a.startH - b.startH || a.endH - b.endH);

  // Greedily assign each event to the first column whose previous
  // occupant has already ended by this event's start time.
  const columnEnds = [];
  const placed = sorted.map((ev) => {
    let col = columnEnds.findIndex((endH) => endH <= ev.startH);
    if (col === -1) {
      col = columnEnds.length;
      columnEnds.push(ev.endH);
    } else {
      columnEnds[col] = ev.endH;
    }
    return { ...ev, col };
  });

  // Union-find: group events that overlap, directly or transitively,
  // into clusters — each cluster only needs as many columns as its own
  // busiest moment, not the day's overall max.
  const parent = placed.map((_, i) => i);
  const find = (i) => {
    while (parent[i] !== i) {
      parent[i] = parent[parent[i]];
      i = parent[i];
    }
    return i;
  };
  const union = (i, j) => {
    const ri = find(i);
    const rj = find(j);
    if (ri !== rj) parent[ri] = rj;
  };

  for (let i = 0; i < placed.length; i++) {
    for (let j = i + 1; j < placed.length; j++) {
      if (placed[i].startH < placed[j].endH && placed[j].startH < placed[i].endH) {
        union(i, j);
      }
    }
  }

  const clusterMaxCol = {};
  placed.forEach((ev, i) => {
    const root = find(i);
    clusterMaxCol[root] = Math.max(clusterMaxCol[root] || 0, ev.col + 1);
  });

  return placed.map((ev, i) => ({ ...ev, colCount: clusterMaxCol[find(i)] }));
}


// Monday of the real-world week containing baseDate
function getWeekMonday(baseDate) {
  const dayOfWeek = baseDate.getDay(); // 0=Sun, 1=Mon ... 6=Sat
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(baseDate);
  monday.setDate(baseDate.getDate() + mondayOffset);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

// Absolute "YYYY-MM-DD" key for a Date, in LOCAL time (not UTC — avoids the
// classic off-by-one-day bug toISOString() causes near midnight). Tasks are
// stored keyed to this instead of a week-relative offset, so a task always
// lands on the exact calendar date it was created for, regardless of when
// it's viewed.
function toDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// Builds day-info for the dashboard's DISPLAY grid, based on the active
// view ('day' or 'week') and the currently navigated anchor date.
function getCalendarDays(view, anchorDate) {
  const today = new Date();

  const buildDayInfo = (d) => {
    const idx = (d.getDay() + 6) % 7; // 0=Mon ... 6=Sun
    return {
      name: DAY_FULL_NAMES[idx],
      shortName: DAY_SHORT_NAMES[idx],
      dateNum: d.getDate(),
      dateKey: toDateKey(d),
      fullDate: d,
      isToday: d.toDateString() === today.toDateString()
    };
  };

  if (view === 'day') {
    return [buildDayInfo(anchorDate)];
  }

  const anchorMonday = getWeekMonday(anchorDate);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(anchorMonday);
    d.setDate(anchorMonday.getDate() + i);
    return buildDayInfo(d);
  });
}

// Builds a 6-row x 7-col grid of Dates for the month calendar popup,
// starting on the Sunday on/before the 1st and padded through to fill
// full weeks (leading/trailing days from adjacent months included, dimmed).
function getMonthGrid(viewDate) {
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const startDay = firstOfMonth.getDay(); // 0=Sun
  const gridStart = new Date(firstOfMonth);
  gridStart.setDate(firstOfMonth.getDate() - startDay);

  const weeks = [];
  const cursor = new Date(gridStart);
  for (let w = 0; w < 6; w++) {
    const days = [];
    for (let d = 0; d < 7; d++) {
      days.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
    weeks.push(days);
  }
  return weeks;
}

// "first" / "second" / "third" ... for the monthly recurrence label
// ("Monthly on the second Tuesday").
function getOrdinal(n) {
  const names = ['first', 'second', 'third', 'fourth', 'fifth'];
  return names[n - 1] || `${n}th`;
}

// Builds the recurrence dropdown's option list. Several labels (weekly /
// monthly / annually) depend on whichever date is currently selected in
// the form, same as Google Calendar's own "Add title" recurrence field —
// so this is recomputed from `date` on every render rather than being a
// static list.
function getRecurrenceOptions(date) {
  const weekdayName = WEEKDAY_LONG_NAMES[date.getDay()];
  const nthInMonth = Math.ceil(date.getDate() / 7);
  const monthDayLabel = date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
  const isWeekday = date.getDay() >= 1 && date.getDay() <= 5;

  const options = [
    { value: 'none', label: 'Does not repeat' },
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: `Weekly on ${weekdayName}` },
    { value: 'monthly', label: `Monthly on the ${getOrdinal(nthInMonth)} ${weekdayName}` },
    { value: 'annually', label: `Annually on ${monthDayLabel}` }
  ];
  if (isWeekday) {
    options.push({ value: 'weekday', label: 'Every weekday (Monday to Friday)' });
  }
  options.push({ value: 'custom', label: 'Custom…' });
  return options;
}

// Whole-day difference between two Dates (b - a), ignoring time-of-day.
function daysBetween(a, b) {
  return Math.round((b.getTime() - a.getTime()) / MS_PER_DAY);
}

// The actual recurrence engine: does `task` occur on `targetDate`?
// Recurrence always projects FORWARD from the task's own `date` (its
// anchor/creation day) — a task never appears on a day before it existed,
// even if that day would otherwise match the pattern (e.g. a "weekly on
// Tuesday" task created on a Tuesday won't show on an earlier Tuesday).
function taskOccursOnDate(task, targetDateInput) {
  if (!task.date) return false;

  const anchor = new Date(`${task.date}T00:00:00`);
  const target = new Date(targetDateInput);
  target.setHours(0, 0, 0, 0);

  if (target < anchor) return false;

  const recurrence = task.recurrence || 'none';

  if (recurrence === 'none') {
    return toDateKey(target) === task.date;
  }

  if (recurrence === 'daily') {
    return true;
  }

  if (recurrence === 'weekday') {
    const day = target.getDay();
    return day >= 1 && day <= 5;
  }

  if (recurrence === 'weekly') {
    return target.getDay() === anchor.getDay();
  }

  if (recurrence === 'monthly') {
    if (target.getDay() !== anchor.getDay()) return false;
    const anchorNth = Math.ceil(anchor.getDate() / 7);
    const targetNth = Math.ceil(target.getDate() / 7);
    return anchorNth === targetNth;
  }

  if (recurrence === 'annually') {
    return target.getMonth() === anchor.getMonth() && target.getDate() === anchor.getDate();
  }

  if (recurrence === 'custom' && task.recurrenceRule) {
    const rule = task.recurrenceRule;
    const interval = Math.max(1, rule.interval || 1);
    const unit = rule.unit || 'week';

    if (rule.end?.type === 'date' && rule.end.date) {
      const endDate = new Date(`${rule.end.date}T00:00:00`);
      if (target > endDate) return false;
    }

    let occurrenceIndex = null;

    if (unit === 'day') {
      const diff = daysBetween(anchor, target);
      if (diff < 0 || diff % interval !== 0) return false;
      occurrenceIndex = diff / interval;
    } else if (unit === 'week') {
      const weekdays = rule.weekdays && rule.weekdays.length ? rule.weekdays : [anchor.getDay()];
      if (!weekdays.includes(target.getDay())) return false;
      const anchorWeekStart = new Date(anchor);
      anchorWeekStart.setDate(anchor.getDate() - anchor.getDay());
      const targetWeekStart = new Date(target);
      targetWeekStart.setDate(target.getDate() - target.getDay());
      const weekDiff = Math.round((targetWeekStart.getTime() - anchorWeekStart.getTime()) / (MS_PER_DAY * 7));
      if (weekDiff < 0 || weekDiff % interval !== 0) return false;
      // Occurrence counting for multi-weekday custom rules is approximate —
      // good enough to bound a "stop after N" but not exact per-weekday count.
      occurrenceIndex = weekDiff / interval;
    } else if (unit === 'month') {
      if (target.getDate() !== anchor.getDate()) return false;
      const monthDiff = (target.getFullYear() - anchor.getFullYear()) * 12 + (target.getMonth() - anchor.getMonth());
      if (monthDiff < 0 || monthDiff % interval !== 0) return false;
      occurrenceIndex = monthDiff / interval;
    } else if (unit === 'year') {
      if (target.getMonth() !== anchor.getMonth() || target.getDate() !== anchor.getDate()) return false;
      const yearDiff = target.getFullYear() - anchor.getFullYear();
      if (yearDiff < 0 || yearDiff % interval !== 0) return false;
      occurrenceIndex = yearDiff / interval;
    } else {
      return false;
    }

    if (rule.end?.type === 'count' && rule.end.count && occurrenceIndex !== null) {
      if (occurrenceIndex + 1 > rule.end.count) return false;
    }

    return true;
  }

  return toDateKey(target) === task.date;
}

// Human-readable summary of a custom recurrence rule, e.g.
// "Every 2 weeks on Mon, Wed, until Dec 31, 2026".
function describeCustomRule(rule, anchorDate) {
  if (!rule) return 'Custom';
  const interval = rule.interval || 1;
  const unitLabels = { day: 'day', week: 'week', month: 'month', year: 'year' };
  const unitLabel = unitLabels[rule.unit] || 'week';
  const unitPlural = interval > 1 ? `${unitLabel}s` : unitLabel;
  let base = `Every ${interval > 1 ? interval + ' ' : ''}${unitPlural}`;

  if (rule.unit === 'week' && rule.weekdays?.length) {
    const days = [...rule.weekdays].sort((a, b) => a - b).map((d) => WEEKDAY_SHORT[d]).join(', ');
    base += ` on ${days}`;
  }

  if (rule.end?.type === 'date' && rule.end.date) {
    base += `, until ${new Date(`${rule.end.date}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  } else if (rule.end?.type === 'count' && rule.end.count) {
    base += `, ${rule.end.count}×`;
  }

  return base;
}

// Recurrence label for an existing task — resolves to the matching preset
// label, or a rendered summary of its custom rule.
function getRecurrenceLabel(task) {
  if (!task.recurrence || task.recurrence === 'none') return null;
  const anchor = new Date(`${task.date}T00:00:00`);
  if (task.recurrence === 'custom') {
    return describeCustomRule(task.recurrenceRule, anchor);
  }
  return getRecurrenceOptions(anchor).find((o) => o.value === task.recurrence)?.label || null;
}

// Google-Calendar-style date field: a small trigger button showing the
// selected day, which opens a month calendar popup to pick a new one.
function DateDropdown({ selectedDate, onSelect }) {
  const [open, setOpen] = useState(false);
  const [viewDate, setViewDate] = useState(new Date(selectedDate));
  const wrapRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const openPicker = () => {
    setViewDate(new Date(selectedDate));
    setOpen(true);
  };

  const goPrevMonth = () =>
    setViewDate((prev) => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() - 1);
      return d;
    });

  const goNextMonth = () =>
    setViewDate((prev) => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() + 1);
      return d;
    });

  const today = new Date();
  const monthLabel = viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const weeks = getMonthGrid(viewDate);
  const buttonLabel = selectedDate.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' });

  return (
    <div className={styles.dateDropdownWrap} ref={wrapRef}>
      <button
        type="button"
        className={`${styles.selectMeta} ${styles.dateTriggerBtn}`}
        onClick={() => (open ? setOpen(false) : openPicker())}
      >
        <CalendarIcon size={12} />
        {buttonLabel}
      </button>

      {open && (
        <div className={styles.calendarPopup}>
          <div className={styles.calendarPopupHeader}>
            <button type="button" className={styles.calNavBtn} onClick={goPrevMonth}>
              <ChevronLeft size={14} />
            </button>
            <span>{monthLabel}</span>
            <button type="button" className={styles.calNavBtn} onClick={goNextMonth}>
              <ChevronRight size={14} />
            </button>
          </div>

          <div className={styles.calendarWeekdays}>
            {WEEKDAY_HEADERS.map((w, i) => (
              <span key={i}>{w}</span>
            ))}
          </div>

          <div className={styles.calendarDaysGrid}>
            {weeks.flat().map((d, i) => {
              const isCurrentMonth = d.getMonth() === viewDate.getMonth();
              const isSelected = d.toDateString() === selectedDate.toDateString();
              const isToday = d.toDateString() === today.toDateString();
              return (
                <button
                  type="button"
                  key={i}
                  className={[
                    styles.calendarDayCell,
                    !isCurrentMonth ? styles.calendarDayOtherMonth : '',
                    isSelected ? styles.calendarDaySelected : '',
                    isToday && !isSelected ? styles.calendarDayToday : ''
                  ].filter(Boolean).join(' ')}
                  onClick={() => {
                    onSelect(d);
                    setOpen(false);
                  }}
                >
                  {d.getDate()}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// The "Custom…" recurrence panel — repeat interval/unit, which weekdays
// (when the unit is "week"), and an end condition (never / on a date /
// after N occurrences). Opened in place of the options list when the
// user picks "Custom…" from the RecurrenceDropdown below.
function CustomRecurrencePanel({ initialRule, anchorDate, onCancel, onSave }) {
  const [intervalVal, setIntervalVal] = useState(initialRule?.interval || 1);
  const [unit, setUnit] = useState(initialRule?.unit || 'week');
  const [weekdays, setWeekdays] = useState(
    initialRule?.weekdays && initialRule.weekdays.length ? initialRule.weekdays : [anchorDate.getDay()]
  );
  const [endType, setEndType] = useState(initialRule?.end?.type || 'never');
  const [endDate, setEndDate] = useState(initialRule?.end?.date || toDateKey(anchorDate));
  const [endCount, setEndCount] = useState(initialRule?.end?.count || 10);

  const toggleWeekday = (d) => {
    setWeekdays((prev) => {
      if (prev.includes(d)) {
        return prev.length > 1 ? prev.filter((x) => x !== d) : prev;
      }
      return [...prev, d].sort((a, b) => a - b);
    });
  };

  const handleSave = () => {
    const rule = {
      interval: Math.max(1, parseInt(intervalVal, 10) || 1),
      unit,
      ...(unit === 'week' ? { weekdays } : {}),
      end:
        endType === 'date'
          ? { type: 'date', date: endDate }
          : endType === 'count'
            ? { type: 'count', count: Math.max(1, parseInt(endCount, 10) || 1) }
            : { type: 'never' }
    };
    onSave(rule);
  };

  return (
    <div className={styles.recurrenceCustomPanel}>
      <span className={styles.customPanelTitle}>Custom recurrence</span>

      <div className={styles.customPanelRow}>
        <span className={styles.customPanelLabel}>Repeat every</span>
        <input
          type="number"
          min="1"
          value={intervalVal}
          onChange={(e) => setIntervalVal(e.target.value)}
          className={styles.numberInput}
        />
        <select value={unit} onChange={(e) => setUnit(e.target.value)} className={styles.unitSelect}>
          <option value="day">day{intervalVal > 1 ? 's' : ''}</option>
          <option value="week">week{intervalVal > 1 ? 's' : ''}</option>
          <option value="month">month{intervalVal > 1 ? 's' : ''}</option>
          <option value="year">year{intervalVal > 1 ? 's' : ''}</option>
        </select>
      </div>

      {unit === 'week' && (
        <div className={styles.customPanelRow}>
          <span className={styles.customPanelLabel}>Repeat on</span>
          <div className={styles.weekdayPills}>
            {WEEKDAY_SHORT.map((label, i) => (
              <button
                type="button"
                key={label}
                className={`${styles.weekdayPill} ${weekdays.includes(i) ? styles.weekdayPillActive : ''}`}
                onClick={() => toggleWeekday(i)}
                title={label}
              >
                {label[0]}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className={styles.endOptionsGroup}>
        <span className={styles.customPanelLabel}>Ends</span>

        <label className={styles.endOptionRow}>
          <input
            type="radio"
            name="recurrenceEnd"
            checked={endType === 'never'}
            onChange={() => setEndType('never')}
          />
          Never
        </label>

        <label className={styles.endOptionRow}>
          <input
            type="radio"
            name="recurrenceEnd"
            checked={endType === 'date'}
            onChange={() => setEndType('date')}
          />
          On
          <input
            type="date"
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value);
              setEndType('date');
            }}
            className={styles.endDateInput}
          />
        </label>

        <label className={styles.endOptionRow}>
          <input
            type="radio"
            name="recurrenceEnd"
            checked={endType === 'count'}
            onChange={() => setEndType('count')}
          />
          After
          <input
            type="number"
            min="1"
            value={endCount}
            onChange={(e) => {
              setEndCount(e.target.value);
              setEndType('count');
            }}
            className={styles.endInlineInput}
          />
          occurrences
        </label>
      </div>

      <div className={styles.customPanelActions}>
        <button type="button" className={styles.customPanelBackBtn} onClick={onCancel}>
          Back
        </button>
        <button type="button" className={styles.customPanelSaveBtn} onClick={handleSave}>
          Done
        </button>
      </div>
    </div>
  );
}

// Google-Calendar-style recurrence field: a full-width trigger button
// showing the current repeat setting, opening a list of options computed
// from the selected date (so "Weekly on Tuesday" etc. always matches
// whichever day is picked in the form above it). Choosing "Custom…" swaps
// the list for CustomRecurrencePanel instead of closing the dropdown.
function RecurrenceDropdown({ selectedDate, value, rule, onChange, onChangeRule }) {
  const [open, setOpen] = useState(false);
  const [showCustomPanel, setShowCustomPanel] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
        setShowCustomPanel(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const options = getRecurrenceOptions(selectedDate);
  const activeLabel =
    value === 'custom'
      ? describeCustomRule(rule, selectedDate)
      : (options.find((o) => o.value === value) || options[0]).label;

  return (
    <div className={styles.recurrenceDropdownWrap} ref={wrapRef}>
      <button
        type="button"
        className={styles.recurrenceTriggerBtn}
        onClick={() => {
          setOpen((prev) => !prev);
          setShowCustomPanel(false);
        }}
      >
        <span>{activeLabel}</span>
        <ChevronDown size={14} className={open ? styles.recurrenceChevronOpen : ''} />
      </button>

      {open && !showCustomPanel && (
        <div className={styles.recurrencePopup}>
          {options.map((opt) => (
            <button
              type="button"
              key={opt.value}
              className={`${styles.recurrenceOption} ${opt.value === value && value !== 'custom' ? styles.recurrenceOptionActive : ''}`}
              onClick={() => {
                if (opt.value === 'custom') {
                  setShowCustomPanel(true);
                  return;
                }
                onChange(opt.value);
                onChangeRule(null);
                setOpen(false);
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}

      {open && showCustomPanel && (
        <CustomRecurrencePanel
          initialRule={rule}
          anchorDate={selectedDate}
          onCancel={() => setShowCustomPanel(false)}
          onSave={(newRule) => {
            onChange('custom');
            onChangeRule(newRule);
            setOpen(false);
            setShowCustomPanel(false);
          }}
        />
      )}
    </div>
  );
}

// Google-Calendar-style color swatch popover — a grid of solid color dots
// plus an "Auto" option to clear a manual override and go back to the
// task's default hash-based color.
// Styled inline (rather than via CSS-module classes) so this renders
// correctly wherever it's mounted, independent of what the module defines.
function ColorSwatchPicker({ onSelect, onReset, onClose, defaultColor }) {
  const wrapRef = useRef(null);
  const [hoveredColor, setHoveredColor] = useState(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  return (
    <div
      ref={wrapRef}
      style={{
        position: 'absolute',
        top: 'calc(100% + 8px)',
        left: 0,
        zIndex: 50,
        background: '#fff',
        border: '1px solid rgba(0, 0, 0, 0.08)',
        borderRadius: '14px',
        boxShadow: '0 12px 32px -8px rgba(0, 0, 0, 0.22), 0 2px 8px rgba(0, 0, 0, 0.08)',
        padding: '14px',
        width: '236px'
      }}
    >
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '8px',
          marginBottom: '12px'
        }}
      >
        {GCAL_COLORS.map((c) => (
          <button
            type="button"
            key={c}
            title={c}
            onClick={() => onSelect(c)}
            onMouseEnter={() => setHoveredColor(c)}
            onMouseLeave={() => setHoveredColor(null)}
            style={{
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              backgroundColor: c,
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              boxShadow: hoveredColor === c
                ? `0 0 0 2px #fff, 0 0 0 4px ${c}`
                : 'none',
              transform: hoveredColor === c ? 'scale(1.12)' : 'scale(1)',
              transition: 'transform 0.15s ease, box-shadow 0.15s ease'
            }}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={onReset}
        title="Reset to default color"
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          background: 'var(--bg-input, #F3F4F6)',
          border: '1px solid var(--border-color, #E5E7EB)',
          borderRadius: '10px',
          padding: '9px 12px',
          fontSize: '13px',
          fontWeight: 600,
          color: 'var(--text-muted, #6B7280)',
          cursor: 'pointer'
        }}
      >
        <span
          aria-hidden="true"
          style={{
            width: '13px',
            height: '13px',
            borderRadius: '50%',
            border: `2px solid ${defaultColor}`,
            display: 'inline-block',
            flexShrink: 0
          }}
        />
        Default
      </button>
    </div>
  );
}

// Google-Calendar-style "view event" popover — opened by clicking a
// calendar block. Shows the full task (untruncated title, full date,
// full time range) regardless of how narrow the block itself is, with
// quick actions to complete, edit, or delete without leaving the grid.
// For Event-type items the "mark complete" toggle is replaced with an
// inert spacer — events aren't something you check off, and per design
// they don't get any circle marker at all (only Tasks show a tick).
//
// `occurrenceDate` is the specific day the clicked block was rendered
// on — for a recurring task this can differ from the task's own stored
// `date` (its original anchor day), so the popover shows the day that
// was actually clicked rather than always showing the anchor day.
function TaskViewPopover({ task, occurrenceDate, rect, color, onClose, onEdit, onDelete, onToggleComplete }) {
  const wrapRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        onClose();
      }
    }
    function handleKeyDown(e) {
      if (e.key === 'Escape') onClose();
    }
    // Closing on scroll/resize avoids the popover visually detaching
    // from the block it's anchored to (the grid scrolls horizontally
    // on narrow screens).
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('scroll', onClose, true);
    window.addEventListener('resize', onClose);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('scroll', onClose, true);
      window.removeEventListener('resize', onClose);
    };
  }, [onClose]);

  if (!task) return null;

  const isEvent = task.type === 'event';

  const POPOVER_WIDTH = 250;
  let left = rect.left;
  if (left + POPOVER_WIDTH > window.innerWidth - 12) left = window.innerWidth - POPOVER_WIDTH - 12;
  if (left < 12) left = 12;

  const ESTIMATED_HEIGHT = 210;
  let top = rect.bottom + 8;
  if (top + ESTIMATED_HEIGHT > window.innerHeight - 12) {
    top = Math.max(12, rect.top - ESTIMATED_HEIGHT - 8);
  }

  const dateForDisplay = occurrenceDate || task.date;
  const fullDate = dateForDisplay
    ? new Date(`${dateForDisplay}T00:00:00`).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    })
    : null;

  const recurrenceLabel = getRecurrenceLabel(task);

  return (
    <div
      ref={wrapRef}
      style={{
        position: 'fixed',
        top: `${top}px`,
        left: `${left}px`,
        zIndex: 100,
        width: `${POPOVER_WIDTH}px`,
        background: '#fff',
        borderRadius: '14px',
        boxShadow: '0 16px 40px -10px rgba(0, 0, 0, 0.28), 0 2px 8px rgba(0, 0, 0, 0.08)',
        border: '1px solid rgba(0, 0, 0, 0.08)',
        overflow: 'hidden'
      }}
    >
      <div style={{ height: '5px', backgroundColor: color.bg }} />

      <div style={{ padding: '14px 14px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
          {isEvent ? (
            <span
              aria-hidden="true"
              style={{
                width: '18px',
                height: '18px',
                flexShrink: 0,
                marginTop: '2px'
              }}
            />
          ) : (
            <button
              type="button"
              onClick={onToggleComplete}
              title={task.completed ? 'Mark incomplete' : 'Mark complete'}
              style={{
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                border: `1.5px solid ${task.completed ? color.bg : 'rgba(0,0,0,0.2)'}`,
                backgroundColor: task.completed ? color.bg : 'transparent',
                color: '#fff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                marginTop: '2px',
                padding: 0
              }}
            >
              {task.completed && <Check size={11} strokeWidth={3} />}
            </button>
          )}

          <h4
            style={{
              flex: 1,
              margin: 0,
              fontSize: '14px',
              fontWeight: 700,
              color: '#1a1a1a',
              lineHeight: 1.35,
              textDecoration: task.completed && !isEvent ? 'line-through' : 'none',
              opacity: task.completed && !isEvent ? 0.6 : 1
            }}
          >
            {isEvent && (
              <span style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#9a9a9a', marginRight: '6px' }}>
                Event
              </span>
            )}
            {task.title}
          </h4>

          <button
            type="button"
            onClick={onClose}
            title="Close"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#9a9a9a',
              padding: '2px',
              flexShrink: 0
            }}
          >
            <X size={14} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginTop: '10px', paddingLeft: '26px' }}>
          {fullDate && (
            <span style={{ fontSize: '12px', color: '#5a5a5a', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <CalendarIcon size={12} /> {fullDate}
            </span>
          )}
          <span style={{ fontSize: '12px', color: '#5a5a5a', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Clock size={12} /> {formatTime12h(task.startTime || task.time)} – {formatTime12h(task.endTime)}
          </span>
          <span style={{ fontSize: '12px', color: '#5a5a5a', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Clock size={12} /> {task.duration || '1h'}
          </span>
          {recurrenceLabel && (
            <span style={{ fontSize: '12px', color: '#5a5a5a', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Repeat size={12} /> {recurrenceLabel}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', gap: '6px', marginTop: '14px', paddingLeft: '26px' }}>
          <button
            type="button"
            onClick={onEdit}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '5px',
              background: '#f3f4f6',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '7px 10px',
              fontSize: '12px',
              fontWeight: 600,
              color: '#374151',
              cursor: 'pointer'
            }}
          >
            <Pencil size={12} /> Edit
          </button>
          <button
            type="button"
            onClick={onDelete}
            title="Delete Task"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              padding: '7px 10px',
              color: '#dc2626',
              cursor: 'pointer'
            }}
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}

export function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const store = useUserStore();

  // Dynamic timeline slots from user settings
  const TIME_SLOTS = store.getTimelineSlots();

  const [newTitle, setNewTitle] = useState('');
  const [newStartTime, setNewStartTime] = useState('10:00');
  const [newEndTime, setNewEndTime] = useState('11:00');
  const [newSelectedDate, setNewSelectedDate] = useState(new Date());
  const [newTaskColor, setNewTaskColor] = useState(null);
  const [newColorPickerOpen, setNewColorPickerOpen] = useState(false);
  // Event vs Task toggle for the Add form.
  const [newItemType, setNewItemType] = useState('task'); // 'task' | 'event'
  // Repeat setting for the item being created — 'none' | 'daily' | 'weekly'
  // | 'monthly' | 'annually' | 'weekday' | 'custom'. newRecurrenceRule only
  // applies when newRecurrence === 'custom' (interval/unit/weekdays/end).
  const [newRecurrence, setNewRecurrence] = useState('none');
  const [newRecurrenceRule, setNewRecurrenceRule] = useState(null);
  // A stable placeholder id used only to preview which default color the
  // next task will get (the real task gets its own id — and therefore its
  // own hashed color — at the moment it's actually created).
  const newTaskIdRef = useRef(`task-${Date.now()}`);
  const newTaskDefaultColor = GCAL_COLORS[hashStringToIndex(newTaskIdRef.current, GCAL_COLORS.length)];

  // Ref to the "Add Task" title input — used to scroll/focus it when the
  // user clicks a slot in the calendar grid (Google-Calendar-style quick add).
  const titleInputRef = useRef(null);

  // Edit task state
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editStartTime, setEditStartTime] = useState('');
  const [editEndTime, setEditEndTime] = useState('');

  // Which task is currently expanded to show its full details in the list.
  const [expandedTaskId, setExpandedTaskId] = useState(null);

  // The calendar-grid "view" popover — opened by clicking an event block,
  // especially useful when several tasks sit side by side at the same
  // time and each one is too narrow to read on its own. viewingOccurrenceDate
  // tracks which specific day's block was clicked (relevant for recurring
  // tasks, which render on multiple days from a single underlying record).
  const [viewingTaskId, setViewingTaskId] = useState(null);
  const [viewingOccurrenceDate, setViewingOccurrenceDate] = useState(null);
  const [viewingRect, setViewingRect] = useState(null);

  // Which task's color-swatch popover is currently open (task list only)
  const [colorPickerTaskId, setColorPickerTaskId] = useState(null);

  // Dashboard calendar grid: Day/Week view + navigation anchor
  const [calendarView, setCalendarView] = useState('week'); // 'day' | 'week'
  const [calendarAnchor, setCalendarAnchor] = useState(new Date());

  // Live clock, ticked every minute, purely to drive the "now" red line
  // in the grid (Google-Calendar-style current time indicator).
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60 * 1000);
    return () => clearInterval(id);
  }, []);

  // ---- Drag-to-resize state ----------------------------------------
  // dragInfoRef holds the mutable "is a drag in progress" info and never
  // triggers a re-render itself. resizePreview holds the live values used
  // purely for rendering the block while dragging. suppressClickRef stops
  // the grid cell's onClick (which opens edit mode) from firing right
  // after a drag ends.
  const dragInfoRef = useRef(null); // { taskId, edge: 'start'|'end', startY, origStartHour, origEndHour }
  const [resizePreview, setResizePreview] = useState(null); // { taskId, edge, previewStartHour, previewEndHour }
  const suppressClickRef = useRef(false);
  const storeRef = useRef(store);
  storeRef.current = store;

  const firstSlotHour = parseInt(TIME_SLOTS[0]?.split(':')[0] ?? '0', 10);
  const maxEndHour = parseInt(TIME_SLOTS[TIME_SLOTS.length - 1]?.split(':')[0] ?? '23', 10) + 1;
  const boundsRef = useRef({ firstSlotHour, maxEndHour });
  boundsRef.current = { firstSlotHour, maxEndHour };

  const calcDurationStable = (start, end) => {
    const sh = parseInt(start.split(':')[0], 10);
    const eh = parseInt(end.split(':')[0], 10);
    const diff = eh - sh;
    return diff > 0 ? `${diff}h` : '1h';
  };

  // Global mouse listeners for the active drag — attached once on mount.
  // All the moving parts (bounds, store) are read through refs so this
  // effect never needs to re-subscribe.
  useEffect(() => {
    const handleMouseMove = (e) => {
      const info = dragInfoRef.current;
      if (!info) return;
      const { firstSlotHour: minH, maxEndHour: maxH } = boundsRef.current;
      const deltaHours = Math.round((e.clientY - info.startY) / ROW_HEIGHT);

      if (info.edge === 'end') {
        const next = clamp(info.origEndHour + deltaHours, info.origStartHour + 1, maxH);
        setResizePreview({ taskId: info.taskId, edge: 'end', previewStartHour: info.origStartHour, previewEndHour: next });
      } else {
        const next = clamp(info.origStartHour + deltaHours, minH, info.origEndHour - 1);
        setResizePreview({ taskId: info.taskId, edge: 'start', previewStartHour: next, previewEndHour: info.origEndHour });
      }
    };

    const handleMouseUp = () => {
      const info = dragInfoRef.current;
      if (!info) return;

      setResizePreview((preview) => {
        const finalStartHour =
          preview?.taskId === info.taskId && preview.edge === 'start' ? preview.previewStartHour : info.origStartHour;
        const finalEndHour =
          preview?.taskId === info.taskId && preview.edge === 'end' ? preview.previewEndHour : info.origEndHour;

        const newStartTime = `${String(finalStartHour).padStart(2, '0')}:00`;
        const newEndTime = `${String(finalEndHour).padStart(2, '0')}:00`;

        const existingTasks = storeRef.current.user?.tasks || [];
        const updated = existingTasks.map((t) =>
          t.id === info.taskId
            ? {
              ...t,
              startTime: newStartTime,
              time: newStartTime,
              endTime: newEndTime,
              duration: calcDurationStable(newStartTime, newEndTime)
            }
            : t
        );
        storeRef.current.updateActiveUser((user) => ({ ...user, tasks: updated }));
        return null;
      });

      dragInfoRef.current = null;
      document.body.style.userSelect = '';
      suppressClickRef.current = true;
      setTimeout(() => { suppressClickRef.current = false; }, 0);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  // Starts a resize drag. edge is 'start' (drag the top handle, changes
  // start time) or 'end' (drag the bottom handle, changes end time/duration).
  const beginResize = (e, task, edge) => {
    e.stopPropagation();
    e.preventDefault();
    const startH = parseInt((task.startTime || task.time || '0').split(':')[0], 10);
    const endH = parseInt((task.endTime || String(startH + 1).padStart(2, '0') + ':00').split(':')[0], 10);
    dragInfoRef.current = { taskId: task.id, edge, startY: e.clientY, origStartHour: startH, origEndHour: endH };
    setResizePreview({ taskId: task.id, edge, previewStartHour: startH, previewEndHour: endH });
    document.body.style.userSelect = 'none';
  };

  const handleCalPrev = () => {
    setCalendarAnchor((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() - (calendarView === 'day' ? 1 : 7));
      return d;
    });
  };

  const handleCalNext = () => {
    setCalendarAnchor((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() + (calendarView === 'day' ? 1 : 7));
      return d;
    });
  };

  const handleCalToday = () => setCalendarAnchor(new Date());

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

    // Stored as an absolute date key — not a week-relative offset — so the
    // task stays pinned to the exact day it was created for. That date
    // also acts as the recurrence anchor: occurrences are only ever
    // projected forward from it (see taskOccursOnDate).
    const newTask = {
      id: `task-${Date.now()}`,
      title: newTitle.trim(),
      type: newItemType,
      startTime: newStartTime,
      endTime: newEndTime,
      time: newStartTime,
      duration: calcDuration(newStartTime, newEndTime),
      date: toDateKey(newSelectedDate),
      recurrence: newRecurrence,
      ...(newRecurrence === 'custom' && newRecurrenceRule ? { recurrenceRule: newRecurrenceRule } : {}),
      completed: false,
      // Only attach a color when the user picked one manually — otherwise
      // the task falls back to its stable hash-based default color.
      ...(newTaskColor ? { color: newTaskColor } : {})
    };

    const existingTasks = store.user?.tasks || [];
    const updatedUserTasks = [newTask, ...existingTasks];

    store.updateActiveUser((user) => ({
      ...user,
      tasks: updatedUserTasks
    }));

    setNewTitle('');
    setNewTaskColor(null);
    setNewRecurrence('none');
    setNewRecurrenceRule(null);
    newTaskIdRef.current = `task-${Date.now()}`;
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

  // Sets (or clears) a task's manual color override.
  const handleChangeTaskColor = (id, color) => {
    const existingTasks = store.user?.tasks || [];
    const updated = existingTasks.map((t) => {
      if (t.id !== id) return t;
      if (color === null) {
        const { color: _drop, ...rest } = t;
        return rest;
      }
      return { ...t, color };
    });
    store.updateActiveUser((user) => ({ ...user, tasks: updated }));
  };

  // Google-Calendar-style "click an empty slot to create" — clicking a
  // grid cell pre-fills the Add Task form with that EXACT day + time and
  // scrolls/focuses the title input so the user can just start typing.
  const handleSlotClick = (day, timeSlot) => {
    const h = parseInt(timeSlot.split(':')[0], 10);
    const endH = Math.min(h + 1, 23);
    const endTime = `${String(endH).padStart(2, '0')}:00`;

    setNewStartTime(timeSlot);
    setNewEndTime(endTime);
    setNewSelectedDate(day.fullDate);

    titleInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    titleInputRef.current?.focus();
  };

  // Days shown in the dashboard's display grid — respects Day/Week toggle + navigation
  const CALENDAR_DAYS = getCalendarDays(calendarView, calendarAnchor);

  // Per-day overlap layout — for each visible day, work out which tasks
  // occur on that day (including recurring ones — not just an exact date
  // match) and how many side-by-side columns each one needs, so the grid
  // below can render overlapping tasks next to each other instead of one
  // hiding behind another.
  const dayEventLayouts = {};
  CALENDAR_DAYS.forEach((day) => {
    const dayEvents = tasks
      .filter((t) => taskOccursOnDate(t, day.fullDate))
      .map((t) => {
        const startH = parseInt((t.startTime || t.time || '0').split(':')[0], 10);
        const endH = parseInt((t.endTime || String(startH + 1).padStart(2, '0') + ':00').split(':')[0], 10);
        const isPreviewing = resizePreview && resizePreview.taskId === t.id;
        const effStartH = isPreviewing ? resizePreview.previewStartHour : startH;
        const effEndH = isPreviewing ? resizePreview.previewEndHour : Math.max(endH, startH + 1);
        return { id: t.id, startH: effStartH, endH: effEndH };
      });

    const byId = {};
    layoutDayEvents(dayEvents).forEach((ev) => { byId[ev.id] = ev; });
    dayEventLayouts[day.dateKey] = byId;
  });

  // Header label for the display grid: single date in Day view, range in Week view
  const calendarRangeLabel =
    calendarView === 'day'
      ? calendarAnchor.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
      : (() => {
        const first = CALENDAR_DAYS[0]?.fullDate;
        const last = CALENDAR_DAYS[CALENDAR_DAYS.length - 1]?.fullDate;
        if (!first || !last) return '';
        const firstLabel = first.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const lastLabel = last.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        return `${firstLabel} – ${lastLabel}`;
      })();

  // Solid task color — uses the task's manual override if set, otherwise
  // falls back to a color hashed from the task's own id (stable, never
  // shifts as other tasks are added/removed).
  //
  // `bg` is the full-strength solid color again (the muted/translucent
  // version was harder to read at a glance than a real color block).
  // What changed instead is `text`/`pillBg`: rather than hardcoding white
  // on every color, each task's text and the small "1h" duration badge
  // now pick light-or-dark based on that specific color's luminance — so
  // a light color like the yellow/khaki swatches gets dark text (and a
  // dark, not light, badge) while a dark navy/brown swatch keeps white —
  // that's what was making "1h" unreadable on the lighter cards before.
  const getTaskColor = (task) => {
    const base = task.color || GCAL_COLORS[hashStringToIndex(task.id, GCAL_COLORS.length)];
    const isLight = getLuminance(base) > 0.5;
    const text = isLight ? '#20242B' : '#FFFFFF';
    return {
      bg: base,
      border: darken(base),
      text,
      pillBg: isLight ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.22)',
      pillBorder: isLight ? 'rgba(0, 0, 0, 0.14)' : 'rgba(255, 255, 255, 0.3)'
    };
  };

  // Current-time fraction (0–1) through the hour, for positioning the "now" line
  const nowHour = now.getHours();
  const nowMinuteFrac = now.getMinutes() / 60;

  // Pixel offset for the now-line overlay on the weekly grid.
  // Header row is ~40px; each hour slot is ROW_HEIGHT (49px).
  const HEADER_ROW_HEIGHT = 40;
  const nowLineTop = nowHour >= firstSlotHour
    ? HEADER_ROW_HEIGHT + (nowHour - firstSlotHour) * ROW_HEIGHT + nowMinuteFrac * ROW_HEIGHT
    : null;

  // Index (0-based) of today among the visible day columns — used to
  // clip the now-line so it only reaches today's column right edge.
  const todayColIndex = CALENDAR_DAYS.findIndex((d) => d.isToday);

  // Looked up fresh from `tasks` each render (rather than storing the task
  // object itself) so toggling complete / editing / deleting from the
  // popover is reflected immediately instead of showing stale data.
  const viewingTask = viewingTaskId ? tasks.find((t) => t.id === viewingTaskId) : null;

  return (
    <div className={styles.dashboardContainer}>
      {/* Middle Task Panel ("Today" Workspace) */}
      <div className={styles.taskPanel}>

        {/* Unheaded Daily Insights Certified Quote */}
        <QuoteWidget />

        {/* Task Input Box */}
        <form onSubmit={handleCreateTask} className={styles.inputCard}>
          {/* Event / Task toggle — mirrors Google Calendar's Add-title tabs */}
          <div className={styles.typeTabs}>
            <button
              type="button"
              className={`${styles.typeTab} ${newItemType === 'event' ? styles.typeTabActive : ''}`}
              onClick={() => setNewItemType('event')}
            >
              Event
            </button>
            <button
              type="button"
              className={`${styles.typeTab} ${newItemType === 'task' ? styles.typeTabActive : ''}`}
              onClick={() => setNewItemType('task')}
            >
              Task
            </button>
          </div>

          <input
            type="text"
            placeholder={
              newItemType === 'event'
                ? `Add an event for today`
                : `What would you like to accomplish today?`
            }
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className={styles.taskInput}
            ref={titleInputRef}
          />

          {/* Repeat / recurrence field — Google-Calendar-style full-width
              dropdown, its options recomputed from whichever date is
              currently selected below. "Custom…" opens an inline panel for
              interval/unit, weekday selection, and an end condition. */}
          <div className={styles.recurrenceRow}>
            <RecurrenceDropdown
              selectedDate={newSelectedDate}
              value={newRecurrence}
              rule={newRecurrenceRule}
              onChange={setNewRecurrence}
              onChangeRule={setNewRecurrenceRule}
            />
          </div>

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
                <option key={t} value={t}>Start: {formatTime12h(t)}</option>
              ))}
            </select>

            <select
              value={newEndTime}
              onChange={(e) => setNewEndTime(e.target.value)}
              className={styles.selectMeta}
              title="End Time"
            >
              {TIME_SLOTS.map((t) => (
                <option key={t} value={t}>End: {formatTime12h(t)}</option>
              ))}
            </select>

            <DateDropdown selectedDate={newSelectedDate} onSelect={setNewSelectedDate} />

            <div style={{ position: 'relative' }}>
              <button
                type="button"
                className={`${styles.selectMeta} ${styles.dateTriggerBtn}`}
                onClick={() => setNewColorPickerOpen((prev) => !prev)}
                title="Task Color"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  whiteSpace: 'nowrap'
                }}
              >
                <span
                  aria-hidden="true"
                  style={{
                    width: '13px',
                    height: '13px',
                    borderRadius: '50%',
                    flexShrink: 0,
                    backgroundColor: newTaskColor || 'transparent',
                    border: newTaskColor ? 'none' : `2px solid ${newTaskDefaultColor}`
                  }}
                />
                {newTaskColor ? 'Custom' : 'Color'}
              </button>

              {newColorPickerOpen && (
                <ColorSwatchPicker
                  defaultColor={newTaskDefaultColor}
                  onSelect={(c) => {
                    setNewTaskColor(c);
                    setNewColorPickerOpen(false);
                  }}
                  onReset={() => {
                    setNewTaskColor(null);
                    setNewColorPickerOpen(false);
                  }}
                  onClose={() => setNewColorPickerOpen(false)}
                />
              )}
            </div>

            <Button type="submit" size="sm" variant="primary" icon={Plus} style={{ marginLeft: 'auto' }}>
              {newItemType === 'event' ? 'Add Event' : 'Add Task'}
            </Button>
          </div>
        </form>

        {/* Tasks List */}
        {tasks.length > 0 ? (
          <div className={styles.tasksList}>
            {tasks.map((task) => {
              const color = getTaskColor(task);
              const isEditing = editingTaskId === task.id;
              const isEventItem = task.type === 'event';
              return (
                <div
                  key={task.id}
                  className={`${styles.taskCard} ${task.completed && !isEventItem ? styles.completedTaskCard : ''}`}
                  style={{ borderLeft: `3px solid ${color.border}`, backgroundColor: color.bg }}
                >
                  {isEventItem ? (
                    // Events aren't completable — no checkbox, and no
                    // placeholder circle either. An empty spacer keeps the
                    // title aligned with task cards that do have one.
                    <span
                      aria-hidden="true"
                      style={{ width: '18px', height: '18px', flexShrink: 0, marginTop: '2px' }}
                    />
                  ) : (
                    <button
                      className={`${styles.checkbox} ${task.completed ? styles.checked : ''}`}
                      onClick={() => handleToggleTask(task.id)}
                    >
                      {task.completed && <Check size={12} strokeWidth={3} />}
                    </button>
                  )}

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
                              <option key={t} value={t}>Start: {formatTime12h(t)}</option>
                            ))}
                          </select>
                          <select
                            value={editEndTime}
                            onChange={(e) => setEditEndTime(e.target.value)}
                            className={styles.selectMeta}
                          >
                            {TIME_SLOTS.map((t) => (
                              <option key={t} value={t}>End: {formatTime12h(t)}</option>
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
                      /* Display Mode — click the card body to expand and see
                         the full task (untruncated title, full date, full
                         time range) without jumping into edit mode. */
                      (() => {
                        const isExpanded = expandedTaskId === task.id;
                        const fullDate = task.date
                          ? new Date(`${task.date}T00:00:00`).toLocaleDateString('en-US', {
                            weekday: 'long',
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric'
                          })
                          : null;
                        const recurrenceLabel = getRecurrenceLabel(task);
                        return (
                          <div
                            className={styles.taskMainInfoClickable}
                            onClick={() => setExpandedTaskId((prev) => (prev === task.id ? null : task.id))}
                          >
                            <div className={styles.taskTitleRow}>
                              <h4
                                className={[
                                  styles.taskTitle,
                                  task.completed && !isEventItem ? styles.completedTitle : '',
                                  isExpanded ? styles.taskTitleExpanded : styles.taskTitleCollapsed
                                ].filter(Boolean).join(' ')}
                                style={{ color: color.text }}
                              >
                                {task.title}
                              </h4>
                              {isEventItem && (
                                <span className={styles.eventTypeTag} style={{ color: color.text }}>
                                  Event
                                </span>
                              )}
                              <span
                                className={styles.durationPill}
                                style={{
                                  color: color.text,
                                  backgroundColor: color.pillBg,
                                  borderColor: color.pillBorder
                                }}
                              >
                                {task.duration || '1h'}
                              </span>
                              <ChevronDown
                                size={13}
                                className={`${styles.expandChevron} ${isExpanded ? styles.expandChevronOpen : ''}`}
                                style={{ color: color.text }}
                              />
                            </div>

                            <div className={styles.badgeRow}>
                              <span style={{ fontSize: '10px', color: color.text, opacity: 0.7, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Clock size={10} />
                                {formatTime12h(task.startTime || task.time)} — {formatTime12h(task.endTime)}
                              </span>
                              {recurrenceLabel && (
                                <span style={{ fontSize: '10px', color: color.text, opacity: 0.7, display: 'flex', alignItems: 'center' }} title={recurrenceLabel}>
                                  <Repeat size={10} />
                                </span>
                              )}
                            </div>

                            {isExpanded && (
                              <div
                                className={styles.taskExpandedDetails}
                                style={{ borderTopColor: `${color.text}33` }}
                              >
                                {fullDate && (
                                  <span className={styles.expandedDetailRow} style={{ color: color.text }}>
                                    <CalendarIcon size={11} /> {fullDate}
                                  </span>
                                )}
                                <span className={styles.expandedDetailRow} style={{ color: color.text }}>
                                  <Clock size={11} /> {task.duration || '1h'} scheduled
                                </span>
                                {recurrenceLabel && (
                                  <span className={styles.expandedDetailRow} style={{ color: color.text }}>
                                    <Repeat size={11} /> {recurrenceLabel}
                                  </span>
                                )}
                                {!isEventItem && task.completed && (
                                  <span className={styles.expandedDetailRow} style={{ color: color.text }}>
                                    <Check size={11} /> Completed
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })()
                    )}
                  </div>

                  {!isEditing && (
                    <div className={styles.taskActions}>
                      <div style={{ position: 'relative' }}>
                        <button
                          className={styles.actionBtn}
                          onClick={() => setColorPickerTaskId((prev) => (prev === task.id ? null : task.id))}
                          title="Change Color"
                          style={{ color: color.text, opacity: 0.6 }}
                        >
                          <Palette size={14} />
                        </button>
                        {colorPickerTaskId === task.id && (
                          <ColorSwatchPicker
                            defaultColor={GCAL_COLORS[hashStringToIndex(task.id, GCAL_COLORS.length)]}
                            onSelect={(c) => {
                              handleChangeTaskColor(task.id, c);
                              setColorPickerTaskId(null);
                            }}
                            onReset={() => {
                              handleChangeTaskColor(task.id, null);
                              setColorPickerTaskId(null);
                            }}
                            onClose={() => setColorPickerTaskId(null)}
                          />
                        )}
                      </div>
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
        <div className={styles.gridHeader} style={{ flexWrap: 'wrap', rowGap: '10px' }}>
          <div className={styles.gridMonthTitle}>
            <CalendarIcon size={18} style={{ color: 'var(--primary)' }} />
            <span>{calendarRangeLabel}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            {/* Day / Week toggle */}
            <div style={{ display: 'flex', border: '1px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden' }}>
              <button
                onClick={() => setCalendarView('day')}
                style={{
                  padding: '5px 10px',
                  fontSize: '12px',
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                  background: calendarView === 'day' ? 'var(--primary)' : 'var(--bg-input)',
                  color: calendarView === 'day' ? 'var(--on-primary)' : 'var(--text-muted)',
                  transition: 'background-color 0.2s ease, color 0.2s ease'
                }}
              >
                Day
              </button>
              <button
                onClick={() => setCalendarView('week')}
                style={{
                  padding: '5px 10px',
                  fontSize: '12px',
                  fontWeight: 600,
                  border: 'none',
                  borderLeft: '1px solid var(--border-color)',
                  cursor: 'pointer',
                  background: calendarView === 'week' ? 'var(--primary)' : 'var(--bg-input)',
                  color: calendarView === 'week' ? 'var(--on-primary)' : 'var(--text-muted)',
                  transition: 'background-color 0.2s ease, color 0.2s ease'
                }}
              >
                Week
              </button>
            </div>

            {/* Prev / Today / Next navigation for the grid above */}
            <button
              onClick={handleCalPrev}
              title={calendarView === 'day' ? 'Previous Day' : 'Previous Week'}
              style={{
                background: 'var(--bg-input)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-muted)',
                borderRadius: '6px',
                padding: '5px 7px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <ChevronLeft size={14} />
            </button>

            <button
              onClick={handleCalToday}
              style={{
                background: 'var(--bg-input)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-muted)',
                borderRadius: '6px',
                padding: '5px 10px',
                cursor: 'pointer',
                fontSize: '11px',
                fontWeight: 600
              }}
            >
              Today
            </button>

            <button
              onClick={handleCalNext}
              title={calendarView === 'day' ? 'Next Day' : 'Next Week'}
              style={{
                background: 'var(--bg-input)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-muted)',
                borderRadius: '6px',
                padding: '5px 7px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <ChevronRight size={14} />
            </button>

            {/* Expand to full calendar view — icon-only button */}
            <button
              onClick={() => navigate('/app/calendar')}
              title="Open full calendar view"
              style={{
                background: 'var(--bg-input)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-muted)',
                borderRadius: '6px',
                padding: '5px 7px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--primary)';
                e.currentTarget.style.borderColor = 'var(--primary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--text-muted)';
                e.currentTarget.style.borderColor = 'var(--border-color)';
              }}
            >
              <Maximize2 size={14} />
            </button>
          </div>
        </div>

        {/* Weekly Table Grid */}
        <div className={styles.weeklyTableWrapper} style={{ position: 'relative' }}>
          <div
            key={`${calendarView}-${calendarAnchor.toDateString()}`}
            className={styles.weeklyTable}
            style={{ gridTemplateColumns: `50px repeat(${CALENDAR_DAYS.length}, 1fr)` }}
          >
            {/* Time Column Header */}
            <div className={styles.timeColHeader}></div>

            {/* Weekday Columns Header */}
            {CALENDAR_DAYS.map((day) => (
              <div
                key={day.dateKey}
                className={`${styles.dayColHeader} ${day.isToday ? styles.activeDayHeader : ''}`}
              >
                <span className={styles.dayNameFull}>{day.name}</span>
                <span className={styles.dayNameShort}>{day.shortName}</span>
                <span className={styles.dayDateNum}>{day.dateNum}</span>
              </div>
            ))}

            {/* Hourly Time Rows */}
            {TIME_SLOTS.map((timeSlot) => {
              const slotHour = parseInt(timeSlot.split(':')[0], 10);
              return (
                <>
                  {/* Time Label Cell */}
                  <div key={`time-${timeSlot}`} className={styles.timeSlotCell}>
                    {formatTime12h(timeSlot)}
                  </div>

                  {/* Grid Slot Cells for Each Day */}
                  {CALENDAR_DAYS.map((day) => {
                    // Find ALL tasks whose START time matches this slot, on this
                    // exact date (including recurring tasks that occur on this
                    // date without having been created on it — see
                    // taskOccursOnDate) — there can be more than one if tasks
                    // overlap.
                    const startingTasks = tasks.filter(
                      (t) =>
                        taskOccursOnDate(t, day.fullDate) &&
                        (t.startTime || t.time) === timeSlot
                    );

                    // Find if another task spans over this slot (but didn't start here)
                    const spanningTask = startingTasks.length === 0 && tasks.find((t) => {
                      if (!taskOccursOnDate(t, day.fullDate)) return false;
                      const startH = parseInt((t.startTime || t.time || '0').split(':')[0], 10);
                      const endH = parseInt((t.endTime || String(startH + 1).padStart(2, '0') + ':00').split(':')[0], 10);
                      return slotHour > startH && slotHour < endH;
                    });

                    // Google-Calendar-style red "now" line — only in today's
                    // column, in the row matching the current hour.
                    const showNowLine = day.isToday && slotHour === nowHour;

                    return (
                      <div
                        key={`slot-${day.dateKey}-${timeSlot}`}
                        className={styles.gridSlotCell}
                        style={{ overflow: startingTasks.length ? 'visible' : 'hidden', zIndex: startingTasks.length ? 2 : 1, cursor: 'pointer' }}
                        onClick={() => {
                          // Skip if this click is the tail end of a resize drag.
                          if (suppressClickRef.current) return;

                          // Google-Calendar-style: clicking an occupied slot opens
                          // that task for editing; clicking empty space quick-creates
                          // a new task at that exact day + time.
                          const occupyingTask = startingTasks[0] || spanningTask;
                          if (occupyingTask) {
                            handleEditTask(occupyingTask);
                            titleInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            return;
                          }
                          handleSlotClick(day, timeSlot);
                        }}
                      >
                        {startingTasks.map((task) => {
                          const color = getTaskColor(task);
                          const isPreviewing = resizePreview && resizePreview.taskId === task.id;
                          const isEventItem = task.type === 'event';

                          const baseStartH = slotHour; // task is matched on this exact slot
                          const baseEndH = parseInt(
                            (task.endTime || String(baseStartH + 1).padStart(2, '0') + ':00').split(':')[0],
                            10
                          );

                          const effStartH = isPreviewing ? resizePreview.previewStartHour : baseStartH;
                          const effEndH = isPreviewing ? resizePreview.previewEndHour : baseEndH;
                          const span = Math.max(effEndH - effStartH, 1);

                          // 49px = cell height (48px) + 1px gap
                          const height = span * ROW_HEIGHT - 1;
                          const topOffset = 4 + (effStartH - baseStartH) * ROW_HEIGHT;

                          // Side-by-side placement when this task overlaps others
                          // on the same day — col/colCount come from the per-day
                          // layout computed above (dayEventLayouts).
                          const { col = 0, colCount = 1 } = dayEventLayouts[day.dateKey]?.[task.id] || {};
                          const widthPct = 100 / colCount;

                          return (
                            <div
                              key={task.id}
                              className={[
                                styles.eventBlockCard,
                                task.completed && !isEventItem ? styles.eventBlockCompleted : '',
                                isEventItem ? styles.eventBlockHighlight : ''
                              ].filter(Boolean).join(' ')}
                              style={{
                                backgroundColor: color.bg,
                                borderLeftColor: color.border,
                                color: color.text,
                                height: `${height}px`,
                                position: 'absolute',
                                top: `${topOffset}px`,
                                left: `calc(${col * widthPct}% + 3px)`,
                                width: `calc(${widthPct}% - 6px)`,
                                zIndex: isPreviewing ? 5 : 3,
                                borderRadius: '6px',
                                padding: '6px 8px',
                                boxShadow: colCount > 1 ? '0 0 0 2px var(--bg-card, #fff)' : 'none',
                                overflow: 'hidden'
                              }}
                              onClick={(e) => {
                                // Stop this from bubbling to the parent grid
                                // cell — that handler just grabs
                                // startingTasks[0], which is why clicking a
                                // yellow or blue block used to always act on
                                // the first (gray) task in the slot instead
                                // of the one actually clicked.
                                e.stopPropagation();
                                if (suppressClickRef.current) return;
                                const rect = e.currentTarget.getBoundingClientRect();
                                setViewingTaskId(task.id);
                                setViewingOccurrenceDate(day.dateKey);
                                setViewingRect({ top: rect.top, left: rect.left, bottom: rect.bottom, right: rect.right });
                              }}
                            >
                              {/* Top resize handle — drag to change start time */}
                              <div
                                className={styles.resizeHandleTop}
                                onMouseDown={(e) => beginResize(e, task, 'start')}
                                onClick={(e) => e.stopPropagation()}
                              />

                              <span style={{ fontWeight: 600, color: color.text, textDecoration: task.completed && !isEventItem ? 'line-through' : 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                {!isEventItem && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleToggleTask(task.id);
                                    }}
                                    title={task.completed ? 'Mark incomplete' : 'Mark complete'}
                                    style={{
                                      width: '11px',
                                      height: '11px',
                                      borderRadius: '50%',
                                      border: `1.5px solid ${color.text}`,
                                      backgroundColor: task.completed ? color.text : 'transparent',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      flexShrink: 0,
                                      cursor: 'pointer',
                                      padding: 0
                                    }}
                                  >
                                    {task.completed && <Check size={7} strokeWidth={4} color={color.bg} />}
                                  </button>
                                )}
                                {isEventItem && (
                                  <span style={{ fontSize: '8px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', opacity: 0.85, flexShrink: 0 }}>
                                    Event
                                  </span>
                                )}
                                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{task.title}</span>
                              </span>
                              <span style={{ fontSize: '9px', opacity: 0.85, marginTop: '2px', color: color.text }}>
                                {formatTime12h(`${String(effStartH).padStart(2, '0')}:00`)} – {formatTime12h(`${String(effEndH).padStart(2, '0')}:00`)}
                              </span>

                              {/* Bottom resize handle — drag to change end time / duration */}
                              <div
                                className={styles.resizeHandleBottom}
                                onMouseDown={(e) => beginResize(e, task, 'end')}
                                onClick={(e) => e.stopPropagation()}
                              />
                            </div>
                          );
                        })}


                        {/* Hide content for cells covered by a spanning task */}
                      </div>
                    );
                  })}
                </>
              );
            })}
          </div>

          {/* Current-time indicator — full-width red line across all columns */}
          {nowLineTop !== null && todayColIndex !== -1 && (
            <div
              className={styles.nowLine}
              style={{
                top: `${nowLineTop}px`,
                // Start at today's column left edge
                left: `calc(50px + ${todayColIndex} / ${CALENDAR_DAYS.length} * (100% - 50px))`,
                // End at today's column right edge
                right: `calc(${CALENDAR_DAYS.length - todayColIndex - 1} / ${CALENDAR_DAYS.length} * (100% - 50px))`
              }}
            >
              <span className={styles.nowLineDot} />
            </div>
          )}
        </div>
      </div>

      {viewingTask && viewingRect && (
        <TaskViewPopover
          task={viewingTask}
          occurrenceDate={viewingOccurrenceDate}
          rect={viewingRect}
          color={getTaskColor(viewingTask)}
          onClose={() => {
            setViewingTaskId(null);
            setViewingOccurrenceDate(null);
          }}
          onToggleComplete={() => handleToggleTask(viewingTask.id)}
          onEdit={() => {
            handleEditTask(viewingTask);
            setViewingTaskId(null);
            setViewingOccurrenceDate(null);
            titleInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }}
          onDelete={() => {
            handleDeleteTask(viewingTask.id);
            setViewingTaskId(null);
            setViewingOccurrenceDate(null);
          }}
        />
      )}
    </div>
  );
}