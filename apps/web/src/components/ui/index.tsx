import React from 'react';
import type { TaskStatus, TaskPriority, Role } from '../../types';

// ── Status Badge
const STATUS_MAP: Record<TaskStatus, { label: string; cls: string }> = {
  TODO:        { label: 'To Do',       cls: 'badge-todo' },
  IN_PROGRESS: { label: 'In Progress', cls: 'badge-progress' },
  IN_REVIEW:   { label: 'In Review',   cls: 'badge-review' },
  DONE:        { label: 'Done',        cls: 'badge-done' },
};

export const StatusBadge: React.FC<{ status: TaskStatus; overdue?: boolean }> = ({ status, overdue }) => {
  if (overdue && status !== 'DONE') {
    return <span className="badge badge-overdue">Overdue</span>;
  }
  const s = STATUS_MAP[status];
  return <span className={`badge ${s.cls}`}>{s.label}</span>;
};

// ── Priority Badge
const PRIORITY_MAP: Record<TaskPriority, { label: string; cls: string }> = {
  LOW:      { label: 'Low',      cls: 'badge-low' },
  MEDIUM:   { label: 'Medium',   cls: 'badge-medium' },
  HIGH:     { label: 'High',     cls: 'badge-high' },
  CRITICAL: { label: 'Critical', cls: 'badge-critical' },
};

export const PriorityBadge: React.FC<{ priority: TaskPriority }> = ({ priority }) => {
  const p = PRIORITY_MAP[priority];
  return <span className={`badge ${p.cls}`}>{p.label}</span>;
};

// ── Role Badge
const ROLE_MAP: Record<Role, { label: string; cls: string }> = {
  ADMIN:     { label: 'Admin',   cls: 'badge-admin' },
  PM:        { label: 'PM',      cls: 'badge-pm' },
  DEVELOPER: { label: 'Dev',     cls: 'badge-dev' },
};

export const RoleBadge: React.FC<{ role: Role }> = ({ role }) => {
  const r = ROLE_MAP[role];
  return <span className={`badge ${r.cls}`}>{r.label}</span>;
};

// ── Avatar
export const Avatar: React.FC<{ name: string; size?: 'sm' | 'md' | 'lg'; online?: boolean }> = ({
  name,
  size = 'md',
  online,
}) => {
  const initials = name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const sizeClass = size === 'sm' ? 'avatar-sm' : size === 'lg' ? 'avatar-lg' : '';
  const bgColors = [
    'linear-gradient(135deg, #6366f1, #8b5cf6)',
    'linear-gradient(135deg, #0ea5e9, #6366f1)',
    'linear-gradient(135deg, #10b981, #0ea5e9)',
    'linear-gradient(135deg, #f59e0b, #f97316)',
    'linear-gradient(135deg, #ec4899, #8b5cf6)',
  ];
  const bg = bgColors[name.charCodeAt(0) % bgColors.length];

  return (
    <div className={`avatar ${sizeClass}`} style={{ background: bg }}>
      {initials}
      {online && <span className="online-dot" />}
    </div>
  );
};

// ── Spinner
export const Spinner: React.FC<{ size?: 'sm' | 'lg' }> = ({ size }) => (
  <div className={`spinner ${size === 'lg' ? 'spinner-lg' : ''}`} />
);

// ── Skeleton
export const Skeleton: React.FC<{
  className?: string;
  style?: React.CSSProperties;
  height?: string | number;
  width?: string | number;
  borderRadius?: string | number;
}> = ({ className = '', style, height, width, borderRadius }) => (
  <div
    className={`skeleton ${className}`}
    style={{ height, width, borderRadius, ...style }}
  />
);

// ── Empty State
export const EmptyState: React.FC<{ message: string; icon?: React.ReactNode }> = ({ message, icon }) => (
  <div className="empty-state">
    {icon}
    <p>{message}</p>
  </div>
);
