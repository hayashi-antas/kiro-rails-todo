import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { PasskeyAuthentication } from '../../components/PasskeyAuthentication'
import { AuthProvider } from '../../hooks/useAuth'

// Type declaration for the global helper
declare global {
  function createMockResponse(options: {
    ok: boolean
    status?: number
    statusText?: string
    headers?: Record<string, string>
    json?: () => Promise<any>
    text?: () => Promise<string>
  }): Response
}

// Mock fetch responses
const mockFetch = vi.fn()
global.fetch = mockFetch

// Mock WebAuthn API
const mockGet = vi.fn()

// Test wrapper with AuthProvider
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
)

describe('PasskeyAuthentication', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockClear()
    mockGet.mockClear()
    
    // Reset WebAuthn support to enabled by default
    Object.defineProperty(global.navigator, 'credentials', {
      value: { create: vi.fn(), get: mockGet },
      writable: true,
    })
  })

  it('renders authentication form correctly', () => {
    render(
      <TestWrapper>
        <PasskeyAuthentication />
      </TestWrapper>
    )

    expect(screen.getByRole('heading', { name: 'Sign In with Passkey' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Sign In with Passkey/ })).toBeInTheDocument()
    expect(screen.getByText('Having trouble signing in?')).toBeInTheDocument()
  })

  it('shows error when WebAuthn is not supported', async () => {
    // Mock unsupported WebAuthn
    Object.defineProperty(global.navigator, 'credentials', {
      value: undefined,
      writable: true,
    })

    render(
      <TestWrapper>
        <PasskeyAuthentication />
      </TestWrapper>
    )

    const loginButton = screen.getByRole('button', { name: /Sign In with Passkey/ })
    fireEvent.click(loginButton)

    await waitFor(() => {
      expect(screen.getByText(/WebAuthn is not supported/)).toBeInTheDocument()
    })
  })

  it('handles successful authentication flow', async () => {
    // Mock successful API responses
    mockFetch
      .mockResolvedValueOnce(createMockResponse({
        ok: true,
        headers: { 'content-type': 'application/json' },
        json: () => Promise.resolve({
          challenge: 'dGVzdC1jaGFsbGVuZ2U',
          allowCredentials: [{ id: 'dGVzdC1jcmVkZW50aWFs', type: 'public-key' }],
        })
      }))
      .mockResolvedValueOnce(createMockResponse({
        ok: true,
        headers: { 'content-type': 'application/json' },
        json: () => Promise.resolve({ success: true, user_id: 1 })
      }))

    // Mock WebAuthn credential get
    const mockCredential = {
      id: 'test-credential-id',
      rawId: new ArrayBuffer(16),
      response: {
        authenticatorData: new ArrayBuffer(32),
        clientDataJSON: new ArrayBuffer(64),
        signature: new ArrayBuffer(64),
        userHandle: null,
      },
      type: 'public-key',
    }
    mockGet.mockResolvedValue(mockCredential)

    const onSuccess = vi.fn()
    render(
      <TestWrapper>
        <PasskeyAuthentication onSuccess={onSuccess} />
      </TestWrapper>
    )

    const loginButton = screen.getByRole('button', { name: /Sign In with Passkey/ })
    fireEvent.click(loginButton)

    // Wait for authentication to complete
    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled()
    }, { timeout: 3000 })

    // Verify API calls were made
    expect(mockFetch).toHaveBeenCalledTimes(2)
    expect(mockGet).toHaveBeenCalled()
  })

  it('handles authentication API error', async () => {
    // Mock API error
    mockFetch.mockResolvedValueOnce(
      createMockResponse({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        headers: { 'content-type': 'application/json' },
        json: () => Promise.resolve({ error: 'Authentication failed' })
      })
    )

    render(
      <TestWrapper>
        <PasskeyAuthentication />
      </TestWrapper>
    )

    const loginButton = screen.getByRole('button', { name: /Sign In with Passkey/ })
    fireEvent.click(loginButton)

    await waitFor(() => {
      expect(screen.getByText(/HTTP 400: Bad Request/)).toBeInTheDocument()
    })
  })

  it('handles WebAuthn credential get failure', async () => {
    // Mock successful options request
    mockFetch.mockResolvedValueOnce(createMockResponse({
      ok: true,
      headers: { 'content-type': 'application/json' },
      json: () => Promise.resolve({
        challenge: 'dGVzdC1jaGFsbGVuZ2U',
        allowCredentials: [{ id: 'dGVzdC1jcmVkZW50aWFs', type: 'public-key' }],
      })
    }))

    // Mock WebAuthn failure
    mockGet.mockResolvedValue(null)

    render(
      <TestWrapper>
        <PasskeyAuthentication />
      </TestWrapper>
    )

    const loginButton = screen.getByRole('button', { name: /Sign In with Passkey/ })
    fireEvent.click(loginButton)

    await waitFor(() => {
      expect(screen.getByText('Authentication cancelled or failed')).toBeInTheDocument()
    })
  })

  it('allows dismissing error messages', async () => {
    // Mock API error - first call for options, second call fails
    mockFetch
      .mockResolvedValueOnce(
        createMockResponse({
          ok: true,
          headers: { 'content-type': 'application/json' },
          json: () => Promise.resolve({
            challenge: 'dGVzdC1jaGFsbGVuZ2U',
            allowCredentials: []
          })
        })
      )
      .mockResolvedValueOnce(
        createMockResponse({
          ok: false,
          status: 400,
          statusText: 'Bad Request',
          headers: { 'content-type': 'application/json' },
          json: () => Promise.resolve({ error: 'Test error' })
        })
      )

    // Mock WebAuthn get to succeed
    mockGet.mockResolvedValueOnce({
      id: 'test-credential-id',
      rawId: new ArrayBuffer(16),
      response: {
        authenticatorData: new ArrayBuffer(32),
        clientDataJSON: new ArrayBuffer(64),
        signature: new ArrayBuffer(64),
        userHandle: null,
      },
      type: 'public-key',
    })

    render(
      <TestWrapper>
        <PasskeyAuthentication />
      </TestWrapper>
    )

    const loginButton = screen.getByRole('button', { name: /Sign In with Passkey/ })
    fireEvent.click(loginButton)

    // Wait for error to appear - it should show the HTTP error message
    await waitFor(() => {
      expect(screen.getByText(/HTTP 400: Bad Request/)).toBeInTheDocument()
    })

    // Click dismiss button
    const dismissButton = screen.getByLabelText('Dismiss error')
    fireEvent.click(dismissButton)

    await waitFor(() => {
      expect(screen.queryByText(/HTTP 400: Bad Request/)).not.toBeInTheDocument()
    })
  })

  it('expands help section when clicked', () => {
    render(
      <TestWrapper>
        <PasskeyAuthentication />
      </TestWrapper>
    )

    const helpSummary = screen.getByText('Having trouble signing in?')
    fireEvent.click(helpSummary)

    expect(screen.getByText(/Make sure you:/)).toBeInTheDocument()
    expect(screen.getByText(/Have previously created a Passkey/)).toBeInTheDocument()
  })
})