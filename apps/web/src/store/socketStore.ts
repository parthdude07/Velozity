import { create } from 'zustand';
import type { ActivityLog, Notification } from '../types';

interface SocketState {
  onlineCount: number;
  recentActivity: ActivityLog[];
  setOnlineCount: (count: number) => void;
  addActivity: (log: ActivityLog) => void;
  setRecentActivity: (logs: ActivityLog[]) => void;
}

export const useSocketStore = create<SocketState>((set) => ({
  onlineCount: 0,
  recentActivity: [],
  setOnlineCount: (count) => set({ onlineCount: count }),
  addActivity: (log) =>
    set((state) => ({
      recentActivity: [log, ...state.recentActivity].slice(0, 50),
    })),
  setRecentActivity: (logs) => set({ recentActivity: logs }),
}));

interface NotificationState {
  unreadCount: number;
  notifications: Notification[];
  setUnreadCount: (count: number) => void;
  addNotification: (n: Notification) => void;
  setNotifications: (ns: Notification[]) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  unreadCount: 0,
  notifications: [],
  setUnreadCount: (count) => set({ unreadCount: count }),
  addNotification: (n) =>
    set((state) => ({
      notifications: [n, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    })),
  setNotifications: (ns) => set({ notifications: ns }),
  markRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, isRead: true } : n
      ),
      unreadCount: Math.max(0, state.unreadCount - 1),
    })),
  markAllRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
      unreadCount: 0,
    })),
}));
