import { useState } from 'react';
import { Plus, CheckSquare, Flame, Award } from 'lucide-react';
import { useHabits } from '../hooks/useHabits';
import { HabitCard } from '../components/ui/HabitCard';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import styles from '../styles/HabitsPage.module.css';

export function HabitsPage() {
  const { habits, toggleHabitDay, addHabit, updateHabit, deleteHabit } = useHabits();

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    category: 'Productivity',
    timeOfDay: 'Morning'
  });

  // Custom category input (shown when "Other" is selected)
  const [customCategory, setCustomCategory] = useState('');

  const handleOpenAddModal = () => {
    setFormData({
      title: '',
      category: 'Productivity',
      timeOfDay: 'Morning'
    });
    setCustomCategory('');
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (habit) => {
    setEditingHabit(habit);
    const knownCategories = ['Productivity', 'Learning', 'Health', 'Mindset'];
    const isKnown = knownCategories.includes(habit.category);
    setFormData({
      title: habit.title,
      category: isKnown ? habit.category : 'Other',
      timeOfDay: habit.timeOfDay || 'Morning'
    });
    setCustomCategory(isKnown ? '' : (habit.category || ''));
  };

  const handleCategoryChange = (value) => {
    setFormData({ ...formData, category: value });
    if (value !== 'Other') {
      setCustomCategory('');
    }
  };

  const getResolvedCategory = () => {
    if (formData.category === 'Other') {
      return customCategory.trim() || 'Other';
    }
    return formData.category;
  };

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return;
    addHabit({ ...formData, category: getResolvedCategory() });
    setIsAddModalOpen(false);
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (!editingHabit || !formData.title.trim()) return;
    updateHabit(editingHabit.id, { ...formData, category: getResolvedCategory() });
    setEditingHabit(null);
  };
  const totalStreak = habits.reduce((acc, h) => acc + (h.streak || 0), 0);
  const maxStreak = habits.length ? Math.max(...habits.map((h) => h.bestStreak || 0)) : 0;


  const inputStyle = {
    width: '100%',
    backgroundColor: 'var(--bg-input)',
    border: '1px solid var(--border-color)',
    borderRadius: '8px',
    padding: '10px 14px',
    color: 'var(--text-main)'
  };

  // Shared category select + custom input component
  const renderCategoryField = () => (
    <div>
      <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>
        Category
      </label>
      <select
        value={formData.category}
        onChange={(e) => handleCategoryChange(e.target.value)}
        style={inputStyle}
      >
        <option value="Productivity">Productivity</option>
        <option value="Learning">Learning</option>
        <option value="Health">Health</option>
        <option value="Mindset">Mindset</option>
        <option value="Other">Other (Custom)</option>
      </select>
      {formData.category === 'Other' && (
        <input
          type="text"
          value={customCategory}
          onChange={(e) => setCustomCategory(e.target.value)}
          placeholder="Type your custom category..."
          style={{ ...inputStyle, marginTop: '8px' }}
        />
      )}
    </div>
  );

  return (
    <div className={styles.container}>
      {/* Top Stats Bar */}
      <div className={styles.topBar}>
        <div className={styles.statsPills}>
          <div className={styles.statPill}>
            <CheckSquare size={14} />
            <span>Habits Tracked: <strong>{habits.length}</strong></span>
          </div>
          <div className={styles.statPill}>
            <Flame size={14} style={{ color: 'var(--warning)' }} />
            <span>Active Momentum: <strong>{totalStreak} Days</strong></span>
          </div>
          <div className={styles.statPill}>
            <Award size={14} style={{ color: 'var(--primary)' }} />
            <span>All-time Best: <strong>{maxStreak} Days</strong></span>
          </div>
        </div>

        <Button variant="primary" icon={Plus} onClick={handleOpenAddModal}>
          New Habit
        </Button>
      </div>

      {/* To-Do Grid */}
      {habits.length > 0 ? (
        <div className={styles.habitsGrid}>
          {habits.map((habit) => (
            <HabitCard
              key={habit.id}
              habit={habit}
              onToggleDay={toggleHabitDay}
              onEdit={handleOpenEditModal}
              onDelete={deleteHabit}
            />
          ))}
        </div>
      ) : (
        <div className={styles.emptyState}>
          <CheckSquare size={36} style={{ opacity: 0.3 }} />
          <h3 style={{ fontSize: '15px', fontWeight: 600 }}>No habits added yet.</h3>
          <p style={{ fontSize: '13px' }}>Daily actions compound over time. Add your first habit.</p>
          <Button variant="primary" icon={Plus} onClick={handleOpenAddModal}>
            Add Habit
          </Button>
        </div>
      )}

      {/* Add Habit Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Build Daily Habit"
      >
        <form onSubmit={handleAddSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>
              Habit Name
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Complete React architecture review"
              required
              style={inputStyle}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {renderCategoryField()}

            <div>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>
                Time of Day
              </label>
              <select
                value={formData.timeOfDay}
                onChange={(e) => setFormData({ ...formData, timeOfDay: e.target.value })}
                style={inputStyle}
              >
                <option value="Morning">Morning</option>
                <option value="Afternoon">Afternoon</option>
                <option value="Evening">Evening</option>
                <option value="Night">Night</option>
                <option value="All Day">All Day</option>
              </select>
            </div>
          </div>

          <Button type="submit" variant="primary" size="lg" fullWidth icon={Plus}>
            Create Habit
          </Button>
        </form>
      </Modal>

      {/* Edit Habit Modal */}
      <Modal
        isOpen={Boolean(editingHabit)}
        onClose={() => setEditingHabit(null)}
        title="Update Habit"
      >
        <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>
              Habit Name
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              style={inputStyle}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {renderCategoryField()}

            <div>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>
                Time of Day
              </label>
              <select
                value={formData.timeOfDay}
                onChange={(e) => setFormData({ ...formData, timeOfDay: e.target.value })}
                style={inputStyle}
              >
                <option value="Morning">Morning</option>
                <option value="Afternoon">Afternoon</option>
                <option value="Evening">Evening</option>
                <option value="Night">Night</option>
                <option value="All Day">All Day</option>
              </select>
            </div>
          </div>

          <Button type="submit" variant="primary" size="lg" fullWidth>
            Save Changes
          </Button>
        </form>
      </Modal>
    </div>
  );
}
