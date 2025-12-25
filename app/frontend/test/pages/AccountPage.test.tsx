import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import { AccountPage } from '../../pages/AccountPage';

// Mock the useAuth hook
const mockUseAuth = {
  user: { id: 456 },
  isAuthenticated: true,
  isLoading: false,
  error: null,
  register: vi.fn(),
  login: vi.fn(),
  logout: vi.fn(),
  clearError: vi.fn(),
};

vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => mockUseAuth,
}));

describe('AccountPage', () => {
  it('renders account page with user information', () => {
    render(<AccountPage />);

    expect(screen.getByText('Account Information')).toBeInTheDocument();
    expect(screen.getByText('Manage your account settings and information')).toBeInTheDocument();
  });

  it('displays user ID correctly', () => {
    render(<AccountPage />);

    expect(screen.getByText('User ID')).toBeInTheDocument();
    expect(screen.getByText('#456')).toBeInTheDocument();
  });

  it('shows authentication method information', () => {
    render(<AccountPage />);

    expect(screen.getByText('Authentication Method')).toBeInTheDocument();
    expect(screen.getByText('WebAuthn Passkey')).toBeInTheDocument();
  });

  it('displays security information sections', () => {
    render(<AccountPage />);

    expect(screen.getByText('Security')).toBeInTheDocument();
    expect(screen.getByText('Passkey Authentication')).toBeInTheDocument();
    expect(screen.getByText('Data Protection')).toBeInTheDocument();
  });

  it('shows detailed security descriptions', () => {
    render(<AccountPage />);

    expect(screen.getByText(/Your account is secured with WebAuthn Passkeys/)).toBeInTheDocument();
    expect(screen.getByText(/Your todos are private and only accessible to you/)).toBeInTheDocument();
  });

  it('renders with correct structure and styling classes', () => {
    render(<AccountPage />);

    const accountPage = document.querySelector('.account-page');
    const accountContainer = document.querySelector('.account-container');
    const accountHeader = document.querySelector('.account-header');
    const accountContent = document.querySelector('.account-content');

    expect(accountPage).toBeInTheDocument();
    expect(accountContainer).toBeInTheDocument();
    expect(accountHeader).toBeInTheDocument();
    expect(accountContent).toBeInTheDocument();
  });

  it('displays security icons', () => {
    render(<AccountPage />);

    const securityIcons = document.querySelectorAll('.security-icon');
    expect(securityIcons).toHaveLength(2);
    expect(securityIcons[0]).toHaveTextContent('🔐');
    expect(securityIcons[1]).toHaveTextContent('🛡️');
  });
});