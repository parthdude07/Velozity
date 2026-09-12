import React, { useEffect, useState } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { AppRouter } from './router';
import { useAuthStore } from './store/authStore';
import { api } from './lib/api';
import { Spinner } from './components/ui';
import type { ApiResponse, User } from './types';

// On app boot: try to get a fresh access token via the HttpOnly refresh cookie
// This restores auth state after page refresh without exposing tokens in localStorage
const AuthBootstrap: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, setAuth, logout } = useAuthStore();
  const [booting, setBooting] = useState(!isAuthenticated);

  useEffect(() => {
    if (isAuthenticated) { setBooting(false); return; }

    api.post<ApiResponse<{ accessToken: string; user: User }>>(
      '/auth/refresh',
      {}
    )
      .then(({ data }) => {
        setAuth(data.data.user, data.data.accessToken);
      })
      .catch(() => {
        logout();
      })
      .finally(() => setBooting(false));
  }, []);

  if (booting) {
    return (
      <div className="loading-screen">
        <Spinner size="lg" />
        <span>Loading workspace...</span>
      </div>
    );
  }

  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthBootstrap>
          <AppRouter />
        </AuthBootstrap>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
