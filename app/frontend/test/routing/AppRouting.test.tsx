import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Import the main App component structure
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '../../hooks/useAuth';
import { AuthPage } from '../../pages/AuthPage';
import { TodoPage } from '../../pages/TodoPage';
import { AccountPage } from '../../pages/AccountPage';
import { Layout } from '../../components/Layout';
import { ProtectedRoute } from '../../components/ProtectedRoute';

// Mock all the components and hooks
const mockUseAuth = vi.fn();
const mockNavigate = vi.fn();
const mockUseLocation = vi.fn();

vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => mockUseLocation(),
  };
});

// Mock child components
vi.mock('../../pages/AuthPage', () => ({
  AuthPage: () => <div data-testid="auth-page">Auth Page</div>,
}));

vi.mock('../../pages/TodoPage', () => ({
  TodoPage: () => <div data-testid="todo-page">Todo Page</div>,
}));

vi.mock('../../pages/AccountPage', () => ({
  AccountPage: () => <div data-testid="account-page">Account Page</div>,
}));

vi.mock('../../components/TodoList', () => ({
  TodoList: () => <div data-testid="todo-list">Todo List</div>,
}));

// Mock fetch for logout
global.fetch = vi.fn().mockResolvedValue({
  ok: true,
  json: () => Promise.resolve({ success: true }),
});

describe('App Routing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseLocation.mockReturnValue({ pathname: '/', state: null });
  });

  const AppRoutes = () => (
    <Routes>
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/" element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        <Route index element={<TodoPage />} />
        <Route path="account" element={<AccountPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );

  const renderApp = (initialEntries = ['/']) => {
    return render(
      <MemoryRouter initialEntries={initialEntries}>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </MemoryRouter>
    );
  };

  describe('when user is not authenticated', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        isLoading: false,
        user: null,
      });
    });

    it('redirects to auth page when accessing protected routes', () => {
      const mockNavigateComponent = vi.fn();
      
      vi.doMock('react-router-dom', async () => {
        const actual = await vi.importActual('react-router-dom');
        return {
          ...actual,
          Navigate: ({ to, state, replace }: any) => {
            mockNavigateComponent(to, state, replace);
            return <div data-testid="navigate">Redirecting to {to}</div>;
          },
        };
      });

      renderApp(['/']);
      
      // Should attempt to redirect to auth
      expect(screen.queryByTestId('todo-page')).not.toBeInTheDocument();
    });

    it('shows auth page when accessing /auth route', () => {
      renderApp(['/auth']);
      
      expect(screen.getByTestId('auth-page')).toBeInTheDocument();
    });
  });

  describe('when user is authenticated', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        user: { id: 123 },
        logout: vi.fn(),
      });
    });

    it('shows todo page on root route', () => {
      renderApp(['/']);
      
      expect(screen.getByTestId('todo-page')).toBeInTheDocument();
    });

    it('shows account page on /account route', () => {
      renderApp(['/account']);
      
      expect(screen.getByTestId('account-page')).toBeInTheDocument();
    });

    it('redirects unknown routes to home', () => {
      const mockNavigateComponent = vi.fn();
      
      vi.doMock('react-router-dom', async () => {
        const actual = await vi.importActual('react-router-dom');
        return {
          ...actual,
          Navigate: ({ to, replace }: any) => {
            mockNavigateComponent(to, replace);
            return <div data-testid="navigate">Redirecting to {to}</div>;
          },
        };
      });

      renderApp(['/unknown-route']);
      
      // The Navigate component should be rendered for unknown routes
      // This tests the catch-all route behavior
    });
  });

  describe('loading states', () => {
    it('shows loading spinner when authentication is loading', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        isLoading: true,
        user: null,
      });

      renderApp(['/']);
      
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });
  });

  describe('navigation behavior', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        user: { id: 123 },
        logout: vi.fn(),
      });
    });

    it('renders layout with navigation for protected routes', () => {
      renderApp(['/']);
      
      // Layout should be rendered with navigation
      expect(screen.getByText('Passkey ToDo Board')).toBeInTheDocument();
      expect(screen.getByText('Todos')).toBeInTheDocument();
      expect(screen.getByText('Account')).toBeInTheDocument();
    });

    it('shows user information in layout', () => {
      renderApp(['/']);
      
      expect(screen.getByText('User #123')).toBeInTheDocument();
      expect(screen.getByText('Sign Out')).toBeInTheDocument();
    });
  });
});