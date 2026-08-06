import { useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
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

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Profile Onboarding State
  const needsProfileSetup = isAuthenticated && user && !user.hasCompletedProfile;
  const [setupName, setSetupName] = useState(user?.name || '');
  const [setupAge, setSetupAge] = useState(user?.age || '');

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const handleProfileSetupSubmit = (e) => {
    e.preventDefault();
    if (!setupName.trim() || !setupAge) return;
    updateAccountInfo(setupName.trim(), setupAge, user?.email);
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

      {/* First-Time Name & Age Setup Modal */}
      <Modal
        isOpen={Boolean(needsProfileSetup)}
        onClose={() => {}}
        title="Welcome to DreamScape"
      >
        <form onSubmit={handleProfileSetupSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ textAlign: 'center', marginBottom: '8px' }}>
            <Star size={28} fill="currentColor" style={{ color: 'var(--primary)', marginBottom: '8px' }} />
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              Please enter your name and age to personalize your workspace.
            </p>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>
              Your Name
            </label>
            <input
              type="text"
              placeholder="e.g. Manat"
              value={setupName}
              onChange={(e) => setSetupName(e.target.value)}
              required
              style={{
                width: '100%',
                backgroundColor: 'var(--bg-input)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '10px 14px',
                color: 'var(--text-main)',
                fontSize: '14px'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>
              Your Age
            </label>
            <input
              type="number"
              placeholder="e.g. 19"
              value={setupAge}
              onChange={(e) => setSetupAge(e.target.value)}
              min="10"
              max="120"
              required
              style={{
                width: '100%',
                backgroundColor: 'var(--bg-input)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '10px 14px',
                color: 'var(--text-main)',
                fontSize: '14px'
              }}
            />
          </div>

          <Button type="submit" variant="primary" size="lg" fullWidth icon={ArrowRight}>
            Complete Setup & Launch
          </Button>
        </form>
      </Modal>
    </div>
  );
}
