import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { useAuthStore } from '../../store/authStore';
import { useSocketStore, useNotificationStore } from '../../store/socketStore';
import { useThemeStore } from '../../store/themeStore';
import { getSocket, connectSocket } from '../../lib/socket';
import type { ActivityLog } from '../../types';

export const AppLayout: React.FC = () => {
  const { user } = useAuthStore();
  const { setOnlineCount, addActivity } = useSocketStore();
  const { addNotification } = useNotificationStore();
  const { theme } = useThemeStore();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    if (!user) return;
    connectSocket();
    const socket = getSocket();

    // Online presence (admin only)
    socket.on('presence:online_count', ({ count }: { count: number }) => {
      setOnlineCount(count);
    });

    // Live activity feed
    socket.on('feed:new_event', (log: ActivityLog) => {
      addActivity(log);
    });

    // New notification
    socket.on('notification:new', (n: { taskId: string; message: string }) => {
      addNotification({
        id: Math.random().toString(36),
        userId: user.id,
        taskId: n.taskId,
        message: n.message,
        isRead: false,
        createdAt: new Date().toISOString(),
      });
    });

    // Missed events catchup
    const lastSeen = localStorage.getItem('velozity_last_seen') ?? new Date(0).toISOString();
    socket.emit('feed:catchup', { lastSeenAt: lastSeen });
    socket.on('feed:catchup_response', (missed: ActivityLog[]) => {
      if (missed.length > 0) {
        missed.forEach(addActivity);
      }
      localStorage.setItem('velozity_last_seen', new Date().toISOString());
    });

    return () => {
      socket.off('presence:online_count');
      socket.off('feed:new_event');
      socket.off('notification:new');
      socket.off('feed:catchup_response');
    };
  }, [user]);

  const [isCollapsed, setIsCollapsed] = React.useState(false);

  return (
    <div className={`app-layout${isCollapsed ? ' collapsed' : ''}`}>
      <Sidebar isCollapsed={isCollapsed} onToggle={() => setIsCollapsed(!isCollapsed)} />
      <div className="main-content">
        <Topbar />
        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
