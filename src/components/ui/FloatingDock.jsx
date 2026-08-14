import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Calendar as CalendarIcon,
  BookOpen,
  CheckSquare,
  MessageSquare
} from 'lucide-react';
import styles from '../../styles/FloatingDock.module.css';

export function FloatingDock() {
  const dockItems = [
    { label: 'Dashboard', path: '/app/dashboard', icon: LayoutDashboard },
    { label: 'Calendar', path: '/app/calendar', icon: CalendarIcon },
    { label: 'Notes', path: '/app/journal', icon: BookOpen },
    { label: 'Habits', path: '/app/habits', icon: CheckSquare },
    { label: 'Chatbot', path: '/app/chatbot', icon: MessageSquare }
  ];

  return (
    <div className={styles.dockContainer}>
      {dockItems.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `${styles.dockItem} ${isActive ? styles.activeDockItem : ''}`
            }
          >
            <Icon size={18} />
            <span className={styles.dockTooltip}>{item.label}</span>
          </NavLink>
        );
      })}
    </div>
  );
}
