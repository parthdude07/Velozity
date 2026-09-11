import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, Plus, X, Edit, Trash2 } from 'lucide-react';
import { api } from '../lib/api';
import { Avatar, RoleBadge, EmptyState, Spinner, Skeleton } from '../components/ui';
import { useAuthStore } from '../store/authStore';
import type { ApiResponse, User } from '../types';

const CreateUserModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const qc = useQueryClient();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'DEVELOPER' });

  const mutation = useMutation({
    mutationFn: () => api.post('/users', form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      onClose();
    },
  });

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">New User</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={18} /></button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="input-group">
            <label className="input-label">Name *</label>
            <input className="input" placeholder="E.g. John Doe" value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="input-group">
            <label className="input-label">Email *</label>
            <input className="input" type="email" placeholder="john@example.com" value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div className="input-group">
            <label className="input-label">Password *</label>
            <input className="input" type="password" placeholder="Min 6 characters" value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </div>
          <div className="input-group">
            <label className="input-label">Role *</label>
            <select className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              <option value="ADMIN">Admin</option>
              <option value="PM">Project Manager</option>
              <option value="DEVELOPER">Developer</option>
            </select>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={() => mutation.mutate()}
            disabled={!form.name || !form.email || !form.password || mutation.isPending}>
            {mutation.isPending ? <Spinner /> : 'Create User'}
          </button>
        </div>
      </div>
    </div>
  );
};

const EditUserModal: React.FC<{ user: User; onClose: () => void }> = ({ user, onClose }) => {
  const qc = useQueryClient();
  const [form, setForm] = useState({ name: user.name, email: user.email, password: '', role: user.role });

  const mutation = useMutation({
    mutationFn: () => {
      const data: any = { name: form.name, email: form.email, role: form.role };
      if (form.password) data.password = form.password;
      return api.patch(`/users/${user.id}`, data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      onClose();
    },
  });

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">Edit User</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={18} /></button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="input-group">
            <label className="input-label">Name</label>
            <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="input-group">
            <label className="input-label">Email</label>
            <input className="input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div className="input-group">
            <label className="input-label">New Password</label>
            <input className="input" type="password" placeholder="Leave blank to keep unchanged" value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </div>
          <div className="input-group">
            <label className="input-label">Role</label>
            <select className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as any })}>
              <option value="ADMIN">Admin</option>
              <option value="PM">Project Manager</option>
              <option value="DEVELOPER">Developer</option>
            </select>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={() => mutation.mutate()} disabled={!form.name || !form.email || mutation.isPending}>
            {mutation.isPending ? <Spinner /> : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

export const UsersPage: React.FC = () => {
  const { user: currentUser } = useAuthStore();
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  
  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<User[]>>('/users');
      return data.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/users/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Users</h1>
          <p>{users?.length ?? 0} team members</p>
        </div>
        {currentUser?.role === 'ADMIN' && (
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
            <Plus size={18} /> New User
          </button>
        )}
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} height="64px" width="100%" />
          ))}
        </div>
      ) : users?.length === 0 ? (
        <EmptyState message="No users found" icon={<Users size={48} />} />
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Joined</th>
                {currentUser?.role === 'ADMIN' && <th style={{ width: 100 }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {users?.map((user) => (
                <tr key={user.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <Avatar name={user.name} online={user.isOnline} />
                      <span className="font-medium">{user.name}</span>
                    </div>
                  </td>
                  <td className="text-secondary">{user.email}</td>
                  <td><RoleBadge role={user.role} /></td>
                  <td>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem' }}>
                      <span style={{ width: 7, height: 7, borderRadius: '50%', background: user.isOnline ? '#10b981' : 'var(--text-muted)', display: 'inline-block' }} />
                      {user.isOnline ? 'Online' : 'Offline'}
                    </span>
                  </td>
                  <td className="text-muted text-sm">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  {currentUser?.role === 'ADMIN' && (
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className="btn btn-ghost btn-icon" onClick={() => setEditingUser(user)}>
                          <Edit size={16} />
                        </button>
                        <button 
                          className="btn btn-ghost btn-icon" 
                          style={{ color: 'var(--status-critical)' }}
                          onClick={() => {
                            if (window.confirm('Delete this user?')) deleteMutation.mutate(user.id);
                          }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showCreate && <CreateUserModal onClose={() => setShowCreate(false)} />}
      {editingUser && <EditUserModal user={editingUser} onClose={() => setEditingUser(null)} />}
    </div>
  );
};
