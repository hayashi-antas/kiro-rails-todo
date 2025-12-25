import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { PasskeyRegistration } from '../../components/PasskeyRegistration'
import { AuthProvider } from '../../hooks/useAuth'

// Mock fetch responses
const mockFetch = vi.fn()
global.fetch = mockFetch

// Mock WebAuthn API
const mockCreate = vi.fn()

// Test wrapper with AuthProvider
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
)

describe('PasskeyRegistration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockClear()
    mockCreate.mockClear()
    
    // Reset WebAuthn support to enabled by default
    Object.defineProperty(global.navigator, 'credentials', {
      value: { create: mockCreate },
      writable: true,
    })
  })

  it('renders registration form correctly', () => {
    render(
      <TestWrapper>
        <PasskeyRegistration />
      </TestWrapper>
    )

    expect(screen.getByText('Create Your Passkey')).toBeInTheDocument()
    expect(screen.getByText('Create Passkey')).toBeInTheDocument()
    expect(screen.getByText('What is a Passkey?')).toBeInTheDocument()
  })

  it('shows error when WebAuthn is not supported', async () => {
    // Mock unsupported WebAuthn
    Object.defineProperty(global.navigator, 'credentials', {
      value: undefined,
      writable: true,
    })

    render(
      <TestWrapper>
        <PasskeyRegistration />
      </TestWrapper>
    )

    const registerButton = screen.getByText('Create Passkey')
    fireEvent.click(registerButton)

    await waitFor(() => {
      expect(screen.getByText(/WebAuthn is not supported/)).toBeInTheDocument()
    })
  })

  it('handles successful registration flow', async () => {
    // Mock successful API responses
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          challenge: 'dGVzdC1jaGFsbGVuZ2U',
          user: { id: 'dGVzdC11c2VyLWlk', name: 'user_test', displayName: 'Passkey User' },
          excludeCredentials: [],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, user_id: 1 }),
      })

    // Mock WebAuthn credential creation
    const mockCredential = {
      id: 'test-credential-id',
      rawId: new ArrayBuffer(16),
      response: {
        attestationObject: new ArrayBuffer(32),
        clientDataJSON: new ArrayBuffer(64),
      },
      type: 'public-key',
    }
    mockCreate.mockResolvedValue(mockCredential)

    const onSuccess = vi.fn()
    render(
      <TestWrapper>
        <PasskeyRegistration onSuccess={onSuccess} />
      </TestWrapper>
    )

    const registerButton = screen.getByText('Create Passkey')
    fireEvent.click(registerButton)

    // Wait for registration to complete
    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled()
    }, { timeout: 3000 })

    // Verify API calls were made
    expect(mockFetch).toHaveBeenCalledTimes(2)
    expect(mockCreate).toHaveBeenCalled()
  })

  it('handles registration API error', async () => {
    // Mock API error
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: 'Registration failed' }),
    })

    render(
      <TestWrapper>
        <PasskeyRegistration />
      </TestWrapper>
    )

    const registerButton = screen.getByText('Create Passkey')
    fireEvent.click(registerButton)

    await waitFor(() => {
      expect(screen.getByText('Registration failed')).toBeInTheDocument()
    })
  })

  it('handles WebAuthn credential creation failure', async () => {
    // Mock successful options request
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        challenge: 'dGVzdC1jaGFsbGVuZ2U',
        user: { id: 'dGVzdC11c2VyLWlk', name: 'user_test', displayName: 'Passkey User' },
        excludeCredentials: [],
      }),
    })

    // Mock WebAuthn failure
    mockCreate.mockResolvedValue(null)

    render(
      <TestWrapper>
        <PasskeyRegistration />
      </TestWrapper>
    )

    const registerButton = screen.getByText('Create Passkey')
    fireEvent.click(registerButton)

    await waitFor(() => {
      expect(screen.getByText('Failed to create credential')).toBeInTheDocument()
    })
  })

  it('allows dismissing error messages', async () => {
    // Mock API error
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: 'Test error' }),
    })

    render(
      <TestWrapper>
        <PasskeyRegistration />
      </TestWrapper>
    )

    const registerButton = screen.getByText('Create Passkey')
    fireEvent.click(registerButton)

    await waitFor(() => {
      expect(screen.getByText('Test error')).toBeInTheDocument()
    })

    // Click dismiss button
    const dismissButton = screen.getByLabelText('Dismiss error')
    fireEvent.click(dismissButton)

    await waitFor(() => {
      expect(screen.queryByText('Test error')).not.toBeInTheDocument()
    })
  })

  it('expands help section when clicked', () => {
    render(
      <TestWrapper>
        <PasskeyRegistration />
      </TestWrapper>
    )

    const helpSummary = screen.getByText('What is a Passkey?')
    fireEvent.click(helpSummary)

    expect(screen.getByText(/Passkeys are a secure, passwordless way/)).toBeInTheDocument()
  })
})