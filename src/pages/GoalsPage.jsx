import { useState } from 'react';
import { Plus, Target, CheckCircle2, Clock, Filter } from 'lucide-react';
import { useGoals } from '../hooks/useGoals';
import { GoalCard } from '../components/ui/GoalCard';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import styles from '../styles/GoalsPage.module.css';

export function GoalsPage() {
  const { goals, addGoal, updateGoal, toggleGoal, deleteGoal } = useGoals();
  const [filter, setFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Engineering',
    progress: 0,
    targetDate: new Date().toISOString().split('T')[0]
  });

  const handleOpenAddModal = () => {
    setFormData({
      title: '',
      description: '',
      category: 'Engineering',
      progress: 0,
      targetDate: new Date().toISOString().split('T')[0]
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (goal) => {
    setEditingGoal(goal);
    setFormData({
      title: goal.title,
      description: goal.description || '',
      category: goal.category || 'Engineering',
      progress: goal.progress,
      targetDate: goal.targetDate
    });
  };

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return;
    addGoal(formData);
    setIsAddModalOpen(false);
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (!editingGoal || !formData.title.trim()) return;
    updateGoal(editingGoal.id, formData);
    setEditingGoal(null);
  };

  // Filter logic
  const filteredGoals = goals.filter((goal) => {
    if (filter === 'ACTIVE' && goal.completed) return false;
    if (filter === 'COMPLETED' && !goal.completed) return false;
    if (categoryFilter !== 'ALL' && goal.category !== categoryFilter) return false;
    return true;
  });

  const completedCount = goals.filter((g) => g.completed).length;
  const activeCount = goals.length - completedCount;

  return (
    <div className={styles.container}>
      {/* Top Stats Bar */}
      <div className={styles.topBar}>
        <div className={styles.statsPills}>
          <div className={styles.statPill}>
            <Target size={14} className={styles.icon} />
            <span>Total: <strong>{goals.length}</strong></span>
          </div>
          <div className={styles.statPill}>
            <Clock size={14} style={{ color: 'var(--warning)' }} />
            <span>Active: <strong>{activeCount}</strong></span>
          </div>
          <div className={styles.statPill}>
            <CheckCircle2 size={14} style={{ color: 'var(--secondary)' }} />
            <span>Completed: <strong>{completedCount}</strong></span>
          </div>
        </div>

        <Button variant="primary" icon={Plus} onClick={handleOpenAddModal}>
          New Goal
        </Button>
      </div>

      {/* Filter Controls Bar */}
      <div className={styles.controlsBar}>
        <div className={styles.filterGroup}>
          {['ALL', 'ACTIVE', 'COMPLETED'].map((f) => (
            <button
              key={f}
              className={`${styles.filterBtn} ${filter === f ? styles.activeFilter : ''}`}
              onClick={() => setFilter(f)}
            >
              {f === 'ALL' ? 'All Goals' : f === 'ACTIVE' ? 'In Progress' : 'Completed'}
            </button>
          ))}
        </div>

        <div className={styles.filterGroup}>
          <Filter size={14} style={{ color: 'var(--text-dim)' }} />
          {['ALL', 'Engineering', 'Productivity', 'Personal Growth', 'Health'].map((cat) => (
            <button
              key={cat}
              className={`${styles.filterBtn} ${categoryFilter === cat ? styles.activeFilter : ''}`}
              onClick={() => setCategoryFilter(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Goals Grid */}
      {filteredGoals.length > 0 ? (
        <div className={styles.goalsGrid}>
          {filteredGoals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              onToggle={toggleGoal}
              onEdit={handleOpenEditModal}
              onDelete={deleteGoal}
            />
          ))}
        </div>
      ) : (
        <div className={styles.emptyState}>
          <Target size={36} style={{ opacity: 0.3 }} />
          <h3 style={{ fontSize: '15px', fontWeight: 600 }}>No goals yet.</h3>
          <p style={{ fontSize: '13px' }}>Create a goal milestone to start tracking your progress.</p>
          <Button variant="primary" icon={Plus} onClick={handleOpenAddModal}>
            Add Goal
          </Button>
        </div>
      )}

      {/* Add Goal Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Set New Milestone Goal"
      >
        <form onSubmit={handleAddSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>
              Goal Title
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Complete System Design Certification"
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
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief tactical details of what achieving this goal requires..."
              rows={3}
              style={{
                width: '100%',
                backgroundColor: 'var(--bg-input)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '10px 14px',
                color: 'var(--text-main)',
                resize: 'none'
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                style={{
                  width: '100%',
                  backgroundColor: 'var(--bg-input)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  color: 'var(--text-main)'
                }}
              >
                <option value="Engineering">Engineering</option>
                <option value="Productivity">Productivity</option>
                <option value="Personal Growth">Personal Growth</option>
                <option value="Health">Health</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>
                Target Date
              </label>
              <input
                type="date"
                value={formData.targetDate}
                onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
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
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>
              Initial Progress ({formData.progress}%)
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={formData.progress}
              onChange={(e) => setFormData({ ...formData, progress: Number(e.target.value) })}
              style={{ width: '100%', accentColor: 'var(--primary)' }}
            />
          </div>

          <Button type="submit" variant="primary" size="lg" fullWidth icon={Plus}>
            Save Goal
          </Button>
        </form>
      </Modal>

      {/* Edit Goal Modal */}
      <Modal
        isOpen={Boolean(editingGoal)}
        onClose={() => setEditingGoal(null)}
        title="Update Goal Milestone"
      >
        <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>
              Goal Title
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
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              style={{
                width: '100%',
                backgroundColor: 'var(--bg-input)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '10px 14px',
                color: 'var(--text-main)',
                resize: 'none'
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                style={{
                  width: '100%',
                  backgroundColor: 'var(--bg-input)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  color: 'var(--text-main)'
                }}
              >
                <option value="Engineering">Engineering</option>
                <option value="Productivity">Productivity</option>
                <option value="Personal Growth">Personal Growth</option>
                <option value="Health">Health</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>
                Target Date
              </label>
              <input
                type="date"
                value={formData.targetDate}
                onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
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
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>
              Progress ({formData.progress}%)
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={formData.progress}
              onChange={(e) => setFormData({ ...formData, progress: Number(e.target.value) })}
              style={{ width: '100%', accentColor: 'var(--primary)' }}
            />
          </div>

          <Button type="submit" variant="primary" size="lg" fullWidth>
            Save Changes
          </Button>
        </form>
      </Modal>
    </div>
  );
}
