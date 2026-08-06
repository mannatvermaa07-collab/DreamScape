import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Star,
  Inbox as InboxIcon,
  Target as FocusIcon,
  BarChart2 as AnalyticsIcon,
  Settings as SettingsIcon
} from 'lucide-react';
import { SidebarPanels } from './SidebarPanels';
import styles from '../../styles/Sidebar.module.css';

export function Sidebar({ isOpen, onClose, isCollapsed, onToggleCollapse }) {
  const [activePanel, setActivePanel] = useState(null);

  const panelItems = [
    { id: 'inbox', label: 'Inbox', icon: InboxIcon },
    { id: 'focus', label: 'Focus', icon: FocusIcon },
    { id: 'analytics', label: 'Analytics', icon: AnalyticsIcon }
  ];

  const handlePanelClick = (id) => {
    setActivePanel((prev) => (prev === id ? null : id));
  };

  return (
    <>
      <aside
        className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : ''} ${
          isCollapsed ? styles.collapsedSidebar : ''
        }`}
      >
        <div>
          {/* Header: ★ DreamScape (Clicking collapses/expands sidebar) */}
          <div
            className={styles.brand}
            onClick={onToggleCollapse}
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            <div className={styles.logoStarBox}>
              <Star size={18} fill="currentColor" />
            </div>
            {!isCollapsed && <span className={styles.brandName}>DreamScape</span>}
          </div>

          {/* Productivity Panel Launcher Buttons (Inbox, Focus, Analytics) */}
          <nav className={styles.navSection}>
            {panelItems.map((item) => {
              const Icon = item.icon;
              const isActive = activePanel === item.id;
              return (
                <button
                  key={item.id}
                  className={`${styles.panelItemBtn} ${isActive ? styles.activePanelBtn : ''}`}
                  onClick={() => handlePanelClick(item.id)}
                  title={isCollapsed ? item.label : undefined}
                >
                  <Icon size={18} />
                  {!isCollapsed && <span>{item.label}</span>}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Fixed Settings Link */}
        <div className={styles.sidebarFooter}>
          <NavLink
            to="/app/settings"
            className={({ isActive }) =>
              `${styles.settingsLink} ${isActive ? styles.activeNavItem : ''}`
            }
            onClick={() => {
              setActivePanel(null);
              if (onClose) onClose();
            }}
            title={isCollapsed ? 'Settings' : undefined}
          >
            <SettingsIcon size={18} />
            {!isCollapsed && <span>Settings</span>}
          </NavLink>
        </div>
      </aside>

      {/* Sliding Productivity Panels Drawer */}
      <SidebarPanels
        activePanel={activePanel}
        onClose={() => setActivePanel(null)}
        isCollapsed={isCollapsed}
      />
    </>
  );
}
