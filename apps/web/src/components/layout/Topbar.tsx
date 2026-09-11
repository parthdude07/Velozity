import React from 'react';
import { useLocation } from 'react-router-dom';
import { Sun, Moon } from 'lucide-react';
import { NotificationDropdown } from '../notifications/NotificationDropdown';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/projects':  'Projects',
  '/tasks':     'My Tasks',
  '/clients':   'Clients',
  '/users':     'Users',
};

export const Topbar: React.FC = () => {
  const location = useLocation();
  const { user } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const title = PAGE_TITLES[location.pathname] ?? 'Velozity';

  return (
    <header className="topbar">
      <div className="topbar-left">
        <span className="topbar-title">{title}</span>
      </div>
      <div className="topbar-right">
        <button className="btn btn-ghost btn-icon" onClick={toggleTheme} title="Toggle Theme">
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <NotificationDropdown />
        <div style={{ width: 1, height: 28, background: 'var(--border)' }} />
        <span className="text-sm text-secondary">
          {user?.name}
        </span>
      </div>
    </header>
  );
};
