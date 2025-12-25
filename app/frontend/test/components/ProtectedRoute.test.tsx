import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { ProtectedRoute } from '../../components/ProtectedRoute';

// Mock the useAuth hook with different states
const mockUseAuth = vi.fn();

vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));

// Mock Navigate component to track redirects
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    Navigate: ({ to, state, replace }: any) => {
      mockNavigate(to, state, replace);
      return <div data-testid="navigate">Redirecting to {to}</div>;
    },
  };
});

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const TestChild = () => <div data-testid="protected-content">Protected Content</div>;

  const renderProtectedRoute = (initialEntries = ['/']) => {
    return render(
      <MemoryRouter initialEntries={initialEntries}>
        <ProtectedRoute>
          <TestChild />
        </ProtectedRoute>
      </MemoryRouter>
    );
  };

  it('renders children when user is authenticated', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
    });

    renderProtectedRoute();

    expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    expect(screen.queryByTestId('navigate')).not.toBeInTheDocument();
  });

  it('shows loading spinner when authentication is loading', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: true,
    });

    renderProtectedRoute();

    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    expect(screen.queryByTestId('navigate')).not.toBeInTheDocument();
  });

  it('redirects to auth page when user is not authenticated', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
    });

    renderProtectedRoute(['/protected']);

    expect(mockNavigate).toHaveBeenCalledWith(
      '/auth',
      { from: expect.objectContaining({ pathname: '/protected' }) },
      true
    );
    expect(screen.getByTestId('navigate')).toBeInTheDocument();
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
  });

  it('preserves the original location for redirect after auth', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
    });

    renderProtectedRoute(['/account']);

    expect(mockNavigate).toHaveBeenCalledWith(
      '/auth',
      { from: expect.objectContaining({ pathname: '/account' }) },
      true
    );
  });

  it('renders loading state with correct styling classes', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: true,
    });

    renderProtectedRoute();

    const loadingContainer = screen.getByText('Loading...').closest('.loading-container');
    expect(loadingContainer).toBeInTheDocument();
    
    const spinner = document.querySelector('.spinner');
    expect(spinner).toBeInTheDocument();
  });
});