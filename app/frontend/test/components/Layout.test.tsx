import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { Layout } from '../../components/Layout';
import { AuthProvider } from '../../hooks/useAuth';

// Mock the useAuth hook
const mockLogout = vi.fn();
const mockUseAuth = {
  user: { id: 123 },
  isAuthenticated: true,
  isLoading: false,
  error: null,
  register: vi.fn(),
  login: vi.fn(),
  logout: mockLogout,
  clearError: vi.fn(),
};

vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => mockUseAuth,
  AuthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// Mock fetch for logout API call
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('Layout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });
  });

  const renderLayout = (initialEntries = ['/']) => {
    return render(
      <MemoryRouter initialEntries={initialEntries}>
        <AuthProvider>
          <Layout />
        </AuthProvider>
      </MemoryRouter>
    );
  };

  it('renders the main layout with header and navigation', () => {
    renderLayout();

    expect(screen.getByText('Passkey ToDo Board')).toBeInTheDocument();
    expect(screen.getByText('Todos')).toBeInTheDocument();
    expect(screen.getByText('Account')).toBeInTheDocument();
    expect(screen.getByText('User #123')).toBeInTheDocument();
    expect(screen.getByText('Sign Out')).toBeInTheDocument();
  });

  it('displays user information in header', () => {
    renderLayout();

    const userInfo = screen.getByText('User #123');
    expect(userInfo).toBeInTheDocument();
    expect(userInfo).toHaveClass('user-info');
  });

  it('renders navigation links correctly', () => {
    renderLayout();

    const todosLink = screen.getByText('Todos');
    const accountLink = screen.getByText('Account');

    expect(todosLink).toBeInTheDocument();
    expect(accountLink).toBeInTheDocument();
    expect(todosLink.closest('a')).toHaveAttribute('href', '/');
    expect(accountLink.closest('a')).toHaveAttribute('href', '/account');
  });

  it('handles logout button click', async () => {
    renderLayout();

    const logoutButton = screen.getByText('Sign Out');
    fireEvent.click(logoutButton);

    await waitFor(() => {
      expect(mockLogout).toHaveBeenCalledTimes(1);
    });
  });

  it('renders outlet for child routes', () => {
    const TestChild = () => <div data-testid="test-child">Test Child Component</div>;
    
    render(
      <MemoryRouter initialEntries={['/']}>
        <AuthProvider>
          <Layout />
        </AuthProvider>
      </MemoryRouter>
    );

    // The outlet should be present in the DOM structure
    const main = screen.getByRole('main');
    expect(main).toBeInTheDocument();
    expect(main).toHaveClass('app-main');
  });

  it('applies correct CSS classes to elements', () => {
    renderLayout();

    expect(screen.getByRole('banner')).toHaveClass('app-header');
    expect(screen.getByRole('main')).toHaveClass('app-main');
    expect(screen.getByText('Sign Out')).toHaveClass('logout-button');
  });
});