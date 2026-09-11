import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderOpen,
  CheckSquare,
  Users,
  Building2,
  Zap,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useSocketStore } from '../../store/socketStore';
import { api } from '../../lib/api';
import { disconnectSocket } from '../../lib/socket';
import { Avatar, RoleBadge } from '../ui';

interface NavItemDef {
  to: string;
  label: string;
  icon: React.ReactNode;
  roles?: string[];
}

const NAV_ITEMS: NavItemDef[] = [
  { to: '/dashboard', label: 'Dashboard',  icon: <LayoutDashboard size={18} /> },
  { to: '/projects',  label: 'Projects',   icon: <FolderOpen size={18} />, roles: ['ADMIN','PM'] },
  { to: '/tasks',     label: 'My Tasks',   icon: <CheckSquare size={18} />, roles: ['DEVELOPER'] },
  { to: '/projects',  label: 'Projects',   icon: <FolderOpen size={18} />, roles: ['DEVELOPER'] },
  { to: '/clients',   label: 'Clients',    icon: <Building2 size={18} />,  roles: ['ADMIN'] },
  { to: '/users',     label: 'Users',      icon: <Users size={18} />,      roles: ['ADMIN'] },
];

export const Sidebar: React.FC<{ isCollapsed: boolean; onToggle: () => void }> = ({ isCollapsed, onToggle }) => {
  const { user, logout } = useAuthStore();
  const { onlineCount } = useSocketStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try { await api.post('/auth/logout'); } catch {}
    disconnectSocket();
    logout();
    navigate('/login');
  };

  const visibleItems = NAV_ITEMS.filter((item) => {
    if (!item.roles) return true;
    return user?.role && item.roles.includes(user.role);
  }).filter((item, idx, arr) => {
    // De-dup same 'to' for DEVELOPER (shows projects once)
    return arr.findIndex(i => i.to === item.to && i.label === item.label) === idx;
  });

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo" style={{ display: 'flex', alignItems: 'center', justifyContent: isCollapsed ? 'center' : 'space-between', flexDirection: isCollapsed ? 'column' : 'row', gap: isCollapsed ? '1rem' : '0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', overflow: 'hidden' }}>
          <div className="sidebar-logo-icon">
            <Zap size={20} color="white" />
          </div>
          <span className="sidebar-logo-text">Velozity</span>
        </div>
        <button 
          className="btn btn-ghost btn-icon" 
          onClick={onToggle}
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {isCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
        </button>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        <span className="nav-section-label">Navigation</span>
        {visibleItems.map((item) => (
          <NavLink
            key={item.label + item.to}
            to={item.to}
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
          >
            {item.icon}
            <span className="nav-text">{item.label}</span>
          </NavLink>
        ))}

        {user?.role === 'ADMIN' && (
          <div style={{ marginTop: 'auto', paddingTop: '0.5rem' }}>
            <span className="nav-section-label">Live</span>
            <div className="nav-item" style={{ cursor: 'default', pointerEvents: 'none' }}>
              <div className="online-dot-pulse" />
              <span className="text-sm">{onlineCount} online now</span>
            </div>
          </div>
        )}
      </nav>

      {/* User */}
      <div className="sidebar-footer">
        <RoleBadge role={user?.role ?? 'DEVELOPER'} />
        <div className="user-card mt-2">
          <Avatar name={user?.name ?? '?'} />
          <div className="user-card-info">
            <div className="user-card-name">{user?.name}</div>
            <div className="user-card-role">{user?.email}</div>
          </div>
        </div>
        <button className="btn btn-ghost btn-sm w-full mt-2" onClick={handleLogout} style={{ justifyContent: isCollapsed ? 'center' : 'flex-start' }}>
          <LogOut size={16} />
          <span className="nav-text">Sign out</span>
        </button>
      </div>
    </aside>
  );
};
