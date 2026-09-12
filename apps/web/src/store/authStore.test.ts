import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from './authStore';
import type { User } from '../types';

describe('Auth Store', () => {
  const mockUser: User = {
    id: '1',
    name: 'Test User',
    email: 'test@example.com',
    role: 'DEVELOPER',
    isOnline: true,
    createdAt: new Date().toISOString(),
  };

  beforeEach(() => {
    useAuthStore.setState({
      user: null,
      accessToken: null,
      isAuthenticated: false,
    });
  });

  it('should initialize with default state', () => {
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.accessToken).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });

  it('should set auth correctly on login', () => {
    useAuthStore.getState().setAuth(mockUser, 'mockAccessToken');
    
    const state = useAuthStore.getState();
    expect(state.user).toEqual(mockUser);
    expect(state.accessToken).toBe('mockAccessToken');
    expect(state.isAuthenticated).toBe(true);
  });

  it('should set access token correctly', () => {
    useAuthStore.getState().setAccessToken('newAccessToken');
    
    const state = useAuthStore.getState();
    expect(state.accessToken).toBe('newAccessToken');
  });

  it('should clear state on logout', () => {
    useAuthStore.getState().setAuth(mockUser, 'mockAccessToken');
    
    // Ensure it was set
    expect(useAuthStore.getState().isAuthenticated).toBe(true);

    useAuthStore.getState().logout();
    
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.accessToken).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });
});
