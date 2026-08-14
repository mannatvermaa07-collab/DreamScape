import { useState, useRef, forwardRef, useImperativeHandle, useEffect } from 'react';
import { Plus, Search, Calendar, Feather, X, Check, LayoutGrid, Layers, CalendarDays } from 'lucide-react';
import { useJournal } from '../hooks/useJournal';
import { JournalCard } from '../components/ui/JournalCard';
import { JournalDeck } from '../components/ui/JournalDeck';
import { JournalHeatmap } from '../components/ui/JournalHeatmap';
import { WeatherBackdrop } from '../components/ui/WeatherBackdrop';
import { MOOD_META, MOOD_LIST } from '../components/ui/journalMoods';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import styles from '../styles/JournalPage.module.css';

const labelStyle = { display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '7px', fontWeight: 600 };
const inputStyle = {
  width: '100%',
  backgroundColor: 'var(--bg-input)',
  border: '1px solid var(--border-color)',
  borderRadius: 'var(--radius-md)',
  padding: '11px 14px',
  color: 'var(--text-main)',
  fontSize: '14px'
};

// Shared by the Edit modal (creation now happens inline via QuickComposer).
function JournalForm({ formData, setFormData, onSubmit, submitLabel }) {
  return (
    <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      <div>
        <label style={labelStyle}>Title</label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="Give today a headline..."
          required
          style={inputStyle}
        />
      </div>

      <div>
        <label style={labelStyle}>How's the weather?</label>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {MOOD_LIST.map((m) => {
            const meta = MOOD_META[m];
            const Icon = meta.icon;
            const isActive = formData.mood === m;
            return (
              <button
                type="button"
                key={m}
                onClick={() => setFormData({ ...formData, mood: m })}
                title={meta.label}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '5px',
                  width: '64px',
                  padding: '10px 6px',
                  borderRadius: 'var(--radius-md)',
                  border: `1.5px solid ${isActive ? meta.color : 'var(--border-color)'}`,
                  backgroundColor: isActive ? `${meta.color}18` : 'var(--bg-input)',
                  color: isActive ? meta.color : 'var(--text-muted)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  transform: isActive ? 'translateY(-2px)' : 'none',
                  boxShadow: isActive ? `0 4px 12px -4px ${meta.color}66` : 'none'
                }}
              >
                <Icon size={18} />
                <span style={{ fontSize: '10px', fontWeight: 600 }}>{meta.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label style={labelStyle}>What's on your mind?</label>
        <textarea
          value={formData.content}
          onChange={(e) => setFormData({ ...formData, content: e.target.value })}
          placeholder="Start writing..."
          rows={9}
          required
          style={{
            width: '100%',
            backgroundColor: 'var(--bg-input)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            padding: '16px 18px',
            color: 'var(--text-main)',
            resize: 'vertical',
            fontFamily: "Georgia, 'Times New Roman', serif",
            fontSize: '14.5px',
            lineHeight: '1.9',
            backgroundImage: 'repeating-linear-gradient(transparent, transparent 31px, var(--border-subtle) 32px)',
            backgroundAttachment: 'local'
          }}
        />
      </div>

      <Button type="submit" variant="primary" size="lg" fullWidth icon={Plus}>
        {submitLabel}
      </Button>
    </form>
  );
}

