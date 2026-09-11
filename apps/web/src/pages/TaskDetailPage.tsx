import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Calendar, User as UserIcon, Clock, X } from 'lucide-react';
import { format, formatDistanceToNow, isPast } from 'date-fns';
import { api } from '../lib/api';
import { useAuthStore } from '../store/authStore';
import { StatusBadge, PriorityBadge, Avatar, Spinner, Skeleton } from '../components/ui';
import type { ApiResponse, Task, TaskStatus, User } from '../types';

const STATUS_OPTIONS: TaskStatus[] = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'];
const STATUS_LABELS: Record<TaskStatus, string> = {
  TODO: 'To Do', IN_PROGRESS: 'In Progress', IN_REVIEW: 'In Review', DONE: 'Done',
};

const UpdateTaskModal: React.FC<{ task: Task; onClose: () => void }> = ({ task, onClose }) => {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    title: task.title, 
    description: task.description || '', 
    assigneeId: task.assigneeId,
    priority: task.priority, 
    dueDate: format(new Date(task.dueDate), "yyyy-MM-dd'T'HH:mm")
  });

  const { data: users } = useQuery({
    queryKey: ['users', 'DEVELOPER'],
    queryFn: async () => (await api.get<ApiResponse<User[]>>('/users?role=DEVELOPER')).data.data,
  });

  const mutation = useMutation({
    mutationFn: () => api.patch(`/tasks/${task.id}`, { ...form, dueDate: new Date(form.dueDate).toISOString() }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['task', task.id] });
      onClose();
    },
  });

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">Edit Task</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={18} /></button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="input-group">
            <label className="input-label">Title *</label>
            <input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div className="input-group">
            <label className="input-label">Description</label>
            <textarea className="input" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="input-group">
            <label className="input-label">Assignee *</label>
            <select className="input" value={form.assigneeId} onChange={(e) => setForm({ ...form, assigneeId: e.target.value })}>
              {users?.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>
          <div className="grid-2" style={{ gap: '1rem' }}>
            <div className="input-group">
              <label className="input-label">Priority</label>
              <select className="input" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as any })}>
                <option value="LOW">Low</option><option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option><option value="CRITICAL">Critical</option>
              </select>
            </div>
            <div className="input-group">
              <label className="input-label">Due Date *</label>
              <input className="input" type="datetime-local" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={() => mutation.mutate()} disabled={!form.title || !form.dueDate || mutation.isPending}>
            {mutation.isPending ? <Spinner /> : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

export const TaskDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [showEditTask, setShowEditTask] = useState(false);

  const { data: task, isLoading } = useQuery({
    queryKey: ['task', id],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Task>>(`/tasks/${id}`);
      return data.data;
    },
    enabled: !!id,
  });

  const updateStatusMutation = useMutation({
    mutationFn: (status: TaskStatus) => api.patch(`/tasks/${id}`, { status }),
    onMutate: () => setStatusUpdating(true),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['task', id] });
      qc.invalidateQueries({ queryKey: ['my-tasks'] });
      setStatusUpdating(false);
    },
    onError: () => setStatusUpdating(false),
  });

  const deleteTaskMutation = useMutation({
    mutationFn: () => api.delete(`/tasks/${id}`),
    onSuccess: () => {
      if (task?.project?.id) {
        qc.invalidateQueries({ queryKey: ['project', task.project.id] });
      }
      navigate(-1);
    },
  });

  if (isLoading) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <Skeleton height="2.5rem" width="40%" />
      <div className="grid-2" style={{ gap: '1.5rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Skeleton height="150px" width="100%" />
          <Skeleton height="200px" width="100%" />
        </div>
        <Skeleton height="400px" width="100%" />
      </div>
    </div>
  );
  if (!task) return <div className="text-muted">Task not found or access denied</div>;

  const overdue = task.isOverdue || (isPast(new Date(task.dueDate)) && task.status !== 'DONE');
  const canChangeStatus = user?.role !== undefined;
  const isDevOnly = user?.role === 'DEVELOPER';

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1.5rem' }}>
        <button className="btn btn-ghost btn-icon" onClick={() => navigate(-1)}>
          <ArrowLeft size={18} />
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
            <StatusBadge status={task.status} overdue={overdue} />
            <PriorityBadge priority={task.priority} />
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{task.title}</h1>
          {task.project && (
            <button
              className="text-sm text-secondary mt-1"
              style={{ cursor: 'pointer' }}
              onClick={() => navigate(`/projects/${task.project?.id}`)}
            >
              ← {task.project.name}
            </button>
          )}
        </div>
        {(user?.role === 'ADMIN' || user?.role === 'PM') && (
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button className="btn btn-secondary" onClick={() => setShowEditTask(true)}>
              Edit Task
            </button>
            <button
              className="btn btn-secondary"
              style={{ color: 'var(--status-critical)' }}
              onClick={() => {
                if (window.confirm('Are you sure you want to delete this task?')) {
                  deleteTaskMutation.mutate();
                }
              }}
              disabled={deleteTaskMutation.isPending}
            >
              Delete
            </button>
          </div>
        )}
      </div>

      <div className="grid-2" style={{ gap: '1.5rem' }}>
        {/* Left: Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Description */}
          <div className="card">
            <div className="card-header"><span className="card-title">Description</span></div>
            {task.description ? (
              <p className="text-sm text-secondary" style={{ lineHeight: 1.7 }}>{task.description}</p>
            ) : (
              <p className="text-sm text-muted">No description provided</p>
            )}
          </div>

          {/* Meta */}
          <div className="card">
            <div className="card-header"><span className="card-title">Details</span></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {task.assignee && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <UserIcon size={16} style={{ color: 'var(--text-muted)' }} />
                  <span className="text-sm text-muted" style={{ width: 80 }}>Assignee</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Avatar name={task.assignee.name} size="sm" />
                    <span className="text-sm">{task.assignee.name}</span>
                  </div>
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Calendar size={16} style={{ color: 'var(--text-muted)' }} />
                <span className="text-sm text-muted" style={{ width: 80 }}>Due Date</span>
                <span className={`text-sm${overdue ? ' ' : ''}`} style={{ color: overdue ? 'var(--status-overdue)' : 'var(--text-primary)' }}>
                  {format(new Date(task.dueDate), 'MMMM d, yyyy')}
                  {overdue && ' (Overdue)'}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Clock size={16} style={{ color: 'var(--text-muted)' }} />
                <span className="text-sm text-muted" style={{ width: 80 }}>Created</span>
                <span className="text-sm">{formatDistanceToNow(new Date(task.createdAt), { addSuffix: true })}</span>
              </div>
            </div>
          </div>

          {/* Status Update */}
          {canChangeStatus && (
            <div className="card">
              <div className="card-header">
                <span className="card-title">Update Status</span>
                {statusUpdating && <Spinner />}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {STATUS_OPTIONS.map((status) => {
                  const isActive = task.status === status;
                  // Developer can only move to next status (simplified: allow any)
                  return (
                    <button
                      key={status}
                      className={`btn${isActive ? ' btn-primary' : ' btn-secondary'}`}
                      style={{ justifyContent: 'flex-start' }}
                      onClick={() => !isActive && updateStatusMutation.mutate(status)}
                      disabled={isActive || statusUpdating}
                    >
                      <span style={{
                        width: 8, height: 8, borderRadius: '50%', display: 'inline-block',
                        background: isActive ? 'white' :
                          status === 'TODO' ? '#475569' :
                          status === 'IN_PROGRESS' ? '#f59e0b' :
                          status === 'IN_REVIEW' ? '#6366f1' : '#10b981',
                      }} />
                      {STATUS_LABELS[status]}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right: Activity Log */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Activity Log</span>
            <span className="text-xs text-muted">{task.activityLogs?.length ?? 0} events</span>
          </div>
          <div className="activity-feed">
            {!task.activityLogs || task.activityLogs.length === 0 ? (
              <p className="text-sm text-muted">No activity yet</p>
            ) : (
              task.activityLogs.map((log) => (
                <div key={log.id} className="activity-item">
                  <Avatar name={log.user.name} size="sm" />
                  <div className="activity-content">
                    <div className="activity-message">{log.message}</div>
                    <div className="activity-time">
                      {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      {showEditTask && <UpdateTaskModal task={task} onClose={() => setShowEditTask(false)} />}
    </div>
  );
};
