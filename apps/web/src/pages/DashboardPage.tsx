import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { FolderOpen, CheckSquare, AlertTriangle, TrendingUp, Clock, Zap } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { api } from '../lib/api';
import { useAuthStore } from '../store/authStore';
import { useSocketStore } from '../store/socketStore';
import { StatusBadge, PriorityBadge, Avatar, Spinner, Skeleton } from '../components/ui';
import type { ApiResponse, DashboardStats, Task, ActivityLog } from '../types';

// ── Stat Card Component
const StatCard: React.FC<{
  label: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
  sub?: string;
}> = ({ label, value, icon, color, sub }) => (
  <div className="stat-card">
    <div className="stat-card-icon" style={{ background: color }}>
      {icon}
    </div>
    <div className="stat-card-value">{value}</div>
    <div className="stat-card-label">{label}</div>
    {sub && <div className="text-xs text-muted mt-1">{sub}</div>}
  </div>
);

// ── Activity Feed Item
const ActivityItem: React.FC<{ log: ActivityLog }> = ({ log }) => (
  <div className="activity-item">
    <div className="activity-avatar">
      <Avatar name={log.user.name} size="sm" />
    </div>
    <div className="activity-content">
      <div className="activity-message">{log.message}</div>
      <div className="activity-time">
        {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
      </div>
    </div>
  </div>
);

export const DashboardPage: React.FC = () => {
  const { user } = useAuthStore();
  const { onlineCount, recentActivity } = useSocketStore();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<DashboardStats>>('/projects/dashboard');
      return data.data;
    },
  });

  const { data: tasks, isLoading: tasksLoading } = useQuery({
    queryKey: ['my-tasks'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Task[]>>('/tasks');
      return data.data;
    },
  });

  const { data: feed } = useQuery({
    queryKey: ['activity-feed'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<ActivityLog[]>>('/activity?limit=20');
      return data.data;
    },
  });

  const displayActivity = recentActivity.length > 0 ? recentActivity : (feed ?? []);

  const getTaskCount = (status: string) =>
    stats?.taskStats.find((s) => s.status === status)?._count ?? 0;

  const totalTasks = stats?.taskStats.reduce((acc, s) => acc + s._count, 0) ?? 0;

  const upcomingTasks = tasks?.filter((t) => {
    const due = new Date(t.dueDate);
    const now = new Date();
    const weekAhead = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    return due >= now && due <= weekAhead && t.status !== 'DONE';
  });

  if (statsLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <div className="grid-3">
          {[1, 2, 3].map(i => <Skeleton key={i} height="120px" width="100%" />)}
        </div>
        <Skeleton height="300px" width="100%" />
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1>Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, {user?.name?.split(' ')[0]} 👋</h1>
        <p>Here's what's happening across your workspace today.</p>
      </div>

      {/* Stat Grid */}
      <div className="grid-4 mb-6">
        <StatCard
          label="Total Projects"
          value={stats?.totalProjects ?? 0}
          icon={<FolderOpen size={20} color="white" />}
          color="rgba(99,102,241,0.25)"
        />
        <StatCard
          label="Total Tasks"
          value={totalTasks}
          icon={<CheckSquare size={20} color="white" />}
          color="rgba(16,185,129,0.2)"
        />
        <StatCard
          label="Overdue Tasks"
          value={stats?.overdueCount ?? 0}
          icon={<AlertTriangle size={20} color="white" />}
          color="rgba(239,68,68,0.2)"
          sub={stats?.overdueCount ? 'Needs attention' : 'All on track'}
        />
        {user?.role === 'ADMIN' ? (
          <StatCard
            label="Users Online"
            value={onlineCount}
            icon={<Zap size={20} color="white" />}
            color="rgba(245,158,11,0.2)"
            sub="Live presence"
          />
        ) : (
          <StatCard
            label="In Progress"
            value={getTaskCount('IN_PROGRESS')}
            icon={<TrendingUp size={20} color="white" />}
            color="rgba(245,158,11,0.2)"
          />
        )}
      </div>

      {/* Task Status Breakdown */}
      <div className="grid-2 mb-6">
        {/* Status breakdown */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Task Status Breakdown</span>
          </div>
          {['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'].map((s) => {
            const count = getTaskCount(s);
            const pct = totalTasks > 0 ? Math.round((count / totalTasks) * 100) : 0;
            return (
              <div key={s} style={{ marginBottom: '0.85rem' }}>
                <div className="flex items-center justify-between mb-1">
                  <StatusBadge status={s as 'TODO'} />
                  <span className="text-xs text-muted">{count} · {pct}%</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Upcoming due dates */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Due This Week</span>
            <Clock size={16} style={{ color: 'var(--text-muted)' }} />
          </div>
          {tasksLoading ? (
            <Spinner />
          ) : upcomingTasks && upcomingTasks.length > 0 ? (
            upcomingTasks.slice(0, 5).map((task) => (
              <div key={task.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--border)' }}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div className="text-sm truncate">{task.title}</div>
                  <div className="text-xs text-muted mt-1">
                    Due {formatDistanceToNow(new Date(task.dueDate), { addSuffix: true })}
                  </div>
                </div>
                <PriorityBadge priority={task.priority} />
              </div>
            ))
          ) : (
            <p className="text-sm text-muted">No tasks due this week 🎉</p>
          )}
        </div>
      </div>

      {/* Live Activity Feed */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Live Activity Feed</span>
          <div className="online-indicator">
            <div className="online-dot-pulse" />
            <span>Live</span>
          </div>
        </div>
        <div className="activity-feed">
          {displayActivity.length === 0 ? (
            <p className="text-sm text-muted">No activity yet</p>
          ) : (
            displayActivity.slice(0, 15).map((log) => (
              <ActivityItem key={log.id} log={log} />
            ))
          )}
        </div>
      </div>
    </div>
  );
};
