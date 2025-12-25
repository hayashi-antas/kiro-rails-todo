/**
 * Custom error class for network-related errors
 */
export class NetworkError extends Error {
  public readonly code: string
  public readonly isRetryable: boolean

  constructor(message: string, code: string, isRetryable: boolean = true) {
    super(message)
    this.name = 'NetworkError'
    this.code = code
    this.isRetryable = isRetryable
  }
}

/**
 * Check if an error is a network error that can be retried
 */
export function isNetworkError(error: any): boolean {
  if (error instanceof NetworkError) {
    return error.isRetryable
  }
  
  // Check for common fetch errors
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return true
  }
  
  return false
}

/**
 * Retry configuration options
 */
export interface RetryOptions {
  maxRetries?: number
  baseDelay?: number
  maxDelay?: number
  backoffFactor?: number
}

/**
 * Retry a function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 10000,
    backoffFactor = 2
  } = options

  let lastError: Error

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error

      // Don't retry if it's the last attempt
      if (attempt === maxRetries) {
        break
      }

      // Don't retry if it's not a retryable error
      if (!isNetworkError(error)) {
        break
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(baseDelay * Math.pow(backoffFactor, attempt), maxDelay)
      
      // Add some jitter to prevent thundering herd
      const jitter = Math.random() * 0.1 * delay
      const finalDelay = delay + jitter

      await new Promise(resolve => setTimeout(resolve, finalDelay))
    }
  }

  throw lastError!
}

/**
 * Enhanced fetch with automatic retry for network errors
 */
export async function fetchWithRetry(
  input: RequestInfo | URL,
  init?: RequestInit,
  retryOptions?: RetryOptions
): Promise<Response> {
  return retryWithBackoff(async () => {
    try {
      const response = await fetch(input, init)
      
      // Convert HTTP errors to NetworkError for retry logic
      if (!response.ok) {
        const errorCode = response.status >= 500 ? 'SERVER_ERROR' : 
                         response.status === 401 ? 'AUTH_ERROR' :
                         response.status === 403 ? 'FORBIDDEN' :
                         response.status === 404 ? 'NOT_FOUND' :
                         'HTTP_ERROR'
        
        const isRetryable = response.status >= 500 || response.status === 408 || response.status === 429
        
        throw new NetworkError(
          `HTTP ${response.status}: ${response.statusText}`,
          errorCode,
          isRetryable
        )
      }
      
      return response
    } catch (error) {
      // Convert fetch errors to NetworkError
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new NetworkError('Network connection failed', 'NETWORK_ERROR', true)
      }
      
      throw error
    }
  }, retryOptions)
}

/**
 * Get user-friendly error message for different error types
 */
export function getUserFriendlyErrorMessage(error: any): string {
  if (error instanceof NetworkError) {
    switch (error.code) {
      case 'NETWORK_ERROR':
        return 'Unable to connect to the server. Please check your internet connection and try again.'
      case 'TIMEOUT':
        return 'The connection timed out. Please try again.'
      case 'SERVER_ERROR':
        return 'The server is experiencing issues. Please try again in a few moments.'
      case 'AUTH_ERROR':
        return 'Authentication required. Please sign in again.'
      case 'FORBIDDEN':
        return 'You do not have permission to perform this action.'
      case 'NOT_FOUND':
        return 'The requested resource was not found.'
      default:
        return error.message || 'An unexpected network error occurred.'
    }
  }
  
  if (error instanceof Error) {
    return error.message
  }
  
  if (typeof error === 'string') {
    return error
  }
  
  return 'An unexpected error occurred.'
}