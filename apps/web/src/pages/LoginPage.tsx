import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Zap, Eye, EyeOff } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import { connectSocket } from '../lib/socket';
import { Spinner } from '../components/ui';
import type { ApiResponse, User } from '../types';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');

  const loginMutation = useMutation({
    mutationFn: async () => {
      const { data } = await axios.post<ApiResponse<{ user: User; accessToken: string }>>(
        '/api/auth/login',
        { email, password },
        { withCredentials: true }
      );
      return data.data;
    },
    onSuccess: ({ user, accessToken }) => {
      setAuth(user, accessToken);
      connectSocket();
      navigate('/dashboard');
    },
    onError: (err: unknown) => {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.error ?? 'Login failed');
      } else {
        setError('An unexpected error occurred');
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    loginMutation.mutate();
  };

  return (
    <div className="login-page">
      <div className="login-bg-orb login-bg-orb-1" />
      <div className="login-bg-orb login-bg-orb-2" />

      <div className="login-card">
        <div className="login-logo">
          <div className="login-logo-icon">
            <Zap size={24} color="white" />
          </div>
        </div>

        <h1 className="login-title">Welcome back</h1>
        <p className="login-subtitle">Sign in to your Velozity workspace</p>

        <form className="login-form" onSubmit={handleSubmit} id="login-form">
          {error && <div className="login-error">{error}</div>}

          <div className="input-group">
            <label className="input-label" htmlFor="email">Email</label>
            <div className="input-icon-wrapper">
              <Mail size={16} className="input-icon" />
              <input
                id="email"
                className="input"
                type="email"
                placeholder="you@velozity.dev"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
          </div>

          <div className="input-group">
            <label className="input-label" htmlFor="password">Password</label>
            <div className="input-icon-wrapper">
              <Lock size={16} className="input-icon" />
              <input
                id="password"
                className="input"
                type={showPass ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                style={{ paddingRight: '2.5rem' }}
              />
              <button
                type="button"
                onClick={() => setShowPass((s) => !s)}
                style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            id="login-submit"
            type="submit"
            className="btn btn-primary btn-lg w-full"
            disabled={loginMutation.isPending}
            style={{ justifyContent: 'center', marginTop: '0.5rem' }}
          >
            {loginMutation.isPending ? <Spinner /> : 'Sign in'}
          </button>
        </form>

        {/* Credentials hint for demo */}
        <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
          <p className="text-xs text-muted" style={{ marginBottom: '0.5rem', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Demo credentials</p>
          {[
            { label: 'Admin', email: 'admin@velozity.dev', pass: 'Admin@1234' },
            { label: 'PM 1',  email: 'pm1@velozity.dev',   pass: 'Pm1@1234' },
            { label: 'PM 2',  email: 'pm2@velozity.dev',   pass: 'Pm2@1234' },
            { label: 'Dev 1', email: 'dev1@velozity.dev',  pass: 'Dev1@1234' },
            { label: 'Dev 2', email: 'dev2@velozity.dev',  pass: 'Dev2@1234' },
            { label: 'Dev 3', email: 'dev3@velozity.dev',  pass: 'Dev3@1234' },
          ].map((c) => (
            <button
              key={c.label}
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => { setEmail(c.email); setPassword(c.pass); }}
              style={{ marginRight: '0.5rem', marginTop: '0.25rem' }}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
