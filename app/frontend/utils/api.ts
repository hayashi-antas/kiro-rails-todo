import { fetchWithRetry, NetworkError, RetryOptions } from './networkError'

/**
 * Enhanced API client with automatic retry and error handling
 */
export class ApiClient {
  private baseUrl: string
  private defaultRetryOptions: RetryOptions

  constructor(baseUrl: string = '/api', retryOptions: RetryOptions = {}) {
    this.baseUrl = baseUrl
    this.defaultRetryOptions = {
      maxRetries: 3,
      baseDelay: 1000,
      maxDelay: 10000,
      ...retryOptions
    }
  }

  /**
   * Make an API request with automatic retry
   */
  async request<T = any>(
    endpoint: string,
    options: RequestInit = {},
    retryOptions?: RetryOptions
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    const finalOptions: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        ...options.headers,
      },
      credentials: 'same-origin',
      ...options,
    }

    const response = await fetchWithRetry(url, finalOptions, {
      ...this.defaultRetryOptions,
      ...retryOptions
    })

    // Handle different content types
    const contentType = response.headers.get('content-type')
    if (contentType?.includes('application/json')) {
      const data = await response.json()
      
      // Check for API-level errors
      if (!data.success && data.error) {
        throw new NetworkError(data.error, 'API_ERROR', false)
      }
      
      return data
    }

    return response as any
  }

  /**
   * GET request
   */
  async get<T = any>(endpoint: string, retryOptions?: RetryOptions): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' }, retryOptions)
  }

  /**
   * POST request
   */
  async post<T = any>(
    endpoint: string, 
    data?: any, 
    retryOptions?: RetryOptions
  ): Promise<T> {
    return this.request<T>(
      endpoint,
      {
        method: 'POST',
        body: data ? JSON.stringify(data) : undefined,
      },
      retryOptions
    )
  }

  /**
   * PATCH request
   */
  async patch<T = any>(
    endpoint: string, 
    data?: any, 
    retryOptions?: RetryOptions
  ): Promise<T> {
    return this.request<T>(
      endpoint,
      {
        method: 'PATCH',
        body: data ? JSON.stringify(data) : undefined,
      },
      retryOptions
    )
  }

  /**
   * DELETE request
   */
  async delete<T = any>(endpoint: string, retryOptions?: RetryOptions): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' }, retryOptions)
  }
}

// Default API client instance
export const apiClient = new ApiClient()

/**
 * Convenience functions for common API operations
 */
export const api = {
  get: <T = any>(endpoint: string, retryOptions?: RetryOptions) => 
    apiClient.get<T>(endpoint, retryOptions),
    
  post: <T = any>(endpoint: string, data?: any, retryOptions?: RetryOptions) => 
    apiClient.post<T>(endpoint, data, retryOptions),
    
  patch: <T = any>(endpoint: string, data?: any, retryOptions?: RetryOptions) => 
    apiClient.patch<T>(endpoint, data, retryOptions),
    
  delete: <T = any>(endpoint: string, retryOptions?: RetryOptions) => 
    apiClient.delete<T>(endpoint, retryOptions),
}