// Google-Keep-style inline composer: collapsed it's just a "jot something
// down..." bar; clicking it expands into a title + mood picker + textarea,
// right in place — no modal jump. Clicking outside auto-saves if there's
// content (just like Keep), otherwise it quietly collapses.
const QuickComposer = forwardRef(function QuickComposer({ onSave }, ref) {
  const [expanded, setExpanded] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mood, setMood] = useState('Neutral');
  const [justSaved, setJustSaved] = useState(false);
  const wrapRef = useRef(null);
  const titleInputRef = useRef(null);

  const expandAndFocus = () => {
    setExpanded(true);
    requestAnimationFrame(() => titleInputRef.current?.focus());
  };

  useImperativeHandle(ref, () => ({ expand: expandAndFocus }));

  const reset = () => {
    setTitle('');
    setContent('');
    setMood('Neutral');
  };

  const commit = () => {
    if (title.trim() || content.trim()) {
      onSave({
        title: title.trim() || 'Untitled',
        content: content.trim(),
        mood
      });
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 1400);
    }
    reset();
    setExpanded(false);
  };

  const cancel = () => {
    reset();
    setExpanded(false);
  };

  useEffect(() => {
    if (!expanded) return;
    function handleClickOutside(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        commit();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expanded, title, content, mood]);

  return (
    <div id="journal-composer" className={styles.composerWrap} data-expanded={expanded} ref={wrapRef}>
      <div
        className={styles.composerCollapsedRow}
        style={{ display: expanded ? 'none' : 'flex' }}
        onClick={expandAndFocus}
      >
        <Feather size={16} style={{ color: 'var(--text-dim)' }} />
        <span>Jot something down...</span>
        <Plus size={16} style={{ marginLeft: 'auto', color: 'var(--primary)' }} />
      </div>

      <div className={styles.composerExpandedBody} style={{ display: expanded ? 'flex' : 'none' }}>
        <input
          ref={titleInputRef}
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title (optional)"
          className={styles.composerTitleInput}
          onKeyDown={(e) => { if (e.key === 'Escape') cancel(); }}
        />

        <div className={styles.composerMoodRow}>
          {MOOD_LIST.map((m, i) => {
            const meta = MOOD_META[m];
            const Icon = meta.icon;
            const isActive = mood === m;
            return (
              <button
                type="button"
                key={m}
                onClick={() => setMood(m)}
                title={meta.label}
                className={styles.composerMoodChip}
                style={{
                  animationDelay: `${i * 35}ms`,
                  borderColor: isActive ? meta.color : 'var(--border-color)',
                  backgroundColor: isActive ? `${meta.color}1f` : 'var(--bg-input)',
                  color: isActive ? meta.color : 'var(--text-muted)',
                  transform: isActive ? 'translateY(-2px) scale(1.05)' : 'none',
                  boxShadow: isActive ? `0 4px 12px -4px ${meta.color}66` : 'none'
                }}
              >
                <Icon size={15} />
                <span>{meta.label}</span>
              </button>
            );
          })}
        </div>

        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Start writing..."
          rows={5}
          className={styles.composerTextarea}
        />

        <div className={styles.composerActionsRow}>
          <span className={`${styles.savedBadge} ${justSaved ? styles.savedBadgeShow : ''}`}>
            <Check size={12} /> Saved
          </span>
          <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto' }}>
            <button type="button" className={styles.composerCancelBtn} onClick={cancel}>
              <X size={13} /> Cancel
            </button>
            <button type="button" className={styles.composerSaveBtn} onClick={commit}>
              <Plus size={13} /> Add note
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

export function JournalPage() {
  const { entries, addEntry, updateEntry, deleteEntry } = useJournal();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMoodFilter, setSelectedMoodFilter] = useState('ALL');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'deck' | 'heatmap'

  // Modals
  const [viewingEntry, setViewingEntry] = useState(null);
  const [editingEntry, setEditingEntry] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    mood: 'Neutral'
  });

  const composerRef = useRef(null);
  const focusComposer = () => {
    composerRef.current?.expand();
    document.getElementById('journal-composer')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const handleOpenEditModal = (entry) => {
    setEditingEntry(entry);
    setFormData({
      title: entry.title,
      content: entry.content,
      mood: entry.mood || 'Neutral'
    });
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (!editingEntry || !formData.title.trim()) return;
    updateEntry(editingEntry.id, formData);
    setEditingEntry(null);
  };

  const filteredEntries = entries.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesMood =
      selectedMoodFilter === 'ALL' || item.mood === selectedMoodFilter;
    return matchesSearch && matchesMood;
  });

  // Backdrop mood: whichever mood filter is active, else the most recent entry
  const backdropMood = selectedMoodFilter !== 'ALL' ? selectedMoodFilter : (entries[0]?.mood || 'Neutral');

  return (
    <div className={styles.container}>
      <WeatherBackdrop mood={backdropMood} />

      {/* Header */}
      <div className={styles.topBar}>
        <div className={styles.titleBlock}>
          <h1 className={styles.pageTitle}>
            <Feather size={22} className={styles.titleIcon} aria-hidden="true" />
            Notes
          </h1>
          <p className={styles.pageSubhead}>
            Some skies are clearer than others — {entries.length} {entries.length === 1 ? 'note' : 'notes'} saved.
          </p>
        </div>

        <div className={entries.length === 0 ? styles.ctaGlowWrap : undefined}>
          <Button variant="primary" icon={Plus} onClick={focusComposer}>
            New Note
          </Button>
        </div>
      </div>

      {/* Search & Mood Filter */}
      <div className={styles.searchFilterBar}>
        <div className={styles.searchBox}>
          <Search size={14} />
          <input
            type="text"
            placeholder="Search your entries..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        <div className={styles.moodFilterRow}>
          <button
            className={`${styles.moodDot} ${styles.moodDotAll} ${selectedMoodFilter === 'ALL' ? styles.moodDotActive : ''}`}
            style={
              selectedMoodFilter === 'ALL'
                ? { backgroundColor: 'var(--primary)', borderColor: 'var(--primary)', color: 'var(--on-primary, #fff)', '--mood-pulse-color': 'var(--primary-light)' }
                : { color: 'var(--text-muted)', borderColor: 'var(--border-color)' }
            }
            onClick={() => setSelectedMoodFilter('ALL')}
            title="All moods"
          >
            All
          </button>
          {MOOD_LIST.map((m) => {
            const meta = MOOD_META[m];
            const Icon = meta.icon;
            const isActive = selectedMoodFilter === m;
            return (
              <button
                key={m}
                className={`${styles.moodDot} ${isActive ? styles.moodDotActive : ''}`}
                style={
                  isActive
                    ? { backgroundColor: meta.color, borderColor: meta.color, color: meta.onColor, '--mood-pulse-color': `${meta.color}55` }
                    : { color: meta.color, borderColor: `${meta.color}55` }
                }
                onClick={() => setSelectedMoodFilter(m)}
                title={meta.label}
              >
                <Icon size={15} />
              </button>
            );
          })}
        </div>
      </div>

      {/* View toggle: Grid / Deck / Heatmap */}
      <div className={styles.viewToggleRow}>
        <div className={styles.viewToggleGroup}>
          <button
            type="button"
            className={`${styles.viewToggleBtn} ${viewMode === 'grid' ? styles.viewToggleBtnActive : ''}`}
            onClick={() => setViewMode('grid')}
          >
            <LayoutGrid size={13} /> Grid
          </button>
          <button
            type="button"
            className={`${styles.viewToggleBtn} ${viewMode === 'deck' ? styles.viewToggleBtnActive : ''}`}
            onClick={() => setViewMode('deck')}
          >
            <Layers size={13} /> Deck
          </button>
          <button
            type="button"
            className={`${styles.viewToggleBtn} ${viewMode === 'heatmap' ? styles.viewToggleBtnActive : ''}`}
            onClick={() => setViewMode('heatmap')}
          >
            <CalendarDays size={13} /> Heatmap
          </button>
        </div>
      </div>

      {/* Quick Composer — Keep-style inline note creation */}
      <QuickComposer ref={composerRef} onSave={addEntry} />

      {/* Main content — switches based on viewMode */}
      {viewMode === 'heatmap' ? (
        <JournalHeatmap entries={filteredEntries} />
      ) : viewMode === 'deck' ? (
        filteredEntries.length > 0 ? (
          <JournalDeck entries={filteredEntries} onEdit={handleOpenEditModal} onDelete={deleteEntry} />
        ) : (
          <div className={styles.emptyState}>
            <div className={styles.emptyBlot} aria-hidden="true" />
            <Feather size={30} className={styles.emptyFeather} style={{ position: 'relative', zIndex: 1 }} />
            <h3 className={styles.emptyTitle}>No notes yet</h3>
            <p className={styles.emptyBody}>Today's a fine day to start writing.</p>
            <Button variant="primary" icon={Plus} onClick={focusComposer}>
              Write your first note
            </Button>
          </div>
        )
      ) : filteredEntries.length > 0 ? (
        <div className={styles.journalGrid}>
          {filteredEntries.map((entry, index) => (
            <JournalCard
              key={entry.id}
              entry={entry}
              index={index}
              onClick={(e) => setViewingEntry(e)}
              onEdit={(e) => handleOpenEditModal(e)}
              onDelete={deleteEntry}
            />
          ))}
        </div>
      ) : (
        <div className={styles.emptyState}>
          <div className={styles.emptyBlot} aria-hidden="true" />
          <Feather size={30} className={styles.emptyFeather} style={{ position: 'relative', zIndex: 1 }} />
          <h3 className={styles.emptyTitle}>No notes yet</h3>
          <p className={styles.emptyBody}>Today's a fine day to start writing.</p>
          <Button variant="primary" icon={Plus} onClick={focusComposer}>
            Write your first note
          </Button>
        </div>
      )}

      {/* Edit Entry Modal */}
      <Modal isOpen={Boolean(editingEntry)} onClose={() => setEditingEntry(null)} title="Edit note">
        <JournalForm formData={formData} setFormData={setFormData} onSubmit={handleEditSubmit} submitLabel="Save note" />
      </Modal>

      {/* View Entry Details Modal */}
      <Modal
        isOpen={Boolean(viewingEntry)}
        onClose={() => setViewingEntry(null)}
        title={viewingEntry ? viewingEntry.title : ''}
      >
        {viewingEntry && (() => {
          const meta = MOOD_META[viewingEntry.mood] || MOOD_META.Neutral;
          const Icon = meta.icon;
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} className={styles.viewEntryPop}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '12px', color: 'var(--text-dim)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Calendar size={12} /> {viewingEntry.date} · {viewingEntry.time}
                </span>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    backgroundColor: `${meta.color}22`,
                    color: meta.color,
                    padding: '3px 9px',
                    borderRadius: '999px',
                    fontSize: '11px',
                    fontWeight: 600
                  }}
                >
                  <Icon size={12} /> {meta.label}
                </span>
              </div>

              <div style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontSize: '15px', lineHeight: '1.8', color: 'var(--text-main)', whiteSpace: 'pre-line' }}>
                {viewingEntry.content}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)' }}>
                <Button variant="secondary" onClick={() => setViewingEntry(null)}>
                  Close
                </Button>
              </div>
            </div>
          );
        })()}
      </Modal>
    </div>
  );
}