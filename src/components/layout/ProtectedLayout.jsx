import { useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useUserStore } from '../../hooks/useUserStore';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { FloatingDock } from '../ui/FloatingDock';
import { FloatingChatWidget } from '../ui/FloatingChatWidget';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Star, ArrowRight } from 'lucide-react';
import styles from '../../styles/ProtectedLayout.module.css';

export function ProtectedLayout() {
  const { isAuthenticated, user, updateAccountInfo } = useAuth();
  const store = useUserStore();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Profile Onboarding State
  const needsProfileSetup = isAuthenticated && user && !user.hasCompletedProfile;
  const [setupTimelineStart, setSetupTimelineStart] = useState(user?.settings?.timelineStart || '07:00');
  const [setupTimelineEnd, setSetupTimelineEnd] = useState(user?.settings?.timelineEnd || '22:00');

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const handleProfileSetupSubmit = (e) => {
    e.preventDefault();
    if (!setupTimelineStart || !setupTimelineEnd) return;
    store.updateSettings({
      timelineStart: setupTimelineStart,
      timelineEnd: setupTimelineEnd
    });
    updateAccountInfo(user?.name || 'User', user?.age || 20, user?.email);
  };

  return (
    <div className={styles.layoutContainer}>
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
      />

      {/* Mobile Drawer Overlay Backdrop */}
      <div
        className={`${styles.mobileBackdrop} ${
          sidebarOpen ? styles.mobileBackdropShow : ''
        }`}
        onClick={() => setSidebarOpen(false)}
      />

      <div
        className={`${styles.mainContent} ${
          isCollapsed ? styles.mainContentCollapsed : ''
        }`}
      >
        <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <main className={styles.pageContainer}>
          <Outlet />
        </main>
      </div>

      {/* macOS Floating Dock */}
      <FloatingDock />

      {/* Floating AI Chat Assistant Widget */}
      <FloatingChatWidget />

      {/* First-Time Timeline Setup Modal */}
      <Modal
        isOpen={Boolean(needsProfileSetup)}
        onClose={() => {}}
        title="Welcome to DreamScape"
      >
        <form onSubmit={handleProfileSetupSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ textAlign: 'center', marginBottom: '8px' }}>
            <Star size={28} fill="currentColor" style={{ color: 'var(--primary)', marginBottom: '8px' }} />
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              Set your preferred workspace hours. This timeline will define the hourly slots on your calendar.
            </p>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>
              Timeline Start
            </label>
            <select
              value={setupTimelineStart}
              onChange={(e) => {
                setSetupTimelineStart(e.target.value);
                const sh = parseInt(e.target.value.split(':')[0], 10);
                const eh = parseInt(setupTimelineEnd.split(':')[0], 10);
                if (eh <= sh) setSetupTimelineEnd(`${String(sh + 1).padStart(2, '0')}:00`);
              }}
              required
              style={{
                width: '100%',
                backgroundColor: 'var(--bg-input)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '10px 14px',
                color: 'var(--text-main)',
                fontSize: '14px',
                outline: 'none'
              }}
            >
              {Array.from({ length: 24 }, (_, i) => {
                const h = String(i).padStart(2, '0') + ':00';
                return <option key={h} value={h}>{h}</option>;
              })}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>
              Timeline End
            </label>
            <select
              value={setupTimelineEnd}
              onChange={(e) => setSetupTimelineEnd(e.target.value)}
              required
              style={{
                width: '100%',
                backgroundColor: 'var(--bg-input)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '10px 14px',
                color: 'var(--text-main)',
                fontSize: '14px',
                outline: 'none'
              }}
            >
              {Array.from({ length: 24 }, (_, i) => {
                const h = String(i).padStart(2, '0') + ':00';
                const sh = parseInt(setupTimelineStart.split(':')[0], 10);
                return (
                  <option key={h} value={h} disabled={i <= sh}>
                    {h}
                  </option>
                );
              })}
            </select>
          </div>

          <Button type="submit" variant="primary" size="lg" fullWidth icon={ArrowRight}>
            Complete Setup & Launch
          </Button>
        </form>
      </Modal>
    </div>
  );
}
