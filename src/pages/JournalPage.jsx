import { useState } from 'react';
import { Plus, BookOpen, Search, Sparkles, Calendar, Tag } from 'lucide-react';
import { useJournal } from '../hooks/useJournal';
import { JournalCard } from '../components/ui/JournalCard';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import styles from '../styles/JournalPage.module.css';

export function JournalPage() {
  const { entries, addEntry, updateEntry, deleteEntry } = useJournal();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMoodFilter, setSelectedMoodFilter] = useState('ALL');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [viewingEntry, setViewingEntry] = useState(null);
  const [editingEntry, setEditingEntry] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    mood: 'Great'
  });

  const handleOpenAddModal = () => {
    setFormData({
      title: '',
      content: '',
      mood: 'Great'
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (entry) => {
    setEditingEntry(entry);
    setFormData({
      title: entry.title,
      content: entry.content,
      mood: entry.mood || 'Great'
    });
  };

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim()) return;
    addEntry(formData);
    setIsAddModalOpen(false);
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

  return (
    <div className={styles.container}>
      {/* Top Bar */}
      <div className={styles.topBar}>
        <div className={styles.statsPills}>
          <div className={styles.statPill}>
            <BookOpen size={14} />
            <span>Journal Logs: <strong>{entries.length}</strong></span>
          </div>
          <div className={styles.statPill}>
            <Sparkles size={14} style={{ color: 'var(--primary)' }} />
            <span>Latest: <strong>{entries.length ? entries[0].date : 'N/A'}</strong></span>
          </div>
        </div>

        <Button variant="primary" icon={Plus} onClick={handleOpenAddModal}>
          New Reflection Entry
        </Button>
      </div>

      {/* Search & Filter Bar */}
      <div className={styles.searchFilterBar}>
        <div className={styles.searchBox}>
          <Search size={14} />
          <input
            type="text"
            placeholder="Search entries by keyword..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        <div className={styles.filterGroup}>
          {['ALL', 'Great', 'Good', 'Neutral', 'Bad', 'Very Bad'].map((m) => (
            <button
              key={m}
              className={`${styles.filterBtn} ${selectedMoodFilter === m ? styles.activeFilter : ''}`}
              onClick={() => setSelectedMoodFilter(m)}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Journal Cards Grid */}
      {filteredEntries.length > 0 ? (
        <div className={styles.journalGrid}>
          {filteredEntries.map((entry) => (
            <JournalCard
              key={entry.id}
              entry={entry}
              onClick={(e) => setViewingEntry(e)}
              onEdit={(e) => handleOpenEditModal(e)}
              onDelete={deleteEntry}
            />
          ))}
        </div>
      ) : (
        <div className={styles.emptyState}>
          <BookOpen size={36} style={{ opacity: 0.3 }} />
          <h3 style={{ fontSize: '15px', fontWeight: 600 }}>Your journal is empty.</h3>
          <p style={{ fontSize: '13px' }}>Documenting reflections keeps your mind aligned with long-term vision.</p>
          <Button variant="primary" icon={Plus} onClick={handleOpenAddModal}>
            Write Entry
          </Button>
        </div>
      )}

      {/* Add Entry Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="New Journal Reflection"
      >
        <form onSubmit={handleAddSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>
              Entry Title
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Architectural Breakdown & Weekly Momentum"
              required
              style={{
                width: '100%',
                backgroundColor: 'var(--bg-input)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '10px 14px',
                color: 'var(--text-main)'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>
              How are you feeling?
            </label>
            <select
              value={formData.mood}
              onChange={(e) => setFormData({ ...formData, mood: e.target.value })}
              style={{
                width: '100%',
                backgroundColor: 'var(--bg-input)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '10px 14px',
                color: 'var(--text-main)'
              }}
            >
              <option value="Great">😄 Great</option>
              <option value="Good">🙂 Good</option>
              <option value="Neutral">😐 Neutral</option>
              <option value="Bad">😞 Bad</option>
              <option value="Very Bad">😢 Very Bad</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>
              Write your thoughts...
            </label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder="Dear journal, today I..."
              rows={10}
              required
              style={{
                width: '100%',
                backgroundColor: '#fffef5',
                border: '1px solid #e8dfc6',
                borderRadius: '4px',
                padding: '20px 24px',
                color: '#3e3a34',
                resize: 'vertical',
                fontFamily: "'Georgia', 'Times New Roman', serif",
                fontSize: '15px',
                lineHeight: '2',
                backgroundImage: 'repeating-linear-gradient(transparent, transparent 29px, #e8dfc6 30px)',
                backgroundSize: '100% 30px',
                backgroundAttachment: 'local',
                boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.06)',
                letterSpacing: '0.2px'
              }}
            />
          </div>

          <Button type="submit" variant="primary" size="lg" fullWidth icon={Plus}>
            Publish Entry
          </Button>
        </form>
      </Modal>

      {/* Edit Entry Modal */}
      <Modal
        isOpen={Boolean(editingEntry)}
        onClose={() => setEditingEntry(null)}
        title="Edit Journal Reflection"
      >
        <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>
              Entry Title
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              style={{
                width: '100%',
                backgroundColor: 'var(--bg-input)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '10px 14px',
                color: 'var(--text-main)'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>
              How are you feeling?
            </label>
            <select
              value={formData.mood}
              onChange={(e) => setFormData({ ...formData, mood: e.target.value })}
              style={{
                width: '100%',
                backgroundColor: 'var(--bg-input)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '10px 14px',
                color: 'var(--text-main)'
              }}
            >
              <option value="Great">😄 Great</option>
              <option value="Good">🙂 Good</option>
              <option value="Neutral">😐 Neutral</option>
              <option value="Bad">😞 Bad</option>
              <option value="Very Bad">😢 Very Bad</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>
              Write your thoughts...
            </label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              rows={10}
              required
              style={{
                width: '100%',
                backgroundColor: '#fffef5',
                border: '1px solid #e8dfc6',
                borderRadius: '4px',
                padding: '20px 24px',
                color: '#3e3a34',
                resize: 'vertical',
                fontFamily: "'Georgia', 'Times New Roman', serif",
                fontSize: '15px',
                lineHeight: '2',
                backgroundImage: 'repeating-linear-gradient(transparent, transparent 29px, #e8dfc6 30px)',
                backgroundSize: '100% 30px',
                backgroundAttachment: 'local',
                boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.06)',
                letterSpacing: '0.2px'
              }}
            />
          </div>

          <Button type="submit" variant="primary" size="lg" fullWidth>
            Save Changes
          </Button>
        </form>
      </Modal>

      {/* View Entry Details Modal */}
      <Modal
        isOpen={Boolean(viewingEntry)}
        onClose={() => setViewingEntry(null)}
        title={viewingEntry ? viewingEntry.title : ''}
      >
        {viewingEntry && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '12px', color: 'var(--text-dim)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Calendar size={12} /> {viewingEntry.date} ({viewingEntry.time})
              </span>
              <span style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary)', padding: '2px 8px', borderRadius: '4px' }}>
                {viewingEntry.mood}
              </span>
            </div>

            <div style={{ fontSize: '14px', lineHeight: '1.7', color: 'var(--text-main)', whitespace: 'pre-line' }}>
              {viewingEntry.content}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)' }}>
              <Button variant="secondary" onClick={() => setViewingEntry(null)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
