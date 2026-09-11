import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, FolderOpen, Search, X } from 'lucide-react';
import { api } from '../lib/api';
import { useAuthStore } from '../store/authStore';
import { Avatar, StatusBadge, EmptyState, Spinner, Skeleton } from '../components/ui';
import type { ApiResponse, Project, Client, User } from '../types';

const StatusDot: React.FC<{ status: string }> = ({ status }) => {
  const colors: Record<string, string> = {
    ACTIVE: '#10b981',
    COMPLETED: '#6366f1',
    ON_HOLD: '#f59e0b',
  };
  return (
    <span
      style={{
        display: 'inline-block',
        width: 8,
        height: 8,
        borderRadius: '50%',
        background: colors[status] ?? '#475569',
        marginRight: '0.4rem',
      }}
    />
  );
};

const CreateProjectModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const qc = useQueryClient();
  const { user } = useAuthStore();
  const [form, setForm] = useState({ name: '', description: '', clientId: '', pmId: '', status: 'ACTIVE' });

  const { data: pms } = useQuery({
    queryKey: ['users', 'PM'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<User[]>>('/users?role=PM');
      return data.data;
    },
    enabled: user?.role === 'ADMIN',
  });

  const { data: clients } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Client[]>>('/clients');
      return data.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: () => api.post('/projects', form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects'] });
      onClose();
    },
  });

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">New Project</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={18} /></button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="input-group">
            <label className="input-label">Project Name *</label>
            <input className="input" placeholder="E.g. Website Redesign" value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="input-group">
            <label className="input-label">Description</label>
            <textarea className="input" rows={3} placeholder="Optional project description"
              value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="input-group">
            <label className="input-label">Client *</label>
            <select className="input" value={form.clientId}
              onChange={(e) => setForm({ ...form, clientId: e.target.value })}>
              <option value="">Select a client</option>
              {clients?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          {user?.role === 'ADMIN' && (
            <div className="input-group">
              <label className="input-label">Project Manager *</label>
              <select className="input" value={form.pmId}
                onChange={(e) => setForm({ ...form, pmId: e.target.value })}>
                <option value="">Select a PM</option>
                {pms?.map((pm) => <option key={pm.id} value={pm.id}>{pm.name}</option>)}
              </select>
            </div>
          )}
          <div className="input-group">
            <label className="input-label">Status</label>
            <select className="input" value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="ACTIVE">Active</option>
              <option value="ON_HOLD">On Hold</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button
            className="btn btn-primary"
            onClick={() => createMutation.mutate()}
            disabled={!form.name || !form.clientId || (user?.role === 'ADMIN' && !form.pmId) || createMutation.isPending}
          >
            {createMutation.isPending ? <Spinner /> : 'Create Project'}
          </button>
        </div>
      </div>
    </div>
  );
};

export const ProjectsPage: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  const { data: projects, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Project[]>>('/projects');
      return data.data;
    },
  });

  const filtered = projects?.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.client.name.toLowerCase().includes(search.toLowerCase())
  ) ?? [];

  return (
    <div>
      <div className="page-header flex items-center justify-between" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1>Projects</h1>
          <p>{filtered.length} project{filtered.length !== 1 ? 's' : ''}</p>
        </div>
        {(user?.role === 'ADMIN' || user?.role === 'PM') && (
          <button className="btn btn-primary" id="create-project-btn" onClick={() => setShowCreate(true)}>
            <Plus size={16} /> New Project
          </button>
        )}
      </div>

      {/* Search */}
      <div className="input-icon-wrapper mb-6" style={{ maxWidth: 360 }}>
        <Search size={16} className="input-icon" />
        <input className="input" placeholder="Search projects or clients..." value={search}
          onChange={(e) => setSearch(e.target.value)} />
      </div>

      {isLoading ? (
        <div className="grid-2" style={{ gap: '1.5rem' }}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: 160 }}>
              <Skeleton height="1.5rem" width="70%" />
              <Skeleton height="1rem" width="40%" />
              <Skeleton height="2rem" width="100%" style={{ marginTop: 'auto' }} />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState message="No projects found" icon={<FolderOpen size={48} />} />
      ) : (
        <div className="grid-2" style={{ gap: '1.5rem' }}>
          {filtered.map((project) => (
            <div
              key={project.id}
              className="card"
              style={{ cursor: 'pointer' }}
              onClick={() => navigate(`/projects/${project.id}`)}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 className="text-base font-semibold truncate">{project.name}</h3>
                  <p className="text-xs text-secondary mt-1">{project.client.name}</p>
                </div>
              </div>

              {project.description && (
                <p className="text-sm text-secondary mb-3 truncate">{project.description}</p>
              )}

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span className="text-xs text-muted">
                  <StatusDot status={project.status} />
                  {project.status.replace('_', ' ')}
                </span>
                <span className="text-xs text-muted">{project._count?.tasks ?? 0} tasks</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.85rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border)' }}>
                <Avatar name={project.createdBy.name} size="sm" />
                <span className="text-xs text-muted">{project.createdBy.name}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreate && <CreateProjectModal onClose={() => setShowCreate(false)} />}
    </div>
  );
};
