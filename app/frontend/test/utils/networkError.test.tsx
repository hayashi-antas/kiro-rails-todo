import { describe, it, expect, vi, beforeEach } from 'vitest'
import { retryWithBackoff, NetworkError, isNetworkError } from '../../utils/networkError'

// Mock fetch
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('networkError utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockClear()
  })

  describe('NetworkError', () => {
    it('creates a network error with correct properties', () => {
      const error = new NetworkError('Connection failed', 'NETWORK_ERROR')
      
      expect(error.message).toBe('Connection failed')
      expect(error.code).toBe('NETWORK_ERROR')
      expect(error.name).toBe('NetworkError')
      expect(error.isRetryable).toBe(true)
    })

    it('allows setting non-retryable errors', () => {
      const error = new NetworkError('Auth failed', 'AUTH_ERROR', false)
      
      expect(error.isRetryable).toBe(false)
    })
  })

  describe('isNetworkError', () => {
    it('identifies NetworkError instances', () => {
      const networkError = new NetworkError('Test', 'TEST')
      const regularError = new Error('Test')
      
      expect(isNetworkError(networkError)).toBe(true)
      expect(isNetworkError(regularError)).toBe(false)
    })

    it('identifies fetch errors as network errors', () => {
      const fetchError = new TypeError('Failed to fetch')
      
      expect(isNetworkError(fetchError)).toBe(true)
    })
  })

  describe('retryWithBackoff', () => {
    it('succeeds on first try', async () => {
      const mockFn = vi.fn().mockResolvedValue('success')
      
      const result = await retryWithBackoff(mockFn)
      
      expect(result).toBe('success')
      expect(mockFn).toHaveBeenCalledTimes(1)
    })

    it('retries on network errors', async () => {
      const mockFn = vi.fn()
        .mockRejectedValueOnce(new NetworkError('Network failed', 'NETWORK_ERROR'))
        .mockResolvedValue('success')
      
      const result = await retryWithBackoff(mockFn, { maxRetries: 2, baseDelay: 10 })
      
      expect(result).toBe('success')
      expect(mockFn).toHaveBeenCalledTimes(2)
    })

    it('fails after max retries', async () => {
      const networkError = new NetworkError('Persistent failure', 'NETWORK_ERROR')
      const mockFn = vi.fn().mockRejectedValue(networkError)
      
      await expect(retryWithBackoff(mockFn, { maxRetries: 2, baseDelay: 10 }))
        .rejects.toThrow('Persistent failure')
      
      expect(mockFn).toHaveBeenCalledTimes(3) // Initial + 2 retries
    })

    it('does not retry non-retryable errors', async () => {
      const authError = new NetworkError('Auth failed', 'AUTH_ERROR', false)
      const mockFn = vi.fn().mockRejectedValue(authError)
      
      await expect(retryWithBackoff(mockFn, { maxRetries: 2, baseDelay: 10 }))
        .rejects.toThrow('Auth failed')
      
      expect(mockFn).toHaveBeenCalledTimes(1)
    })

    it('does not retry regular errors', async () => {
      const regularError = new Error('Regular error')
      const mockFn = vi.fn().mockRejectedValue(regularError)
      
      await expect(retryWithBackoff(mockFn, { maxRetries: 2, baseDelay: 10 }))
        .rejects.toThrow('Regular error')
      
      expect(mockFn).toHaveBeenCalledTimes(1)
    })

    it('applies exponential backoff', async () => {
      const mockFn = vi.fn()
        .mockRejectedValueOnce(new NetworkError('Fail 1', 'NETWORK_ERROR'))
        .mockRejectedValueOnce(new NetworkError('Fail 2', 'NETWORK_ERROR'))
        .mockResolvedValue('success')
      
      const startTime = Date.now()
      const result = await retryWithBackoff(mockFn, { maxRetries: 3, baseDelay: 50 })
      const endTime = Date.now()
      
      expect(result).toBe('success')
      expect(mockFn).toHaveBeenCalledTimes(3)
      // Should have waited at least 50ms + 100ms = 150ms
      expect(endTime - startTime).toBeGreaterThan(100)
    })
  })
})