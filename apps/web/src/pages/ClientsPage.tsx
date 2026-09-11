import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Building2, X, Edit, Trash2 } from 'lucide-react';
import { api } from '../lib/api';
import { EmptyState, Spinner, Skeleton } from '../components/ui';
import { useAuthStore } from '../store/authStore';
import type { ApiResponse, Client } from '../types';

const CreateClientModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const qc = useQueryClient();
  const [form, setForm] = useState({ name: '', email: '', phone: '' });

  const mutation = useMutation({
    mutationFn: () => api.post('/clients', form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['clients'] }); onClose(); },
  });

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">New Client</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={18} /></button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="input-group">
            <label className="input-label">Name *</label>
            <input className="input" placeholder="Company name" value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="input-group">
            <label className="input-label">Email *</label>
            <input className="input" type="email" placeholder="contact@company.com" value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div className="input-group">
            <label className="input-label">Phone</label>
            <input className="input" placeholder="+91-XXXXXXXXXX" value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary"
            onClick={() => mutation.mutate()}
            disabled={!form.name || !form.email || mutation.isPending}>
            {mutation.isPending ? <Spinner /> : 'Create Client'}
          </button>
        </div>
      </div>
    </div>
  );
};

const UpdateClientModal: React.FC<{ client: Client; onClose: () => void }> = ({ client, onClose }) => {
  const qc = useQueryClient();
  const [form, setForm] = useState({ name: client.name, email: client.email, phone: client.phone || '' });

  const mutation = useMutation({
    mutationFn: () => api.patch(`/clients/${client.id}`, form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['clients'] }); onClose(); },
  });

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">Edit Client</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={18} /></button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="input-group">
            <label className="input-label">Name *</label>
            <input className="input" placeholder="Company name" value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="input-group">
            <label className="input-label">Email *</label>
            <input className="input" type="email" placeholder="contact@company.com" value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div className="input-group">
            <label className="input-label">Phone</label>
            <input className="input" placeholder="+91-XXXXXXXXXX" value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary"
            onClick={() => mutation.mutate()}
            disabled={!form.name || !form.email || mutation.isPending}>
            {mutation.isPending ? <Spinner /> : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

export const ClientsPage: React.FC = () => {
  const qc = useQueryClient();
  const { user } = useAuthStore();
  const [showCreate, setShowCreate] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  const { data: clients, isLoading } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Client[]>>('/clients');
      return data.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/clients/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['clients'] }),
  });

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1>Clients</h1>
          <p>{clients?.length ?? 0} clients</p>
        </div>
        {user?.role === 'ADMIN' && (
          <button className="btn btn-primary" id="create-client-btn" onClick={() => setShowCreate(true)}>
            <Plus size={16} /> New Client
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="grid-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="card" style={{ height: 120 }}>
              <Skeleton height="1.5rem" width="60%" style={{ marginBottom: '0.5rem' }} />
              <Skeleton height="1rem" width="40%" style={{ marginBottom: '1rem' }} />
              <Skeleton height="0.8rem" width="30%" />
            </div>
          ))}
        </div>
      ) : clients?.length === 0 ? (
        <EmptyState message="No clients yet" icon={<Building2 size={48} />} />
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Projects</th>
                <th>Created</th>
                {user?.role === 'ADMIN' && <th style={{ width: 100 }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {clients?.map((client) => (
                <tr key={client.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ width: 36, height: 36, borderRadius: '10px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '0.85rem', flexShrink: 0 }}>
                        {client.name[0]}
                      </div>
                      <span className="font-medium">{client.name}</span>
                    </div>
                  </td>
                  <td className="text-secondary">{client.email}</td>
                  <td className="text-secondary">{client.phone ?? '—'}</td>
                  <td>
                    <span style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '99px', padding: '0.15rem 0.6rem', fontSize: '0.75rem', fontWeight: 600 }}>
                      {client._count?.projects ?? 0} projects
                    </span>
                  </td>
                  <td className="text-muted text-sm">
                    {new Date(client.createdAt).toLocaleDateString()}
                  </td>
                  {user?.role === 'ADMIN' && (
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className="btn btn-ghost btn-icon" onClick={() => setEditingClient(client)}>
                          <Edit size={16} />
                        </button>
                        <button
                          className="btn btn-ghost btn-icon"
                          style={{ color: 'var(--status-critical)' }}
                          onClick={() => {
                            if (window.confirm('Are you sure you want to delete this client?')) {
                              deleteMutation.mutate(client.id);
                            }
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

      {showCreate && <CreateClientModal onClose={() => setShowCreate(false)} />}
      {editingClient && <UpdateClientModal client={editingClient} onClose={() => setEditingClient(null)} />}
    </div>
  );
};
