import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { AuthProvider, useAuth } from '../../hooks/useAuth'

// Mock fetch responses
const mockFetch = vi.fn()
global.fetch = mockFetch

// Mock WebAuthn API
const mockCreate = vi.fn()
const mockGet = vi.fn()

// Test wrapper
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
)

describe('useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockClear()
    mockCreate.mockClear()
    mockGet.mockClear()
    
    // Reset WebAuthn support to enabled by default
    Object.defineProperty(global.navigator, 'credentials', {
      value: { create: mockCreate, get: mockGet },
      writable: true,
    })
  })

  it('provides initial auth state', () => {
    const { result } = renderHook(() => useAuth(), { wrapper })

    expect(result.current.user).toBeNull()
    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('handles successful registration', async () => {
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

    const { result } = renderHook(() => useAuth(), { wrapper })

    await act(async () => {
      await result.current.register()
    })

    expect(result.current.isAuthenticated).toBe(true)
    expect(result.current.user).toEqual({ id: 1 })
    expect(result.current.error).toBeNull()
  })

  it('handles successful authentication', async () => {
    // Mock successful API responses
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          challenge: 'dGVzdC1jaGFsbGVuZ2U',
          allowCredentials: [{ id: 'dGVzdC1jcmVkZW50aWFs', type: 'public-key' }],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, user_id: 1 }),
      })

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

    const { result } = renderHook(() => useAuth(), { wrapper })

    await act(async () => {
      await result.current.login()
    })

    expect(result.current.isAuthenticated).toBe(true)
    expect(result.current.user).toEqual({ id: 1 })
    expect(result.current.error).toBeNull()
  })

  it('handles logout', async () => {
    // First authenticate
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          challenge: 'dGVzdC1jaGFsbGVuZ2U',
          allowCredentials: [{ id: 'dGVzdC1jcmVkZW50aWFs', type: 'public-key' }],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, user_id: 1 }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      })

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

    const { result } = renderHook(() => useAuth(), { wrapper })

    // Login first
    await act(async () => {
      await result.current.login()
    })

    expect(result.current.isAuthenticated).toBe(true)

    // Then logout
    await act(async () => {
      await result.current.logout()
    })

    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.user).toBeNull()
  })

  it('handles WebAuthn not supported error', async () => {
    // Mock unsupported WebAuthn
    Object.defineProperty(global.navigator, 'credentials', {
      value: undefined,
      writable: true,
    })

    const { result } = renderHook(() => useAuth(), { wrapper })

    await act(async () => {
      await result.current.register()
    })

    expect(result.current.error).toContain('WebAuthn is not supported')
    expect(result.current.isAuthenticated).toBe(false)
  })

  it('handles API errors', async () => {
    // Mock API error
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: 'Server error' }),
    })

    const { result } = renderHook(() => useAuth(), { wrapper })

    await act(async () => {
      await result.current.register()
    })

    expect(result.current.error).toBe('Server error')
    expect(result.current.isAuthenticated).toBe(false)
  })

  it('clears errors', async () => {
    // Mock API error
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: 'Test error' }),
    })

    const { result } = renderHook(() => useAuth(), { wrapper })

    await act(async () => {
      await result.current.register()
    })

    expect(result.current.error).toBe('Test error')

    act(() => {
      result.current.clearError()
    })

    expect(result.current.error).toBeNull()
  })

  it('sets loading state during operations', async () => {
    // Mock slow API response
    let resolvePromise: (value: any) => void
    const slowPromise = new Promise(resolve => {
      resolvePromise = resolve
    })
    mockFetch.mockReturnValue(slowPromise)

    const { result } = renderHook(() => useAuth(), { wrapper })

    // Start registration
    act(() => {
      result.current.register()
    })

    // Should be loading
    expect(result.current.isLoading).toBe(true)

    // Resolve the promise
    act(() => {
      resolvePromise!({
        ok: false,
        json: () => Promise.resolve({ error: 'Test' }),
      })
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })
  })
})