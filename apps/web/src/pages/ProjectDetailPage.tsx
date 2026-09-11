import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Plus, Calendar, X, Clock } from 'lucide-react';
import { format, isPast } from 'date-fns';
import { api } from '../lib/api';
import { useAuthStore } from '../store/authStore';
import { useSocketStore } from '../store/socketStore';
import { StatusBadge, PriorityBadge, Avatar, Spinner, Skeleton } from '../components/ui';
import type { ApiResponse, Project, Task, TaskStatus, User } from '../types';

const COLUMNS: { status: TaskStatus; label: string; color: string }[] = [
  { status: 'TODO',        label: 'To Do',       color: '#475569' },
  { status: 'IN_PROGRESS', label: 'In Progress',  color: '#f59e0b' },
  { status: 'IN_REVIEW',   label: 'In Review',    color: '#6366f1' },
  { status: 'DONE',        label: 'Done',         color: '#10b981' },
];

const CreateTaskModal: React.FC<{ projectId: string; onClose: () => void }> = ({ projectId, onClose }) => {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    title: '', description: '', assigneeId: '',
    priority: 'MEDIUM', dueDate: '', status: 'TODO',
  });

  const { data: users } = useQuery({
    queryKey: ['users', 'DEVELOPER'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<User[]>>('/users?role=DEVELOPER');
      return data.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: () => api.post('/tasks', {
      ...form,
      projectId,
      dueDate: new Date(form.dueDate).toISOString(),
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['project', projectId] });
      onClose();
    },
  });

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">New Task</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={18} /></button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          <div className="input-group">
            <label className="input-label">Title *</label>
            <input className="input" placeholder="Task title" value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div className="input-group">
            <label className="input-label">Description</label>
            <textarea className="input" rows={2} placeholder="Optional..." value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="input-group">
              <label className="input-label">Assignee *</label>
              <select className="input" value={form.assigneeId}
                onChange={(e) => setForm({ ...form, assigneeId: e.target.value })}>
                <option value="">Select developer</option>
                {users?.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
            <div className="input-group">
              <label className="input-label">Priority</label>
              <select className="input" value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                {['LOW','MEDIUM','HIGH','CRITICAL'].map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="input-group">
              <label className="input-label">Status</label>
              <select className="input" value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}>
                {['TODO','IN_PROGRESS','IN_REVIEW','DONE'].map((s) => <option key={s} value={s}>{s.replace('_',' ')}</option>)}
              </select>
            </div>
            <div className="input-group">
              <label className="input-label">Due Date *</label>
              <input className="input" type="date" value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary"
            onClick={() => createMutation.mutate()}
            disabled={!form.title || !form.assigneeId || !form.dueDate || createMutation.isPending}>
            {createMutation.isPending ? <Spinner /> : 'Create Task'}
          </button>
        </div>
      </div>
    </div>
  );
};

