import { useState } from 'react';
import {
  Inbox as InboxIcon,
  Target as FocusIcon,
  BarChart2 as AnalyticsIcon,
  X,
  Plus,
  Check,
  Trash2,
  Zap,
  TrendingUp
} from 'lucide-react';
import { useUserStore } from '../../hooks/useUserStore';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { Button } from '../ui/Button';
import styles from '../../styles/SidebarPanels.module.css';

export function SidebarPanels({ activePanel, onClose, isCollapsed }) {
  const store = useUserStore();
  const [inboxItems, setInboxItems] = useLocalStorage('dreamscape_inbox_items', [
    { id: 'ib-1', text: 'Check in on weekly habits', completed: false },
    { id: 'ib-2', text: 'Draft system architecture notes', completed: false }
  ]);

  const [newInboxInput, setNewInboxInput] = useState('');

  const handleAddInboxItem = (e) => {
    e.preventDefault();
    if (!newInboxInput.trim()) return;
    const newItem = {
      id: `ib-${Date.now()}`,
      text: newInboxInput.trim(),
      completed: false
    };
    setInboxItems([newItem, ...inboxItems]);
    setNewInboxInput('');
  };

  const handleToggleInbox = (id) => {
    setInboxItems(
      inboxItems.map((item) =>
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    );
  };

  const handleDeleteInbox = (id) => {
    setInboxItems(inboxItems.filter((item) => item.id !== id));
  };

  return (
    <>
      {/* Backdrop overlay to close panel when clicking outside */}
      <div
        className={`${styles.panelBackdrop} ${
          activePanel ? styles.panelBackdropShow : ''
        }`}
        onClick={onClose}
      />

      <div
        className={`${styles.panelDrawer} ${
          activePanel ? styles.panelDrawerOpen : ''
        } ${isCollapsed ? styles.collapsedOffset : ''}`}
      >
        {/* Panel Header */}
        <div className={styles.panelHeader}>
          <div className={styles.panelTitle}>
            {activePanel === 'inbox' && <InboxIcon size={20} style={{ color: 'var(--primary)' }} />}
            {activePanel === 'focus' && <FocusIcon size={20} style={{ color: 'var(--primary)' }} />}
            {activePanel === 'analytics' && <AnalyticsIcon size={20} style={{ color: 'var(--primary)' }} />}
            <span style={{ textTransform: 'capitalize' }}>{activePanel || ''}</span>
          </div>
          <button className={styles.closeBtn} onClick={onClose} title="Close Panel">
            <X size={18} />
          </button>
        </div>

        {/* Panel Content */}
        <div className={styles.panelBody}>
          {/* INBOX PANEL */}
          {activePanel === 'inbox' && (
            <>
              <form onSubmit={handleAddInboxItem} style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  placeholder="Quick add to inbox..."
                  value={newInboxInput}
                  onChange={(e) => setNewInboxInput(e.target.value)}
                  style={{
                    flex: 1,
                    backgroundColor: 'var(--bg-input)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    fontSize: '13px',
                    color: 'var(--text-main)',
                    outline: 'none'
                  }}
                />
                <Button type="submit" size="sm" variant="primary" icon={Plus}>
                  Add
                </Button>
              </form>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {inboxItems.length > 0 ? (
                  inboxItems.map((item) => (
                    <div key={item.id} className={styles.inboxItem}>
                      <button
                        onClick={() => handleToggleInbox(item.id)}
                        style={{
                          width: '18px',
                          height: '18px',
                          borderRadius: '50%',
                          border: '1.5px solid var(--border-color)',
                          backgroundColor: item.completed ? 'var(--primary)' : 'var(--bg-input)',
                          color: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer'
                        }}
                      >
                        {item.completed && <Check size={12} strokeWidth={3} />}
                      </button>

                      <span className={`${styles.inboxText} ${item.completed ? styles.completedText : ''}`}>
                        {item.text}
                      </span>

                      <button
                        onClick={() => handleDeleteInbox(item.id)}
                        style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))
                ) : (
                  <span style={{ fontSize: '13px', color: 'var(--text-dim)', textAlign: 'center', padding: '20px 0' }}>
                    Your inbox is empty.
                  </span>
                )}
              </div>
            </>
          )}

          {/* FOCUS PANEL */}
          {activePanel === 'focus' && (
            <>
              {/* Top 3 Priorities Card */}
              <div className={styles.focusCard}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)' }}>
                    Today's Top 3 Priorities
                  </span>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--primary)' }}>
                    67% Done
                  </span>
                </div>

                <div className={styles.progressBarContainer}>
                  <div className={styles.progressBarFill} style={{ width: '67%' }} />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
                  <div className={styles.focusTaskRow}>
                    <Check size={14} style={{ color: 'var(--primary)' }} />
                    <span>Complete React architecture setup</span>
                  </div>
                  <div className={styles.focusTaskRow}>
                    <Check size={14} style={{ color: 'var(--primary)' }} />
                    <span>Finish daily notes</span>
                  </div>
                </div>
              </div>

              {/* Streak Counter */}
              <div className={styles.focusCard}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Zap size={20} style={{ color: 'var(--warning)' }} />
                  <div>
                    <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-main)' }}>5 Day Streak</h4>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Keep your daily momentum active!</p>
                  </div>
                </div>
              </div>

              {/* Daily Certified Quote */}
              <div className={styles.focusCard} style={{ fontStyle: 'italic', fontSize: '13px', lineHeight: '1.5', color: 'var(--text-main)' }}>
                "You have power over your mind - not outside events. Realize this, and you will find strength."
                <span style={{ display: 'block', fontStyle: 'normal', fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px', textAlign: 'right' }}>
                  — Marcus Aurelius
                </span>
              </div>
            </>
          )}

          {/* ANALYTICS PANEL */}
          {activePanel === 'analytics' && (
            <>
              <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                  <span className={styles.statValue}>24</span>
                  <span className={styles.statLabel}>Tasks Done</span>
                </div>
                <div className={styles.statCard}>
                  <span className={styles.statValue}>8</span>
                  <span className={styles.statLabel}>Notes Written</span>
                </div>
                <div className={styles.statCard}>
                  <span className={styles.statValue}>12d</span>
                  <span className={styles.statLabel}>Habit Streak</span>
                </div>
                <div className={styles.statCard}>
                  <span className={styles.statValue}>94%</span>
                  <span className={styles.statLabel}>Score</span>
                </div>
              </div>

              {/* Weekly Progress Bars */}
              <div className={styles.focusCard}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <TrendingUp size={16} style={{ color: 'var(--primary)' }} />
                  <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)' }}>
                    Weekly Execution Progress
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((day, idx) => {
                    const fillPercent = [80, 100, 60, 90, 75][idx];
                    return (
                      <div key={day} className={styles.chartBarRow}>
                        <span className={styles.chartBarLabel}>{day}</span>
                        <div className={styles.chartBarTrack}>
                          <div className={styles.chartBarFill} style={{ width: `${fillPercent}%` }} />
                        </div>
                        <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>{fillPercent}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