const TaskCard: React.FC<{ task: Task; onClick: () => void }> = ({ task, onClick }) => {
  const overdue = task.isOverdue || (isPast(new Date(task.dueDate)) && task.status !== 'DONE');
  return (
    <div className="task-card" onClick={onClick}>
      <div className="task-card-title">{task.title}</div>
      <div style={{ display: 'flex', gap: '0.35rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
        <PriorityBadge priority={task.priority} />
        {overdue && <span className="badge badge-overdue">Overdue</span>}
      </div>
      <div className="task-card-meta">
        <div className={`task-card-date${overdue ? ' overdue' : ''}`}>
          <Clock size={12} />
          {format(new Date(task.dueDate), 'MMM d')}
        </div>
        {task.assignee && <Avatar name={task.assignee.name} size="sm" />}
      </div>
    </div>
  );
};

const UpdateProjectModal: React.FC<{ project: Project; onClose: () => void }> = ({ project, onClose }) => {
  const qc = useQueryClient();
  const { user } = useAuthStore();
  const [form, setForm] = useState({
    name: project.name, description: project.description || '',
    clientId: project.clientId, pmId: project.createdById, status: project.status,
  });

  const { data: clients } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => (await api.get<ApiResponse<any[]>>('/clients')).data.data,
  });
  
  const { data: pms } = useQuery({
    queryKey: ['users', 'PM'],
    queryFn: async () => (await api.get<ApiResponse<any[]>>('/users?role=PM')).data.data,
    enabled: user?.role === 'ADMIN',
  });

  const mutation = useMutation({
    mutationFn: () => api.patch(`/projects/${project.id}`, form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['project', project.id] });
      qc.invalidateQueries({ queryKey: ['projects'] });
      onClose();
    },
  });

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">Edit Project</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={18} /></button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="input-group">
            <label className="input-label">Project Name *</label>
            <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="input-group">
            <label className="input-label">Description</label>
            <textarea className="input" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="input-group">
            <label className="input-label">Client *</label>
            <select className="input" value={form.clientId} onChange={(e) => setForm({ ...form, clientId: e.target.value })}>
              <option value="">Select a client</option>
              {clients?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          {user?.role === 'ADMIN' && (
            <div className="input-group">
              <label className="input-label">Project Manager *</label>
              <select className="input" value={form.pmId} onChange={(e) => setForm({ ...form, pmId: e.target.value })}>
                <option value="">Select a PM</option>
                {pms?.map((pm) => <option key={pm.id} value={pm.id}>{pm.name}</option>)}
              </select>
            </div>
          )}
          <div className="input-group">
            <label className="input-label">Status</label>
            <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as any })}>
              <option value="ACTIVE">Active</option>
              <option value="ON_HOLD">On Hold</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={() => mutation.mutate()} disabled={!form.name || !form.clientId || (user?.role === 'ADMIN' && !form.pmId) || mutation.isPending}>
            {mutation.isPending ? <Spinner /> : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

export const ProjectDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { recentActivity } = useSocketStore();
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [showEditProject, setShowEditProject] = useState(false);
  const [filterStatus, setFilterStatus] = useState<TaskStatus | ''>('');
  const [filterPriority, setFilterPriority] = useState('');

  const { data: project, isLoading } = useQuery({
    queryKey: ['project', id],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Project>>(`/projects/${id}`);
      return data.data;
    },
    enabled: !!id,
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ taskId, status }: { taskId: string; status: string }) =>
      api.patch(`/tasks/${taskId}`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['project', id] }),
  });

  const deleteProjectMutation = useMutation({
    mutationFn: () => api.delete(`/projects/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects'] });
      navigate('/projects');
    },
  });

  if (isLoading) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div>
        <Skeleton height="2.5rem" width="30%" style={{ marginBottom: '0.5rem' }} />
        <Skeleton height="1rem" width="50%" />
      </div>
      <div className="task-board">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="task-column">
            <Skeleton height="1.5rem" width="40%" style={{ marginBottom: '1rem' }} />
            <Skeleton height="100px" width="100%" style={{ marginBottom: '0.75rem' }} />
            <Skeleton height="100px" width="100%" />
          </div>
        ))}
      </div>
    </div>
  );
  if (!project) return <div className="text-muted">Project not found</div>;

  const tasksByStatus = (status: TaskStatus) =>
    (project.tasks ?? []).filter((t) => {
      if (filterStatus && t.status !== filterStatus) return false;
      if (filterPriority && t.priority !== filterPriority) return false;
      return t.status === status;
    });

  const projectActivity = recentActivity.filter((a) => a.projectId === id);

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1.5rem' }}>
        <button className="btn btn-ghost btn-icon" onClick={() => navigate('/projects')}>
          <ArrowLeft size={18} />
        </button>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{project.name}</h1>
          <p className="text-sm text-secondary mt-1">
            {project.client.name} · {project.description}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          {(user?.role === 'ADMIN' || (user?.role === 'PM' && project.createdById === user?.id)) && (
            <>
              <button className="btn btn-secondary" onClick={() => setShowEditProject(true)}>
                Edit Project
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  if (window.confirm('Are you sure you want to delete this project?')) {
                    deleteProjectMutation.mutate();
                  }
                }}
                disabled={deleteProjectMutation.isPending}
              >
                Delete
              </button>
            </>
          )}
          {(user?.role === 'ADMIN' || user?.role === 'PM') && (
            <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
              <Plus size={16} /> Add Task
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <span className="text-xs text-muted font-semibold" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>Filter:</span>
        {['', 'TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'].map((s) => (
          <button key={s} className={`filter-chip${filterStatus === s ? ' active' : ''}`}
            onClick={() => setFilterStatus(s as TaskStatus | '')}>
            {s === '' ? 'All Status' : s.replace('_',' ')}
          </button>
        ))}
        <div style={{ width: 1, height: 20, background: 'var(--border)' }} />
        {['', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map((p) => (
          <button key={p} className={`filter-chip${filterPriority === p ? ' active' : ''}`}
            onClick={() => setFilterPriority(p)}>
            {p === '' ? 'All Priority' : p}
          </button>
        ))}
      </div>

      {/* Task Board */}
      <div className="task-board mb-6">
        {COLUMNS.map((col) => {
          const colTasks = tasksByStatus(col.status);
          return (
            <div key={col.status} className="task-column">
              <div className="task-column-header">
                <div className="task-column-title">
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: col.color, display: 'inline-block' }} />
                  {col.label}
                </div>
                <span className="column-count">{colTasks.length}</span>
              </div>
              <div className="task-column-body">
                {colTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onClick={() => navigate(`/tasks/${task.id}`)}
                  />
                ))}
                {colTasks.length === 0 && (
                  <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                    Empty
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Activity Feed */}
      {projectActivity.length > 0 && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">Recent Activity</span>
            <div className="online-indicator"><div className="online-dot-pulse" /><span>Live</span></div>
          </div>
          <div className="activity-feed">
            {projectActivity.slice(0, 10).map((log) => (
              <div key={log.id} className="activity-item">
                <Avatar name={log.user.name} size="sm" />
                <div className="activity-content">
                  <div className="activity-message">{log.message}</div>
                  <div className="activity-time">{format(new Date(log.createdAt), 'MMM d, h:mm a')}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showCreate && <CreateTaskModal projectId={id!} onClose={() => setShowCreate(false)} />}
      {showEditProject && <UpdateProjectModal project={project} onClose={() => setShowEditProject(false)} />}
    </div>
  );
};
